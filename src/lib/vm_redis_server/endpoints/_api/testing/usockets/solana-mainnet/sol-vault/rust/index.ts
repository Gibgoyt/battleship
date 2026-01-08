// Load the shared NAPI module for uSockets Solana vault transfers
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// Path to shared library
const sharedLibPath = '../../../../../../../../rust_shared/index.node'

const native = require(sharedLibPath)

export interface SolExchangeSignedBody {
    signedTransaction: string  // NAPI converts snake_case to camelCase
}

export function signSolExchangeRequest(walletPath: string, solAmount: number, rpcUrl: string): SolExchangeSignedBody {
    return native.signSolExchangeRequest(walletPath, solAmount, rpcUrl)
}