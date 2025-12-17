interface CreditorPayment {
	creditor_user_id: string
	amount_usd: number
}

interface SettleBody {
	signed_transaction: string
	sol_usd_rate: number
	payment_amount_usd?: number
	creditor_payments?: CreditorPayment[]
}

interface Response200 {
	status: 200
	data: {
		success: boolean
		message: string
		group_id: string
		user_id: string
		transaction_signature: string
		timestamp: number
	}
}

interface Response400 {
	status: 400
	data: {
		error: string
		message?: string
	}
}

interface Response401 {
	status: 401
	data: {
		error: string
		message: string
		authenticated: boolean
	}
}

interface Response500 {
	status: 500
	data: {
		error: string
	}
}

interface Response503 {
	status: 503
	data: {
		error: string
		message: string
	}
}

type PostResponse = Response200 | Response400 | Response401 | Response500 | Response503

/*
 * Settle user's debt with signed transaction
 *
 * POST /api/groups/:group_id/settle
 *
 * @param accessToken The bearer token for authentication
 * @param groupId The ID of the group
 * @param body The settlement data including signed transaction and exchange rate
 * @returns A promise that resolves to the expected data type
 */
export async function POST(accessToken: string, groupId: string, body: SettleBody): Promise<PostResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + `/api/groups/${groupId}/settle`, {
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
