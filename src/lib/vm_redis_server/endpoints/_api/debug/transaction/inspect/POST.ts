interface InspectBody {
	signed_transaction: string
}

interface Response200 {
	status: 200
	data: {
		success: boolean
		transaction: {
			signatures: string[]
			message: {
				accountKeys: string[]
				header: {
					numRequiredSignatures: number
					numReadonlySignedAccounts: number
					numReadonlyUnsignedAccounts: number
				}
				recentBlockhash: string
				instructions: {
					programIdIndex: number
					accounts: number[]
					data: string
				}[]
			}
		}
		[key: string]: any
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

interface Response413 {
	status: 413
	data: {
		success: false
		error: string
		max_size: number
	}
}

interface Response500 {
	status: 500
	data: {
		success: false
		error: string
		message: string
		error_code?: number
	}
}

type PostResponse = Response200 | Response400 | Response413 | Response500

/*
 * DEBUG: Inspect signed transaction details
 *
 * POST /api/debug/transaction/inspect
 *
 * @param signedTransaction Base64 encoded signed transaction
 * @returns A promise that resolves to the expected data type
 */
export async function POST(signedTransaction: string): Promise<PostResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		const body: InspectBody = {
			signed_transaction: signedTransaction
		}

		const response = await fetch(
			BASE_URL + "/api/debug/transaction/inspect", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify(body)
			}
		)

		const responseData = await response.json()

		switch (response.status) {
			case 200:
				return {
					status: 200,
					data: responseData
				}
			case 400:
				return {
					status: 400,
					data: responseData
				}
			case 413:
				return {
					status: 413,
					data: responseData
				}
			case 500:
				return {
					status: 500,
					data: responseData
				}
			default:
				throw new Error(`Unexpected HTTP status: ${response.status}`)
		}
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.log("failed to fetch data")
			console.log("Error message: " + error.message)
		} else {
			console.log("an unknown error occurred")
		}
		throw error
	}
}
