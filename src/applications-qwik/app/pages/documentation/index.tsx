/** @jsxImportSource @builder.io/qwik */
import { component$ } from '@builder.io/qwik'

interface DocumentationData {
  id: number
  repoName: string
  status: string
  lastUpdated: string
  url: string
}

interface DocumentationPageProps {
  isDark: boolean
  data?: DocumentationData[]  // Initial data from catch-all route, mutations handled client-side
}

export default component$<DocumentationPageProps>(({ isDark, data }) => {
  // Initial documentation data loaded once for Cloudflare request optimization
  const documentation = data || []  // Future: real-time updates via client API calls
  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Documentation Status
        </h1>
        <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
          New Documentation
        </button>
      </div>

      <div class={`p-6 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class={`border-b ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
                <th class={`text-left py-3 px-4 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Repository</th>
                <th class={`text-left py-3 px-4 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</th>
                <th class={`text-left py-3 px-4 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Last Updated</th>
                <th class={`text-right py-3 px-4 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documentation.length > 0 ? documentation.map(doc => (
                <tr key={doc.id} class={`border-b ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
                  <td class={`py-4 px-4 font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{doc.repoName}</td>
                  <td class="py-4 px-4">
                    <span class={`px-2 py-1 text-xs font-medium rounded-full ${doc.status === 'Completed' ? (isDark ? 'bg-green-800 text-green-300' : 'bg-green-100 text-green-800') : doc.status === 'In Progress' ? (isDark ? 'bg-yellow-800 text-yellow-300' : 'bg-yellow-100 text-yellow-800') : doc.status === 'Queued' ? (isDark ? 'bg-blue-800 text-blue-300' : 'bg-blue-100 text-blue-800') : (isDark ? 'bg-red-800 text-red-300' : 'bg-red-100 text-red-800')}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td class={`py-4 px-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{new Date(doc.lastUpdated).toLocaleString()}</td>
                  <td class="py-4 px-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <a href={doc.url} class={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                        View
                      </a>
                      <button class={`p-2 rounded-lg transition-colors ${isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} class={`py-12 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <div>
                      <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      <p class="text-lg font-medium mb-2">No documentation found</p>
                      <p class="text-sm">Generate documentation for your repositories to see them here</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
})
