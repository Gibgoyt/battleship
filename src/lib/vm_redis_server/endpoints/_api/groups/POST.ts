interface GroupBody {
	name: string
	description?: string
	category?: string
}

interface Group {
	group_id: string
	name: string
	description: string
	image_url: string
	category: string
	currency: string
	is_private: string
	requires_approval: string
	created_by: string
	member_count: string
	max_members: string
	invite_code: string
	invite_code_expiry: string
	status: string
	is_active: string
	created_at: string
	updated_at: string
	last_activity_at: string
}

interface Response201 {
	status: 201
	data: {
		message: string
		success: boolean
		timestamp: number
		group: Group
	}
}

interface Response400 {
	status: 400
	data: {
		error: string
		message?: string
		required?: string[]
		example?: any
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
		max_size: number
		received_size: number
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

type PostResponse = Response201 | Response400 | Response401 | Response413 | Response500 | Response503

/*
 * Create new group
 *
 * POST /api/groups
 *
 * @param accessToken The bearer token for authentication
 * @param body The group data
 * @returns A promise that resolves to the expected data type
 */
export async function POST(accessToken: string, body: GroupBody): Promise<PostResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + "/api/groups", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${accessToken}`
				},
				body: JSON.stringify(body)
			}
		)

		const responseData = await response.json()

		switch (response.status) {
			case 201:
				return {
					status: 201,
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
