// Single source of truth for the Cloudflare Worker URL hosting the
// MonopolyGameDO. After you deploy `workers/monopoly/monopoly-game/`
// to Cloudflare, paste the URL here (the bare host, no scheme).
//
// Example: 'monopoly-game.broskikiller.workers.dev'
//
// Until you set it, the WASM app shows a friendly "worker not configured"
// banner instead of trying to connect.
export const MONOPOLY_WORKER_HOST = 'battleship.ahmedmoti767.workers.dev';

export function workerHttpsBase(): string {
  return `https://${MONOPOLY_WORKER_HOST}`;
}

export function workerWssBase(): string {
  return `wss://${MONOPOLY_WORKER_HOST}`;
}

export function isConfigured(): boolean {
  return !MONOPOLY_WORKER_HOST.startsWith('PLACEHOLDER');
}
