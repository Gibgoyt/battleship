import { getGlobalAuthStore } from '../../../../../firebase/auth-store'
import { firebaseTokenStorage } from '../../../../../../../../lib/auth/firebase-token-storage'

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
		// Get auth store and current token
		const authStore = getGlobalAuthStore()
		const tokens = firebaseTokenStorage.getTokens()

		if (!tokens.idToken) {
			// No token available, redirect to login
			window.location.href = '/auth/sign-in'
			throw new Error('No authentication token available')
		}

		let retryCount = 0
		const MAX_RETRIES = 1

		while (retryCount <= MAX_RETRIES) {
			try {
				const response = await fetch('https://devbackend.splitdo.app:8443/api/splitdo-token/balance', {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						"Authorization": `Bearer ${tokens.idToken}`
					}
				})

				const responseData = await response.json()

				// Handle 403 with retry logic
				if (response.status === 403 && retryCount < MAX_RETRIES) {
					console.log(`[GET Balance] Received 403, attempting token refresh (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`)
					await authStore.refreshToken()
					const newTokens = firebaseTokenStorage.getTokens()
					tokens.idToken = newTokens.idToken // Update token for retry
					retryCount++
					continue
				}

				// Second 403 or refresh failed - redirect to sign-in
				if (response.status === 403 && retryCount === MAX_RETRIES) {
					console.log('[GET Balance] Authentication failed after retry, redirecting to sign-in')
					window.location.href = '/auth/sign-in'
					throw new Error('Authentication failed - redirecting to sign-in')
				}

				// Return structured response based on status
				switch (response.status) {
					case 200:
						console.log('[GET Balance] Successfully retrieved balance data')
						return {
							status: 200,
							data: responseData
						}
					case 401:
						console.log('[GET Balance] Unauthorized access')
						return {
							status: 401,
							data: responseData
						}
					case 403:
						console.log('[GET Balance] Forbidden access')
						return {
							status: 403,
							data: responseData
						}
					case 404:
						console.log('[GET Balance] Balance data not found')
						return {
							status: 404,
							data: responseData
						}
					case 429:
						console.log('[GET Balance] Rate limit exceeded (CloudFlare error 1015)')
						// Extract retry-after header if available
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
						throw new Error(`Unexpected HTTP status: ${response.status}`)
				}
			} catch (fetchError: unknown) {
				if (fetchError instanceof Error) {
					console.log("Failed to fetch balance data: " + fetchError.message)
				} else {
					console.log("An unknown error occurred during balance fetch")
				}
				throw fetchError
			}
		}

		// This should never be reached due to the loop structure, but TypeScript needs it
		throw new Error('Unexpected end of retry loop')
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log("GET Balance endpoint failed: " + error.message)
		} else {
			console.log("An unknown error occurred in GET Balance endpoint")
		}
		throw error
	}
}