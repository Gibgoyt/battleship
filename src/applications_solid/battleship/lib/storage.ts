const KEY_PASS = 'bs_pass_hash';
const KEY_SEAT = 'bs_seat_token';

export function getPassHash(): string | null {
  try {
    return localStorage.getItem(KEY_PASS);
  } catch {
    return null;
  }
}
export function setPassHash(h: string): void {
  try { localStorage.setItem(KEY_PASS, h); } catch { /* noop */ }
}
export function clearPassHash(): void {
  try { localStorage.removeItem(KEY_PASS); } catch { /* noop */ }
}

export function getSeatToken(): string | null {
  try {
    return localStorage.getItem(KEY_SEAT);
  } catch {
    return null;
  }
}
export function setSeatToken(t: string): void {
  try { localStorage.setItem(KEY_SEAT, t); } catch { /* noop */ }
}
export function clearSeatToken(): void {
  try { localStorage.removeItem(KEY_SEAT); } catch { /* noop */ }
}

export function clearAll(): void {
  clearPassHash();
  clearSeatToken();
}
