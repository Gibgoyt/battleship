import type { Component } from 'solid-js';
import { Show, createEffect, createMemo, createSignal } from 'solid-js';
import { useUnifiedWallet } from 'src/applications_solid/app/lib/wallet/unified-wallet-context';

export interface ExchangeSectionProps {
  isDark: boolean;
}

export const ExchangeSection: Component<ExchangeSectionProps> = (props) => {
  const wallet = useUnifiedWallet();

  // Track whether we've already fetched program info for this session
  const [hasFetchedProgramInfo, setHasFetchedProgramInfo] = createSignal(false);

  // Fetch program info when section is mounted and user has SPLITDO account
  createEffect(() => {
    if (wallet.splitdoATA().status === 'exists' && !hasFetchedProgramInfo()) {
      setHasFetchedProgramInfo(true);
      wallet.fetchExchangeRates();
    }
  });

  const splitdoUsdRate = createMemo(() => {
    const rate = wallet.exchangeRates()?.exchangeRate || 0;
    if (rate <= 0) return 0;
    return rate.toFixed(2);
  });

  const handleExchangeClick = () => {
    wallet.openExchangeModal();
  };

  // Only show exchange section if user has a SPLITDO account
  return (
    <Show when={splitdoATA().status === 'exists'}>
      <div class={`p-6 border-l-4 ${
        props.isDark ? 'bg-zinc-800/30 border-blue-500' : 'bg-blue-50 border-blue-500'
      }`}>
        {/* Header */}
        <div class="mb-4">
          <h2 class={`text-xl font-semibold ${
            props.isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Token Exchange
          </h2>
          <p class={`text-sm mt-1 ${
            props.isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Convert SOL to SPLITDO tokens
          </p>
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
                <Show when={!wallet.exchangeRates().loading} fallback="Loading...">
                  1 SPLITDO = USDC {splitdoUsdRate()}
                </Show>
              </div>
            </div>
            <div>
              <div class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Minimum Amount
              </div>
              <div class={`text-sm font-medium ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
                0.01 SOL
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Button */}
        <button
          onClick={handleExchangeClick}
          class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Start Token Exchange
        </button>

        {/* Additional Info */}
        <div class={`mt-4 text-xs ${
          props.isDark ? 'text-gray-500' : 'text-gray-600'
        }`}>
          <p>Secure exchange powered by Phantom wallet</p>
        </div>
      </div>
    </Show>
  );
};
