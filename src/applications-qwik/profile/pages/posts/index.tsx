/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal, $ } from '@builder.io/qwik'

interface PostsPageProps {
  isDark: boolean
}

export default component$<PostsPageProps>(({ isDark }) => {
  const activeTab = useSignal('published')

  const setActiveTab = $((tab: string) => {
    activeTab.value = tab
  })

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Long-form Videos
        </h1>
        <button class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">
          Upload Video
        </button>
      </div>

      {/* Growth Section */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div class={`p-4 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
          <h3 class={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
            Subscribers
          </h3>
          <p class={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            15.2K
          </p>
          <p class={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            +12% vs last period
          </p>
        </div>

        <div class={`p-4 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
          <h3 class={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
            Video Views
          </h3>
          <p class={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            623K
          </p>
          <p class={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            +8% vs last period
          </p>
        </div>

        <div class={`p-4 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
          <h3 class={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
            Revenue
          </h3>
          <p class={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            $2,847
          </p>
          <p class={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            +15% vs last period
          </p>
        </div>

        <div class={`p-4 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
          <h3 class={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
            Videos
          </h3>
          <p class={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            47
          </p>
          <p class={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            +3 this month
          </p>
        </div>

        <div class={`p-4 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
          <h3 class={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
            Avg. Watch Time
          </h3>
          <p class={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            6:42
          </p>
          <p class={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            +0:23 vs last period
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
            Published Videos
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

      {/* Video List */}
      <div class="space-y-4">
        {activeTab.value === 'published' && (
          <>
            {[
              { title: 'How to Create Engaging YouTube Content', views: '15.3K', likes: '1.2K', dislikes: '23', comments: '89', shares: '156', duration: '12:34', published: '3 days ago' },
              { title: 'YouTube SEO Tips for 2024', views: '8.7K', likes: '892', dislikes: '12', comments: '67', shares: '98', duration: '8:15', published: '1 week ago' },
              { title: 'Building Your YouTube Channel Brand', views: '23.1K', likes: '2.1K', dislikes: '34', comments: '145', shares: '267', duration: '15:22', published: '2 weeks ago' },
              { title: 'Advanced Video Editing Techniques', views: '12.8K', likes: '1.5K', dislikes: '18', comments: '78', shares: '123', duration: '18:45', published: '3 weeks ago' }
            ].map((video, index) => (
              <div key={index} class={`p-4 rounded-lg border ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
                <div class="flex items-start gap-4">
                  <div class={`w-32 h-20 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-gray-200'} flex items-center justify-center relative`}>
                    <svg class="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    <div class="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                      {video.duration}
                    </div>
                  </div>

                  <div class="flex-1">
                    <h3 class={`font-semibold text-lg mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                      {video.title}
                    </h3>
                    <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                      Published {video.published}
                    </p>

                    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        <span class={isDark ? 'text-gray-300' : 'text-gray-700'}>{video.views} views</span>
                      </div>

                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
                        </svg>
                        <span class={isDark ? 'text-gray-300' : 'text-gray-700'}>{video.likes} likes</span>
                      </div>

                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"></path>
                        </svg>
                        <span class={isDark ? 'text-gray-300' : 'text-gray-700'}>{video.dislikes} dislikes</span>
                      </div>

                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <span class={isDark ? 'text-gray-300' : 'text-gray-700'}>{video.comments} comments</span>
                      </div>

                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                        </svg>
                        <span class={isDark ? 'text-gray-300' : 'text-gray-700'}>{video.shares} shares</span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <button class={`p-2 rounded-lg transition-colors ${
                      isDark
                        ? 'bg-zinc-700 hover:bg-zinc-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}>
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                    <button class={`p-2 rounded-lg transition-colors ${
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
          </>
        )}

        {activeTab.value === 'drafts' && (
          <div class={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p>No draft videos found</p>
          </div>
        )}

        {activeTab.value === 'scheduled' && (
          <div class={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p>No scheduled videos found</p>
          </div>
        )}
      </div>
    </div>
  )
})