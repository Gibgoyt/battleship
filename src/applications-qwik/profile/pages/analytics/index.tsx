/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal, $ } from '@builder.io/qwik'

interface AnalyticsPageProps {
  isDark: boolean
}

export default component$<AnalyticsPageProps>(({ isDark }) => {
  const timeRange = useSignal('30d')

  const setTimeRange = $((range: string) => {
    timeRange.value = range
  })

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Channel Analytics
        </h1>
        <div class="flex items-center gap-2">
          <select
            class={`px-3 py-2 rounded-lg border text-sm ${
              isDark
                ? 'bg-zinc-800 border-zinc-600 text-gray-300'
                : 'bg-white border-gray-300 text-gray-700'
            }`}
            onChange$={(e) => setTimeRange((e.target as HTMLSelectElement).value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d" selected>Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Overall Channel Stats */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class={`p-6 rounded-xl shadow-sm ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
          <div class="flex items-center justify-between">
            <div>
              <p class={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Subscribers
              </p>
              <p class={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                15.2K
              </p>
            </div>
            <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
          </div>
          <p class={`text-xs mt-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            +1,247 new subscribers
          </p>
        </div>

        <div class={`p-6 rounded-xl shadow-sm ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
          <div class="flex items-center justify-between">
            <div>
              <p class={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Views
              </p>
              <p class={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                847K
              </p>
            </div>
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
            </div>
          </div>
          <p class={`text-xs mt-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            +67K views this period
          </p>
        </div>

        <div class={`p-6 rounded-xl shadow-sm ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
          <div class="flex items-center justify-between">
            <div>
              <p class={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Watch Time
              </p>
              <p class={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                5.7K hrs
              </p>
            </div>
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <p class={`text-xs mt-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            +458 hrs this period
          </p>
        </div>

        <div class={`p-6 rounded-xl shadow-sm ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
          <div class="flex items-center justify-between">
            <div>
              <p class={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Revenue
              </p>
              <p class={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                $3,247
              </p>
            </div>
            <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
          </div>
          <p class={`text-xs mt-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            +$487 this period
          </p>
        </div>
      </div>

      {/* Subscriber Balance */}
      <div class={`p-6 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
        <h3 class={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Subscriber Balance
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center">
            <div class="flex items-center justify-center mb-2">
              <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
            </div>
            <p class={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-1`}>
              1,456
            </p>
            <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Subscribers Gained
            </p>
          </div>

          <div class="text-center">
            <div class="flex items-center justify-center mb-2">
              <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6"></path>
                </svg>
              </div>
            </div>
            <p class={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-1`}>
              209
            </p>
            <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Subscribers Lost
            </p>
          </div>

          <div class="text-center">
            <div class="flex items-center justify-center mb-2">
              <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              </div>
            </div>
            <p class={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-1`}>
              7
            </p>
            <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Videos Published
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Placeholder */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class={`p-6 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
          <h3 class={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Views Over Time
          </h3>
          <div class={`h-64 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-gray-100'} flex items-center justify-center`}>
            <div class="text-center">
              <svg class={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Chart visualization coming soon
              </p>
            </div>
          </div>
        </div>

        <div class={`p-6 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
          <h3 class={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Subscriber Growth
          </h3>
          <div class={`h-64 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-gray-100'} flex items-center justify-center`}>
            <div class="text-center">
              <svg class={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
              <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Chart visualization coming soon
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Traffic Sources */}
      <div class={`p-6 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
        <h3 class={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Traffic Sources
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class={`p-4 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-gray-50'}`}>
            <div class="flex items-center gap-3 mb-2">
              <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <div>
                <p class={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  YouTube Search
                </p>
                <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  42.3% of views
                </p>
              </div>
            </div>
            <p class={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              358K views
            </p>
          </div>

          <div class={`p-4 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-gray-50'}`}>
            <div class="flex items-center gap-3 mb-2">
              <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                </svg>
              </div>
              <div>
                <p class={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  External
                </p>
                <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  28.7% of views
                </p>
              </div>
            </div>
            <p class={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              243K views
            </p>
          </div>

          <div class={`p-4 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-gray-50'}`}>
            <div class="flex items-center gap-3 mb-2">
              <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </div>
              <div>
                <p class={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  Suggested Videos
                </p>
                <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  19.2% of views
                </p>
              </div>
            </div>
            <p class={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              163K views
            </p>
          </div>

          <div class={`p-4 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-gray-50'}`}>
            <div class="flex items-center gap-3 mb-2">
              <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011 1v6a1 1 0 01-1 1H7a1 1 0 01-1-1V2a1 1 0 011-1m10 0V4a1 1 0 01-1 1H8a1 1 0 01-1-1V2"></path>
                </svg>
              </div>
              <div>
                <p class={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  Browse Features
                </p>
                <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  9.8% of views
                </p>
              </div>
            </div>
            <p class={`text-lg font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              83K views
            </p>
          </div>
        </div>
      </div>

      {/* Top Performing Videos */}
      <div class={`p-6 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
        <h3 class={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Top Performing Videos ({timeRange.value})
        </h3>
        <div class="space-y-3">
          {[
            { title: 'How to Create Engaging YouTube Content', views: '45.2K', watchTime: '4.2h', ctr: '8.3%', avgView: '6:42' },
            { title: 'YouTube SEO Tips for 2024', views: '38.7K', watchTime: '3.1h', ctr: '6.7%', avgView: '4:52' },
            { title: 'Building Your YouTube Channel Brand', views: '52.1K', watchTime: '5.8h', ctr: '9.1%', avgView: '7:15' },
            { title: 'Advanced Video Editing Techniques', views: '29.3K', watchTime: '3.9h', ctr: '5.4%', avgView: '8:01' }
          ].map((video, index) => (
            <div key={index} class={`p-4 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-gray-50'}`}>
              <div class="flex items-center gap-4">
                <div class="flex-shrink-0">
                  <div class={`w-20 h-12 rounded ${isDark ? 'bg-zinc-600' : 'bg-gray-300'} flex items-center justify-center`}>
                    <svg class="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>

                <div class="flex-1 min-w-0">
                  <h4 class={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'} truncate`}>
                    {video.title}
                  </h4>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                    <div>
                      <span class={`block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Views</span>
                      <span class={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{video.views}</span>
                    </div>
                    <div>
                      <span class={`block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Watch time</span>
                      <span class={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{video.watchTime}</span>
                    </div>
                    <div>
                      <span class={`block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>CTR</span>
                      <span class={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{video.ctr}</span>
                    </div>
                    <div>
                      <span class={`block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Avg. view duration</span>
                      <span class={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{video.avgView}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})