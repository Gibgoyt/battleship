/** @jsxImportSource @builder.io/qwik */
import { component$ } from '@builder.io/qwik'

interface AppProps {
  initialRoute?: string
  initialTheme?: string
  initialSidebarOpen?: boolean
  initialIsMobile?: boolean
  initialAppData?: any
}

export const App = component$<AppProps>(() => {
  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      <div class="text-center px-4 max-w-2xl mx-auto">
        {/* SplitDo Logo */}
        <div class="mb-8">
          <div class="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl">
            <div class="w-16 h-16 bg-gradient-to-br from-orange-600 to-teal-600 rounded-xl flex items-center justify-center relative">
              <div class="w-8 h-8 bg-orange-500 rounded-full absolute top-2 left-2"></div>
              <div class="w-10 h-10 bg-teal-500 rounded-lg absolute bottom-1 right-1 transform rotate-45"></div>
            </div>
          </div>
          <h1 class="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-teal-600 bg-clip-text text-transparent">
            SplitDo
          </h1>
        </div>

        {/* Coming Soon Message */}
        <div class="mb-8">
          <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Coming Soon
          </h2>
          <p class="text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            We're building the most advanced expense splitting platform powered by Solana blockchain. 
            Get ready for lightning-fast settlements with minimal fees.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div class="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
              <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span class="font-medium">Development in Progress</span>
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="text-center p-4">
            <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-1">Solana Powered</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300">Lightning-fast blockchain settlements</p>
          </div>

          <div class="text-center p-4">
            <div class="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-1">Smart Splitting</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300">AI-powered expense calculations</p>
          </div>

          <div class="text-center p-4">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-1">Group Management</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300">Advanced expense group controls</p>
          </div>
        </div>

        {/* Back to Home */}
        <div class="pt-6 border-t border-gray-200 dark:border-gray-700">
          <a 
            href="/" 
            class="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-teal-600 text-white rounded-lg hover:from-orange-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            <span>Back to Homepage</span>
          </a>
        </div>
      </div>
    </div>
  )
})