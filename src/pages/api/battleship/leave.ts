import type { APIRoute } from 'astro';
import { authedHandler, jsonResponse, now } from 'src/lib/battleship/server';

export const prerender = false;

/**
 * Releases the calling player's seat so a new user can join.
 * Game cannot continue solo, so we also wipe boats/shots and return
 * to phase='waiting'. The other (still-seated) player keeps their seat
 * and will see the "share password" prompt until a new opponent joins.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const auth = await authedHandler(request, locals);
  if (auth instanceof Response) return auth;
  const { db, player } = auth;

  const seatCol = player === 1 ? 'player1_token' : 'player2_token';

  await db.batch([
    db.prepare('DELETE FROM boats'),
    db.prepare('DELETE FROM shots'),
    db
      .prepare(
        `UPDATE game SET ${seatCol} = NULL, phase = 'waiting', turn = 1,
         winner = NULL, reset_request = NULL, updated_at = ? WHERE id = 1`,
      )
      .bind(now()),
  ]);

  return jsonResponse({ status: 'left' });
};
