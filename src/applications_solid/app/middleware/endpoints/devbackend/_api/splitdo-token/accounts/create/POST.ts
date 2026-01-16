import { fetchMiddleware } from '../../../../../../fetch-wrapper'
import { createLogger } from '../../../../../../../../../lib/logger'

const logger = createLogger('[SplitDo Token Accounts Create POST Endpoint]')

interface CreateAccountParams {
    wallet_address: string
    token_account_address: string
    signed_transaction: string
}

interface TokenAccount {
    user_id: string
    token_account_pubkey: string
    owner_wallet: string
    balance_tokens: number
    created_at: string
    last_updated: string
}

interface Response200 {
    status: 200
    data: {
        success: true
        data: TokenAccount
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

interface Response403 {
    status: 403
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

export type PostResponse = Response200 | Response400 | Response401 | Response403 | Response500

/*
 * Create SplitDo token account with automatic Firebase JWT auth handling
 *
 * POST /api/splitdo-token/accounts/create
 *
 * @param params - Account creation parameters
 * @returns A promise that resolves to the typed response data
 */
export async function POST(params: CreateAccountParams): Promise<PostResponse> {
    // Client-side parameter validation for better UX
    if (!params.wallet_address || !params.token_account_address || !params.signed_transaction) {
        logger.warn('Invalid parameters provided for account creation', {
            hasWalletAddress: !!params.wallet_address,
            hasTokenAccountAddress: !!params.token_account_address,
            hasSignedTransaction: !!params.signed_transaction
        })
        return {
            status: 400,
            data: {
                success: false,
                error: 'invalid_parameters',
                message: 'Missing required parameters: wallet_address, token_account_address, or signed_transaction'
            }
        }
    }


    try {
        logger.info('Starting SplitDo token account creation request', {
            wallet_address: params.wallet_address,
            token_account_address: params.token_account_address,
            signed_transaction_length: params.signed_transaction.length
        })

        let response = await fetchMiddleware('https://devbackend.splitdo.app:8443/api/splitdo-token/accounts/create', {
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
            logger.warn('Account create endpoint received 401, attempting direct token refresh')

            try {
                // Import auth store dynamically to avoid circular dependencies
                const { getGlobalAuthStore } = await import('../../../../../../firebase/auth-store')
                const authStore = getGlobalAuthStore()
                await authStore.refreshToken() // Uses fallback mechanism

                // Retry the request exactly once
                response = await fetchMiddleware('https://devbackend.splitdo.app:8443/api/splitdo-token/accounts/create', {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(params)
                })

                // If still 401, don't retry again
                if (response.status === 401) {
                    logger.error('Account create endpoint still receiving 401 after token refresh - auth failure')
                    return {
                        status: 401,
                        data: {
                            success: false,
                            error: 'authentication_failed',
                            message: 'Session expired, please log in again'
                        }
                    }
                }

            } catch (refreshError) {
                logger.error('Direct token refresh failed in account create endpoint', {
                    error: refreshError instanceof Error ? refreshError.message : 'Unknown error'
                })
                return {
                    status: 401,
                    data: {
                        success: false,
                        error: 'token_refresh_failed',
                        message: 'Unable to refresh authentication token'
                    }
                }
            }
        }

        const responseData = await response.json()

        // Return structured response based on status
        switch (response.status) {
            case 200:
                logger.info('Successfully created SplitDo token account', {
                    userId: responseData.data?.user_id,
                    tokenAccount: responseData.data?.token_account_pubkey,
                    ownerWallet: responseData.data?.owner_wallet
                })
                return {
                    status: 200,
                    data: responseData
                }
            case 400:
                logger.warn('Bad request error in account creation', {
                    response: responseData,
                    wallet_address: params.wallet_address,
                    token_account_address: params.token_account_address
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
                logger.warn('Forbidden access - this should not happen with fetchMiddleware')
                return {
                    status: 403,
                    data: responseData
                }
            case 500:
                logger.error('Internal server error in account creation', {
                    response: responseData
                })
                return {
                    status: 500,
                    data: responseData
                }
            default:
                logger.error('Unexpected HTTP status received', {
                    status: response.status,
                    statusText: response.statusText,
                    response: responseData
                })
                throw new Error(`Unexpected HTTP status: ${response.status}`)
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error("SplitDo token account create endpoint failed", {
                error: error.message,
                stack: error.stack,
                wallet_address: params.wallet_address,
                token_account_address: params.token_account_address
            })
        } else {
            logger.error("Unknown error in account create endpoint", { error, params })
        }
        throw error
    }
}