import { createSignal, createContext, useContext, type JSX } from 'solid-js';
import { createLogger } from 'src/lib/logger';

const logger = createLogger('[Middleware]');

// Enhanced type to support async middleware
type BeforeNavigateCallback = (from: string, to: string) => boolean | void | Promise<boolean | void>;
type AfterNavigateCallback = (to: string) => void | Promise<void>;

type MiddlewareContextType = {
  currentRoute: () => string;
  navigate: (path: string) => void;
  beforeNavigate: (cb: BeforeNavigateCallback) => void;
  afterNavigate: (cb: AfterNavigateCallback) => void;
  isNavigating: () => boolean;
};

const MiddlewareContext = createContext<MiddlewareContextType>();

export const MiddlewareProvider = (props: { children: JSX.Element }) => {
  const [currentRoute, setCurrentRoute] = createSignal(typeof window !== 'undefined' ? window.location.pathname : '');
  const [isNavigating, setIsNavigating] = createSignal(false);
  const beforeNav = new Set<BeforeNavigateCallback>();
  const afterNav = new Set<AfterNavigateCallback>();

  const navigate = async (path: string) => {
    if (isNavigating()) {
      logger.debug('Navigation already in progress, ignoring new navigation request');
      return;
    }

    const from = currentRoute();
    logger.debug('Starting navigation', { from, to: path });

    setIsNavigating(true);

    try {
      // Run before navigation hooks (support async)
      for (const cb of beforeNav) {
        try {
          const result = await cb(from, path);
          if (result === false) {
            logger.debug('Navigation blocked by middleware', { from, to: path });
            setIsNavigating(false);
            return;
          }
        } catch (error) {
          logger.error('Error in beforeNavigate middleware:', error);
          // Continue with other middleware, but log the error
        }
      }

      // Perform the actual navigation
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', path);
      }
      setCurrentRoute(path);

      logger.debug('Navigation completed', { from, to: path });

      // Run after navigation hooks (support async)
      const afterPromises = Array.from(afterNav).map(async (cb) => {
        try {
          await cb(path);
        } catch (error) {
          logger.error('Error in afterNavigate middleware:', error);
        }
      });

      // Wait for all after hooks to complete
      await Promise.all(afterPromises);

    } catch (error) {
      logger.error('Error during navigation:', error);
    } finally {
      setIsNavigating(false);
    }
  };

  // Handle browser back/forward with async support
  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', async () => {
      const newPath = window.location.pathname;
      const from = currentRoute();

      logger.debug('Browser navigation detected', { from, to: newPath });

      if (isNavigating()) {
        logger.debug('Navigation in progress, deferring popstate handling');
        return;
      }

      setIsNavigating(true);

      try {
        // Run before navigation hooks for browser navigation
        for (const cb of beforeNav) {
          try {
            const result = await cb(from, newPath);
            if (result === false) {
              logger.debug('Browser navigation blocked by middleware');
              // For browser navigation, we can't easily prevent it,
              // so we redirect back or to a safe route
              window.history.pushState({}, '', from);
              setIsNavigating(false);
              return;
            }
          } catch (error) {
            logger.error('Error in beforeNavigate middleware during browser navigation:', error);
          }
        }

        setCurrentRoute(newPath);

        // Run after navigation hooks
        const afterPromises = Array.from(afterNav).map(async (cb) => {
          try {
            await cb(newPath);
          } catch (error) {
            logger.error('Error in afterNavigate middleware during browser navigation:', error);
          }
        });

        await Promise.all(afterPromises);
      } catch (error) {
        logger.error('Error during browser navigation:', error);
      } finally {
        setIsNavigating(false);
      }
    });
  }

  const value = {
    currentRoute,
    navigate,
    beforeNavigate: (cb: BeforeNavigateCallback) => beforeNav.add(cb),
    afterNavigate: (cb: AfterNavigateCallback) => afterNav.add(cb),
    isNavigating
  };

  return (
    <MiddlewareContext.Provider value={value}>
      {props.children}
    </MiddlewareContext.Provider>
  );
};

export const useMiddleware = () => {
  const ctx = useContext(MiddlewareContext);
  if (!ctx) throw new Error("useMiddleware must be used within MiddlewareProvider");
  return ctx;
};

// Enhanced logging middleware with timestamp and navigation details
export const loggingMiddleware = () => (to: string) => {
  const timestamp = new Date().toISOString();
  logger.debug(`Navigation completed at ${timestamp}`, { to });
  console.log('Navigated to:', to);
};

// Enhanced auth middleware with better Firebase token detection
export const authMiddleware = () => (from: string, to: string) => {
  if (typeof document === 'undefined') return true;

  try {
    // Check for Firebase auth tokens in multiple locations
    const hasCookieToken = document.cookie.includes('firebase-auth-token');
    const hasStorageToken = localStorage.getItem('firebase-idToken') || sessionStorage.getItem('firebase-idToken');
    const hasToken = hasCookieToken || Boolean(hasStorageToken);

    logger.debug('Auth middleware check', {
      from,
      to,
      hasCookieToken,
      hasStorageToken: Boolean(hasStorageToken),
      isAuthenticated: hasToken,
    });

    console.log('Auth check for navigation:', to, hasToken ? 'Authenticated' : 'Unauthenticated');

    // For protected routes, require authentication
    const protectedRoutes = ['/app'];
    const isProtectedRoute = protectedRoutes.some(route => to.startsWith(route));

    if (isProtectedRoute && !hasToken) {
      logger.warn('Access denied to protected route', { from, to, hasToken });
      console.warn(`Access denied: ${to} requires authentication`);

      // FORCE BROWSER REDIRECT - Use window.location.href to redirect out of SPA
      logger.debug('Forcing browser redirect to sign-in page');
      console.log('Redirecting to /auth/sign-in via browser API');

      // Clear any remaining auth data
      localStorage.removeItem('firebase-idToken');
      localStorage.removeItem('firebase-refreshToken');
      sessionStorage.removeItem('firebase-idToken');
      sessionStorage.removeItem('firebase-refreshToken');

      // Force browser redirect (NOT SolidJS router)
      window.location.href = '/auth/sign-in';

      // Block this navigation since we're redirecting
      return false;
    }

    return true; // Allow navigation
  } catch (error) {
    logger.error('Error in auth middleware:', error);
    console.error('Auth middleware error:', error);

    // On error, also redirect to sign-in for safety
    if (to.startsWith('/app')) {
      console.log('Auth middleware error - redirecting to sign-in for safety');
      window.location.href = '/auth/sign-in';
      return false;
    }

    return true; // Allow navigation on error for non-protected routes
  }
};

// Additional utility middleware functions

// Middleware to show navigation loading state
export const loadingMiddleware = (setLoading: (loading: boolean) => void) => ({
  before: (from: string, to: string) => {
    setLoading(true);
    return true;
  },
  after: (to: string) => {
    setLoading(false);
  }
});

// Middleware for analytics/tracking
export const analyticsMiddleware = () => (to: string) => {
  try {
    // Add your analytics tracking here
    logger.debug('Page view tracked', { path: to });

    // Example: Track with Google Analytics, Mixpanel, etc.
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: to
      });
    }
  } catch (error) {
    logger.error('Analytics middleware error:', error);
  }
};

// Middleware to update document title based on route
export const titleMiddleware = (getTitleFromRoute: (route: string) => string) => (to: string) => {
  try {
    const title = getTitleFromRoute(to);
    if (title && typeof document !== 'undefined') {
      document.title = title;
      logger.debug('Document title updated', { route: to, title });
    }
  } catch (error) {
    logger.error('Title middleware error:', error);
  }
};
