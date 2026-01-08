interface PaymentRecord {
	payment_id: string
	stripe_payment_intent_id: string
	user_id: string
	wallet_address: string
	amount_usd: number
	amount_sol: number
	amount_lamports: number
	exchange_rate: number
	status: string
	solana_transaction_hash: string
	error_message: string
	created_at: string
	updated_at: string
	completed_at: string
	retry_count: number
}

interface Response200 {
	status: 200
	data: {
		success: boolean
		user_id: string
		total: number
		payments: PaymentRecord[]
	}
}

interface Response401 {
	status: 401
	data: {
		success: boolean
		error: string
		message: string
	}
}

interface Response500 {
	status: 500
	data: {
		success: boolean
		error: string
		message: string
	}
}

interface Response503 {
	status: 503
	data: {
		success: boolean
		error: string
		message: string
	}
}

type GetResponse = Response200 | Response401 | Response500 | Response503

/*
 * Get user's payment history
 *
 * GET /api/users/me/payments
 *
 * @param accessToken The bearer token for authentication
 * @param limit Optional limit for pagination
 * @returns A promise that resolves to the expected data type
 */
export async function GET(accessToken: string, limit?: number): Promise<GetResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		let url = BASE_URL + "/api/users/me/payments"
		if (limit !== undefined) {
			url += `?limit=${limit}`
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
			case 503:
				return {
					status: 503,
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
