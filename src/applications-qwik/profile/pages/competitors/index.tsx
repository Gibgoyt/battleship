/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal, $ } from '@builder.io/qwik'

interface CompetitorsPageProps {
  isDark: boolean
}

export default component$<CompetitorsPageProps>(({ isDark }) => {
  const activeTab = useSignal('overview')

  const setActiveTab = $((tab: string) => {
    activeTab.value = tab
  })

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Competitor Analysis
        </h1>
        <button class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">
          Add Competitor
        </button>
      </div>

      {/* Comparison Overview */}
      <div class={`p-6 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
        <h3 class={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Channel Comparison
        </h3>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
            <tr class={`border-b ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
              <th class={`text-left py-3 px-4 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Channel
              </th>
              <th class={`text-center py-3 px-4 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Subscribers
              </th>
              <th class={`text-center py-3 px-4 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Views
              </th>
              <th class={`text-center py-3 px-4 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Videos
              </th>
              <th class={`text-center py-3 px-4 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Avg Views
              </th>
              <th class={`text-center py-3 px-4 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Engagement Rate
              </th>
            </tr>
            </thead>
            <tbody>
            <tr class={`border-b ${isDark ? 'border-zinc-700' : 'border-gray-200'} bg-red-50 ${isDark ? 'bg-red-900/20' : ''}`}>
              <td class="py-4 px-4">
                <div class="flex items-center gap-3">
                  <div class={`w-10 h-10 rounded-full ${isDark ? 'bg-zinc-700' : 'bg-gray-200'} flex items-center justify-center`}>
                    <span class={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>You</span>
                  </div>
                  <div>
                    <p class={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Your Channel</p>
                    <p class={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Your performance</p>
                  </div>
                </div>
              </td>
              <td class={`text-center py-4 px-4 font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>15.2K</td>
              <td class={`text-center py-4 px-4 font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>847K</td>
              <td class={`text-center py-4 px-4 font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>47</td>
              <td class={`text-center py-4 px-4 font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>18.0K</td>
              <td class={`text-center py-4 px-4 font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>4.8%</td>
            </tr>

            {[
              { name: 'TechTips Pro', handle: '@techtipspro', subscribers: '89.3K', views: '12.4M', videos: '234', avgViews: '53.0K', engagement: '6.2%', status: 'ahead' },
              { name: 'Digital Creator Hub', handle: '@digitalcreator', subscribers: '67.8K', views: '8.9M', videos: '178', avgViews: '50.0K', engagement: '5.4%', status: 'ahead' },
              { name: 'Content Mastery', handle: '@contentmastery', subscribers: '24.1K', views: '2.1M', videos: '92', avgViews: '22.8K', engagement: '7.3%', status: 'behind' },
              { name: 'Creator Insights', handle: '@creatorinsights', subscribers: '18.7K', views: '1.8M', videos: '156', avgViews: '11.5K', engagement: '4.1%', status: 'behind' },
              { name: 'Video Growth Tips', handle: '@videogrowth', subscribers: '12.3K', views: '945K', videos: '67', avgViews: '14.1K', engagement: '5.9%', status: 'behind' }
            ].map((competitor, index) => (
              <tr key={index} class={`border-b ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
                <td class="py-4 px-4">
                  <div class="flex items-center gap-3">
                    <div class={`w-10 h-10 rounded-full ${isDark ? 'bg-zinc-700' : 'bg-gray-200'} flex items-center justify-center`}>
                        <span class={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {competitor.name.charAt(0)}
                        </span>
                    </div>
                    <div>
                      <p class={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{competitor.name}</p>
                      <p class={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{competitor.handle}</p>
                    </div>
                  </div>
                </td>
                <td class={`text-center py-4 px-4 font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {competitor.subscribers}
                </td>
                <td class={`text-center py-4 px-4 font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {competitor.views}
                </td>
                <td class={`text-center py-4 px-4 font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {competitor.videos}
                </td>
                <td class={`text-center py-4 px-4 font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {competitor.avgViews}
                </td>
                <td class={`text-center py-4 px-4 font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {competitor.engagement}
                </td>
              </tr>
            ))}
            </tbody>
          </table>
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
            onClick$={() => setActiveTab('content')}
            class={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab.value === 'content'
                ? 'border-red-500 text-red-600'
                : isDark
                  ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Content Analysis
          </button>
          <button
            onClick$={() => setActiveTab('keywords')}
            class={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab.value === 'keywords'
                ? 'border-red-500 text-red-600'
                : isDark
                  ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Keywords
          </button>
          <button
            onClick$={() => setActiveTab('trends')}
            class={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab.value === 'trends'
                ? 'border-red-500 text-red-600'
                : isDark
                  ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Trends
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab.value === 'overview' && (
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Growth Comparison */}
          <div class={`p-6 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
            <h3 class={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Growth Comparison (Last 30 days)
            </h3>
            <div class="space-y-4">
              {[
                { name: 'Your Channel', growth: '+12%', color: 'bg-red-500' },
                { name: 'TechTips Pro', growth: '+8%', color: 'bg-blue-500' },
                { name: 'Digital Creator Hub', growth: '+15%', color: 'bg-green-500' },
                { name: 'Content Mastery', growth: '+22%', color: 'bg-purple-500' }
              ].map((channel, index) => (
                <div key={index} class="flex items-center gap-3">
                  <div class={`w-3 h-3 ${channel.color} rounded-full`}></div>
                  <span class={`flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {channel.name}
                  </span>
                  <span class={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {channel.growth}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement Comparison */}
          <div class={`p-6 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
            <h3 class={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Engagement Rate Comparison
            </h3>
            <div class="space-y-4">
              {[
                { name: 'Content Mastery', rate: '7.3%', width: '100%' },
                { name: 'TechTips Pro', rate: '6.2%', width: '85%' },
                { name: 'Video Growth Tips', rate: '5.9%', width: '81%' },
                { name: 'Digital Creator Hub', rate: '5.4%', width: '74%' },
                { name: 'Your Channel', rate: '4.8%', width: '66%' },
                { name: 'Creator Insights', rate: '4.1%', width: '56%' }
              ].map((channel, index) => (
                <div key={index}>
                  <div class="flex items-center justify-between mb-1">
                    <span class={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {channel.name}
                    </span>
                    <span class={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                      {channel.rate}
                    </span>
                  </div>
                  <div class={`w-full ${isDark ? 'bg-zinc-700' : 'bg-gray-200'} rounded-full h-2`}>
                    <div
                      class={`h-2 rounded-full ${
                        channel.name === 'Your Channel' ? 'bg-red-600' : 'bg-blue-600'
                      }`}
                      style={{ width: channel.width }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab.value === 'content' && (
        <div class="space-y-6">
          {/* Content Types */}
          <div class={`p-6 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
            <h3 class={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Popular Content Types
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { type: 'Tutorial Videos', percentage: '45%', competitors: '3/5 channels' },
                { type: 'Tips & Tricks', percentage: '32%', competitors: '4/5 channels' },
                { type: 'Reviews', percentage: '23%', competitors: '2/5 channels' },
                { type: 'Behind the Scenes', percentage: '18%', competitors: '3/5 channels' },
                { type: 'Q&A Sessions', percentage: '15%', competitors: '2/5 channels' },
                { type: 'Live Streams', percentage: '12%', competitors: '1/5 channels' }
              ].map((content, index) => (
                <div key={index} class={`p-4 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-gray-50'}`}>
                  <h4 class={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'} mb-2`}>
                    {content.type}
                  </h4>
                  <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                    {content.percentage} of top videos
                  </p>
                  <p class={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Used by {content.competitors}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Top Videos from Competitors */}
          <div class={`p-6 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
            <h3 class={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Trending Videos from Competitors
            </h3>
            <div class="space-y-4">
              {[
                { channel: 'TechTips Pro', title: '10 YouTube Mistakes You\'re Making Right Now', views: '127K', published: '3 days ago' },
                { channel: 'Content Mastery', title: 'How I Gained 50K Subscribers in 3 Months', views: '89K', published: '5 days ago' },
                { channel: 'Digital Creator Hub', title: 'The Algorithm Changed: Here\'s What to Do', views: '156K', published: '1 week ago' },
                { channel: 'Video Growth Tips', title: 'Thumbnail Secrets That Actually Work', views: '67K', published: '1 week ago' }
              ].map((video, index) => (
                <div key={index} class={`p-4 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-gray-50'}`}>
                  <div class="flex items-start gap-3">
                    <div class={`w-16 h-10 rounded ${isDark ? 'bg-zinc-600' : 'bg-gray-300'} flex items-center justify-center`}>
                      <svg class="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <div class="flex-1">
                      <h4 class={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'} mb-1`}>
                        {video.title}
                      </h4>
                      <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {video.channel} • {video.views} views • {video.published}
                      </p>
                    </div>
                    <button class={`p-2 rounded-lg transition-colors ${
                      isDark
                        ? 'bg-zinc-600 hover:bg-zinc-500 text-gray-300'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                    }`}>
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab.value === 'keywords' && (
        <div class={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
          </svg>
          <p>Keyword analysis coming soon</p>
        </div>
      )}

      {activeTab.value === 'trends' && (
        <div class={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
          </svg>
          <p>Trend analysis coming soon</p>
        </div>
      )}
    </div>
  )
})