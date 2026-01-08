interface ProgramInfo {
	utility_token_mint: string
	usdc_mint_address: string
	program_vault_usdc: string
	program_authority: string
	total_supply_tokens: number
	total_collateral_usdc: number
	exchange_rate: number
	last_updated: string
}

interface Response200 {
	status: 200
	data: {
		success: true
		data: ProgramInfo
	}
}

interface Response500 {
	status: 500
	data: {
		success: false
		error: string
		message: string
	}
}

type GetResponse = Response200 | Response500

/*
 * Get program information (public endpoint)
 *
 * GET /api/splitdo-token/program/info
 *
 * @returns A promise that resolves to the expected data type
 */
export async function GET(): Promise<GetResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const response = await fetch(
			BASE_URL + "/api/splitdo-token/program/info", {
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
