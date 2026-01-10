import { getGlobalAuthStore } from '../../../../../firebase/auth-store'
import { firebaseTokenStorage } from '../../../../../../../../lib/auth/firebase-token-storage'

interface BalanceInfo {
	user_id: string
	token_account_pubkey: string
	token_balance: number
	equivalent_usdc: number
	exchange_rate: number
	last_updated: string
}

interface Response200 {
	status: 200
	data: {
		success: true
		data: BalanceInfo
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

export type GetResponse = Response200 | Response401 | Response403 | Response404

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