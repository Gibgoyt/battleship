import type { APIRoute } from 'astro';
import { authedHandler, getGame, jsonResponse, now } from 'src/lib/battleship/server';

export const prerender = false;

/**
 * Reset semantics:
 *  - First call by a player sets reset_request = me (other player will see a "confirm" prompt).
 *  - If reset_request is already set to me and I call again -> cancel (clear request).
 *  - If reset_request is set to the OTHER player and I call -> execute reset:
 *      wipe boats + shots, phase='placing', turn=1, winner=NULL, reset_request=NULL.
 *      Seat tokens are preserved (P1 stays P1, P2 stays P2).
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const auth = await authedHandler(request, locals);
  if (auth instanceof Response) return auth;
  const { db, player } = auth;

  const game = await getGame(db);
  const other = player === 1 ? 2 : 1;

  if (game.reset_request === null) {
    await db
      .prepare('UPDATE game SET reset_request = ?, updated_at = ? WHERE id = 1')
      .bind(player, now())
      .run();
    return jsonResponse({ status: 'requested' });
  }

  if (game.reset_request === player) {
    await db
      .prepare('UPDATE game SET reset_request = NULL, updated_at = ? WHERE id = 1')
      .bind(now())
      .run();
    return jsonResponse({ status: 'cancelled' });
  }

  if (game.reset_request === other) {
    await db.batch([
      db.prepare('DELETE FROM boats'),
      db.prepare('DELETE FROM shots'),
      db
        .prepare(
          "UPDATE game SET phase = 'placing', turn = 1, winner = NULL, reset_request = NULL, updated_at = ? WHERE id = 1",
        )
        .bind(now()),
    ]);
    return jsonResponse({ status: 'reset' });
  }

  return jsonResponse({ error: 'Unexpected reset state' }, 500);
};
