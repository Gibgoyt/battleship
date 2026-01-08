interface Response302 {
	status: 302
	headers: {
		Location: string
		"Cache-Control": string
	}
	data: null // No body for 302 redirect
}

type GetResponse = Response302

/*
 * Process GitHub OAuth callback (public endpoint)
 *
 * GET /api/v1/integrations/github/auth/callback
 *
 * @param code The authorization code from GitHub
 * @param state The state parameter for CSRF protection
 * @param error Optional error code from GitHub
 * @returns A promise that resolves to the expected data type (redirect)
 */
export async function GET(code?: string, state?: string, error?: string): Promise<GetResponse> {
	try {
		// Get BASE_URL from environment with fallback
		const BASE_URL = process.env.BASE_URL || 'https://localhost:8443'

		// Disable SSL verification for self-signed certificates
		process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"

		// Construct query string
		const params = new URLSearchParams()
		if (code) params.append("code", code)
		if (state) params.append("state", state)
		if (error) params.append("error", error)

		// IMPORTANT: fetch automatically follows redirects by default.
		// We need to set redirect: 'manual' to capture the 302 response.
		const response = await fetch(
			BASE_URL + `/api/v1/integrations/github/auth/callback?${params.toString()}`, {
				method: "GET",
				redirect: "manual"
			}
		)

		// 302 response has no body, but check headers
		if (response.status === 302) {
			return {
				status: 302,
				headers: {
					Location: response.headers.get("Location") || "",
					"Cache-Control": response.headers.get("Cache-Control") || ""
				},
				data: null
			}
		} else {
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
