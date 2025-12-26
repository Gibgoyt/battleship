interface UpdateGroupBody {
	name?: string
	description?: string
	category?: string
	currency?: string
	is_private?: string
	requires_approval?: string
	max_members?: string
	status?: string
	is_active?: string
}

interface Response200 {
	status: 200
	data: {
		success: boolean
		message: string
		timestamp: number
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
 * Update group
 *
 * PUT /api/groups/:group_id
 *
 * @param accessToken The bearer token for authentication
 * @param groupId The ID of the group to update
 * @param body The group data to update
 * @returns A promise that resolves to the expected data type
 */
export async function PUT(accessToken: string, groupId: string, body: UpdateGroupBody): Promise<PutResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + `/api/groups/${groupId}`, {
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
