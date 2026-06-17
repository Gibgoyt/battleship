// Identical to src/lib/battleship/secret.ts — same shared hardcoded password
// across both games, per user instruction.

export const MONOPOLY_PASSWORD = 'Broskikiller1!';

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

let cachedHash: string | null = null;
export async function getPasswordHash(): Promise<string> {
  if (cachedHash) return cachedHash;
  cachedHash = await sha256Hex(MONOPOLY_PASSWORD);
  return cachedHash;
}
