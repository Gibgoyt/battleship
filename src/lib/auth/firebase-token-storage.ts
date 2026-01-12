import { createLogger } from '../logger';

const logger = createLogger('[Firebase Token Storage]');

export interface FirebaseTokenData {
  idToken?: string;
  refreshToken?: string;
  rememberMe?: boolean;
  lastRefresh?: number;
  tokenExpiresAt?: number;
  refreshAttempts?: number;
}

export class FirebaseTokenStorage {
  private static instance: FirebaseTokenStorage;

  private constructor() {}

  static getInstance(): FirebaseTokenStorage {
    if (!FirebaseTokenStorage.instance) {
      FirebaseTokenStorage.instance = new FirebaseTokenStorage();
    }
    return FirebaseTokenStorage.instance;
  }

  // Store Firebase tokens in both localStorage/sessionStorage AND cookies for middleware access
  storeTokens(tokens: FirebaseTokenData): void {
    const {
      idToken,
      refreshToken,
      rememberMe = false,
      lastRefresh = Date.now(),
      tokenExpiresAt,
      refreshAttempts = 0
    } = tokens;

    try {
      logger.debug('Storing tokens', {
        hasIdToken: Boolean(idToken),
        hasRefreshToken: Boolean(refreshToken),
        rememberMe
      });

      // Choose storage based on remember me preference
      const storage = rememberMe ? localStorage : sessionStorage;

      // Store in browser storage (for client-side access)
      if (idToken) {
        storage.setItem('firebase-idToken', idToken);
        logger.debug(`ID token stored in ${rememberMe ? 'localStorage' : 'sessionStorage'}`);
      }

      if (refreshToken) {
        storage.setItem('firebase-refreshToken', refreshToken);
        logger.debug(`Refresh token stored in ${rememberMe ? 'localStorage' : 'sessionStorage'}`);
      }

      // Store metadata
      storage.setItem('firebase-rememberMe', rememberMe.toString());
      storage.setItem('firebase-lastRefresh', lastRefresh.toString());

      if (tokenExpiresAt) {
        storage.setItem('firebase-tokenExpiresAt', tokenExpiresAt.toString());
      }

      storage.setItem('firebase-refreshAttempts', refreshAttempts.toString());

      // Store primary token in cookies for middleware access
      if (idToken) {
        this.setTokenCookie('firebase-auth-token', idToken, rememberMe);
        logger.debug('ID token stored in cookies for middleware');
      }

      // Store a simple auth flag cookie
      this.setTokenCookie('firebase-auth-status', 'authenticated', rememberMe);

      logger.debug('All tokens stored successfully');

      // Debug: Log what's actually in storage now
      this.debugStorageContents();

    } catch (error) {
      logger.error('Failed to store tokens:', error);
      throw new Error('Failed to store Firebase authentication tokens');
    }
  }

  // Set cookie with appropriate security settings
  private setTokenCookie(name: string, value: string, rememberMe: boolean): void {
    try {
      // Calculate expiration
      const expirationDays = rememberMe ? 30 : 1; // 30 days for remember me, 1 day otherwise
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);

      // Set cookie with security flags
      const cookieValue = `${name}=${encodeURIComponent(value)}; ` +
        `expires=${expirationDate.toUTCString()}; ` +
        `path=/; ` +
        `SameSite=Lax`; // Note: httpOnly can't be set from client-side

      document.cookie = cookieValue;
      
      logger.debug('Cookie set', {
        name,
        hasValue: Boolean(value),
        expires: expirationDate.toISOString(),
        rememberMe
      });

      // Immediately verify the cookie was set
      const verification = this.getTokenForMiddleware();
      logger.debug('Cookie verification', {
        cookieSetSuccessfully: Boolean(verification),
        cookieValueMatches: verification === value
      });

    } catch (error) {
      logger.error(`Failed to set cookie ${name}:`, error);
    }
  }

  // Retrieve Firebase tokens from storage
  getTokens(): FirebaseTokenData {
    try {
      // Try localStorage first, then sessionStorage
      const storages = [localStorage, sessionStorage];
      const storageNames = ['localStorage', 'sessionStorage'];
      const tokens: FirebaseTokenData = {};

      logger.debug('Starting token retrieval from browser storage');

      for (let i = 0; i < storages.length; i++) {
        const storage = storages[i];
        const storageName = storageNames[i];

        const storageContents = {
          idToken: storage.getItem('firebase-idToken'),
          refreshToken: storage.getItem('firebase-refreshToken'),
          rememberMe: storage.getItem('firebase-rememberMe'),
          lastRefresh: storage.getItem('firebase-lastRefresh'),
          tokenExpiresAt: storage.getItem('firebase-tokenExpiresAt'),
        };

        logger.debug(`Checking ${storageName} contents`, {
          storageName,
          hasIdToken: Boolean(storageContents.idToken),
          hasRefreshToken: Boolean(storageContents.refreshToken),
          idTokenLength: storageContents.idToken?.length || 0,
          refreshTokenLength: storageContents.refreshToken?.length || 0,
          rememberMe: storageContents.rememberMe,
          lastRefresh: storageContents.lastRefresh,
          tokenExpiresAt: storageContents.tokenExpiresAt,
        });

        if (!tokens.idToken) {
          tokens.idToken = storageContents.idToken || undefined;
          if (tokens.idToken) {
            logger.debug(`Found idToken in ${storageName}`, { length: tokens.idToken.length });
          }
        }

        if (!tokens.refreshToken) {
          tokens.refreshToken = storageContents.refreshToken || undefined;
          if (tokens.refreshToken) {
            logger.debug(`Found refreshToken in ${storageName}`, { length: tokens.refreshToken.length });
          }
        }

        if (tokens.rememberMe === undefined) {
          const rememberMeStr = storageContents.rememberMe;
          tokens.rememberMe = rememberMeStr ? rememberMeStr === 'true' : undefined;
          if (tokens.rememberMe !== undefined) {
            logger.debug(`Found rememberMe in ${storageName}`, { value: tokens.rememberMe });
          }
        }

        if (tokens.lastRefresh === undefined) {
          const lastRefreshStr = storageContents.lastRefresh;
          tokens.lastRefresh = lastRefreshStr ? parseInt(lastRefreshStr, 10) : undefined;
          if (tokens.lastRefresh !== undefined) {
            logger.debug(`Found lastRefresh in ${storageName}`, { timestamp: tokens.lastRefresh });
          }
        }

        if (tokens.tokenExpiresAt === undefined) {
          const tokenExpiresAtStr = storage.getItem('firebase-tokenExpiresAt');
          tokens.tokenExpiresAt = tokenExpiresAtStr ? parseInt(tokenExpiresAtStr, 10) : undefined;
          if (tokens.tokenExpiresAt !== undefined) {
            logger.debug(`Found tokenExpiresAt in ${storageName}`, { timestamp: tokens.tokenExpiresAt });
          }
        }

        if (tokens.refreshAttempts === undefined) {
          const refreshAttemptsStr = storage.getItem('firebase-refreshAttempts');
          tokens.refreshAttempts = refreshAttemptsStr ? parseInt(refreshAttemptsStr, 10) : 0;
          if (tokens.refreshAttempts !== undefined) {
            logger.debug(`Found refreshAttempts in ${storageName}`, { attempts: tokens.refreshAttempts });
          }
        }
      }

      const finalTokens = {
        hasIdToken: Boolean(tokens.idToken),
        hasRefreshToken: Boolean(tokens.refreshToken),
        idTokenLength: tokens.idToken?.length || 0,
        refreshTokenLength: tokens.refreshToken?.length || 0,
        rememberMe: tokens.rememberMe,
        lastRefresh: tokens.lastRefresh,
        tokenExpiresAt: tokens.tokenExpiresAt,
        refreshAttempts: tokens.refreshAttempts,
      };

      logger.debug('Final token retrieval result', finalTokens);

      return tokens;
    } catch (error) {
      logger.error('Failed to retrieve tokens:', error);
      return {};
    }
  }

  // Clear all Firebase tokens from both storage and cookies
  clearTokens(): void {
    try {
      logger.debug('Clearing all tokens');

      // Clear from both storage types
      [localStorage, sessionStorage].forEach(storage => {
        storage.removeItem('firebase-idToken');
        storage.removeItem('firebase-refreshToken');
        storage.removeItem('firebase-rememberMe');
        storage.removeItem('firebase-lastRefresh');
        storage.removeItem('firebase-tokenExpiresAt');
        storage.removeItem('firebase-refreshAttempts');
      });

      // Clear cookies
      this.clearTokenCookie('firebase-auth-token');
      this.clearTokenCookie('firebase-auth-status');

      logger.debug('All tokens cleared successfully');
    } catch (error) {
      logger.error('Failed to clear tokens:', error);
    }
  }

  // Clear specific cookie
  private clearTokenCookie(name: string): void {
    try {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
      logger.debug(`Cookie cleared: ${name}`);
    } catch (error) {
      logger.error(`Failed to clear cookie ${name}:`, error);
    }
  }

  // Check if user is authenticated based on stored Firebase tokens
  isAuthenticated(): boolean {
    const tokens = this.getTokens();
    const hasTokens = Boolean(tokens.idToken);
    
    logger.debug('Authentication check', {
      hasTokens,
      hasIdToken: Boolean(tokens.idToken)
    });
    
    return hasTokens;
  }

  // Debug function to log all storage contents
  debugStorageContents(): void {
    try {
      logger.debug('Storage contents', {
        localStorage: {
          idToken: localStorage.getItem('firebase-idToken') ? 'PRESENT' : 'MISSING',
          refreshToken: localStorage.getItem('firebase-refreshToken') ? 'PRESENT' : 'MISSING',
          rememberMe: localStorage.getItem('firebase-rememberMe')
        },
        sessionStorage: {
          idToken: sessionStorage.getItem('firebase-idToken') ? 'PRESENT' : 'MISSING',
          refreshToken: sessionStorage.getItem('firebase-refreshToken') ? 'PRESENT' : 'MISSING',
          rememberMe: sessionStorage.getItem('firebase-rememberMe')
        },
        hasFirebaseCookies: document.cookie.includes('firebase')
      });
    } catch (error) {
      logger.error('Debug failed:', error);
    }
  }

  // Get token for middleware (from cookies)
  getTokenForMiddleware(): string | null {
    try {
      // Extract token from cookies
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'firebase-auth-token' && value) {
          logger.debug('Token found in cookies for middleware');
          return decodeURIComponent(value);
        }
      }

      logger.debug('No token found in cookies for middleware');
      return null;
    } catch (error) {
      logger.error('Failed to get token from cookies:', error);
      return null;
    }
  }

  // Update token refresh timestamp
  updateTokenRefreshTimestamp(): void {
    try {
      const timestamp = Date.now().toString();
      const storage = this.getPreferredStorage();

      storage.setItem('firebase-lastRefresh', timestamp);

      logger.debug('Token refresh timestamp updated', {
        timestamp: new Date(Date.now()).toISOString(),
      });
    } catch (error) {
      logger.error('Failed to update refresh timestamp:', error);
    }
  }

  // Check if token is near expiration
  isTokenNearExpiration(bufferMinutes: number = 5): boolean {
    try {
      const tokens = this.getTokens();

      if (!tokens.tokenExpiresAt) {
        logger.debug('No expiration time available');
        return true; // Assume expired if no expiration info
      }

      const now = Date.now();
      const bufferTime = bufferMinutes * 60 * 1000;
      const isNearExpiration = (tokens.tokenExpiresAt - now) < bufferTime;

      logger.debug('Token expiration check', {
        expiresAt: new Date(tokens.tokenExpiresAt).toISOString(),
        now: new Date(now).toISOString(),
        bufferMinutes,
        isNearExpiration,
        timeUntilExpiryMinutes: (tokens.tokenExpiresAt - now) / 1000 / 60,
      });

      return isNearExpiration;
    } catch (error) {
      logger.error('Failed to check token expiration:', error);
      return true; // Assume expired on error
    }
  }

  // Clear all auth data (comprehensive cleanup)
  clearAllAuthData(): void {
    try {
      logger.debug('Performing comprehensive auth data cleanup');

      // Clear tokens using existing method
      this.clearTokens();

      // Clear any additional Firebase-related items
      [localStorage, sessionStorage].forEach(storage => {
        // Clear any keys that start with 'firebase-'
        const keysToRemove: string[] = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key && key.startsWith('firebase-')) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach(key => storage.removeItem(key));
      });

      // Clear all Firebase-related cookies
      const firebaseCookies = ['firebase-auth-token', 'firebase-auth-status', 'firebase-token-expires'];
      firebaseCookies.forEach(cookieName => {
        this.clearTokenCookie(cookieName);
      });

      logger.debug('Comprehensive auth data cleanup completed');
    } catch (error) {
      logger.error('Failed to clear all auth data:', error);
    }
  }

  // Sync token across tabs using storage events
  syncTokenAcrossTabs(newToken: string, expiresAt?: number): void {
    try {
      logger.debug('Syncing token across tabs');

      // Trigger storage event for other tabs
      const syncData = {
        type: 'TOKEN_REFRESHED',
        timestamp: Date.now(),
        token: newToken,
        expiresAt: expiresAt,
      };

      // Use a special key for cross-tab communication
      localStorage.setItem('firebase-tab-sync', JSON.stringify(syncData));

      // Remove the sync key immediately to trigger the event
      localStorage.removeItem('firebase-tab-sync');

      logger.debug('Token sync event dispatched');
    } catch (error) {
      logger.error('Failed to sync token across tabs:', error);
    }
  }

  // Get preferred storage type based on remember me setting
  private getPreferredStorage(): Storage {
    const tokens = this.getTokens();
    return (tokens.rememberMe ?? false) ? localStorage : sessionStorage;
  }

  // Extract token expiration from JWT
  extractTokenExpiration(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;

      if (typeof exp === 'number' && exp > 0) {
        return exp * 1000; // Convert to milliseconds
      }

      return null;
    } catch (error) {
      logger.error('Failed to extract token expiration:', error);
      return null;
    }
  }

  // Check if stored token is expired
  isStoredTokenExpired(): boolean {
    try {
      const tokens = this.getTokens();

      if (!tokens.idToken) {
        logger.debug('No stored token found');
        return true;
      }

      const expiresAt = this.extractTokenExpiration(tokens.idToken);

      if (!expiresAt) {
        logger.debug('Cannot determine token expiration');
        return true;
      }

      const isExpired = Date.now() >= expiresAt;

      logger.debug('Stored token expiration check', {
        isExpired,
        expiresAt: new Date(expiresAt).toISOString(),
        now: new Date().toISOString(),
      });

      return isExpired;
    } catch (error) {
      logger.error('Failed to check stored token expiration:', error);
      return true;
    }
  }

  // Get token refresh status
  getTokenRefreshStatus(): {
    lastRefresh: number | null;
    tokenExpiresAt: number | null;
    refreshAttempts: number;
    isNearExpiration: boolean;
    isExpired: boolean;
  } {
    try {
      const tokens = this.getTokens();

      return {
        lastRefresh: tokens.lastRefresh || null,
        tokenExpiresAt: tokens.tokenExpiresAt || null,
        refreshAttempts: tokens.refreshAttempts || 0,
        isNearExpiration: this.isTokenNearExpiration(),
        isExpired: this.isStoredTokenExpired(),
      };
    } catch (error) {
      logger.error('Failed to get token refresh status:', error);

      return {
        lastRefresh: null,
        tokenExpiresAt: null,
        refreshAttempts: 0,
        isNearExpiration: true,
        isExpired: true,
      };
    }
  }
}

// Singleton instance and helper functions
export const firebaseTokenStorage = FirebaseTokenStorage.getInstance();

export const storeFirebaseTokens = (tokens: FirebaseTokenData): void => firebaseTokenStorage.storeTokens(tokens);
export const getFirebaseTokens = (): FirebaseTokenData => firebaseTokenStorage.getTokens();
export const clearFirebaseTokens = (): void => firebaseTokenStorage.clearTokens();
export const isFirebaseAuthenticated = (): boolean => firebaseTokenStorage.isAuthenticated();
export const debugFirebaseStorage = (): void => firebaseTokenStorage.debugStorageContents();
export const getFirebaseTokenForMiddleware = (): string | null => firebaseTokenStorage.getTokenForMiddleware();

// New enhanced helper functions
export const updateFirebaseTokenRefreshTimestamp = (): void => firebaseTokenStorage.updateTokenRefreshTimestamp();
export const isFirebaseTokenNearExpiration = (bufferMinutes?: number): boolean => firebaseTokenStorage.isTokenNearExpiration(bufferMinutes);
export const clearAllFirebaseAuthData = (): void => firebaseTokenStorage.clearAllAuthData();
export const syncFirebaseTokenAcrossTabs = (token: string, expiresAt?: number): void => firebaseTokenStorage.syncTokenAcrossTabs(token, expiresAt);
export const extractFirebaseTokenExpiration = (token: string): number | null => firebaseTokenStorage.extractTokenExpiration(token);
export const isStoredFirebaseTokenExpired = (): boolean => firebaseTokenStorage.isStoredTokenExpired();
export const getFirebaseTokenRefreshStatus = () => firebaseTokenStorage.getTokenRefreshStatus();
