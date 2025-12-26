interface StripeEvent {
	type: string
	data: {
		object: {
			id: string
			amount: number
			currency: string
			customer?: string
			metadata: {
				user_id: string
				[key: string]: any
			}
			[key: string]: any
		}
		[key: string]: any
	}
	[key: string]: any
}

interface Response200 {
	status: 200
	data: {
		success: boolean
		message?: string
		payment_id?: string
		user_id?: string
		wallet_address?: string
		amount_usd?: number
		amount_sol?: number
		transaction_signature?: string
	}
}

interface Response400 {
	status: 400
	data: {
		success: boolean
		error: string
		message: string
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

interface Response413 {
	status: 413
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

type PostResponse = Response200 | Response400 | Response401 | Response413 | Response500 | Response503

/*
 * Handle Stripe payment_intent.succeeded webhooks
 *
 * POST /webhooks/stripe/payment_intent/succeeded
 *
 * @param event The Stripe event payload
 * @param signature The Stripe signature header
 * @returns A promise that resolves to the expected data type
 */
export async function POST(event: StripeEvent, signature: string): Promise<PostResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:2053'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + "/webhooks/stripe/payment_intent/succeeded", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Stripe-Signature": signature
				},
				body: JSON.stringify(event)
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
