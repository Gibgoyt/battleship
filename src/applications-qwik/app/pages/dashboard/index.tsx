/** @jsxImportSource @builder.io/qwik */
import { component$ } from '@builder.io/qwik'

interface DashboardPageProps {
  isDark: boolean
}

export default component$<DashboardPageProps>(({ isDark }) => {
  return (
    <div class="space-y-8">
      <div>
        <h1 class={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Dashboard
        </h1>
        <p class={`mt-2 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Welcome back, Ahmed! Here's an overview of your documentation status.
        </p>
      </div>

      {/* Key Metrics */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
          <div class="flex items-center justify-between">
            <div>
              <p class={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Repositories Documented</p>
              <p class={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>5</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
              </svg>
            </div>
          </div>
        </div>
        <div class={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
          <div class="flex items-center justify-between">
            <div>
              <p class={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Active Tasks</p>
              <p class={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>2</p>
            </div>
            <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>
        <div class={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
          <div class="flex items-center justify-between">
            <div>
              <p class={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Files Analyzed</p>
              <p class={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>1,482</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* In-Progress Documentation */}
      <div class={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
        <h2 class={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          In-Progress Documentation
        </h2>
        <div class="space-y-4">
          {[ { name: 'ai-doc-generator', progress: 75 }, { name: 'secure-oauth-service', progress: 30 } ].map(task => (
            <div>
              <div class="flex justify-between items-center mb-1">
                <p class={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{task.name}</p>
                <p class={`text-sm font-mono ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{task.progress}%</p>
              </div>
              <div class={`w-full rounded-full h-2.5 ${isDark ? 'bg-zinc-700' : 'bg-gray-200'}`}>
                <div class="bg-blue-600 h-2.5 rounded-full" style={{ width: `${task.progress}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
          <h2 class={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Quick Actions
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button class={`p-4 rounded-lg shadow-md transition-all duration-200 text-left ${isDark ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-gray-50 hover:bg-gray-100'}`}>
              <svg class="w-8 h-8 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              <p class="font-medium">New Documentation</p>
            </button>
            <button class={`p-4 rounded-lg shadow-md transition-all duration-200 text-left ${isDark ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-gray-50 hover:bg-gray-100'}`}>
              <svg class="w-8 h-8 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
              <p class="font-medium">Manage Repositories</p>
            </button>
          </div>
        </div>
        <div class={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
          <h2 class={`text-xl font-bold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Recent Activity
          </h2>
          <div class="space-y-4">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div class="flex-1">
                <p class={`${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Finished documenting <span class="font-medium">cloudflare-frontend</span></p>
                <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  2 minutes ago
                </p>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <div class="flex-1">
                <p class={`${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Started documenting <span class="font-medium">secure-oauth-service</span></p>
                <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  15 minutes ago
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
