import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { cognitoConfig } from '../cognito-config';
import { createLogger } from '../logger';

const logger = createLogger('CognitoSignInService');

export interface SignInResult {
  success: boolean;
  tokens?: {
    accessToken: string;
    idToken: string;
    refreshToken: string;
  };
  error?: string;
  challenge?: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export class CognitoSignInService {
  private userPool: CognitoUserPool;

  constructor() {
    const poolData = {
      UserPoolId: cognitoConfig.userPoolId,
      ClientId: cognitoConfig.userPoolWebClientId,
    };

    logger.debug('Initializing with pool data', {
      UserPoolId: poolData.UserPoolId ? 'PRESENT' : 'MISSING',
      ClientId: poolData.ClientId ? 'PRESENT' : 'MISSING'
    });
    this.userPool = new CognitoUserPool(poolData);
    logger.info('User pool created successfully');
  }

  async signIn(credentials: SignInCredentials): Promise<SignInResult> {
    const { email, password, rememberMe = false } = credentials;
    
    logger.info(`Starting sign in for: ${email}`);

    return new Promise((resolve) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: this.userPool,
      });

      logger.debug('Calling authenticateUser');

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          logger.info('Authentication SUCCESS');

          const accessToken = result.getAccessToken().getJwtToken();
          const idToken = result.getIdToken().getJwtToken();
          const refreshToken = result.getRefreshToken().getToken();

          logger.debug('Tokens received', {
            accessToken: accessToken ? 'PRESENT' : 'MISSING',
            idToken: idToken ? 'PRESENT' : 'MISSING',
            refreshToken: refreshToken ? 'PRESENT' : 'MISSING'
          });

          const tokens = {
            accessToken,
            idToken,
            refreshToken,
          };

          // Store tokens
          this.storeTokens(tokens, rememberMe);

          resolve({
            success: true,
            tokens,
          });
        },

        onFailure: (err) => {
          logger.error('Authentication FAILED', err);

          let errorMessage = 'Login failed. Please try again.';
          
          switch (err.code) {
            case 'UserNotFoundException':
              errorMessage = 'No account found with this email address.';
              break;
            case 'NotAuthorizedException':
              errorMessage = 'Incorrect email or password.';
              break;
            case 'UserNotConfirmedException':
              errorMessage = 'Please verify your email address before signing in.';
              break;
            case 'TooManyRequestsException':
              errorMessage = 'Too many failed attempts. Please try again later.';
              break;
            case 'TooManyFailedAttemptsException':
              errorMessage = 'Account temporarily locked due to too many failed attempts.';
              break;
            default:
              errorMessage = err.message || errorMessage;
          }

          resolve({
            success: false,
            error: errorMessage,
          });
        },

        newPasswordRequired: (userAttributes, requiredAttributes) => {
          logger.warn('New password required', { userAttributes, requiredAttributes });
          
          resolve({
            success: false,
            challenge: 'NEW_PASSWORD_REQUIRED',
            error: 'New password required. Please contact support.',
          });
        },

        mfaRequired: (challengeName, challengeParameters) => {
          logger.warn('MFA required', { challengeName, challengeParameters });
          
          resolve({
            success: false,
            challenge: challengeName,
            error: 'MFA verification required. Please contact support.',
          });
        }
      });
    });
  }

  private storeTokens(tokens: { accessToken: string; idToken: string; refreshToken: string }, rememberMe: boolean = false): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem('accessToken', tokens.accessToken);
    storage.setItem('idToken', tokens.idToken);
    storage.setItem('refreshToken', tokens.refreshToken);
    storage.setItem('rememberMe', rememberMe.toString());
    
    logger.info(`Tokens stored in ${rememberMe ? 'localStorage' : 'sessionStorage'}`);
  }

  clearTokens(): void {
    // Clear from both storages to be safe
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('rememberMe');
    
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('idToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('rememberMe');
    
    logger.info('Tokens cleared from all storage');
  }

  isAuthenticated(): boolean {
    const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    return !!accessToken;
  }

  getStoredTokens(): { accessToken: string; idToken: string; refreshToken: string } | null {
    const accessToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const idToken = localStorage.getItem('idToken') || sessionStorage.getItem('idToken');
    const refreshToken = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');

    if (accessToken && idToken && refreshToken) {
      return { accessToken, idToken, refreshToken };
    }

    return null;
  }
}