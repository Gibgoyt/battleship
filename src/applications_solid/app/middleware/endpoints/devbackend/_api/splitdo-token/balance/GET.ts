import { fetchMiddleware } from '../../../../../fetch-wrapper'
import { createLogger } from '../../../../../../../../lib/logger'

const logger = createLogger('[Balance GET Endpoint]')

interface MainnetResponse {
	balance: number
	decimals: number
	last_updated: string
	ui_amount_string: string
}

interface BalanceInfo {
	last_updated: string
	mainnet_response: MainnetResponse
	splitdo_token_mint: string
	success: true
	token_account_pubkey: string
	user_id: string
}

interface Response200 {
	status: 200
	data: BalanceInfo
}

interface Response401 {
	status: 401
	data: {
		success: false
		error: string
		message: string
	}
}

interface Response403 {
	status: 403
	data: {
		success: false
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

export type GetResponse = Response200 | Response401 | Response403 | Response404 | Response429

/*
 * Get user's token balance with automatic Firebase JWT auth handling
 *
 * GET /api/splitdo-token/balance
 *
 * @returns A promise that resolves to the typed response data
 */
export async function GET(): Promise<GetResponse> {
	try {
		logger.info('Starting balance retrieval request')

		let response = await fetchMiddleware('https://devbackend.splitdo.app:8443/api/splitdo-token/balance', {
			method: "GET"
			// fetchMiddleware automatically handles:
			// - Authorization header injection
			// - 401/403 retry logic with token refresh
			// - Global rate limiting (Cloudflare 1015)
			// - Session expiry notification on final auth failure
		})

		// Enhanced: If 401 and fetchMiddleware didn't handle it, try direct refresh once
		if (response.status === 401) {
			logger.warn('Balance endpoint received 401, attempting direct token refresh')

			try {
				// Import auth store dynamically to avoid circular dependencies
				const { getGlobalAuthStore } = await import('../../../../../firebase/auth-store')
				const authStore = getGlobalAuthStore()
				await authStore.refreshToken() // Uses fallback mechanism

				// Retry the request exactly once
				response = await fetchMiddleware('https://devbackend.splitdo.app:8443/api/splitdo-token/balance', {
					method: "GET"
				})

				// If still 401, don't retry again
				if (response.status === 401) {
					logger.error('Balance endpoint still receiving 401 after token refresh - auth failure')
					return {
						status: 401,
						data: {
							success: false,
							error: 'authentication_failed',
							message: 'Session expired, please log in again'
						}
					}
				}

			} catch (refreshError) {
				logger.error('Direct token refresh failed in balance endpoint', {
					error: refreshError instanceof Error ? refreshError.message : 'Unknown error'
				})
				return {
					status: 401,
					data: {
						success: false,
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
				logger.info('Successfully retrieved balance data', {
					userId: responseData.user_id,
					tokenAccount: responseData.token_account_pubkey,
					balance: responseData.mainnet_response?.balance
				})
				return {
					status: 200,
					data: responseData
				}
			case 401:
				logger.warn('Unauthorized access - this should not happen with fetchMiddleware')
				return {
					status: 401,
					data: responseData
				}
			case 403:
				logger.warn('Forbidden access - this should not happen with fetchMiddleware')
				return {
					status: 403,
					data: responseData
				}
			case 404:
				logger.info('Balance data not found (user may not have token account)', {
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
						message: responseData || 'Rate limit exceeded. Please try again later.',
						retry_after: retryAfter ? parseInt(retryAfter) : undefined
					}
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
			logger.error("Balance endpoint failed", {
				error: error.message,
				stack: error.stack
			})
		} else {
			logger.error("Unknown error in balance endpoint", { error })
		}
		throw error
	}
}