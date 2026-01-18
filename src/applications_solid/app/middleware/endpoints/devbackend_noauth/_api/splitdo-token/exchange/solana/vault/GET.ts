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
		// NEW: Log browser environment details for CORS debugging
		console.log('[VAULT DEBUG] Browser environment:', {
			userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
			origin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
			href: typeof window !== 'undefined' ? window.location.href : 'N/A',
			isMobile: typeof navigator !== 'undefined' ? /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) : false,
			isPhantomBrowser: typeof navigator !== 'undefined' ? /phantom/i.test(navigator.userAgent) : false,
			platform: typeof navigator !== 'undefined' ? navigator.platform : 'N/A',
			language: typeof navigator !== 'undefined' ? navigator.language : 'N/A'
		});

		const url = 'https://devbackend.splitdo.app:8443/api/splitdo-token/exchange/solana/vault'

		// NEW: Log exact fetch configuration
		// FIXED: Removed custom User-Agent header that caused CORS rejection on mobile
		const fetchConfig = {
			method: 'GET',
			headers: {
				'Accept': 'application/json'
				// User-Agent header removed - browsers send this automatically
				// Custom User-Agent headers cause CORS issues on mobile browsers
			}
		};

		console.log('[VAULT DEBUG] Fetch configuration:', {
			url,
			method: fetchConfig.method,
			headers: fetchConfig.headers,
			timestamp: new Date().toISOString()
		});

		console.log('[DevbackendNoAuth Vault GET] Fetching SOL vault address from:', url)
		console.log('[VAULT DEBUG] Making fetch request...');

		const response = await fetch(url, fetchConfig)

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
		// NEW: Enhanced error logging for CORS debugging
		if (error instanceof Error) {
			console.error('[VAULT DEBUG] Fetch failed with details:', {
				error: error.message,
				errorType: error.constructor.name,
				stack: error.stack,
				url: 'https://devbackend.splitdo.app:8443/api/splitdo-token/exchange/solana/vault',
				timestamp: new Date().toISOString(),
				isCorsError: error.message.toLowerCase().includes('cors') ||
				           error.message.toLowerCase().includes('access-control') ||
				           error.message.toLowerCase().includes('not allowed'),
				userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
			});
			console.log("DevbackendNoAuth Vault API call failed: " + error.message)
		} else {
			console.error('[VAULT DEBUG] Unknown error occurred:', {
				error,
				type: typeof error,
				timestamp: new Date().toISOString()
			});
			console.log("An unknown error occurred in DevbackendNoAuth Vault API call")
		}
		throw error
	}
}