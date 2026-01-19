/**
 * Centralized fetch wrapper for SolidJS middleware system
 * Handles automatic token injection, 401/403 retry logic, and global rate limiting
 */

import { createLogger } from 'src/lib/logger'
import { getGlobalAuthStore } from './firebase/auth-store'
import { firebaseTokenStorage } from '../../../lib/auth/firebase-token-storage'

const logger = createLogger('[fetchMiddleware]')

/**
 * Context-aware auth error handler
 * Coordinates auth refresh with context providers
 */
async function handleAuthError(response: Response, retryCount: number, correlationId: string): Promise<{
  shouldRetry: boolean
  newToken: boolean
  error?: Error
}> {
  if ((response.status === 401 || response.status === 403) && retryCount < 1) {
    logger.warn('Context-aware auth error handling initiated', {
      correlationId,
      status: response.status,
      attempt: retryCount + 1
    })

    try {
      // Primary: Use global auth store with enhanced error handling
      const authStore = getGlobalAuthStore()
      await authStore.refreshToken()

      logger.info('Context-aware token refresh successful', { correlationId })

      // Notify contexts of successful auth state change
      const authSuccessEvent = new CustomEvent('authSuccess', {
        detail: {
          message: 'Token refreshed successfully',
          correlationId,
          timestamp: Date.now()
        }
      })
      window.dispatchEvent(authSuccessEvent)

      return { shouldRetry: true, newToken: true }

    } catch (refreshError) {
      logger.error('Context-aware token refresh failed', {
        correlationId,
        error: refreshError instanceof Error ? refreshError.message : 'Unknown error'
      })

      // Refresh failed - trigger session expiry AND context cleanup
      const authStore = getGlobalAuthStore()
      authStore.triggerSessionExpiryNotification()

      // Emit context event for cache cleanup and error handling
      const authErrorEvent = new CustomEvent('authError', {
        detail: {
          error: refreshError,
          statusCode: response.status,
          correlationId,
          timestamp: Date.now(),
          source: 'fetchMiddleware'
        }
      })
      window.dispatchEvent(authErrorEvent)

      return {
        shouldRetry: false,
        newToken: false,
        error: refreshError instanceof Error ? refreshError : new Error('Token refresh failed')
      }
    }
  }

  return { shouldRetry: false, newToken: false }
}

/**
 * Check if global rate limit is active using auth store
 */
function isRateLimited(): boolean {
  const authStore = getGlobalAuthStore()
  return authStore.isRateLimited()
}

/**
 * Activate global rate limit for 10 seconds using auth store
 */
function activateRateLimit(): void {
  const authStore = getGlobalAuthStore()
  authStore.activateRateLimit('Cloudflare error 1015', 10000)
}

/**
 * Enhanced fetch wrapper with automatic auth handling
 * @param url - Request URL
 * @param options - Fetch options (headers will be augmented with auth)
 * @returns Promise<Response>
 */
export async function fetchMiddleware(url: string, options: RequestInit = {}): Promise<Response> {
  const startTime = Date.now()
  const correlationId = Math.random().toString(36).substr(2, 9)

  logger.debug('Fetch middleware request initiated', {
    correlationId,
    url,
    method: options.method || 'GET'
  })

  // Get auth store and current tokens
  const authStore = getGlobalAuthStore()

  // Check global rate limit first
  if (isRateLimited()) {
    const rateLimitInfo = authStore.getRateLimitInfo()
    const remainingTime = Math.ceil(rateLimitInfo.remainingMs / 1000)
    logger.warn(`Request blocked due to global rate limit. ${remainingTime}s remaining`, {
      reason: rateLimitInfo.reason,
      correlationId
    })
    throw new Error(`Global rate limit active (${rateLimitInfo.reason}). Please wait ${remainingTime} seconds.`)
  }

  // Enhanced: Service health validation before making requests
  try {
    const serviceHealth = authStore.getServiceHealth();
    if (!serviceHealth.isHealthy && serviceHealth.consecutiveFailures > 2) {
      logger.warn('Service health issues detected, attempting recovery', {
        correlationId,
        issues: serviceHealth.issues,
        consecutiveFailures: serviceHealth.consecutiveFailures
      });

      // Attempt service recovery
      try {
        await authStore.checkServiceHealth();
      } catch (recoveryError) {
        logger.error('Service recovery failed:', { correlationId, recoveryError });
      }
    }
  } catch (healthError) {
    logger.warn('Could not check service health:', { correlationId, healthError });
  }

  let tokens = firebaseTokenStorage.getTokens()

  // Enhanced token debugging
  logger.debug('Token retrieval details', {
    correlationId,
    hasIdToken: Boolean(tokens.idToken),
    hasRefreshToken: Boolean(tokens.refreshToken),
    idTokenLength: tokens.idToken?.length || 0,
    // Debug storage contents
    sessionStorageIdToken: sessionStorage.getItem('firebase-idToken') ? 'PRESENT' : 'MISSING',
    localStorageIdToken: localStorage.getItem('firebase-idToken') ? 'PRESENT' : 'MISSING',
    sessionStorageRefreshToken: sessionStorage.getItem('firebase-refreshToken') ? 'PRESENT' : 'MISSING',
    localStorageRefreshToken: localStorage.getItem('firebase-refreshToken') ? 'PRESENT' : 'MISSING',
  });

  // Check if we have a valid token
  if (!tokens.idToken) {
    // Enhanced fallback: directly check storage when firebaseTokenStorage fails
    const directStorageToken = sessionStorage.getItem('firebase-idToken') || localStorage.getItem('firebase-idToken');

    if (directStorageToken) {
      logger.warn('Token not found via firebaseTokenStorage but found in direct storage access - using fallback', {
        correlationId,
        tokenLength: directStorageToken.length,
        source: sessionStorage.getItem('firebase-idToken') ? 'sessionStorage' : 'localStorage'
      });

      // Use the directly retrieved token as fallback
      tokens = { ...tokens, idToken: directStorageToken };
    } else {
      logger.warn('No authentication token available in firebaseTokenStorage or direct storage, triggering session expiry notification', { correlationId })
      // Use graceful session expiry notification instead of abrupt redirect
      authStore.triggerSessionExpiryNotification()
      throw new Error('No authentication token available')
    }
  }

  // Prepare headers with auth
  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${tokens.idToken}`)
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json')

  const fetchOptions: RequestInit = {
    ...options,
    headers
  }

  let retryCount = 0
  const MAX_RETRIES = 1

  while (retryCount <= MAX_RETRIES) {
    try {
      logger.debug('Making HTTP request', {
        correlationId,
        url,
        method: fetchOptions.method || 'GET',
        attempt: retryCount + 1,
        maxRetries: MAX_RETRIES + 1
      })

      const response = await fetch(url, fetchOptions)
      const responseTime = Date.now() - startTime

      logger.debug('HTTP response received', {
        correlationId,
        status: response.status,
        statusText: response.statusText,
        responseTime,
        contentType: response.headers.get('Content-Type')
      })

      // Handle Cloudflare rate limiting (429 with "error code: 1015")
      if (response.status === 429) {
        const contentType = response.headers.get('Content-Type')
        if (contentType && contentType.includes('text/plain')) {
          const bodyText = await response.clone().text()
          if (bodyText.includes('error code: 1015')) {
            logger.error('Cloudflare rate limit detected (error code: 1015)', {
              correlationId,
              bodyText,
              retryAfter: response.headers.get('Retry-After')
            })
            activateRateLimit()
            throw new Error('Cloudflare rate limit detected. Global timeout activated for 10 seconds.')
          }
        }
      }

      // Enhanced context-aware authentication error handling (401 and 403)
      const authErrorResult = await handleAuthError(response, retryCount, correlationId)

      if (authErrorResult.shouldRetry && authErrorResult.newToken) {
        // Get updated tokens after successful refresh
        tokens = firebaseTokenStorage.getTokens()

        if (!tokens.idToken) {
          logger.error('Context-aware token refresh succeeded but no new token available', { correlationId })
          authStore.triggerSessionExpiryNotification()
          throw new Error('Token refresh succeeded but no new token available')
        }

        // Update Authorization header with new token
        const newHeaders = new Headers(fetchOptions.headers)
        newHeaders.set('Authorization', `Bearer ${tokens.idToken}`)
        fetchOptions.headers = newHeaders

        logger.info('Context-aware token refresh completed, retrying request', {
          correlationId,
          newTokenLength: tokens.idToken.length
        })

        retryCount++
        continue // Retry the request

      } else if (authErrorResult.error) {
        // Auth error handling failed
        logger.error('Context-aware auth error handling failed', {
          correlationId,
          error: authErrorResult.error.message,
          responseTime: Date.now() - startTime
        })

        throw new Error(`Context-aware authentication failed: ${authErrorResult.error.message}`)
      }

      // Handle final authentication failure after retry
      if ((response.status === 401 || response.status === 403) && retryCount >= MAX_RETRIES) {
        logger.error('Authentication failed after maximum retries, triggering session expiry notification', {
          correlationId,
          status: response.status,
          attempts: retryCount + 1
        })

        // Use graceful session expiry notification instead of abrupt redirect
        authStore.triggerSessionExpiryNotification()
        throw new Error('Authentication failed after maximum retry attempts')
      }

      // Success case - return the response
      logger.info('Request completed successfully', {
        correlationId,
        status: response.status,
        responseTime,
        attempts: retryCount + 1
      })

      return response

    } catch (fetchError) {
      const responseTime = Date.now() - startTime

      if (fetchError instanceof Error && fetchError.message.includes('rate limit')) {
        // Rate limit error - don't retry
        logger.error('Request failed due to rate limiting', {
          correlationId,
          error: fetchError.message,
          responseTime
        })
        throw fetchError
      }

      if (fetchError instanceof Error && fetchError.message.includes('Authentication failed')) {
        // Auth error - don't retry, but ensure session expiry notification is shown
        logger.error('Request failed due to authentication', {
          correlationId,
          error: fetchError.message,
          responseTime
        })

        // Ensure session expiry notification is triggered if not already
        if (!fetchError.message.includes('session expiry notification triggered')) {
          authStore.triggerSessionExpiryNotification()
        }

        throw fetchError
      }

      // Network or other errors
      logger.error('Fetch request failed', {
        correlationId,
        error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        responseTime,
        attempt: retryCount + 1
      })

      throw fetchError
    }
  }

  // This should never be reached due to the loop structure
  throw new Error('Unexpected end of retry loop')
}

/**
 * Export utility functions for rate limiting
 */
export const rateLimitUtils = {
  isRateLimited,
  activateRateLimit,
  getRemainingTime: () => {
    const authStore = getGlobalAuthStore()
    const rateLimitInfo = authStore.getRateLimitInfo()
    return rateLimitInfo.remainingMs
  }
}