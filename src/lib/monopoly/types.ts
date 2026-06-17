// Wire types shared between the worker (workers/monopoly/monopoly-game/),
// the Leptos WASM client, and the Astro reset page. The worker is the
// authoritative source; clients only read these shapes.

export type Phase = 'lobby' | 'playing' | 'finished';

export type PlayerColor =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'gray';

export type Awaiting = 'roll' | 'buyOrSkip' | 'endTurn';

export interface Player {
  seat: number;
  color: PlayerColor;
  displayName: string;
  ready: boolean;
  connected: boolean;
  money: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  bankrupt: boolean;
}

export interface Turn {
  currentSeat: number;
  dice: [number, number] | null;
  doublesCount: number;
  awaiting: Awaiting;
}

export interface LogEntry {
  ts: number;
  kind: string;
  payload: unknown;
}

export interface GameSnapshot {
  phase: Phase;
  players: Player[];
  ownership: Record<number, number>; // tileIndex -> seat
  turn: Turn;
  winner: number | null;
  log: LogEntry[];
}

// ---- client -> server messages ------------------------------------------
export type ClientMsg =
  | { t: 'hello'; seatToken?: string }
  | { t: 'join'; displayName: string }
  | { t: 'leave' }
  | { t: 'ready'; value: boolean }
  | { t: 'roll' }
  | { t: 'buy' }
  | { t: 'skip' }
  | { t: 'endTurn' };

// ---- server -> client messages ------------------------------------------
export type ServerMsg =
  | { t: 'welcome'; seat: number | null; seatToken: string | null }
  | { t: 'state'; state: GameSnapshot }
  | { t: 'event'; kind: string; payload: unknown }
  | { t: 'kicked'; reason: 'reset' | 'evicted' }
  | { t: 'error'; message: string };
