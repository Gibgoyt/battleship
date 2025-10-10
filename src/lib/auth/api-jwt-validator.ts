/**
 * Server-side JWT Validation for API Routes
 *
 * Validates Authorization: Bearer <token> header in API requests
 * Extracts and validates Cognito JWT tokens
 */

import type { APIContext } from 'astro';

export interface JWTPayload {
  sub: string;
  email: string;
  email_verified?: boolean;
  username?: string;
  'cognito:groups'?: string[];
  'cognito:username'?: string;
  exp: number;
  iat: number;
  token_use: 'id' | 'access';
}

export interface AuthResult {
  success: boolean;
  user?: {
    sub: string;
    email: string;
    username: string;
    groups: string[];
  };
  error?: string;
  status?: number;
}

/**
 * Extract JWT token from Authorization header
 */
export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Decode JWT without verification (basic structure check)
 */
function decodeJWT(token: string): { header: any; payload: JWTPayload } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Base64URL decode
    const base64UrlDecode = (str: string): string => {
      // Convert Base64URL to Base64
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      // Pad if necessary
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }
      return atob(base64);
    };

    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));

    return { header, payload };
  } catch (error) {
    console.error('[APIJWTValidator] Failed to decode token:', error);
    return null;
  }
}

/**
 * Validate JWT token (basic validation without signature verification)
 *
 * NOTE: For production, you should verify the signature against Cognito's JWKS
 * This basic validation checks:
 * - Token structure
 * - Expiration
 * - Required claims
 */
export function validateJWTBasic(token: string): AuthResult {
  const decoded = decodeJWT(token);

  if (!decoded) {
    return {
      success: false,
      error: 'Invalid token format',
      status: 401,
    };
  }

  const { payload } = decoded;

  // Check expiration
  const currentTime = Math.floor(Date.now() / 1000);
  if (payload.exp < currentTime) {
    return {
      success: false,
      error: 'Token has expired',
      status: 401,
    };
  }

  // Validate required claims
  if (!payload.sub || !payload.exp || !payload.iat) {
    return {
      success: false,
      error: 'Token missing required claims',
      status: 401,
    };
  }

  // Extract user info
  return {
    success: true,
    user: {
      sub: payload.sub,
      email: payload.email || '',
      username: payload['cognito:username'] || payload.username || payload.sub,
      groups: payload['cognito:groups'] || [],
    },
  };
}

/**
 * Middleware helper to validate JWT from Authorization header
 *
 * Usage in API route:
 * ```typescript
 * export const GET: APIRoute = async ({ request }) => {
 *   const auth = validateAuthHeader(request);
 *   if (!auth.success) {
 *     return new Response(JSON.stringify({ error: auth.error }), {
 *       status: auth.status,
 *       headers: { 'Content-Type': 'application/json' },
 *     });
 *   }
 *
 *   // Use auth.user.sub, auth.user.email, etc.
 *   ...
 * };
 * ```
 */
export function validateAuthHeader(request: Request): AuthResult {
  const token = extractBearerToken(request);

  if (!token) {
    return {
      success: false,
      error: 'Missing Authorization header. Expected: Authorization: Bearer <token>',
      status: 401,
    };
  }

  return validateJWTBasic(token);
}

/**
 * Helper to create standardized error responses
 */
export function createAuthErrorResponse(auth: AuthResult): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: auth.error || 'Unauthorized',
    }),
    {
      status: auth.status || 401,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
