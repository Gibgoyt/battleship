interface Response200 {
	status: 200
	data: {
		success: boolean
		pubkey: string
		balance: number
		lamports: number
		sol: number
		cached: boolean
		timestamp: number
	}
}

interface Response400 {
	status: 400
	data: {
		success: boolean
		error: string
		message: string
	}
}

interface Response500 {
	status: 500
	data: {
		success: boolean
		error: string
		message: string
		error_code?: number
	}
}

type GetResponse = Response200 | Response400 | Response500

/*
 * Get account balance
 *
 * GET /api/solana/wallet/:pubkey/balance
 *
 * @param pubkey The public key of the wallet
 * @returns A promise that resolves to the expected data type
 */
export async function GET(pubkey: string): Promise<GetResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const endpoint: string  = BASE_URL + `/api/solana/wallet/${pubkey}/balance`
		console.log("ENDPOINT: " + endpoint)
		const response = await fetch(
				endpoint, {
				method: "GET",
				headers: {
					"Content-Type": "application/json"
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
