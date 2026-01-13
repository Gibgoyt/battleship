interface VaultData {
	sol_vault_address: string
}

interface Response200 {
	status: 200
	data: {
		data: VaultData
	}
}

interface Response400 {
	status: 400
	data: {
		error: string
		message?: string
	}
}

interface Response404 {
	status: 404
	data: {
		error: string
		message?: string
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
		error: string
		message?: string
	}
}

export type GetResponse = Response200 | Response400 | Response404 | Response429 | Response500

/**
 * Get SOL vault address for token exchange (no authentication required)
 * GET /api/splitdo-token/exchange/solana/vault
 * @returns A promise that resolves to the typed response data
 */
export async function GET(): Promise<GetResponse> {
	try {
		const url = 'https://devbackend.splitdo.app:8443/api/splitdo-token/exchange/solana/vault'

		console.log('[DevbackendNoAuth Vault GET] Fetching SOL vault address from:', url)

		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
				'User-Agent': 'SPLITDO-App/1.0'
			}
		})

		const responseData = await response.json()

		// Handle different response statuses
		switch (response.status) {
			case 200:
				console.log('[DevbackendNoAuth Vault GET] Successfully retrieved vault address:', responseData.data?.sol_vault_address)
				return {
					status: 200,
					data: responseData
				}
			case 400:
				console.log('[DevbackendNoAuth Vault GET] Bad request:', responseData)
				return {
					status: 400,
					data: responseData
				}
			case 404:
				console.log('[DevbackendNoAuth Vault GET] Vault not found:', responseData)
				return {
					status: 404,
					data: responseData
				}
			case 429:
				console.log('[DevbackendNoAuth Vault GET] Rate limit exceeded')
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
				console.log('[DevbackendNoAuth Vault GET] Server error:', responseData)
				return {
					status: 500,
					data: responseData
				}
			default:
				throw new Error(`Unexpected HTTP status: ${response.status}`)
		}
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log("DevbackendNoAuth Vault API call failed: " + error.message)
		} else {
			console.log("An unknown error occurred in DevbackendNoAuth Vault API call")
		}
		throw error
	}
}