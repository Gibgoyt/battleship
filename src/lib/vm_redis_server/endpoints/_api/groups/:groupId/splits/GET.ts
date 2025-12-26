interface PaymentRecord {
	amount_usd: string
	transaction_hash: string
	paid_at: string
}

interface SplitParticipant {
	user_id: string
	amount_owed_usd: string
	amount_paid_usd: string
	amount_remaining_usd: string
	status: string
	settled_at: string
	settlement_transaction_hash: string
	payment_history: PaymentRecord[]
}

interface Split {
	split_id: string
	group_id: string
	created_by: string
	description: string
	total_amount_usd: string
	currency: string
	solana_payment_hash: string
	solana_payment_amount: string
	solana_payment_verified: string
	split_type: string
	status: string
	created_at: string
	updated_at: string
	settled_at: string
	participants: SplitParticipant[]
}

interface Response200 {
	status: 200
	data: {
		group_id: string
		splits: Split[]
	}
}

interface Response400 {
	status: 400
	data: {
		error: string
		message: string
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

type GetResponse = Response200 | Response400 | Response401 | Response500 | Response503

/*
 * Get all splits for a group
 *
 * GET /api/groups/:group_id/splits
 *
 * @param accessToken The bearer token for authentication
 * @param groupId The ID of the group to get splits for
 * @returns A promise that resolves to the expected data type
 */
export async function GET(accessToken: string, groupId: string): Promise<GetResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + `/api/groups/${groupId}/splits`, {
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
