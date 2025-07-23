/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal } from '@builder.io/qwik'

interface RepositoryData {
  id: number
  name: string
  description: string
  language: string
  stargazers_count: number
  private: boolean
  updated_at: string
}

interface RepositoriesPageProps {
  isDark: boolean
  data?: RepositoryData[]  // Initial data from catch-all route, future mutations handled client-side
}

export default component$<RepositoriesPageProps>(({ isDark, data }) => {
  const searchTerm = useSignal('')
  const selectedRepos = useSignal<number[]>([2])  // Future: sync with backend via client API calls

  // Initial repositories data loaded once on catch-all route for Cloudflare optimization
  const repositories = data || []
  
  const filteredRepos = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Select Repositories
        </h1>
        <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M4 12h16M4 20h16"></path>
          </svg>
          <span>Start Documentation</span>
        </button>
      </div>

      <div class={`p-6 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
        <div class="flex items-center justify-between mb-4">
          <div class="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search repositories..."
              class={`w-full pl-10 pr-4 py-2 rounded-lg border ${isDark ? 'bg-zinc-700 border-zinc-600 text-gray-200' : 'bg-white border-gray-300 text-gray-800'}`}
              bind:value={searchTerm}
            />
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg class={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
              Filter
            </button>
            <button class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
              Sort
            </button>
          </div>
        </div>

        <div class="space-y-3">
          {filteredRepos.length > 0 ? filteredRepos.map(repo => (
            <div
              key={repo.id}
              class={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${selectedRepos.value.includes(repo.id) ? (isDark ? 'bg-blue-900/50 border-blue-500' : 'bg-blue-50 border-blue-300') : (isDark ? 'bg-zinc-700 border-zinc-600 hover:border-zinc-500' : 'bg-gray-50 border-gray-200 hover:border-gray-300')}`}
              onClick$={() => {
                if (selectedRepos.value.includes(repo.id)) {
                  selectedRepos.value = selectedRepos.value.filter(id => id !== repo.id)
                } else {
                  selectedRepos.value = [...selectedRepos.value, repo.id]
                }
              }}
            >
              <div class="flex items-center gap-4">
                <div class="flex-shrink-0">
                  <input type="checkbox" class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={selectedRepos.value.includes(repo.id)} />
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <h3 class={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{repo.name}</h3>
                    {repo.private && (
                      <span class={`px-2 py-0.5 text-xs font-medium rounded-full ${isDark ? 'bg-zinc-600 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                        Private
                      </span>
                    )}
                  </div>
                  <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1 line-clamp-1`}>{repo.description}</p>
                </div>
                <div class="hidden md:flex items-center gap-6 text-sm">
                  <div class="flex items-center gap-1">
                    <div class={`w-3 h-3 rounded-full ${repo.language === 'TypeScript' ? 'bg-blue-500' : repo.language === 'Python' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    <span>{repo.language}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                    </svg>
                    <span>{repo.stargazers_count}</span>
                  </div>
                  <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )) : (
            <div class={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {repositories.length === 0 ? (
                <div>
                  <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                  </svg>
                  <p class="text-lg font-medium mb-2">No repositories found</p>
                  <p class="text-sm">Connect your GitHub account to see your repositories</p>
                </div>
              ) : (
                <div>
                  <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                  <p class="text-lg font-medium mb-2">No repositories match your search</p>
                  <p class="text-sm">Try adjusting your search terms</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
