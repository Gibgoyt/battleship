import * as Devbackend from './devbackend'
import * as CoinGecko from './coingecko'
import * as Pyth from './pyth'
import * as DevbackendNoAuth from './devbackend_noauth'
import * as _Api from './_api'
import { fetchMiddleware, rateLimitUtils } from '../fetch-wrapper'

export const middlewareFetch = {
	Endpoints: {
		Devbackend,
		CoinGecko,
		Pyth,
		DevbackendNoAuth,
		_Api
	}
}

// Export centralized fetch wrapper for direct usage
export { fetchMiddleware, rateLimitUtils }