/**
 * iOS Phantom Authorization Manager
 * 
 * Handles the complex authorization flows specific to Phantom wallet on iOS.
 * Addresses authorization failures, state management, and user gesture requirements.
 */

import { createLogger } from 'src/lib/logger';
import { getDeviceInfo } from './exchange-utils';

const logger = createLogger('[iOSPhantomAuth]');

export interface PhantomProvider {
  isPhantom?: boolean;
  isConnected?: boolean;
  connect: (opts?: any) => Promise<{ publicKey: { toString(): string } }>;
  disconnect: () => Promise<void>;
  _events?: any;
  _eventsCount?: number;
}

export interface AuthConnectionOptions {
  timeout?: number;
  retryAttempts?: number;
  requireUserGesture?: boolean;
  clearStateFirst?: boolean;
  onlyIfTrusted?: boolean;
}

export interface AuthConnectionResult {
  success: boolean;
  publicKey?: { toString(): string };
  error?: Error;
  retryable?: boolean;
  recoverySteps?: string[];
}

export class iOSPhantomAuthManager {
  private static readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second
  
  private provider: PhantomProvider | null = null;
  private isConnecting = false;
  private lastUserGestureTime = 0;
  
  constructor(provider: PhantomProvider) {
    this.provider = provider;
    logger.debug('iOS Phantom Auth Manager initialized');
  }

  /**
   * Enhanced connection with iOS-specific authorization handling
   */
  async connect(options: AuthConnectionOptions = {}): Promise<AuthConnectionResult> {
    const deviceInfo = getDeviceInfo();
    const isIOS = deviceInfo.platform === 'iOS';
    const isPhantomApp = deviceInfo.isPhantomApp;
    
    logger.info('Starting iOS Phantom connection', { 
      isIOS, 
      isPhantomApp, 
      options 
    });

    // Prevent concurrent connection attempts
    if (this.isConnecting) {
      throw new Error('Connection already in progress');
    }

    this.isConnecting = true;

    try {
      // iOS-specific pre-connection validation
      if (isIOS) {
        const validationResult = await this.validateiOSReadiness(options);
        if (!validationResult.ready) {
          return {
            success: false,
            error: new Error(validationResult.reason || 'iOS validation failed'),
            retryable: validationResult.retryable,
            recoverySteps: validationResult.recoverySteps
          };
        }
      }

      // Comprehensive state clearing
      if (options.clearStateFirst !== false) {
        await this.comprehensiveStateClear();
      }

      // Attempt connection with retries
      const result = await this.attemptConnectionWithRetries(options);
      
      logger.info('Connection attempt result', result);
      return result;

    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Validate iOS-specific readiness for authorization
   */
  private async validateiOSReadiness(options: AuthConnectionOptions): Promise<{
    ready: boolean;
    reason?: string;
    retryable?: boolean;
    recoverySteps?: string[];
  }> {
    const deviceInfo = getDeviceInfo();
    
    // Check if we're in the right environment
    if (!deviceInfo.isPhantomApp && deviceInfo.platform === 'iOS') {
      return {
        ready: false,
        reason: 'Please open this page in the Phantom app browser',
        retryable: false,
        recoverySteps: [
          'Open the Phantom app',
          'Use the browser within Phantom app',
          'Navigate to SPLITDO',
          'Try connecting again'
        ]
      };
    }

    // Validate user gesture requirement
    if (options.requireUserGesture !== false) {
      // Check for recent user gesture (either from our instance or global window)
      let lastGestureTime = this.lastUserGestureTime;
      
      if (typeof window !== 'undefined' && (window as any).__lastUserGestureTime) {
        lastGestureTime = Math.max(lastGestureTime, (window as any).__lastUserGestureTime);
      }
      
      const timeSinceGesture = Date.now() - lastGestureTime;
      if (timeSinceGesture > 5000) { // 5 seconds
        logger.warn(`User gesture validation failed: ${timeSinceGesture}ms since last gesture`);
        return {
          ready: false,
          reason: 'Connection requires recent user interaction',
          retryable: true,
          recoverySteps: [
            'Tap the connect button again',
            'Ensure you\'re actively interacting with the page'
          ]
        };
      } else {
        logger.debug(`User gesture validation passed: ${timeSinceGesture}ms since last gesture`);
      }
    }

    // Check provider availability
    if (!this.provider) {
      return {
        ready: false,
        reason: 'Phantom provider not available',
        retryable: false,
        recoverySteps: [
          'Refresh the Phantom app',
          'Make sure you\'re using the latest version',
          'Try again'
        ]
      };
    }

    // Check if provider is in a clean state
    if (this.provider.isConnected === true) {
      logger.warn('Provider reports connected state, will clear first');
      return {
        ready: true,
        reason: 'Will clear existing connection state first'
      };
    }

    return { ready: true };
  }

  /**
   * Comprehensive state clearing to prevent authorization conflicts
   */
  private async comprehensiveStateClear(): Promise<void> {
    logger.debug('Starting comprehensive state clearing');

    if (!this.provider) {
      logger.debug('No provider available for state clearing');
      return;
    }

    try {
      // Step 1: Disconnect if connected
      if (this.provider.isConnected === true) {
        logger.debug('Disconnecting existing connection');
        await this.provider.disconnect();
        
        // Wait for disconnection to propagate
        await this.sleep(500);
      }

      // Step 2: Clear event listeners (if accessible)
      if (this.provider._events) {
        logger.debug('Clearing provider event listeners');
        this.provider._events = {};
        this.provider._eventsCount = 0;
      }

      // Step 3: Force garbage collection of any stale references
      if (typeof window !== 'undefined') {
        // Clear any cached provider references
        const windowAny = window as any;
        if (windowAny.__phantomConnectionCache) {
          delete windowAny.__phantomConnectionCache;
        }
      }

      logger.debug('Comprehensive state clearing completed');

    } catch (error) {
      logger.warn('Error during state clearing (continuing anyway):', error);
      // Continue with connection attempt even if state clearing fails
    }
  }

  /**
   * Attempt connection with intelligent retry logic
   */
  private async attemptConnectionWithRetries(options: AuthConnectionOptions): Promise<AuthConnectionResult> {
    const maxAttempts = options.retryAttempts ?? iOSPhantomAuthManager.MAX_RETRY_ATTEMPTS;
    const timeout = options.timeout ?? iOSPhantomAuthManager.DEFAULT_TIMEOUT;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      logger.debug(`Connection attempt ${attempt}/${maxAttempts}`);

      try {
        const result = await this.singleConnectionAttempt(timeout, options);
        if (result.success) {
          logger.info(`✅ Connection successful on attempt ${attempt}`);
          return result;
        }

        // If not retryable, don't try again
        if (!result.retryable && attempt < maxAttempts) {
          logger.warn('Error is not retryable, stopping attempts');
          return result;
        }

        // Wait between attempts
        if (attempt < maxAttempts) {
          logger.debug(`Waiting ${iOSPhantomAuthManager.RETRY_DELAY}ms before retry`);
          await this.sleep(iOSPhantomAuthManager.RETRY_DELAY);
        }

      } catch (error) {
        logger.error(`Attempt ${attempt} failed with exception:`, error);

        if (attempt === maxAttempts) {
          return {
            success: false,
            error: error instanceof Error ? error : new Error(String(error)),
            retryable: this.isRetryableError(error),
            recoverySteps: this.getRecoverySteps(error)
          };
        }
      }
    }

    return {
      success: false,
      error: new Error(`All ${maxAttempts} connection attempts failed`),
      retryable: true,
      recoverySteps: [
        'Try refreshing the Phantom app',
        'Make sure you have the latest version',
        'Check your internet connection',
        'Contact support if issue persists'
      ]
    };
  }

  /**
   * Single connection attempt with timeout
   */
  private async singleConnectionAttempt(
    timeout: number, 
    options: AuthConnectionOptions
  ): Promise<AuthConnectionResult> {
    if (!this.provider) {
      throw new Error('Provider not available');
    }

    logger.debug('Starting single connection attempt');

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        logger.warn('Connection attempt timed out');
        resolve({
          success: false,
          error: new Error('Connection timeout - please try again'),
          retryable: true,
          recoverySteps: [
            'Try connecting again',
            'Make sure you respond promptly in Phantom',
            'Refresh the Phantom app if needed'
          ]
        });
      }, timeout);

      // iOS-specific connection options
      const connectionOptions = {
        onlyIfTrusted: options.onlyIfTrusted ?? false
      };

      this.provider!.connect(connectionOptions)
        .then((response) => {
          clearTimeout(timeoutId);
          
          if (response?.publicKey) {
            logger.info('✅ Provider connection successful');
            resolve({
              success: true,
              publicKey: response.publicKey
            });
          } else {
            logger.error('Provider returned invalid response:', response);
            resolve({
              success: false,
              error: new Error('Invalid response from Phantom'),
              retryable: true,
              recoverySteps: ['Try connecting again', 'Refresh Phantom app']
            });
          }
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          logger.error('Provider connection failed:', error);
          
          resolve({
            success: false,
            error: error instanceof Error ? error : new Error(String(error)),
            retryable: this.isRetryableError(error),
            recoverySteps: this.getRecoverySteps(error)
          });
        });
    });
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    const errorMessage = (error?.message || '').toLowerCase();
    const errorCode = error?.code;

    // User rejection is not retryable immediately
    if (errorCode === 4001 || errorMessage.includes('rejected') || errorMessage.includes('cancelled')) {
      return false;
    }

    // Authorization errors might be temporary state issues
    if (errorCode === 4100 || errorMessage.includes('unauthorized') || errorMessage.includes('not authorized')) {
      return true;
    }

    // Timeouts and network issues are retryable
    if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
      return true;
    }

    // Default to retryable for unknown errors
    return true;
  }

  /**
   * Get recovery steps for specific errors
   */
  private getRecoverySteps(error: any): string[] {
    const errorMessage = (error?.message || '').toLowerCase();
    const errorCode = error?.code;

    if (errorCode === 4001 || errorMessage.includes('rejected')) {
      return [
        'Try connecting again when ready',
        'Make sure to approve the connection in Phantom'
      ];
    }

    if (errorCode === 4100 || errorMessage.includes('unauthorized')) {
      return [
        'Pull down to refresh the Phantom app',
        'Try connecting again',
        'If that doesn\'t work, close and reopen Phantom',
        'Make sure SPLITDO is allowed in your Phantom settings'
      ];
    }

    if (errorMessage.includes('timeout')) {
      return [
        'Try connecting again',
        'Respond more quickly in the Phantom app',
        'Make sure Phantom app is responsive'
      ];
    }

    return [
      'Try again in a moment',
      'Refresh the Phantom app if needed',
      'Check your internet connection'
    ];
  }

  /**
   * Record user gesture for validation
   */
  recordUserGesture(): void {
    this.lastUserGestureTime = Date.now();
    logger.debug('User gesture recorded');
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.provider = null;
    this.isConnecting = false;
    logger.debug('iOS Phantom Auth Manager destroyed');
  }
}