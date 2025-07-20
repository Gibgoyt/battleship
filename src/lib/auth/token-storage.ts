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
      console.log('🔄 [Token Storage] Storing tokens...', {
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
        console.log('✅ [Token Storage] Access token stored in', rememberMe ? 'localStorage' : 'sessionStorage');
      }
      
      if (idToken) {
        storage.setItem('idToken', idToken);
        console.log('✅ [Token Storage] ID token stored in', rememberMe ? 'localStorage' : 'sessionStorage');
      }
      
      if (refreshToken) {
        storage.setItem('refreshToken', refreshToken);
        console.log('✅ [Token Storage] Refresh token stored in', rememberMe ? 'localStorage' : 'sessionStorage');
      }

      storage.setItem('rememberMe', rememberMe.toString());

      // Store primary token in cookies for middleware access
      // Use ID token preferentially as it contains user info, fallback to access token
      const primaryToken = idToken || accessToken;
      if (primaryToken) {
        this.setTokenCookie('cognito-auth-token', primaryToken, rememberMe);
        console.log('✅ [Token Storage] Primary token stored in cookies for middleware');
      }

      // Store a simple auth flag cookie
      this.setTokenCookie('auth-status', 'authenticated', rememberMe);

      console.log('🎉 [Token Storage] All tokens stored successfully');

      // Debug: Log what's actually in storage now
      this.debugStorageContents();

    } catch (error) {
      console.error('❌ [Token Storage] Failed to store tokens:', error);
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
      
      console.log('🍪 [Token Storage] Cookie set:', {
        name,
        hasValue: Boolean(value),
        valueLength: value.length,
        expires: expirationDate.toISOString(),
        rememberMe,
        cookieString: cookieValue.substring(0, 100) + '...'
      });

      // Immediately verify the cookie was set
      const verification = this.getTokenForMiddleware();
      console.log('🔍 [Token Storage] Cookie verification:', {
        cookieSetSuccessfully: Boolean(verification),
        cookieValueMatches: verification === value
      });

    } catch (error) {
      console.error('❌ [Token Storage] Failed to set cookie:', name, error);
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

      console.log('📥 [Token Storage] Retrieved tokens:', {
        hasAccessToken: Boolean(tokens.accessToken),
        hasIdToken: Boolean(tokens.idToken),
        hasRefreshToken: Boolean(tokens.refreshToken),
        rememberMe: tokens.rememberMe
      });

      return tokens;
    } catch (error) {
      console.error('❌ [Token Storage] Failed to retrieve tokens:', error);
      return {};
    }
  }

  // Clear all tokens from both storage and cookies
  clearTokens(): void {
    try {
      console.log('🧹 [Token Storage] Clearing all tokens...');

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

      console.log('✅ [Token Storage] All tokens cleared successfully');
    } catch (error) {
      console.error('❌ [Token Storage] Failed to clear tokens:', error);
    }
  }

  // Clear specific cookie
  private clearTokenCookie(name: string): void {
    try {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
      console.log('🍪 [Token Storage] Cookie cleared:', name);
    } catch (error) {
      console.error('❌ [Token Storage] Failed to clear cookie:', name, error);
    }
  }

  // Check if user is authenticated based on stored tokens
  isAuthenticated(): boolean {
    const tokens = this.getTokens();
    const hasTokens = Boolean(tokens.accessToken || tokens.idToken);
    
    console.log('🔍 [Token Storage] Authentication check:', {
      hasTokens,
      hasAccessToken: Boolean(tokens.accessToken),
      hasIdToken: Boolean(tokens.idToken)
    });
    
    return hasTokens;
  }

  // Debug function to log all storage contents
  debugStorageContents(): void {
    try {
      console.group('🔍 [Token Storage] Debug: Storage Contents');
      
      // Check localStorage
      console.log('📦 localStorage:', {
        accessToken: localStorage.getItem('accessToken') ? 'PRESENT' : 'MISSING',
        idToken: localStorage.getItem('idToken') ? 'PRESENT' : 'MISSING',
        refreshToken: localStorage.getItem('refreshToken') ? 'PRESENT' : 'MISSING',
        rememberMe: localStorage.getItem('rememberMe')
      });

      // Check sessionStorage
      console.log('📦 sessionStorage:', {
        accessToken: sessionStorage.getItem('accessToken') ? 'PRESENT' : 'MISSING',
        idToken: sessionStorage.getItem('idToken') ? 'PRESENT' : 'MISSING',
        refreshToken: sessionStorage.getItem('refreshToken') ? 'PRESENT' : 'MISSING',
        rememberMe: sessionStorage.getItem('rememberMe')
      });

      // Check cookies
      console.log('🍪 document.cookie:', document.cookie);
      
      // Parse cookies for better display
      const cookies = document.cookie.split(';').reduce((acc: any, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name) acc[name] = value ? 'PRESENT' : 'EMPTY';
        return acc;
      }, {});
      
      console.log('🍪 Parsed cookies:', cookies);

      console.groupEnd();
    } catch (error) {
      console.error('❌ [Token Storage] Debug failed:', error);
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
          console.log('🍪 [Token Storage] Token found in cookies for middleware');
          return decodeURIComponent(value);
        }
      }
      
      console.log('🍪 [Token Storage] No token found in cookies for middleware');
      return null;
    } catch (error) {
      console.error('❌ [Token Storage] Failed to get token from cookies:', error);
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