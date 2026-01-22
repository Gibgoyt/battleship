// withSend token account creation endpoint - accepts base64 signed transactions
import { fetchMiddleware } from '../../../../../../../../fetch-wrapper'
import { createLogger } from '../../../../../../../../../../../lib/logger'

const logger = createLogger('[Token Account withSend POST Endpoint]')

// withSend specific response interfaces matching the backend API specification
interface TokenAccountWithSendResponse201 {
    status: 201
    data: {
        success: true
        created: true
        tx_signature: string
        data: {
            user_id: string
            token_account_pubkey: string
            owner_wallet: string
            balance_tokens: number
            splitdo_token_mint: string
            created_at: string
            last_updated: string
        }
    }
}

interface TokenAccountWithSendResponse400 {
    status: 400
    data: {
        error: "invalid_json" | "missing_fields" | "empty_fields" | "invalid_transaction_format" | "transaction_inspection_failed"
        message: string
        provided_transaction?: string
        inspection_error?: string
        validation_error?: string
        endpoint?: string
    }
}

interface TokenAccountWithSendResponse401 {
    status: 401
    data: {
        error: "missing_authorization" | "invalid_authorization" | "invalid_token" | "authentication_failed" | "token_refresh_failed"
        message: string
    }
}

interface TokenAccountWithSendResponse403 {
    status: 403
    data: {
        error: string
        blocked_origin: string
        endpoint: string
    }
}

interface TokenAccountWithSendResponse408 {
    status: 408
    data: {
        error: "processing_timeout"
        message: string
        completed_stages: string[]
    }
}

interface TokenAccountWithSendResponse409 {
    status: 409
    data: {
        error: "token_account_already_exists" | "duplicate_transaction" | "duplicate_processing"
        message: string
        token_account_pubkey?: string
        user_wallet?: string
        splitdo_token_mint?: string
        current_balance?: string
        current_ui_amount?: string
        last_updated?: string
        transaction_hash?: string
    }
}

interface TokenAccountWithSendResponse422 {
    status: 422
    data: {
        error: "transaction_send_failed" | "transaction_polling_failed"
        message: string
        send_error?: string
        user_wallet?: string
        token_account_pubkey?: string
        splitdo_token_mint?: string
        tx_signature?: string
    }
}

interface TokenAccountWithSendResponse429 {
    status: 429
    data: {
        error: "rate_limit_exceeded"
        message: string
        retry_after?: number
    }
}

interface TokenAccountWithSendResponse500 {
    status: 500
    data: {
        error: "redis_error" | "storage_error" | "internal_error"
        message: string
        details?: string
    }
}

interface TokenAccountWithSendResponse503 {
    status: 503
    data: {
        error: "rpc_error"
        message: string
        rpc_error: string
        token_account_pubkey: string
    }
}

export type PostResponse = TokenAccountWithSendResponse201 | TokenAccountWithSendResponse400 | TokenAccountWithSendResponse401 | TokenAccountWithSendResponse403 | TokenAccountWithSendResponse408 | TokenAccountWithSendResponse409 | TokenAccountWithSendResponse422 | TokenAccountWithSendResponse429 | TokenAccountWithSendResponse500 | TokenAccountWithSendResponse503

// Request body interface for withSend endpoint
interface WithSendParams {
    signed_transaction: string    // Base64 encoded signed transaction
    user_wallet: string          // User's wallet public key
    token_account_pubkey: string // Expected token account address
}

/*
 * Create SPLITDO token account with backend transaction sending (withSend)
 *
 * POST /api/testing/usockets/token-account/create/withSend
 *
 * This endpoint accepts a base64 signed transaction and submits it to Solana mainnet
 * via the backend, then polls for confirmation and stores the result.
 *
 * Key differences from the original token-account/create endpoint:
 * - Input: signed_transaction (base64) instead of tx_signature (base58)
 * - Process: ATA check → sendTransaction → polling → storage
 * - Returns: 201 Created on success, 409 Conflict if ATA already exists
 *
 * @param params - WithSend creation parameters with base64 signed transaction
 * @returns A promise that resolves to the typed response data
 */
export async function POST(params: WithSendParams): Promise<PostResponse> {
    // Client-side parameter validation for better UX
    if (!params.signed_transaction || !params.user_wallet || !params.token_account_pubkey) {
        logger.warn('Invalid parameters provided for withSend token account creation', {
            hasSignedTransaction: !!params.signed_transaction,
            hasUserWallet: !!params.user_wallet,
            hasTokenAccountPubkey: !!params.token_account_pubkey
        })
        return {
            status: 400,
            data: {
                error: 'missing_fields',
                message: 'Request must contain signed_transaction, user_wallet, and token_account_pubkey fields'
            }
        }
    }

    // Check for empty fields
    if (params.signed_transaction.trim() === '' || params.user_wallet.trim() === '' || params.token_account_pubkey.trim() === '') {
        logger.warn('Empty parameters provided for withSend token account creation', {
            signedTransactionEmpty: params.signed_transaction.trim() === '',
            userWalletEmpty: params.user_wallet.trim() === '',
            tokenAccountEmpty: params.token_account_pubkey.trim() === ''
        })
        return {
            status: 400,
            data: {
                error: 'empty_fields',
                message: 'signed_transaction, user_wallet, and token_account_pubkey cannot be empty'
            }
        }
    }

    // Validate base64 transaction format (basic check for base64 characters)
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    if (!base64Regex.test(params.signed_transaction)) {
        logger.warn('Invalid base64 transaction format provided', {
            transactionLength: params.signed_transaction.length,
            transactionPreview: params.signed_transaction.substring(0, 50) + '...'
        })
        return {
            status: 400,
            data: {
                error: 'invalid_transaction_format',
                message: 'signed_transaction must be a valid base64 encoded transaction',
                provided_transaction: params.signed_transaction.substring(0, 100) + '...'
            }
        }
    }

    try {
        logger.info('Starting withSend token account creation request', {
            userWallet: params.user_wallet,
            tokenAccountPubkey: params.token_account_pubkey,
            signedTransactionLength: params.signed_transaction.length,
            transactionPreview: params.signed_transaction.substring(0, 50) + '...'
        })

        let response = await fetchMiddleware('https://devbackend.splitdo.app:8443/api/testing/usockets/token-account/create/withSend', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
            // fetchMiddleware automatically handles:
            // - Authorization header injection
            // - 401/403 retry logic with token refresh
            // - Global rate limiting (Cloudflare 1015)
            // - Session expiry notification on final auth failure
        })

        // Enhanced: If 401 and fetchMiddleware didn't handle it, try direct refresh once
        if (response.status === 401) {
            logger.warn('withSend token account endpoint received 401, attempting direct token refresh')

            try {
                // Import auth store dynamically to avoid circular dependencies
                const { getGlobalAuthStore } = await import('../../../../../../../../firebase/auth-store')
                const authStore = getGlobalAuthStore()
                await authStore.refreshToken() // Uses fallback mechanism

                // Retry the request exactly once
                response = await fetchMiddleware('https://devbackend.splitdo.app:8443/api/testing/usockets/token-account/create/withSend', {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(params)
                })

                // If still 401, don't retry again
                if (response.status === 401) {
                    logger.error('withSend token account endpoint still receiving 401 after token refresh - auth failure')
                    return {
                        status: 401,
                        data: {
                            error: 'authentication_failed',
                            message: 'Session expired, please log in again'
                        }
                    }
                }

            } catch (refreshError) {
                logger.error('Direct token refresh failed in withSend token account endpoint', {
                    error: refreshError instanceof Error ? refreshError.message : 'Unknown error'
                })
                return {
                    status: 401,
                    data: {
                        error: 'token_refresh_failed',
                        message: 'Unable to refresh authentication token'
                    }
                }
            }
        }

        let responseData: any

        // Handle CloudFlare rate limiting (429 with "error code: 1015" in body)
        if (response.status === 429) {
            const responseText = await response.text()
            if (responseText.includes("error code: 1015")) {
                logger.warn('CloudFlare rate limiting detected in withSend token account endpoint', {
                    userWallet: params.user_wallet,
                    tokenAccount: params.token_account_pubkey
                })
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
                    const retryAfter = response.headers.get('Retry-After')
                    responseData = { 
                        error: "rate_limit_exceeded", 
                        message: responseText,
                        retry_after: retryAfter ? parseInt(retryAfter) : undefined
                    }
                }
            }
        } else {
            responseData = await response.json()
        }

        // Return structured response based on status
        switch (response.status) {
            case 201:
                logger.info('Successfully created token account with withSend', {
                    userId: responseData.data?.user_id,
                    tokenAccount: responseData.data?.token_account_pubkey,
                    ownerWallet: responseData.data?.owner_wallet,
                    txSignature: responseData.tx_signature,
                    balance: responseData.data?.balance_tokens
                })
                return {
                    status: 201,
                    data: responseData
                }
            case 400:
                logger.warn('Bad request error in withSend token account creation', {
                    response: responseData,
                    userWallet: params.user_wallet,
                    tokenAccount: params.token_account_pubkey
                })
                return {
                    status: 400,
                    data: responseData
                }
            case 401:
                logger.warn('Unauthorized access - this should not happen with fetchMiddleware')
                return {
                    status: 401,
                    data: responseData
                }
            case 403:
                logger.warn('Forbidden access in withSend token account creation', {
                    response: responseData,
                    userWallet: params.user_wallet
                })
                return {
                    status: 403,
                    data: responseData
                }
            case 408:
                logger.warn('Processing timeout in withSend token account creation', {
                    response: responseData,
                    completedStages: responseData.completed_stages,
                    userWallet: params.user_wallet,
                    tokenAccount: params.token_account_pubkey
                })
                return {
                    status: 408,
                    data: responseData
                }
            case 409:
                logger.info('Token account already exists or duplicate transaction detected', {
                    response: responseData,
                    tokenAccount: responseData.token_account_pubkey,
                    userWallet: responseData.user_wallet,
                    currentBalance: responseData.current_balance
                })
                return {
                    status: 409,
                    data: responseData
                }
            case 422:
                logger.error('Transaction processing failed in withSend token account creation', {
                    response: responseData,
                    sendError: responseData.send_error,
                    txSignature: responseData.tx_signature,
                    userWallet: params.user_wallet,
                    tokenAccount: params.token_account_pubkey
                })
                return {
                    status: 422,
                    data: responseData
                }
            case 429:
                // This is handled above, but add case for completeness
                logger.warn('Rate limit exceeded in withSend token account creation', {
                    retryAfter: response.headers.get('Retry-After'),
                    response: responseData
                })
                const retryAfter = response.headers.get('Retry-After')
                return {
                    status: 429,
                    data: {
                        error: 'rate_limit_exceeded',
                        message: responseData?.message || 'Rate limit exceeded. Please try again later.',
                        retry_after: retryAfter ? parseInt(retryAfter) : undefined
                    }
                }
            case 500:
                logger.error('Internal server error in withSend token account creation', {
                    response: responseData,
                    userWallet: params.user_wallet,
                    tokenAccount: params.token_account_pubkey
                })
                return {
                    status: 500,
                    data: responseData
                }
            case 503:
                logger.error('RPC error in withSend token account creation', {
                    response: responseData,
                    rpcError: responseData.rpc_error,
                    tokenAccount: responseData.token_account_pubkey
                })
                return {
                    status: 503,
                    data: responseData
                }
            default:
                logger.error('Unexpected HTTP status received from withSend endpoint', {
                    status: response.status,
                    statusText: response.statusText,
                    response: responseData
                })
                throw new Error(`Unexpected HTTP status: ${response.status}`)
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error("withSend token account create endpoint failed", {
                error: error.message,
                stack: error.stack,
                userWallet: params.user_wallet,
                tokenAccountPubkey: params.token_account_pubkey,
                signedTransactionLength: params.signed_transaction.length
            })
        } else {
            logger.error("Unknown error in withSend token account create endpoint", { error, params })
        }
        throw error
    }
}