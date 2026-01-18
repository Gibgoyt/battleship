export interface UrlParameters {
	ids?: string
	vs_currencies?: string
	include_market_cap?: boolean
	include_24hr_vol?: boolean
	include_24hr_change?: boolean
	include_last_updated_at?: boolean
	precision?: number
}

interface CoinPriceData {
	usd?: number
	usd_market_cap?: number
	usd_24h_vol?: number
	usd_24h_change?: number
	last_updated_at?: number
}

interface Response200 {
	status: 200
	data: {
		[coinId: string]: CoinPriceData
	}
}

interface Response400 {
	status: 400
	data: {
		error: string
	}
}

interface Response404 {
	status: 404
	data: {
		error: string
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

export type GetResponse = Response200 | Response400 | Response404 | Response429

/*
 * Get simple price data from CoinGecko API
 *
 * GET /api/v3/simple/price
 *
 * @param urlParameters Optional URL parameters for the API call
 * @returns A promise that resolves to the typed response data
 */
export async function GET(urlParameters?: UrlParameters): Promise<GetResponse> {
	try {
		// Build URL with parameters
		const baseUrl = 'https://api.coingecko.com/api/v3/simple/price'
		const url = new URL(baseUrl)

		if (urlParameters) {
			Object.entries(urlParameters).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					url.searchParams.append(key, String(value))
				}
			})
		}

		console.log('[CoinGecko GET] Fetching price data from:', url.toString())

		const response = await fetch(url.toString(), {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
			}
		})

		const responseData = await response.json()

		// Handle different response statuses
		switch (response.status) {
			case 200:
				console.log('[CoinGecko GET] Successfully retrieved price data:', responseData)
				return {
					status: 200,
					data: responseData
				}
			case 400:
				console.log('[CoinGecko GET] Bad request')
				return {
					status: 400,
					data: responseData
				}
			case 404:
				console.log('[CoinGecko GET] Price data not found')
				return {
					status: 404,
					data: responseData
				}
			case 429:
				console.log('[CoinGecko GET] Rate limit exceeded')
				const retryAfter = response.headers.get('Retry-After')
				return {
					status: 429,
					data: {
						error: 'rate_limit_exceeded',
						message: responseData?.error || 'Rate limit exceeded. Please try again later.',
						retry_after: retryAfter ? parseInt(retryAfter) : undefined
					}
				}
			default:
				throw new Error(`Unexpected HTTP status: ${response.status}`)
		}
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log("CoinGecko API call failed: " + error.message)
		} else {
			console.log("An unknown error occurred in CoinGecko API call")
		}
		throw error
	}
}
