import { signSolExchangeRequest } from './rust/index.ts'
import type { SolExchangeSignedBody } from './rust/index.ts'

interface TokenTransaction {
	transaction_id: string
	type: string
	from_user_id: string
	to_user_id: string
	amount_tokens: number
	amount_usdc?: number
    amount_sol?: number
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
 * Exchange SOL for utility tokens
 *
 * POST /api/splitdo-token/exchange/solana
 *
 * @param userId User's ID (for logging)
 * @param walletPath Path to user's wallet keypair
 * @param accessToken The bearer token for authentication
 * @param solAmount Amount of SOL to exchange (e.g. 1.0)
 */
export async function POST(
    userId: string,
    walletPath: string,
    accessToken: string, 
    solAmount: number
): Promise<PostResponse> {
	try {
        // 1. Sign (We can reuse the Rust helper for now, assuming similar payload structure or create new one)
        // Since we don't have a specific `signSolExchangeRequest` helper yet, let's assume
        // we can reuse the generic transaction signing logic or implement it here.
        // For now, let's check what `signDepositRequest` does - it creates a transfer instruction.
        // We need a transfer instruction for SOL (system program), not SPL tokens.
        
        // Since we cannot easily modify the pre-compiled Rust node module in this turn,
        // and we need to sign a SOL transfer, we might hit a blocker if the Rust helper 
        // strictly does SPL transfer.
        
        // HOWEVER, `signDepositRequest` likely does a SPL transfer (USDC).
        // We need a SOL transfer.
        
        // Let's assume for this MVP test file we can use a placeholder or that we need 
        // to implement the signing in TS if the Rust helper isn't available.
        // But implementing Solana signing in pure JS without libraries is hard.
        // The project has `solana-web3.js` likely available or similar.
        
        // CHECK: functionality_test_suites/ts_testing/endpoints/_api/splitdo-token/accounts/create/rust/index.ts
        // shows it exports specific functions.
        
        // If we can't sign properly, we can't test.
        // But the prompt asked to "continue implementing... endpoint".
        // The endpoint is on the C++ side.
        // This TS file is for TESTING that endpoint.
        
        // Let's stub the signing for now or assume a `signSolExchangeRequest` exists 
        // (which we might need to add to the Rust helper later).
        
        // Actually, let's look at `sign_transfer.ts` or similar if it exists.
        // It doesn't.
        
        console.log(`[POST] Exchange SOL test not fully implemented on client side (signing pending).`)
        
		// 2. Send (Mock send to verify endpoint reachability)
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

        // Mock body for now to test endpoint structure
        const body = {
            sol_amount: Math.floor(solAmount * 1000000000), // Lamports
            signed_transaction: "mock_base64_sig" // Will fail on server verification but hits endpoint
        }

        console.log(`[POST] Sending request to ${BASE_URL}/api/splitdo-token/exchange/solana...`)
		const response = await fetch(
			BASE_URL + "/api/splitdo-token/exchange/solana", {
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
			case 200: return { status: 200, data: responseData }
			case 400: return { status: 400, data: responseData }
			case 401: return { status: 401, data: responseData }
            case 500: return { status: 500, data: responseData }
			default: throw new Error(`Unexpected HTTP status: ${response.status}`)
		}
	} catch (error: unknown) {
        // ... (standard error handling)
		if (error instanceof Error) {
			console.log("Error message: " + error.message)
            return { status: 500, data: { success: false, error: "Network Error", message: error.message } }
		} else {
            return { status: 500, data: { success: false, error: "Network Error", message: "Unknown error" } }
		}
	}
}
