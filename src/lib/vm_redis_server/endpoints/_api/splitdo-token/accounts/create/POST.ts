import { signCreateAccountRequest } from './rust/index.ts'
import type { CreateAccountSignedBody } from './rust/index.ts'

export interface TokenAccount {
	user_id: string
	token_account_pubkey: string
	owner_wallet: string
	balance_tokens: number
	created_at: string
	last_updated: string
}

export interface Response200 {
	status: 200
	data: {
		success: true
		data: TokenAccount
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

export interface Response403 {
	status: 403
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

export type PostResponse = Response200 | Response400 | Response401 | Response403 | Response500

/*
 * Create token account for user
 * Signs the request using the local wallet before sending.
 *
 * POST /api/splitdo-token/accounts/create
 *
 * @param userId The user identifier (for logging)
 * @param walletPath The path to the wallet keypair.json
 * @param accessToken The bearer token for authentication
 */
export async function POST(userId: string, walletPath: string, accessToken: string): Promise<PostResponse> {
		try {
			// 1. Sign the request (Client Side)
	        console.log(`[POST] Signing request for user ${userId}...`)
	        let body: CreateAccountSignedBody;
	        try {
	            body = signCreateAccountRequest(walletPath);
	        } catch (e) {
	            const msg = e instanceof Error ? e.message : String(e);
	            console.error(`[POST] Signing failed: ${msg}`);
	            return { status: 400, data: { success: false, error: "Signing Failed", message: msg } };
	        }
	
			// 2. Send the request (Server Side)
			const BASE_URL = process.env.BASE_URL || 'https://devbackend.splitdo.app:8443'
			process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"
	
	        console.log(`[POST] Sending signed request to ${BASE_URL}/api/splitdo-token/accounts/create...`)
			const response = await fetch(
				BASE_URL + "/api/splitdo-token/accounts/create", {				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${accessToken}`
				},
				body: JSON.stringify(body)
			}
		)

		const responseData = await response.json()

		switch (response.status) {
			case 200: return { status: 200, data: responseData }
			case 400: return { status: 400, data: responseData }
			case 401: return { status: 401, data: responseData }
			case 403: return { status: 403, data: responseData }
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
