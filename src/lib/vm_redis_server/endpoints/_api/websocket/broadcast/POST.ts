interface BroadcastBody {
	message?: string
}

interface BroadcastContent {
	type: string
	message: string
	from: string
	source: string
	server_time: number
}

interface Response200 {
	status: 200
	data: {
		success: boolean
		message: string
		broadcast_content: BroadcastContent
		note: string
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
		error: string
		message: string
	}
}

type PostResponse = Response200 | Response413 | Response500

/*
 * HTTP endpoint to trigger WebSocket messages (for testing)
 *
 * POST /api/websocket/broadcast
 *
 * @param body Optional message to broadcast
 * @returns A promise that resolves to the expected data type
 */
export async function POST(body: BroadcastBody = {}): Promise<PostResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + "/api/websocket/broadcast", {
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
