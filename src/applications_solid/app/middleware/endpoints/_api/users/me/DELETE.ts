import { DELETE as BackendDELETE } from 'src/lib/vm_redis_server/endpoints/_api/users/me/DELETE';
import { firebaseTokenStorage } from 'src/lib/auth/firebase-token-storage';

/**
 * Delete current user account
 *
 * @returns A promise that resolves to the response data
 * @throws Error if user is not authenticated or request fails
 */
export async function DELETE() {
  // Get auth token from Firebase token storage
  const tokens = firebaseTokenStorage.getTokens();
  const token = tokens.idToken;

  if (!token) {
    throw new Error('Not authenticated - no token available');
  }

  try {
    const response = await BackendDELETE(token);
    return response;
  } catch (error) {
    console.error('Failed to delete account:', error);
    throw error;
  }
}
