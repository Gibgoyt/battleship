interface TokenTransaction {
	transaction_id: string
	type: string
	from_user_id: string
	to_user_id: string
	amount_tokens: number
	amount_usdc?: number
	tx_signature: string
	status: string
	created_at: string
	completed_at: string
	error_message?: string
}

interface Response200 {
	status: 200
	data: {
		success: true
		data: {
			transactions: TokenTransaction[]
			count: number
			limit: number
			offset: number
			has_more: boolean
		}
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

interface Response500 {
	status: 500
	data: {
		success: false
		error: string
		message: string
	}
}

type GetResponse = Response200 | Response401 | Response500

/*
 * Get transaction history
 *
 * GET /api/splitdo-token/transactions
 *
 * @param accessToken The bearer token for authentication
 * @param limit Optional limit for pagination (default 50)
 * @param offset Optional offset for pagination (default 0)
 * @returns A promise that resolves to the expected data type
 */
export async function GET(accessToken: string, limit?: number, offset?: number): Promise<GetResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		let url = BASE_URL + "/api/splitdo-token/transactions"
		const params = new URLSearchParams()
		if (limit !== undefined) params.append("limit", limit.toString())
		if (offset !== undefined) params.append("offset", offset.toString())
		
		if (params.toString()) {
			url += `?${params.toString()}`
		}

		const response = await fetch(
			url, {
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
			case 500:
				return {
					status: 500,
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
