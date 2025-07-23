// JWT validation utilities for AWS Cognito tokens
import { createLogger } from '../logger';

const logger = createLogger('JWTValidator');

export interface CognitoTokenPayload {
  sub: string;
  email: string;
  email_verified?: boolean;
  username?: string;
  'cognito:groups'?: string[];
  'cognito:username'?: string;
  exp: number;
  iat: number;
  token_use: 'id' | 'access';
}

export interface AuthValidationResult {
  isValid: boolean;
  isExpired: boolean;
  payload?: CognitoTokenPayload;
  error?: string;
}

export class JWTValidator {
  private static instance: JWTValidator;
  private jwksCache: any = null;
  private jwksCacheExpiry: number = 0;

  private constructor() {}

  static getInstance(): JWTValidator {
    if (!JWTValidator.instance) {
      JWTValidator.instance = new JWTValidator();
    }
    return JWTValidator.instance;
  }

  // Decode JWT token without verification (for basic checks)
  decodeToken(token: string): { header: any; payload: CognitoTokenPayload } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));

      return { header, payload };
    } catch (error) {
      logger.error('Failed to decode token', error);
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.payload.exp < currentTime;
  }

  // Basic token validation (without signature verification)
  validateTokenBasic(token: string): AuthValidationResult {
    try {
      logger.debug('Starting token validation', {
        hasToken: Boolean(token),
        tokenLength: token?.length
      });

      if (!token || typeof token !== 'string') {
        logger.warn('Token missing or invalid format');
        return {
          isValid: false,
          isExpired: false,
          error: 'Token is missing or invalid format'
        };
      }

      const decoded = this.decodeToken(token);
      if (!decoded) {
        logger.warn('Failed to decode token');
        return {
          isValid: false,
          isExpired: false,
          error: 'Failed to decode token'
        };
      }

      const { payload } = decoded;
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < currentTime;

      logger.debug('Token decoded successfully', {
        sub: payload.sub?.substring(0, 8) + '***',
        email: payload.email,
        tokenUse: payload.token_use,
        iat: new Date(payload.iat * 1000).toISOString(),
        exp: new Date(payload.exp * 1000).toISOString(),
        isExpired,
        timeUntilExpiry: `${payload.exp - currentTime} seconds`
      });

      if (isExpired) {
        logger.warn('Token has expired');
        return {
          isValid: false,
          isExpired: true,
          payload,
          error: 'Token has expired'
        };
      }

      // Basic payload validation
      if (!payload.sub || !payload.exp || !payload.iat) {
        logger.warn('Token missing required claims', {
          hasSub: Boolean(payload.sub),
          hasExp: Boolean(payload.exp),
          hasIat: Boolean(payload.iat)
        });
        return {
          isValid: false,
          isExpired: false,
          payload,
          error: 'Token missing required claims'
        };
      }

      logger.debug('Token validation successful');
      return {
        isValid: true,
        isExpired: false,
        payload
      };
    } catch (error) {
      logger.error('Validation error', error);
      return {
        isValid: false,
        isExpired: false,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }

  // Extract user info from valid token
  extractUserInfo(token: string): { email?: string; username?: string; groups?: string[] } | null {
    const validation = this.validateTokenBasic(token);
    if (!validation.isValid || !validation.payload) {
      return null;
    }

    const { payload } = validation;
    return {
      email: payload.email,
      username: payload['cognito:username'] || payload.username,
      groups: payload['cognito:groups'] || []
    };
  }

  // Validate tokens from storage (localStorage/sessionStorage)
  validateStoredTokens(): {
    accessToken?: AuthValidationResult;
    idToken?: AuthValidationResult;
    hasValidTokens: boolean;
  } {
    try {
      // Check both localStorage and sessionStorage
      const storages = [localStorage, sessionStorage];
      let accessToken: string | null = null;
      let idToken: string | null = null;

      for (const storage of storages) {
        if (!accessToken) accessToken = storage.getItem('accessToken');
        if (!idToken) idToken = storage.getItem('idToken');
      }

      const accessResult = accessToken ? this.validateTokenBasic(accessToken) : null;
      const idResult = idToken ? this.validateTokenBasic(idToken) : null;

      const hasValidTokens = Boolean(
        accessResult?.isValid || idResult?.isValid
      );

      return {
        accessToken: accessResult || undefined,
        idToken: idResult || undefined,
        hasValidTokens
      };
    } catch (error) {
      logger.error('Failed to validate stored tokens', error);
      return { hasValidTokens: false };
    }
  }

  // Check if user is authenticated based on stored tokens
  isUserAuthenticated(): boolean {
    const validation = this.validateStoredTokens();
    return validation.hasValidTokens;
  }

  // Clear expired or invalid tokens from storage
  clearInvalidTokens(): void {
    try {
      const storages = [localStorage, sessionStorage];
      
      for (const storage of storages) {
        const accessToken = storage.getItem('accessToken');
        const idToken = storage.getItem('idToken');
        const refreshToken = storage.getItem('refreshToken');

        let shouldClear = false;

        if (accessToken && !this.validateTokenBasic(accessToken).isValid) {
          shouldClear = true;
        }

        if (idToken && !this.validateTokenBasic(idToken).isValid) {
          shouldClear = true;
        }

        if (shouldClear) {
          logger.warn('Clearing invalid tokens from storage');
          storage.removeItem('accessToken');
          storage.removeItem('idToken');
          storage.removeItem('refreshToken');
          storage.removeItem('rememberMe');
        }
      }
    } catch (error) {
      logger.error('Failed to clear invalid tokens', error);
    }
  }
}

// Helper functions for easy access
export const jwtValidator = JWTValidator.getInstance();

export const isAuthenticated = (): boolean => {
  return jwtValidator.isUserAuthenticated();
};

export const validateToken = (token: string): AuthValidationResult => {
  return jwtValidator.validateTokenBasic(token);
};

export const getUserInfo = (token?: string): { email?: string; username?: string; groups?: string[] } | null => {
  if (token) {
    return jwtValidator.extractUserInfo(token);
  }
  
  // Try to get from stored tokens
  const validation = jwtValidator.validateStoredTokens();
  if (validation.idToken?.isValid && validation.idToken.payload) {
    return {
      email: validation.idToken.payload.email,
      username: validation.idToken.payload['cognito:username'] || validation.idToken.payload.username,
      groups: validation.idToken.payload['cognito:groups'] || []
    };
  }
  
  return null;
};

export const clearExpiredTokens = (): void => {
  jwtValidator.clearInvalidTokens();
};