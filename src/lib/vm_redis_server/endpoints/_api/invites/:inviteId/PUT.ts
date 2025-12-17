interface InviteResponseBody {
	response: string
}

interface Response200 {
	status: 200
	data: {
		success: boolean
		timestamp: number
		[key: string]: any
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
		authenticated?: boolean
	}
}

interface Response413 {
	status: 413
	data: {
		error: string
		message: string
	}
}

interface Response500 {
	status: 500
	data: {
		error: string
		message: string
	}
}

interface Response503 {
	status: 503
	data: {
		error: string
		message: string
	}
}

type PutResponse = Response200 | Response400 | Response401 | Response413 | Response500 | Response503

/*
 * Respond to invite
 *
 * PUT /api/invites/:invite_id
 *
 * @param accessToken The bearer token for authentication
 * @param inviteId The ID of the invite to respond to
 * @param response The response (e.g., "accepted", "declined")
 * @returns A promise that resolves to the expected data type
 */
export async function PUT(accessToken: string, inviteId: string, responseAction: string): Promise<PutResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const body: InviteResponseBody = {
			response: responseAction
		}

		const response = await fetch(
			BASE_URL + `/api/invites/${inviteId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${accessToken}`
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
