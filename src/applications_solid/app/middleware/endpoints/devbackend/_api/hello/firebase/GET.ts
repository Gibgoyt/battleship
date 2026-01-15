import { fetchMiddleware } from '../../../../../fetch-wrapper'
import { createLogger } from '../../../../../../../../lib/logger'

const logger = createLogger('[Hello Firebase GET Endpoint]')

interface HelloResponse {
	authenticated: boolean
	user?: {
		id: string
		email: string
	}
	token_info?: {
		expires_at: number
	}
}

interface Response200 {
	status: 200
	data: HelloResponse & { authenticated: true }
}

interface Response401 {
	status: 401
	data: {
		authenticated: false
		error: string
		message: string
	}
}

interface Response403 {
	status: 403
	data: {
		authenticated: false
		error: string
		message: string
	}
}

interface Response404 {
	status: 404
	data: {
		success: false
		error: string
		message: string
	}
}

interface Response429 {
	status: 429
	data: {
		error: string
		message: string
		retry_after?: number
	}
}

interface Response500 {
	status: 500
	data: {
		success: false
		error: string
		message: string
	}
}

export type GetResponse = Response200 | Response401 | Response403 | Response404 | Response429 | Response500

/*
 * Test Firebase authentication with automatic JWT auth handling
 *
 * GET /api/hello/firebase
 *
 * @returns A promise that resolves to the typed response data
 */
export async function GET(): Promise<GetResponse> {
	try {
		logger.info('Starting hello/firebase authentication test request')

		let response = await fetchMiddleware('https://devbackend.splitdo.app:8443/api/hello/firebase', {
			method: "GET"
			// fetchMiddleware automatically handles:
			// - Authorization header injection
			// - 401/403 retry logic with token refresh
			// - Global rate limiting (Cloudflare 1015)
			// - Session expiry notification on final auth failure
		})

		// Enhanced: If 401 and fetchMiddleware didn't handle it, try direct refresh once
		if (response.status === 401) {
			logger.warn('Hello Firebase endpoint received 401, attempting direct token refresh')

			try {
				// Import auth store dynamically to avoid circular dependencies
				const { getGlobalAuthStore } = await import('../../../../../firebase/auth-store')
				const authStore = getGlobalAuthStore()
				await authStore.refreshToken() // Uses fallback mechanism

				// Retry the request exactly once
				response = await fetchMiddleware('https://devbackend.splitdo.app:8443/api/hello/firebase', {
					method: "GET"
				})

				// If still 401, don't retry again
				if (response.status === 401) {
					logger.error('Hello Firebase endpoint still receiving 401 after token refresh - auth failure')
					return {
						status: 401,
						data: {
							authenticated: false,
							error: 'authentication_failed',
							message: 'Session expired, please log in again'
						}
					}
				}

			} catch (refreshError) {
				logger.error('Direct token refresh failed in hello/firebase endpoint', {
					error: refreshError instanceof Error ? refreshError.message : 'Unknown error'
				})
				return {
					status: 401,
					data: {
						authenticated: false,
						error: 'token_refresh_failed',
						message: 'Unable to refresh authentication token'
					}
				}
			}
		}

		const responseData = await response.json()

		// Return structured response based on status
		switch (response.status) {
			case 200:
				logger.info('Successfully authenticated with Firebase', {
					authenticated: responseData.authenticated,
					userId: responseData.user?.id,
					userEmail: responseData.user?.email,
					tokenExpires: responseData.token_info?.expires_at ? new Date(responseData.token_info.expires_at * 1000).toISOString() : 'Unknown'
				})
				return {
					status: 200,
					data: responseData
				}
			case 401:
				logger.warn('Unauthorized access - authentication failed')
				return {
					status: 401,
					data: {
						authenticated: false,
						error: responseData.error || 'unauthorized',
						message: responseData.message || 'Authentication required'
					}
				}
			case 403:
				logger.warn('Forbidden access - invalid or expired token')
				return {
					status: 403,
					data: {
						authenticated: false,
						error: responseData.error || 'forbidden',
						message: responseData.message || 'Access forbidden'
					}
				}
			case 404:
				logger.info('Hello Firebase endpoint not found', {
					response: responseData
				})
				return {
					status: 404,
					data: responseData
				}
			case 429:
				// This is handled by fetchMiddleware for Cloudflare 1015, but might be other rate limiting
				logger.warn('Rate limit exceeded', {
					retryAfter: response.headers.get('Retry-After'),
					response: responseData
				})
				const retryAfter = response.headers.get('Retry-After')
				return {
					status: 429,
					data: {
						error: 'rate_limit_exceeded',
						message: responseData?.message || 'Rate limit exceeded. Please try again later.',
						retry_after: retryAfter ? parseInt(retryAfter) : undefined
					}
				}
			case 500:
				logger.error('Internal server error from hello/firebase endpoint', {
					response: responseData
				})
				return {
					status: 500,
					data: responseData
				}
			default:
				logger.error('Unexpected HTTP status received', {
					status: response.status,
					statusText: response.statusText,
					response: responseData
				})
				throw new Error(`Unexpected HTTP status: ${response.status}`)
		}
	} catch (error: unknown) {
		if (error instanceof Error) {
			logger.error("Hello Firebase endpoint failed", {
				error: error.message,
				stack: error.stack
			})
		} else {
			logger.error("Unknown error in hello/firebase endpoint", { error })
		}
		throw error
	}
}