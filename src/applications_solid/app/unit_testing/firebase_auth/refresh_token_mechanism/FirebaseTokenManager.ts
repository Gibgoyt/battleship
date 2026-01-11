// Firebase Auth Token Refresh Management for Firebase SDK 12.6.0
// WARNING: This is NOT recommended for most use cases. Firebase handles token refresh automatically.

import {
  getAuth,
  onAuthStateChanged,
  onIdTokenChanged,
  getIdToken,
  getIdTokenResult
} from 'firebase/auth';

class FirebaseTokenManager {
  constructor() {
    this.auth = getAuth();
    this.refreshInterval = null;
    this.tokenRefreshCallback = null;
    this.isDestroyed = false;
  }

  /**
   * Initialize the token manager
   * @param {Function} onTokenRefresh - Callback when token is refreshed
   */
  initialize(onTokenRefresh = null) {
    this.tokenRefreshCallback = onTokenRefresh;

    // Listen for auth state changes
    this.unsubscribeAuth = onAuthStateChanged(this.auth, (user) => {
      if (user && !this.isDestroyed) {
        console.log('User authenticated, starting token refresh mechanism');
        this.startTokenRefresh();
      } else {
        console.log('User not authenticated, stopping token refresh');
        this.stopTokenRefresh();
      }
    });

    // Listen for ID token changes (recommended approach)
    this.unsubscribeIdToken = onIdTokenChanged(this.auth, async (user) => {
      if (user && !this.isDestroyed) {
        try {
          // Get the fresh token without forcing refresh
          const token = await getIdToken(user);
          console.log('ID Token changed/refreshed:', token.substring(0, 20) + '...');

          if (this.tokenRefreshCallback) {
            this.tokenRefreshCallback(token, user);
          }
        } catch (error) {
          console.error('Error getting ID token on change:', error);
        }
      }
    });
  }

  /**
   * Start the 30-minute refresh interval (NOT RECOMMENDED)
   * Firebase handles this automatically, but provided for your specific use case
   */
  startTokenRefresh() {
    // Clear any existing interval
    this.stopTokenRefresh();

    // Set up 30-minute interval
    this.refreshInterval = setInterval(async () => {
      if (this.isDestroyed) return;

      try {
        await this.forceTokenRefresh();
      } catch (error) {
        console.error('Scheduled token refresh failed:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes

    console.log('Token refresh interval started (30 minutes)');
  }

  /**
   * Stop the refresh interval
   */
  stopTokenRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('Token refresh interval stopped');
    }
  }

  /**
   * Force refresh the current user's token
   * @returns {Promise<string>} Fresh ID token
   */
  async forceTokenRefresh() {
    if (!this.auth.currentUser) {
      throw new Error('No authenticated user found');
    }

    try {
      console.log('Forcing token refresh...');

      // Force refresh the token
      const freshToken = await getIdToken(this.auth.currentUser, true);

      console.log('Token refreshed successfully:', freshToken.substring(0, 20) + '...');

      if (this.tokenRefreshCallback) {
        this.tokenRefreshCallback(freshToken, this.auth.currentUser);
      }

      return freshToken;
    } catch (error) {
      console.error('Force token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Get current token (with automatic refresh if needed)
   * @param {boolean} forceRefresh - Force refresh even if token is still valid
   * @returns {Promise<string>} Current or refreshed ID token
   */
  async getCurrentToken(forceRefresh = false) {
    if (!this.auth.currentUser) {
      throw new Error('No authenticated user found');
    }

    try {
      return await getIdToken(this.auth.currentUser, forceRefresh);
    } catch (error) {
      console.error('Error getting current token:', error);
      throw error;
    }
  }

  /**
   * Get current token with detailed result
   * @param {boolean} forceRefresh - Force refresh even if token is still valid
   * @returns {Promise<Object>} Token result with claims and metadata
   */
  async getCurrentTokenResult(forceRefresh = false) {
    if (!this.auth.currentUser) {
      throw new Error('No authenticated user found');
    }

    try {
      return await getIdTokenResult(this.auth.currentUser, forceRefresh);
    } catch (error) {
      console.error('Error getting current token result:', error);
      throw error;
    }
  }

  /**
   * Check if current token is close to expiring
   * @param {number} bufferMinutes - Minutes before expiry to consider as "close"
   * @returns {Promise<boolean>} True if token is close to expiring
   */
  async isTokenCloseToExpiring(bufferMinutes = 5) {
    try {
      const tokenResult = await this.getCurrentTokenResult();
      const expirationTime = new Date(tokenResult.expirationTime);
      const now = new Date();
      const timeUntilExpiry = expirationTime.getTime() - now.getTime();
      const minutesUntilExpiry = timeUntilExpiry / (1000 * 60);

      return minutesUntilExpiry <= bufferMinutes;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true; // Assume it's expiring if we can't check
    }
  }

  /**
   * Cleanup method to call when component/app unmounts
   */
  destroy() {
    this.isDestroyed = true;
    this.stopTokenRefresh();

    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
    }

    if (this.unsubscribeIdToken) {
      this.unsubscribeIdToken();
    }

    console.log('FirebaseTokenManager destroyed');
  }
}

// Usage Example
class AppAuthManager {
  constructor() {
    this.tokenManager = new FirebaseTokenManager();
    this.currentToken = null;
  }

  async initialize() {
    // Initialize the token manager with callback
    this.tokenManager.initialize(this.handleTokenRefresh.bind(this));
  }

  /**
   * Handle token refresh events
   * @param {string} newToken - The new/refreshed token
   * @param {Object} user - Firebase user object
   */
  handleTokenRefresh(newToken, user) {
    this.currentToken = newToken;
    console.log('App received new token for user:', user.uid);

    // Update your app state, localStorage, or send to your backend
    this.updateAppWithNewToken(newToken);
  }

  /**
   * Update your application with the new token
   * @param {string} token - The new token
   */
  updateAppWithNewToken(token) {
    // Example: Update API client headers
    if (window.apiClient) {
      window.apiClient.defaults.headers.Authorization = `Bearer ${token}`;
    }

    // Example: Store in memory for API calls (DON'T use localStorage in artifacts)
    this.currentToken = token;

    // Example: Trigger app state update
    if (window.updateAuthToken) {
      window.updateAuthToken(token);
    }
  }

  /**
   * Get token for API calls
   * @returns {Promise<string>} Current valid token
   */
  async getTokenForAPICall() {
    try {
      // Always get fresh token for API calls (recommended approach)
      return await this.tokenManager.getCurrentToken();
    } catch (error) {
      console.error('Failed to get token for API call:', error);
      throw error;
    }
  }

  /**
   * Make an authenticated API call
   * @param {string} url - API endpoint
   * @param {Object} options - Fetch options
   */
  async makeAuthenticatedRequest(url, options = {}) {
    try {
      const token = await this.getTokenForAPICall();

      const authOptions = {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      return fetch(url, authOptions);
    } catch (error) {
      console.error('Authenticated request failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup when app unmounts
   */
  cleanup() {
    this.tokenManager.destroy();
  }
}

// Example usage in your app
const authManager = new AppAuthManager();

// Initialize when your app starts
authManager.initialize();

// Example: Make authenticated API calls
async function fetchUserData() {
  try {
    const response = await authManager.makeAuthenticatedRequest('/api/user');
    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Failed to fetch user data:', error);
  }
}

// Example: Manual token refresh (if really needed)
async function manualTokenRefresh() {
  try {
    const freshToken = await authManager.tokenManager.forceTokenRefresh();
    console.log('Manually refreshed token:', freshToken);
  } catch (error) {
    console.error('Manual refresh failed:', error);
  }
}

// Example: Check token expiry
async function checkTokenExpiry() {
  try {
    const isExpiring = await authManager.tokenManager.isTokenCloseToExpiring(10); // 10 minutes buffer
    if (isExpiring) {
      console.log('Token is expiring soon, consider refreshing');
      await authManager.tokenManager.forceTokenRefresh();
    }
  } catch (error) {
    console.error('Failed to check token expiry:', error);
  }
}

// Clean up when your app unmounts
window.addEventListener('beforeunload', () => {
  authManager.cleanup();
});

// Export for use in other modules
export { FirebaseTokenManager, AppAuthManager };