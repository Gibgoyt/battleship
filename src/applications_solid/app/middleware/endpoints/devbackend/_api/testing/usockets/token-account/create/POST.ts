// Phantom-compatible token account creation endpoint
import { fetchMiddleware } from '../../../../../../../fetch-wrapper'

// Token account creation specific response interfaces matching the API specification
interface TokenAccountResponse200 {
    status: 200
    data: {
        success: true
        data: {
            user_id: string
            token_account_pubkey: string
            owner_wallet: string
            balance_tokens: number
            created_at: string
            last_updated: string
        }
    }
}

interface TokenAccountResponse400 {
    status: 400
    data: {
        error: "invalid_signature_format" | "missing_fields" | "empty_fields"
        message: string
        provided_signature?: string
    }
}

interface TokenAccountResponse401 {
    status: 401
    data: {
        error: "missing_authorization" | "authentication_failed" | "token_refresh_failed"
        message: string
    }
}

interface TokenAccountResponse403 {
    status: 403
    data: {
        error: "insufficient_permissions" | "account_creation_forbidden"
        message: string
    }
}

interface TokenAccountResponse408 {
    status: 408
    data: {
        error: "processing_timeout"
        message: string
        completed_stages: string[]
    }
}

interface TokenAccountResponse409 {
    status: 409
    data: {
        error: "duplicate_transaction" | "duplicate_processing"
        message: string
        tx_signature: string
    }
}

interface TokenAccountResponse422 {
    status: 422
    data: {
        error: "transaction_verification_failed" | "token_account_verification_failed"
        message: string
        tx_signature: string
    }
}

interface TokenAccountResponse429 {
    status: 429
    data: {
        error: "rate_limit_exceeded"
        message: string
    }
}

interface TokenAccountResponse500 {
    status: 500
    data: {
        error: "redis_error" | "storage_error" | "internal_error"
        message: string
        details?: string
    }
}

type TokenAccountPostResponse =
    | TokenAccountResponse200
    | TokenAccountResponse400
    | TokenAccountResponse401
    | TokenAccountResponse403
    | TokenAccountResponse408
    | TokenAccountResponse409
    | TokenAccountResponse422
    | TokenAccountResponse429
    | TokenAccountResponse500

/*
 * Create SPLITDO token account from Phantom transaction signature
 *
 * POST /api/testing/usockets/token-account/create
 *
 * This endpoint accepts a transaction signature that has already been submitted to the
 * Solana blockchain (typically by Phantom wallet). The endpoint verifies the transaction
 * on-chain and then stores the token account information in Redis.
 *
 * @param txSignature The transaction signature from Phantom wallet (base58)
 * @param userWallet The user's Solana wallet public key (base58)
 * @param tokenAccountPubkey The expected SPLITDO token account address (base58)
 */
export async function POST(
    txSignature: string,
    userWallet: string,
    tokenAccountPubkey: string
): Promise<TokenAccountPostResponse> {
    try {
        console.log(`🟡 [Token Account POST] Starting Phantom token account creation flow...`)
        console.log(`🟡 [Token Account POST] Transaction Signature: ${txSignature}`)
        console.log(`🟡 [Token Account POST] User Wallet: ${userWallet}`)
        console.log(`🟡 [Token Account POST] Token Account: ${tokenAccountPubkey}`)

        // 1. Validate input parameters
        if (!txSignature || !userWallet || !tokenAccountPubkey) {
            console.error(`🟡 [Token Account POST] ❌ Missing required parameters`)
            return {
                status: 400,
                data: {
                    error: "missing_fields",
                    message: "Request must contain tx_signature, user_wallet, and token_account_pubkey fields"
                }
            }
        }

        // Check for empty fields
        if (txSignature.trim() === '' || userWallet.trim() === '' || tokenAccountPubkey.trim() === '') {
            console.error(`🟡 [Token Account POST] ❌ Empty required parameters`)
            return {
                status: 400,
                data: {
                    error: "empty_fields",
                    message: "tx_signature, user_wallet, and token_account_pubkey cannot be empty"
                }
            }
        }

        // 2. Validate transaction signature format (base58, 87-88 characters)
        if (txSignature.length < 87 || txSignature.length > 88) {
            console.error(`🟡 [Token Account POST] ❌ Invalid transaction signature format`)
            return {
                status: 400,
                data: {
                    error: "invalid_signature_format",
                    message: "Transaction signature format is invalid (must be base58, 87-88 characters)",
                    provided_signature: txSignature
                }
            }
        }

        // 3. Submit to backend token account creation endpoint using fetchMiddleware for automatic auth
        const endpoint = "https://devbackend.splitdo.app:8443/api/testing/usockets/token-account/create"
        console.log(`🟡 [Token Account POST] Submitting to backend token account endpoint: ${endpoint}`)

        // Create the request body format expected by backend
        const requestBody = {
            tx_signature: txSignature,
            user_wallet: userWallet,
            token_account_pubkey: tokenAccountPubkey
        }

        // Log the complete POST request JSON body
        console.log(`🟡 [Token Account POST] Complete POST request JSON body:`)
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
            console.log(`🟡 [Token Account POST] Received 401, attempting direct token refresh`)

            try {
                // Import auth store dynamically to avoid circular dependencies
                const { getGlobalAuthStore } = await import('../../../../../../../firebase/auth-store')
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
                    console.error(`🟡 [Token Account POST] Still receiving 401 after token refresh - auth failure`)
                    return {
                        status: 401,
                        data: {
                            error: 'authentication_failed',
                            message: 'Session expired, please log in again'
                        }
                    }
                }

            } catch (refreshError) {
                console.error(`🟡 [Token Account POST] Direct token refresh failed:`, refreshError)
                return {
                    status: 401,
                    data: {
                        error: 'token_refresh_failed',
                        message: 'Unable to refresh authentication token'
                    }
                }
            }
        }

        console.log(`🟡 [Token Account POST] Token account endpoint responded with status: ${response.status}`)

        let responseData: any

        // Handle CloudFlare rate limiting (429 with "error code: 1015" in body)
        if (response.status === 429) {
            const responseText = await response.text()
            if (responseText.includes("error code: 1015")) {
                console.log(`🟡 [Token Account POST] 🚨 CloudFlare rate limiting detected (error code: 1015)`)
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

        console.log(`🟡 [Token Account POST] Response data:`, JSON.stringify(responseData, null, 2))

        // 4. Return typed response based on status
        switch (response.status) {
            case 200:
                console.log(`🟡 [Token Account POST] ✅ Token account creation successful!`)
                return {
                    status: 200,
                    data: responseData
                }
            case 400:
                console.log(`🟡 [Token Account POST] ⚠️ Bad request error (400)`)
                return {
                    status: 400,
                    data: responseData
                }
            case 401:
                console.log(`🟡 [Token Account POST] ⚠️ Unauthorized error (401) - this should not happen with fetchMiddleware`)
                return {
                    status: 401,
                    data: responseData
                }
            case 403:
                console.log(`🟡 [Token Account POST] ⚠️ Forbidden error (403)`)
                return {
                    status: 403,
                    data: responseData
                }
            case 408:
                console.log(`🟡 [Token Account POST] ⏱️ Request timeout (408)`)
                return {
                    status: 408,
                    data: responseData
                }
            case 409:
                console.log(`🟡 [Token Account POST] 🔄 Duplicate transaction (409)`)
                return {
                    status: 409,
                    data: responseData
                }
            case 422:
                console.log(`🟡 [Token Account POST] ⚠️ Transaction verification error (422)`)
                return {
                    status: 422,
                    data: responseData
                }
            case 429:
                console.log(`🟡 [Token Account POST] 🚨 Rate limit exceeded (429)`)
                return {
                    status: 429,
                    data: responseData
                }
            case 500:
                console.log(`🟡 [Token Account POST] ❌ Server error (500)`)
                return {
                    status: 500,
                    data: responseData
                }
            default:
                console.error(`🟡 [Token Account POST] ❌ Unexpected HTTP status: ${response.status}`)
                throw new Error(`Unexpected HTTP status: ${response.status}`)
        }

    } catch (error: unknown) {
        console.error(`🟡 [Token Account POST] ❌ Exception occurred:`, error)

        if (error instanceof Error) {
            console.error(`🟡 [Token Account POST] Error message: ${error.message}`)
            console.error(`🟡 [Token Account POST] Stack trace: ${error.stack}`)

            return {
                status: 500,
                data: {
                    error: "internal_error",
                    message: error.message
                }
            }
        } else {
            console.error(`🟡 [Token Account POST] Unknown error type:`, typeof error)

            return {
                status: 500,
                data: {
                    error: "internal_error",
                    message: "Unknown error occurred"
                }
            }
        }
    }
}
