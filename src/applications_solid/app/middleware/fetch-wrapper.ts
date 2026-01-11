/**
 * Centralized fetch wrapper for SolidJS middleware system
 * Handles automatic token injection, 401/403 retry logic, and global rate limiting
 */

import { createLogger } from 'src/lib/logger'
import { getGlobalAuthStore } from './firebase/auth-store'
import { firebaseTokenStorage } from '../../../lib/auth/firebase-token-storage'

const logger = createLogger('[fetchMiddleware]')

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
  // Check global rate limit first
  if (isRateLimited()) {
    const authStore = getGlobalAuthStore()
    const rateLimitInfo = authStore.getRateLimitInfo()
    const remainingTime = Math.ceil(rateLimitInfo.remainingMs / 1000)
    logger.warn(`Request blocked due to global rate limit. ${remainingTime}s remaining`, {
      reason: rateLimitInfo.reason,
      correlationId
    })
    throw new Error(`Global rate limit active (${rateLimitInfo.reason}). Please wait ${remainingTime} seconds.`)
  }

  const startTime = Date.now()
  const correlationId = Math.random().toString(36).substr(2, 9)

  logger.debug('Fetch middleware request initiated', {
    correlationId,
    url,
    method: options.method || 'GET'
  })

  // Get auth store and current tokens
  const authStore = getGlobalAuthStore()
  let tokens = firebaseTokenStorage.getTokens()

  // Check if we have a valid token
  if (!tokens.idToken) {
    logger.warn('No authentication token available, redirecting to sign-in', { correlationId })
    window.location.href = '/auth/sign-in'
    throw new Error('No authentication token available')
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

      // Handle authentication errors (401 and 403)
      if ((response.status === 401 || response.status === 403) && retryCount < MAX_RETRIES) {
        logger.warn(`Authentication error ${response.status}, attempting token refresh`, {
          correlationId,
          attempt: retryCount + 1,
          status: response.status
        })

        try {
          // Attempt token refresh
          await authStore.refreshToken()

          // Get updated tokens
          tokens = firebaseTokenStorage.getTokens()

          if (!tokens.idToken) {
            logger.error('Token refresh failed, no new token available', { correlationId })
            window.location.href = '/auth/sign-in'
            throw new Error('Token refresh failed')
          }

          // Update Authorization header with new token
          const newHeaders = new Headers(fetchOptions.headers)
          newHeaders.set('Authorization', `Bearer ${tokens.idToken}`)
          fetchOptions.headers = newHeaders

          logger.info('Token refreshed successfully, retrying request', {
            correlationId,
            newTokenLength: tokens.idToken.length
          })

          retryCount++
          continue // Retry the request

        } catch (refreshError) {
          logger.error('Token refresh failed', {
            correlationId,
            error: refreshError instanceof Error ? refreshError.message : 'Unknown error'
          })

          window.location.href = '/auth/sign-in'
          throw new Error('Authentication failed after refresh attempt')
        }
      }

      // Handle final authentication failure after retry
      if ((response.status === 401 || response.status === 403) && retryCount >= MAX_RETRIES) {
        logger.error('Authentication failed after maximum retries, redirecting to sign-in', {
          correlationId,
          status: response.status,
          attempts: retryCount + 1
        })

        window.location.href = '/auth/sign-in'
        throw new Error('Authentication failed after retry')
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
        // Auth error - don't retry
        logger.error('Request failed due to authentication', {
          correlationId,
          error: fetchError.message,
          responseTime
        })
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