import type { APIRoute } from 'astro';
import {
  checkPassword,
  getDb,
  getGame,
  jsonResponse,
  newSeatToken,
  now,
  seatToPlayer,
} from 'src/lib/battleship/server';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals);
  if (!db) return jsonResponse({ error: 'Database not configured' }, 500);
  if (!(await checkPassword(request))) {
    return jsonResponse({ error: 'Invalid password' }, 401);
  }

  const existingSeat = request.headers.get('X-BS-Seat');
  const game = await getGame(db);

  const existingPlayer = seatToPlayer(game, existingSeat);
  if (existingPlayer) {
    return jsonResponse({ player: existingPlayer, seatToken: existingSeat });
  }

  if (!game.player1_token) {
    const token = newSeatToken();
    await db
      .prepare('UPDATE game SET player1_token = ?, updated_at = ? WHERE id = 1')
      .bind(token, now())
      .run();
    return jsonResponse({ player: 1, seatToken: token });
  }

  if (!game.player2_token) {
    const token = newSeatToken();
    await db
      .prepare(
        "UPDATE game SET player2_token = ?, phase = 'placing', turn = 1, updated_at = ? WHERE id = 1",
      )
      .bind(token, now())
      .run();
    return jsonResponse({ player: 2, seatToken: token });
  }

  return jsonResponse({ error: 'Game full — both seats occupied' }, 403);
};
