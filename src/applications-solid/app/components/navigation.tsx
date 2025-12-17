import type { Component } from 'solid-js';

export type Page = 'dashboard' | 'counter' | 'profile' | 'wallet';

interface NavigationProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  isDark: boolean;
}

const Navigation: Component<NavigationProps> = (props) => {
  return (
    <nav class={`w-64 flex-shrink-0 border-r h-full fixed left-0 top-0 overflow-y-auto transition-colors duration-300 ${props.isDark ? 'border-zinc-800 bg-zinc-900' : 'border-gray-200 bg-white'}`}>
      <div class="p-6">
        <h1 class={`text-xl font-bold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>SplitDo App</h1>
      </div>
      <div class="space-y-1 px-3">
        <button
          onClick={() => props.onPageChange('dashboard')}
          class={`w-full text-left px-4 py-2 rounded-md transition-colors ${
            props.currentPage === 'dashboard'
              ? props.isDark ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-gray-900'
              : props.isDark ? 'text-gray-400 hover:text-white hover:bg-zinc-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => props.onPageChange('counter')}
          class={`w-full text-left px-4 py-2 rounded-md transition-colors ${
            props.currentPage === 'counter'
              ? props.isDark ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-gray-900'
              : props.isDark ? 'text-gray-400 hover:text-white hover:bg-zinc-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Counter
        </button>
        <button
          onClick={() => props.onPageChange('profile')}
          class={`w-full text-left px-4 py-2 rounded-md transition-colors ${
            props.currentPage === 'profile'
              ? props.isDark ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-gray-900'
              : props.isDark ? 'text-gray-400 hover:text-white hover:bg-zinc-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => props.onPageChange('wallet')}
          class={`w-full text-left px-4 py-2 rounded-md transition-colors ${
            props.currentPage === 'wallet'
              ? props.isDark ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-gray-900'
              : props.isDark ? 'text-gray-400 hover:text-white hover:bg-zinc-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Wallet
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
