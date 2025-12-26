interface EchoBody {
	[key: string]: any
}

interface ResponseSuccess {
	status: 200
	data: {
		success: true
		http_code: number
		external_api: string
		integration_type: string
		echo_response: {
			id: number // JSONPlaceholder adds an ID
			[key: string]: any
		}
	}
}

interface ResponseParseError {
	status: 200
	data: {
		success: false
		error: string
		http_code: number
		raw_response: string
	}
}

interface ResponseNetworkError {
	status: 200
	data: {
		success: false
		error: string
		http_code: number
		external_api: string
	}
}

interface Response413 {
	status: 413
	data: {
		error: string
		max_size: number
	}
}

interface Response500 {
	status: 500
	data: {
		error: string
		message: string
	}
}

type PostResponse = ResponseSuccess | ResponseParseError | ResponseNetworkError | Response413 | Response500

/*
 * HTTP Client POST test endpoint
 *
 * POST /api/client/echo
 *
 * Forwards the request body to an external API (jsonplaceholder) and returns the response.
 *
 * @param body The arbitrary JSON data to echo
 * @returns A promise that resolves to the expected data type
 */
export async function POST(body: EchoBody): Promise<PostResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + "/api/client/echo", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
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
