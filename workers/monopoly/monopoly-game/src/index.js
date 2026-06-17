// Cloudflare Worker entrypoint for the monopoly-game project.
//
// Routes:
//   GET  /ws            -> WebSocket upgrade, forwarded to the global DO
//   GET  /state         -> JSON snapshot (debug / reset-page polling)
//   POST /force-reset   -> wipes the DO; password-gated (X-BS-Pass)
//
// All requests are forwarded to the single global instance of MonopolyGameDO
// via env.MONOPOLY_GAME.getByName("global") — there is only one running game.

import { MonopolyGameDO } from './durable.js';

// SHA-256("Broskikiller1!") in lowercase hex. Mirrors src/lib/battleship/secret.ts.
const PASSWORD_PLAINTEXT = 'Broskikiller1!';

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0');
  return out;
}
let _expected = null;
async function expectedHash() {
  if (!_expected) _expected = await sha256Hex(PASSWORD_PLAINTEXT);
  return _expected;
}
function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let m = 0;
  for (let i = 0; i < a.length; i++) m |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return m === 0;
}

async function checkPassword(request, url) {
  const supplied =
    request.headers.get('X-BS-Pass') ||
    url.searchParams.get('p') ||
    '';
  if (!supplied) return false;
  return constantTimeEqual(supplied.toLowerCase(), await expectedHash());
}

function corsHeaders(env, request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const allow = allowed.includes(origin) ? origin : (allowed[0] || '*');
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-BS-Pass, X-BS-Seat',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function jsonResponse(body, init = {}, env, request) {
  return new Response(JSON.stringify(body), {
    status: init.status || 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...corsHeaders(env, request),
      ...(init.headers || {}),
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env, request) });
    }

    // Password gate on every entrypoint except OPTIONS.
    if (!(await checkPassword(request, url))) {
      return jsonResponse({ error: 'Invalid password' }, { status: 401 }, env, request);
    }

    const stub = env.MONOPOLY_GAME.getByName('global');

    if (url.pathname === '/ws') {
      // The DO handles the websocket upgrade itself.
      return stub.fetch(request);
    }

    if (url.pathname === '/state' && request.method === 'GET') {
      const res = await stub.fetch(new Request(new URL('/state', request.url), { method: 'GET' }));
      const body = await res.text();
      return new Response(body, {
        status: res.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(env, request) },
      });
    }

    if (url.pathname === '/force-reset' && request.method === 'POST') {
      const res = await stub.fetch(new Request(new URL('/force-reset', request.url), { method: 'POST' }));
      const body = await res.text();
      return new Response(body, {
        status: res.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(env, request) },
      });
    }

    return jsonResponse({ error: 'not found' }, { status: 404 }, env, request);
  },
};

export { MonopolyGameDO };
