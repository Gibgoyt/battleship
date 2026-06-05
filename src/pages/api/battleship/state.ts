import type { APIRoute } from 'astro';
import { authedHandler, buildClientState, getGame, jsonResponse } from 'src/lib/battleship/server';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const auth = await authedHandler(request, locals);
  if (auth instanceof Response) return auth;
  const { db, player } = auth;
  const game = await getGame(db);
  const state = await buildClientState(db, game, player);
  return jsonResponse(state);
};
