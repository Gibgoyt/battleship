import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { cognitoConfig } from './cognito-config';
import { createLogger } from './logger';

const logger = createLogger('AuthService');

export class AuthService {
  private client: CognitoIdentityProviderClient;

  constructor() {
    this.client = new CognitoIdentityProviderClient({
      region: cognitoConfig.region,
    });
  }

  async signIn(email: string, password: string): Promise<{
    success: boolean;
    tokens?: {
      accessToken: string;
      idToken: string;
      refreshToken: string;
    };
    error?: string;
    challenge?: string;
  }> {
    try {
      logger.info(`Starting authentication for: ${email}`);

      const authCommand = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: cognitoConfig.userPoolWebClientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const response = await this.client.send(authCommand);
      logger.info('Authentication response received');

      if (response.AuthenticationResult) {
        const { AccessToken, IdToken, RefreshToken } = response.AuthenticationResult;

        if (AccessToken && IdToken && RefreshToken) {
          return {
            success: true,
            tokens: {
              accessToken: AccessToken,
              idToken: IdToken,
              refreshToken: RefreshToken,
            },
          };
        }
      }

      if (response.ChallengeName) {
        return {
          success: false,
          challenge: response.ChallengeName,
        };
      }

      return {
        success: false,
        error: 'Unknown authentication error',
      };
    } catch (error: any) {
      logger.error('Authentication failed', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.name === 'UserNotFoundException') {
        errorMessage = 'No account found with this email address.';
      } else if (error.name === 'NotAuthorizedException') {
        errorMessage = 'Incorrect email or password.';
      } else if (error.name === 'UserNotConfirmedException') {
        errorMessage = 'Please verify your email address before signing in.';
      } else if (error.name === 'TooManyRequestsException') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  storeTokens(tokens: { accessToken: string; idToken: string; refreshToken: string }, rememberMe: boolean = false) {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('accessToken', tokens.accessToken);
    storage.setItem('idToken', tokens.idToken);
    storage.setItem('refreshToken', tokens.refreshToken);
    storage.setItem('rememberMe', rememberMe.toString());
    logger.info('Tokens stored');
  }

  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('idToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('rememberMe');
    logger.info('Tokens cleared');
  }
}