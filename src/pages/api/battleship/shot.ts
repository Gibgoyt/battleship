import type { APIRoute } from 'astro';
import {
  authedHandler,
  countHits,
  getGame,
  isBoatCell,
  jsonResponse,
  now,
  TOTAL_BOAT_CELLS,
  BOARD_SIZE,
} from 'src/lib/battleship/server';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = await authedHandler(request, locals);
  if (auth instanceof Response) return auth;
  const { db, player } = auth;

  let body: { x?: number; y?: number };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }
  const { x, y } = body;
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 0 ||
    y < 0 ||
    x >= BOARD_SIZE ||
    y >= BOARD_SIZE
  ) {
    return jsonResponse({ error: 'x,y must be integers in [0,99]' }, 400);
  }

  const game = await getGame(db);
  if (game.phase !== 'playing') {
    return jsonResponse({ error: `Cannot shoot in phase '${game.phase}'` }, 409);
  }
  if (game.turn !== player) {
    return jsonResponse({ error: 'Not your turn' }, 409);
  }

  const dup = await db
    .prepare('SELECT 1 AS x FROM shots WHERE shooter = ? AND x = ? AND y = ? LIMIT 1')
    .bind(player, x, y)
    .first();
  if (dup) return jsonResponse({ error: 'Already shot at that cell' }, 409);

  const opponent = player === 1 ? 2 : 1;
  const hit = await isBoatCell(db, opponent, x, y);
  const hitInt = hit ? 1 : 0;

  await db
    .prepare('INSERT INTO shots (shooter, x, y, hit, shot_at) VALUES (?, ?, ?, ?, ?)')
    .bind(player, x, y, hitInt, now())
    .run();

  let nextTurn = game.turn;
  let phase = game.phase;
  let winner = game.winner;

  if (hit) {
    const total = await countHits(db, player);
    if (total >= TOTAL_BOAT_CELLS) {
      phase = 'finished';
      winner = player;
    }
  } else {
    nextTurn = opponent;
  }

  if (phase !== game.phase || nextTurn !== game.turn || winner !== game.winner) {
    await db
      .prepare('UPDATE game SET phase = ?, turn = ?, winner = ?, updated_at = ? WHERE id = 1')
      .bind(phase, nextTurn, winner, now())
      .run();
  }

  return jsonResponse({ hit, phase, winner });
};
