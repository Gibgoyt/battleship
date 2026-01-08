interface Response200 {
	status: 200
	data: {
		success: true
		rate: number
		source: string // "fallback" | "live"
		message: string
	}
}

interface Response503 {
	status: 503
	data: {
		success: false
		error: string
		message: string
	}
}

type GetResponse = Response200 | Response503

/*
 * Check exchange rate service status
 *
 * GET /api/exchange-rate/health
 *
 * @returns A promise that resolves to the expected data type
 */
export async function GET(): Promise<GetResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + "/api/exchange-rate/health", {
				method: "GET",
				headers: {
					"Content-Type": "application/json"
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
