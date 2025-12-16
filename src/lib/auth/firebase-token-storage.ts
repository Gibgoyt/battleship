import { createLogger } from '../logger';

const logger = createLogger('[Firebase Token Storage]');

export interface FirebaseTokenData {
  idToken?: string;
  refreshToken?: string;
  rememberMe?: boolean;
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
    const { idToken, refreshToken, rememberMe = false } = tokens;

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

      storage.setItem('firebase-rememberMe', rememberMe.toString());

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
      const tokens: FirebaseTokenData = {};

      for (const storage of storages) {
        if (!tokens.idToken) tokens.idToken = storage.getItem('firebase-idToken') || undefined;
        if (!tokens.refreshToken) tokens.refreshToken = storage.getItem('firebase-refreshToken') || undefined;
        if (tokens.rememberMe === undefined) {
          const rememberMeStr = storage.getItem('firebase-rememberMe');
          tokens.rememberMe = rememberMeStr ? rememberMeStr === 'true' : undefined;
        }
      }

      logger.debug('Retrieved tokens', {
        hasIdToken: Boolean(tokens.idToken),
        hasRefreshToken: Boolean(tokens.refreshToken),
        rememberMe: tokens.rememberMe
      });

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
}

// Singleton instance and helper functions
export const firebaseTokenStorage = FirebaseTokenStorage.getInstance();

export const storeFirebaseTokens = (tokens: FirebaseTokenData): void => firebaseTokenStorage.storeTokens(tokens);
export const getFirebaseTokens = (): FirebaseTokenData => firebaseTokenStorage.getTokens();
export const clearFirebaseTokens = (): void => firebaseTokenStorage.clearTokens();
export const isFirebaseAuthenticated = (): boolean => firebaseTokenStorage.isAuthenticated();
export const debugFirebaseStorage = (): void => firebaseTokenStorage.debugStorageContents();
export const getFirebaseTokenForMiddleware = (): string | null => firebaseTokenStorage.getTokenForMiddleware();
