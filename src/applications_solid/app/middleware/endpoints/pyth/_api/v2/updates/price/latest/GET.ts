/**
 * Pyth Hermes REST API - Get Latest Price Updates
 * 
 * GET https://hermes.pyth.network/v2/updates/price/latest
 * 
 * SOL/USD Price Feed ID: 0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d
 */

// Well-known Pyth price feed IDs
export const PRICE_FEED_IDS = {
	SOL_USD: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
	BTC_USD: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
	ETH_USD: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
} as const

export interface UrlParameters {
	ids: string[]
}

export interface PythPriceData {
	price: string
	conf: string
	expo: number
	publish_time: number
}

export interface PythParsedPrice {
	id: string
	price: PythPriceData
	ema_price: PythPriceData
	metadata: {
		slot: number
		proof_available_time: number
		prev_publish_time: number
	}
}

interface Response200 {
	status: 200
	data: {
		parsed: PythParsedPrice[]
	}
}

interface ResponseError {
	status: 400 | 404 | 429 | 500
	data: {
		error: string
	}
}

export type GetResponse = Response200 | ResponseError

/**
 * Convert Pyth price data to a human-readable number
 * price = price_value * 10^expo
 */
export function parsePythPrice(priceData: PythPriceData): number {
	return parseInt(priceData.price) * Math.pow(10, priceData.expo)
}

/**
 * Get latest price updates from Pyth Hermes API
 */
export async function GET(urlParameters: UrlParameters): Promise<GetResponse> {
	try {
		const baseUrl = 'https://hermes.pyth.network/v2/updates/price/latest'
		const url = new URL(baseUrl)

		// Add each price feed ID as a separate ids[] parameter
		for (const id of urlParameters.ids) {
			url.searchParams.append('ids[]', id)
		}

		console.log('[Pyth GET] Fetching price data from:', url.toString())

		const response = await fetch(url.toString(), {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
			}
		})

		if (!response.ok) {
			const errorText = await response.text().catch(() => 'Unknown error')
			console.error('[Pyth GET] API error:', response.status, errorText)
			return {
				status: response.status as 400 | 404 | 429 | 500,
				data: { error: errorText }
			}
		}

		const responseData = await response.json() as { parsed?: PythParsedPrice[] }
		console.log('[Pyth GET] Successfully retrieved price data')

		return {
			status: 200,
			data: {
				parsed: responseData.parsed || []
			}
		}
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		console.error('[Pyth GET] API call failed:', message)
		return {
			status: 500,
			data: { error: message }
		}
	}
}
