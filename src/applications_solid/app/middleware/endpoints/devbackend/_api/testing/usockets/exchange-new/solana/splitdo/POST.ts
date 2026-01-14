// Phantom signAndSendTransaction flow - no Rust signing needed

// Exchange-new specific response interfaces for Phantom-compatible endpoint
interface ExchangeNewResponse200 {
    status: 200
    data: {
        status: "completed" | "processing"
        sol_tx_signature: string
        sol_amount: number
        sol_usd_rate: number
        splitdo_amount: number
        splitdo_tx_signature?: string
        message: string
        view_sol_tx?: string
        view_splitdo_tx?: string
    }
}

interface ExchangeNewResponse400 {
    status: 400
    data: {
        error: "invalid_request" | "invalid_signature_format" | "missing_fields" | "empty_fields"
        message: string
        field?: string
        provided_signature?: string
    }
}

interface ExchangeNewResponse409 {
    status: 409
    data: {
        error: "duplicate_transaction" | "duplicate_processing"
        message: string
        tx_signature: string
    }
}

interface ExchangeNewResponse408 {
    status: 408
    data: {
        error: "processing_timeout"
        message: string
        completed_stages: string[]
    }
}

interface ExchangeNewResponse422 {
    status: 422
    data: {
        error: "transaction_verification_failed" | "invalid_token_account"
        message: string
        details?: any
        expected?: string
        actual?: string
    }
}

interface ExchangeNewResponse202 {
    status: 202
    data: {
        status: "processing"
        message: string
        tx_signature?: string
        user_wallet?: string
        token_account_pubkey?: string
    }
}

interface ExchangeNewResponse500 {
    status: 500
    data: {
        error: "redis_error" | "splitdo_transfer_failed" | "internal_error"
        message: string
        stage?: string
        rpc_error?: any
    }
}

type ExchangeNewPostResponse =
    | ExchangeNewResponse200
    | ExchangeNewResponse202
    | ExchangeNewResponse400
    | ExchangeNewResponse409
    | ExchangeNewResponse408
    | ExchangeNewResponse422
    | ExchangeNewResponse500

/*
 * Submit transaction signature to new Phantom-compatible uSockets SOL to SPLITDO exchange endpoint
 *
 * POST /api/testing/usockets/exchange-new/solana/splitdo
 *
 * This endpoint accepts a transaction signature from Phantom's signAndSendTransaction,
 * eliminating Phantom wallet warnings while maintaining security validation.
 *
 * @param txSignature The base58 transaction signature from Phantom signAndSendTransaction
 * @param userWallet The user's wallet public key (base58)
 * @param tokenAccountPubkey The user's SPLITDO token account address (base58)
 */
export async function POST(
    txSignature: string,
    userWallet: string,
    tokenAccountPubkey: string
): Promise<ExchangeNewPostResponse> {
    try {
        console.log(`🟢 [Exchange NEW POST] Starting Phantom signAndSendTransaction flow...`)
        console.log(`🟢 [Exchange NEW POST] Transaction Signature: ${txSignature}`)
        console.log(`🟢 [Exchange NEW POST] User Wallet: ${userWallet}`)
        console.log(`🟢 [Exchange NEW POST] Token Account: ${tokenAccountPubkey}`)

        // 1. Validate input parameters
        if (!txSignature || !userWallet || !tokenAccountPubkey) {
            console.error(`🟢 [Exchange NEW POST] ❌ Missing required parameters`)
            return {
                status: 400,
                data: {
                    error: "missing_fields",
                    message: "Missing required parameters: txSignature, userWallet, or tokenAccountPubkey"
                }
            }
        }

        // 2. Validate transaction signature format (base58)
        if (txSignature.length < 80 || txSignature.length > 90) {
            console.error(`🟢 [Exchange NEW POST] ❌ Invalid transaction signature format`)
            return {
                status: 400,
                data: {
                    error: "invalid_signature_format",
                    message: "Transaction signature must be a valid base58 string",
                    provided_signature: txSignature
                }
            }
        }

        // 3. Submit to backend exchange endpoint
        const BASE_URL = process.env.BASE_URL || 'https://devbackend.splitdo.app:8443'
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

        const endpoint = BASE_URL + "/api/testing/usockets/exchange-new/solana/splitdo"
        console.log(`🟢 [Exchange NEW POST] Submitting to backend exchange endpoint: ${endpoint}`)

        // Create the request body format expected by backend
        const requestBody = {
            tx_signature: txSignature,
            user_wallet: userWallet,
            token_account_pubkey: tokenAccountPubkey
        }

        // Log the complete POST request JSON body
        console.log(`🟢 [Exchange NEW POST] Complete POST request JSON body:`)
        console.log(`====================================`)
        console.log(JSON.stringify(requestBody, null, 2))
        console.log(`====================================`)

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        })

        console.log(`🟢 [Exchange NEW POST] NEW exchange endpoint responded with status: ${response.status}`)

        const responseData = await response.json()
        console.log(`🟢 [Exchange NEW POST] Response data:`, JSON.stringify(responseData, null, 2))

        // 5. Return typed response based on status
        switch (response.status) {
            case 200:
                console.log(`🟢 [Exchange NEW POST] ✅ Exchange request successful!`)
                return {
                    status: 200,
                    data: responseData
                }
            case 202:
                console.log(`🟢 [Exchange NEW POST] 🔄 Exchange request accepted and processing`)
                return {
                    status: 202,
                    data: responseData
                }
            case 400:
                console.log(`🟢 [Exchange NEW POST] ⚠️ Bad request error (400)`)
                return {
                    status: 400,
                    data: responseData
                }
            case 408:
                console.log(`🟢 [Exchange NEW POST] ⏱️ Request timeout (408)`)
                return {
                    status: 408,
                    data: responseData
                }
            case 409:
                console.log(`🟢 [Exchange NEW POST] 🔄 Duplicate transaction (409)`)
                return {
                    status: 409,
                    data: responseData
                }
            case 422:
                console.log(`🟢 [Exchange NEW POST] ⚠️ Transaction verification error (422)`)
                return {
                    status: 422,
                    data: responseData
                }
            case 500:
                console.log(`🟢 [Exchange NEW POST] ❌ Server error (500)`)
                return {
                    status: 500,
                    data: responseData
                }
            default:
                console.error(`🟢 [Exchange NEW POST] ❌ Unexpected HTTP status: ${response.status}`)
                throw new Error(`Unexpected HTTP status: ${response.status}`)
        }

    } catch (error: unknown) {
        console.error(`🟢 [Exchange NEW POST] ❌ Exception occurred:`, error)

        if (error instanceof Error) {
            console.error(`🟢 [Exchange NEW POST] Error message: ${error.message}`)
            console.error(`🟢 [Exchange NEW POST] Stack trace: ${error.stack}`)

            return {
                status: 500,
                data: {
                    error: "internal_error",
                    message: error.message,
                    stage: "request_execution"
                }
            }
        } else {
            console.error(`🟢 [Exchange NEW POST] Unknown error type:`, typeof error)

            return {
                status: 500,
                data: {
                    error: "internal_error",
                    message: "Unknown error occurred",
                    stage: "unknown"
                }
            }
        }
    }
}