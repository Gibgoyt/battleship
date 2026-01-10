/**
 * SolidJS Firebase Auth Store
 * Reactive signals for authentication state management
 */

import { createSignal, createEffect, onCleanup, type Accessor, type Setter } from 'solid-js';
import type { User } from 'firebase/auth';
import { FirebaseAuthManager } from './auth-manager';
import { FirebaseTokenRefreshService } from './token-refresh-service';
import { createLogger } from 'src/lib/logger';
import type {
  AuthState,
  AuthStore,
  TokenRefreshResult,
  AuthPollingResult,
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
      logger.debug('Initializing Firebase Auth Store', {
        hasInitialToken: Boolean(initialToken),
      });

      setIsLoading(true);
      setAuthError(null);

      // Get service instances
      authManager = FirebaseAuthManager.getInstance();
      tokenRefreshService = FirebaseTokenRefreshService.getInstance();

      // Initialize auth manager
      await authManager.initialize(initialToken);

      // Start refresh services
      tokenRefreshService.startServices();

      // Start periodic state updates
      startPeriodicUpdates();

      // Initial state update
      await updateAuthState();

      setIsLoading(false);
      logger.debug('Firebase Auth Store initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Firebase Auth Store:', error);
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
        } else if (timeUntilExpiry < 5 * 60 * 1000) { // Less than 5 minutes
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

  // Manual token refresh
  const refreshToken = async (): Promise<void> => {
    if (!tokenRefreshService) {
      throw new Error('Token refresh service not initialized');
    }

    try {
      logger.debug('Manual token refresh triggered');
      setRefreshStatus('refreshing');
      setAuthError(null);

      const result: TokenRefreshResult = await tokenRefreshService.triggerManualRefresh();

      if (result.success) {
        setRefreshStatus('success');
        await updateAuthState();
        logger.debug('Manual token refresh successful');

        // Clear success status after 2 seconds
        setTimeout(() => {
          if (refreshStatus() === 'success') {
            setRefreshStatus('idle');
          }
        }, 2000);
      } else {
        setRefreshStatus('error');
        const errorMessage = result.error || 'Token refresh failed';
        setAuthError(errorMessage);
        setLastError({
          type: 'refresh',
          message: errorMessage,
          timestamp: Date.now(),
        });
        logger.error('Manual token refresh failed:', result.error);
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
      logger.error('Manual token refresh error:', error);
      throw error;
    }
  };

  // Manual auth validation
  const validateAuth = async (): Promise<void> => {
    if (!tokenRefreshService) {
      throw new Error('Token refresh service not initialized');
    }

    try {
      logger.debug('Manual auth validation triggered');
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
  };
}

/**
 * Global Firebase Auth Store instance
 * Singleton pattern for consistent state across components
 */
let globalAuthStore: ReturnType<typeof createFirebaseAuthStore> | null = null;

export function getGlobalAuthStore(): ReturnType<typeof createFirebaseAuthStore> {
  if (!globalAuthStore) {
    globalAuthStore = createFirebaseAuthStore();
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
  const authStore = createFirebaseAuthStore();

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
};