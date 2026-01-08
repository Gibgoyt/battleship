// Import local Rust signing module for SOL transfers
import { signSolExchangeRequest } from './rust/index.ts'
import type { SolExchangeSignedBody } from './rust/index.ts'

// Response interfaces (similar to existing patterns)
interface Response200 {
    status: 200
    data: {
        success: true
        tx_signature: string
        confirmation_status: string
        slot: number
        block_time: number
        fee: number
        duration_ms: number
        timestamp: string
        mainnet_response: any
        debug_info?: {
            ssl_handshake_retries: number
            response_bytes: number
            connection_id: number
            poll_attempts: number
        }
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

interface Response500 {
    status: 500
    data: {
        success: false
        error: string
        message?: string
    }
}

type PostResponse = Response200 | Response400 | Response500

/*
 * Submit signed transaction to uSockets Solana endpoint
 *
 * POST /api/testing/usockets/solana-mainnet/sol-vault
 *
 * @param userId User's ID (for logging)
 * @param walletPath Path to user's wallet keypair
 * @param accessToken The bearer token for authentication (optional for testing)
 * @param amount Amount of SOL to transfer (e.g. 0.01)
 */
export async function POST(
    userId: string,
    walletPath: string,
    accessToken: string,
    amount: number
): Promise<PostResponse> {
    try {
        console.log(`[POST] Starting uSockets Solana vault transfer for user ${userId}...`)
        console.log(`[POST] Wallet: ${walletPath}`)
        console.log(`[POST] Amount: ${amount} SOL`)

        // Fix wallet path - ensure it has correct extension
        let resolvedWalletPath = walletPath
        if (walletPath.startsWith('/')) {
            // Already an absolute path, use as-is
            resolvedWalletPath = walletPath
        } else if (walletPath.includes('phantom_testuser')) {
            // For phantom test users, the walletDir already includes .json
            if (walletPath.endsWith('.json')) {
                resolvedWalletPath = `../../wallet/mainnet/testing/${walletPath}`
            } else {
                resolvedWalletPath = `../../wallet/mainnet/testing/${walletPath}.json`
            }
        } else if (!walletPath.includes('/')) {
            // For regular users, add /keypair.json
            resolvedWalletPath = `../../wallet/${walletPath}/keypair.json`
        }

        console.log(`[POST] Resolved wallet path: ${resolvedWalletPath}`)

        // Check if wallet file exists
        const path = await import('path')
        const fs = await import('fs')

        const absoluteWalletPath = path.resolve(resolvedWalletPath)
        console.log(`[POST] Absolute wallet path: ${absoluteWalletPath}`)

        if (!fs.existsSync(absoluteWalletPath)) {
            console.error(`[POST] ❌ Wallet file not found: ${absoluteWalletPath}`)
            return {
                status: 500,
                data: {
                    success: false,
                    error: "Wallet file not found",
                    message: `No wallet file at: ${absoluteWalletPath}`
                }
            }
        }

        console.log(`[POST] ✅ Wallet file found: ${absoluteWalletPath}`)

        // 1. Create a legitimate SOL transfer transaction
        console.log(`[POST] Creating legitimate SOL transfer transaction...`)
        console.log(`[POST] Amount: ${amount} SOL to SOL vault`)

        let signedBody: SolExchangeSignedBody
        try {
            signedBody = signSolExchangeRequest(
                absoluteWalletPath,
                amount,
                "https://api.mainnet-beta.solana.com"
            )
            console.log(`[POST] ✅ Transaction signed successfully`)
            console.log(`[POST] Transaction length: ${signedBody.signedTransaction.length} chars`)
            console.log(`[POST] Transaction preview: ${signedBody.signedTransaction.substring(0, 50)}...`)
        } catch (error) {
            console.error(`[POST] ❌ Transaction signing failed:`, error)
            return {
                status: 500,
                data: {
                    success: false,
                    error: "Transaction Signing Failed",
                    message: error instanceof Error ? error.message : "Unknown signing error"
                }
            }
        }

        // 2. Submit to local uSockets endpoint
        const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

        const endpoint = BASE_URL + "/api/testing/usockets/solana-mainnet/sol-vault"
        console.log(`[POST] Submitting to uSockets endpoint: ${endpoint}`)

        // Create the request body
        const requestBody = {
            transaction_signature: signedBody.signedTransaction
        }

        // Log the complete POST request JSON body
        console.log(`[POST] Complete POST request JSON body:`)
        console.log(`====================================`)
        console.log(JSON.stringify(requestBody, null, 2))
        console.log(`====================================`)
        console.log(`[POST] Transaction signature length: ${signedBody.signedTransaction.length} characters`)

        // Validate transaction before sending
        if (!signedBody.signedTransaction || signedBody.signedTransaction.length === 0) {
            console.error(`[POST] 🚨 ABORTING: signed transaction is empty!`)
            return {
                status: 400,
                data: {
                    success: false,
                    error: "Invalid Transaction",
                    message: "Signed transaction is empty - cannot proceed"
                }
            }
        }

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
                // Note: No Authorization header needed for testing endpoint
            },
            body: JSON.stringify(requestBody)
        })

        console.log(`[POST] uSockets endpoint responded with status: ${response.status}`)

        const responseData = await response.json()
        console.log(`[POST] Response data:`, JSON.stringify(responseData, null, 2))

        // 3. Return typed response based on status
        switch (response.status) {
            case 200:
                console.log(`[POST] ✅ uSockets request successful!`)
                return {
                    status: 200,
                    data: responseData
                }
            case 400:
                console.log(`[POST] ❌ Bad request (400)`)
                return {
                    status: 400,
                    data: responseData
                }
            case 500:
                console.log(`[POST] ❌ Server error (500)`)
                return {
                    status: 500,
                    data: responseData
                }
            default:
                console.error(`[POST] ❌ Unexpected HTTP status: ${response.status}`)
                throw new Error(`Unexpected HTTP status: ${response.status}`)
        }

    } catch (error: unknown) {
        console.error(`[POST] ❌ Exception occurred:`, error)

        if (error instanceof Error) {
            console.error(`[POST] Error message: ${error.message}`)
            console.error(`[POST] Stack trace: ${error.stack}`)

            return {
                status: 500,
                data: {
                    success: false,
                    error: "Network Error",
                    message: error.message
                }
            }
        } else {
            console.error(`[POST] Unknown error type:`, typeof error)

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