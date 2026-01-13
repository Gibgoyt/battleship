import * as Devbackend from './devbackend'
import * as CoinGecko from './coingecko'
import * as DevbackendNoAuth from './devbackend_noauth'
import { fetchMiddleware, rateLimitUtils } from '../fetch-wrapper'

export const middlewareFetch = {
	Endpoints: {
		Devbackend,
		CoinGecko,
		DevbackendNoAuth
	}
}

// Export centralized fetch wrapper for direct usage
export { fetchMiddleware, rateLimitUtils }