interface FcmBody {
	device_token: string
	title: string
	message: string
	[key: string]: any
}

interface Response200 {
	status: 200
	data: {
		success: boolean
		firebase_response_code: number
		device_token: string
		message: string
		protocol: string
	}
}

interface Response400 {
	status: 400
	data: {
		error: string
		message?: string
		required?: string[]
	}
}

interface Response413 {
	status: 413
	data: {
		error: string
		max_size: number
	}
}

interface Response500 {
	status: 500
	data: {
		success?: boolean
		error: string
		message?: string
		firebase_response_code?: number
		device_token?: string
		firebase_response?: string
	}
}

type PostResponse = Response200 | Response400 | Response413 | Response500

/*
 * Firebase Cloud Messaging test endpoint
 *
 * POST /api/test/fcm
 *
 * @param body The FCM data (device_token, title, message)
 * @returns A promise that resolves to the expected data type
 */
export async function POST(body: FcmBody): Promise<PostResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + "/api/test/fcm", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
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
