interface PutBody {
	bio?: string
	currency?: string
	language?: string
	status?: string
	email?: string
	wallet_address?: string
	add_ios_token?: string
	add_android_token?: string
	remove_ios_token?: string
	remove_android_token?: string
}

interface Response200 {
	status: 200
	data: {
		success: boolean
		message: string
		user: {
			firebase_local_id: string
			email: string
			display_name: string
			username: string
			bio: string
			currency: string
			language: string
			status: string
			created_at: string
			updated_at: string
		}
		timestamp: number
	}
}

interface Response400 {
	status: 400
	data: {
		error: string
		message?: string
		allowed_fields?: string[]
		device_operations?: string[]
		expected?: string
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

interface Response404 {
	status: 404
	data: {
		error: string
		firebase_local_id: string
	}
}

interface Response413 {
	status: 413
	data: {
		error: string
		max_size: number
		received_size?: number
	}
}

interface Response500 {
	status: 500
	data: {
		error: string
		details?: string
		message?: string
	}
}

interface Response503 {
	status: 503
	data: {
		error: string
		message: string
	}
}

type PutResponse = Response200 | Response400 | Response401 | Response404 | Response413 | Response500 | Response503

/*
 * Update current user profile
 *
 * PUT /api/users/me
 *
 * @param accessToken The bearer token for authentication
 * @param body The user data to update
 * @returns A promise that resolves to the expected data type
 */
export async function PUT(accessToken: string, body: PutBody): Promise<PutResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + "/api/users/me", {
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
			case 404:
				return {
					status: 404,
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
