import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { useSplitdoATA, useExchangeModal } from 'src/lib/wallet/wallet-reactive-store';

export interface ExchangeSectionProps {
  isDark: boolean;
}

export const ExchangeSection: Component<ExchangeSectionProps> = (props) => {
  const { splitdoATA } = useSplitdoATA();
  const { openExchangeModal } = useExchangeModal();

  const handleExchangeClick = () => {
    openExchangeModal();
  };

  // Only show exchange section if user has a SPLITDO account
  return (
    <Show when={splitdoATA().status === 'exists'}>
      <div class={`p-6 rounded-lg border shadow-lg ${
        props.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class={`text-lg font-semibold ${
              props.isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Exchange Tokens
            </h3>
            <p class={`text-sm mt-1 ${
              props.isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Convert SOL to SPLITDO at current market rates
            </p>
          </div>
          {/* Exchange Icon */}
          <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span class="text-white text-lg">⚡</span>
          </div>
        </div>

        {/* Exchange Info */}
        <div class={`p-4 rounded-lg mb-4 ${
          props.isDark ? 'bg-zinc-700' : 'bg-gray-50'
        }`}>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Exchange Rate
              </div>
              <div class={`text-sm font-medium ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
                1 SOL ≈ ~20,000 SPLITDO
              </div>
            </div>
            <div>
              <div class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Minimum Amount
              </div>
              <div class={`text-sm font-medium ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
                0.05 SOL
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Button */}
        <button
          onClick={handleExchangeClick}
          class="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Exchange Tokens
        </button>

        {/* Additional Info */}
        <div class={`mt-3 text-xs text-center ${
          props.isDark ? 'text-gray-500' : 'text-gray-500'
        }`}>
          Powered by Phantom wallet integration
        </div>
      </div>
    </Show>
  );
};