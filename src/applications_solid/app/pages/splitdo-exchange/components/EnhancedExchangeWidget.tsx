import type { Component } from 'solid-js';
import { createSignal, createEffect, createMemo, Show, onMount } from 'solid-js';
import {
  useProgramInfo,
  useExchangeModal,
  useCreateAccountModal,
  useWallet,
  useSplitdoATA,
  useWalletBalances,
  useWalletModal,
  useSolPrice
} from 'src/applications_solid/app/lib/wallet/wallet-reactive-store';

interface EnhancedExchangeWidgetProps {
  isDark: boolean;
}

const EnhancedExchangeWidget: Component<EnhancedExchangeWidgetProps> = (props) => {
  const { programInfo, fetchProgramInfo } = useProgramInfo();
  const { solPrice, fetchSolPrice } = useSolPrice();
  const { openExchangeModal } = useExchangeModal();
  const { openCreateAccountModal } = useCreateAccountModal();
  const { wallet, connectionStatus } = useWallet();
  const { splitdoATA, createSplitdoATA } = useSplitdoATA();
  const { solBalance } = useWalletBalances();
  const { openModal } = useWalletModal();

  // Smart initialization - check cache first, only fetch if needed
  onMount(async () => {
    try {
      // Check if data is already available in cache
      const { usePersistentData } = await import('../../../data/PersistentDataProvider');
      const { exchangeRates, solPrice: cachedSolPrice } = usePersistentData();

      // Only trigger fetch if data is not in cache/signals
      if (!exchangeRates() && !programInfo().loading) {
        console.log('[EnhancedExchangeWidget] No exchange rate in cache, fetching...');
        fetchProgramInfo();
      } else if (exchangeRates()) {
        console.log('[EnhancedExchangeWidget] Using cached exchange rate:', exchangeRates()?.exchangeRate);
      }

      if (!cachedSolPrice() && !solPrice().loading) {
        console.log('[EnhancedExchangeWidget] No SOL price in cache, fetching...');
        fetchSolPrice();
      } else if (cachedSolPrice()) {
        console.log('[EnhancedExchangeWidget] Using cached SOL price:', cachedSolPrice()?.price);
      }
    } catch (error) {
      console.warn('[EnhancedExchangeWidget] Cache check failed, falling back to direct fetch:', error);
      // Fallback to direct fetch if cache access fails
      fetchProgramInfo();
      fetchSolPrice();
    }
  });

  const formatCurrency = (amount: number, decimals: number = 2) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Removed input handlers - widget is now display-only

  const handleExchange = () => {
    // Open exchange modal directly like the original ExchangeSection
    openExchangeModal();
  };

  const handleCreateAccount = () => {
    console.log('[EnhancedExchangeWidget] Opening create account modal...');
    openCreateAccountModal();
  };

  return (
    <div class="exchange-widget slide-in-up">
      {/* Widget Header */}
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="crypto-heading-3 mb-1">
            Exchange
          </h3>
          <p class="crypto-text-small">
            Convert SOL to SPLITDO tokens instantly
          </p>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-crypto-accent-green rounded-full"></div>
          <span class="text-xs font-medium" style="color: var(--crypto-accent-green);">
            Live Rate
          </span>
        </div>
      </div>

      {/* Exchange Rate Display */}
      <div class="exchange-preview mb-6">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class={`crypto-text-small crypto-text-secondary`}>
              Exchange Rate
            </span>
            <div class="text-right">
              <div class="exchange-rate">
                1 SOL = {formatCurrency((solPrice().usd || 135.98) / 0.11, 2)} SPLITDO
              </div>
              <Show when={solPrice().usd > 0}>
                <div class={`text-xs crypto-text-muted`}>
                  SOL: ${formatCurrency(solPrice().usd)} USD
                </div>
              </Show>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <span class={`text-xs crypto-text-secondary`}>
              SPLITDO Token Price
            </span>
            <div class="text-right">
              <div class={`text-sm font-semibold crypto-text-primary`}>
                $0.11 USD
              </div>
              <div class={`text-xs crypto-text-muted`}>
                Fixed presale price
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Balance Display */}
      <div class="balance-display mb-6">
        <div class="flex items-center justify-between p-4 rounded-xl bg-crypto-bg-tertiary border border-crypto-border">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center">
              <span class="text-white font-bold text-xs">SOL</span>
            </div>
            <div>
              <span class={`font-semibold crypto-text-primary`}>SOL Balance</span>
              <div class={`text-xs crypto-text-secondary`}>Solana</div>
            </div>
          </div>
          <div class="text-right">
            <div class={`text-lg font-bold crypto-text-primary`}>
              {formatCurrency(solBalance()?.sol || 0, 4)}
            </div>
            <Show when={solPrice().usd > 0 && solBalance()?.sol}>
              <div class={`text-xs crypto-text-muted`}>
                ≈ ${formatCurrency((solBalance()?.sol || 0) * solPrice().usd)}
              </div>
            </Show>
          </div>
        </div>
      </div>

      {/* SPLITDO Balance Display */}
      <div class="balance-display mb-6">
        <div class="flex items-center justify-between p-4 rounded-xl bg-crypto-bg-tertiary border border-crypto-border">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-gradient-button-primary flex items-center justify-center">
              <span class="text-white font-bold text-xs">SD</span>
            </div>
            <div>
              <span class={`font-semibold crypto-text-primary`}>SPLITDO Balance</span>
              <div class={`text-xs crypto-text-secondary`}>Token Account</div>
            </div>
          </div>
          <div class="text-right">
            <div class={`text-lg font-bold crypto-text-primary`}>
              {formatCurrency(splitdoATA().balance?.uiAmount || 0)}
            </div>
            <Show when={splitdoATA().balance?.uiAmount}>
              <div class={`text-xs crypto-text-muted`}>
                ≈ ${formatCurrency((splitdoATA().balance?.uiAmount || 0) * 0.11)}
              </div>
            </Show>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div class="mt-6">
        <Show when={connectionStatus() !== 'connected'} fallback={
          <Show when={splitdoATA().status !== 'exists'} fallback={
            <button
              onClick={handleExchange}
              class="btn-crypto-success w-full py-4 px-6 rounded-xl font-bold text-lg transition-all hover:shadow-lg hover:shadow-crypto-accent-green/20"
            >
              Start Token Exchange
            </button>
          }>
            <div class="space-y-3">
              <div class="text-center">
                <div class={`text-sm crypto-text-muted`}>
                  Create a SPLITDO account to start trading
                </div>
              </div>
              <button
                onClick={handleCreateAccount}
                class="btn-crypto-primary w-full py-4 text-lg"
              >
                Create SPLITDO Account
              </button>
            </div>
          </Show>
        }>
          <button
            onClick={openModal}
            class="btn-crypto-primary w-full py-4 text-lg"
          >
            Connect Wallet to Exchange
          </button>
        </Show>
      </div>

    </div>
  );
};

export default EnhancedExchangeWidget;