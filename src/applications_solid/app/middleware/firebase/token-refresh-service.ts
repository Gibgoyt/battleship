/**
 * Firebase Token Refresh Service
 * Implements 30-minute proactive refresh and 5-minute auth state polling
 * Refresh buffer time set to 30 minutes (refresh tokens when 30min remaining)
 * Uses custom REST API instead of Firebase SDK
 */

import { firebaseTokenStorage } from 'src/lib/auth/firebase-token-storage';
import { createLogger } from 'src/lib/logger';
import { createCustomUserFromStorage, isUserAuthenticated } from './custom-user';
import { refreshTokenViaAPI, RefreshTokenError } from './custom-refresh';
import type {
  TokenRefreshResult,
  AuthPollingResult,
  AuthManagerConfig,
  TimerManager,
  AuthFailureReason,
} from '../types';
import { DEFAULT_AUTH_CONFIG } from '../types';

const logger = createLogger('[Firebase Token Refresh Service]');

export class FirebaseTokenRefreshService {
  private static instance: FirebaseTokenRefreshService;
  private config: AuthManagerConfig;
  private timers: TimerManager;
  private isRunning = false;
  private lastRefreshAttempt = 0;
  private refreshAttempts = 0;
  private pollingAttempts = 0;

  private constructor(config: AuthManagerConfig = DEFAULT_AUTH_CONFIG) {
    this.config = {
      ...config,
      proactiveRefreshInterval: 30 * 60 * 1000, // 30 minutes exactly
      authPollingInterval: 5 * 60 * 1000, // 5 minutes exactly
    };
    this.timers = {
      proactiveRefreshTimer: null,
      authPollingTimer: null,
      cleanupTimer: null,
    };
  }

  static getInstance(config?: AuthManagerConfig): FirebaseTokenRefreshService {
    if (!FirebaseTokenRefreshService.instance) {
      FirebaseTokenRefreshService.instance = new FirebaseTokenRefreshService(config);
    }
    return FirebaseTokenRefreshService.instance;
  }

  /**
   * Start both proactive refresh and auth polling services
   */
  startServices(): void {
    if (this.isRunning) {
      logger.debug('Token refresh services already running');
      return;
    }

    logger.debug('Starting token refresh services', {
      proactiveRefreshIntervalMinutes: this.config.proactiveRefreshInterval / 1000 / 60,
      authPollingIntervalMinutes: this.config.authPollingInterval / 1000 / 60,
    });

    this.startProactiveRefresh();
    this.startAuthPolling();
    this.isRunning = true;

    logger.debug('Token refresh services started successfully');
  }

  /**
   * Start 30-minute proactive token refresh
   */
  startProactiveRefresh(): void {
    if (this.timers.proactiveRefreshTimer) {
      logger.debug('Proactive refresh timer already running');
      return;
    }

    logger.debug('Starting proactive token refresh', {
      intervalSeconds: this.config.proactiveRefreshInterval / 1000,
      intervalMinutes: this.config.proactiveRefreshInterval / 1000 / 60,
    });

    // Immediate first refresh check
    this.performProactiveRefresh();

    // Set up 30-minute interval
    this.timers.proactiveRefreshTimer = setInterval(() => {
      this.performProactiveRefresh();
    }, this.config.proactiveRefreshInterval);

    logger.debug('Proactive refresh timer started');
  }

  /**
   * Start 5-minute authentication state polling
   */
  startAuthPolling(): void {
    if (this.timers.authPollingTimer) {
      logger.debug('Auth polling timer already running');
      return;
    }

    logger.debug('Starting auth state polling', {
      intervalSeconds: this.config.authPollingInterval / 1000,
      intervalMinutes: this.config.authPollingInterval / 1000 / 60,
    });

    // Immediate first poll
    this.performAuthPolling();

    // Set up 5-minute interval
    this.timers.authPollingTimer = setInterval(() => {
      this.performAuthPolling();
    }, this.config.authPollingInterval);

    logger.debug('Auth polling timer started');
  }

  /**
   * Stop all refresh services
   */
  stopServices(): void {
    logger.debug('Stopping all token refresh services');

    if (this.timers.proactiveRefreshTimer) {
      clearInterval(this.timers.proactiveRefreshTimer);
      this.timers.proactiveRefreshTimer = null;
      logger.debug('Proactive refresh timer stopped');
    }

    if (this.timers.authPollingTimer) {
      clearInterval(this.timers.authPollingTimer);
      this.timers.authPollingTimer = null;
      logger.debug('Auth polling timer stopped');
    }

    if (this.timers.cleanupTimer) {
      clearTimeout(this.timers.cleanupTimer);
      this.timers.cleanupTimer = null;
    }

    this.isRunning = false;
    this.refreshAttempts = 0;
    this.pollingAttempts = 0;

    logger.debug('All token refresh services stopped');
  }

  /**
   * Perform proactive token refresh (called every 30 minutes)
   * Enhanced with auth store error notification
   */
  private async performProactiveRefresh(): Promise<void> {
    const startTime = Date.now();
    const correlationId = Math.random().toString(36).substr(2, 9);

    logger.debug('Performing proactive token refresh', {
      correlationId,
      attempt: this.refreshAttempts + 1,
      lastAttempt: this.lastRefreshAttempt ? new Date(this.lastRefreshAttempt).toISOString() : 'never',
    });

    try {
      // Check if user is authenticated using custom implementation
      if (!isUserAuthenticated()) {
        logger.debug('No authenticated user - skipping proactive refresh', { correlationId });
        return;
      }

      // Check current token status
      const tokens = firebaseTokenStorage.getTokens();
      if (!tokens.idToken) {
        logger.debug('No current token - requesting fresh token', { correlationId });
      }

      // Perform refresh
      const result = await this.refreshFirebaseToken();

      if (result.success) {
        logger.info('Proactive refresh successful', {
          correlationId,
          duration: Date.now() - startTime,
          newToken: Boolean(result.newToken),
        });
        this.refreshAttempts = 0; // Reset attempts on success

        // Notify auth store of successful refresh
        this.notifyAuthStoreSuccess();
      } else {
        logger.error('Proactive refresh failed', {
          correlationId,
          error: result.error,
          attempts: this.refreshAttempts,
        });

        // Critical: Notify auth store of failure for user feedback
        this.notifyAuthStoreError(result.error || 'Proactive refresh failed');

        this.handleProactiveRefreshFailure(result);
      }

      this.lastRefreshAttempt = Date.now();
    } catch (error) {
      logger.error('Proactive refresh error:', { correlationId, error: (error as Error).message });

      // Critical: Always notify auth store of errors
      this.notifyAuthStoreError((error as Error).message);

      this.handleProactiveRefreshError(error as Error);
    }
  }

  /**
   * Perform authentication state polling (called every 5 minutes)
   */
  private async performAuthPolling(): Promise<void> {
    const startTime = Date.now();
    logger.debug('Performing auth state polling', {
      attempt: this.pollingAttempts + 1,
    });

    this.pollingAttempts++;

    try {
      const result = await this.validateCurrentAuthState();

      logger.debug('Auth polling result', {
        isValid: result.isValid,
        shouldRefresh: result.shouldRefresh,
        duration: Date.now() - startTime,
        error: result.error,
      });

      if (!result.isValid) {
        logger.warn('Auth state invalid during polling');
        await this.handleInvalidAuthState(result);
      } else if (result.shouldRefresh) {
        logger.debug('Auth polling recommends token refresh');
        await this.refreshFirebaseToken();
      }

      this.pollingAttempts = 0; // Reset on successful poll
    } catch (error) {
      logger.error('Auth polling error:', error);

      // After multiple polling failures, assume auth is broken
      if (this.pollingAttempts >= 3) {
        logger.error('Multiple auth polling failures - treating as auth failure');
        await this.forceSignOut('Repeated polling failures');
      }
    }
  }

  /**
   * Refresh Firebase token
   */
  async refreshFirebaseToken(): Promise<TokenRefreshResult> {
    const startTime = Date.now();
    logger.debug('Starting Firebase token refresh');

    try {
      // Get current user from storage instead of Firebase SDK
      const currentUser = createCustomUserFromStorage();

      if (!currentUser) {
        throw new Error('No authenticated user available for token refresh');
      }

      this.refreshAttempts++;

      // Force token refresh with custom REST API
      logger.debug('Calling custom refresh API for force refresh');
      const newToken = await currentUser.getIdToken(true);

      if (!newToken) {
        throw new Error('Custom refresh API returned empty token');
      }

      // Extract token expiration
      const tokenExpiresAt = this.extractTokenExpiration(newToken);
      if (!tokenExpiresAt) {
        throw new Error('Invalid token - no expiration found');
      }

      // Store the new token
      logger.debug('Storing refreshed token');
      firebaseTokenStorage.storeTokens({
        idToken: newToken,
        refreshToken: currentUser.refreshToken,
        rememberMe: this.getRememberMePreference(),
      });

      // Store refresh timestamp
      localStorage.setItem('firebase-lastRefresh', Date.now().toString());
      localStorage.setItem('firebase-tokenExpiresAt', tokenExpiresAt.toString());

      const duration = Date.now() - startTime;
      logger.debug('Firebase token refresh successful', {
        duration: `${duration}ms`,
        expiresAt: new Date(tokenExpiresAt).toISOString(),
        attempts: this.refreshAttempts,
      });

      this.refreshAttempts = 0; // Reset on success

      return {
        success: true,
        newToken,
        timestamp: Date.now(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Firebase token refresh failed', {
        error: (error as Error).message,
        duration: `${duration}ms`,
        attempts: this.refreshAttempts,
      });

      const result: TokenRefreshResult = {
        success: false,
        error: (error as Error).message,
        timestamp: Date.now(),
      };

      // Check if we should give up
      if (this.refreshAttempts >= this.config.maxRefreshAttempts) {
        logger.error('Max refresh attempts exceeded - forcing sign out');
        await this.forceSignOut('Max refresh attempts exceeded');
        result.retryAfter = 0; // Don't retry
      } else {
        // Schedule retry with exponential backoff
        const retryAfter = Math.min(Math.pow(2, this.refreshAttempts) * 1000, 60000); // Max 1 minute
        result.retryAfter = retryAfter;
        logger.debug(`Will retry refresh in ${retryAfter}ms`);
      }

      return result;
    }
  }

  /**
   * Validate current authentication state
   */
  async validateCurrentAuthState(): Promise<AuthPollingResult> {
    logger.debug('Validating current auth state');

    try {
      // Step 1: Check if custom user exists
      const currentUser = createCustomUserFromStorage();
      if (!currentUser) {
        logger.debug('No custom user found');

        // Check if we have stale tokens
        const tokens = firebaseTokenStorage.getTokens();
        if (tokens.idToken) {
          logger.warn('Custom user missing but tokens exist - stale state');
          return {
            isValid: false,
            shouldRefresh: false,
            error: 'Firebase user missing with existing tokens',
            timestamp: Date.now(),
          };
        }

        return {
          isValid: false,
          shouldRefresh: false,
          timestamp: Date.now(),
        };
      }

      // Step 2: Check stored tokens
      const tokens = firebaseTokenStorage.getTokens();
      if (!tokens.idToken) {
        logger.debug('Firebase user exists but no stored token');
        return {
          isValid: true,
          shouldRefresh: true,
          timestamp: Date.now(),
        };
      }

      // Step 3: Validate token expiration
      const tokenExpiresAt = this.extractTokenExpiration(tokens.idToken);
      if (!tokenExpiresAt) {
        logger.warn('Token exists but invalid format');
        return {
          isValid: false,
          shouldRefresh: true,
          error: 'Invalid token format',
          timestamp: Date.now(),
        };
      }

      const now = Date.now();
      const isExpired = now >= tokenExpiresAt;
      const timeUntilExpiry = tokenExpiresAt - now;

      if (isExpired) {
        logger.debug('Token has expired', {
          expiredAt: new Date(tokenExpiresAt).toISOString(),
          expiredAgo: `${(now - tokenExpiresAt) / 1000}s`,
        });
        return {
          isValid: false,
          shouldRefresh: true,
          error: 'Token expired',
          timestamp: Date.now(),
        };
      }

      // Step 4: Check if refresh needed soon
      const refreshBufferTime = 30 * 60 * 1000; // 30 minutes
      const shouldRefresh = timeUntilExpiry < refreshBufferTime;

      logger.debug('Auth state validation complete', {
        isValid: true,
        shouldRefresh,
        timeUntilExpiryMinutes: timeUntilExpiry / 1000 / 60,
        expiresAt: new Date(tokenExpiresAt).toISOString(),
      });

      return {
        isValid: true,
        shouldRefresh,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error('Auth state validation error:', error);
      return {
        isValid: false,
        shouldRefresh: false,
        error: (error as Error).message,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Enhanced proactive refresh failure handler
   */
  private handleProactiveRefreshFailure(result: TokenRefreshResult): void {
    logger.warn('Handling proactive refresh failure', {
      error: result.error,
      attempts: this.refreshAttempts,
      retryAfter: result.retryAfter,
    });

    if (result.retryAfter && result.retryAfter > 0) {
      // Schedule retry
      this.timers.cleanupTimer = setTimeout(async () => {
        logger.debug('Executing scheduled proactive refresh retry');
        await this.performProactiveRefresh();
      }, result.retryAfter);
    }

    // If we're approaching the max refresh attempts, notify auth store
    if (this.refreshAttempts >= this.config.maxRefreshAttempts - 1) {
      this.notifyAuthStoreError('Proactive refresh nearing failure limit - user may be logged out soon');
    }
  }

  /**
   * Enhanced proactive refresh error handler
   */
  private async handleProactiveRefreshError(error: Error): Promise<void> {
    logger.error('Handling proactive refresh error:', error);

    this.refreshAttempts++;

    if (this.refreshAttempts >= this.config.maxRefreshAttempts) {
      logger.error('Max proactive refresh attempts exceeded due to errors');
      this.notifyAuthStoreError('Proactive token refresh has failed - session will expire soon');
      await this.forceSignOut('Proactive refresh errors exceeded maximum attempts');
    } else {
      // Notify about the error but don't force logout yet
      this.notifyAuthStoreError(`Proactive refresh error (${this.refreshAttempts}/${this.config.maxRefreshAttempts}): ${error.message}`);
    }
  }

  /**
   * Handle refresh failure (legacy method for backward compatibility)
   */
  private handleRefreshFailure(result: TokenRefreshResult): void {
    // Use the enhanced handler
    this.handleProactiveRefreshFailure(result);
  }

  /**
   * Handle refresh error (legacy method for backward compatibility)
   */
  private async handleRefreshError(error: Error): Promise<void> {
    // Use the enhanced handler
    await this.handleProactiveRefreshError(error);
  }

  /**
   * Notify auth store of successful refresh
   */
  private notifyAuthStoreSuccess(): void {
    try {
      // Import auth store dynamically to avoid circular dependencies
      import('./auth-store').then(({ getGlobalAuthStore }) => {
        const authStore = getGlobalAuthStore();
        if (authStore && typeof authStore.clearRefreshError === 'function') {
          // Clear any existing refresh error in the auth store
          authStore.clearRefreshError();
        }
      }).catch(error => {
        logger.warn('Could not notify auth store of refresh success:', error);
      });
    } catch (error) {
      logger.warn('Error notifying auth store of refresh success:', error);
    }
  }

  /**
   * Notify auth store of refresh error
   */
  private notifyAuthStoreError(errorMessage: string): void {
    try {
      // Import auth store dynamically to avoid circular dependencies
      import('./auth-store').then(({ getGlobalAuthStore }) => {
        const authStore = getGlobalAuthStore();
        if (authStore && typeof authStore.setRefreshError === 'function') {
          // Set error state in auth store for user feedback
          authStore.setRefreshError(errorMessage);
        }
      }).catch(error => {
        logger.warn('Could not notify auth store of refresh error:', error);
      });
    } catch (error) {
      logger.warn('Error notifying auth store of refresh error:', error);
    }
  }

  /**
   * Handle invalid auth state from polling
   */
  private async handleInvalidAuthState(result: AuthPollingResult): Promise<void> {
    logger.warn('Handling invalid auth state', {
      error: result.error,
      shouldRefresh: result.shouldRefresh,
    });

    if (result.shouldRefresh) {
      // Try to refresh token
      const refreshResult = await this.refreshFirebaseToken();
      if (!refreshResult.success) {
        logger.error('Failed to recover from invalid auth state');
        await this.forceSignOut('Cannot recover from invalid auth state');
      }
    } else {
      // Auth state is definitely broken
      await this.forceSignOut('Invalid auth state detected');
    }
  }

  /**
   * Force sign out due to unrecoverable auth failure
   */
  private async forceSignOut(reason: string): Promise<void> {
    logger.error(`Forcing sign out: ${reason}`);

    try {
      // Clear all auth data first
      firebaseTokenStorage.clearTokens();
      localStorage.removeItem('firebase-lastRefresh');
      localStorage.removeItem('firebase-tokenExpiresAt');

      // Stop all services
      this.stopServices();

      // Force browser redirect (NOT SolidJS router)
      logger.debug('Redirecting to sign-in via browser API');
      window.location.href = '/auth/sign-in';
    } catch (error) {
      logger.error('Error during force sign out:', error);

      // Fallback: try direct redirect anyway
      window.location.href = '/auth/sign-in';
    }
  }

  /**
   * Extract token expiration from JWT
   */
  private extractTokenExpiration(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;

      if (typeof exp === 'number' && exp > 0) {
        return exp * 1000; // Convert to milliseconds
      }

      return null;
    } catch (error) {
      logger.error('Failed to extract token expiration:', error);
      return null;
    }
  }

  /**
   * Get remember me preference from storage
   */
  private getRememberMePreference(): boolean {
    try {
      const tokens = firebaseTokenStorage.getTokens();
      return tokens.rememberMe ?? false;
    } catch {
      return false;
    }
  }

  // Public getters for external monitoring
  isServiceRunning(): boolean {
    return this.isRunning;
  }

  getRefreshAttempts(): number {
    return this.refreshAttempts;
  }

  getPollingAttempts(): number {
    return this.pollingAttempts;
  }

  getLastRefreshAttempt(): number {
    return this.lastRefreshAttempt;
  }

  getServiceStatus(): {
    isRunning: boolean;
    hasProactiveRefresh: boolean;
    hasAuthPolling: boolean;
    refreshAttempts: number;
    pollingAttempts: number;
    lastRefreshAttempt: number | null;
  } {
    return {
      isRunning: this.isRunning,
      hasProactiveRefresh: this.timers.proactiveRefreshTimer !== null,
      hasAuthPolling: this.timers.authPollingTimer !== null,
      refreshAttempts: this.refreshAttempts,
      pollingAttempts: this.pollingAttempts,
      lastRefreshAttempt: this.lastRefreshAttempt || null,
    };
  }

  /**
   * Manual refresh trigger for external use
   */
  async triggerManualRefresh(): Promise<TokenRefreshResult> {
    logger.debug('Manual refresh triggered');
    return await this.refreshFirebaseToken();
  }

  /**
   * Manual auth validation trigger for external use
   */
  async triggerManualValidation(): Promise<AuthPollingResult> {
    logger.debug('Manual validation triggered');
    return await this.validateCurrentAuthState();
  }
}