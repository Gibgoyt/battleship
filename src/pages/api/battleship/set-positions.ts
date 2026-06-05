import type { APIRoute } from 'astro';
import {
  authedHandler,
  getGame,
  jsonResponse,
  now,
} from 'src/lib/battleship/server';
import {
  type BoatPlacement,
  validateFleetComposition,
  validatePlacement,
} from 'src/lib/battleship/types';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = await authedHandler(request, locals);
  if (auth instanceof Response) return auth;
  const { db, player } = auth;

  let body: { boats?: BoatPlacement[] };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }
  const boats = body.boats;
  if (!Array.isArray(boats)) return jsonResponse({ error: 'boats must be an array' }, 400);

  const fleetErr = validateFleetComposition(boats);
  if (fleetErr) return jsonResponse({ error: fleetErr }, 400);
  const placeErr = validatePlacement(boats);
  if (placeErr) return jsonResponse({ error: placeErr }, 400);

  const game = await getGame(db);
  if (game.phase !== 'placing') {
    return jsonResponse({ error: `Cannot place boats in phase '${game.phase}'` }, 409);
  }
  if (game.turn !== player) {
    return jsonResponse({ error: 'Not your turn to place' }, 409);
  }

  const existingRes = await db
    .prepare('SELECT COUNT(*) AS n FROM boats WHERE player = ?')
    .bind(player)
    .first<{ n: number }>();
  if ((existingRes?.n ?? 0) > 0) {
    return jsonResponse({ error: 'You have already placed your fleet' }, 409);
  }

  const insert = db.prepare(
    'INSERT INTO boats (player, boat_type, x, y, width, height) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const stmts = boats.map((b) =>
    insert.bind(player, b.type, b.x, b.y, b.width, b.height),
  );

  const otherPlayer = player === 1 ? 2 : 1;
  const otherCountRes = await db
    .prepare('SELECT COUNT(*) AS n FROM boats WHERE player = ?')
    .bind(otherPlayer)
    .first<{ n: number }>();
  const otherPlaced = (otherCountRes?.n ?? 0) > 0;

  let updateStmt;
  if (otherPlaced) {
    updateStmt = db
      .prepare(
        "UPDATE game SET phase = 'playing', turn = 1, updated_at = ? WHERE id = 1",
      )
      .bind(now());
  } else {
    updateStmt = db
      .prepare('UPDATE game SET turn = ?, updated_at = ? WHERE id = 1')
      .bind(otherPlayer, now());
  }

  await db.batch([...stmts, updateStmt]);

  return jsonResponse({ ok: true });
};
