import { PUT as BackendPUT } from 'src/lib/vm_redis_server/endpoints/_api/users/me/PUT';
import { firebaseTokenStorage } from 'src/lib/auth/firebase-token-storage';

export interface UpdateProfileData {
  bio?: string;
  currency?: string;
  language?: string;
  status?: string;
  email?: string;
  wallet_address?: string;
  add_ios_token?: string;
  add_android_token?: string;
  remove_ios_token?: string;
  remove_android_token?: string;
}

/**
 * Update current user profile
 *
 * @param data The user data to update
 * @returns A promise that resolves to the response data
 * @throws Error if user is not authenticated or request fails
 */
export async function PUT(data: UpdateProfileData) {
  // Get auth token from Firebase token storage
  const tokens = firebaseTokenStorage.getTokens();
  const token = tokens.idToken;

  if (!token) {
    throw new Error('Not authenticated - no token available');
  }

  try {
    const response = await BackendPUT(token, data);
    return response;
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
}
