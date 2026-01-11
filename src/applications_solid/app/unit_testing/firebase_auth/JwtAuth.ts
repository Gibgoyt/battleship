import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

export interface FirebaseUser {
	email: string
	password: string
}

export interface FirebaseAuthResponse {
	kind: string
	localId: string
	email: string
	displayName: string
	idToken: string
	registered: boolean
	refreshToken: string
	expiresIn: string
}

export interface FirebaseAuthErrorResponse {
	error: {
		code: number
		message: string
		errors: Array<{
			message: string
			domain: string
			reason: string
		}>
	}
}

// Hardcoded key from get_jwt.sh
const FIREBASE_API_KEY = "AIzaSyBQ2AuI6sg1p1wpaOzJRV37u5Z0M1JNabs"
const FIREBASE_AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`

/**
 * loadUser - Loads user credentials from a JSON file
 * @param username The name of the user file (e.g., "TestUser1", "Nic", "Khadija")
 *                 Can be just the name or with .json extension
 */
export function loadUser(username: string): FirebaseUser {
	let filename = username
	if (!filename.endsWith('.json')) {
		filename += '.json'
	}

	// Resolve path relative to this file
	const __filename = fileURLToPath(import.meta.url)
	const __dirname = path.dirname(__filename)
	const filePath = path.join(__dirname, 'users', filename)
	
	try {
		const fileContent = fs.readFileSync(filePath, 'utf-8')
		return JSON.parse(fileContent) as FirebaseUser
	} catch (error) {
		console.error(`Error loading user file ${filePath}:`, error)
		throw error
	}
}

/**
 * getJwt - Authenticates with Firebase and returns the JWT token (idToken)
 * @param user The user object containing email and password, or the username string to load
 */
export async function getJwt(userOrName: FirebaseUser | string): Promise<FirebaseAuthResponse> {
	let user: FirebaseUser
	
	if (typeof userOrName === 'string') {
		user = loadUser(userOrName)
	} else {
		user = userOrName
	}

	try {
		const response = await fetch(FIREBASE_AUTH_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				email: user.email,
				password: user.password,
				returnSecureToken: true
			})
		})

		const data = await response.json()

		if (!response.ok) {
			const errorData = data as FirebaseAuthErrorResponse
			throw new Error(`Firebase Auth Failed: ${errorData.error?.message || 'Unknown error'}`)
		}

		return data as FirebaseAuthResponse
	} catch (error) {
		console.error("Firebase Authentication Error:", error)
		throw error
	}
}
