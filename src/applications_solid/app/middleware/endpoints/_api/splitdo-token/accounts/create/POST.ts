import { fetchMiddleware } from '../../../../../fetch-wrapper'
import { createLogger } from '../../../../../../../../lib/logger'

const logger = createLogger('[SplitDo Token Accounts Create POST Endpoint]')

interface CreateAccountParams {
	wallet_address: string
	token_account_address: string
	signed_transaction: string
}

interface CreateAccountData {
	wallet_address: string
	token_account_address: string
	transaction_signature?: string
	created_at?: string
	confirmed?: boolean
}

interface CreateAccountResponse {
	data: CreateAccountData
	success: true
}

interface Response200 {
	status: 200
	data: CreateAccountResponse
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

interface Response409 {
	status: 409
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

interface Response500 {
	status: 500
	data: {
		success: false
		error: string
		message: string
	}
}

export type PostResponse = Response200 | Response400 | Response401 | Response403 | Response409 | Response422 | Response429 | Response500

/*
 * Create SplitDo token account with automatic Firebase JWT auth handling
 *
 * POST /api/splitdo-token/accounts/create
 *
 * @param params - Account creation parameters
 * @returns A promise that resolves to the typed response data
 */
export async function POST(params: CreateAccountParams): Promise<PostResponse> {
	// Client-side parameter validation for better UX
	if (!params.wallet_address || !params.token_account_address || !params.signed_transaction) {
		logger.warn('Invalid parameters provided for account creation', {
			hasWalletAddress: !!params.wallet_address,
			hasTokenAccountAddress: !!params.token_account_address,
			hasSignedTransaction: !!params.signed_transaction
		})
		return {
			status: 400,
			data: {
				success: false,
				error: 'invalid_parameters',
				message: 'Missing required parameters: wallet_address, token_account_address, and signed_transaction are required'
			}
		}
	}

	// Validate wallet address format (basic Solana address validation)
	if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(params.wallet_address)) {
		logger.warn('Invalid wallet address format', { wallet_address: params.wallet_address })
		return {
			status: 400,
			data: {
				success: false,
				error: 'invalid_wallet_address',
				message: 'Invalid Solana wallet address format'
			}
		}
	}

	// Validate token account address format
	if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(params.token_account_address)) {
		logger.warn('Invalid token account address format', { token_account_address: params.token_account_address })
		return {
			status: 400,
			data: {
				success: false,
				error: 'invalid_token_account_address',
				message: 'Invalid Solana token account address format'
			}
		}
	}

	try {
		logger.info('Starting SplitDo token account creation request', {
			wallet_address: params.wallet_address,
			token_account_address: params.token_account_address,
			signed_transaction_length: params.signed_transaction.length
		})

		let response = await fetchMiddleware('https://devbackend.splitdo.app:8443/api/splitdo-token/accounts/create', {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(params)
			// fetchMiddleware automatically handles:
			// - Authorization header injection
			// - 401/403 retry logic with token refresh
			// - Global rate limiting (Cloudflare 1015)
			// - Session expiry notification on final auth failure
		})

		// Enhanced: If 401 and fetchMiddleware didn't handle it, try direct refresh once
		if (response.status === 401) {
			logger.warn('Account create endpoint received 401, attempting direct token refresh')

			try {
				// Import auth store dynamically to avoid circular dependencies
				const { getGlobalAuthStore } = await import('../../../../../firebase/auth-store')
				const authStore = getGlobalAuthStore()
				await authStore.refreshToken() // Uses fallback mechanism

				// Retry the request exactly once
				response = await fetchMiddleware('https://devbackend.splitdo.app:8443/api/splitdo-token/accounts/create', {
					method: "POST",
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(params)
				})

				// If still 401, don't retry again
				if (response.status === 401) {
					logger.error('Account create endpoint still receiving 401 after token refresh - auth failure')
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
				logger.error('Direct token refresh failed in account create endpoint', {
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
				logger.info('Successfully created SplitDo token account', {
					wallet_address: responseData.data?.wallet_address,
					token_account_address: responseData.data?.token_account_address,
					transaction_signature: responseData.data?.transaction_signature,
					success: responseData.success
				})
				return {
					status: 200,
					data: responseData
				}
			case 400:
				logger.warn('Bad request - invalid account creation parameters', {
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
			case 409:
				logger.info('Account already exists for this wallet', {
					response: responseData
				})
				return {
					status: 409,
					data: responseData
				}
			case 422:
				logger.warn('Unprocessable entity - invalid signed transaction', {
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
			case 500:
				logger.error('Internal server error from account create endpoint', {
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
			logger.error("SplitDo token account create endpoint failed", {
				error: error.message,
				stack: error.stack,
				wallet_address: params.wallet_address,
				token_account_address: params.token_account_address
			})
		} else {
			logger.error("Unknown error in account create endpoint", { error, params })
		}
		throw error
	}
}