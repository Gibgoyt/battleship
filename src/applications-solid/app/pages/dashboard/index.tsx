import type { Component } from 'solid-js';

const DashboardPage: Component<{ isDark: boolean }> = (props) => {
  return (
    <div class="p-8">
      <h2 class={`text-2xl font-bold mb-4 ${props.isDark ? 'text-white' : 'text-gray-900'}`}>Dashboard</h2>
      <div class={`p-6 rounded-lg border ${props.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
        <p class={props.isDark ? 'text-gray-300' : 'text-gray-600'}>
          Welcome to your new SolidJS Dashboard inside Astro!
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
