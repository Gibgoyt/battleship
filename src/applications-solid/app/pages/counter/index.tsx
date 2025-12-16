import { createSignal, type Component } from 'solid-js';

const CounterPage: Component<{ isDark: boolean }> = (props) => {
  const [count, setCount] = createSignal(0);

  return (
    <div class="p-8">
      <h2 class={`text-2xl font-bold mb-4 ${props.isDark ? 'text-white' : 'text-gray-900'}`}>Counter</h2>
      <div class={`p-6 rounded-lg border ${props.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
        <div class="flex items-center space-x-4">
          <button
            onClick={() => setCount(c => c - 1)}
            class="w-10 h-10 flex items-center justify-center bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            -
          </button>
          <span class={`text-2xl font-mono w-12 text-center ${props.isDark ? 'text-white' : 'text-gray-900'}`}>{count()}</span>
          <button
            onClick={() => setCount(c => c + 1)}
            class="w-10 h-10 flex items-center justify-center bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default CounterPage;
