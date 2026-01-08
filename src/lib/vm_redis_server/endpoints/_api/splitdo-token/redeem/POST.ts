interface RedeemBody {
	amount_tokens: number
	signed_transaction: string
	recipient_usdc_account?: string
}

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
		data: TokenTransaction
	}
}

interface Response400 {
	status: 400
	data: {
		success: false
		error: string
		message: string
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

type PostResponse = Response200 | Response400 | Response401

/*
 * Redeem tokens for USDC
 *
 * POST /api/splitdo-token/redeem
 *
 * @param accessToken The bearer token for authentication
 * @param body The redeem request data
 * @returns A promise that resolves to the expected data type
 */
export async function POST(accessToken: string, body: RedeemBody): Promise<PostResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + "/api/splitdo-token/redeem", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${accessToken}`
				},
				body: JSON.stringify(body)
			}
		)

		const responseData = await response.json()

		switch (response.status) {
			case 200:
				return {
					status: 200,
					data: responseData
				}
			case 400:
				return {
					status: 400,
					data: responseData
				}
			case 401:
				return {
					status: 401,
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
