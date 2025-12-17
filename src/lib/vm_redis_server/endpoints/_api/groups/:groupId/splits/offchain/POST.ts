interface ParticipantInput {
	user_id: string
	amount_owed_usd: string
}

interface SplitBody {
	description: string
	total_amount_usd: string
	participants: ParticipantInput[]
	note?: string
}

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

interface Response201 {
	status: 201
	data: {
		message: string
		success: boolean
		timestamp: number
		split: Split
	}
}

interface Response400 {
	status: 400
	data: {
		error: string
		message?: string
		required?: string[]
		example?: any
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

interface Response413 {
	status: 413
	data: {
		error: string
		max_size: number
		received_size: number
	}
}

interface Response500 {
	status: 500
	data: {
		error: string
		message?: string
	}
}

type PostResponse = Response201 | Response400 | Response401 | Response413 | Response500

/*
 * Create new split WITHOUT Solana payment (external payment tracking)
 *
 * POST /api/groups/:group_id/splits/offchain
 *
 * @param accessToken The bearer token for authentication
 * @param groupId The ID of the group to create the split in
 * @param body The split data including description and amounts (no signed transaction required)
 * @returns A promise that resolves to the expected data type
 */
export async function POST(accessToken: string, groupId: string, body: SplitBody): Promise<PostResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + `/api/groups/${groupId}/splits/offchain`, {
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
			case 201:
				return {
					status: 201,
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
			case 413:
				return {
					status: 413,
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
