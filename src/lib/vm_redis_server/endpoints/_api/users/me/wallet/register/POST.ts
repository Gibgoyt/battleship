interface Response200 {
	status: 200
	data: {
		success: boolean
		wallet_address: string
		network: string
		rpc_url: string
		initial_funding: {
			amount_lamports: string
			amount_sol: number
			transaction_signature: string
		}
		balance: {
			lamports: string
			sol: number
			confirmed: boolean
		}
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

interface Response401 {
	status: 401
	data: {
		error: string
		message: string
		authenticated?: boolean
	}
}

interface Response408 {
	status: 408
	data: {
		success: boolean
		error: string
		message: string
		wallet_address?: string
		expected_balance?: string
		actual_balance?: string
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

type PostResponse = Response200 | Response400 | Response401 | Response408 | Response500

/*
 * Register user's wallet address and request initial airdrop
 *
 * POST /api/users/me/wallet/register
 *
 * @param accessToken The bearer token for authentication
 * @param walletAddress The Solana wallet address to register
 * @param initialAmount Optional initial airdrop amount in lamports (default 10 SOL)
 */
export async function POST(accessToken: string, walletAddress: string, initialAmount?: number): Promise<PostResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const requestBody: any = {
			wallet_address: walletAddress
		}
		
		if (initialAmount !== undefined) {
			requestBody.initial_amount = initialAmount
		}

		const response = await fetch(
			BASE_URL + "/api/users/me/wallet/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${accessToken}`
				},
				body: JSON.stringify(requestBody)
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
			case 408:
				return {
					status: 408,
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
