import type { Component } from 'solid-js';
import { Show, createSignal, createMemo } from 'solid-js';
import { useExchangeModal, useExchange, useWallet } from 'src/lib/wallet/wallet-reactive-store';

export interface ExchangeModalProps {
  isDark: boolean;
}

export const ExchangeModal: Component<ExchangeModalProps> = (props) => {
  const { isExchangeModalOpen, closeExchangeModal } = useExchangeModal();
  const { exchangeStatus, exchangeError, executeExchange } = useExchange();
  const { connectionStatus } = useWallet();

  const [step, setStep] = createSignal<'wallet' | 'exchange'>('wallet');
  const [solAmount, setSolAmount] = createSignal('');

  // Don't render modal if not open
  if (!isExchangeModalOpen()) return null;

  const handleClose = () => {
    closeExchangeModal();
    setStep('wallet');
    setSolAmount('');
  };

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div class="absolute inset-0 bg-black bg-opacity-50" />

      {/* Modal Content */}
      <div
        class={`relative w-full max-w-md mx-4 p-6 rounded-lg shadow-xl z-10 ${
          props.isDark ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div class="flex items-center justify-between mb-6">
          <h2 class={`text-xl font-bold ${
            props.isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Exchange SOL for SPLITDO
          </h2>
          <button
            onClick={handleClose}
            class={`w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 ${
              props.isDark ? 'hover:bg-zinc-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <Show
          when={step() === 'wallet'}
          fallback={
            <ExchangeForm
              isDark={props.isDark}
              solAmount={solAmount()}
              setSolAmount={setSolAmount}
              exchangeStatus={exchangeStatus()}
              exchangeError={exchangeError()}
              executeExchange={executeExchange}
              onBack={() => setStep('wallet')}
            />
          }
        >
          <WalletSelection
            isDark={props.isDark}
            connectionStatus={connectionStatus()}
            onSelectPhantom={() => setStep('exchange')}
          />
        </Show>
      </div>
    </div>
  );
};

// Wallet Selection Component
interface WalletSelectionProps {
  isDark: boolean;
  connectionStatus: string;
  onSelectPhantom: () => void;
}

const WalletSelection: Component<WalletSelectionProps> = (props) => {
  return (
    <div class="space-y-4">
      <p class={`text-center text-sm ${
        props.isDark ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Choose your wallet to continue with the exchange:
      </p>

      {/* Phantom Wallet Option */}
      <button
        onClick={props.onSelectPhantom}
        disabled={props.connectionStatus !== 'connected'}
        class={`w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-4 ${
          props.connectionStatus === 'connected'
            ? `hover:border-blue-500 cursor-pointer ${
                props.isDark
                  ? 'bg-zinc-700 border-zinc-600 hover:bg-zinc-600'
                  : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
              }`
            : 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200'
        }`}
      >
        <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
          <span class="text-white text-lg">👻</span>
        </div>
        <div class="flex-1 text-left">
          <div class={`font-medium ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
            Phantom Wallet
          </div>
          <div class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {props.connectionStatus === 'connected'
              ? 'Connected and ready to exchange'
              : 'Connect your wallet first'
            }
          </div>
        </div>
        {props.connectionStatus === 'connected' && (
          <div class="text-green-500 text-lg">✓</div>
        )}
      </button>

      {/* MetaMask Option (Coming Soon) */}
      <button
        disabled
        class={`w-full p-4 rounded-lg border-2 opacity-50 cursor-not-allowed flex items-center gap-4 ${
          props.isDark
            ? 'bg-zinc-700 border-zinc-600'
            : 'bg-gray-50 border-gray-300'
        }`}
      >
        <div class="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
          <span class="text-white text-lg">🦊</span>
        </div>
        <div class="flex-1 text-left">
          <div class={`font-medium ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
            MetaMask
          </div>
          <div class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Solana support coming soon
          </div>
        </div>
        <span class={`text-xs px-2 py-1 rounded ${
          props.isDark ? 'bg-zinc-600 text-gray-300' : 'bg-gray-200 text-gray-600'
        }`}>
          Coming Soon
        </span>
      </button>
    </div>
  );
};

// Exchange Form Component
interface ExchangeFormProps {
  isDark: boolean;
  solAmount: string;
  setSolAmount: (value: string) => void;
  exchangeStatus: string;
  exchangeError: string | null;
  executeExchange: (amount: number) => Promise<any>;
  onBack: () => void;
}

const ExchangeForm: Component<ExchangeFormProps> = (props) => {
  const solAmountNum = createMemo(() => {
    const num = parseFloat(props.solAmount);
    return isNaN(num) ? 0 : num;
  });

  const isValidAmount = createMemo(() => {
    return solAmountNum() >= 0.05;
  });

  const splitdoAmount = createMemo(() => {
    return Math.floor(solAmountNum() * 20000); // Approximate rate: 1 SOL = 20,000 SPLITDO
  });

  const handleExchange = async () => {
    if (!isValidAmount() || props.exchangeStatus === 'loading') return;
    await props.executeExchange(solAmountNum());
  };

  return (
    <div class="space-y-6">
      {/* Back Button */}
      <button
        onClick={props.onBack}
        class={`text-sm flex items-center gap-2 ${
          props.isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        ← Back to wallet selection
      </button>

      {/* Input Section */}
      <div>
        <label class={`block text-sm font-medium mb-2 ${
          props.isDark ? 'text-white' : 'text-gray-900'
        }`}>
          SOL Amount
        </label>
        <input
          type="number"
          value={props.solAmount}
          onInput={(e) => props.setSolAmount(e.currentTarget.value)}
          placeholder="Enter SOL amount (min 0.05)"
          min="0.05"
          step="0.01"
          class={`w-full px-4 py-3 rounded-lg border transition-colors duration-200 ${
            props.isDark
              ? 'bg-zinc-700 border-zinc-600 text-white placeholder-gray-400 focus:border-blue-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
        />
        <Show when={props.solAmount && !isValidAmount()}>
          <p class="text-red-500 text-sm mt-1">
            Minimum amount is 0.05 SOL
          </p>
        </Show>
      </div>

      {/* Exchange Preview */}
      <Show when={isValidAmount()}>
        <div class={`p-4 rounded-lg ${
          props.isDark ? 'bg-zinc-700' : 'bg-gray-50'
        }`}>
          <h4 class={`text-sm font-medium mb-3 ${
            props.isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Exchange Preview
          </h4>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                You pay:
              </span>
              <span class={`text-sm font-medium ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
                {props.solAmount || '0'} SOL
              </span>
            </div>
            <div class="flex justify-between">
              <span class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                You receive:
              </span>
              <span class="text-sm font-medium text-green-500">
                ~{splitdoAmount().toLocaleString()} SPLITDO
              </span>
            </div>
            <div class={`flex justify-between pt-2 border-t ${
              props.isDark ? 'border-zinc-600' : 'border-gray-200'
            }`}>
              <span class={`text-xs ${props.isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Exchange rate:
              </span>
              <span class={`text-xs ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                1 SOL ≈ 20,000 SPLITDO
              </span>
            </div>
          </div>
        </div>
      </Show>

      {/* Exchange Button */}
      <button
        onClick={handleExchange}
        disabled={!isValidAmount() || props.exchangeStatus === 'loading'}
        class={`w-full px-4 py-3 font-medium rounded-lg transition-colors duration-200 ${
          !isValidAmount() || props.exchangeStatus === 'loading'
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        }`}
      >
        <Show
          when={props.exchangeStatus !== 'loading'}
          fallback={
            <span class="flex items-center justify-center gap-2">
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing Exchange...
            </span>
          }
        >
          Exchange Tokens
        </Show>
      </button>

      {/* Status Messages */}
      <Show when={props.exchangeStatus === 'error' && props.exchangeError}>
        <div class="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-700 text-sm">
            {props.exchangeError}
          </p>
        </div>
      </Show>

      <Show when={props.exchangeStatus === 'success'}>
        <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p class="text-green-700 text-sm">
            ✅ Exchange completed successfully! Your SPLITDO tokens will appear in your wallet shortly.
          </p>
        </div>
      </Show>
    </div>
  );
};