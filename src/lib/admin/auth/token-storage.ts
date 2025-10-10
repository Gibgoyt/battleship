import { createLogger } from '../../logger';

const logger = createLogger('AdminTokenStorage');

export interface TokenData {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  rememberMe?: boolean;
}

export class AdminTokenStorage {
  private static instance: AdminTokenStorage;

  private constructor() {}

  static getInstance(): AdminTokenStorage {
    if (!AdminTokenStorage.instance) {
      AdminTokenStorage.instance = new AdminTokenStorage();
    }
    return AdminTokenStorage.instance;
  }

  // Store tokens with ADMIN-SPECIFIC keys to avoid conflicts
  storeTokens(tokens: TokenData): void {
    const { accessToken, idToken, refreshToken, rememberMe = false } = tokens;

    try {
      logger.debug('Storing admin tokens', {
        hasAccessToken: Boolean(accessToken),
        hasIdToken: Boolean(idToken),
        hasRefreshToken: Boolean(refreshToken),
        rememberMe
      });

      const storage = rememberMe ? localStorage : sessionStorage;

      // Store with admin-prefixed keys
      if (accessToken) {
        storage.setItem('admin-accessToken', accessToken);
        logger.debug(`Admin access token stored in ${rememberMe ? 'localStorage' : 'sessionStorage'}`);
      }

      if (idToken) {
        storage.setItem('admin-idToken', idToken);
        logger.debug(`Admin ID token stored in ${rememberMe ? 'localStorage' : 'sessionStorage'}`);
      }

      if (refreshToken) {
        storage.setItem('admin-refreshToken', refreshToken);
        logger.debug(`Admin refresh token stored in ${rememberMe ? 'localStorage' : 'sessionStorage'}`);
      }

      storage.setItem('admin-rememberMe', rememberMe.toString());

      // Store in cookies with admin-specific names
      const primaryToken = idToken || accessToken;
      if (primaryToken) {
        this.setTokenCookie('cognito-admin-auth-token', primaryToken, rememberMe);
        logger.debug('Admin primary token stored in cookies for middleware');
      }

      this.setTokenCookie('admin-auth-status', 'authenticated', rememberMe);

      logger.info('All admin tokens stored successfully');
      this.debugStorageContents();

    } catch (error) {
      logger.error('Failed to store admin tokens', error);
      throw new Error('Failed to store admin authentication tokens');
    }
  }

  private setTokenCookie(name: string, value: string, rememberMe: boolean): void {
    try {
      const expirationDays = rememberMe ? 30 : 1;
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);

      const cookieValue = `${name}=${encodeURIComponent(value)}; ` +
        `expires=${expirationDate.toUTCString()}; ` +
        `path=/; ` +
        `SameSite=Lax`;

      document.cookie = cookieValue;

      logger.debug('Admin cookie set', {
        name,
        hasValue: Boolean(value),
        expires: expirationDate.toISOString(),
        rememberMe
      });

    } catch (error) {
      logger.error(`Failed to set admin cookie: ${name}`, error);
    }
  }

  getTokens(): TokenData {
    try {
      const storages = [localStorage, sessionStorage];
      const tokens: TokenData = {};

      for (const storage of storages) {
        if (!tokens.accessToken) tokens.accessToken = storage.getItem('admin-accessToken') || undefined;
        if (!tokens.idToken) tokens.idToken = storage.getItem('admin-idToken') || undefined;
        if (!tokens.refreshToken) tokens.refreshToken = storage.getItem('admin-refreshToken') || undefined;
        if (tokens.rememberMe === undefined) {
          const rememberMeStr = storage.getItem('admin-rememberMe');
          tokens.rememberMe = rememberMeStr ? rememberMeStr === 'true' : undefined;
        }
      }

      logger.debug('Retrieved admin tokens', {
        hasAccessToken: Boolean(tokens.accessToken),
        hasIdToken: Boolean(tokens.idToken),
        hasRefreshToken: Boolean(tokens.refreshToken),
        rememberMe: tokens.rememberMe
      });

      return tokens;
    } catch (error) {
      logger.error('Failed to retrieve admin tokens', error);
      return {};
    }
  }

  clearTokens(): void {
    try {
      logger.info('Clearing all admin tokens');

      [localStorage, sessionStorage].forEach(storage => {
        storage.removeItem('admin-accessToken');
        storage.removeItem('admin-idToken');
        storage.removeItem('admin-refreshToken');
        storage.removeItem('admin-rememberMe');
      });

      this.clearTokenCookie('cognito-admin-auth-token');
      this.clearTokenCookie('admin-auth-status');

      logger.info('All admin tokens cleared successfully');
    } catch (error) {
      logger.error('Failed to clear admin tokens', error);
    }
  }

  private clearTokenCookie(name: string): void {
    try {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
      logger.debug(`Admin cookie cleared: ${name}`);
    } catch (error) {
      logger.error(`Failed to clear admin cookie: ${name}`, error);
    }
  }

  isAuthenticated(): boolean {
    const tokens = this.getTokens();
    const hasTokens = Boolean(tokens.accessToken || tokens.idToken);

    logger.debug('Admin authentication check', {
      hasTokens,
      hasAccessToken: Boolean(tokens.accessToken),
      hasIdToken: Boolean(tokens.idToken)
    });

    return hasTokens;
  }

  debugStorageContents(): void {
    try {
      logger.debug('=== Admin Storage Contents Debug ===');

      logger.debug('localStorage', {
        accessToken: localStorage.getItem('admin-accessToken') ? 'PRESENT' : 'MISSING',
        idToken: localStorage.getItem('admin-idToken') ? 'PRESENT' : 'MISSING',
        refreshToken: localStorage.getItem('admin-refreshToken') ? 'PRESENT' : 'MISSING',
        rememberMe: localStorage.getItem('admin-rememberMe')
      });

      logger.debug('sessionStorage', {
        accessToken: sessionStorage.getItem('admin-accessToken') ? 'PRESENT' : 'MISSING',
        idToken: sessionStorage.getItem('admin-idToken') ? 'PRESENT' : 'MISSING',
        refreshToken: sessionStorage.getItem('admin-refreshToken') ? 'PRESENT' : 'MISSING',
        rememberMe: sessionStorage.getItem('admin-rememberMe')
      });

      const cookies = document.cookie.split(';').reduce((acc: any, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name) acc[name] = value ? 'PRESENT' : 'EMPTY';
        return acc;
      }, {});

      logger.debug('Parsed cookies (admin-related)', {
        'cognito-admin-auth-token': cookies['cognito-admin-auth-token'] || 'MISSING',
        'admin-auth-status': cookies['admin-auth-status'] || 'MISSING'
      });
    } catch (error) {
      logger.error('Admin debug failed', error);
    }
  }

  getTokenForMiddleware(): string | null {
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'cognito-admin-auth-token' && value) {
          logger.debug('Admin token found in cookies for middleware');
          return decodeURIComponent(value);
        }
      }

      logger.debug('No admin token found in cookies for middleware');
      return null;
    } catch (error) {
      logger.error('Failed to get admin token from cookies', error);
      return null;
    }
  }
}

// Singleton instance and helper functions
export const adminTokenStorage = AdminTokenStorage.getInstance();

export const storeTokens = (tokens: TokenData): void => adminTokenStorage.storeTokens(tokens);
export const getTokens = (): TokenData => adminTokenStorage.getTokens();
export const clearTokens = (): void => adminTokenStorage.clearTokens();
export const isAuthenticated = (): boolean => adminTokenStorage.isAuthenticated();
export const debugStorage = (): void => adminTokenStorage.debugStorageContents();
export const getTokenForMiddleware = (): string | null => adminTokenStorage.getTokenForMiddleware();
