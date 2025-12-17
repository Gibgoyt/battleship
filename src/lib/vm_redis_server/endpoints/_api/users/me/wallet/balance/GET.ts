interface Response200 {
	status: 200
	data: {
		wallet_address: string
		balance_lamports: string
		balance_sol: number
		timestamp: number
	}
}

interface Response401 {
	status: 401
	data: {
		error: string
		message: string
		authenticated?: boolean
	}
}

interface Response404 {
	status: 404
	data: {
		success: boolean
		error: string
		message: string
		firebase_local_id: string
	}
}

interface Response500 {
	status: 500
	data: {
		success: boolean
		error: string
		message: string
		error_code?: number
	}
}

interface Response503 {
	status: 503
	data: {
		error: string
		message: string
	}
}

type GetResponse = Response200 | Response401 | Response404 | Response500 | Response503

/*
 * Get user's wallet balance
 *
 * Fetches JSON data from GET /api/users/me/wallet/balance
 *
 * @param accessToken The bearer token for authentication
 * @returns A promise that resolves to the expected data type
 */
export async function GET(accessToken: string): Promise<GetResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + "/api/users/me/wallet/balance", {
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

			case 401:
				return {
					status: 401,
					data: responseData
				}

			case 404:
				return {
					status: 404,
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
				// Unexpected status code - throw error
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
