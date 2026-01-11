import * as Devbackend from './devbackend'
import * as CoinGecko from './coingecko'
import { fetchMiddleware, rateLimitUtils } from '../fetch-wrapper'

export const middlewareFetch = {
	Endpoints: {
		Devbackend,
		CoinGecko
	}
}

// Export centralized fetch wrapper for direct usage
export { fetchMiddleware, rateLimitUtils }