interface GitHubPermissions {
	[key: string]: boolean
}

interface GitHubIntegration {
	connected: boolean
	user_id?: string
	username?: string
	email?: string
	avatar_url?: string
	name?: string
	connected_at?: number
	last_sync?: number
	permissions?: GitHubPermissions
}

interface Response200 {
	status: 200
	data: {
		success: boolean
		user: {
			user_id: string
			email: string
			username: string
			token_use: string
		}
		integrations: {
			github: GitHubIntegration
		}
	}
}

interface Response401 {
	status: 401
	data: {
		error: string
		message: string
	}
}

type GetResponse = Response200 | Response401

/*
 * SPA Load endpoint - Enhanced with GitHub integration status
 *
 * GET /api/spa-load/app
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
			BASE_URL + "/api/spa-load/app", {
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
