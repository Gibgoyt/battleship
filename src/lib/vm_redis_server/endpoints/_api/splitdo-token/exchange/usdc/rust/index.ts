// Load the shared NAPI module
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// Path to shared library
const sharedLibPath = '../../../../../../../rust_shared/index.node'

const native = require(sharedLibPath)

export interface DepositSignedBody {
    signed_transaction: string
}

export function signDepositRequest(walletPath: string, usdcAmount: number): DepositSignedBody {
    return native.signDepositRequest(walletPath, usdcAmount)
}
