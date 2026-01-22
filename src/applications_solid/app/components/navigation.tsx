import type { Component } from 'solid-js';
import { Show } from 'solid-js';

export type Page = 'dashboard' | 'profile' | 'splitdo-exchange';

interface NavigationProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
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

      {/* Professional Sidebar */}
      <nav class={`w-64 flex-shrink-0 border-r h-full fixed left-0 top-0 overflow-y-auto transition-all duration-300 z-50 flex flex-col ${
        props.isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}
      style="background: var(--crypto-bg-secondary); border-color: var(--crypto-border);"
      >
        {/* Header */}
        <div class="p-6 flex items-center justify-between border-b" style="border-color: var(--crypto-border);">
          <h1 class="text-xl font-bold" style="color: var(--crypto-text-primary);">SPLITDO</h1>
          {/* Close button (mobile only) */}
          <button
            onClick={props.onClose}
            class="lg:hidden p-2 rounded-md transition-colors"
            style="color: var(--crypto-text-secondary);"
            onMouseEnter={(e) => e.target.style.background = 'var(--crypto-bg-tertiary)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <div class="flex-1 space-y-1 px-3 py-6">
          <button
            onClick={() => {
              props.onClose();
              props.onPageChange('dashboard');
            }}
            class={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
              props.currentPage === 'dashboard' ? 'crypto-nav-active' : 'crypto-nav-inactive'
            }`}
          >
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7h18l-2 13H5l-2-13z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7l1-4h12l1 4"/>
              </svg>
              <span class="font-medium">Dashboard</span>
            </div>
          </button>
          <button
            onClick={() => {
              props.onClose();
              props.onPageChange('splitdo-exchange');
            }}
            class={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
              props.currentPage === 'splitdo-exchange' ? 'crypto-nav-active' : 'crypto-nav-inactive'
            }`}
          >
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
              </svg>
              <span class="font-medium">Exchange</span>
            </div>
          </button>
        </div>

        {/* Profile Button at Bottom */}
        <div class="px-3 pb-3">
          <button
            onClick={() => {
              props.onClose();
              props.onPageChange('profile');
            }}
            class={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
              props.currentPage === 'profile' ? 'crypto-nav-active' : 'crypto-nav-inactive'
            }`}
          >
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <span class="font-medium">Profile</span>
            </div>
          </button>
        </div>

        {/* App Info at Bottom */}
        <div class="p-6 pt-3 border-t" style="border-color: var(--crypto-border);">
          <p class="text-xs" style="color: var(--crypto-text-muted);">
            SPLITDO v1.0
          </p>
        </div>
      </nav>
    </>
  );
};

export default Navigation;
