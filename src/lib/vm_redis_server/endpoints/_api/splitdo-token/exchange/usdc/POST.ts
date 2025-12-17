import { signDepositRequest } from './rust/index.ts'
import type { DepositSignedBody } from './rust/index.ts'

interface TokenTransaction {
	transaction_id: string
	type: string
	from_user_id: string
	to_user_id: string
	amount_tokens: number
	amount_usdc?: number
	tx_signature: string
	status: string
	created_at: string
	completed_at: string
	error_message?: string
}

interface Response200 {
	status: 200
	data: {
		success: true
		data: TokenTransaction
	}
}

interface Response400 {
	status: 400
	data: {
		success: false
		error: string
		message: string
	}
}

interface Response401 {
	status: 401
	data: {
		success: false
		error: string
		message: string
	}
}

interface Response500 {
    status: 500
    data: {
        success: false
        error: string
        message?: string
    }
}

type PostResponse = Response200 | Response400 | Response401 | Response500

/*
 * Deposit USDC to receive utility tokens
 *
 * POST /api/splitdo-token/exchange/usdc
 *
 * @param userId User's ID (for logging)
 * @param walletPath Path to user's wallet keypair
 * @param accessToken The bearer token for authentication
 * @param usdcAmount Amount of USDC to deposit
 */
export async function POST(
    userId: string,
    walletPath: string,
    accessToken: string, 
    usdcAmount: number
): Promise<PostResponse> {
	try {
        // 1. Sign
        console.log(`[POST] Signing deposit of ${usdcAmount} USDC for user ${userId}...`)
        let body: DepositSignedBody;
        try {
            body = signDepositRequest(walletPath, usdcAmount)
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`[POST] Signing failed: ${msg}`);
            return { status: 400, data: { success: false, error: "Signing Failed", message: msg } };
        }

		// 2. Send
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

        console.log(`[POST] Sending signed request to ${BASE_URL}/api/splitdo-token/exchange/usdc...`)
		const response = await fetch(
			BASE_URL + "/api/splitdo-token/exchange/usdc", {
				method: "POST",
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
            return {
                status: 500,
                data: { success: false, error: "Network Error", message: error.message }
            }
		} else {
			console.log("an unknown error occurred")
            return {
                status: 500,
                data: { success: false, error: "Network Error", message: "Unknown error" }
            }
		}
	}
}
