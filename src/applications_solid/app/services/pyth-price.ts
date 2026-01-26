/**
 * Pyth Price Service
 * Fetches live SOL/USD price from Pyth Hermes REST API
 */

import { GET, parsePythPrice, PRICE_FEED_IDS } from '../middleware/endpoints/pyth/_api/v2/updates/price/latest'
import type { PythParsedPrice } from '../middleware/endpoints/pyth/_api/v2/updates/price/latest'

export interface PythSolPrice {
	price: number
	confidence: number
	publishTime: number
	source: 'pyth'
}

/**
 * Fetch the latest SOL/USD price from Pyth
 * Returns null if the fetch fails
 */
export async function fetchSolPricePyth(): Promise<PythSolPrice | null> {
	try {
		const response = await GET({
			ids: [PRICE_FEED_IDS.SOL_USD]
		})

		if (response.status !== 200) {
			console.error('[Pyth] Failed to fetch SOL price:', response.data)
			return null
		}

		const parsed = response.data.parsed
		if (!parsed || parsed.length === 0) {
			console.error('[Pyth] No parsed price data returned')
			return null
		}

		const solData = parsed[0]
		const price = parsePythPrice(solData.price)
		const confidence = parsePythPrice({
			price: solData.price.conf,
			conf: '0',
			expo: solData.price.expo,
			publish_time: 0
		})

		console.log(`[Pyth] SOL/USD: $${price.toFixed(2)} (+/- $${confidence.toFixed(2)})`)

		return {
			price,
			confidence,
			publishTime: solData.price.publish_time,
			source: 'pyth'
		}
	} catch (error) {
		console.error('[Pyth] Error fetching SOL price:', error)
		return null
	}
}

export { PRICE_FEED_IDS }
