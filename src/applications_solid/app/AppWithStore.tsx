import {
  createSignal,
  createEffect,
  onMount
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
import { initializeWalletStore } from 'src/lib/wallet/wallet-reactive-store'
import DashboardPage from './pages/dashboard/index'
import ProfilePage from './pages/profile/index'
import WalletPageReactive from './pages/wallet/WalletPageReactive'

const AppContent: Component = () => {
  const [currentPage, setCurrentPage] = createSignal<Page>('dashboard')
  const [isDark, setIsDark] = createSignal(false)
  const [isSidebarOpen, setIsSidebarOpen] = createSignal(false)
  const middleware = useMiddleware()

  // Enhanced theme synchronization with Astro layout system
  onMount(() => {
    if (typeof window === 'undefined') return

    // Initial theme detection
    const detectTheme = () => {
      return localStorage.getItem('darkMode') === 'true' ||
        (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches) ||
        document.documentElement.classList.contains('dark')
    }

    setIsDark(detectTheme())

    // Watch for changes to the dark class on document.documentElement (from Layout.astro)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const newIsDark = document.documentElement.classList.contains('dark')
          console.log('🔄 Theme changed from Layout.astro:', newIsDark ? 'dark' : 'light')
          setIsDark(newIsDark)
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    // Also listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'darkMode') {
        const newIsDark = e.newValue === 'true'
        setIsDark(newIsDark)
        if (newIsDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Initialize page from URL pathname
    const pathname = window.location.pathname
    const pathSegments = pathname.split('/').filter(Boolean)
    const rootPath = 'app';
    const pageName = pathSegments.length >= 2 && pathSegments[0] === rootPath
      ? pathSegments[1]
      : 'dashboard'

    if (['dashboard', 'profile', 'splitdo-exchange'].includes(pageName)) {
      setCurrentPage(pageName as Page)
    }

    // Cleanup
    return () => {
      observer.disconnect()
      window.removeEventListener('storage', handleStorageChange)
    }
  })

  // Handle page changes with middleware navigation
  const handlePageChange = (page: Page) => {
    const newPath = `/app/${page}`
    middleware.navigate(newPath)
    setCurrentPage(page)
    setIsSidebarOpen(false) // Close sidebar on mobile after navigation
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
      case 'profile':
        return <ProfilePage isDark={isDark()} />
      case 'splitdo-exchange':
        return <WalletPageReactive isDark={isDark()} />
      default:
        return <DashboardPage isDark={isDark()} />
    }
  }

  // Setup middleware
  onMount(() => {
    // Add authentication middleware
    middleware.beforeNavigate(authMiddleware())

    // Add logging middleware
    middleware.afterNavigate(loggingMiddleware())

    // Example: Add custom middleware
    middleware.beforeNavigate((from, to) => {
      console.log(`Navigating from ${from} to ${to}`)
      return true // Allow navigation
    })
  })

  return (
    <div class="h-screen flex overflow-hidden" style="background: var(--crypto-bg-primary); color: var(--crypto-text-primary);">
      <Navigation
        currentPage={currentPage()}
        onPageChange={handlePageChange}
        isDark={isDark()}
        updateTheme={updateTheme}
        isOpen={isSidebarOpen()}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <main class="flex-1 overflow-auto lg:ml-64 transition-all duration-300">
        {/* Mobile Header with Hamburger */}
        <div class="lg:hidden sticky top-0 z-30 flex items-center justify-between p-4 border-b" style="background: var(--crypto-bg-secondary); border-color: var(--crypto-border);">
          <button
            onClick={() => setIsSidebarOpen(true)}
            class="p-2 rounded-md transition-colors"
            style="color: var(--crypto-text-secondary);"
            onMouseEnter={(e) => e.target.style.background = 'var(--crypto-bg-tertiary)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 class="text-lg font-bold" style="color: var(--crypto-text-primary);">
            {currentPage().charAt(0).toUpperCase() + currentPage().slice(1)}
          </h1>
          <div class="w-10" /> {/* Spacer for alignment */}
        </div>

        {renderPage()}
      </main>
    </div>
  )
}

const AppWithStore: Component<{ firebaseToken?: string }> = (props) => {
  // Initialize reactive wallet store with Firebase token
  onMount(() => {
    console.log('[AppWithStore] Initializing reactive wallet store with Firebase token:', props.firebaseToken ? 'Present' : 'None');
    initializeWalletStore(props.firebaseToken);
  });

  return (
    <MiddlewareProvider>
      <AppContent />
    </MiddlewareProvider>
  )
}

export default AppWithStore