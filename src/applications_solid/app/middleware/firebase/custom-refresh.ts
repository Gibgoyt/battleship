/**
 * Custom Firebase Token Refresh Service
 * Replaces Firebase SDK token refresh with direct REST API calls
 * Browser-compatible implementation using fetch() API
 */

import { createLogger } from 'src/lib/logger'

const logger = createLogger('[CustomRefresh]')

// Firebase API configuration
const FIREBASE_API_KEY = "AIzaSyBQ2AuI6sg1p1wpaOzJRV37u5Z0M1JNabs" // From existing JwtAuth.ts
const FIREBASE_REFRESH_URL = `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`

/**
 * Firebase refresh token API response interface
 */
interface FirebaseRefreshResponse {
  access_token: string
  expires_in: string
  token_type: string
  refresh_token: string
  id_token: string
  user_id: string
  project_id: string
}

/**
 * Standardized refresh token result interface
 */
export interface RefreshTokenResult {
  idToken: string
  refreshToken: string
  expiresIn: string
  accessToken: string
  userId: string
}

/**
 * Custom error for refresh token failures
 */
export class RefreshTokenError extends Error {
  public readonly code: string
  public readonly originalError: any

  constructor(message: string, code: string = 'REFRESH_FAILED', originalError?: any) {
    super(message)
    this.name = 'RefreshTokenError'
    this.code = code
    this.originalError = originalError
  }
}

/**
 * Refresh Firebase token using REST API
 * Browser-compatible replacement for Firebase SDK user.getIdToken(true)
 *
 * @param refreshToken - The refresh token to use for getting new ID token
 * @returns Promise<RefreshTokenResult> - New tokens and expiration info
 * @throws RefreshTokenError - If refresh fails
 */
export async function refreshTokenViaAPI(refreshToken: string): Promise<RefreshTokenResult> {
  const correlationId = Math.random().toString(36).substr(2, 9)
  const startTime = Date.now()

  logger.debug('Starting token refresh via Firebase REST API', {
    correlationId,
    refreshTokenLength: refreshToken.length
  })

  try {
    // Make request to Firebase secure token endpoint
    const response = await fetch(FIREBASE_REFRESH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    })

    const responseTime = Date.now() - startTime

    logger.debug('Firebase refresh API response received', {
      correlationId,
      status: response.status,
      statusText: response.statusText,
      responseTime,
      contentType: response.headers.get('Content-Type')
    })

    // Parse response
    const data = await response.json()

    if (!response.ok) {
      // Handle error response
      const errorCode = data.error?.error || 'UNKNOWN_ERROR'
      const errorMessage = data.error?.message || 'Token refresh failed'

      logger.error('Firebase refresh API returned error', {
        correlationId,
        status: response.status,
        errorCode,
        errorMessage,
        responseTime
      })

      throw new RefreshTokenError(
        `Firebase token refresh failed: ${errorMessage}`,
        errorCode,
        data.error
      )
    }

    // Validate response structure
    const firebaseResponse = data as FirebaseRefreshResponse

    if (!firebaseResponse.id_token || !firebaseResponse.refresh_token || !firebaseResponse.expires_in) {
      logger.error('Invalid Firebase refresh response structure', {
        correlationId,
        hasIdToken: Boolean(firebaseResponse.id_token),
        hasRefreshToken: Boolean(firebaseResponse.refresh_token),
        hasExpiresIn: Boolean(firebaseResponse.expires_in)
      })

      throw new RefreshTokenError(
        'Invalid response structure from Firebase refresh API',
        'INVALID_RESPONSE',
        data
      )
    }

    // Create standardized result
    const result: RefreshTokenResult = {
      idToken: firebaseResponse.id_token,
      refreshToken: firebaseResponse.refresh_token,
      expiresIn: firebaseResponse.expires_in,
      accessToken: firebaseResponse.access_token,
      userId: firebaseResponse.user_id
    }

    logger.info('Token refresh successful', {
      correlationId,
      userId: result.userId,
      expiresIn: result.expiresIn,
      responseTime,
      idTokenLength: result.idToken.length,
      refreshTokenLength: result.refreshToken.length
    })

    return result

  } catch (error) {
    const responseTime = Date.now() - startTime

    if (error instanceof RefreshTokenError) {
      // Re-throw our custom error
      throw error
    }

    // Handle network or other errors
    logger.error('Token refresh failed with unexpected error', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      responseTime
    })

    throw new RefreshTokenError(
      `Token refresh failed: ${error instanceof Error ? error.message : 'Network error'}`,
      'NETWORK_ERROR',
      error
    )
  }
}

/**
 * Validate that a refresh token appears to be in correct format
 * Basic validation - doesn't verify with server
 *
 * @param refreshToken - Token to validate
 * @returns boolean - true if format looks valid
 */
export function validateRefreshTokenFormat(refreshToken: string): boolean {
  if (!refreshToken || typeof refreshToken !== 'string') {
    return false
  }

  // Firebase refresh tokens are typically long base64-ish strings
  // Basic length and character check
  const minLength = 50 // Arbitrary but reasonable minimum
  const maxLength = 2000 // Arbitrary but reasonable maximum
  const validCharPattern = /^[A-Za-z0-9_\-\.\/\+]+$/

  return (
    refreshToken.length >= minLength &&
    refreshToken.length <= maxLength &&
    validCharPattern.test(refreshToken)
  )
}

/**
 * Extract token expiration time from ID token
 * Utility function for working with JWT tokens
 *
 * @param idToken - JWT token to parse
 * @returns number - Expiration timestamp in milliseconds, or 0 if invalid
 */
export function extractTokenExpiration(idToken: string): number {
  try {
    const payload = JSON.parse(atob(idToken.split('.')[1]))
    return (payload.exp || 0) * 1000 // Convert seconds to milliseconds
  } catch (error) {
    logger.warn('Failed to extract token expiration', {
      tokenLength: idToken.length,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return 0
  }
}

/**
 * Check if token is close to expiration
 * Utility function for determining if refresh is needed
 *
 * @param idToken - JWT token to check
 * @param bufferMinutes - Minutes before expiry to consider "close" (default: 30)
 * @returns boolean - true if token expires within buffer time
 */
export function isTokenNearExpiration(idToken: string, bufferMinutes: number = 30): boolean {
  const expirationTime = extractTokenExpiration(idToken)
  if (expirationTime === 0) {
    return true // Treat invalid tokens as expired
  }

  const bufferMs = bufferMinutes * 60 * 1000
  const now = Date.now()

  return (expirationTime - now) < bufferMs
}

// RefreshTokenError is already exported above as part of the class declaration