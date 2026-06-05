export type Phase = 'waiting' | 'placing' | 'playing' | 'finished';
export type PlayerNum = 1 | 2;

export type BoatType = '3x2' | '5x2' | '8x1' | '6x1' | '7x2' | '3x1' | '4x1';

export interface BoatSpec {
  type: BoatType;
  /** base footprint width before rotation */
  baseW: number;
  /** base footprint height before rotation */
  baseH: number;
}

/** Required fleet composition: 10 boats total, 7 distinct types. */
export const FLEET: BoatSpec[] = [
  { type: '3x2', baseW: 3, baseH: 2 },
  { type: '3x2', baseW: 3, baseH: 2 },
  { type: '5x2', baseW: 5, baseH: 2 },
  { type: '8x1', baseW: 8, baseH: 1 },
  { type: '6x1', baseW: 6, baseH: 1 },
  { type: '6x1', baseW: 6, baseH: 1 },
  { type: '7x2', baseW: 7, baseH: 2 },
  { type: '3x1', baseW: 3, baseH: 1 },
  { type: '3x1', baseW: 3, baseH: 1 },
  { type: '4x1', baseW: 4, baseH: 1 },
];

export const BOARD_SIZE = 16;

/** Sum of all boat cells: must equal this many hits to win. */
export const TOTAL_BOAT_CELLS = FLEET.reduce((s, b) => s + b.baseW * b.baseH, 0);

export interface BoatPlacement {
  type: BoatType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Shot {
  x: number;
  y: number;
  hit: 0 | 1;
}

export interface ClientGameState {
  you: PlayerNum;
  phase: Phase;
  turn: PlayerNum;
  winner: PlayerNum | null;
  resetRequestedBy: PlayerNum | null;
  opponentJoined: boolean;
  opponentPlaced: boolean;
  myBoats: BoatPlacement[];
  myShotsTaken: Shot[];
  shotsAgainstMe: Shot[];
  /** Only populated when phase === 'finished' */
  opponentBoats: BoatPlacement[] | null;
}

/** Validate that a candidate fleet matches the required FLEET composition (after rotation). */
export function validateFleetComposition(boats: BoatPlacement[]): string | null {
  if (boats.length !== FLEET.length) {
    return `Expected ${FLEET.length} boats, got ${boats.length}`;
  }
  const required = new Map<string, number>();
  for (const spec of FLEET) {
    const key = canonicalDims(spec.baseW, spec.baseH);
    required.set(key, (required.get(key) || 0) + 1);
  }
  const got = new Map<string, number>();
  for (const b of boats) {
    const key = canonicalDims(b.width, b.height);
    got.set(key, (got.get(key) || 0) + 1);
  }
  for (const [k, n] of required) {
    if (got.get(k) !== n) {
      return `Fleet mismatch for ${k}: need ${n}, got ${got.get(k) || 0}`;
    }
  }
  for (const k of got.keys()) {
    if (!required.has(k)) return `Unexpected boat dimensions: ${k}`;
  }
  return null;
}

/** Returns a stable key for a w×h footprint regardless of rotation. */
export function canonicalDims(w: number, h: number): string {
  return w >= h ? `${w}x${h}` : `${h}x${w}`;
}

export function validatePlacement(boats: BoatPlacement[]): string | null {
  const occ = new Set<number>();
  for (const b of boats) {
    if (b.x < 0 || b.y < 0 || b.x + b.width > BOARD_SIZE || b.y + b.height > BOARD_SIZE) {
      return `Boat out of bounds: ${b.type} at (${b.x},${b.y}) ${b.width}x${b.height}`;
    }
    for (let dy = 0; dy < b.height; dy++) {
      for (let dx = 0; dx < b.width; dx++) {
        const cell = (b.y + dy) * BOARD_SIZE + (b.x + dx);
        if (occ.has(cell)) {
          return `Boats overlap at (${b.x + dx},${b.y + dy})`;
        }
        occ.add(cell);
      }
    }
  }
  return null;
}
