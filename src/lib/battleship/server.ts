import type { D1Database } from '@cloudflare/workers-types';
import {
  BOARD_SIZE,
  TOTAL_BOAT_CELLS,
  type BoatPlacement,
  type ClientGameState,
  type Phase,
  type PlayerNum,
  type Shot,
} from './types';
import { constantTimeEqual, getPasswordHash } from './secret';

export interface AuthedRequest {
  db: D1Database;
  player: PlayerNum;
  seatToken: string;
}

export interface GameRow {
  id: number;
  player1_token: string | null;
  player2_token: string | null;
  phase: Phase;
  turn: PlayerNum;
  winner: PlayerNum | null;
  reset_request: PlayerNum | null;
  created_at: number;
  updated_at: number;
}

export interface BoatRow {
  id: number;
  player: PlayerNum;
  boat_type: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ShotRow {
  id: number;
  shooter: PlayerNum;
  x: number;
  y: number;
  hit: 0 | 1;
  shot_at: number;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export function getDb(locals: App.Locals): D1Database | null {
  return locals?.runtime?.env?.BATTLESHIP_DB ?? null;
}

/** Validates X-BS-Pass header against the hardcoded password hash. */
export async function checkPassword(request: Request): Promise<boolean> {
  const supplied = request.headers.get('X-BS-Pass');
  if (!supplied) return false;
  const expected = await getPasswordHash();
  return constantTimeEqual(supplied.toLowerCase(), expected);
}

/** Reads the single game row. */
export async function getGame(db: D1Database): Promise<GameRow> {
  const row = await db.prepare('SELECT * FROM game WHERE id = 1').first<GameRow>();
  if (!row) throw new Error('Game row missing — DB not initialized');
  return row;
}

/** Identifies which player the supplied seat token belongs to, or null. */
export function seatToPlayer(game: GameRow, seatToken: string | null): PlayerNum | null {
  if (!seatToken) return null;
  if (game.player1_token && constantTimeEqual(game.player1_token, seatToken)) return 1;
  if (game.player2_token && constantTimeEqual(game.player2_token, seatToken)) return 2;
  return null;
}

/** Authenticates a request: password + seat token; returns player number or a response. */
export async function authedHandler(
  request: Request,
  locals: App.Locals,
): Promise<AuthedRequest | Response> {
  const db = getDb(locals);
  if (!db) return jsonResponse({ error: 'Database not configured' }, 500);
  if (!(await checkPassword(request))) {
    return jsonResponse({ error: 'Invalid password' }, 401);
  }
  const seatToken = request.headers.get('X-BS-Seat');
  if (!seatToken) return jsonResponse({ error: 'Missing seat token' }, 401);
  const game = await getGame(db);
  const player = seatToPlayer(game, seatToken);
  if (!player) return jsonResponse({ error: 'Seat token does not match either player' }, 403);
  return { db, player, seatToken };
}

export function now(): number {
  return Math.floor(Date.now() / 1000);
}

/** Generates a UUID using crypto.randomUUID (available on Workers). */
export function newSeatToken(): string {
  return crypto.randomUUID();
}

/** Builds the per-player game state payload returned by GET /state. */
export async function buildClientState(
  db: D1Database,
  game: GameRow,
  player: PlayerNum,
): Promise<ClientGameState> {
  const opponent: PlayerNum = player === 1 ? 2 : 1;

  const myBoatsRes = await db
    .prepare('SELECT * FROM boats WHERE player = ?')
    .bind(player)
    .all<BoatRow>();
  const myBoats: BoatPlacement[] = (myBoatsRes.results || []).map((r) => ({
    type: r.boat_type as BoatPlacement['type'],
    x: r.x,
    y: r.y,
    width: r.width,
    height: r.height,
  }));

  const oppCountRes = await db
    .prepare('SELECT COUNT(*) AS n FROM boats WHERE player = ?')
    .bind(opponent)
    .first<{ n: number }>();
  const opponentPlaced = (oppCountRes?.n ?? 0) > 0;

  const myShotsRes = await db
    .prepare('SELECT x, y, hit FROM shots WHERE shooter = ? ORDER BY id')
    .bind(player)
    .all<{ x: number; y: number; hit: 0 | 1 }>();
  const oppShotsRes = await db
    .prepare('SELECT x, y, hit FROM shots WHERE shooter = ? ORDER BY id')
    .bind(opponent)
    .all<{ x: number; y: number; hit: 0 | 1 }>();

  const myShotsTaken: Shot[] = myShotsRes.results || [];
  const shotsAgainstMe: Shot[] = oppShotsRes.results || [];

  let opponentBoats: BoatPlacement[] | null = null;
  if (game.phase === 'finished') {
    const oppBoatsRes = await db
      .prepare('SELECT * FROM boats WHERE player = ?')
      .bind(opponent)
      .all<BoatRow>();
    opponentBoats = (oppBoatsRes.results || []).map((r) => ({
      type: r.boat_type as BoatPlacement['type'],
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
    }));
  }

  return {
    you: player,
    phase: game.phase,
    turn: game.turn,
    winner: game.winner,
    resetRequestedBy: game.reset_request,
    opponentJoined: opponent === 1 ? !!game.player1_token : !!game.player2_token,
    opponentPlaced,
    myBoats,
    myShotsTaken,
    shotsAgainstMe,
    opponentBoats,
  };
}

/** Checks whether (x,y) is occupied by any boat of `player`. */
export async function isBoatCell(
  db: D1Database,
  player: PlayerNum,
  x: number,
  y: number,
): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT 1 AS hit FROM boats
       WHERE player = ?
         AND ? >= x AND ? < x + width
         AND ? >= y AND ? < y + height
       LIMIT 1`,
    )
    .bind(player, x, y, x, y)
    .first<{ hit: number }>();
  return !!row;
}

/** Counts distinct hits a shooter has landed (used to detect win at 66). */
export async function countHits(db: D1Database, shooter: PlayerNum): Promise<number> {
  const row = await db
    .prepare('SELECT COUNT(*) AS n FROM shots WHERE shooter = ? AND hit = 1')
    .bind(shooter)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export { BOARD_SIZE, TOTAL_BOAT_CELLS };
