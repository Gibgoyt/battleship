interface Response200 {
	status: 200
	data: {
		endpoint: string
		method: string
		url: string
		wildcard_parameter: string
		message: string
		pattern_type: string
		syntax: string
		note: string
		timestamp: number
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
 * Test endpoint with wildcard parameter
 *
 * GET /api/test/wildcard/*
 *
 * @param wildcardPath The path segment(s) to append to the base wildcard URL
 * @returns A promise that resolves to the expected data type
 */
export async function GET(wildcardPath: string): Promise<GetResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		// Ensure clean path concatenation
		const cleanPath = wildcardPath.startsWith('/') ? wildcardPath.substring(1) : wildcardPath;
		
		const response = await fetch(
			BASE_URL + `/api/test/wildcard/${cleanPath}`, {
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
