// Load the shared NAPI module
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// Path to shared library
const sharedLibPath = '../../../../../../../rust_shared/index.node'

const native = require(sharedLibPath)

export interface BalanceCheckResult {
    solBalance: number         // In SOL (lamports / 1e9)
    splitdoBalance: number     // In SPLITDO tokens
    solLamports: string        // Raw lamports (as string)
    splitdoRaw: string         // Raw token amount (as string)
    pubkey: string
    splitdoAta: string
}

export function checkBalances(pubkey: string, rpcUrl: string): BalanceCheckResult {
    return native.checkBalances(pubkey, rpcUrl)
}