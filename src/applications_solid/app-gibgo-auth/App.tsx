import { createSignal, onMount } from 'solid-js'
import type { Component } from 'solid-js'
import "src/styles/global.css"

type Page = 'hello' | 'bye'

const HelloPage: Component = () => {
  return (
    <div class="p-8">
      <h1 class="text-3xl font-bold mb-4">Hello Page</h1>
      <p class="text-lg">Welcome! This is the Hello page.</p>
    </div>
  )
}

const ByePage: Component = () => {
  return (
    <div class="p-8">
      <h1 class="text-3xl font-bold mb-4">Bye Page</h1>
      <p class="text-lg">Goodbye! This is the Bye page.</p>
    </div>
  )
}

const Navbar: Component<{ currentPage: Page; onPageChange: (page: Page) => void }> = (props) => {
  return (
    <nav class="bg-indigo-600 text-white px-6 py-4 shadow-lg">
      <div class="flex items-center gap-8">
        <span class="text-xl font-bold">Gibgo Auth</span>
        <div class="flex gap-4">
          <button
            class={`px-4 py-2 rounded transition-colors ${
              props.currentPage === 'hello'
                ? 'bg-white text-indigo-600 font-semibold'
                : 'hover:bg-indigo-500'
            }`}
            onClick={() => props.onPageChange('hello')}
          >
            Hello
          </button>
          <button
            class={`px-4 py-2 rounded transition-colors ${
              props.currentPage === 'bye'
                ? 'bg-white text-indigo-600 font-semibold'
                : 'hover:bg-indigo-500'
            }`}
            onClick={() => props.onPageChange('bye')}
          >
            Bye
          </button>
        </div>
      </div>
    </nav>
  )
}

const App: Component = () => {
  const [currentPage, setCurrentPage] = createSignal<Page>('hello')

  onMount(() => {
    if (typeof window === 'undefined') return

    // Initialize page from URL pathname
    const pathname = window.location.pathname
    const pathSegments = pathname.split('/').filter(Boolean)
    const pageName = pathSegments.length >= 2 && pathSegments[0] === 'app-gibgo-auth'
      ? pathSegments[1]
      : 'hello'

    if (['hello', 'bye'].includes(pageName)) {
      setCurrentPage(pageName as Page)
    }

    // Listen for browser back/forward
    const handlePopState = () => {
      const pathname = window.location.pathname
      const pathSegments = pathname.split('/').filter(Boolean)
      const pageName = pathSegments.length >= 2 && pathSegments[0] === 'app-gibgo-auth'
        ? pathSegments[1]
        : 'hello'

      if (['hello', 'bye'].includes(pageName)) {
        setCurrentPage(pageName as Page)
      }
    }

    window.addEventListener('popstate', handlePopState)
  })

  const handlePageChange = (page: Page) => {
    setCurrentPage(page)
    const newPath = `/app-gibgo-auth/${page}`
    window.history.pushState({}, '', newPath)
  }

  const renderPage = () => {
    switch (currentPage()) {
      case 'hello':
        return <HelloPage />
      case 'bye':
        return <ByePage />
      default:
        return <HelloPage />
    }
  }

  return (
    <div class="min-h-screen bg-gray-100">
      <Navbar currentPage={currentPage()} onPageChange={handlePageChange} />
      <main>
        {renderPage()}
      </main>
    </div>
  )
}

export default App
