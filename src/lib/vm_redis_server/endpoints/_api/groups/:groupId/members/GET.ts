interface GroupMember {
	firebase_local_id: string
	user_id: string
	wallet_address: string
	display_name: string
	avatar_url: string
	role: string
	permissions_add_expenses: string
	permissions_edit_expenses: string
	permissions_delete_expenses: string
	permissions_add_members: string
	permissions_remove_members: string
	permissions_edit_group: string
	status: string
	invited_by: string
	joined_at: string
	invited_at: string
	last_active_at: string
	nickname: string
	notifications_new_expenses: string
	notifications_settlements: string
	notifications_group_updates: string
}

interface Response200 {
	status: 200
	data: {
		success: boolean
		timestamp: number
		members: GroupMember[]
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
 * Get group members
 *
 * GET /api/groups/:group_id/members
 *
 * @param accessToken The bearer token for authentication
 * @param groupId The ID of the group to get members for
 * @returns A promise that resolves to the expected data type
 */
export async function GET(accessToken: string, groupId: string): Promise<GetResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + `/api/groups/${groupId}/members`, {
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
