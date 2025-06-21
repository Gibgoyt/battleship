/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal, $ } from '@builder.io/qwik'

interface CalendarPageProps {
  isDark: boolean
}

export default component$<CalendarPageProps>(({ isDark }) => {
  const currentDate = useSignal(new Date())
  const selectedDate = useSignal(new Date())
  const viewMode = useSignal('month') // month, week, day

  const goToPrevious = $(() => {
    const newDate = new Date(currentDate.value)
    if (viewMode.value === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (viewMode.value === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() - 1)
    }
    currentDate.value = newDate
  })

  const goToNext = $(() => {
    const newDate = new Date(currentDate.value)
    if (viewMode.value === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (viewMode.value === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    currentDate.value = newDate
  })

  const goToToday = $(() => {
    currentDate.value = new Date()
    selectedDate.value = new Date()
  })

  const setViewMode = $((mode: string) => {
    viewMode.value = mode
  })

  // Get calendar data
  const getCalendarDays = () => {
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const current = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString()
  }

  const isToday = (date: Date) => {
    return isSameDay(date, new Date())
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.value.getMonth()
  }

  // Sample scheduled content
  const scheduledContent = [
    { date: new Date(2025, 5, 18), title: 'How to Create Engaging Content', type: 'video', time: '10:00 AM' },
    { date: new Date(2025, 5, 20), title: 'Quick SEO Tips', type: 'short', time: '2:00 PM' },
    { date: new Date(2025, 5, 22), title: 'Channel Update Video', type: 'video', time: '9:00 AM' },
    { date: new Date(2025, 5, 25), title: 'Behind the Scenes', type: 'short', time: '4:00 PM' },
    { date: new Date(2025, 5, 28), title: 'Tutorial Series Part 1', type: 'video', time: '11:00 AM' }
  ]

  const getContentForDate = (date: Date) => {
    return scheduledContent.filter(content => isSameDay(content.date, date))
  }

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Content Calendar
        </h1>
        <button class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">
          Schedule Content
        </button>
      </div>

      {/* Calendar Controls */}
      <div class={`p-4 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <button
              onClick$={goToPrevious}
              class={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-zinc-700 hover:bg-zinc-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>

            <h2 class={`text-xl font-semibold mx-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {formatMonthYear(currentDate.value)}
            </h2>

            <button
              onClick$={goToNext}
              class={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-zinc-700 hover:bg-zinc-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>

          <div class="flex items-center gap-2">
            <button
              onClick$={goToToday}
              class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-zinc-700 hover:bg-zinc-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              Today
            </button>

            <div class={`flex rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-gray-100'}`}>
              {['month', 'week', 'day'].map((mode) => (
                <button
                  key={mode}
                  onClick$={() => setViewMode(mode)}
                  class={`px-3 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
                    viewMode.value === mode
                      ? 'bg-red-600 text-white'
                      : isDark
                        ? 'text-gray-300 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Month View */}
        {viewMode.value === 'month' && (
          <div>
            {/* Calendar Header */}
            <div class="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} class={`p-2 text-center text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div class="grid grid-cols-7 gap-1">
              {getCalendarDays().map((date, index) => {
                const content = getContentForDate(date)
                const isSelected = isSameDay(date, selectedDate.value)
                const isTodayDate = isToday(date)
                const isCurrentMonthDate = isCurrentMonth(date)

                return (
                  <div
                    key={index}
                    class={`min-h-[120px] p-2 border rounded-lg cursor-pointer transition-colors ${
                      isDark ? 'border-zinc-600' : 'border-gray-200'
                    } ${
                      isSelected
                        ? 'bg-red-50 border-red-300'
                        : isTodayDate
                          ? isDark ? 'bg-blue-900 border-blue-600' : 'bg-blue-50 border-blue-300'
                          : isDark ? 'hover:bg-zinc-700' : 'hover:bg-gray-50'
                    }`}
                    onClick$={() => selectedDate.value = date}
                  >
                    <div class={`text-sm font-medium mb-1 ${
                      !isCurrentMonthDate
                        ? isDark ? 'text-gray-600' : 'text-gray-400'
                        : isTodayDate
                          ? 'text-blue-600'
                          : isDark ? 'text-gray-200' : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </div>

                    <div class="space-y-1">
                      {content.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          class={`text-xs p-1 rounded text-white truncate ${
                            item.type === 'video' ? 'bg-red-600' : 'bg-blue-600'
                          }`}
                          title={`${item.title} - ${item.time}`}
                        >
                          {item.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Week View */}
        {viewMode.value === 'week' && (
          <div class={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <p>Week view coming soon</p>
          </div>
        )}

        {/* Day View */}
        {viewMode.value === 'day' && (
          <div class={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <p>Day view coming soon</p>
          </div>
        )}
      </div>

      {/* Upcoming Content */}
      <div class={`p-6 rounded-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border`}>
        <h3 class={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Upcoming Scheduled Content
        </h3>
        <div class="space-y-3">
          {scheduledContent.slice(0, 5).map((item, index) => (
            <div key={index} class={`flex items-center gap-4 p-3 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-gray-50'}`}>
              <div class={`w-10 h-10 rounded-lg flex items-center justify-center ${
                item.type === 'video' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                {item.type === 'video' ? (
                  <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                ) : (
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                  </svg>
                )}
              </div>

              <div class="flex-1">
                <h4 class={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {item.title}
                </h4>
                <p class={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatDate(item.date)} at {item.time}
                </p>
              </div>

              <div class="flex items-center gap-2">
                <span class={`px-2 py-1 text-xs font-medium rounded-full ${
                  item.type === 'video'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {item.type === 'video' ? 'Video' : 'Short'}
                </span>
                <button class={`p-1 rounded transition-colors ${
                  isDark
                    ? 'bg-zinc-600 hover:bg-zinc-500 text-gray-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                }`}>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})