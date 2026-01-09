/**
 * Solana RPC Proxy API Endpoint
 * Handles Solana RPC calls on the server to bypass CORS restrictions
 */

import type { APIRoute } from 'astro';

const SOLANA_RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://rpc.ankr.com/solana',
  'https://solana-api.projectserum.com',
];

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Validate request
    if (!body.method || !Array.isArray(body.params)) {
      return new Response(JSON.stringify({
        error: 'Invalid request format'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Rate limiting - simple check
    const allowedMethods = [
      'getSignaturesForAddress',
      'getTransaction',
      'getAccountInfo',
      'getTokenAccountsByOwner',
      'getRecentBlockhash'
    ];

    if (!allowedMethods.includes(body.method)) {
      return new Response(JSON.stringify({
        error: 'Method not allowed'
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Try multiple RPC endpoints
    let lastError: any = null;

    for (const endpoint of SOLANA_RPC_ENDPOINTS) {
      try {
        console.log(`[SolanaProxy] Trying endpoint: ${endpoint} for method: ${body.method}`);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: body.id || 1,
            method: body.method,
            params: body.params
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        console.log(`[SolanaProxy] Success with endpoint: ${endpoint}`);

        // Add CORS headers for browser access
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        });

      } catch (error) {
        console.warn(`[SolanaProxy] Failed with ${endpoint}:`, error);
        lastError = error;
        continue;
      }
    }

    // All endpoints failed
    console.error('[SolanaProxy] All RPC endpoints failed:', lastError);

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: body.id || 1,
      error: {
        code: -32000,
        message: 'All Solana RPC endpoints failed'
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (error) {
    console.error('[SolanaProxy] API error:', error);

    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

// Handle OPTIONS for CORS preflight
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};