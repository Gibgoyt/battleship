/**
 * Firebase Auth Manager
 * Core authentication state management with custom Firebase implementation
 * Replaced Firebase SDK with custom REST API calls
 */

import { firebaseTokenStorage, type FirebaseTokenData } from 'src/lib/auth/firebase-token-storage';
import { createLogger } from 'src/lib/logger';
import {
  createCustomUserFromStorage,
  createCustomUserFromTokens,
  isUserAuthenticated,
  type CustomFirebaseUser
} from './custom-user';
import { refreshTokenViaAPI, RefreshTokenError } from './custom-refresh';
import type {
  AuthState,
  AuthService,
  AuthManagerConfig,
  TokenRefreshResult,
  AuthPollingResult,
  TimerManager,
  AuthFailureReason,
} from '../types';
import { DEFAULT_AUTH_CONFIG, STORAGE_KEYS } from '../types';

const logger = createLogger('[Firebase Auth Manager]');

export class FirebaseAuthManager implements AuthService {
  private static instance: FirebaseAuthManager;
  private config: AuthManagerConfig;
  private authState: AuthState;
  private timers: TimerManager;
  private unsubscribeAuth: (() => void) | null = null;
  private storageEventListener: ((event: StorageEvent) => void) | null = null;
  private isInitialized = false;

  private constructor(config: AuthManagerConfig = DEFAULT_AUTH_CONFIG) {
    this.config = config;
    this.authState = {
      isAuthenticated: false,
      user: null,
      tokenExpiresAt: null,
      lastRefreshAt: null,
      nextRefreshAt: null,
      refreshAttempts: 0,
    };
    this.timers = {
      proactiveRefreshTimer: null,
      authPollingTimer: null,
      cleanupTimer: null,
    };
  }

  static getInstance(config?: AuthManagerConfig): FirebaseAuthManager {
    if (!FirebaseAuthManager.instance) {
      FirebaseAuthManager.instance = new FirebaseAuthManager(config);
    }
    return FirebaseAuthManager.instance;
  }

  /**
   * Initialize the Firebase auth manager with optional initial token
   */
  async initialize(initialToken?: string): Promise<void> {
    if (this.isInitialized) {
      logger.debug('Auth manager already initialized');
      return;
    }

    try {
      logger.debug('Initializing Firebase Auth Manager', {
        hasInitialToken: Boolean(initialToken),
        config: this.config,
      });

      // Setup Firebase auth state listener
      this.setupAuthStateListener();

      // Setup storage event listener for multi-tab coordination
      this.setupStorageEventListener();

      // Handle initial token if provided
      if (initialToken) {
        await this.handleInitialToken(initialToken);
      }

      // Validate current auth state
      await this.validateInitialAuthState();

      this.isInitialized = true;
      logger.debug('Firebase Auth Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Firebase Auth Manager:', error);
      throw error;
    }
  }

  /**
   * Setup custom auth state monitoring (replaces Firebase onAuthStateChanged)
   * Uses polling instead of Firebase listener since we use custom implementation
   */
  private setupAuthStateListener(): void {
    logger.debug('Setting up custom auth state monitoring');

    // Note: Firebase onAuthStateChanged removed - we rely on polling instead
    // The token refresh service already has 5-minute auth polling that handles state changes
    // This approach is more reliable for custom token management

    // Check initial auth state immediately
    this.checkInitialAuthState();

    logger.debug('Custom auth state monitoring setup complete (using polling)');
  }

  /**
   * Check initial authentication state from stored tokens
   */
  private checkInitialAuthState(): void {
    try {
      const user = createCustomUserFromStorage();

      if (user) {
        logger.debug('Found authenticated user in storage', {
          userId: user.uid,
          email: user.email
        });
        this.handleUserAuthenticated(user);
      } else {
        logger.debug('No authenticated user found in storage');
        this.handleUserUnauthenticated();
      }
    } catch (error) {
      logger.error('Error checking initial auth state', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.handleUserUnauthenticated();
    }
  }

  /**
   * Setup storage event listener for multi-tab coordination
   */
  private setupStorageEventListener(): void {
    this.storageEventListener = (event: StorageEvent) => {
      // Only handle Firebase-related storage changes
      if (event.key?.startsWith('firebase-')) {
        logger.debug('Storage event detected', {
          key: event.key,
          newValue: Boolean(event.newValue),
          oldValue: Boolean(event.oldValue),
          newValueLength: event.newValue?.length || 0,
          storageType: event.storageArea === localStorage ? 'localStorage' : 'sessionStorage',
        });

        // Handle token changes from other tabs
        if (event.key === STORAGE_KEYS.ID_TOKEN || event.key === 'firebase-idToken') {
          if (event.newValue) {
            logger.debug('Token updated in another tab - syncing auth state');
            this.syncAuthStateFromStorage();
          } else {
            logger.debug('Token cleared in another tab - triggering logout');
            this.handleTokenClearedInOtherTab();
          }
        }

        // Handle refresh token changes
        if (event.key === STORAGE_KEYS.REFRESH_TOKEN || event.key === 'firebase-refreshToken') {
          if (event.newValue) {
            logger.debug('Refresh token updated in another tab');
          } else {
            logger.debug('Refresh token cleared in another tab - may need to logout');
            // Check if we still have an ID token, if not, logout
            setTimeout(() => {
              const tokens = firebaseTokenStorage.getTokens();
              if (!tokens.idToken) {
                logger.debug('No ID token after refresh token cleared - logging out');
                this.handleTokenClearedInOtherTab();
              }
            }, 100); // Small delay to ensure storage has settled
          }
        }

        // Handle token expiration updates
        if (event.key === 'firebase-tokenExpiresAt' && event.newValue) {
          logger.debug('Token expiration updated in another tab - revalidating');
          this.syncAuthStateFromStorage();
        }
      }
    };

    window.addEventListener('storage', this.storageEventListener);
    logger.debug('Enhanced storage event listener setup complete');
  }

  /**
   * Handle initial token from Astro prop
   */
  private async handleInitialToken(initialToken: string): Promise<void> {
    logger.debug('Processing initial token from Astro');

    try {
      // Store the initial token
      firebaseTokenStorage.storeTokens({
        idToken: initialToken,
        rememberMe: this.getRememberMePreference(),
      });

      // Update auth state with token info
      const tokenExpiresAt = this.extractTokenExpiration(initialToken);
      this.updateAuthState({
        tokenExpiresAt,
        lastRefreshAt: Date.now(),
      });

      logger.debug('Initial token processed successfully', {
        expiresAt: tokenExpiresAt ? new Date(tokenExpiresAt).toISOString() : null,
      });
    } catch (error) {
      logger.error('Failed to process initial token:', error);
    }
  }

  /**
   * Validate initial authentication state
   */
  private async validateInitialAuthState(): Promise<void> {
    logger.debug('Validating initial auth state with enhanced storage validation');

    // Enhanced storage validation - check both firebaseTokenStorage and direct storage access
    const tokens = firebaseTokenStorage.getTokens();

    // Direct storage validation as fallback
    const directStorageValidation = {
      sessionStorageIdToken: sessionStorage.getItem('firebase-idToken'),
      localStorageIdToken: localStorage.getItem('firebase-idToken'),
      sessionStorageRefreshToken: sessionStorage.getItem('firebase-refreshToken'),
      localStorageRefreshToken: localStorage.getItem('firebase-refreshToken'),
    };

    logger.debug('Storage validation results', {
      firebaseTokenStorageHasIdToken: Boolean(tokens.idToken),
      firebaseTokenStorageHasRefreshToken: Boolean(tokens.refreshToken),
      directStorageHasSessionIdToken: Boolean(directStorageValidation.sessionStorageIdToken),
      directStorageHasLocalIdToken: Boolean(directStorageValidation.localStorageIdToken),
      directStorageHasSessionRefreshToken: Boolean(directStorageValidation.sessionStorageRefreshToken),
      directStorageHasLocalRefreshToken: Boolean(directStorageValidation.localStorageRefreshToken),
    });

    // Use fallback token if firebaseTokenStorage fails but direct storage succeeds
    let effectiveToken = tokens.idToken;
    if (!effectiveToken && (directStorageValidation.sessionStorageIdToken || directStorageValidation.localStorageIdToken)) {
      effectiveToken = directStorageValidation.sessionStorageIdToken || directStorageValidation.localStorageIdToken;
      logger.warn('firebaseTokenStorage.getTokens() failed but direct storage has token - using fallback', {
        tokenLength: effectiveToken?.length,
        source: directStorageValidation.sessionStorageIdToken ? 'sessionStorage' : 'localStorage'
      });

      // Store the token back in firebaseTokenStorage to sync the systems
      if (effectiveToken) {
        const refreshToken = directStorageValidation.sessionStorageRefreshToken || directStorageValidation.localStorageRefreshToken;
        firebaseTokenStorage.storeTokens({
          idToken: effectiveToken,
          refreshToken: refreshToken || undefined,
          rememberMe: Boolean(directStorageValidation.localStorageIdToken), // Prefer localStorage if found there
        });
        logger.debug('Synchronized tokens back to firebaseTokenStorage');
      }
    }

    if (effectiveToken) {
      const tokenExpiresAt = this.extractTokenExpiration(effectiveToken);
      const isExpired = tokenExpiresAt ? Date.now() > tokenExpiresAt : true;

      logger.debug('Token validation result', {
        hasToken: Boolean(effectiveToken),
        tokenLength: effectiveToken.length,
        tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt).toISOString() : 'unknown',
        isExpired,
        timeUntilExpiryMinutes: tokenExpiresAt ? Math.round((tokenExpiresAt - Date.now()) / 1000 / 60) : 'unknown',
      });

      if (isExpired) {
        logger.debug('Initial token is expired, attempting refresh');
        await this.refreshToken();
      } else {
        logger.debug('Initial token is valid, updating auth state');
        this.updateAuthState({
          isAuthenticated: true,
          tokenExpiresAt,
        });
      }
    } else {
      logger.debug('No initial tokens found in firebaseTokenStorage or direct storage');
    }
  }

  /**
   * Handle user authenticated event from Firebase
   */
  private async handleUserAuthenticated(user: CustomFirebaseUser): Promise<void> {
    logger.debug('Handling user authenticated', { userId: user.uid });

    try {
      // Get current ID token (no forced refresh here)
      const idToken = await user.getIdToken(false);
      const tokenExpiresAt = this.extractTokenExpiration(idToken);

      // Update storage with current tokens
      firebaseTokenStorage.storeTokens({
        idToken,
        refreshToken: user.refreshToken,
        rememberMe: this.getRememberMePreference(),
      });

      // Update auth state
      this.updateAuthState({
        isAuthenticated: true,
        user,
        tokenExpiresAt,
        lastRefreshAt: Date.now(),
        refreshAttempts: 0,
      });

      // Schedule next refresh
      this.scheduleNextRefresh(tokenExpiresAt);

      logger.debug('User authentication handled successfully');
    } catch (error) {
      logger.error('Failed to handle user authentication:', error);
      await this.handleAuthFailure('FIREBASE_ERROR', error as Error);
    }
  }

  /**
   * Handle user unauthenticated event from Firebase
   */
  private handleUserUnauthenticated(): void {
    logger.debug('Handling user unauthenticated');

    // Update auth state
    this.updateAuthState({
      isAuthenticated: false,
      user: null,
      tokenExpiresAt: null,
      lastRefreshAt: null,
      nextRefreshAt: null,
      refreshAttempts: 0,
    });

    // Clear stored tokens
    firebaseTokenStorage.clearTokens();

    // Stop all timers
    this.stopAllServices();

    logger.debug('User unauthentication handled successfully');
  }

  /**
   * Start proactive token refresh service
   */
  startProactiveRefresh(): void {
    if (this.timers.proactiveRefreshTimer) {
      logger.debug('Proactive refresh already running');
      return;
    }

    logger.debug('Starting proactive token refresh', {
      intervalMinutes: this.config.proactiveRefreshInterval / 1000 / 60,
    });

    this.timers.proactiveRefreshTimer = setInterval(async () => {
      logger.debug('Proactive refresh timer triggered');

      if (this.authState.isAuthenticated) {
        await this.refreshToken();
      } else {
        logger.debug('User not authenticated, skipping proactive refresh');
      }
    }, this.config.proactiveRefreshInterval);
  }

  /**
   * Start authentication polling service
   */
  startAuthPolling(): void {
    if (this.timers.authPollingTimer) {
      logger.debug('Auth polling already running');
      return;
    }

    logger.debug('Starting auth state polling', {
      intervalMinutes: this.config.authPollingInterval / 1000 / 60,
    });

    this.timers.authPollingTimer = setInterval(async () => {
      logger.debug('Auth polling timer triggered');
      await this.validateAuthState();
    }, this.config.authPollingInterval);
  }

  /**
   * Stop all running services
   */
  stopAllServices(): void {
    logger.debug('Stopping all auth services');

    if (this.timers.proactiveRefreshTimer) {
      clearInterval(this.timers.proactiveRefreshTimer);
      this.timers.proactiveRefreshTimer = null;
    }

    if (this.timers.authPollingTimer) {
      clearInterval(this.timers.authPollingTimer);
      this.timers.authPollingTimer = null;
    }

    if (this.timers.cleanupTimer) {
      clearTimeout(this.timers.cleanupTimer);
      this.timers.cleanupTimer = null;
    }

    logger.debug('All auth services stopped');
  }

  /**
   * Refresh Firebase token
   */
  async refreshToken(): Promise<TokenRefreshResult> {
    const startTime = Date.now();
    logger.debug('Starting token refresh', {
      attempts: this.authState.refreshAttempts,
      maxAttempts: this.config.maxRefreshAttempts,
    });

    try {
      // Get current user from storage instead of Firebase SDK
      const currentUser = createCustomUserFromStorage();

      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Increment refresh attempts
      this.updateAuthState({
        refreshAttempts: this.authState.refreshAttempts + 1,
      });

      // Force token refresh using custom REST API
      const newToken = await currentUser.getIdToken(true);
      const tokenExpiresAt = this.extractTokenExpiration(newToken);

      // Update storage (note: refresh token may have rotated)
      firebaseTokenStorage.storeTokens({
        idToken: newToken,
        refreshToken: currentUser.refreshToken,
        rememberMe: this.getRememberMePreference(),
      });

      // Update auth state
      this.updateAuthState({
        tokenExpiresAt,
        lastRefreshAt: Date.now(),
        refreshAttempts: 0,
      });

      // Schedule next refresh
      this.scheduleNextRefresh(tokenExpiresAt);

      const duration = Date.now() - startTime;
      logger.debug('Token refresh successful', {
        duration: `${duration}ms`,
        newExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt).toISOString() : null,
      });

      return {
        success: true,
        newToken,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error('Token refresh failed:', error);

      const result: TokenRefreshResult = {
        success: false,
        error: (error as Error).message,
        timestamp: Date.now(),
      };

      // Handle max retry attempts
      if (this.authState.refreshAttempts >= this.config.maxRefreshAttempts) {
        logger.error('Max refresh attempts reached, forcing logout');
        await this.handleAuthFailure('REFRESH_FAILED', error as Error);
        result.retryAfter = 0; // No retry - force logout
      } else {
        // Schedule retry with exponential backoff
        const retryAfter = Math.pow(2, this.authState.refreshAttempts) * 1000;
        result.retryAfter = retryAfter;

        this.scheduleRefreshRetry(retryAfter);
      }

      return result;
    }
  }

  /**
   * Validate current authentication state
   */
  async validateAuthState(): Promise<AuthPollingResult> {
    logger.debug('Validating auth state');

    try {
      const tokens = firebaseTokenStorage.getTokens();

      // Check if user is authenticated with custom implementation
      const currentUser = createCustomUserFromStorage();

      // Check if custom user exists
      if (!currentUser) {
        if (tokens.idToken) {
          logger.debug('Custom user lost but tokens exist - clearing stale data');
          await this.handleAuthFailure('TOKEN_EXPIRED');
        }
        return {
          isValid: false,
          shouldRefresh: false,
          timestamp: Date.now(),
        };
      }

      // Check token expiration
      if (tokens.idToken) {
        const tokenExpiresAt = this.extractTokenExpiration(tokens.idToken);
        const isExpired = tokenExpiresAt ? Date.now() > tokenExpiresAt : true;

        if (isExpired) {
          logger.debug('Token expired during validation');
          return {
            isValid: false,
            shouldRefresh: true,
            timestamp: Date.now(),
          };
        }

        // Check if refresh needed soon
        const shouldRefresh = tokenExpiresAt ?
          (tokenExpiresAt - Date.now()) < this.config.refreshBufferTime :
          true;

        logger.debug('Auth state validation complete', {
          isValid: true,
          shouldRefresh,
          expiresAt: tokenExpiresAt ? new Date(tokenExpiresAt).toISOString() : null,
        });

        return {
          isValid: true,
          shouldRefresh,
          timestamp: Date.now(),
        };
      }

      // No tokens but Firebase user exists - get fresh token
      logger.debug('Firebase user exists but no tokens - getting fresh token');
      await this.refreshToken();

      return {
        isValid: true,
        shouldRefresh: false,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error('Auth state validation failed:', error);

      return {
        isValid: false,
        shouldRefresh: false,
        error: (error as Error).message,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Logout user and clear all data
   */
  async logout(): Promise<void> {
    logger.debug('Starting logout process');

    try {
      // Custom logout - clear all tokens (no Firebase SDK needed)
      // Note: Could call custom logout REST API here if backend requires it
      firebaseTokenStorage.clearTokens();

      // Stop all services
      this.stopAllServices();

      // Update auth state
      this.updateAuthState({
        isAuthenticated: false,
        user: null,
        tokenExpiresAt: null,
        lastRefreshAt: null,
        nextRefreshAt: null,
        refreshAttempts: 0,
      });

      logger.debug('Logout completed successfully');
    } catch (error) {
      logger.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup all resources
   */
  cleanup(): void {
    logger.debug('Cleaning up Firebase Auth Manager');

    // Note: No Firebase auth state listener to unsubscribe from
    // We use polling-based auth state monitoring instead
    this.unsubscribeAuth = null;

    // Remove storage event listener
    if (this.storageEventListener) {
      window.removeEventListener('storage', this.storageEventListener);
      this.storageEventListener = null;
    }

    // Stop all timers
    this.stopAllServices();

    this.isInitialized = false;
    logger.debug('Firebase Auth Manager cleanup complete');
  }

  // Private helper methods
  private updateAuthState(updates: Partial<AuthState>): void {
    this.authState = { ...this.authState, ...updates };

    // Update next refresh time if we have a token expiration
    if (updates.tokenExpiresAt) {
      const nextRefreshAt = updates.tokenExpiresAt - this.config.refreshBufferTime;
      this.authState.nextRefreshAt = nextRefreshAt;
    }
  }

  private extractTokenExpiration(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch {
      return null;
    }
  }

  private getRememberMePreference(): boolean {
    const tokens = firebaseTokenStorage.getTokens();
    return tokens.rememberMe ?? false;
  }

  private scheduleNextRefresh(tokenExpiresAt: number | null): void {
    if (!tokenExpiresAt) return;

    const refreshTime = tokenExpiresAt - this.config.refreshBufferTime;
    const delay = Math.max(0, refreshTime - Date.now());

    if (delay > 0) {
      logger.debug('Scheduling next refresh', {
        refreshAt: new Date(refreshTime).toISOString(),
        delayMinutes: delay / 1000 / 60,
      });

      this.timers.cleanupTimer = setTimeout(async () => {
        logger.debug('Scheduled refresh triggered');
        await this.refreshToken();
      }, delay);
    }
  }

  private scheduleRefreshRetry(delay: number): void {
    logger.debug('Scheduling refresh retry', { delayMs: delay });

    this.timers.cleanupTimer = setTimeout(async () => {
      logger.debug('Refresh retry triggered');
      await this.refreshToken();
    }, delay);
  }

  private async handleAuthFailure(reason: AuthFailureReason, originalError?: Error): Promise<void> {
    logger.error(`Auth failure: ${reason}`, originalError);

    // Clear all auth data
    firebaseTokenStorage.clearTokens();

    // Stop all services
    this.stopAllServices();

    // Update auth state
    this.updateAuthState({
      isAuthenticated: false,
      user: null,
      tokenExpiresAt: null,
      lastRefreshAt: null,
      nextRefreshAt: null,
      refreshAttempts: 0,
    });

    // Force browser redirect (NOT SolidJS router)
    logger.debug('Redirecting to sign-in via browser');
    window.location.href = '/auth/sign-in';
  }

  private async syncAuthStateFromStorage(): Promise<void> {
    logger.debug('Syncing auth state from storage with enhanced validation');

    // Get tokens with fallback validation
    const tokens = firebaseTokenStorage.getTokens();

    // Additional direct storage check as fallback
    const directStorageToken = sessionStorage.getItem('firebase-idToken') || localStorage.getItem('firebase-idToken');

    logger.debug('Cross-tab sync validation', {
      firebaseTokenStorageHasToken: Boolean(tokens.idToken),
      directStorageHasToken: Boolean(directStorageToken),
      tokenLengthMatch: tokens.idToken?.length === directStorageToken?.length,
    });

    // Use fallback if storage systems are out of sync
    const effectiveToken = tokens.idToken || directStorageToken;

    if (effectiveToken) {
      const tokenExpiresAt = this.extractTokenExpiration(effectiveToken);
      const isExpired = tokenExpiresAt ? Date.now() > tokenExpiresAt : true;

      logger.debug('Cross-tab sync token validation', {
        hasToken: Boolean(effectiveToken),
        tokenLength: effectiveToken.length,
        isExpired,
        tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt).toISOString() : 'unknown',
      });

      if (!isExpired) {
        this.updateAuthState({
          isAuthenticated: true,
          tokenExpiresAt,
          lastRefreshAt: Date.now(),
        });

        // If we had to use fallback token, sync back to firebaseTokenStorage
        if (!tokens.idToken && directStorageToken) {
          logger.debug('Syncing fallback token back to firebaseTokenStorage for consistency');
          const refreshToken = sessionStorage.getItem('firebase-refreshToken') || localStorage.getItem('firebase-refreshToken');
          firebaseTokenStorage.storeTokens({
            idToken: directStorageToken,
            refreshToken: refreshToken || undefined,
            rememberMe: Boolean(localStorage.getItem('firebase-idToken')),
          });
        }
      } else {
        logger.debug('Token in cross-tab sync is expired - handling as unauthenticated');
        this.handleUserUnauthenticated();
      }
    } else {
      logger.debug('No token found in cross-tab sync - handling as unauthenticated');
      this.handleUserUnauthenticated();
    }
  }

  private handleTokenClearedInOtherTab(): void {
    logger.debug('Token cleared in another tab - logging out');
    this.handleUserUnauthenticated();
  }

  // Getter methods for external access
  getAuthState(): Readonly<AuthState> {
    return { ...this.authState };
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  getCurrentUser(): User | null {
    return this.authState.user;
  }

  getTokenExpirationTime(): number | null {
    return this.authState.tokenExpiresAt;
  }

  getLastRefreshTime(): number | null {
    return this.authState.lastRefreshAt;
  }

  getNextRefreshTime(): number | null {
    return this.authState.nextRefreshAt;
  }
}