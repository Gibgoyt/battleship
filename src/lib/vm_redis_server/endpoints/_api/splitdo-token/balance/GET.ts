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

type GetResponse = Response200 | Response401 | Response403 | Response404

/*
 * Get user's token balance
 *
 * GET /api/splitdo-token/balance
 *
 * @param accessToken The bearer token for authentication
 * @returns A promise that resolves to the expected data type
 */
export async function GET(accessToken: string): Promise<GetResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + "/api/splitdo-token/balance", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${accessToken}`
				}
			}
		)

		const responseData = await response.json()

		switch (response.status) {
			case 200:
				return {
					status: 200,
					data: responseData
				}
			case 401:
				return {
					status: 401,
					data: responseData
				}
			case 403:
				return {
					status: 403,
					data: responseData
				}
			case 404:
				return {
					status: 404,
					data: responseData
				}
			default:
				throw new Error(`Unexpected HTTP status: ${response.status}`)
		}
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log("failed to fetch data")
			console.log("Error message: " + error.message)
		} else {
			console.log("an unknown error occurred")
		}
		throw error
	}
}
