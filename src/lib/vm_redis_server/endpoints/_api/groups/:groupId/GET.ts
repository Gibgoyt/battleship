interface GroupDetails {
	group_id: string
	name: string
	description: string
	category: string
	currency: string
	is_private: boolean
	requires_approval: boolean
	max_members: number
	member_count: number
	created_by: string
	invite_code: string
	status: string
	created_at: string
	updated_at: string
}

interface Response200 {
	status: 200
	data: {
		success: boolean
		timestamp: number
		group: GroupDetails
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

interface Response403 {
	status: 403
	data: {
		error: string
		message: string
		group_id: string
	}
}

interface Response404 {
	status: 404
	data: {
		error: string
		group_id: string
	}
}

interface Response500 {
	status: 500
	data: {
		error: string
		group_id?: string
	}
}

interface Response503 {
	status: 503
	data: {
		error: string
		message: string
	}
}

type GetResponse = Response200 | Response400 | Response401 | Response403 | Response404 | Response500 | Response503

/*
 * Get group details
 *
 * GET /api/groups/:group_id
 *
 * @param accessToken The bearer token for authentication
 * @param groupId The ID of the group to retrieve
 * @returns A promise that resolves to the expected data type
 */
export async function GET(accessToken: string, groupId: string): Promise<GetResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + `/api/groups/${groupId}`, {
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
			case 403:
				return {
					status: 403,
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
