interface WalletBalanceData {
    success: boolean
    balance: number
    lamports?: number
    cached?: boolean
    timestamp?: number
}

interface Response200 {
    status: 200
    data: WalletBalanceData
}

interface Response400 {
    status: 400
    data: {
        error: string
        message?: string
    }
}

interface Response404 {
    status: 404
    data: {
        error: string
        message?: string
    }
}

interface Response429 {
    status: 429
    data: {
        error: string
        message?: string
        retry_after?: number
    }
}

interface Response500 {
    status: 500
    data: {
        error: string
        message?: string
    }
}

export type GetResponse = Response200 | Response400 | Response404 | Response429 | Response500

/**
 * Get wallet balance for a Solana public key (no authentication required)
 * GET /api/solana/wallet/:pubkey/balance
 * @param pubkey - The wallet public key
 * @returns A promise that resolves to the typed response data
 */
export async function GET(pubkey: string): Promise<GetResponse> {
    try {
        const url = `https://devbackend.splitdo.app:8443/api/solana/wallet/${pubkey}/balance`

        console.log('[DevbackendNoAuth Wallet Balance GET] Fetching wallet balance from:', url)

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            switch (response.status) {
                case 400:
                    return {
                        status: 400,
                        data: {
                            error: 'invalid_pubkey',
                            message: 'Invalid wallet public key provided'
                        }
                    }
                case 404:
                    return {
                        status: 404,
                        data: {
                            error: 'wallet_not_found',
                            message: 'Wallet not found or has zero balance'
                        }
                    }
                case 429:
                    const retryAfter = response.headers.get('Retry-After')
                    return {
                        status: 429,
                        data: {
                            error: 'rate_limit_exceeded',
                            message: 'Rate limit exceeded. Please try again later.',
                            retry_after: retryAfter ? parseInt(retryAfter) : undefined
                        }
                    }
                case 500:
                    return {
                        status: 500,
                        data: {
                            error: 'internal_server_error',
                            message: 'Internal server error occurred'
                        }
                    }
                default:
                    throw new Error(`Unexpected HTTP status: ${response.status}`)
            }
        }

        const data = await response.json()

        console.log('[DevbackendNoAuth Wallet Balance GET] Successfully retrieved wallet balance:', {
            pubkey,
            balance: data.balance,
            success: data.success
        })

        return {
            status: 200,
            data: data
        }
    } catch (error) {
        console.error('[DevbackendNoAuth Wallet Balance GET] Failed to fetch wallet balance:', error)
        return {
            status: 500,
            data: {
                error: 'fetch_failed',
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            }
        }
    }
}