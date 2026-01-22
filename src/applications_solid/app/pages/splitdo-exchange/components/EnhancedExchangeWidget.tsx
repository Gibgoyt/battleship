import type { Component } from 'solid-js';
import { createSignal, createEffect, createMemo, Show, onMount } from 'solid-js';
import { useUnifiedWallet } from 'src/applications_solid/app/lib/wallet/unified-wallet-context';

interface EnhancedExchangeWidgetProps {
  isDark: boolean;
}

const EnhancedExchangeWidget: Component<EnhancedExchangeWidgetProps> = (props) => {
  const wallet = useUnifiedWallet();

  // Smart initialization - check if data needs to be fetched
  onMount(() => {
    // Check if exchange rate data is available, if not fetch it
    const currentExchangeRates = wallet.exchangeRates();
    if (!wallet.isPersistentDataLoading() && (!currentExchangeRates || currentExchangeRates.exchangeRate === 0)) {
      console.log('[EnhancedExchangeWidget] No exchange rate available, fetching...');
      wallet.fetchExchangeRates();
    } else if (currentExchangeRates && currentExchangeRates.exchangeRate > 0) {
      console.log('[EnhancedExchangeWidget] Using available exchange rate:', currentExchangeRates.exchangeRate);
    }

    // Check if SOL price data is available, if not fetch it
    const currentSolPrice = wallet.solPrice();
    if (!wallet.isPersistentDataLoading() && (!currentSolPrice || currentSolPrice.price === 0)) {
      console.log('[EnhancedExchangeWidget] No SOL price available, fetching...');
      wallet.fetchSolPrice();
    } else if (currentSolPrice && currentSolPrice.price > 0) {
      console.log('[EnhancedExchangeWidget] Using available SOL price:', currentSolPrice.price);
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
    wallet.openExchangeModal();
  };

  const handleCreateAccount = () => {
    console.log('[EnhancedExchangeWidget] Opening create account modal...');
    wallet.openCreateAccountModal();
  };

  return (
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Widget Header */}
      <div class="p-4 border-b border-zinc-800">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden p-1">
              <img src="/splitdo/logo.svg" alt="SPLITDO" class="w-full h-full object-contain" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">Swap</h3>
              <p class="text-xs text-zinc-500">SOL to SPLITDO</p>
            </div>
          </div>
          <div class="flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span class="text-xs font-medium text-emerald-400">Live</span>
          </div>
        </div>
      </div>

      <div class="p-4 space-y-3">
        {/* You Have - SOL */}
        <div class="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-zinc-500 uppercase tracking-wide">You Have</span>
            <Show when={wallet.solPrice()?.price && wallet.solPrice()!.price > 0 && wallet.solBalance()?.sol}>
              <span class="text-xs text-zinc-500">
                ≈ ${formatCurrency((wallet.solBalance()?.sol || 0) * wallet.solPrice()!.price)}
              </span>
            </Show>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center overflow-hidden p-1.5">
                <img src="/solana-logo.svg" alt="SOL" class="w-full h-full object-contain" />
              </div>
              <div>
                <div class="font-semibold text-white">SOL</div>
                <div class="text-xs text-zinc-500">Solana</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-white">
                {formatCurrency(wallet.solBalance()?.sol || 0, 4)}
              </div>
            </div>
          </div>
        </div>

        {/* Swap Arrow */}
        <div class="flex justify-center -my-1">
          <div class="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="text-cyan-400">
              <path d="M12 5v14M12 19l-4-4m4 4l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        {/* You Get - SPLITDO */}
        <div class="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-zinc-500 uppercase tracking-wide">You Have</span>
            <Show when={wallet.splitdoATA().balance?.amount}>
              <span class="text-xs text-zinc-500">
                ≈ ${formatCurrency(Number(wallet.splitdoATA().balance?.amount || 0) * 0.11)}
              </span>
            </Show>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center overflow-hidden p-1">
                <img src="/splitdo/logo.svg" alt="SPLITDO" class="w-full h-full object-contain" />
              </div>
              <div>
                <div class="font-semibold text-white">SPLITDO</div>
                <div class="text-xs text-zinc-500">Token</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-cyan-400">
                {formatCurrency(Number(wallet.splitdoATA().balance?.amount || 0))}
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Rate Info */}
        <div class="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
          <div class="flex items-center justify-between text-sm">
            <span class="text-zinc-500">Rate</span>
            <span class="text-white font-medium">
              1 SOL = {formatCurrency((wallet.solPrice()?.price || 135.98) / 0.11, 0)} SPLITDO
            </span>
          </div>
          <div class="flex items-center justify-between text-sm mt-1">
            <span class="text-zinc-500">SPLITDO Price</span>
            <span class="text-cyan-400 font-medium">$0.11 USD</span>
          </div>
        </div>

        {/* Action Button */}
        <div class="pt-2">
          <Show when={wallet.connectionStatus() !== 'connected'} fallback={
            <Show when={wallet.splitdoATA().status !== 'exists'} fallback={
              <button
                onClick={handleExchange}
                class="w-full py-4 px-6 rounded-xl font-bold text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition-all hover:shadow-lg hover:shadow-cyan-500/20"
              >
                <span class="flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="text-white">
                    <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Swap Tokens
                </span>
              </button>
            }>
              <div class="space-y-3">
                <p class="text-sm text-zinc-500 text-center">Create a SPLITDO account to start swapping</p>
                <button
                  onClick={handleCreateAccount}
                  class="w-full py-4 px-6 rounded-xl font-bold text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition-all"
                >
                  Create SPLITDO Account
                </button>
              </div>
            </Show>
          }>
            <button
              onClick={wallet.openWalletModal}
              class="w-full py-4 px-6 rounded-xl font-bold text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition-all"
            >
              Connect Wallet
            </button>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default EnhancedExchangeWidget;