interface Response204 {
	status: 204
	data: null
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
		firebase_local_id: string
	}
}

interface Response500 {
	status: 500
	data: {
		error: string
		details?: string
	}
}

interface Response503 {
	status: 503
	data: {
		error: string
		message: string
	}
}

type DeleteResponse = Response204 | Response401 | Response404 | Response500 | Response503

/*
 * Delete current user account
 *
 * DELETE /api/users/me
 *
 * @param accessToken The bearer token for authentication
 * @returns A promise that resolves to the expected data type
 */
export async function DELETE(accessToken: string): Promise<DeleteResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + "/api/users/me", {
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
