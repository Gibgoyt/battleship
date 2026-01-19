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
import { WalletProvider, useWalletConnectQRModal } from 'src/applications_solid/app/lib/wallet/wallet-context'
import { AuthStoreProvider } from './middleware/firebase/auth-store'
import { createLogger } from 'src/lib/logger'
import DashboardPage from './pages/dashboard/index'
import CounterPage from './pages/counter/index'
import ProfilePage from './pages/profile/index'
import WalletPage from './pages/splitdo-exchange/index'
import { SessionExpiryNotification } from './components/SessionExpiryNotification'
import { WalletConnectQRModal } from './components/WalletConnectQRModal'

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

const AppContent: Component = () => {
  const [currentPage, setCurrentPage] = createSignal<Page>('dashboard')
  const [isDark, setIsDark] = createSignal(false)
  const [authStore, setAuthStore] = createSignal<ReturnType<typeof import('./middleware/firebase/auth-store').getGlobalAuthStore> | null>(null)
  const middleware = useMiddleware()

  // QR Modal state from wallet context
  const qrModal = useWalletConnectQRModal()

  // Detect theme from localStorage and DOM class (shared with Astro app)
  onMount(() => {
    if (typeof window === 'undefined') return
    
    const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
      (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches) ||
      document.documentElement.classList.contains('dark')
    
    setIsDark(isDarkMode)
    
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
    
    if (['dashboard', 'counter', 'profile', 'splitdo-exchange'].includes(pageName)) {
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
    
    if (['dashboard', 'counter', 'profile', 'splitdo-exchange'].includes(pageName)) {
      setCurrentPage(pageName as Page)
    }
  })

  const updateTheme = (dark: boolean) => {
    setIsDark(dark)
    localStorage.setItem('darkMode', dark.toString())
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const renderPage = () => {
    const page = currentPage()
    switch (page) {
      case 'dashboard':
        return <DashboardPage isDark={isDark()} />
      case 'counter':
        return <CounterPage isDark={isDark()} />
      case 'profile':
        return <ProfilePage isDark={isDark()} />
      case 'splitdo-exchange':
        return <WalletPage isDark={isDark()} />
      default:
        return <DashboardPage isDark={isDark()} />
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

      // Setup Firebase auth middleware
      const authSetup = setupAuthMiddleware({
        protectedRoutes: ['/app'],
        publicOnlyRoutes: ['/auth/sign-in', '/auth/sign-up'],
        loginRoute: '/auth/sign-in',
        dashboardRoute: '/app/dashboard',
      });

      // Initialize auth middleware
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
      createEffect(() => {
        const isAuthenticated = authStoreInstance.isAuthenticated();
        const tokenStatus = authStoreInstance.tokenStatus();

        logger.debug('Auth state changed', {
          isAuthenticated,
          tokenStatus,
          currentRoute: middleware.currentRoute(),
        });

        // Handle auth state changes
        authSetup.middleware.onAuthStateChange(isAuthenticated);
        authSetup.middleware.onTokenStatusChange(tokenStatus);
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
    <div class={`h-screen flex overflow-hidden ${isDark() ? 'bg-zinc-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <Navigation
        currentPage={currentPage()}
        onPageChange={handlePageChange}
        isDark={isDark()}
      />

      {/* Main Content */}
      <main class={`flex-1 overflow-auto ml-64 transition-all duration-300`}>
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
            isDark={isDark()}
          />
        );
      })()}

      {/* WalletConnect QR Modal */}
      <WalletConnectQRModal
        isDark={isDark()}
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
    </div>
  )
}

const App: Component<{ firebaseToken?: string }> = (props) => {
  return (
    <MiddlewareProvider>
      <AuthStoreProvider initialToken={props.firebaseToken}>
        <WalletProvider firebaseToken={props.firebaseToken}>
          <AppContent />
        </WalletProvider>
      </AuthStoreProvider>
    </MiddlewareProvider>
  )
}

export default App
