import type { Component } from 'solid-js';
import { Show } from 'solid-js';

export type Page = 'dashboard' | 'profile' | 'splitdo-exchange';

interface NavigationProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const Navigation: Component<NavigationProps> = (props) => {
  return (
    <>
      {/* Mobile Overlay */}
      <Show when={props.isOpen}>
        <div
          class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={props.onClose}
        />
      </Show>

      {/* Sidebar */}
      <nav class={`w-64 flex-shrink-0 border-r h-full fixed left-0 top-0 overflow-y-auto transition-all duration-300 z-50 ${
        props.isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 ${
        props.isDark ? 'border-zinc-800 bg-zinc-900' : 'border-gray-200 bg-white'
      }`}>
      <div class="p-6 flex items-center justify-between">
        <h1 class={`text-xl font-bold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>SplitDo App</h1>
        {/* Close button (mobile only) */}
        <button
          onClick={props.onClose}
          class={`lg:hidden p-2 rounded-md ${
            props.isDark ? 'hover:bg-zinc-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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
          onClick={() => props.onPageChange('splitdo-exchange')}
          class={`w-full text-left px-4 py-2 rounded-md transition-colors ${
            props.currentPage === 'splitdo-exchange'
              ? props.isDark ? 'bg-zinc-800 text-white' : 'bg-gray-100 text-gray-900'
              : props.isDark ? 'text-gray-400 hover:text-white hover:bg-zinc-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          SPLITDO Exchange
        </button>
      </div>
    </nav>
    </>
  );
};

export default Navigation;
