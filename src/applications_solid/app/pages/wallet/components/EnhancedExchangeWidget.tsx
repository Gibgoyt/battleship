import type { Component } from 'solid-js';
import { createSignal, createEffect, createMemo, Show } from 'solid-js';
import {
  useProgramInfo,
  useExchangeModal,
  useWallet,
  useSplitdoATA,
  useWalletBalances,
  useWalletModal
} from 'src/lib/wallet/wallet-reactive-store';

interface EnhancedExchangeWidgetProps {
  isDark: boolean;
}

const EnhancedExchangeWidget: Component<EnhancedExchangeWidgetProps> = (props) => {
  const { programInfo } = useProgramInfo();
  const { openExchangeModal } = useExchangeModal();
  const { wallet, connectionStatus } = useWallet();
  const { splitdoATA } = useSplitdoATA();
  const { solBalance } = useWalletBalances();
  const { openModal } = useWalletModal();

  const [solAmount, setSolAmount] = createSignal('');
  const [focusedInput, setFocusedInput] = createSignal<'from' | 'to' | null>(null);

  // Calculate exchange amounts
  const exchangePreview = createMemo(() => {
    const solInput = parseFloat(solAmount()) || 0;
    const exchangeRate = programInfo()?.exchange_rate || 0;
    const splitdoOutput = solInput * exchangeRate;
    const minAmount = 0.01;
    const maxAmount = solBalance()?.sol || 0;
    const fee = solInput * 0.001; // 0.1% fee for demo

    return {
      solInput,
      splitdoOutput,
      exchangeRate,
      minAmount,
      maxAmount,
      fee,
      isValidAmount: solInput >= minAmount && solInput <= maxAmount,
      canExchange: solInput >= minAmount && solInput <= maxAmount && connectionStatus() === 'connected' && splitdoATA().status === 'exists'
    };
  });

  const formatCurrency = (amount: number, decimals: number = 2) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const handleSolInputChange = (value: string) => {
    // Only allow valid decimal numbers
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    if (parts.length <= 2) {
      setSolAmount(cleanValue);
    }
  };

  const handleMaxClick = () => {
    const maxSol = solBalance()?.sol || 0;
    // Leave a small amount for transaction fees
    const maxUsable = Math.max(0, maxSol - 0.005);
    setSolAmount(maxUsable.toFixed(6));
  };

  const handleExchange = () => {
    // Open exchange modal directly like the original ExchangeSection
    openExchangeModal();
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
        <div class="flex items-center justify-between">
          <span class={`crypto-text-small crypto-text-secondary`}>
            Exchange Rate
          </span>
          <div class="text-right">
            <div class="exchange-rate">
              1 SOL = {formatCurrency(programInfo()?.exchange_rate || 0)} SPLITDO
            </div>
            <div class={`text-xs crypto-text-muted`}>
              Updated just now
            </div>
          </div>
        </div>
      </div>

      {/* From Input (SOL) */}
      <div class="exchange-form-group">
        <label class={`flex items-center justify-between crypto-text-secondary`}>
          <span>From</span>
          <span class="text-xs">
            Balance: {formatCurrency(solBalance()?.sol || 0, 4)} SOL
          </span>
        </label>
        <div class={`relative overflow-hidden rounded-xl border-2 transition-all ${
          focusedInput() === 'from'
            ? 'border-crypto-primary-blue shadow-lg shadow-crypto-primary-blue/20'
            : 'border-crypto-border'
        }`}>
          <div class="flex items-center">
            <div class="flex items-center gap-3 px-4 py-4 border-r border-crypto-border">
              <div class="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center">
                <span class="text-white font-bold text-xs">SOL</span>
              </div>
              <span class={`font-semibold crypto-text-primary`}>
                Solana
              </span>
            </div>
            <div class="flex-1 relative">
              <input
                type="text"
                placeholder="0.00"
                value={solAmount()}
                onInput={(e) => handleSolInputChange(e.target.value)}
                onFocus={() => setFocusedInput('from')}
                onBlur={() => setFocusedInput(null)}
                class={`w-full px-4 py-4 text-xl font-bold bg-transparent border-none outline-none ${
                  props.isDark ? 'text-crypto-text-primary' : 'text-crypto-text-primary'
                } placeholder-crypto-text-muted`}
              />
              <button
                onClick={handleMaxClick}
                class="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold bg-crypto-primary-blue text-white rounded-md hover:bg-opacity-80 transition-colors"
              >
                MAX
              </button>
            </div>
          </div>
        </div>
        <Show when={solAmount() && !exchangePreview().isValidAmount}>
          <div class="error-state mt-2 text-sm">
            <Show when={parseFloat(solAmount()) < exchangePreview().minAmount}>
              Minimum amount is {exchangePreview().minAmount} SOL
            </Show>
            <Show when={parseFloat(solAmount()) > exchangePreview().maxAmount}>
              Insufficient SOL balance
            </Show>
          </div>
        </Show>
      </div>

      {/* Exchange Arrow */}
      <div class="flex justify-center my-4">
        <div class="w-10 h-10 rounded-full bg-crypto-bg-tertiary border-2 border-crypto-border flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" class={`fill-current crypto-text-secondary`}>
            <path d="M10 3l-7 7h4v7h6v-7h4l-7-7z"/>
          </svg>
        </div>
      </div>

      {/* To Output (SPLITDO) */}
      <div class="exchange-form-group">
        <label class={`flex items-center justify-between crypto-text-secondary`}>
          <span>To</span>
          <span class="text-xs">
            Balance: {formatCurrency(splitdoATA().balance?.uiAmount || 0)} SPLITDO
          </span>
        </label>
        <div class={`relative overflow-hidden rounded-xl border-2 ${
          focusedInput() === 'to'
            ? 'border-crypto-primary-cyan shadow-lg shadow-crypto-primary-cyan/20'
            : 'border-crypto-border'
        }`}>
          <div class="flex items-center">
            <div class="flex items-center gap-3 px-4 py-4 border-r border-crypto-border">
              <div class="w-8 h-8 rounded-full bg-gradient-button-primary flex items-center justify-center">
                <span class="text-white font-bold text-xs">SD</span>
              </div>
              <span class={`font-semibold crypto-text-primary`}>
                SPLITDO
              </span>
            </div>
            <div class="flex-1">
              <div class={`px-4 py-4 text-xl font-bold ${
                exchangePreview().splitdoOutput > 0
                  ? (props.isDark ? 'text-crypto-text-primary' : 'text-crypto-text-primary')
                  : 'text-crypto-text-muted'
              }`}>
                {exchangePreview().splitdoOutput > 0 ? formatCurrency(exchangePreview().splitdoOutput) : '0.00'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Details */}
      <Show when={exchangePreview().solInput > 0}>
        <div class="exchange-preview">
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class={`text-sm crypto-text-secondary`}>
                Exchange Rate
              </span>
              <span class={`text-sm font-semibold crypto-text-primary`}>
                1 SOL = {formatCurrency(exchangePreview().exchangeRate)} SPLITDO
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class={`text-sm crypto-text-secondary`}>
                Network Fee
              </span>
              <span class={`text-sm font-semibold crypto-text-primary`}>
                ~{formatCurrency(exchangePreview().fee, 6)} SOL
              </span>
            </div>
            <div class="border-t border-crypto-border pt-3">
              <div class="flex justify-between items-center">
                <span class={`text-sm font-semibold crypto-text-primary`}>
                  You'll Receive
                </span>
                <span class={`text-sm font-bold text-crypto-primary-blue`}>
                  {formatCurrency(exchangePreview().splitdoOutput)} SPLITDO
                </span>
              </div>
            </div>
          </div>
        </div>
      </Show>

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
              <button class="btn-crypto-primary w-full py-4 text-lg">
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

      {/* Quick Amount Buttons */}
      <Show when={connectionStatus() === 'connected' && solBalance()?.sol > 0}>
        <div class="mt-4">
          <div class={`text-xs font-semibold mb-3 crypto-text-secondary`}>
            Quick Amounts
          </div>
          <div class="flex gap-2">
            {[0.1, 0.5, 1.0].map(amount => (
              <button
                onClick={() => setSolAmount(amount.toString())}
                disabled={amount > (solBalance()?.sol || 0)}
                class={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-all ${
                  amount <= (solBalance()?.sol || 0)
                    ? `border-2 border-crypto-border hover:border-crypto-primary-blue ${
                        props.isDark ? 'text-crypto-text-primary hover:bg-crypto-bg-tertiary' : 'text-crypto-text-primary hover:bg-crypto-bg-tertiary'
                      }`
                    : 'border border-crypto-border text-crypto-text-muted cursor-not-allowed'
                }`}
              >
                {amount} SOL
              </button>
            ))}
          </div>
        </div>
      </Show>
    </div>
  );
};

export default EnhancedExchangeWidget;