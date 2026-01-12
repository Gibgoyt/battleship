import { fetchMiddleware } from '../../../../../../fetch-wrapper'
import { createLogger } from '../../../../../../../../../lib/logger'

const logger = createLogger('[History GET Endpoint]')

interface SignatureInfo {
	blockTime: number
	confirmationStatus: "finalized"
	signature: string
	slot: number
}

interface SignatureHistoryData {
	count: number
	last_updated: string
	limit: number
	signatures: SignatureInfo[]
	token_account_pubkey: string
}

interface HistoryInfo {
	success: true
	user_id: string
	token_account_pubkey: string
	splitdo_token_mint: "6vdfHTgLiEXvoGVp8Ga2HaKQsPKj6DrUTee7526SCXoM"
	limit: number
	last_updated: string
	signature_history: SignatureHistoryData
}

interface Response200 {
	status: 200
	data: HistoryInfo
}

interface Response400 {
	status: 400
	data: {
		success: false
		error: string
		message: string
	}
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

interface Response422 {
	status: 422
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

interface Response502 {
	status: 502
	data: {
		success: false
		error: string
		message: string
	}
}

interface Response503 {
	status: 503
	data: {
		success: false
		error: string
		message: string
	}
}

export type GetResponse = Response200 | Response400 | Response401 | Response403 | Response404 | Response422 | Response429 | Response502 | Response503

/**
 * Get user's token transaction history with automatic Firebase JWT auth handling
 *
 * GET /api/splitdo-token/history/:index
 *
 * @param index - Number of recent transactions to retrieve (1-50)
 * @returns A promise that resolves to the typed response data
 */
export async function GET(index: number): Promise<GetResponse> {
	// Client-side parameter validation for better UX
	if (!Number.isInteger(index) || index < 1 || index > 50) {
		logger.warn('Invalid index parameter provided', { index })
		return {
			status: 400,
			data: {
				success: false,
				error: 'invalid_parameter',
				message: 'Index must be an integer between 1 and 50'
			}
		}
	}

	try {
		logger.info('Starting history retrieval request', { index })

		let response = await fetchMiddleware(`https://devbackend.splitdo.app:8443/api/splitdo-token/history/${index}`, {
			method: "GET"
			// fetchMiddleware automatically handles:
			// - Authorization header injection
			// - 401/403 retry logic with token refresh
			// - Global rate limiting (Cloudflare 1015)
			// - Session expiry notification on final auth failure
		})

		// Enhanced: If 401 and fetchMiddleware didn't handle it, try direct refresh once
		if (response.status === 401) {
			logger.warn('History endpoint received 401, attempting direct token refresh')

			try {
				// Import auth store dynamically to avoid circular dependencies
				const { getGlobalAuthStore } = await import('../../../../../../firebase/auth-store')
				const authStore = getGlobalAuthStore()
				await authStore.refreshToken() // Uses fallback mechanism

				// Retry the request exactly once
				response = await fetchMiddleware(`https://devbackend.splitdo.app:8443/api/splitdo-token/history/${index}`, {
					method: "GET"
				})

				// If still 401, don't retry again
				if (response.status === 401) {
					logger.error('History endpoint still receiving 401 after token refresh - auth failure')
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
				logger.error('Direct token refresh failed in history endpoint', {
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
				logger.info('Successfully retrieved history data', {
					userId: responseData.user_id,
					tokenAccount: responseData.token_account_pubkey,
					signatureCount: responseData.signature_history?.count,
					limit: responseData.limit
				})
				return {
					status: 200,
					data: responseData
				}
			case 400:
				logger.warn('Bad request - invalid index parameter', {
					index,
					response: responseData
				})
				return {
					status: 400,
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
				logger.info('History data not found (user may not have token account)', {
					response: responseData
				})
				return {
					status: 404,
					data: responseData
				}
			case 422:
				logger.warn('Unprocessable entity - missing token account data', {
					response: responseData
				})
				return {
					status: 422,
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
			case 502:
				logger.error('Bad gateway - Solana RPC JSON parse error', {
					response: responseData
				})
				return {
					status: 502,
					data: responseData
				}
			case 503:
				logger.error('Service unavailable - Solana RPC error', {
					response: responseData
				})
				return {
					status: 503,
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
			logger.error("History endpoint failed", {
				error: error.message,
				stack: error.stack,
				index
			})
		} else {
			logger.error("Unknown error in history endpoint", { error, index })
		}
		throw error
	}
}