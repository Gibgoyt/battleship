// Phantom signAndSendTransaction flow - no Rust signing needed
import { fetchMiddleware } from '../../../../../../../../fetch-wrapper'

// Exchange-new specific response interfaces matching the API specification
interface ExchangeNewResponse200 {
    status: 200
    data: {
        status: "processing"
        message: string
        tx_signature: string
        user_wallet: string
        token_account_pubkey: string
    }
}

interface ExchangeNewResponse400 {
    status: 400
    data: {
        error: "invalid_signature_format" | "missing_fields" | "empty_fields"
        message: string
        provided_signature?: string
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

interface ExchangeNewResponse409 {
    status: 409
    data: {
        error: "duplicate_transaction"
        message: string
        tx_signature: string
    }
}

interface ExchangeNewResponse422 {
    status: 422
    data: {
        error: "transaction_verification_failed"
        message: string
        expected_sender?: string
        expected_receiver?: string
    }
}

interface ExchangeNewResponse401 {
    status: 401
    data: {
        error: "missing_authorization" | "authentication_failed" | "token_refresh_failed"
        message: string
    }
}

interface ExchangeNewResponse429 {
    status: 429
    data: {
        error: "rate_limit_exceeded"
        message: string
    }
}

interface ExchangeNewResponse500 {
    status: 500
    data: {
        error: "internal_error"
        message: string
        stage?: string
    }
}

type ExchangeNewPostResponse =
    | ExchangeNewResponse200
    | ExchangeNewResponse400
    | ExchangeNewResponse401
    | ExchangeNewResponse408
    | ExchangeNewResponse409
    | ExchangeNewResponse422
    | ExchangeNewResponse429
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

        // 2. Validate transaction signature format (base58, 87-88 characters)
        if (txSignature.length < 87 || txSignature.length > 88) {
            console.error(`🟢 [Exchange NEW POST] ❌ Invalid transaction signature format`)
            return {
                status: 400,
                data: {
                    error: "invalid_signature_format",
                    message: "Transaction signature format is invalid (must be base58, 87-88 characters)",
                    provided_signature: txSignature
                }
            }
        }

        // 3. Submit to backend exchange endpoint using fetchMiddleware for automatic auth
        const endpoint = "https://devbackend.splitdo.app:8443/api/testing/usockets/exchange-new/solana/splitdo"
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

        let response = await fetchMiddleware(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
            // fetchMiddleware automatically handles:
            // - Authorization header injection
            // - 401/403 retry logic with token refresh
            // - Global rate limiting (Cloudflare 1015)
            // - Session expiry notification on final auth failure
        })

        // Enhanced: If 401 and fetchMiddleware didn't handle it, try direct refresh once
        if (response.status === 401) {
            console.log(`🟢 [Exchange NEW POST] Received 401, attempting direct token refresh`)

            try {
                // Import auth store dynamically to avoid circular dependencies
                const { getGlobalAuthStore } = await import('../../../../../../../../firebase/auth-store')
                const authStore = getGlobalAuthStore()
                await authStore.refreshToken() // Uses fallback mechanism

                // Retry the request exactly once
                response = await fetchMiddleware(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(requestBody)
                })

                // If still 401, don't retry again
                if (response.status === 401) {
                    console.error(`🟢 [Exchange NEW POST] Still receiving 401 after token refresh - auth failure`)
                    return {
                        status: 401,
                        data: {
                            error: 'authentication_failed',
                            message: 'Session expired, please log in again'
                        }
                    }
                }

            } catch (refreshError) {
                console.error(`🟢 [Exchange NEW POST] Direct token refresh failed:`, refreshError)
                return {
                    status: 401,
                    data: {
                        error: 'token_refresh_failed',
                        message: 'Unable to refresh authentication token'
                    }
                }
            }
        }

        console.log(`🟢 [Exchange NEW POST] NEW exchange endpoint responded with status: ${response.status}`)

        let responseData: any

        // Handle CloudFlare rate limiting (429 with "error code: 1015" in body)
        if (response.status === 429) {
            const responseText = await response.text()
            if (responseText.includes("error code: 1015")) {
                console.log(`🟢 [Exchange NEW POST] 🚨 CloudFlare rate limiting detected (error code: 1015)`)
                return {
                    status: 429,
                    data: {
                        error: "rate_limit_exceeded",
                        message: "CloudFlare rate limit exceeded. Please wait and try again."
                    }
                }
            } else {
                // Try to parse as JSON for API rate limiting
                try {
                    responseData = JSON.parse(responseText)
                } catch {
                    responseData = { error: "rate_limit_exceeded", message: responseText }
                }
            }
        } else {
            responseData = await response.json()
        }

        console.log(`🟢 [Exchange NEW POST] Response data:`, JSON.stringify(responseData, null, 2))

        // 5. Return typed response based on status
        switch (response.status) {
            case 200:
                console.log(`🟢 [Exchange NEW POST] ✅ Exchange request successful!`)
                return {
                    status: 200,
                    data: responseData
                }
            case 400:
                console.log(`🟢 [Exchange NEW POST] ⚠️ Bad request error (400)`)
                return {
                    status: 400,
                    data: responseData
                }
            case 401:
                console.log(`🟢 [Exchange NEW POST] ⚠️ Unauthorized error (401) - this should not happen with fetchMiddleware`)
                return {
                    status: 401,
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
            case 429:
                console.log(`🟢 [Exchange NEW POST] 🚨 Rate limit exceeded (429)`)
                return {
                    status: 429,
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