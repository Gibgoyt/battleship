/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal } from '@builder.io/qwik'

interface SettingsPageProps {
  isDark: boolean
}

export default component$<SettingsPageProps>(({ isDark }) => {
  const activeTab = useSignal('profile')

  return (
    <div class="space-y-6">
      <h1 class={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
        Settings
      </h1>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div class="lg:col-span-1">
          <div class={`p-4 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-white'} border ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
            <nav class="space-y-1">
              <button
                onClick$={() => activeTab.value = 'profile'}
                class={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab.value === 'profile'
                    ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700')
                    : (isDark ? 'hover:bg-zinc-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600')
                }`}>
                Profile
              </button>
              <button
                onClick$={() => activeTab.value = 'github'}
                class={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab.value === 'github'
                    ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700')
                    : (isDark ? 'hover:bg-zinc-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600')
                }`}>
                GitHub Integration
              </button>
              <button
                onClick$={() => activeTab.value = 'billing'}
                class={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab.value === 'billing'
                    ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700')
                    : (isDark ? 'hover:bg-zinc-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600')
                }`}>
                Billing
              </button>
              <button
                onClick$={() => activeTab.value = 'api'}
                class={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab.value === 'api'
                    ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700')
                    : (isDark ? 'hover:bg-zinc-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600')
                }`}>
                API Keys
              </button>
            </nav>
          </div>
        </div>

        <div class="lg:col-span-3">
          <div class={`p-6 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-white'} border ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
            {activeTab.value === 'profile' && (
              <div class="space-y-6">
                <h2 class={`text-xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>User Profile</h2>
                <div>
                  <label class={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Name</label>
                  <input type="text" value="Ahmed" class={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${isDark ? 'bg-zinc-700 border-zinc-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`} />
                </div>
                <div>
                  <label class={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                  <input type="email" value="ahmed@example.com" class={`mt-1 block w-full rounded-md border-gray-300 shadow-sm ${isDark ? 'bg-zinc-700 border-zinc-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`} />
                </div>
                <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">Save Changes</button>
              </div>
            )}
            {activeTab.value === 'github' && (
              <div class="space-y-6">
                <h2 class={`text-xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>GitHub Integration</h2>
                <div class={`p-4 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-gray-100'} flex items-center justify-between`}>
                  <div class="flex items-center gap-3">
                    <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p class={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Connected as @ahmed-dev</p>
                  </div>
                  <button class={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-100 hover:bg-red-200 text-red-800'}`}>
                    Disconnect
                  </button>
                </div>
                <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  You have granted access to 7 repositories. You can manage repository access from the Repositories page or from your GitHub account settings.
                </p>
              </div>
            )}
            {activeTab.value === 'billing' && (
              <div class="space-y-6">
                <h2 class={`text-xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Billing</h2>
                <div class={`p-4 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-gray-100'}`}>
                  <p class={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>You are on the Free plan.</p>
                  <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>You can document up to 3 public repositories.</p>
                </div>
                <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">Upgrade Plan</button>
              </div>
            )}
            {activeTab.value === 'api' && (
              <div class="space-y-6">
                <h2 class={`text-xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>API Keys</h2>
                <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  API access is not available on the Free plan. Upgrade to a paid plan to generate API keys.
                </p>
                <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">Upgrade to Pro</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
