/** @jsxImportSource @builder.io/qwik */
import { component$ } from '@builder.io/qwik'

interface ConnectPageProps {
  isDark: boolean
}

export default component$<ConnectPageProps>(({ isDark }) => {
  return (
    <div class="space-y-8">
      <div class="text-center">
        <h1 class={`text-4xl font-bold tracking-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Connect Your GitHub Account
        </h1>
        <p class={`mt-4 max-w-2xl mx-auto text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Securely connect your GitHub account to let our AI analyze your repositories and generate comprehensive documentation.
        </p>
      </div>

      <div class={`max-w-2xl mx-auto rounded-2xl border ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} shadow-lg`}>
        <div class="p-8">
          <div class="flex items-center gap-6">
            <div class={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-zinc-700' : 'bg-gray-100'}`}>
              <svg class="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.492.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.378.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.943.359.308.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="flex-1">
              <h2 class={`text-xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                GitHub Authentication
              </h2>
              <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                We use OAuth 2.0 with PKCE for a secure, passwordless connection. We only request permissions to read your repository metadata and content.
              </p>
            </div>
          </div>
        </div>
        <div class={`px-8 py-6 border-t rounded-b-2xl ${isDark ? 'bg-zinc-900/50 border-zinc-700' : 'bg-gray-50 border-gray-200'}`}>
          <button class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.492.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.378.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.943.359.308.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clip-rule="evenodd" />
            </svg>
            <span>Connect with GitHub</span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto pt-8">
        <div class="flex gap-4">
          <svg class={`w-8 h-8 flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
          <div>
            <h3 class={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Secure by Design</h3>
            <p class={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Your credentials are never stored. We use short-lived, encrypted tokens to communicate with the GitHub API.</p>
          </div>
        </div>
        <div class="flex gap-4">
          <svg class={`w-8 h-8 flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h3 class={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Fine-Grained Control</h3>
            <p class={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>You choose which repositories the application can access. You can revoke access at any time from your GitHub settings.</p>
          </div>
        </div>
        <div class="flex gap-4">
          <svg class={`w-8 h-8 flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          <div>
            <h3 class={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Fast & Efficient</h3>
            <p class={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Our optimized process quickly analyzes your codebase to generate documentation without impacting your workflow.</p>
          </div>
        </div>
      </div>
    </div>
  )
})
