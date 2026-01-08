interface Response200 {
	status: 200
	data: {
		success: boolean
		oauth_url: string
		state: string
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

type PostResponse = Response200 | Response401 | Response500

/*
 * Initiate GitHub OAuth flow (requires Cognito JWT)
 *
 * POST /api/v1/integrations/github/initiate
 *
 * @param accessToken The bearer token for authentication
 * @returns A promise that resolves to the expected data type
 */
export async function POST(accessToken: string): Promise<PostResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + "/api/v1/integrations/github/initiate", {
				method: "POST",
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
