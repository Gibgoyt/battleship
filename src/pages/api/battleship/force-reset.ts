import type { APIRoute } from 'astro';
import { checkPassword, getDb, jsonResponse, now } from 'src/lib/battleship/server';

export const prerender = false;

/**
 * Nuclear reset: anyone holding the password can wipe the game and kick
 * both seated players. Used by /battleship/reset to recover from
 * abandoned seats (closed tab, forgotten library computer, etc).
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals);
  if (!db) return jsonResponse({ error: 'Database not configured' }, 500);
  if (!(await checkPassword(request))) {
    return jsonResponse({ error: 'Invalid password' }, 401);
  }

  await db.batch([
    db.prepare('DELETE FROM boats'),
    db.prepare('DELETE FROM shots'),
    db
      .prepare(
        `UPDATE game SET player1_token = NULL, player2_token = NULL,
         phase = 'waiting', turn = 1, winner = NULL, reset_request = NULL,
         updated_at = ? WHERE id = 1`,
      )
      .bind(now()),
  ]);

  return jsonResponse({ status: 'reset' });
};
