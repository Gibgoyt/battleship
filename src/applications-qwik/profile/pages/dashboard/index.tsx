/** @jsxImportSource @builder.io/qwik */
import { component$ } from '@builder.io/qwik'

interface DashboardPageProps {
  isDark: boolean
}

export default component$<DashboardPageProps>(({ isDark }) => {
  return (
    <div class="min-h-[calc(100vh-2rem)]">
      <div class="mb-8">
        <h1 class={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Dashboard
        </h1>
        <p class={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Welcome to your Qwik application
        </p>
      </div>

      {/* Key Metrics */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</p>
              <p class={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>1,234</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
          </div>
          <p class="text-sm text-green-600">+8% from last week</p>
        </div>

        <div class={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active Sessions</p>
              <p class={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>423</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
          </div>
          <p class="text-sm text-green-600">+15% from yesterday</p>
        </div>

        <div class={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Performance</p>
              <p class={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>98.5%</p>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
          </div>
          <p class="text-sm text-green-600">+2.3% from last hour</p>
        </div>

        <div class={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Errors</p>
              <p class={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>12</p>
            </div>
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <p class="text-sm text-red-600">-25% from last hour</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div class={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-zinc-800' : 'bg-white'} mb-8`}>
        <h2 class={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Recent Activity
        </h2>
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <p class={`${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                System health check completed
              </p>
              <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                2 minutes ago
              </p>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <p class={`${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                New user feedback received
              </p>
              <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                15 minutes ago
              </p>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
              </svg>
            </div>
            <div class="flex-1">
              <p class={`${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Database backup completed
              </p>
              <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                1 hour ago
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button class={`p-4 rounded-lg shadow-md transition-all duration-200 ${
          isDark 
            ? 'bg-zinc-800 hover:bg-zinc-700 text-gray-100' 
            : 'bg-white hover:bg-gray-50 text-gray-900'
        }`}>
          <svg class="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          <p class="font-medium">New Project</p>
        </button>

        <button class={`p-4 rounded-lg shadow-md transition-all duration-200 ${
          isDark 
            ? 'bg-zinc-800 hover:bg-zinc-700 text-gray-100' 
            : 'bg-white hover:bg-gray-50 text-gray-900'
        }`}>
          <svg class="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <p class="font-medium">Reports</p>
        </button>

        <button class={`p-4 rounded-lg shadow-md transition-all duration-200 ${
          isDark 
            ? 'bg-zinc-800 hover:bg-zinc-700 text-gray-100' 
            : 'bg-white hover:bg-gray-50 text-gray-900'
        }`}>
          <svg class="w-8 h-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <p class="font-medium">Settings</p>
        </button>

        <button class={`p-4 rounded-lg shadow-md transition-all duration-200 ${
          isDark 
            ? 'bg-zinc-800 hover:bg-zinc-700 text-gray-100' 
            : 'bg-white hover:bg-gray-50 text-gray-900'
        }`}>
          <svg class="w-8 h-8 text-red-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path>
          </svg>
          <p class="font-medium">Support</p>
        </button>
      </div>
    </div>
  )
})