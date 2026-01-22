import {
  createSignal,
  createEffect,
  onMount,
  onCleanup
} from 'solid-js'
import type {
  Component
} from 'solid-js'
import "src/styles/global.css"
import Navigation, {
  type Page
} from './components/navigation'
import {
  MiddlewareProvider,
  useMiddleware,
  loggingMiddleware,
  authMiddleware
} from './middleware'
// REMOVED: EnhancedMiddlewareProvider was redundant passthrough
import { AuthErrorBoundary } from './components/AuthErrorBoundary'
// MIGRATED: Now using UnifiedWalletProvider instead of separate providers
import { UnifiedWalletProvider, useWalletConnectQRModal } from 'src/applications_solid/app/lib/wallet/unified-wallet-context'
// REMOVED: AuthStoreProvider and PersistentDataProvider are now integrated into UnifiedWalletProvider
import { createLogger } from 'src/lib/logger'
import DashboardPage from './pages/dashboard/index'
import ProfilePage from './pages/profile/index'
import WalletPage from './pages/splitdo-exchange/index'
import { SessionExpiryNotification } from './components/SessionExpiryNotification'
import { WalletConnectQRModal } from './components/WalletConnectQRModal'
import { ToastContainer } from './components/ToastNotification'

/*
 * **THIS IS A SOLIDJS APP NOT A REACT APP!!!!**
 * **THIS IS A SOLIDJS APP NOT A REACT APP!!!!**
 * **THIS IS A SOLIDJS APP NOT A REACT APP!!!!**
 * **THIS IS A SOLIDJS APP NOT A REACT APP!!!!**
 * **THIS IS A SOLIDJS APP NOT A REACT APP!!!!**
 * **THIS IS A SOLIDJS APP NOT A REACT APP!!!!**
 * **THIS IS A SOLIDJS APP NOT A REACT APP!!!!**
 * **THIS IS A SOLIDJS APP NOT A REACT APP!!!!**
 * **THIS IS A SOLIDJS APP NOT A REACT APP!!!!**
 * **THIS IS A SOLIDJS APP NOT A REACT APP!!!!**
*/

const logger = createLogger('[SolidJS App]');

const AppContent: Component<{ firebaseToken?: string }> = (props) => {
  const [currentPage, setCurrentPage] = createSignal<Page>('dashboard')
  const [isNavOpen, setIsNavOpen] = createSignal(false)
  const [authStore, setAuthStore] = createSignal<ReturnType<typeof import('./middleware/firebase/auth-store').getGlobalAuthStore> | null>(null)
  const [showHamburger, setShowHamburger] = createSignal(true)
  const middleware = useMiddleware()
  let mainContentRef: HTMLElement | undefined

  // QR Modal state from wallet context
  const qrModal = useWalletConnectQRModal()

  // Force dark mode on mount
  onMount(() => {
    if (typeof window === 'undefined') return

    // Always enable dark mode
    document.documentElement.classList.add('dark')
    localStorage.setItem('darkMode', 'true')
    
    // Setup scroll listener to show/hide hamburger menu on mobile
    const handleScroll = () => {
      if (mainContentRef) {
        // Show hamburger only when near top (within 50px)
        setShowHamburger(mainContentRef.scrollTop < 50)
      }
    }
    
    // Attach listener after a brief delay to ensure ref is set
    setTimeout(() => {
      if (mainContentRef) {
        mainContentRef.addEventListener('scroll', handleScroll)
      }
    }, 100)
    
    // Cleanup scroll listener
    onCleanup(() => {
      if (mainContentRef) {
        mainContentRef.removeEventListener('scroll', handleScroll)
      }
    })
    
    // Initialize page from URL pathname
    const pathname = window.location.pathname
    const pathSegments = pathname.split('/').filter(Boolean)
    // Extract page name from /solid-spa/pagename structure (user request mapped to /app/pagename usually)
    // Wait, the Astro page is at /app/[...all]. The solid app logic here assumes /solid-spa/. 
    // I should probably adapt this to /app/ since the user requested /app/ page.
    // However, I must stick to the USER provided code as much as possible, BUT "Look properly how a working SOLIDJS application currently works please"
    // implies I should make it WORK.
    // If the Astro page is /app/, the URL will be /app/dashboard.
    // The user code expects /solid-spa/pagename. I should change it to /app/ to match the request "redirect to /app/ page now".
    
    const rootPath = 'app'; // Changed from 'solid-spa' to match request
    const pageName = pathSegments.length >= 2 && pathSegments[0] === rootPath 
      ? pathSegments[1] 
      : 'dashboard'
    
    if (['dashboard', 'profile', 'splitdo-exchange'].includes(pageName)) {
      setCurrentPage(pageName as Page)
    }
  })

  // Handle page changes with middleware navigation
  const handlePageChange = (page: Page) => {
    const newPath = `/app/${page}` // Changed from /solid-spa/
    middleware.navigate(newPath)
    setCurrentPage(page)
  }

  // Listen to route changes
  createEffect(() => {
    const currentRoute = middleware.currentRoute()
    const pathSegments = currentRoute.split('/').filter(Boolean)
    const rootPath = 'app';
    const pageName = pathSegments.length >= 2 && pathSegments[0] === rootPath
      ? pathSegments[1]
      : 'dashboard'

    if (['dashboard', 'profile', 'splitdo-exchange'].includes(pageName)) {
      const newPage = pageName as Page;
      // CRITICAL: Only update if different to prevent loops
      if (currentPage() !== newPage) {
        logger.debug(`Route change detected: ${currentPage()} -> ${newPage}`);
        setCurrentPage(newPage);
      }
    }
  })

  const renderPage = () => {
    const page = currentPage()
    switch (page) {
      case 'dashboard':
        return <DashboardPage isDark={true} />
      case 'profile':
        return <ProfilePage isDark={true} />
      case 'splitdo-exchange':
        return <WalletPage isDark={true} />
      default:
        return <DashboardPage isDark={true} />
    }
  }

  // Setup Firebase auth services and middleware
  onMount(async () => {
    try {
      logger.debug('Initializing Firebase auth services');

      // Import Firebase auth components
      const { getGlobalAuthStore } = await import('./middleware/firebase/auth-store');
      const { setupAuthMiddleware } = await import('./middleware/firebase/auth-middleware');

      // Get auth store and initialize if not already done
      const authStoreInstance = getGlobalAuthStore();
      setAuthStore(authStoreInstance);

      // CRITICAL FIX: Initialize the auth store BEFORE the middleware
      logger.info('🔑 Initializing auth store with firebase token...');
      await authStoreInstance.initialize(props.firebaseToken);
      logger.info('✅ Auth store initialization complete');

      // Setup Firebase auth middleware
      const authSetup = setupAuthMiddleware({
        protectedRoutes: ['/app'],
        publicOnlyRoutes: ['/auth/sign-in', '/auth/sign-up'],
        loginRoute: '/auth/sign-in',
        dashboardRoute: '/app/dashboard',
      });

      // Initialize auth middleware (now that auth store is ready)
      await authSetup.initialize();

      // Setup manual navigation handling for browser back/forward
      authSetup.setupManualNavigation();

      // Integrate with existing middleware system
      middleware.beforeNavigate(async (from, to) => {
        logger.debug('Before navigate middleware', { from, to });

        // Use Firebase auth middleware for auth checks
        const allowed = await authSetup.middleware.beforeNavigate(from, to);

        if (allowed) {
          logger.debug('Navigation allowed by Firebase auth middleware');
        } else {
          logger.debug('Navigation blocked by Firebase auth middleware');
        }

        return allowed;
      });

      middleware.afterNavigate(async (to) => {
        logger.debug('After navigate middleware', { to });

        // Run Firebase auth middleware after navigation
        await authSetup.middleware.afterNavigate('', to);

        // Keep existing logging middleware
        loggingMiddleware()(to);
      });

      // Setup auth state change listeners
      let isProcessingAuthChange = false;
      createEffect(() => {
        const isAuthenticated = authStoreInstance.isAuthenticated();
        const tokenStatus = authStoreInstance.tokenStatus();

        logger.debug('Auth state changed', {
          isAuthenticated,
          tokenStatus,
          currentRoute: middleware.currentRoute(),
        });

        // PREVENT LOOP: Skip if already processing auth changes
        if (isProcessingAuthChange) {
          logger.debug('Skipping auth state change handling - already processing');
          return;
        }

        isProcessingAuthChange = true;
        try {
          // Handle auth state changes
          authSetup.middleware.onAuthStateChange(isAuthenticated);
          authSetup.middleware.onTokenStatusChange(tokenStatus);
        } finally {
          // Reset flag after a brief timeout to allow processing to complete
          setTimeout(() => {
            isProcessingAuthChange = false;
          }, 100);
        }
      });

      // Cleanup on unmount
      onCleanup(() => {
        logger.debug('Cleaning up Firebase auth services');
        authSetup.middleware.cleanup();
        authStoreInstance.cleanup();
      });

      logger.debug('Firebase auth services initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Firebase auth services:', error);

      // Fallback to basic auth middleware
      middleware.beforeNavigate(authMiddleware());
      middleware.afterNavigate(loggingMiddleware());
    }
  })

  return (
    <div class="h-screen flex overflow-hidden bg-zinc-900 text-gray-100">
      <Navigation
        currentPage={currentPage()}
        onPageChange={handlePageChange}
        isOpen={isNavOpen()}
        onClose={() => setIsNavOpen(false)}
      />

      {/* Hamburger Menu Button (Mobile Only) - hides on scroll */}
      <button
        onClick={() => setIsNavOpen(true)}
        class={`fixed top-4 left-4 z-40 lg:hidden w-10 h-10 rounded-lg bg-crypto-bg-secondary border border-crypto-border flex items-center justify-center transition-all duration-300 ${showHamburger() ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
      >
        <svg class="w-6 h-6 crypto-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>

      {/* Main Content */}
      <main ref={mainContentRef} class="flex-1 overflow-auto lg:ml-64 pt-16 lg:pt-0 transition-all duration-300">
        {renderPage()}
      </main>

      {/* Session Expiry Notification */}
      {authStore() && (() => {
        const sessionNotification = authStore()!.getSessionExpiryNotification();
        return (
          <SessionExpiryNotification
            isVisible={sessionNotification.isVisible}
            countdown={sessionNotification.countdown}
            message={sessionNotification.message}
            onRedirect={sessionNotification.onRedirect}
            onDismiss={sessionNotification.onDismiss}
            isDark={true}
          />
        );
      })()}

      {/* WalletConnect QR Modal */}
      <WalletConnectQRModal
        isDark={true}
        isOpen={qrModal.isQRModalOpen}
        onClose={qrModal.closeQRModal}
        qrData={qrModal.qrData}
        connectionStatus={() => 'idle'}
        error={() => null}
        onRefreshQR={() => {
          // TODO: Implement refresh QR functionality
          qrModal.closeQRModal();
          // Would trigger new connection attempt
        }}
        onMobileWalletClick={(walletId: string) => {
          // TODO: Implement mobile wallet click handler
          console.log('Mobile wallet clicked:', walletId);
        }}
      />

      {/* Toast Notifications */}
      <ToastContainer isDark={isDark()} />
    </div>
  )
}

const App: Component<{ firebaseToken?: string }> = (props) => {
  return (
    <MiddlewareProvider>
      <AuthErrorBoundary>
        <UnifiedWalletProvider firebaseToken={props.firebaseToken}>
          <AppContent firebaseToken={props.firebaseToken} />
        </UnifiedWalletProvider>
      </AuthErrorBoundary>
    </MiddlewareProvider>
  )
}

export default App
