// JWT validation utilities for Firebase tokens
import { createLogger } from '../logger';

const logger = createLogger('[Firebase JWT Validator]');

export interface FirebaseTokenPayload {
  sub: string; // Firebase user ID
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  iss: string; // issuer
  aud: string; // audience (Firebase project ID)
  auth_time: number;
  user_id: string;
  firebase: {
    identities: {
      email?: string[];
      [key: string]: any;
    };
    sign_in_provider: string;
  };
  exp: number;
  iat: number;
}

export interface FirebaseAuthValidationResult {
  isValid: boolean;
  isExpired: boolean;
  payload?: FirebaseTokenPayload;
  error?: string;
}

export class FirebaseJWTValidator {
  private static instance: FirebaseJWTValidator;

  private constructor() {}

  static getInstance(): FirebaseJWTValidator {
    if (!FirebaseJWTValidator.instance) {
      FirebaseJWTValidator.instance = new FirebaseJWTValidator();
    }
    return FirebaseJWTValidator.instance;
  }

  // Decode JWT token without verification (for basic checks)
  decodeToken(token: string): { header: any; payload: FirebaseTokenPayload } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));

      return { header, payload };
    } catch (error) {
      logger.error('Failed to decode token:', error);
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
  validateTokenBasic(token: string): FirebaseAuthValidationResult {
    try {
      logger.debug('Starting token validation', {
        hasToken: Boolean(token),
        tokenLength: token?.length
      });

      if (!token || typeof token !== 'string') {
        logger.debug('Token missing or invalid format');
        return {
          isValid: false,
          isExpired: false,
          error: 'Token is missing or invalid format'
        };
      }

      const decoded = this.decodeToken(token);
      if (!decoded) {
        logger.debug('Failed to decode token');
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
        email: payload.email,
        emailVerified: payload.email_verified,
        signInProvider: payload.firebase?.sign_in_provider,
        isExpired,
        expiresAt: new Date(payload.exp * 1000).toISOString()
      });

      if (isExpired) {
        logger.debug('Token has expired');
        return {
          isValid: false,
          isExpired: true,
          payload,
          error: 'Token has expired'
        };
      }

      // Basic payload validation for Firebase tokens
      if (!payload.sub || !payload.exp || !payload.iat || !payload.iss || !payload.aud) {
        logger.debug('Token missing required claims', {
          hasSub: Boolean(payload.sub),
          hasExp: Boolean(payload.exp),
          hasIat: Boolean(payload.iat),
          hasIss: Boolean(payload.iss),
          hasAud: Boolean(payload.aud)
        });
        return {
          isValid: false,
          isExpired: false,
          payload,
          error: 'Token missing required claims'
        };
      }

      // Validate Firebase-specific fields
      if (!payload.firebase || !payload.user_id) {
        logger.debug('Token missing Firebase-specific claims', {
          hasFirebase: Boolean(payload.firebase),
          hasUserId: Boolean(payload.user_id)
        });
        return {
          isValid: false,
          isExpired: false,
          payload,
          error: 'Token missing Firebase-specific claims'
        };
      }

      logger.debug('Token validation successful');
      return {
        isValid: true,
        isExpired: false,
        payload
      };
    } catch (error) {
      logger.error('Validation error:', error);
      return {
        isValid: false,
        isExpired: false,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      };
    }
  }

  // Extract user info from valid Firebase token
  extractUserInfo(token: string): { email?: string; name?: string; picture?: string; userId?: string; emailVerified?: boolean } | null {
    const validation = this.validateTokenBasic(token);
    if (!validation.isValid || !validation.payload) {
      return null;
    }

    const { payload } = validation;
    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      userId: payload.user_id,
      emailVerified: payload.email_verified || false
    };
  }

  // Validate Firebase tokens from storage (localStorage/sessionStorage)
  validateStoredTokens(): {
    idToken?: FirebaseAuthValidationResult;
    hasValidTokens: boolean;
  } {
    try {
      // Check both localStorage and sessionStorage
      const storages = [localStorage, sessionStorage];
      let idToken: string | null = null;

      for (const storage of storages) {
        if (!idToken) idToken = storage.getItem('firebase-idToken');
      }

      const idResult = idToken ? this.validateTokenBasic(idToken) : null;

      const hasValidTokens = Boolean(idResult?.isValid);

      return {
        idToken: idResult || undefined,
        hasValidTokens
      };
    } catch (error) {
      logger.error('Failed to validate stored tokens:', error);
      return { hasValidTokens: false };
    }
  }

  // Check if user is authenticated based on stored Firebase tokens
  isUserAuthenticated(): boolean {
    const validation = this.validateStoredTokens();
    return validation.hasValidTokens;
  }

  // Clear expired or invalid Firebase tokens from storage
  clearInvalidTokens(): void {
    try {
      const storages = [localStorage, sessionStorage];
      
      for (const storage of storages) {
        const idToken = storage.getItem('firebase-idToken');
        const refreshToken = storage.getItem('firebase-refreshToken');

        let shouldClear = false;

        if (idToken && !this.validateTokenBasic(idToken).isValid) {
          shouldClear = true;
        }

        if (shouldClear) {
          logger.debug('Clearing invalid tokens from storage');
          storage.removeItem('firebase-idToken');
          storage.removeItem('firebase-refreshToken');
          storage.removeItem('firebase-rememberMe');
        }
      }
    } catch (error) {
      logger.error('Failed to clear invalid tokens:', error);
    }
  }

  // Validate that the token is from the expected Firebase project
  validateFirebaseProject(token: string, expectedProjectId: string): boolean {
    try {
      const validation = this.validateTokenBasic(token);
      if (!validation.isValid || !validation.payload) {
        return false;
      }

      // Check if the audience matches our project ID
      return validation.payload.aud === expectedProjectId;
    } catch (error) {
      logger.error('Failed to validate project ID:', error);
      return false;
    }
  }
}

// Helper functions for easy access
export const firebaseJwtValidator = FirebaseJWTValidator.getInstance();

export const isFirebaseAuthenticated = (): boolean => {
  return firebaseJwtValidator.isUserAuthenticated();
};

export const validateFirebaseToken = (token: string): FirebaseAuthValidationResult => {
  return firebaseJwtValidator.validateTokenBasic(token);
};

export const getFirebaseUserInfo = (token?: string): { email?: string; name?: string; picture?: string; userId?: string; emailVerified?: boolean } | null => {
  if (token) {
    return firebaseJwtValidator.extractUserInfo(token);
  }
  
  // Try to get from stored tokens
  const validation = firebaseJwtValidator.validateStoredTokens();
  if (validation.idToken?.isValid && validation.idToken.payload) {
    const payload = validation.idToken.payload;
    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      userId: payload.user_id,
      emailVerified: payload.email_verified || false
    };
  }
  
  return null;
};

export const clearExpiredFirebaseTokens = (): void => {
  firebaseJwtValidator.clearInvalidTokens();
};

export const validateFirebaseProjectId = (token: string, projectId: string): boolean => {
  return firebaseJwtValidator.validateFirebaseProject(token, projectId);
};
