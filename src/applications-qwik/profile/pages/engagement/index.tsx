/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal, $ } from '@builder.io/qwik'

interface EngagementPageProps {
  isDark: boolean
}

export default component$<EngagementPageProps>(({ isDark }) => {
  const activeTab = useSignal('overview')

  const setActiveTab = $((tab: string) => {
    activeTab.value = tab
  })

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Engagement Analytics
        </h1>
        <div class="flex items-center gap-2">
          <select class={`px-3 py-2 rounded-lg border text-sm ${
            isDark
              ? 'bg-zinc-800 border-zinc-600 text-gray-300'
              : 'bg-white border-gray-300 text-gray-700'
          }`}>
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Overall Engagement Stats */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class={`p-6 rounded-xl shadow-sm ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
          <div class="flex items-center justify-between">
            <div>
              <p class={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Engagement
              </p>
              <p class={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                24.7K
              </p>
            </div>
            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </div>
          </div>
          <p class={`text-xs mt-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            +18% from last period
          </p>
        </div>

        <div class={`p-6 rounded-xl shadow-sm ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
          <div class="flex items-center justify-between">
            <div>
              <p class={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Engagement Rate
              </p>
              <p class={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                4.8%
              </p>
            </div>
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
          </div>
          <p class={`text-xs mt-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            +0.3% from last period
          </p>
        </div>

        <div class={`p-6 rounded-xl shadow-sm ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
          <div class="flex items-center justify-between">
            <div>
              <p class={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Avg. Watch Time
              </p>
              <p class={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                6:42
              </p>
            </div>
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <p class={`text-xs mt-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            +0:23 from last period
          </p>
        </div>

        <div class={`p-6 rounded-xl shadow-sm ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
          <div class="flex items-center justify-between">
            <div>
              <p class={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Comment Sentiment
              </p>
              <p class={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                89%
              </p>
            </div>
            <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <p class={`text-xs mt-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            +2% positive sentiment
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div class={`border-b ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
        <nav class="flex space-x-8">
          <button
            onClick$={() => setActiveTab('overview')}
            class={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab.value === 'overview'
                ? 'border-red-500 text-red-600'
                : isDark
                  ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick$={() => setActiveTab('comments')}
            class={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab.value === 'comments'
                ? 'border-red-500 text-red-600'
                : isDark
                  ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Comments
          </button>
          <button
            onClick$={() => setActiveTab('interactions')}
            class={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab.value === 'interactions'
                ? 'border-red-500 text-red-600'
                : isDark
                  ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Interactions
          </button>
          <button
            onClick$={() => setActiveTab('sentiment')}
            class={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab.value === 'sentiment'
                ? 'border-red-500 text-red-600'
                : isDark
                  ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sentiment Analysis
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab.value === 'overview' && (
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement Breakdown */}
          <div class={`p-6 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
            <h3 class={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Engagement Breakdown
            </h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span class={isDark ? 'text-gray-300' : 'text-gray-700'}>Likes</span>
                </div>
                <span class={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>18.2K (73%)</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span class={isDark ? 'text-gray-300' : 'text-gray-700'}>Comments</span>
                </div>
                <span class={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>4.8K (19%)</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span class={isDark ? 'text-gray-300' : 'text-gray-700'}>Shares</span>
                </div>
                <span class={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>1.2K (5%)</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span class={isDark ? 'text-gray-300' : 'text-gray-700'}>Dislikes</span>
                </div>
                <span class={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>567 (2%)</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span class={isDark ? 'text-gray-300' : 'text-gray-700'}>Saves</span>
                </div>
                <span class={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>234 (1%)</span>
              </div>
            </div>
          </div>

          {/* Top Performing Content */}
          <div class={`p-6 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
            <h3 class={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Top Performing Content
            </h3>
            <div class="space-y-4">
              {[
                { title: 'How to Create Engaging Content', engagement: '5.2K', rate: '8.3%' },
                { title: 'YouTube SEO Tips', engagement: '3.8K', rate: '6.7%' },
                { title: 'Quick Content Creation Hack', engagement: '4.1K', rate: '9.1%' }
              ].map((item, index) => (
                <div key={index} class="flex items-center gap-3">
                  <div class={`w-12 h-8 rounded ${isDark ? 'bg-zinc-700' : 'bg-gray-200'} flex items-center justify-center`}>
                    <svg class="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                      {item.title}
                    </p>
                    <p class={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {item.engagement} engagements • {item.rate} rate
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab.value === 'comments' && (
        <div class="space-y-6">
          {/* Recent Comments */}
          <div class={`p-6 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
            <h3 class={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Recent Comments
            </h3>
            <div class="space-y-4">
              {[
                { user: 'Sarah M.', comment: 'This video helped me so much! Thank you for the amazing tips.', sentiment: 'positive', video: 'How to Create Engaging Content', time: '2 hours ago' },
                { user: 'Mike R.', comment: 'Could you make a follow-up video about advanced techniques?', sentiment: 'neutral', video: 'YouTube SEO Tips', time: '4 hours ago' },
                { user: 'Alex T.', comment: 'Amazing content as always! Keep up the great work.', sentiment: 'positive', video: 'Quick Content Creation Hack', time: '6 hours ago' },
                { user: 'Jenny L.', comment: 'The audio quality could be better in this one.', sentiment: 'negative', video: 'Behind the Scenes', time: '8 hours ago' }
              ].map((comment, index) => (
                <div key={index} class={`p-4 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-gray-50'}`}>
                  <div class="flex items-start gap-3">
                    <div class={`w-8 h-8 rounded-full ${isDark ? 'bg-zinc-600' : 'bg-gray-300'} flex items-center justify-center`}>
                      <span class={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {comment.user.charAt(0)}
                      </span>
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <span class={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                          {comment.user}
                        </span>
                        <span class={`px-2 py-1 text-xs rounded-full ${
                          comment.sentiment === 'positive'
                            ? 'bg-green-100 text-green-800'
                            : comment.sentiment === 'negative'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {comment.sentiment}
                        </span>
                        <span class={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {comment.time}
                        </span>
                      </div>
                      <p class={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        {comment.comment}
                      </p>
                      <p class={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        on "{comment.video}"
                      </p>
                    </div>
                    <button class={`p-2 rounded-lg transition-colors ${
                      isDark
                        ? 'bg-zinc-600 hover:bg-zinc-500 text-gray-300'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                    }`}>
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab.value === 'interactions' && (
        <div class={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
          </svg>
          <p>Detailed interaction analytics coming soon</p>
        </div>
      )}

      {activeTab.value === 'sentiment' && (
        <div class={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p>AI-powered sentiment analysis coming soon</p>
        </div>
      )}
    </div>
  )
})