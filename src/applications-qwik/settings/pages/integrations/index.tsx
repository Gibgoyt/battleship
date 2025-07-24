/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal, $ } from '@builder.io/qwik'

interface IntegrationsPageProps {
  isDark: boolean
}

export default component$<IntegrationsPageProps>(({ isDark }) => {
  const isConnecting = useSignal(false)
  const error = useSignal('')

  const connectGitHub = $(async () => {
    if (isConnecting.value) return

    isConnecting.value = true
    error.value = ''

    try {
      // Get Cognito token from cookie
      const getCookieValue = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };

      const cognitoToken = getCookieValue('cognito-auth-token');

      if (!cognitoToken) {
        throw new Error('No authentication token found. Please sign in again.')
      }

      const response = await fetch('https://192.168.0.6:3000/api/v1/integrations/github/initiate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cognitoToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.oauth_url) {
        // Open GitHub OAuth in new tab
        window.open(data.oauth_url, '_blank')
      } else {
        throw new Error(data.message || 'Failed to initiate GitHub connection')
      }
    } catch (err) {
      console.error('GitHub connection failed:', err)
      error.value = err instanceof Error ? err.message : 'Failed to connect to GitHub'
    } finally {
      isConnecting.value = false
    }
  })

  return (
    <div class="space-y-8">
      <div>
        <h1 class={`text-3xl font-bold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Integrations
        </h1>
        <p class={`mt-2 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Connect external services to enhance your DocForge experience
        </p>
      </div>

      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* GitHub Integration Card */}
        <div class={`rounded-xl border p-6 ${
          isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'
        } shadow-sm hover:shadow-md transition-shadow`}>
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-4">
              <div class={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-zinc-700' : 'bg-gray-100'
              }`}>
                <svg class="w-6 h-6 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                  <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.492.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.378.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.943.359.308.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clip-rule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 class={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                  GitHub
                </h3>
                <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Connect your repositories
                </p>
              </div>
            </div>
          </div>

          <p class={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Securely connect your GitHub account to analyze repositories and generate comprehensive documentation.
          </p>

          <div class="mt-6">
            <button
              onClick$={connectGitHub}
              disabled={isConnecting.value}
              class={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                isConnecting.value
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
              }`}
            >
              {isConnecting.value ? (
                <>
                  <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.492.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.378.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.943.359.308.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clip-rule="evenodd" />
                  </svg>
                  <span>Connect GitHub</span>
                </>
              )}
            </button>
          </div>

          {error.value && (
            <div class={`mt-4 p-3 rounded-lg ${
              isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
            }`}>
              <p class={`text-sm ${isDark ? 'text-red-400' : 'text-red-800'}`}>
                {error.value}
              </p>
            </div>
          )}
        </div>

        {/* Placeholder for future integrations */}
        <div class={`rounded-xl border p-6 opacity-60 ${
          isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'
        } shadow-sm`}>
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-4">
              <div class={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-zinc-700' : 'bg-gray-100'
              }`}>
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <div>
                <h3 class={`font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  More Integrations
                </h3>
                <p class={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Coming soon
                </p>
              </div>
            </div>
          </div>

          <p class={`mt-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Additional integrations will be available in future updates.
          </p>

          <div class="mt-6">
            <button
              disabled
              class={`w-full px-4 py-2.5 rounded-lg font-medium ${
                isDark ? 'bg-zinc-700 text-zinc-500' : 'bg-gray-200 text-gray-400'
              } cursor-not-allowed`}
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>

      <div class={`rounded-xl border p-6 ${
        isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'
      }`}>
        <div class="flex gap-4">
          <svg class={`w-6 h-6 flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h3 class={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-900'}`}>
              About Integrations
            </h3>
            <p class={`mt-1 text-sm ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
              Integrations allow DocForge to access your external services securely. We use OAuth 2.0 for authentication and only request the minimum permissions needed. You can disconnect any integration at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})