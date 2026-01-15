import { fetchMiddleware } from '../../../../../fetch-wrapper'
import { createLogger } from '../../../../../../../../lib/logger'

const logger = createLogger('[SplitDo Token Program Info GET Endpoint]')

interface ProgramInfoData {
	utility_token_mint: string
	program_id?: string
	decimals?: number
	total_supply?: string
	description?: string
}

interface ProgramInfoResponse {
	data: ProgramInfoData
	success: true
}

interface Response200 {
	status: 200
	data: ProgramInfoResponse
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
 * Get SplitDo token program information with automatic Firebase JWT auth handling
 *
 * GET /api/splitdo-token/program/info
 *
 * @returns A promise that resolves to the typed response data containing token mint and program details
 */
export async function GET(): Promise<GetResponse> {
	try {
		logger.info('Starting SplitDo token program info retrieval request')

		let response = await fetchMiddleware('https://devbackend.splitdo.app:8443/api/splitdo-token/program/info', {
			method: "GET"
			// fetchMiddleware automatically handles:
			// - Authorization header injection
			// - 401/403 retry logic with token refresh
			// - Global rate limiting (Cloudflare 1015)
			// - Session expiry notification on final auth failure
		})

		// Enhanced: If 401 and fetchMiddleware didn't handle it, try direct refresh once
		if (response.status === 401) {
			logger.warn('Program info endpoint received 401, attempting direct token refresh')

			try {
				// Import auth store dynamically to avoid circular dependencies
				const { getGlobalAuthStore } = await import('../../../../../firebase/auth-store')
				const authStore = getGlobalAuthStore()
				await authStore.refreshToken() // Uses fallback mechanism

				// Retry the request exactly once
				response = await fetchMiddleware('https://devbackend.splitdo.app:8443/api/splitdo-token/program/info', {
					method: "GET"
				})

				// If still 401, don't retry again
				if (response.status === 401) {
					logger.error('Program info endpoint still receiving 401 after token refresh - auth failure')
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
				logger.error('Direct token refresh failed in program info endpoint', {
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
				logger.info('Successfully retrieved SplitDo token program info', {
					tokenMint: responseData.data?.utility_token_mint,
					programId: responseData.data?.program_id,
					decimals: responseData.data?.decimals,
					success: responseData.success
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
				logger.info('Program info not found', {
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
				logger.error('Internal server error from program info endpoint', {
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
			logger.error("SplitDo token program info endpoint failed", {
				error: error.message,
				stack: error.stack
			})
		} else {
			logger.error("Unknown error in program info endpoint", { error })
		}
		throw error
	}
}