interface Response200 {
	status: 200
	data: {
		endpoint: string
		method: string
		url: string
		query_string: string
		params: Record<string, string>
		param_count: number
		timestamp: number
		[key: string]: any // Allow field1, field2 etc.
	}
}

interface Response500 {
	status: 500
	data: {
		error: string
		message: string
		endpoint: string
	}
}

type GetResponse = Response200 | Response500

/*
 * URL Parameters test endpoint
 *
 * GET /api/params
 *
 * @param params Optional URL parameters as key-value pairs
 * @returns A promise that resolves to the expected data type
 */
export async function GET(params?: Record<string, string>): Promise<GetResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		// Construct query string
		let url = BASE_URL + "/api/params"
		if (params) {
			const searchParams = new URLSearchParams(params)
			url += `?${searchParams.toString()}`
		}

		const response = await fetch(
			url, {
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
