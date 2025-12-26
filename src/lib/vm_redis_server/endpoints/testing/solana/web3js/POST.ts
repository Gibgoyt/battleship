// import { API_BASE_URL } from "../../../index.ts"

export async function POST(signedTransactionBase64: string) {
    const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'
    const url = `${BASE_URL}/testing/solana/web3js`
    
    // Disable SSL verification for self-signed certificates
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                signed_transaction: signedTransactionBase64
            })
        })

        const data = await response.json()
        return {
            status: response.status,
            data: data
        }
    } catch (error) {
        console.error("Error in POST /testing/solana/web3js:", error)
        return {
            status: 500,
            data: { error: String(error) }
        }
    }
}
