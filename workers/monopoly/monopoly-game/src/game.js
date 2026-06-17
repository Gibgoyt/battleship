// Pure game-logic helpers — no DO/storage/network calls in here. The DO
// applies these to its in-memory state and persists the result.

import {
  BOARD,
  COMMODITY_INDICES,
  COUNTRY_INDICES,
  CORNER_GO,
  CORNER_GO_TO_JAIL,
  CORNER_INCOME_TAX,
  CORNER_JAIL,
  CORNER_LUXURY_TAX,
  N_TILES,
  PROPERTY_COUNTRY,
  isOwnable,
  tileAt,
} from './board.js';

export const STARTING_CASH    = 1500;
export const GO_REWARD        = 200;
export const INCOME_TAX       = 200;
export const LUXURY_TAX       = 75;
export const JAIL_FINE        = 50;
export const MAX_JAIL_TURNS   = 3;
export const MAX_DOUBLES_RUN  = 3;
export const PLAYER_COLORS    = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

export function rollDie() { return 1 + Math.floor(Math.random() * 6); }
export function roll2d6()  { return [rollDie(), rollDie()]; }

// Apply a move from `from` of `steps` forward; returns { to, passedGo }.
export function move(from, steps) {
  const to = ((from + steps) % N_TILES + N_TILES) % N_TILES;
  const passedGo = steps > 0 && to < from; // wrapped past index 0
  return { to, passedGo };
}

// Count how many commodity tiles a given seat currently owns.
export function commoditiesOwnedBy(ownership, seat) {
  let n = 0;
  for (const i of COMMODITY_INDICES) if (ownership[i] === seat) n++;
  return n;
}

// True iff `seat` owns every property in the country `tile` belongs to.
export function ownsCountryFor(ownership, seat, tileIndex) {
  const country = PROPERTY_COUNTRY.get(tileIndex);
  if (!country) return false;
  for (const i of COUNTRY_INDICES.get(country)) {
    if (ownership[i] !== seat) return false;
  }
  return true;
}

// Compute the rent the player landing on `tileIndex` must pay (0 if none).
// Caller passes ownership map + seat-of-owner (already resolved).
export function rentDue(ownership, tileIndex) {
  const t = tileAt(tileIndex);
  const owner = ownership[tileIndex];
  if (owner === undefined || owner === null) return { amount: 0, owner: null };
  if (t.kind === 'commodity') {
    const n = commoditiesOwnedBy(ownership, owner);
    // Classic railroad ladder: $25, $50, $100, $200, $400, $800.
    const amount = t.baseRent * Math.pow(2, Math.max(0, n - 1));
    return { amount, owner };
  }
  if (t.kind === 'property') {
    const monopoly = ownsCountryFor(ownership, owner, tileIndex);
    return { amount: monopoly ? t.baseRent * 2 : t.baseRent, owner };
  }
  return { amount: 0, owner: null };
}

// Net worth = cash + sum of prices of owned tiles. Used for end-of-game
// scoreboard and bankruptcy comparisons.
export function netWorth(player, ownership) {
  let n = player.money;
  for (let i = 0; i < N_TILES; i++) {
    if (ownership[i] === player.seat) n += BOARD[i].price || 0;
  }
  return n;
}

// Marks a player bankrupt and releases all their properties back to the bank.
export function bankrupt(player, ownership) {
  player.bankrupt = true;
  player.money = 0;
  for (let i = 0; i < N_TILES; i++) {
    if (ownership[i] === player.seat) delete ownership[i];
  }
}

// Returns the seat of the next non-bankrupt player after `currentSeat`,
// or null if zero/one non-bankrupt remain (in which case caller declares end).
export function nextSeat(players, currentSeat) {
  const alive = players.filter((p) => !p.bankrupt);
  if (alive.length <= 1) return null;
  const order = [...players].sort((a, b) => a.seat - b.seat);
  const idx = order.findIndex((p) => p.seat === currentSeat);
  for (let step = 1; step <= order.length; step++) {
    const candidate = order[(idx + step) % order.length];
    if (!candidate.bankrupt) return candidate.seat;
  }
  return null;
}

// Corner-tile side effects. Returns one of:
//   { kind: 'none' }
//   { kind: 'tax',     amount }   // collect from player to bank
//   { kind: 'go-to-jail' }
export function cornerEffect(tileIndex) {
  switch (tileIndex) {
    case CORNER_GO_TO_JAIL: return { kind: 'go-to-jail' };
    case CORNER_INCOME_TAX: return { kind: 'tax', amount: INCOME_TAX };
    case CORNER_LUXURY_TAX: return { kind: 'tax', amount: LUXURY_TAX };
    case CORNER_GO:
    case CORNER_JAIL:       // Just Visiting — no effect
    default:                return { kind: 'none' };
  }
}

export { isOwnable, tileAt, CORNER_GO, CORNER_JAIL, CORNER_GO_TO_JAIL };
