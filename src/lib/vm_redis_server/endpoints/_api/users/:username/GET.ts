interface Response200 {
	status: 200
	data: {
		success: boolean
		user: {
			user_id: string
			username: string
			display_name: string
			avatar_url: string
			bio: string
			created_at: string
		}
		timestamp: number
	}
}

interface Response400 {
	status: 400
	data: {
		error: string
		format?: string
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
		error: string
		username?: string
	}
}

interface Response503 {
	status: 503
	data: {
		error: string
		message: string
	}
}

type GetResponse = Response200 | Response400 | Response401 | Response404 | Response503

/*
 * Find user by username (public profile)
 *
 * GET /api/users/username/{username}
 *
 * @param accessToken The bearer token for authentication
 * @param username The username to search for
 * @returns A promise that resolves to the expected data type
 */
export async function GET(accessToken: string, username: string): Promise<GetResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + `/api/users/username/${username}`, {
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
			case 404:
				return {
					status: 404,
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
