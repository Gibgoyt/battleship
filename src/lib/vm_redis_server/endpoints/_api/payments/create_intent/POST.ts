interface CreateIntentBody {
	amount: number // Amount in smallest currency unit (e.g., cents for USD)
	currency?: string
	payment_method_types?: string[]
}

interface Response200 {
	status: 200
	data: {
		success: boolean
		client_secret: string
		payment_intent_id: string
		amount: number
		currency: string
		publishable_key: string
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

type PostResponse = Response200 | Response400 | Response401 | Response500 | Response503

/*
 * Create payment intent
 *
 * POST /api/payments/create_intent
 *
 * @param accessToken The bearer token for authentication
 * @param body The payment intent creation data
 * @returns A promise that resolves to the expected data type
 */
export async function POST(accessToken: string, body: CreateIntentBody): Promise<PostResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + "/api/payments/create_intent", {
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
