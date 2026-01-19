/**
 * Custom Firebase User Implementation
 * Replaces Firebase SDK User type with custom implementation using REST API calls
 */

import { refreshTokenViaAPI } from './custom-refresh'
import { firebaseTokenStorage } from 'src/lib/auth/firebase-token-storage'
import { createLogger } from 'src/lib/logger'

const logger = createLogger('[CustomFirebaseUser]')

/**
 * Custom Firebase User interface - Replaces Firebase SDK User type
 * Provides the same methods that the current middleware expects
 */
export interface CustomFirebaseUser {
  uid: string
  email: string | null
  emailVerified: boolean
  refreshToken: string

  // Methods that replace Firebase SDK User methods
  getIdToken(forceRefresh?: boolean): Promise<string>
}

/**
 * Custom Firebase User implementation
 * Provides Firebase User-compatible interface using custom REST API calls
 */
export class CustomFirebaseUserImpl implements CustomFirebaseUser {
  public readonly uid: string
  public readonly email: string | null
  public readonly emailVerified: boolean
  public readonly refreshToken: string

  private currentIdToken: string
  private tokenExpiresAt: number

  constructor(
    uid: string,
    email: string | null,
    emailVerified: boolean,
    refreshToken: string,
    idToken: string,
    expiresAt: number
  ) {
    this.uid = uid
    this.email = email
    this.emailVerified = emailVerified
    this.refreshToken = refreshToken
    this.currentIdToken = idToken
    this.tokenExpiresAt = expiresAt

    logger.debug('CustomFirebaseUser created', {
      uid,
      email,
      emailVerified,
      expiresAt: new Date(expiresAt).toISOString()
    })
  }

  /**
   * Get ID token - compatible with Firebase SDK User.getIdToken()
   * @param forceRefresh - If true, forces token refresh via REST API
   * @returns Promise<string> - The ID token
   */
  async getIdToken(forceRefresh: boolean = false): Promise<string> {
    const now = Date.now()

    // Check if token is expired or force refresh requested
    const isExpired = this.tokenExpiresAt <= now
    const needsRefresh = forceRefresh || isExpired

    if (needsRefresh) {
      logger.debug('Token refresh needed', {
        forceRefresh,
        isExpired,
        expiresAt: new Date(this.tokenExpiresAt).toISOString(),
        timeUntilExpiry: this.tokenExpiresAt - now
      })

      try {
        // Use custom refresh token API
        const refreshResult = await refreshTokenViaAPI(this.refreshToken)

        // Update stored tokens
        const newTokenData = {
          idToken: refreshResult.idToken,
          refreshToken: refreshResult.refreshToken,
          rememberMe: firebaseTokenStorage.getTokens().rememberMe,
          lastRefresh: Date.now(),
          tokenExpiresAt: Date.now() + (parseInt(refreshResult.expiresIn) * 1000),
          refreshAttempts: 0 // Reset on successful refresh
        }

        firebaseTokenStorage.storeTokens(newTokenData)

        // Update internal state
        this.currentIdToken = refreshResult.idToken
        this.tokenExpiresAt = newTokenData.tokenExpiresAt

        logger.info('Token refreshed successfully', {
          uid: this.uid,
          newExpiresAt: new Date(this.tokenExpiresAt).toISOString(),
          expiresIn: refreshResult.expiresIn
        })

        return this.currentIdToken

      } catch (error) {
        logger.error('Token refresh failed', {
          uid: this.uid,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        throw error
      }
    }

    // Return current token if no refresh needed
    logger.debug('Returning current token', {
      uid: this.uid,
      timeUntilExpiry: this.tokenExpiresAt - now
    })

    return this.currentIdToken
  }
}

/**
 * Create CustomFirebaseUser from stored token data
 * Parses JWT payload to extract user information
 * @param idToken - Current ID token (JWT)
 * @param refreshToken - Refresh token for API calls
 * @returns CustomFirebaseUser instance
 */
export function createCustomUserFromTokens(
  idToken: string,
  refreshToken: string
): CustomFirebaseUser {
  try {
    // Parse JWT payload to extract user information
    const payload = JSON.parse(atob(idToken.split('.')[1]))

    // Extract expiration time
    const expiresAt = payload.exp * 1000 // Convert seconds to milliseconds

    const user = new CustomFirebaseUserImpl(
      payload.sub || payload.user_id, // uid
      payload.email || null, // email
      payload.email_verified === true, // emailVerified
      refreshToken, // refreshToken
      idToken, // currentIdToken
      expiresAt // tokenExpiresAt
    )

    logger.debug('Created CustomFirebaseUser from tokens', {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      expiresAt: new Date(expiresAt).toISOString()
    })

    return user

  } catch (error) {
    logger.error('Failed to create CustomFirebaseUser from tokens', {
      error: error instanceof Error ? error.message : 'Unknown error',
      tokenLength: idToken.length
    })
    throw new Error('Invalid token format - cannot create CustomFirebaseUser')
  }
}

/**
 * Create CustomFirebaseUser from current storage
 * Convenience function that reads tokens from storage and creates user
 * @returns CustomFirebaseUser instance or null if no valid tokens
 */
export function createCustomUserFromStorage(): CustomFirebaseUser | null {
  try {
    const tokens = firebaseTokenStorage.getTokens()

    if (!tokens.idToken || !tokens.refreshToken) {
      logger.debug('No tokens in storage to create CustomFirebaseUser')
      return null
    }

    return createCustomUserFromTokens(tokens.idToken, tokens.refreshToken)

  } catch (error) {
    logger.error('Failed to create CustomFirebaseUser from storage', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return null
  }
}

/**
 * Check if stored tokens represent a valid authenticated user
 * @returns boolean - true if user is authenticated with valid tokens
 */
export function isUserAuthenticated(): boolean {
  try {
    const user = createCustomUserFromStorage()
    return user !== null
  } catch {
    return false
  }
}