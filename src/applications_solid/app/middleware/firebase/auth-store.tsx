/**
 * SolidJS Firebase Auth Store
 * Reactive signals for authentication state management
 */

import { createSignal, createEffect, onCleanup, type Accessor, type Setter } from 'solid-js';
import type { CustomFirebaseUser } from './custom-user';
import { FirebaseAuthManager } from './auth-manager';
import { FirebaseTokenRefreshService } from './token-refresh-service';
import { createLogger } from 'src/lib/logger';
import type {
  AuthState,
  AuthStore,
  TokenRefreshResult,
  AuthPollingResult,
  ServiceHealth,
  DirectRefreshResult,
  SessionExpiryNotification,
} from '../types';

const logger = createLogger('[Firebase Auth Store]');

// Global reactive signals for auth state
const [authState, setAuthState] = createSignal<AuthState>({
  isAuthenticated: false,
  user: null,
  tokenExpiresAt: null,
  lastRefreshAt: null,
  nextRefreshAt: null,
  refreshAttempts: 0,
});

const [authError, setAuthError] = createSignal<string | null>(null);
const [tokenStatus, setTokenStatus] = createSignal<'valid' | 'refreshing' | 'expired' | 'error'>('valid');
const [refreshStatus, setRefreshStatus] = createSignal<'idle' | 'refreshing' | 'success' | 'error'>('idle');
const [pollingStatus, setPollingStatus] = createSignal<'idle' | 'polling' | 'success' | 'error'>('idle');
const [isLoading, setIsLoading] = createSignal(true);

// Service status signals
const [serviceStatus, setServiceStatus] = createSignal({
  isRunning: false,
  hasProactiveRefresh: false,
  hasAuthPolling: false,
  refreshAttempts: 0,
  pollingAttempts: 0,
  lastRefreshAttempt: null as number | null,
});

// Error state signal
const [lastError, setLastError] = createSignal<{
  type: 'refresh' | 'polling' | 'auth';
  message: string;
  timestamp: number;
} | null>(null);

// Global rate limiting signals
const [rateLimitActive, setRateLimitActive] = createSignal(false);
const [rateLimitEndTime, setRateLimitEndTime] = createSignal(0);
const [rateLimitReason, setRateLimitReason] = createSignal<string | null>(null);

// Service health monitoring signal
const [serviceHealth, setServiceHealth] = createSignal<ServiceHealth>({
  isHealthy: true,
  lastCheck: Date.now(),
  consecutiveFailures: 0,
  issues: []
});

// Session expiry notification signal
const [sessionExpiryNotification, setSessionExpiryNotification] = createSignal<SessionExpiryNotification>({
  isVisible: false,
  countdown: 5,
  message: 'Session expired, please relog in',
  onRedirect: () => {
    window.location.href = '/auth/sign-in';
  },
  onDismiss: () => {
    setSessionExpiryNotification(prev => ({ ...prev, isVisible: false }));
  }
});

/**
 * Create Firebase Auth Store
 * Returns reactive auth store with signals and methods
 */
export function createFirebaseAuthStore(): AuthStore {
  let authManager: FirebaseAuthManager | null = null;
  let tokenRefreshService: FirebaseTokenRefreshService | null = null;
  let updateInterval: number | null = null;

  // Initialize services
  const initialize = async (initialToken?: string) => {
    try {
      logger.info('🚀 STARTING Firebase Auth Store initialization', {
        hasInitialToken: Boolean(initialToken),
        tokenPreview: initialToken ? `${initialToken.substring(0, 20)}...` : 'none'
      });

      setIsLoading(true);
      setAuthError(null);

      logger.debug('📋 Step 1: Getting service instances...');

      // Get service instances
      authManager = FirebaseAuthManager.getInstance();
      logger.debug('✅ AuthManager instance obtained', { hasAuthManager: !!authManager });

      tokenRefreshService = FirebaseTokenRefreshService.getInstance();
      logger.debug('✅ TokenRefreshService instance obtained', {
        hasTokenRefreshService: !!tokenRefreshService,
        serviceType: tokenRefreshService?.constructor?.name || 'unknown'
      });

      logger.debug('📋 Step 2: Initializing auth manager...');
      await authManager.initialize(initialToken);
      logger.debug('✅ Auth manager initialized successfully');

      logger.debug('📋 Step 3: Starting refresh services...');
      tokenRefreshService.startServices();
      logger.debug('✅ Refresh services started');

      logger.debug('📋 Step 4: Starting periodic state updates...');
      startPeriodicUpdates();
      logger.debug('✅ Periodic updates started');

      logger.debug('📋 Step 5: Running initial state update...');
      await updateAuthState();
      logger.debug('✅ Initial state update completed');

      setIsLoading(false);
      logger.info('🎉 Firebase Auth Store initialized successfully', {
        hasAuthManager: !!authManager,
        hasTokenRefreshService: !!tokenRefreshService
      });
    } catch (error) {
      logger.error('❌ Failed to initialize Firebase Auth Store:', error);
      logger.error('💥 Initialization failure details:', {
        errorMessage: (error as Error).message,
        errorStack: (error as Error).stack,
        hasAuthManager: !!authManager,
        hasTokenRefreshService: !!tokenRefreshService
      });
      setAuthError((error as Error).message);
      setIsLoading(false);
      throw error;
    }
  };

  // Update auth state from services
  const updateAuthState = async () => {
    if (!authManager || !tokenRefreshService) return;

    try {
      // Get current auth state
      const currentAuthState = authManager.getAuthState();
      setAuthState(currentAuthState);

      // Update service status
      const currentServiceStatus = tokenRefreshService.getServiceStatus();
      setServiceStatus(currentServiceStatus);

      // Determine token status
      const now = Date.now();
      if (currentAuthState.tokenExpiresAt) {
        const timeUntilExpiry = currentAuthState.tokenExpiresAt - now;

        if (timeUntilExpiry < 0) {
          setTokenStatus('expired');
        } else if (timeUntilExpiry < 30 * 60 * 1000) { // Less than 30 minutes
          setTokenStatus('refreshing');
        } else {
          setTokenStatus('valid');
        }
      } else if (currentAuthState.isAuthenticated) {
        setTokenStatus('valid');
      } else {
        setTokenStatus('expired');
      }

      // Clear errors if auth is valid
      if (currentAuthState.isAuthenticated && !authError()) {
        setAuthError(null);
        setLastError(null);
      }
    } catch (error) {
      logger.error('Failed to update auth state:', error);
      setAuthError((error as Error).message);
    }
  };

  // Start periodic state updates
  const startPeriodicUpdates = () => {
    if (updateInterval) return;

    // Update every 30 seconds to keep UI fresh
    updateInterval = setInterval(updateAuthState, 30000);
    logger.debug('Started periodic auth state updates');
  };

  // Stop periodic updates
  const stopPeriodicUpdates = () => {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
      logger.debug('Stopped periodic auth state updates');
    }
  };

  // Enhanced token refresh with fallback mechanism
  const refreshToken = async (): Promise<void> => {
    const correlationId = Math.random().toString(36).substr(2, 9);

    logger.debug('Manual token refresh triggered', { correlationId });
    setRefreshStatus('refreshing');
    setAuthError(null);

    try {
      // First, try the service-based approach if available
      if (tokenRefreshService && await isServiceRunning()) {
        try {
          logger.debug('Attempting service-based token refresh', { correlationId });

          const result: TokenRefreshResult = await tokenRefreshService.triggerManualRefresh();

          if (result.success) {
            setRefreshStatus('success');
            await updateAuthState();
            logger.info('Service-based token refresh successful', { correlationId });

            // Clear success status after 2 seconds
            setTimeout(() => {
              if (refreshStatus() === 'success') {
                setRefreshStatus('idle');
              }
            }, 2000);
            return;
          } else {
            logger.warn('Service-based refresh failed, falling back to direct refresh', {
              correlationId,
              error: result.error
            });
          }
        } catch (serviceError) {
          logger.warn('Service-based refresh threw error, falling back to direct refresh', {
            correlationId,
            error: serviceError instanceof Error ? serviceError.message : 'Unknown error'
          });
        }
      }

      // Fallback: Direct token refresh without service dependency
      logger.debug('Using fallback direct token refresh', { correlationId });

      const directResult = await performDirectRefresh();

      if (directResult.success) {
        setRefreshStatus('success');
        await updateAuthState();
        logger.info('Fallback token refresh successful', { correlationId });

        // Clear success status after 2 seconds
        setTimeout(() => {
          if (refreshStatus() === 'success') {
            setRefreshStatus('idle');
          }
        }, 2000);
      } else {
        throw new Error(directResult.error || 'Direct refresh failed');
      }

    } catch (error) {
      setRefreshStatus('error');
      const errorMessage = (error as Error).message;
      setAuthError(errorMessage);
      setLastError({
        type: 'refresh',
        message: errorMessage,
        timestamp: Date.now(),
      });
      logger.error('All refresh mechanisms failed', { correlationId, error: errorMessage });
      throw error;
    }
  };

  // Manual auth validation
  const validateAuth = async (): Promise<void> => {
    logger.info('🔍 VALIDATEAUTH CALLED - Checking auth store state', {
      hasTokenRefreshService: !!tokenRefreshService,
      hasAuthManager: !!authManager,
      isLoading: isLoading(),
      currentAuthState: {
        isAuthenticated: isAuthenticated(),
        tokenStatus: tokenStatus(),
        hasError: !!authError()
      }
    });

    if (!tokenRefreshService) {
      logger.error('❌ CRITICAL: Token refresh service not initialized!', {
        hasAuthManager: !!authManager,
        isLoading: isLoading(),
        authError: authError(),
        callStack: new Error().stack
      });
      throw new Error('Token refresh service not initialized');
    }

    try {
      logger.debug('🔄 Starting manual auth validation...');
      setPollingStatus('polling');
      setAuthError(null);

      const result: AuthPollingResult = await tokenRefreshService.triggerManualValidation();

      if (result.isValid) {
        setPollingStatus('success');

        if (result.shouldRefresh) {
          logger.debug('Auth validation recommends token refresh');
          await refreshToken();
        }

        await updateAuthState();
        logger.debug('Manual auth validation successful');

        // Clear success status after 2 seconds
        setTimeout(() => {
          if (pollingStatus() === 'success') {
            setPollingStatus('idle');
          }
        }, 2000);
      } else {
        setPollingStatus('error');
        const errorMessage = result.error || 'Auth validation failed';
        setAuthError(errorMessage);
        setLastError({
          type: 'polling',
          message: errorMessage,
          timestamp: Date.now(),
        });
        logger.warn('Manual auth validation failed:', result.error);
      }
    } catch (error) {
      setPollingStatus('error');
      const errorMessage = (error as Error).message;
      setAuthError(errorMessage);
      setLastError({
        type: 'polling',
        message: errorMessage,
        timestamp: Date.now(),
      });
      logger.error('Manual auth validation error:', error);
      throw error;
    }
  };

  // Logout user
  const logout = async (): Promise<void> => {
    if (!authManager || !tokenRefreshService) {
      throw new Error('Services not initialized');
    }

    try {
      logger.debug('Logout triggered from auth store');
      setIsLoading(true);
      setAuthError(null);

      // Stop services first
      tokenRefreshService.stopServices();
      stopPeriodicUpdates();

      // Logout from auth manager
      await authManager.logout();

      // Update state
      setAuthState({
        isAuthenticated: false,
        user: null,
        tokenExpiresAt: null,
        lastRefreshAt: null,
        nextRefreshAt: null,
        refreshAttempts: 0,
      });

      setTokenStatus('expired');
      setRefreshStatus('idle');
      setPollingStatus('idle');
      setIsLoading(false);

      logger.debug('Logout completed successfully');
    } catch (error) {
      logger.error('Logout failed:', error);
      setAuthError((error as Error).message);
      setIsLoading(false);
      throw error;
    }
  };

  // Cleanup services
  const cleanup = () => {
    logger.debug('Cleaning up Firebase Auth Store');

    stopPeriodicUpdates();

    if (authManager) {
      authManager.cleanup();
    }

    if (tokenRefreshService) {
      tokenRefreshService.stopServices();
    }

    // Reset all signals to initial state
    setAuthState({
      isAuthenticated: false,
      user: null,
      tokenExpiresAt: null,
      lastRefreshAt: null,
      nextRefreshAt: null,
      refreshAttempts: 0,
    });

    setAuthError(null);
    setTokenStatus('expired');
    setRefreshStatus('idle');
    setPollingStatus('idle');
    setIsLoading(false);
    setLastError(null);

    logger.debug('Firebase Auth Store cleanup complete');
  };

  // Rate limiting functions
  const activateRateLimit = (reason: string = 'Cloudflare error 1015', durationMs: number = 10000) => {
    setRateLimitActive(true);
    setRateLimitEndTime(Date.now() + durationMs);
    setRateLimitReason(reason);

    logger.warn('Global rate limit activated', {
      reason,
      durationMs,
      endTime: new Date(Date.now() + durationMs).toISOString()
    });

    // Auto-deactivate after duration
    setTimeout(() => {
      if (rateLimitActive() && Date.now() >= rateLimitEndTime()) {
        setRateLimitActive(false);
        setRateLimitEndTime(0);
        setRateLimitReason(null);
        logger.info('Global rate limit automatically deactivated');
      }
    }, durationMs);
  };

  const isRateLimited = (): boolean => {
    const now = Date.now();
    if (rateLimitActive() && now < rateLimitEndTime()) {
      return true;
    }
    if (rateLimitActive() && now >= rateLimitEndTime()) {
      // Auto-deactivate if expired
      setRateLimitActive(false);
      setRateLimitEndTime(0);
      setRateLimitReason(null);
      logger.info('Global rate limit expired and deactivated');
    }
    return false;
  };

  const getRateLimitInfo = () => ({
    isActive: rateLimitActive(),
    endTime: rateLimitEndTime(),
    reason: rateLimitReason(),
    remainingMs: Math.max(0, rateLimitEndTime() - Date.now())
  });

  // Service health and fallback utilities
  const isServiceRunning = async (): Promise<boolean> => {
    try {
      return tokenRefreshService &&
             typeof tokenRefreshService.isServiceRunning === 'function' &&
             tokenRefreshService.isServiceRunning();
    } catch (error) {
      logger.warn('Error checking service running status:', error);
      return false;
    }
  };

  const performDirectRefresh = async (): Promise<DirectRefreshResult> => {
    try {
      // Import the direct refresh function
      const { performDirectTokenRefresh } = await import('./custom-refresh');
      const { firebaseTokenStorage } = await import('src/lib/auth/firebase-token-storage');

      // Get refresh token from storage
      const tokens = firebaseTokenStorage.getTokens();
      if (!tokens.refreshToken) {
        throw new Error('No refresh token available for direct refresh');
      }

      // Perform direct refresh
      const result = await performDirectTokenRefresh(tokens.refreshToken);

      return result;
    } catch (error) {
      logger.error('Direct refresh failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during direct refresh',
        timestamp: Date.now()
      };
    }
  };

  // Service health monitoring
  const checkServiceHealth = async (): Promise<void> => {
    try {
      const issues: string[] = [];

      // Check if token refresh service exists and is running
      if (!tokenRefreshService) {
        issues.push('Token refresh service not initialized');
      } else if (!await isServiceRunning()) {
        issues.push('Token refresh service not running');
      }

      // Check if auth manager exists
      if (!authManager) {
        issues.push('Auth manager not initialized');
      }

      // Check token validity
      const { firebaseTokenStorage } = await import('src/lib/auth/firebase-token-storage');
      const tokens = firebaseTokenStorage.getTokens();
      if (tokens.idToken) {
        const { extractTokenExpiration } = await import('./custom-refresh');
        const expirationTime = extractTokenExpiration(tokens.idToken);
        if (expirationTime && Date.now() > expirationTime) {
          issues.push('Current token is expired');
        }
      } else if (authState().isAuthenticated) {
        issues.push('Authenticated user has no stored token');
      }

      const isHealthy = issues.length === 0;
      const currentHealth = serviceHealth();

      setServiceHealth({
        isHealthy,
        lastCheck: Date.now(),
        consecutiveFailures: isHealthy ? 0 : currentHealth.consecutiveFailures + 1,
        issues
      });

      // Log health status
      if (!isHealthy) {
        logger.warn('Service health check failed', { issues });
      } else {
        logger.debug('Service health check passed');
      }

    } catch (error) {
      logger.error('Service health check error:', error);
    }
  };

  // Session expiry notification management
  const triggerSessionExpiryNotification = (): void => {
    logger.warn('Triggering session expiry notification');

    setSessionExpiryNotification(prev => ({
      ...prev,
      isVisible: true,
      countdown: 5
    }));

    // Start countdown
    const startCountdown = () => {
      const intervalId = setInterval(() => {
        setSessionExpiryNotification(prev => {
          if (prev.countdown <= 1) {
            clearInterval(intervalId);
            // Auto-redirect after countdown
            prev.onRedirect();
            return { ...prev, isVisible: false, countdown: 0 };
          }
          return { ...prev, countdown: prev.countdown - 1 };
        });
      }, 1000);
    };

    // Slight delay before starting countdown to allow UI to render
    setTimeout(startCountdown, 100);
  };

  const dismissSessionExpiryNotification = (): void => {
    setSessionExpiryNotification(prev => ({ ...prev, isVisible: false, countdown: 5 }));
  };

  // Refresh error management for service notifications
  const setRefreshError = (errorMessage: string): void => {
    setAuthError(errorMessage);
    setLastError({
      type: 'refresh',
      message: errorMessage,
      timestamp: Date.now(),
    });
    logger.warn('Refresh error set from service notification:', errorMessage);
  };

  const clearRefreshError = (): void => {
    // Only clear if the current error is a refresh error
    const currentError = lastError();
    if (currentError && currentError.type === 'refresh') {
      setAuthError(null);
      setLastError(null);
      logger.debug('Refresh error cleared from service notification');
    }
  };

  // Setup cleanup on unmount
  onCleanup(() => {
    cleanup();
  });

  // Return the auth store interface
  return {
    // State accessors
    isAuthenticated: () => authState().isAuthenticated,
    currentUser: () => authState().user,
    tokenStatus,
    authError,
    lastRefreshAt: () => authState().lastRefreshAt,
    nextRefreshAt: () => authState().nextRefreshAt,

    // Actions
    refreshToken,
    logout,

    // Additional methods for external use
    initialize,
    validateAuth,
    cleanup,
    updateAuthState,

    // Rate limiting methods
    activateRateLimit,
    isRateLimited,
    getRateLimitInfo,

    // Rate limiting state accessors
    rateLimitActive: () => rateLimitActive(),
    rateLimitReason: () => rateLimitReason(),
    rateLimitEndTime: () => rateLimitEndTime(),

    // Service health and notification methods
    checkServiceHealth,
    getServiceHealth: () => serviceHealth(),
    triggerSessionExpiryNotification,
    dismissSessionExpiryNotification,
    getSessionExpiryNotification: () => sessionExpiryNotification(),

    // Fallback refresh utilities
    isServiceRunning,
    performDirectRefresh,

    // Service notification handlers
    setRefreshError,
    clearRefreshError,
  };
}

/**
 * Global Firebase Auth Store instance
 * Singleton pattern for consistent state across components
 *
 * FIXED: This ensures there's only ONE auth store instance across the entire app
 * preventing the triple singleton anti-pattern that was causing auth conflicts.
 * Both getGlobalAuthStore() and AuthStoreProvider now use the same instance.
 */
let globalAuthStore: ReturnType<typeof createFirebaseAuthStore> | null = null;

export function getGlobalAuthStore(): ReturnType<typeof createFirebaseAuthStore> {
  if (!globalAuthStore) {
    logger.info('🏗️ CREATING new global auth store instance');
    globalAuthStore = createFirebaseAuthStore();
    logger.info('✅ Global auth store created', {
      hasStore: !!globalAuthStore,
      storeType: globalAuthStore?.constructor?.name || 'unknown'
    });
  } else {
    logger.debug('♻️ Returning existing global auth store instance');
  }
  return globalAuthStore;
}

/**
 * Auth Store Context for SolidJS
 * Provides reactive auth signals to child components
 */
import { createContext, useContext, type ParentComponent, type Component } from 'solid-js';

const AuthStoreContext = createContext<ReturnType<typeof createFirebaseAuthStore>>();

export const AuthStoreProvider: ParentComponent<{
  children: any;
  initialToken?: string;
}> = (props) => {
  // FIXED: Use the global auth store instead of creating a new one
  // This prevents the triple singleton anti-pattern
  const authStore = getGlobalAuthStore();

  // Initialize the store with initial token if provided
  createEffect(async () => {
    if (props.initialToken) {
      await authStore.initialize(props.initialToken);
    }
  });

  return (
    <AuthStoreContext.Provider value={authStore}>
      {props.children}
    </AuthStoreContext.Provider>
  );
};

export function useAuthStore(): ReturnType<typeof createFirebaseAuthStore> {
  const context = useContext(AuthStoreContext);
  if (!context) {
    throw new Error('useAuthStore must be used within an AuthStoreProvider');
  }
  return context;
}

/**
 * Utility hooks for specific auth data
 */
export function useAuth() {
  const store = useAuthStore();

  return {
    isAuthenticated: store.isAuthenticated,
    user: store.currentUser,
    error: store.authError,
    isLoading: () => false, // Loading is handled by initialization
    logout: store.logout,
    refreshToken: store.refreshToken,
  };
}

export function useTokenStatus() {
  const store = useAuthStore();

  return {
    status: store.tokenStatus,
    lastRefresh: store.lastRefreshAt,
    nextRefresh: store.nextRefreshAt,
    refresh: store.refreshToken,
  };
}

// Export reactive signals for direct access if needed
export {
  authState,
  authError,
  tokenStatus,
  refreshStatus,
  pollingStatus,
  isLoading,
  serviceStatus,
  lastError,
  rateLimitActive,
  rateLimitEndTime,
  rateLimitReason,
  serviceHealth,
  sessionExpiryNotification,
};