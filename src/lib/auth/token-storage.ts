import { createLogger } from '../logger';

const logger = createLogger('TokenStorage');

export interface TokenData {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  rememberMe?: boolean;
}

export class TokenStorage {
  private static instance: TokenStorage;

  private constructor() {}

  static getInstance(): TokenStorage {
    if (!TokenStorage.instance) {
      TokenStorage.instance = new TokenStorage();
    }
    return TokenStorage.instance;
  }

  // Store tokens in both localStorage/sessionStorage AND cookies for middleware access
  storeTokens(tokens: TokenData): void {
    const { accessToken, idToken, refreshToken, rememberMe = false } = tokens;

    try {
      logger.debug('Storing tokens', {
        hasAccessToken: Boolean(accessToken),
        hasIdToken: Boolean(idToken),
        hasRefreshToken: Boolean(refreshToken),
        rememberMe
      });

      // Choose storage based on remember me preference
      const storage = rememberMe ? localStorage : sessionStorage;

      // Store in browser storage (for client-side access)
      if (accessToken) {
        storage.setItem('accessToken', accessToken);
        logger.debug(`Access token stored in ${rememberMe ? 'localStorage' : 'sessionStorage'}`);
      }
      
      if (idToken) {
        storage.setItem('idToken', idToken);
        logger.debug(`ID token stored in ${rememberMe ? 'localStorage' : 'sessionStorage'}`);
      }
      
      if (refreshToken) {
        storage.setItem('refreshToken', refreshToken);
        logger.debug(`Refresh token stored in ${rememberMe ? 'localStorage' : 'sessionStorage'}`);
      }

      storage.setItem('rememberMe', rememberMe.toString());

      // Store primary token in cookies for middleware access
      // Use ID token preferentially as it contains user info, fallback to access token
      const primaryToken = idToken || accessToken;
      if (primaryToken) {
        this.setTokenCookie('cognito-auth-token', primaryToken, rememberMe);
        logger.debug('Primary token stored in cookies for middleware');
      }

      // Store a simple auth flag cookie
      this.setTokenCookie('auth-status', 'authenticated', rememberMe);

      logger.info('All tokens stored successfully');

      // Debug: Log what's actually in storage now
      this.debugStorageContents();

    } catch (error) {
      logger.error('Failed to store tokens', error);
      throw new Error('Failed to store authentication tokens');
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
        valueLength: value ? value.length : 0,
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
      logger.error(`Failed to set cookie: ${name}`, error);
    }
  }

  // Retrieve tokens from storage
  getTokens(): TokenData {
    try {
      // Try localStorage first, then sessionStorage
      const storages = [localStorage, sessionStorage];
      const tokens: TokenData = {};

      for (const storage of storages) {
        if (!tokens.accessToken) tokens.accessToken = storage.getItem('accessToken') || undefined;
        if (!tokens.idToken) tokens.idToken = storage.getItem('idToken') || undefined;
        if (!tokens.refreshToken) tokens.refreshToken = storage.getItem('refreshToken') || undefined;
        if (tokens.rememberMe === undefined) {
          const rememberMeStr = storage.getItem('rememberMe');
          tokens.rememberMe = rememberMeStr ? rememberMeStr === 'true' : undefined;
        }
      }

      logger.debug('Retrieved tokens', {
        hasAccessToken: Boolean(tokens.accessToken),
        hasIdToken: Boolean(tokens.idToken),
        hasRefreshToken: Boolean(tokens.refreshToken),
        rememberMe: tokens.rememberMe
      });

      return tokens;
    } catch (error) {
      logger.error('Failed to retrieve tokens', error);
      return {};
    }
  }

  // Clear all tokens from both storage and cookies
  clearTokens(): void {
    try {
      logger.info('Clearing all tokens');

      // Clear from both storage types
      [localStorage, sessionStorage].forEach(storage => {
        storage.removeItem('accessToken');
        storage.removeItem('idToken');
        storage.removeItem('refreshToken');
        storage.removeItem('rememberMe');
      });

      // Clear cookies
      this.clearTokenCookie('cognito-auth-token');
      this.clearTokenCookie('auth-status');

      logger.info('All tokens cleared successfully');
    } catch (error) {
      logger.error('Failed to clear tokens', error);
    }
  }

  // Clear specific cookie
  private clearTokenCookie(name: string): void {
    try {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
      logger.debug(`Cookie cleared: ${name}`);
    } catch (error) {
      logger.error(`Failed to clear cookie: ${name}`, error);
    }
  }

  // Check if user is authenticated based on stored tokens
  isAuthenticated(): boolean {
    const tokens = this.getTokens();
    const hasTokens = Boolean(tokens.accessToken || tokens.idToken);
    
    logger.debug('Authentication check', {
      hasTokens,
      hasAccessToken: Boolean(tokens.accessToken),
      hasIdToken: Boolean(tokens.idToken)
    });
    
    return hasTokens;
  }

  // Debug function to log all storage contents
  debugStorageContents(): void {
    try {
      logger.debug('=== Storage Contents Debug ===');
      
      // Check localStorage
      logger.debug('localStorage', {
        accessToken: localStorage.getItem('accessToken') ? 'PRESENT' : 'MISSING',
        idToken: localStorage.getItem('idToken') ? 'PRESENT' : 'MISSING',
        refreshToken: localStorage.getItem('refreshToken') ? 'PRESENT' : 'MISSING',
        rememberMe: localStorage.getItem('rememberMe')
      });

      // Check sessionStorage
      logger.debug('sessionStorage', {
        accessToken: sessionStorage.getItem('accessToken') ? 'PRESENT' : 'MISSING',
        idToken: sessionStorage.getItem('idToken') ? 'PRESENT' : 'MISSING',
        refreshToken: sessionStorage.getItem('refreshToken') ? 'PRESENT' : 'MISSING',
        rememberMe: sessionStorage.getItem('rememberMe')
      });

      // Parse cookies for better display
      const cookies = document.cookie.split(';').reduce((acc: any, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name) acc[name] = value ? 'PRESENT' : 'EMPTY';
        return acc;
      }, {});
      
      logger.debug('Parsed cookies', cookies);
    } catch (error) {
      logger.error('Debug failed', error);
    }
  }

  // Get token for middleware (from cookies)
  getTokenForMiddleware(): string | null {
    try {
      // Extract token from cookies
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'cognito-auth-token' && value) {
          logger.debug('Token found in cookies for middleware');
          return decodeURIComponent(value);
        }
      }
      
      logger.debug('No token found in cookies for middleware');
      return null;
    } catch (error) {
      logger.error('Failed to get token from cookies', error);
      return null;
    }
  }
}

// Singleton instance and helper functions
export const tokenStorage = TokenStorage.getInstance();

export const storeTokens = (tokens: TokenData): void => tokenStorage.storeTokens(tokens);
export const getTokens = (): TokenData => tokenStorage.getTokens();
export const clearTokens = (): void => tokenStorage.clearTokens();
export const isAuthenticated = (): boolean => tokenStorage.isAuthenticated();
export const debugStorage = (): void => tokenStorage.debugStorageContents();
export const getTokenForMiddleware = (): string | null => tokenStorage.getTokenForMiddleware();