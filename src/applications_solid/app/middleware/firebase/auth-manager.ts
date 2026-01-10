/**
 * Firebase Auth Manager
 * Core authentication state management with Firebase SDK integration
 */

import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from 'src/lib/firebase/firebase';
import { firebaseTokenStorage, type FirebaseTokenData } from 'src/lib/auth/firebase-token-storage';
import { createLogger } from 'src/lib/logger';
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
   * Setup Firebase auth state change listener
   */
  private setupAuthStateListener(): void {
    logger.debug('Setting up Firebase auth state listener');

    this.unsubscribeAuth = onAuthStateChanged(auth, async (user: User | null) => {
      logger.debug('Firebase auth state changed', {
        hasUser: Boolean(user),
        userId: user?.uid,
      });

      if (user) {
        await this.handleUserAuthenticated(user);
      } else {
        this.handleUserUnauthenticated();
      }
    });
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
        });

        // Handle token changes from other tabs
        if (event.key === STORAGE_KEYS.ID_TOKEN) {
          if (event.newValue) {
            logger.debug('Token updated in another tab');
            this.syncAuthStateFromStorage();
          } else {
            logger.debug('Token cleared in another tab');
            this.handleTokenClearedInOtherTab();
          }
        }
      }
    };

    window.addEventListener('storage', this.storageEventListener);
    logger.debug('Storage event listener setup complete');
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
    logger.debug('Validating initial auth state');

    // Check if we have stored tokens
    const tokens = firebaseTokenStorage.getTokens();

    if (tokens.idToken) {
      const tokenExpiresAt = this.extractTokenExpiration(tokens.idToken);
      const isExpired = tokenExpiresAt ? Date.now() > tokenExpiresAt : true;

      if (isExpired) {
        logger.debug('Initial token is expired, attempting refresh');
        await this.refreshToken();
      } else {
        logger.debug('Initial token is valid');
        this.updateAuthState({
          isAuthenticated: true,
          tokenExpiresAt,
        });
      }
    } else {
      logger.debug('No initial tokens found');
    }
  }

  /**
   * Handle user authenticated event from Firebase
   */
  private async handleUserAuthenticated(user: User): Promise<void> {
    logger.debug('Handling user authenticated', { userId: user.uid });

    try {
      // Get fresh ID token
      const idToken = await user.getIdToken();
      const tokenExpiresAt = this.extractTokenExpiration(idToken);

      // Update storage
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
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Increment refresh attempts
      this.updateAuthState({
        refreshAttempts: this.authState.refreshAttempts + 1,
      });

      // Force token refresh
      const newToken = await currentUser.getIdToken(true);
      const tokenExpiresAt = this.extractTokenExpiration(newToken);

      // Update storage
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
      const currentUser = auth.currentUser;
      const tokens = firebaseTokenStorage.getTokens();

      // Check if Firebase user exists
      if (!currentUser) {
        if (tokens.idToken) {
          logger.debug('Firebase user lost but tokens exist - clearing stale data');
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
      // Sign out from Firebase
      await signOut(auth);

      // Clear all tokens
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

    // Unsubscribe from Firebase auth state changes
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
      this.unsubscribeAuth = null;
    }

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
    logger.debug('Syncing auth state from storage');

    const tokens = firebaseTokenStorage.getTokens();

    if (tokens.idToken) {
      const tokenExpiresAt = this.extractTokenExpiration(tokens.idToken);
      this.updateAuthState({
        isAuthenticated: true,
        tokenExpiresAt,
        lastRefreshAt: Date.now(),
      });
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