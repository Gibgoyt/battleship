import { signTransferRequest } from './rust/index.ts'
import type { TransferSignedBody } from './rust/index.ts'

export interface TokenTransaction {
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

export interface Response200 {
	status: 200
	data: {
		success: true
		data: TokenTransaction
	}
}

export interface Response400 {
	status: 400
	data: {
		success: false
		error: string
		message: string
	}
}

export interface Response401 {
	status: 401
	data: {
		success: false
		error: string
		message: string
	}
}

export interface Response500 {
    status: 500
    data: {
        success: false
        error: string
        message?: string
    }
}

export type PostResponse = Response200 | Response400 | Response401 | Response500

/*
 * Transfer tokens to another user
 *
 * POST /api/splitdo-token/transfer
 *
 * @param userId Sender's user ID
 * @param walletPath Path to sender's wallet keypair
 * @param accessToken Sender's Auth Token
 * @param fromAta Sender's Token Account Address
 * @param toAta Recipient's Token Account Address
 * @param recipientUserId Recipient's User ID
 * @param amountTokens Amount to transfer
 */
export async function POST(
    userId: string, 
    walletPath: string, 
    accessToken: string,
    fromAta: string,
    toAta: string,
    recipientUserId: string,
    amountTokens: number
): Promise<PostResponse> {
	try {
        // 1. Sign
        console.log(`[POST] Signing transfer of ${amountTokens} SPLITDO from ${userId} to ${recipientUserId}...`)
        let body: TransferSignedBody;
        try {
            body = signTransferRequest(walletPath, fromAta, toAta, recipientUserId, amountTokens)
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`[POST] Signing failed: ${msg}`);
            return { status: 400, data: { success: false, error: "Signing Failed", message: msg } };
        }

		// 2. Send
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

        console.log(`[POST] Sending signed request to ${BASE_URL}/api/splitdo-token/transfer...`)
		const response = await fetch(
			BASE_URL + "/api/splitdo-token/transfer", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${accessToken}`
				},
				body: JSON.stringify(body)
			}
		)

        console.log(`[POST] Response Status: ${response.status}`)

		const responseData = await response.json()

		switch (response.status) {
			case 200: return { status: 200, data: responseData }
			case 400: return { status: 400, data: responseData }
			case 401: return { status: 401, data: responseData }
            case 500: return { status: 500, data: responseData }
			default:
				throw new Error(`Unexpected HTTP status: ${response.status}`)
		}
	} catch (error: unknown) {
		const msg = error instanceof Error ? error.message : "Unknown Error"
        console.error(`[POST] Network error: ${msg}`)
		return {
            status: 500, 
            data: { success: false, error: "Network Error", message: msg } 
        }
	}
}