// Load the shared NAPI module
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// Path to shared library
const sharedLibPath = '../../../../../../../rust_shared/index.node'

const native = require(sharedLibPath)

export interface SolExchangeSignedBody {
    signed_transaction: string
}

export function signSolExchangeRequest(walletPath: string, solAmount: number): SolExchangeSignedBody {
    return native.signSolExchangeRequest(walletPath, solAmount)
}
