interface AirdropBody {
	amount: number
}

interface Response200 {
	status: 200
	data: {
		success: boolean
		pubkey: string
		amount_requested: number
		signature: string
		message: string
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

interface Response408 {
	status: 408
	data: {
		success: boolean
		error: string
		message: string
	}
}

interface Response413 {
	status: 413
	data: {
		success: boolean
		error: string
		max_size: number
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

type PostResponse = Response200 | Response400 | Response408 | Response413 | Response500

/*
 * Request devnet airdrop
 *
 * POST /api/solana/wallet/:pubkey/airdrop
 *
 * @param pubkey The public key of the wallet
 * @param amount The amount of lamports to airdrop
 * @returns A promise that resolves to the expected data type
 */
export async function POST(pubkey: string, amount: number): Promise<PostResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const body: AirdropBody = {
			amount: amount
		}

		const response = await fetch(
			BASE_URL + `/api/solana/wallet/${pubkey}/airdrop`, {
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
			case 408:
				return {
					status: 408,
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
