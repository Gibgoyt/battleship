import { createLogger } from 'src/lib/logger'
import { fetchMiddleware } from '../../../../../../../../fetch-wrapper'

const logger = createLogger('[Exchange POST Endpoint]')

// Exchange-specific response interfaces
interface Response200 {
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

interface Response404 {
    status: 404
    data: {
        success: false
        error: string
        message: string
    }
}

interface Response422 {
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

interface Response429 {
    status: 429
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
        stage1_sol_confirmation?: any
        stage2_splitdo_exchange?: any
    }
}

export type PostResponse = Response200 | Response401 | Response403 | Response404 | Response422 | Response429 | Response500

/*
 * Submit signed transaction to uSockets SOL to SPLITDO exchange endpoint
 *
 * POST /api/testing/usockets/exchange/solana/splitdo
 *
 * @param solAmount Amount of SOL in lamports
 * @param signedTransaction Base64 signed transaction from Phantom wallet
 * @returns Promise<PostResponse> Typed response with status and data
 */
export async function POST(
    solAmount: number,
    signedTransaction: string
): Promise<PostResponse> {
    try {
        logger.info('Starting SOL to SPLITDO exchange', {
            solAmount: solAmount,
            signedTransactionLength: signedTransaction.length,
            transactionPreview: signedTransaction.substring(0, 50) + '...'
        })

        // Validate signed transaction
        if (!signedTransaction || signedTransaction.length === 0) {
            logger.error('Signed transaction is empty - aborting exchange')
            return {
                status: 500,
                data: {
                    success: false,
                    error: "Invalid Transaction",
                    message: "Signed transaction is empty - cannot proceed"
                }
            }
        }

        // Validate SOL amount
        if (!solAmount || solAmount <= 0) {
            logger.error('Invalid SOL amount - aborting exchange', { solAmount })
            return {
                status: 500,
                data: {
                    success: false,
                    error: "Invalid Amount",
                    message: "SOL amount must be greater than zero"
                }
            }
        }

        // Create the request body (match backend expected format)
        const requestBody = {
            sol_amount: solAmount,
            transaction_signature: signedTransaction
        }

        logger.debug('Exchange request payload prepared', {
            sol_amount: requestBody.sol_amount,
            transaction_signature_length: requestBody.transaction_signature.length,
            requestBodyKeys: Object.keys(requestBody)
        })

        // Submit to devbackend uSockets exchange endpoint using fetchMiddleware
        const endpoint = 'https://devbackend.splitdo.app:8443/api/testing/usockets/exchange/solana/splitdo'
        logger.info('Submitting exchange request to endpoint', { endpoint })

        const response = await fetchMiddleware(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        })

        logger.info('Exchange endpoint responded', {
            status: response.status,
            statusText: response.statusText
        })

        const responseData = await response.json()
        logger.debug('Exchange response data received', {
            success: responseData.success,
            hasStage1Data: Boolean(responseData.stage1_sol_confirmation),
            hasStage2Data: Boolean(responseData.stage2_splitdo_exchange)
        })

        // Return typed response based on status
        switch (response.status) {
            case 200:
                logger.info('Exchange request successful', {
                    stage1Status: responseData.stage1_sol_confirmation?.result ? 'success' : 'error',
                    stage2Status: responseData.stage2_splitdo_exchange?.result ? 'success' : 'error'
                })
                return {
                    status: 200,
                    data: responseData
                }
            case 401:
                logger.warn('Unauthorized access - authentication failed', {
                    error: responseData.error,
                    message: responseData.message
                })
                return {
                    status: 401,
                    data: responseData
                }
            case 403:
                logger.warn('Forbidden access - insufficient permissions', {
                    error: responseData.error,
                    message: responseData.message
                })
                return {
                    status: 403,
                    data: responseData
                }
            case 404:
                logger.warn('Exchange endpoint not found', {
                    error: responseData.error,
                    message: responseData.message
                })
                return {
                    status: 404,
                    data: responseData
                }
            case 422:
                logger.warn('Exchange validation error - invalid request data', {
                    error: responseData.error,
                    message: responseData.message,
                    userPubkey: responseData.user_pubkey,
                    requiredAtaAddress: responseData.required_ata_address
                })
                return {
                    status: 422,
                    data: responseData
                }
            case 429:
                logger.warn('Rate limit exceeded - too many requests', {
                    error: responseData.error,
                    message: responseData.message
                })
                return {
                    status: 429,
                    data: responseData
                }
            case 500:
                logger.error('Exchange server error', {
                    error: responseData.error,
                    message: responseData.message,
                    hasStage1Data: Boolean(responseData.stage1_sol_confirmation),
                    hasStage2Data: Boolean(responseData.stage2_splitdo_exchange)
                })
                return {
                    status: 500,
                    data: responseData
                }
            default:
                logger.error('Unexpected HTTP status from exchange endpoint', {
                    status: response.status,
                    statusText: response.statusText
                })
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
        logger.error('Exception occurred during exchange request', { error })

        if (error instanceof Error) {
            logger.error('Exchange error details', {
                message: error.message,
                stack: error.stack
            })

            return {
                status: 500,
                data: {
                    success: false,
                    error: "Network Error",
                    message: error.message
                }
            }
        } else {
            logger.error('Unknown error type during exchange', {
                errorType: typeof error
            })

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