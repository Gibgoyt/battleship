interface BlockhashData {
	success: boolean
	blockhash: string
	cached?: boolean
	timestamp?: number
}

interface Response200 {
	status: 200
	data: BlockhashData
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
 * Get recent blockhash from Solana network (no authentication required)
 * GET /api/solana/network/recent-blockhash
 * @returns A promise that resolves to the typed response data
 */
export async function GET(): Promise<GetResponse> {
	try {
		const url = 'https://devbackend.splitdo.app:8443/api/solana/network/recent-blockhash'

		console.log('[DevbackendNoAuth RecentBlockhash GET] Fetching recent blockhash from:', url)

		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
			}
		})

		const responseData = await response.json()

		// Handle different response statuses
		switch (response.status) {
			case 200:
				console.log('[DevbackendNoAuth RecentBlockhash GET] Successfully retrieved blockhash:', responseData.blockhash)
				return {
					status: 200,
					data: responseData
				}
			case 400:
				console.log('[DevbackendNoAuth RecentBlockhash GET] Bad request:', responseData)
				return {
					status: 400,
					data: responseData
				}
			case 404:
				console.log('[DevbackendNoAuth RecentBlockhash GET] Blockhash endpoint not found:', responseData)
				return {
					status: 404,
					data: responseData
				}
			case 429:
				console.log('[DevbackendNoAuth RecentBlockhash GET] Rate limit exceeded')
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
				console.log('[DevbackendNoAuth RecentBlockhash GET] Server error:', responseData)
				return {
					status: 500,
					data: responseData
				}
			default:
				throw new Error(`Unexpected HTTP status: ${response.status}`)
		}
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log("DevbackendNoAuth RecentBlockhash API call failed: " + error.message)
		} else {
			console.log("An unknown error occurred in DevbackendNoAuth RecentBlockhash API call")
		}
		throw error
	}
}
