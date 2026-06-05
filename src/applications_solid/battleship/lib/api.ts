import { getPassHash, getSeatToken } from './storage';
import type { BoatPlacement, ClientGameState, PlayerNum } from 'src/lib/battleship/types';

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const pass = getPassHash();
  if (pass) headers['X-BS-Pass'] = pass;
  const seat = getSeatToken();
  if (seat) headers['X-BS-Seat'] = seat;

  const res = await fetch(path, {
    method: init.method || 'GET',
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const ct = res.headers.get('Content-Type') || '';
  const parsed: unknown = ct.includes('application/json')
    ? await res.json()
    : await res.text();
  if (!res.ok) {
    const msg =
      parsed && typeof parsed === 'object' && parsed !== null && 'error' in parsed
        ? String((parsed as { error: unknown }).error)
        : `HTTP ${res.status}`;
    throw new ApiError(msg, res.status);
  }
  return parsed as T;
}

export class ApiError extends Error {
  status: number;
  constructor(msg: string, status: number) {
    super(msg);
    this.status = status;
  }
}

export interface AuthResponse {
  player: PlayerNum;
  seatToken: string;
}

export const api = {
  auth: () =>
    request<AuthResponse>('/api/battleship/auth', { method: 'POST', body: {} }),
  state: () => request<ClientGameState>('/api/battleship/state'),
  setPositions: (boats: BoatPlacement[]) =>
    request<{ ok: true }>('/api/battleship/set-positions', {
      method: 'POST',
      body: { boats },
    }),
  shot: (x: number, y: number) =>
    request<{ hit: boolean; phase: string; winner: PlayerNum | null }>(
      '/api/battleship/shot',
      { method: 'POST', body: { x, y } },
    ),
  reset: () =>
    request<{ status: 'requested' | 'cancelled' | 'reset' }>(
      '/api/battleship/reset',
      { method: 'POST', body: {} },
    ),
};
