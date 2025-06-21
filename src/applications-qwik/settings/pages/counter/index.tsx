/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal, $ } from '@builder.io/qwik'

interface CounterPageProps {
  isDark: boolean
}

export default component$<CounterPageProps>(({ isDark }) => {
  const count = useSignal(0)

  const increment = $(() => {
    count.value++
  })

  const decrement = $(() => {
    count.value--
  })

  const reset = $(() => {
    count.value = 0
  })

  return (
    <div class="min-h-[calc(100vh-2rem)]">
      <div class="mb-8">
        <h1 class={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          Counter
        </h1>
        <p class={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          A simple counter demonstration with Qwik
        </p>
      </div>

      <div class={`max-w-md mx-auto p-8 rounded-xl shadow-lg ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
        <div class="text-center">
          <h2 class={`text-2xl font-semibold mb-8 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Counter Value
          </h2>
          
          <div class={`text-6xl font-bold mb-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            {count.value}
          </div>

          <div class="flex gap-4 justify-center">
            <button
              onClick$={decrement}
              class={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              Decrement
            </button>

            <button
              onClick$={reset}
              class={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-zinc-700 hover:bg-zinc-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Reset
            </button>

            <button
              onClick$={increment}
              class={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              Increment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})