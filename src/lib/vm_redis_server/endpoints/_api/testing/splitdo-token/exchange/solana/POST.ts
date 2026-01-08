import { signSolExchangeRequest } from '../../../../splitdo-token/exchange/solana/rust/index.ts'
import type { SolExchangeSignedBody } from '../../../../splitdo-token/exchange/solana/rust/index.ts'

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
    debug_info?: any
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
 * TESTING ENDPOINT: Exchange SOL for utility tokens via async exchange endpoint
 *
 * This endpoint targets devbackend.splitdo.app:8443 to test the real async exchange flow
 * with proper CORS headers and fresh blockhash fetching
 *
 * POST /api/testing/splitdo-token/exchange/solana (targeting devbackend async endpoint)
 *
 * @param userId User's ID (for logging)
 * @param walletPath Path to user's wallet keypair
 * @param accessToken The bearer token for authentication
 * @param solAmount Amount of SOL to exchange (e.g. 0.01)
 */
export async function POST(
    userId: string,
    walletPath: string,
    accessToken: string,
    solAmount: number
): Promise<PostResponse> {
	try {
        console.log(`[TESTING POST] Starting async SOL exchange test`)
        console.log(`[TESTING POST] User: ${userId}, Amount: ${solAmount} SOL`)

        // 1. Get fresh blockhash from devbackend (mimic web client behavior)
        const DEVBACKEND_URL = 'https://devbackend.splitdo.app:8443'
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"  // Allow self-signed certs

        console.log(`[TESTING POST] Fetching fresh blockhash from devbackend...`)
        const blockhashResponse = await fetch(
            DEVBACKEND_URL + "/api/solana/network/recent-blockhash", {
                method: "GET",
                headers: {
                    "Origin": "https://splitdo.app"  // CRITICAL: Required CORS header
                }
            }
        )

        if (!blockhashResponse.ok) {
            return {
                status: 500,
                data: {
                    success: false,
                    error: "Blockhash Fetch Failed",
                    message: `Failed to fetch blockhash: ${blockhashResponse.status}`
                }
            }
        }

        const blockhashData = await blockhashResponse.json()
        if (!blockhashData.success || !blockhashData.blockhash) {
            return {
                status: 500,
                data: {
                    success: false,
                    error: "Blockhash Invalid",
                    message: "Blockhash response missing or invalid"
                }
            }
        }

        const freshBlockhash = blockhashData.blockhash
        console.log(`[TESTING POST] ✅ Fresh blockhash: ${freshBlockhash}`)

        // 2. Sign SOL exchange transaction with fresh blockhash
        console.log(`[TESTING POST] Signing transaction with wallet: ${walletPath}`)
        console.log(`[TESTING POST] 🔍 SIGNING DEBUG: About to call signSolExchangeRequest()`)
        console.log(`[TESTING POST] 🔍 SIGNING DEBUG: walletPath = '${walletPath}'`)
        console.log(`[TESTING POST] 🔍 SIGNING DEBUG: solAmount = ${solAmount}`)
        console.log(`[TESTING POST] 🔍 SIGNING DEBUG: rpcUrl = 'https://api.mainnet-beta.solana.com'`)

        let body: SolExchangeSignedBody
        try {
            body = signSolExchangeRequest(walletPath, solAmount, "https://api.mainnet-beta.solana.com")
            console.log(`[TESTING POST] ✅ Transaction signed successfully`)

            // CRITICAL LOGGING: Inspect the signed transaction result
            console.log(`[TESTING POST] 🔍 SIGNED RESULT DEBUG:`)
            console.log(`[TESTING POST] 🔍   Type: ${typeof body}`)
            console.log(`[TESTING POST] 🔍   Full object: ${JSON.stringify(body, null, 2)}`)

            if (body.signedTransaction) {
                console.log(`[TESTING POST] 🔍   signedTransaction type: ${typeof body.signedTransaction}`)
                console.log(`[TESTING POST] 🔍   signedTransaction length: ${body.signedTransaction.length}`)
                console.log(`[TESTING POST] 🔍   signedTransaction preview: '${body.signedTransaction.substring(0, 50)}...'`)
            } else {
                console.log(`[TESTING POST] 🚨 CRITICAL: signedTransaction is EMPTY/NULL/UNDEFINED!`)
                console.log(`[TESTING POST] 🚨 Value: ${body.signedTransaction}`)
            }

        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            console.error(`[TESTING POST] ❌ Signing failed: ${msg}`)
            console.error(`[TESTING POST] ❌ Error object: ${JSON.stringify(e, null, 2)}`)
            console.error(`[TESTING POST] ❌ Stack trace: ${e instanceof Error ? e.stack : 'No stack trace'}`)
            return {
                status: 400,
                data: { success: false, error: "Transaction Signing Failed", message: msg }
            }
        }

        // 3. Prepare request body with signed transaction and amount
        const lamports = Math.floor(solAmount * 1000000000)
        const requestBody = {
            sol_amount: lamports,
            signed_transaction: body.signedTransaction || ""  // Use camelCase property from NAPI
        }

        console.log(`[TESTING POST] 🔍 REQUEST BODY DEBUG:`)
        console.log(`[TESTING POST] 🔍   sol_amount: ${requestBody.sol_amount} lamports`)
        console.log(`[TESTING POST] 🔍   signed_transaction length: ${requestBody.signed_transaction.length}`)
        console.log(`[TESTING POST] 🔍   signed_transaction preview: '${requestBody.signed_transaction.substring(0, 100)}...'`)
        console.log(`[TESTING POST] 🔍   Full JSON body: ${JSON.stringify(requestBody, null, 2)}`)

        // 4. Send request to async exchange endpoint
        console.log(`[TESTING POST] 📡 Sending to async exchange endpoint...`)
        console.log(`[TESTING POST] Target: ${DEVBACKEND_URL}/api/testing/splitdo-token/exchange/solana`)
        console.log(`[TESTING POST] Amount: ${requestBody.sol_amount} lamports (${solAmount} SOL)`)

        // CRITICAL: Validate request body before sending
        if (!requestBody.signed_transaction || requestBody.signed_transaction.length === 0) {
            console.error(`[TESTING POST] 🚨 ABORTING: signed_transaction is empty!`)
            console.error(`[TESTING POST] 🚨 This would cause server to reject with 'unexpected end of file'`)
            return {
                status: 400,
                data: {
                    success: false,
                    error: "Invalid Transaction",
                    message: "Signed transaction is empty - cannot proceed"
                }
            }
        }

        const jsonBody = JSON.stringify(requestBody)
        console.log(`[TESTING POST] 🔍 FINAL REQUEST DEBUG:`)
        console.log(`[TESTING POST] 🔍   URL: ${DEVBACKEND_URL}/api/testing/splitdo-token/exchange/solana`)
        console.log(`[TESTING POST] 🔍   Method: POST`)
        console.log(`[TESTING POST] 🔍   Content-Type: application/json`)
        console.log(`[TESTING POST] 🔍   Authorization: Bearer ${accessToken.substring(0, 20)}...`)
        console.log(`[TESTING POST] 🔍   Origin: https://splitdo.app`)
        console.log(`[TESTING POST] 🔍   Body size: ${jsonBody.length} bytes`)
        console.log(`[TESTING POST] 🔍   Body content: ${jsonBody}`)

        const response = await fetch(
            DEVBACKEND_URL + "/api/testing/splitdo-token/exchange/solana", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                    "Origin": "https://splitdo.app"  // CRITICAL: Required CORS header
                },
                body: jsonBody
            }
        )

        console.log(`[TESTING POST] 🔍 RESPONSE DEBUG: Status ${response.status}`)
        console.log(`[TESTING POST] 🔍 RESPONSE DEBUG: Headers:`)
        for (const [key, value] of response.headers.entries()) {
            console.log(`[TESTING POST] 🔍   ${key}: ${value}`)
        }

        const responseText = await response.text()
        console.log(`[TESTING POST] 🔍 RESPONSE DEBUG: Raw response text: '${responseText}'`)

        let responseData: any
        try {
            responseData = JSON.parse(responseText)
            console.log(`[TESTING POST] 🔍 RESPONSE DEBUG: Parsed JSON successfully`)
        } catch (e) {
            console.error(`[TESTING POST] ❌ RESPONSE DEBUG: Failed to parse JSON`)
            console.error(`[TESTING POST] ❌ Parse error: ${e instanceof Error ? e.message : e}`)
            return {
                status: 500,
                data: {
                    success: false,
                    error: "Invalid Response",
                    message: `Server returned non-JSON response: ${responseText.substring(0, 200)}`
                }
            }
        }

        // 5. Process response
        console.log(`[TESTING POST] Response status: ${response.status}`)
        console.log(`[TESTING POST] Response data: ${JSON.stringify(responseData, null, 2)}`)

		switch (response.status) {
			case 200:
                console.log(`[TESTING POST] ✅ Async exchange successful!`)
                return { status: 200, data: responseData }
			case 400:
                console.log(`[TESTING POST] ❌ Bad request: ${responseData.message || responseData.error}`)
                return { status: 400, data: responseData }
			case 401:
                console.log(`[TESTING POST] ❌ Unauthorized: ${responseData.message || responseData.error}`)
                return { status: 401, data: responseData }
            case 500:
                console.log(`[TESTING POST] ❌ Server error: ${responseData.message || responseData.error}`)
                return { status: 500, data: responseData }
			default:
                console.log(`[TESTING POST] ❌ Unexpected status: ${response.status}`)
                throw new Error(`Unexpected HTTP status: ${response.status}`)
		}
	} catch (error: unknown) {
        console.error(`[TESTING POST] 💥 Network error occurred`)
		if (error instanceof Error) {
			console.error(`[TESTING POST] Error message: ${error.message}`)
            return {
                status: 500,
                data: {
                    success: false,
                    error: "Network Error",
                    message: error.message
                }
            }
		} else {
			console.error(`[TESTING POST] Unknown error type`)
            return {
                status: 500,
                data: {
                    success: false,
                    error: "Network Error",
                    message: "Unknown error occurred"
                }
            }
		}
	}
}