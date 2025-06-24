/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal, $, useVisibleTask$ } from '@builder.io/qwik'
import DashboardPage from './pages/dashboard/index.tsx'
import CounterPage from './pages/counter/index.tsx'

// Define valid routes for type safety
type ValidRoute = '/' | '/dashboard' | '/counter'
type Theme = 'light' | 'dark'

interface AppProps {
  initialRoute: ValidRoute
  initialTheme: Theme
  initialSidebarOpen: boolean
  initialIsMobile: boolean
}

export const App = component$<AppProps>(({ initialRoute, initialTheme, initialSidebarOpen, initialIsMobile }) => {
  const currentPath = useSignal(initialRoute)
  const isDark = useSignal(initialTheme === 'dark')
  const sidebarOpen = useSignal(initialSidebarOpen)
  const isMobile = useSignal(initialIsMobile)

  // Client-side navigation
  const navigate = $((path: string) => {
    currentPath.value = path as ValidRoute
    if (typeof window !== 'undefined') {
      const fullPath = `/settings${path}`
      window.history.pushState({}, '', fullPath)
    }

    // Close sidebar on mobile after navigation
    if (isMobile.value) {
      sidebarOpen.value = false
    }
  })

  // Toggle sidebar
  const toggleSidebar = $(() => {
    sidebarOpen.value = !sidebarOpen.value
    // Save sidebar state to cookie (mobile and desktop behavior)
    if (isMobile.value) {
      // On mobile, only save 'true' if user explicitly opens it
      // Don't save 'false' to let it default to closed on reload
      if (sidebarOpen.value) {
        document.cookie = `sidebarOpen=true; path=/; max-age=${60 * 60 * 24 * 365}` // 1 year
      } else {
        // Clear the cookie when closing on mobile
        document.cookie = `sidebarOpen=; path=/; max-age=0`
      }
    } else {
      // On desktop, save both true and false states
      document.cookie = `sidebarOpen=${sidebarOpen.value}; path=/; max-age=${60 * 60 * 24 * 365}` // 1 year
    }
  })

  // Close sidebar when clicking outside on mobile
  const closeSidebar = $(() => {
    if (isMobile.value) {
      sidebarOpen.value = false
    }
  })

  // Initialize URL synchronization and responsive behavior
  useVisibleTask$(() => {
    if (typeof window !== 'undefined') {
      // Check if mobile on resize (for responsive behavior)
      const checkMobile = () => {
        isMobile.value = window.innerWidth < 1024 // lg breakpoint
      }

      window.addEventListener('resize', checkMobile)

      // URL synchronization
      const currentUrl = window.location.pathname
      const expectedPrefix = `/settings`
      if (currentUrl.startsWith(expectedPrefix)) {
        const urlPath = currentUrl.slice(expectedPrefix.length) || '/dashboard'
        if (urlPath !== currentPath.value) {
          currentPath.value = urlPath as ValidRoute
        }
      }

      return () => {
        window.removeEventListener('resize', checkMobile)
      }
    }
  })


  const updateTheme = $((dark: boolean) => {
    isDark.value = dark
    
    // Save theme preference to both localStorage and cookie
    localStorage.setItem('darkMode', dark.toString())
    document.cookie = `theme=${dark ? 'dark' : 'light'}; path=/; max-age=${60 * 60 * 24 * 365}` // 1 year
    
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  })

  const toggleTheme = $(() => {
    updateTheme(!isDark.value)
  })

  // Navigation items
  const navigationItems = [
    {
      id: 'dashboard',
      path: '/dashboard',
      label: 'Dashboard',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    },
    {
      id: 'counter',
      path: '/counter',
      label: 'Counter',
      icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'
    }
  ]

  return (
    <div class={`min-h-screen flex ${isDark.value ? 'bg-zinc-900 text-gray-100' : 'bg-gray-50'}`}>
      {/* Mobile Backdrop */}
      {isMobile.value && sidebarOpen.value && (
        <div
          class="fixed inset-0 z-40 lg:hidden"
          onClick$={closeSidebar}
          style="backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); background-color: rgba(0, 0, 0, 0.3);"
        />
      )}

      {/* Sidebar */}
      <div class={`w-64 min-h-screen fixed left-0 top-0 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
        sidebarOpen.value ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 ${
        isDark.value ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'
      } border-r shadow-lg ${
        !sidebarOpen.value && !isMobile.value ? 'lg:w-16' : 'lg:w-64'
      }`}>
        {/* Header */}
        <div class={`p-6 border-b ${isDark.value ? 'border-zinc-700' : 'border-gray-200'}`}>
          <div class="flex items-center justify-between">
            <div class={`flex items-center space-x-3 ${!sidebarOpen.value && !isMobile.value ? 'lg:justify-center lg:space-x-0' : ''}`}>
              <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h1 class={`text-lg font-bold ${isDark.value ? 'text-gray-100' : 'text-gray-800'} ${
                !sidebarOpen.value && !isMobile.value ? 'lg:hidden' : ''
              }`}>Settings</h1>
            </div>
            <div class={`flex items-center gap-2 ${!sidebarOpen.value && !isMobile.value ? 'lg:hidden' : ''}`}>
              <button
                onClick$={toggleTheme}
                class={`p-2 rounded-lg transition-colors ${
                  isDark.value
                    ? 'bg-zinc-700 hover:bg-zinc-600 text-yellow-400'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title="Toggle theme"
              >
                {isDark.value ? (
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                ) : (
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <a
            href="/app"
            class={`flex items-center gap-2 mt-4 px-3 py-2 rounded-lg transition-colors text-sm ${
              isDark.value
                ? 'bg-zinc-700 hover:bg-zinc-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            } ${!sidebarOpen.value && !isMobile.value ? 'lg:justify-center lg:px-2' : ''}`}
          >
            <span>←</span>
            <span class={`font-medium ${!sidebarOpen.value && !isMobile.value ? 'lg:hidden' : ''}`}>
              Back to App
            </span>
          </a>
        </div>

        {/* Navigation */}
        <nav class="p-4">
          <div class="space-y-1">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick$={() => navigate(item.path)}
                class={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 text-left ${
                  currentPath.value === item.path
                    ? 'bg-blue-600 text-white shadow-md'
                    : isDark.value
                      ? 'text-gray-300 hover:text-blue-400 hover:bg-zinc-700'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                } ${!sidebarOpen.value && !isMobile.value ? 'lg:justify-center lg:px-2' : ''}`}
                title={!sidebarOpen.value && !isMobile.value ? item.label : ''}
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon}></path>
                </svg>
                <span class={!sidebarOpen.value && !isMobile.value ? 'lg:hidden' : ''}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div class={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarOpen.value || isMobile.value ? 'lg:ml-64' : 'lg:ml-16'
      }`}>
        {/* Mobile Header */}
        <div class={`lg:hidden sticky top-0 z-30 ${isDark.value ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border-b px-4 py-3 flex items-center justify-between`}>
          <button
            onClick$={toggleSidebar}
            class={`p-2 rounded-lg transition-colors ${
              isDark.value
                ? 'bg-zinc-700 hover:bg-zinc-600 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <h1 class={`text-lg font-bold ${isDark.value ? 'text-gray-100' : 'text-gray-800'}`}>Settings</h1>
          </div>
          <button
            onClick$={toggleTheme}
            class={`p-2 rounded-lg transition-colors ${
              isDark.value
                ? 'bg-zinc-700 hover:bg-zinc-600 text-yellow-400'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {isDark.value ? (
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            ) : (
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
              </svg>
            )}
          </button>
        </div>

        {/* Desktop Sidebar Toggle */}
        <button
          onClick$={toggleSidebar}
          class={`hidden lg:block fixed top-4 z-40 p-2 rounded-lg transition-all duration-300 ${
            sidebarOpen.value ? 'left-60' : 'left-12'
          } ${
            isDark.value
              ? 'bg-zinc-700 hover:bg-zinc-600 text-gray-300 border-zinc-600'
              : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-300'
          } border shadow-md`}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={sidebarOpen.value ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M9 5l7 7-7 7"}></path>
          </svg>
        </button>

        <main class="p-4 lg:p-8">
          {(currentPath.value === '/dashboard' || currentPath.value === '/') && (
            <DashboardPage isDark={isDark.value} />
          )}

          {currentPath.value === '/counter' && (
            <CounterPage isDark={isDark.value} />
          )}
        </main>
      </div>
    </div>
  )
})