/**
 * Phantom Mobile Error Handling
 * 
 * Comprehensive error handling for Phantom iOS deep link flows.
 * Provides user-friendly error messages and recovery suggestions.
 */

import { createLogger } from 'src/lib/logger';
import type { WalletError } from './wallet-providers';

const logger = createLogger('[PhantomMobileErrors]');

// Phantom mobile error codes from documentation
export const PHANTOM_ERROR_CODES = {
  // User interaction errors
  USER_REJECTED: '4001',
  UNAUTHORIZED: '4100', 
  UNSUPPORTED_METHOD: '4200',
  DISCONNECTED: '4900',
  
  // Request errors
  INVALID_REQUEST: '-32600',
  METHOD_NOT_FOUND: '-32601',
  INVALID_PARAMS: '-32602',
  INTERNAL_ERROR: '-32603',
  
  // Deep link specific errors
  CONNECTION_TIMEOUT: 'CONN_TIMEOUT',
  SIGNING_TIMEOUT: 'SIGN_TIMEOUT',
  DEEP_LINK_FAILED: 'DEEP_LINK_FAILED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  
  // iOS specific errors
  APP_NOT_INSTALLED: 'APP_NOT_INSTALLED',
  IOS_RESTRICTION: 'IOS_RESTRICTION',
  BROWSER_BLOCKED: 'BROWSER_BLOCKED'
} as const;

export interface PhantomMobileErrorInfo {
  code: string;
  title: string;
  message: string;
  userAction: string;
  retryable: boolean;
  recoverySteps?: string[];
}

export class PhantomMobileErrorHandler {
  private static errorMap: Map<string, PhantomMobileErrorInfo> = new Map([
    // User rejection errors
    [PHANTOM_ERROR_CODES.USER_REJECTED, {
      code: PHANTOM_ERROR_CODES.USER_REJECTED,
      title: 'Transaction Cancelled',
      message: 'You cancelled the transaction in Phantom app.',
      userAction: 'Try again when ready to approve the transaction.',
      retryable: true,
      recoverySteps: [
        'Open Phantom app',
        'Review the transaction details',
        'Approve the transaction to continue'
      ]
    }],

    // Authorization errors  
    [PHANTOM_ERROR_CODES.UNAUTHORIZED, {
      code: PHANTOM_ERROR_CODES.UNAUTHORIZED,
      title: 'Connection Not Authorized',
      message: 'SPLITDO is not authorized to connect to your Phantom wallet.',
      userAction: 'Please connect your wallet again to authorize access.',
      retryable: true,
      recoverySteps: [
        'Disconnect your wallet if connected',
        'Try connecting again',
        'Approve the connection in Phantom app',
        'Allow SPLITDO access to your wallet'
      ]
    }],

    // Connection timeout
    [PHANTOM_ERROR_CODES.CONNECTION_TIMEOUT, {
      code: PHANTOM_ERROR_CODES.CONNECTION_TIMEOUT,
      title: 'Connection Timeout',
      message: 'Connection to Phantom app timed out. This may happen if you took too long to respond.',
      userAction: 'Try connecting again and respond promptly in the Phantom app.',
      retryable: true,
      recoverySteps: [
        'Make sure Phantom app is installed',
        'Try connecting again',
        'Respond within 60 seconds in Phantom app',
        'Check your internet connection'
      ]
    }],

    // Signing timeout
    [PHANTOM_ERROR_CODES.SIGNING_TIMEOUT, {
      code: PHANTOM_ERROR_CODES.SIGNING_TIMEOUT,
      title: 'Signing Timeout',
      message: 'Transaction signing timed out. You may have taken too long to approve in Phantom.',
      userAction: 'Try the transaction again and approve promptly.',
      retryable: true,
      recoverySteps: [
        'Ensure Phantom app is open and responsive',
        'Try the exchange again',
        'Approve the transaction within 60 seconds',
        'Check if you have sufficient SOL balance'
      ]
    }],

    // Deep link failures
    [PHANTOM_ERROR_CODES.DEEP_LINK_FAILED, {
      code: PHANTOM_ERROR_CODES.DEEP_LINK_FAILED,
      title: 'App Connection Failed',
      message: 'Failed to open Phantom app. Make sure Phantom is installed.',
      userAction: 'Install Phantom app or try again.',
      retryable: true,
      recoverySteps: [
        'Install Phantom app from App Store',
        'Make sure Phantom app is up to date',
        'Try opening Phantom manually first',
        'Then return to SPLITDO and try again'
      ]
    }],

    // Session errors
    [PHANTOM_ERROR_CODES.SESSION_EXPIRED, {
      code: PHANTOM_ERROR_CODES.SESSION_EXPIRED,
      title: 'Session Expired', 
      message: 'Your wallet session has expired. Please reconnect.',
      userAction: 'Reconnect your wallet to continue.',
      retryable: true,
      recoverySteps: [
        'Disconnect your current wallet session',
        'Connect to Phantom again',
        'Complete the authorization process',
        'Try your exchange again'
      ]
    }],

    // Encryption errors
    [PHANTOM_ERROR_CODES.ENCRYPTION_FAILED, {
      code: PHANTOM_ERROR_CODES.ENCRYPTION_FAILED,
      title: 'Security Error',
      message: 'Failed to establish secure connection with Phantom app.',
      userAction: 'Try connecting again.',
      retryable: true,
      recoverySteps: [
        'Refresh the page',
        'Try connecting again',
        'Make sure your browser is up to date',
        'Contact support if issue persists'
      ]
    }],

    // iOS specific errors
    [PHANTOM_ERROR_CODES.APP_NOT_INSTALLED, {
      code: PHANTOM_ERROR_CODES.APP_NOT_INSTALLED,
      title: 'Phantom App Required',
      message: 'Phantom app is not installed on your device.',
      userAction: 'Install Phantom app to continue.',
      retryable: false,
      recoverySteps: [
        'Download Phantom from the App Store',
        'Set up your wallet in Phantom app',
        'Return to SPLITDO to connect',
        'Use the Connect Wallet button'
      ]
    }],

    // iOS browser restrictions
    [PHANTOM_ERROR_CODES.IOS_RESTRICTION, {
      code: PHANTOM_ERROR_CODES.IOS_RESTRICTION,
      title: 'iOS Browser Limitation',
      message: 'Some iOS browsers have restrictions. Try using Safari or the Phantom app browser.',
      userAction: 'Switch to Safari or open SPLITDO in Phantom app browser.',
      retryable: true,
      recoverySteps: [
        'Open Safari on your iOS device',
        'Visit SPLITDO website in Safari',
        'Or open SPLITDO in Phantom app\'s built-in browser',
        'Try connecting again'
      ]
    }],

    // Generic disconnection
    [PHANTOM_ERROR_CODES.DISCONNECTED, {
      code: PHANTOM_ERROR_CODES.DISCONNECTED,
      title: 'Wallet Disconnected',
      message: 'Your Phantom wallet was disconnected.',
      userAction: 'Please reconnect your wallet.',
      retryable: true,
      recoverySteps: [
        'Click the Connect Wallet button',
        'Choose Phantom from the list',
        'Approve the connection in Phantom app',
        'Try your transaction again'
      ]
    }]
  ]);

  /**
   * Parse a Phantom mobile error and return user-friendly information
   */
  static parseError(error: any): PhantomMobileErrorInfo {
    logger.debug('Parsing Phantom mobile error:', error);

    let errorCode = 'UNKNOWN_ERROR';
    let originalMessage = 'An unknown error occurred';

    // Extract error information from different error formats
    if (typeof error === 'string') {
      originalMessage = error;
      errorCode = this.inferErrorCode(error);
    } else if (error instanceof Error) {
      originalMessage = error.message;
      errorCode = this.inferErrorCode(error.message);
    } else if (error?.code) {
      errorCode = error.code;
      originalMessage = error.message || error.errorMessage || 'Unknown error';
    } else if (error?.errorCode) {
      errorCode = error.errorCode;
      originalMessage = error.errorMessage || 'Unknown error';
    }

    // Look up error information
    const errorInfo = this.errorMap.get(errorCode);
    
    if (errorInfo) {
      logger.info(`Found error info for code ${errorCode}:`, errorInfo.title);
      return errorInfo;
    }

    // Return generic error info for unknown errors
    logger.warn(`Unknown error code ${errorCode}, using generic error info`);
    return {
      code: errorCode,
      title: 'Wallet Error',
      message: originalMessage,
      userAction: 'Please try again or contact support if the issue persists.',
      retryable: true,
      recoverySteps: [
        'Check your internet connection',
        'Make sure Phantom app is installed and updated',
        'Try refreshing the page',
        'Contact support if problem continues'
      ]
    };
  }

  /**
   * Infer error code from error message
   */
  private static inferErrorCode(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('rejected') || lowerMessage.includes('cancelled') || lowerMessage.includes('denied')) {
      return PHANTOM_ERROR_CODES.USER_REJECTED;
    }
    
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('not authorized')) {
      return PHANTOM_ERROR_CODES.UNAUTHORIZED;
    }
    
    if (lowerMessage.includes('timeout')) {
      if (lowerMessage.includes('sign') || lowerMessage.includes('transaction')) {
        return PHANTOM_ERROR_CODES.SIGNING_TIMEOUT;
      } else {
        return PHANTOM_ERROR_CODES.CONNECTION_TIMEOUT;
      }
    }
    
    if (lowerMessage.includes('deep link') || lowerMessage.includes('failed to open')) {
      return PHANTOM_ERROR_CODES.DEEP_LINK_FAILED;
    }
    
    if (lowerMessage.includes('session') || lowerMessage.includes('expired')) {
      return PHANTOM_ERROR_CODES.SESSION_EXPIRED;
    }
    
    if (lowerMessage.includes('encryption') || lowerMessage.includes('decrypt')) {
      return PHANTOM_ERROR_CODES.ENCRYPTION_FAILED;
    }
    
    if (lowerMessage.includes('not installed') || lowerMessage.includes('app required')) {
      return PHANTOM_ERROR_CODES.APP_NOT_INSTALLED;
    }
    
    if (lowerMessage.includes('disconnected')) {
      return PHANTOM_ERROR_CODES.DISCONNECTED;
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Create a user-friendly error message with recovery steps
   */
  static createErrorMessage(errorInfo: PhantomMobileErrorInfo): string {
    let message = `${errorInfo.title}\n\n${errorInfo.message}\n\n${errorInfo.userAction}`;
    
    if (errorInfo.recoverySteps && errorInfo.recoverySteps.length > 0) {
      message += '\n\nSteps to resolve:\n';
      errorInfo.recoverySteps.forEach((step, index) => {
        message += `${index + 1}. ${step}\n`;
      });
    }
    
    return message;
  }

  /**
   * Check if an error is retryable
   */
  static isRetryable(error: any): boolean {
    const errorInfo = this.parseError(error);
    return errorInfo.retryable;
  }

  /**
   * Get recovery suggestions for an error
   */
  static getRecoverySteps(error: any): string[] {
    const errorInfo = this.parseError(error);
    return errorInfo.recoverySteps || [];
  }

  /**
   * Create a WalletError from a Phantom mobile error
   */
  static createWalletError(error: any): WalletError {
    const errorInfo = this.parseError(error);
    
    return {
      message: errorInfo.message,
      code: errorInfo.code,
      provider: 'Phantom Mobile',
      name: 'WalletError',
      userAction: errorInfo.userAction,
      retryable: errorInfo.retryable,
      recoverySteps: errorInfo.recoverySteps
    } as WalletError & {
      userAction: string;
      retryable: boolean;
      recoverySteps?: string[];
    };
  }
}

// Export for use in exchange utils
export { PhantomMobileErrorHandler as ErrorHandler };