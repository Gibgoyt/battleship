interface JsonPlaceholderPost {
	userId: number
	id: number
	title: string
	body: string
	[key: string]: any
}

interface ResponseSuccess {
	status: 200
	data: {
		success: true
		http_code: number
		external_api: string
		integration_type: string
		data: JsonPlaceholderPost
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

// The endpoint always returns 200 OK with JSON body indicating success/failure of the *external* call
// unless uWebSockets fails internally, but the code uses res->end(api_response.dump()) without setting specific status code for errors,
// so it defaults to 200 OK.
type GetResponse = ResponseSuccess | ResponseParseError | ResponseNetworkError

/*
 * Test HTTP Client endpoint
 *
 * GET /api/client
 *
 * No authentication required.
 * Tests the server's ability to make async HTTP calls to external APIs.
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
			BASE_URL + "/api/client", {
				method: "GET",
				headers: {
					"Content-Type": "application/json"
				}
			}
		)

		const responseData = await response.json()

		// The endpoint always returns 200 OK as per current implementation
		if (response.status === 200) {
			return {
				status: 200,
				data: responseData
			}
		} else {
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
