/**
 * Firebase Auth Middleware for SolidJS
 * Integrates Firebase authentication with SolidJS navigation and routing
 */

import { getGlobalAuthStore } from './auth-store';
import { createLogger } from 'src/lib/logger';
import type { NavigationContext } from '../types';

const logger = createLogger('[Firebase Auth Middleware]');

/**
 * Firebase Auth Middleware Configuration
 */
export interface FirebaseAuthMiddlewareConfig {
  // Routes that require authentication
  protectedRoutes: string[];
  // Routes that should redirect authenticated users (like login pages)
  publicOnlyRoutes: string[];
  // Default redirect for unauthenticated users
  loginRoute: string;
  // Default redirect for authenticated users accessing public-only routes
  dashboardRoute: string;
  // Whether to perform auth checks on every navigation
  checkAuthOnNavigation: boolean;
  // Whether to validate token status before navigation
  validateTokenBeforeNavigation: boolean;
}

const DEFAULT_CONFIG: FirebaseAuthMiddlewareConfig = {
  protectedRoutes: ['/app', '/dashboard', '/profile', '/settings', '/splitdo-exchange'],
  publicOnlyRoutes: ['/auth/sign-in', '/auth/sign-up', '/auth/forgot-password'],
  loginRoute: '/auth/sign-in',
  dashboardRoute: '/app/dashboard',
  checkAuthOnNavigation: true,
  validateTokenBeforeNavigation: true,
};

/**
 * Create Firebase Auth Middleware
 * Returns middleware functions for SolidJS navigation
 */
export function createFirebaseAuthMiddleware(config: Partial<FirebaseAuthMiddlewareConfig> = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const authStore = getGlobalAuthStore();

  logger.debug('Creating Firebase Auth Middleware', {
    protectedRoutes: mergedConfig.protectedRoutes,
    publicOnlyRoutes: mergedConfig.publicOnlyRoutes,
    config: mergedConfig,
  });

  /**
   * Check if a route requires authentication
   */
  const isProtectedRoute = (path: string): boolean => {
    return mergedConfig.protectedRoutes.some(route =>
      path.startsWith(route) || path === route
    );
  };

  /**
   * Check if a route is public-only (should redirect authenticated users)
   */
  const isPublicOnlyRoute = (path: string): boolean => {
    return mergedConfig.publicOnlyRoutes.some(route =>
      path.startsWith(route) || path === route
    );
  };

  /**
   * Check if navigation should be blocked
   */
  const shouldBlockNavigation = async (to: string): Promise<{
    block: boolean;
    redirectTo?: string;
    reason?: string;
  }> => {
    const isAuthenticated = authStore.isAuthenticated();
    const tokenStatus = authStore.tokenStatus();

    logger.debug('Checking navigation permission', {
      to,
      isAuthenticated,
      tokenStatus,
      isProtected: isProtectedRoute(to),
      isPublicOnly: isPublicOnlyRoute(to),
    });

    // Handle protected routes
    if (isProtectedRoute(to)) {
      if (!isAuthenticated) {
        logger.debug('Blocking navigation - not authenticated', { to });
        return {
          block: true,
          redirectTo: mergedConfig.loginRoute,
          reason: 'Not authenticated',
        };
      }

      // Check token status for protected routes
      if (mergedConfig.validateTokenBeforeNavigation) {
        if (tokenStatus === 'expired') {
          logger.debug('Blocking navigation - token expired', { to });
          return {
            block: true,
            redirectTo: mergedConfig.loginRoute,
            reason: 'Token expired',
          };
        }

        // If token is refreshing, allow navigation but log it
        if (tokenStatus === 'refreshing') {
          logger.debug('Allowing navigation with refreshing token', { to });
        }
      }
    }

    // Handle public-only routes
    if (isPublicOnlyRoute(to) && isAuthenticated && tokenStatus !== 'expired') {
      logger.debug('Blocking navigation - already authenticated', { to });
      return {
        block: true,
        redirectTo: mergedConfig.dashboardRoute,
        reason: 'Already authenticated',
      };
    }

    logger.debug('Navigation allowed', { to });
    return { block: false };
  };

  /**
   * Before navigation middleware
   * Called before each navigation attempt
   */
  const beforeNavigate = async (from: string, to: string): Promise<boolean> => {
    if (!mergedConfig.checkAuthOnNavigation) {
      return true; // Allow navigation
    }

    try {
      logger.debug('Auth middleware beforeNavigate', { from, to });

      const navigationCheck = await shouldBlockNavigation(to);

      if (navigationCheck.block) {
        logger.debug('Navigation blocked', {
          from,
          to,
          reason: navigationCheck.reason,
          redirectTo: navigationCheck.redirectTo,
        });

        // Perform redirect using browser API (not SolidJS router)
        if (navigationCheck.redirectTo) {
          window.location.href = navigationCheck.redirectTo;
        }

        return false; // Block navigation
      }

      return true; // Allow navigation
    } catch (error) {
      logger.error('Error in beforeNavigate middleware:', error);

      // On error, err on the side of caution
      if (isProtectedRoute(to)) {
        logger.debug('Error checking auth - redirecting to login for safety');
        window.location.href = mergedConfig.loginRoute;
        return false;
      }

      return true; // Allow navigation for non-protected routes
    }
  };

  /**
   * After navigation middleware
   * Called after navigation is complete
   */
  const afterNavigate = async (from: string, to: string): Promise<void> => {
    try {
      logger.debug('Auth middleware afterNavigate', { from, to });

      // Update auth state to ensure consistency
      await authStore.updateAuthState();

      // If we navigated to a protected route, validate auth state
      if (isProtectedRoute(to)) {
        const isAuthenticated = authStore.isAuthenticated();
        const tokenStatus = authStore.tokenStatus();

        if (!isAuthenticated || tokenStatus === 'expired') {
          logger.warn('User reached protected route without valid auth', {
            to,
            isAuthenticated,
            tokenStatus,
          });

          // Force redirect to login
          window.location.href = mergedConfig.loginRoute;
          return;
        }

        // Trigger token validation if needed
        if (mergedConfig.validateTokenBeforeNavigation && tokenStatus === 'refreshing') {
          logger.debug('Triggering auth validation after navigation to protected route');
          await authStore.validateAuth();
        }
      }

      logger.debug('After navigation check completed', { to });
    } catch (error) {
      logger.error('Error in afterNavigate middleware:', error);
    }
  };

  /**
   * Auth state change handler
   * Called when authentication state changes
   */
  const onAuthStateChange = async (authenticated: boolean): Promise<void> => {
    try {
      logger.debug('Auth state change detected', { authenticated });

      if (!authenticated) {
        // User logged out or auth failed
        const currentPath = window.location.pathname;

        if (isProtectedRoute(currentPath)) {
          logger.debug('User lost auth on protected route - redirecting to login');
          window.location.href = mergedConfig.loginRoute;
        }
      } else {
        // User authenticated
        const currentPath = window.location.pathname;

        if (isPublicOnlyRoute(currentPath)) {
          logger.debug('User authenticated on public-only route - redirecting to dashboard');
          window.location.href = mergedConfig.dashboardRoute;
        }
      }
    } catch (error) {
      logger.error('Error handling auth state change:', error);
    }
  };

  /**
   * Token status change handler
   * Called when token status changes
   */
  const onTokenStatusChange = async (status: 'valid' | 'refreshing' | 'expired' | 'error'): Promise<void> => {
    try {
      logger.debug('Token status change detected', { status });

      if (status === 'expired' || status === 'error') {
        const currentPath = window.location.pathname;

        if (isProtectedRoute(currentPath)) {
          logger.debug('Token expired/error on protected route - redirecting to login');
          window.location.href = mergedConfig.loginRoute;
        }
      }
    } catch (error) {
      logger.error('Error handling token status change:', error);
    }
  };

  /**
   * Navigation guard
   * Returns navigation context for external use
   */
  const getNavigationContext = (): NavigationContext => {
    const isAuthenticated = authStore.isAuthenticated();
    const tokenStatus = authStore.tokenStatus();
    const currentPath = window.location.pathname;

    return {
      from: currentPath,
      to: currentPath,
      authenticated: isAuthenticated,
      tokenStatus,
    };
  };

  /**
   * Check if current route is accessible
   */
  const isCurrentRouteAccessible = async (): Promise<boolean> => {
    const currentPath = window.location.pathname;
    const navigationCheck = await shouldBlockNavigation(currentPath);
    return !navigationCheck.block;
  };

  /**
   * Force authentication check
   */
  const forceAuthCheck = async (): Promise<void> => {
    logger.debug('Force auth check triggered');

    try {
      await authStore.validateAuth();

      const currentPath = window.location.pathname;
      const navigationCheck = await shouldBlockNavigation(currentPath);

      if (navigationCheck.block && navigationCheck.redirectTo) {
        logger.debug('Force auth check failed - redirecting', {
          currentPath,
          redirectTo: navigationCheck.redirectTo,
          reason: navigationCheck.reason,
        });

        window.location.href = navigationCheck.redirectTo;
      }
    } catch (error) {
      logger.error('Force auth check failed:', error);

      const currentPath = window.location.pathname;
      if (isProtectedRoute(currentPath)) {
        window.location.href = mergedConfig.loginRoute;
      }
    }
  };

  /**
   * Middleware cleanup
   */
  const cleanup = (): void => {
    logger.debug('Cleaning up Firebase Auth Middleware');
    // Any cleanup tasks if needed
  };

  // Return middleware interface
  return {
    // Core middleware functions
    beforeNavigate,
    afterNavigate,
    onAuthStateChange,
    onTokenStatusChange,

    // Utility functions
    isProtectedRoute,
    isPublicOnlyRoute,
    getNavigationContext,
    isCurrentRouteAccessible,
    forceAuthCheck,
    cleanup,

    // Configuration
    config: mergedConfig,

    // Auth store access
    authStore,
  };
}

// Type exports for external use
export type FirebaseAuthMiddleware = ReturnType<typeof createFirebaseAuthMiddleware>;

/**
 * Global middleware instance
 */
let globalAuthMiddleware: FirebaseAuthMiddleware | null = null;

export function getGlobalAuthMiddleware(config?: Partial<FirebaseAuthMiddlewareConfig>): FirebaseAuthMiddleware {
  if (!globalAuthMiddleware) {
    globalAuthMiddleware = createFirebaseAuthMiddleware(config);
  }
  return globalAuthMiddleware;
}

/**
 * Utility function to setup auth middleware with common patterns
 */
export function setupAuthMiddleware(config?: Partial<FirebaseAuthMiddlewareConfig>) {
  const middleware = getGlobalAuthMiddleware(config);

  logger.debug('Setting up auth middleware');

  // Return setup utilities
  return {
    middleware,

    // Easy setup for SolidJS Router integration
    setupRouterIntegration: (router: any) => {
      // This would integrate with your specific router
      // Implementation depends on your routing solution
      logger.debug('Router integration setup (implementation needed)');
    },

    // Setup for manual navigation handling
    setupManualNavigation: () => {
      // Listen for popstate events (back/forward)
      window.addEventListener('popstate', async (event) => {
        const currentPath = window.location.pathname;
        await middleware.afterNavigate('', currentPath);
      });

      logger.debug('Manual navigation handling setup');
    },

    // Initialize middleware with current route check
    initialize: async () => {
      logger.debug('Initializing auth middleware');

      // Check current route accessibility
      const isAccessible = await middleware.isCurrentRouteAccessible();

      if (!isAccessible) {
        await middleware.forceAuthCheck();
      }

      logger.debug('Auth middleware initialization complete');
    },
  };
}