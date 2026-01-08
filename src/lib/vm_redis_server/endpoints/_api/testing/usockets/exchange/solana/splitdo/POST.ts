// Import local Rust signing module for SOL transfers (reuse existing)
import { signSolExchangeRequest } from '../../../solana-mainnet/sol-vault/rust/index.ts'
import type { SolExchangeSignedBody } from '../../../solana-mainnet/sol-vault/rust/index.ts'

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
 * @param userId User's ID (for logging)
 * @param walletPath Path to user's wallet keypair
 * @param accessToken The bearer token for authentication (optional for testing)
 * @param amount Amount of SOL to exchange (e.g. 0.01)
 */
export async function POST(
    userId: string,
    walletPath: string,
    accessToken: string,
    amount: number
): Promise<ExchangePostResponse> {
    try {
        console.log(`[Exchange POST] Starting SOL to SPLITDO exchange for user ${userId}...`)
        console.log(`[Exchange POST] Wallet: ${walletPath}`)
        console.log(`[Exchange POST] Amount: ${amount} SOL`)

        // Fix wallet path - ensure it has correct extension (same logic as sol-vault)
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

        console.log(`[Exchange POST] Resolved wallet path: ${resolvedWalletPath}`)

        // Check if wallet file exists
        const path = await import('path')
        const fs = await import('fs')

        const absoluteWalletPath = path.resolve(resolvedWalletPath)
        console.log(`[Exchange POST] Absolute wallet path: ${absoluteWalletPath}`)

        if (!fs.existsSync(absoluteWalletPath)) {
            console.error(`[Exchange POST] ❌ Wallet file not found: ${absoluteWalletPath}`)
            return {
                status: 500,
                data: {
                    success: false,
                    error: "Wallet file not found",
                    message: `No wallet file at: ${absoluteWalletPath}`
                }
            }
        }

        console.log(`[Exchange POST] ✅ Wallet file found: ${absoluteWalletPath}`)

        // 1. Create a legitimate SOL transfer transaction for exchange
        console.log(`[Exchange POST] Creating SOL exchange transaction...`)
        console.log(`[Exchange POST] Amount: ${amount} SOL to exchange for SPLITDO`)

        let signedBody: SolExchangeSignedBody
        try {
            signedBody = signSolExchangeRequest(
                absoluteWalletPath,
                amount,
                "https://api.mainnet-beta.solana.com"
            )
            console.log(`[Exchange POST] ✅ Transaction signed successfully`)
            console.log(`[Exchange POST] Transaction length: ${signedBody.signedTransaction.length} chars`)
            console.log(`[Exchange POST] Transaction preview: ${signedBody.signedTransaction.substring(0, 50)}...`)
        } catch (error) {
            console.error(`[Exchange POST] ❌ Transaction signing failed:`, error)
            return {
                status: 500,
                data: {
                    success: false,
                    error: "Transaction Signing Failed",
                    message: error instanceof Error ? error.message : "Unknown signing error"
                }
            }
        }

        // 2. Submit to local uSockets exchange endpoint
        const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

        const endpoint = BASE_URL + "/api/testing/usockets/exchange/solana/splitdo"
        console.log(`[Exchange POST] Submitting to exchange endpoint: ${endpoint}`)

        // Create the request body
        const requestBody = {
            transaction_signature: signedBody.signedTransaction
        }

        // Log the complete POST request JSON body
        console.log(`[Exchange POST] Complete POST request JSON body:`)
        console.log(`====================================`)
        console.log(JSON.stringify(requestBody, null, 2))
        console.log(`====================================`)
        console.log(`[Exchange POST] Transaction signature length: ${signedBody.signedTransaction.length} characters`)

        // Validate transaction before sending
        if (!signedBody.signedTransaction || signedBody.signedTransaction.length === 0) {
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

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
                // Note: No Authorization header needed for testing endpoint
            },
            body: JSON.stringify(requestBody)
        })

        console.log(`[Exchange POST] Exchange endpoint responded with status: ${response.status}`)

        const responseData = await response.json()
        console.log(`[Exchange POST] Response data:`, JSON.stringify(responseData, null, 2))

        // 3. Return typed response based on status
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
                throw new Error(`Unexpected HTTP status: ${response.status}`)
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