// Exchange-specific response interfaces
interface ExchangeResponse200 {
    status: 200
    data: {
        success: true
        stage1_sol_confirmation: {
            jsonrpc: "2.0"
            result?: {
                context: { slot: number }
                value: {
                    confirmationStatus: string
                    confirmations: null
                    err: null
                    slot: number
                    blockTime: number
                }
            }
            error?: {
                code: number
                message: string
            }
            id: number
        }
        stage2_splitdo_exchange: {
            jsonrpc: "2.0"
            result?: {
                context: { slot: number }
                value: {
                    confirmationStatus: string
                    confirmations: null
                    err: null
                    slot: number
                    blockTime: number
                }
            }
            error?: {
                code: number
                message: string
            }
            id: number
        }
    }
}

interface ExchangeResponse422 {
    status: 422
    data: {
        success: false
        error: string
        message: string
        user_pubkey?: string
        required_ata_address?: string
        stage1_sol_confirmation?: any
        stage2_splitdo_exchange?: any
    }
}

interface ExchangeResponse500 {
    status: 500
    data: {
        success: false
        error: string
        message?: string
        stage1_sol_confirmation?: any
        stage2_splitdo_exchange?: any
    }
}

type ExchangePostResponse = ExchangeResponse200 | ExchangeResponse422 | ExchangeResponse500

/*
 * Submit signed transaction to uSockets SOL to SPLITDO exchange endpoint
 *
 * POST /api/testing/usockets/exchange/solana/splitdo
 *
 * @param accessToken The bearer token for Firebase JWT authentication (required)
 * @param solAmount Amount of SOL in lamports
 * @param signedTransaction Base64 signed transaction from Phantom wallet
 */
export async function POST(
    accessToken: string,
    solAmount: number,
    signedTransaction: string
): Promise<ExchangePostResponse> {
    try {
        console.log(`[Exchange POST] Starting SOL to SPLITDO exchange...`)
        console.log(`[Exchange POST] Amount: ${solAmount} lamports`)
        console.log(`[Exchange POST] Signed transaction length: ${signedTransaction.length} chars`)
        console.log(`[Exchange POST] Transaction preview: ${signedTransaction.substring(0, 50)}...`)

        // Validate signed transaction
        if (!signedTransaction || signedTransaction.length === 0) {
            console.error(`[Exchange POST] 🚨 ABORTING: signed transaction is empty!`)
            return {
                status: 500,
                data: {
                    success: false,
                    error: "Invalid Transaction",
                    message: "Signed transaction is empty - cannot proceed"
                }
            }
        }

        // Validate access token
        if (!accessToken || accessToken.length === 0) {
            console.error(`[Exchange POST] 🚨 ABORTING: access token is missing!`)
            return {
                status: 500,
                data: {
                    success: false,
                    error: "Authentication Required",
                    message: "Firebase JWT access token is required"
                }
            }
        }

        // Submit to devbackend uSockets exchange endpoint
        const BASE_URL = 'https://devbackend.splitdo.app:8443'
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

        const endpoint = BASE_URL + "/api/testing/usockets/exchange/solana/splitdo"
        console.log(`[Exchange POST] Submitting to exchange endpoint: ${endpoint}`)

        // Create the request body (match backend expected format)
        const requestBody = {
            sol_amount: solAmount,
            transaction_signature: signedTransaction
        }

        // Log the complete POST request JSON body
        console.log(`[Exchange POST] Complete POST request JSON body:`)
        console.log(`====================================`)
        console.log(JSON.stringify(requestBody, null, 2))
        console.log(`====================================`)

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
                // Origin header automatically added by browser for CORS security
            },
            body: JSON.stringify(requestBody)
        })

        console.log(`[Exchange POST] Exchange endpoint responded with status: ${response.status}`)

        const responseData = await response.json()
        console.log(`[Exchange POST] Response data:`, JSON.stringify(responseData, null, 2))

        // Return typed response based on status
        switch (response.status) {
            case 200:
                console.log(`[Exchange POST] ✅ Exchange request successful!`)
                return {
                    status: 200,
                    data: responseData
                }
            case 422:
                console.log(`[Exchange POST] ⚠️ Exchange validation error (422)`)
                return {
                    status: 422,
                    data: responseData
                }
            case 500:
                console.log(`[Exchange POST] ❌ Server error (500)`)
                return {
                    status: 500,
                    data: responseData
                }
            default:
                console.error(`[Exchange POST] ❌ Unexpected HTTP status: ${response.status}`)
                return {
                    status: 500,
                    data: {
                        success: false,
                        error: "Unexpected HTTP Status",
                        message: `Received HTTP status: ${response.status}`
                    }
                }
        }

    } catch (error: unknown) {
        console.error(`[Exchange POST] ❌ Exception occurred:`, error)

        if (error instanceof Error) {
            console.error(`[Exchange POST] Error message: ${error.message}`)
            console.error(`[Exchange POST] Stack trace: ${error.stack}`)

            return {
                status: 500,
                data: {
                    success: false,
                    error: "Network Error",
                    message: error.message
                }
            }
        } else {
            console.error(`[Exchange POST] Unknown error type:`, typeof error)

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