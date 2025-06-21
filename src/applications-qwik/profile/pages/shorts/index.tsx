/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal, $ } from '@builder.io/qwik'

interface ShortsPageProps {
  isDark: boolean
}

export default component$<ShortsPageProps>(({ isDark }) => {
  const activeTab = useSignal('published')

  const setActiveTab = $((tab: string) => {
    activeTab.value = tab
  })

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          YouTube Shorts
        </h1>
        <button class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">
          Create Short
        </button>
      </div>

      {/* Growth Section */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div class={`p-4 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
          <h3 class={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
            Subscribers
          </h3>
          <p class={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            8.7K
          </p>
          <p class={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            +18% vs last period
          </p>
        </div>

        <div class={`p-4 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
          <h3 class={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
            Short Views
          </h3>
          <p class={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            224K
          </p>
          <p class={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            +25% vs last period
          </p>
        </div>

        <div class={`p-4 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
          <h3 class={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
            Revenue
          </h3>
          <p class={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            $400
          </p>
          <p class={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            +32% vs last period
          </p>
        </div>

        <div class={`p-4 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
          <h3 class={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
            Shorts
          </h3>
          <p class={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            23
          </p>
          <p class={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            +5 this month
          </p>
        </div>

        <div class={`p-4 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
          <h3 class={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
            Avg. Completion
          </h3>
          <p class={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            78%
          </p>
          <p class={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            +5% vs last period
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div class={`border-b ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
        <nav class="flex space-x-8">
          <button
            onClick$={() => setActiveTab('published')}
            class={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab.value === 'published'
                ? 'border-red-500 text-red-600'
                : isDark
                  ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Published Shorts
          </button>
          <button
            onClick$={() => setActiveTab('drafts')}
            class={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab.value === 'drafts'
                ? 'border-red-500 text-red-600'
                : isDark
                  ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Drafts
          </button>
          <button
            onClick$={() => setActiveTab('scheduled')}
            class={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab.value === 'scheduled'
                ? 'border-red-500 text-red-600'
                : isDark
                  ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Scheduled
          </button>
        </nav>
      </div>

      {/* Shorts Grid */}
      <div class="space-y-4">
        {activeTab.value === 'published' && (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[
              { title: '5 Quick YouTube Tips', views: '45.2K', likes: '3.8K', dislikes: '67', comments: '234', shares: '512', duration: '0:58', published: '2 days ago' },
              { title: 'Content Creation Hack', views: '28.9K', likes: '2.1K', dislikes: '23', comments: '145', shares: '298', duration: '0:45', published: '5 days ago' },
              { title: 'Viral Video Strategy', views: '67.3K', likes: '5.2K', dislikes: '89', comments: '356', shares: '743', duration: '0:52', published: '1 week ago' },
              { title: 'Editing on Mobile', views: '19.8K', likes: '1.7K', dislikes: '34', comments: '98', shares: '167', duration: '0:48', published: '1 week ago' },
              { title: 'Trending Audio Tips', views: '38.7K', likes: '3.2K', dislikes: '45', comments: '189', shares: '423', duration: '0:55', published: '2 weeks ago' },
              { title: 'Quick SEO Hack', views: '52.1K', likes: '4.3K', dislikes: '78', comments: '267', shares: '589', duration: '0:42', published: '2 weeks ago' }
            ].map((short, index) => (
              <div key={index} class={`rounded-lg overflow-hidden ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
                <div class={`aspect-[9/16] ${isDark ? 'bg-zinc-700' : 'bg-gray-200'} relative flex items-center justify-center`}>
                  <svg class="w-12 h-12 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <div class="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {short.duration}
                  </div>
                  <div class="absolute top-2 right-2">
                    <div class="bg-red-600 text-white text-xs px-2 py-1 rounded font-medium">
                      SHORTS
                    </div>
                  </div>
                </div>

                <div class="p-4">
                  <h3 class={`font-semibold text-sm mb-2 line-clamp-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {short.title}
                  </h3>
                  <p class={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                    Published {short.published}
                  </p>

                  <div class="space-y-2 text-xs">
                    <div class="flex items-center justify-between">
                      <span class={isDark ? 'text-gray-400' : 'text-gray-600'}>Views</span>
                      <span class={isDark ? 'text-gray-300' : 'text-gray-700'}>{short.views}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class={isDark ? 'text-gray-400' : 'text-gray-600'}>Likes</span>
                      <span class={isDark ? 'text-gray-300' : 'text-gray-700'}>{short.likes}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class={isDark ? 'text-gray-400' : 'text-gray-600'}>Comments</span>
                      <span class={isDark ? 'text-gray-300' : 'text-gray-700'}>{short.comments}</span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class={isDark ? 'text-gray-400' : 'text-gray-600'}>Shares</span>
                      <span class={isDark ? 'text-gray-300' : 'text-gray-700'}>{short.shares}</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 mt-4">
                    <button class={`flex-1 py-2 px-3 rounded text-xs transition-colors ${
                      isDark
                        ? 'bg-zinc-700 hover:bg-zinc-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}>
                      Edit
                    </button>
                    <button class={`p-2 rounded transition-colors ${
                      isDark
                        ? 'bg-zinc-700 hover:bg-zinc-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}>
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab.value === 'drafts' && (
          <div class={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p>No draft shorts found</p>
          </div>
        )}

        {activeTab.value === 'scheduled' && (
          <div class={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p>No scheduled shorts found</p>
          </div>
        )}
      </div>
    </div>
  )
})