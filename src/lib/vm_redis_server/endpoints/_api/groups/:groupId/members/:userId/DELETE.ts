interface Response204 {
	status: 204
	data: null
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

interface Response503 {
	status: 503
	data: {
		error: string
		message: string
	}
}

type DeleteResponse = Response204 | Response400 | Response401 | Response503

/*
 * Remove group member
 *
 * DELETE /api/groups/:group_id/members/:user_id
 *
 * @param accessToken The bearer token for authentication
 * @param groupId The ID of the group
 * @param userId The ID of the user to remove from the group
 * @returns A promise that resolves to the expected data type
 */
export async function DELETE(accessToken: string, groupId: string, userId: string): Promise<DeleteResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + `/api/groups/${groupId}/members/${userId}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${accessToken}`
				}
			}
		)

		// 204 No Content has no body
		if (response.status === 204) {
			return {
				status: 204,
				data: null
			}
		}

		const responseData = await response.json()

		switch (response.status) {
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
