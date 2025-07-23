import { jwtValidator, type AuthValidationResult, type CognitoTokenPayload } from './jwt-validator';
import { tokenStorage } from './token-storage'
import { createLogger } from '../logger'

const logger = createLogger('AuthChecker');

export interface AuthStatus {
  isAuthenticated: boolean;
  isExpired: boolean;
  user?: {
    email?: string;
    username?: string;
    groups?: string[];
  };
  tokens?: {
    hasAccessToken: boolean;
    hasIdToken: boolean;
    hasRefreshToken: boolean;
  };
  error?: string;
}

export interface AuthCheckOptions {
  requireValidTokens?: boolean;
  clearExpiredTokens?: boolean;
  checkStorage?: 'localStorage' | 'sessionStorage' | 'both';
}

export class AuthChecker {
  private static instance: AuthChecker;

  private constructor() {}

  static getInstance(): AuthChecker {
    if (!AuthChecker.instance) {
      AuthChecker.instance = new AuthChecker();
    }
    return AuthChecker.instance;
  }

  // Main authentication status check
  checkAuthStatus(options: AuthCheckOptions = {}): AuthStatus {
    const {
      requireValidTokens = true,
      clearExpiredTokens = true,
      checkStorage = 'both'
    } = options;

    try {
      logger.debug('Checking authentication status');

      // Get tokens from specified storage
      const tokens = this.getTokensFromStorage(checkStorage);
      
      if (!tokens.accessToken && !tokens.idToken) {
        logger.debug('No tokens found in storage');
        return {
          isAuthenticated: false,
          isExpired: false,
          tokens: {
            hasAccessToken: false,
            hasIdToken: false,
            hasRefreshToken: Boolean(tokens.refreshToken)
          },
          error: 'No authentication tokens found'
        };
      }

      // Validate tokens
      const accessValidation = tokens.accessToken ? 
        jwtValidator.validateTokenBasic(tokens.accessToken) : null;
      const idValidation = tokens.idToken ? 
        jwtValidator.validateTokenBasic(tokens.idToken) : null;

      // Check if any tokens are expired
      const hasExpiredTokens = Boolean(
        (accessValidation && accessValidation.isExpired) ||
        (idValidation && idValidation.isExpired)
      );

      // Check if we have valid tokens
      const hasValidTokens = Boolean(
        (accessValidation && accessValidation.isValid) ||
        (idValidation && idValidation.isValid)
      );

      // Clear expired tokens if requested
      if (clearExpiredTokens && hasExpiredTokens) {
        logger.warn('Clearing expired tokens');
        jwtValidator.clearInvalidTokens();
      }

      // Determine authentication status
      const isAuthenticated = requireValidTokens ? hasValidTokens : !hasExpiredTokens;

      // Extract user info from valid token
      let user: AuthStatus['user'] = undefined;
      const validTokenValidation = idValidation?.isValid ? idValidation : 
        (accessValidation?.isValid ? accessValidation : null);

      if (validTokenValidation?.payload) {
        user = {
          email: validTokenValidation.payload.email,
          username: validTokenValidation.payload['cognito:username'] || validTokenValidation.payload.username,
          groups: validTokenValidation.payload['cognito:groups'] || []
        };
      }

      const authStatus: AuthStatus = {
        isAuthenticated,
        isExpired: hasExpiredTokens,
        user,
        tokens: {
          hasAccessToken: Boolean(tokens.accessToken),
          hasIdToken: Boolean(tokens.idToken),
          hasRefreshToken: Boolean(tokens.refreshToken)
        }
      };

      if (hasExpiredTokens && !hasValidTokens) {
        authStatus.error = 'Authentication tokens have expired';
      } else if (!hasValidTokens && requireValidTokens) {
        authStatus.error = 'No valid authentication tokens found';
      }

      logger.debug('Auth status', {
        isAuthenticated: authStatus.isAuthenticated,
        isExpired: authStatus.isExpired,
        hasUser: Boolean(authStatus.user),
        hasTokens: Object.values(authStatus.tokens || {}).some(Boolean)
      });

      return authStatus;
    } catch (error) {
      logger.error('Failed to check auth status', error);
      return {
        isAuthenticated: false,
        isExpired: false,
        error: error instanceof Error ? error.message : 'Unknown error checking authentication'
      };
    }
  }

  // Get tokens from storage based on preference
  private getTokensFromStorage(storage: 'localStorage' | 'sessionStorage' | 'both'): {
    accessToken?: string | null;
    idToken?: string | null;
    refreshToken?: string | null;
  } {
    const result: any = {};

    try {
      if (storage === 'localStorage' || storage === 'both') {
        result.accessToken = localStorage.getItem('accessToken');
        result.idToken = localStorage.getItem('idToken');
        result.refreshToken = localStorage.getItem('refreshToken');
      }

      if ((storage === 'sessionStorage' || storage === 'both') && 
          (!result.accessToken || !result.idToken)) {
        result.accessToken = result.accessToken || sessionStorage.getItem('accessToken');
        result.idToken = result.idToken || sessionStorage.getItem('idToken');
        result.refreshToken = result.refreshToken || sessionStorage.getItem('refreshToken');
      }
    } catch (error) {
      logger.error('Failed to access storage', error);
    }

    return result;
  }

  // Quick authentication check for simple yes/no scenarios
  isAuthenticated(): boolean {
    const status = this.checkAuthStatus({ requireValidTokens: true, clearExpiredTokens: true });
    return status.isAuthenticated;
  }

  // Get current user info if authenticated
  getCurrentUser(): AuthStatus['user'] | null {
    const status = this.checkAuthStatus({ requireValidTokens: true });
    return status.user || null;
  }

  // Check if user has specific role/group
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return Boolean(user?.groups?.includes(role));
  }

  // Force logout by clearing all tokens
  logout(): void {
    try {
      logger.info('Logging out user');
      
      // Clear from both storages
      [localStorage, sessionStorage].forEach(storage => {
        storage.removeItem('accessToken');
        storage.removeItem('idToken');
        storage.removeItem('refreshToken');
        storage.removeItem('rememberMe');
      });
      
      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Failed to logout', error);
    }
  }

  // Check authentication from request headers (for middleware)
  checkAuthFromRequest(request: Request): AuthStatus {
    try {
      // Try to get token from Authorization header
      const authHeader = request.headers.get('Authorization');
      let token: string | null = null;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }

      // Try to get token from cookies if not in header
      if (!token) {
        const cookies = request.headers.get('Cookie');
        if (cookies) {
          const tokenMatch = cookies.match(/(?:^|;\s*)accessToken=([^;]*)/);
          token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
        }
      }

      if (!token) {
        return {
          isAuthenticated: false,
          isExpired: false,
          error: 'No authentication token found in request'
        };
      }

      const validation = jwtValidator.validateTokenBasic(token);
      const user = validation.payload ? {
        email: validation.payload.email,
        username: validation.payload['cognito:username'] || validation.payload.username,
        groups: validation.payload['cognito:groups'] || []
      } : undefined;

      return {
        isAuthenticated: validation.isValid,
        isExpired: validation.isExpired,
        user,
        error: validation.error
      };
    } catch (error) {
      logger.error('Failed to check auth from request', error);
      return {
        isAuthenticated: false,
        isExpired: false,
        error: error instanceof Error ? error.message : 'Failed to check request authentication'
      };
    }
  }
}

// Singleton instance for easy access
export const authChecker = AuthChecker.getInstance();

// Helper functions for common use cases
export const isAuthenticated = (): boolean => authChecker.isAuthenticated();

export const checkAuthStatus = (options?: AuthCheckOptions): AuthStatus => 
  authChecker.checkAuthStatus(options);

export const getCurrentUser = (): AuthStatus['user'] | null => authChecker.getCurrentUser();

export const hasRole = (role: string): boolean => authChecker.hasRole(role);

export const logout = (): void => authChecker.logout();

export const checkAuthFromRequest = (request: Request): AuthStatus => 
  authChecker.checkAuthFromRequest(request);