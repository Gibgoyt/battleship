interface Invite {
	invite_id: string
	group_id: string
	group_name: string
	invited_by: string
	invited_by_name: string
	invited_user: string
	invited_email: string
	invited_phone: string
	type: string
	message: string
	expires_at: string
	max_uses: string
	used_count: string
	status: string
	created_at: string
}

interface Response200 {
	status: 200
	data: {
		success: boolean
		timestamp: number
		invites: Invite[]
		count: number
	}
}

interface Response400 {
	status: 400
	data: {
		error: string
		message: string
	}
}

interface Response401 {
	status: 401
	data: {
		error: string
		message: string
		authenticated: boolean
	}
}

interface Response503 {
	status: 503
	data: {
		error: string
		message: string
	}
}

type GetResponse = Response200 | Response400 | Response401 | Response503

/*
 * Get user invites
 *
 * GET /api/users/me/invites
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
			BASE_URL + "/api/users/me/invites", {
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
