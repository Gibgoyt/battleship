import type { Component } from 'solid-js';
import { Show, createSignal, createMemo, createEffect } from 'solid-js';
import { useExchangeModal, useExchange, useWallet, useWalletConnection, useProgramInfo } from 'src/lib/wallet/wallet-reactive-store';
import { MobileWalletInstallation } from './MobileWalletInstallation';
import { detectMobilePlatform } from 'src/lib/wallet/mobile-detection';
import { executeMobileWalletDeepLink, attemptMobileWalletConnection } from 'src/lib/wallet/mobile-wallet-connector';
import { addMobileTransactionListener, setupMobileReturnListener } from 'src/lib/wallet/mobile-transaction-handler';

export interface ExchangeModalProps {
  isDark: boolean;
}

export const ExchangeModal: Component<ExchangeModalProps> = (props) => {
  const { isExchangeModalOpen, closeExchangeModal } = useExchangeModal();
  const { exchangeStatus, exchangeError, executeExchange } = useExchange();
  const { connectionStatus } = useWallet();
  const { connectWallet } = useWalletConnection();
  const { programInfo, fetchProgramInfo } = useProgramInfo();

  const [step, setStep] = createSignal<'wallet' | 'exchange'>('wallet');
  const [solAmount, setSolAmount] = createSignal('');
  const [isConnecting, setIsConnecting] = createSignal(false);
  const [showMobileInstallation, setShowMobileInstallation] = createSignal(false);
  const [mobileInstallationPlatform, setMobileInstallationPlatform] = createSignal<'ios' | 'android'>('ios');

  // Track whether we've already fetched program info for the current modal session
  const [hasFetchedForCurrentModal, setHasFetchedForCurrentModal] = createSignal(false);

  // Fetch program info when modal opens and setup mobile listeners
  createEffect(() => {
    if (isExchangeModalOpen() && !hasFetchedForCurrentModal()) {
      setHasFetchedForCurrentModal(true);
      fetchProgramInfo();

      // Setup mobile wallet return listeners for iOS/Android deep links
      setupMobileReturnListener();
    } else if (!isExchangeModalOpen()) {
      // Reset when modal closes so next open triggers fetch
      setHasFetchedForCurrentModal(false);
    }
  });

  const handleClose = () => {
    closeExchangeModal();
    setStep('wallet');
    setSolAmount('');
    setShowMobileInstallation(false);
  };

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <Show when={isExchangeModalOpen()}>
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
              exchangeRate={programInfo().exchangeRate}
            />
          }
        >
          <WalletSelection
            isDark={props.isDark}
            connectionStatus={connectionStatus()}
            isConnecting={isConnecting()}
            showMobileInstallation={showMobileInstallation()}
            mobileInstallationPlatform={mobileInstallationPlatform()}
            onSelectPhantom={async () => {
              if (connectionStatus() === 'connected') {
                // Already connected, go to exchange
                setStep('exchange');
              } else {
                // Need to connect wallet first
                setIsConnecting(true);
                try {
                  await connectWallet('phantom');
                  setStep('exchange');
                } catch (error) {
                  console.error('Failed to connect wallet:', error);
                } finally {
                  // Check if this should trigger mobile deep link flow (when desktop connection fails)
                  const mobileDetection = detectMobilePlatform();
                  if (mobileDetection.isMobile && connectionStatus() !== 'connected') {
                    console.log('[ExchangeModal] Mobile device detected - attempting deep link connection');

                    // Try mobile wallet connection
                    const mobileConnectionResult = attemptMobileWalletConnection('phantom');

                    if (mobileConnectionResult.success && mobileConnectionResult.deepLinkUrl) {
                      console.log('[ExchangeModal] Deep link available - opening Phantom app');

                      // Set up transaction listener before navigating to app
                      addMobileTransactionListener(
                        'phantom-exchange',
                        (result) => {
                          console.log('[ExchangeModal] Mobile transaction result:', result);

                          if (result.success) {
                            console.log('[ExchangeModal] Mobile wallet connection successful');
                            setStep('exchange');
                          } else {
                            console.error('[ExchangeModal] Mobile wallet transaction failed:', result.error);
                          }
                          setIsConnecting(false);
                        },
                        { timeout: 300000, walletId: 'phantom' }
                      );

                      // Navigate to Phantom app - don't reset connecting state yet
                      window.location.href = mobileConnectionResult.deepLinkUrl;
                      // setIsConnecting will be handled by the mobile transaction listener
                      return; // Don't reset connecting state
                    } else {
                      // Fallback to installation prompt only if truly needed
                      console.log('[ExchangeModal] Deep link failed - showing installation prompt');
                      setMobileInstallationPlatform(mobileDetection.platform as 'ios' | 'android');
                      setShowMobileInstallation(true);
                    }
                  }

                  // Reset connecting state if we didn't navigate to mobile app
                  setIsConnecting(false);
                }
              }
            }}
            onCloseMobileInstallation={() => setShowMobileInstallation(false)}
          />
        </Show>
      </div>
    </div>
    </Show>
  );
};

// Wallet Selection Component
interface WalletSelectionProps {
  isDark: boolean;
  connectionStatus: string;
  isConnecting: boolean;
  showMobileInstallation: boolean;
  mobileInstallationPlatform: 'ios' | 'android';
  onSelectPhantom: () => void;
  onCloseMobileInstallation: () => void;
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
        disabled={props.isConnecting}
        class={`w-full p-4 border-2 transition-all duration-200 flex items-center gap-4 ${
          props.isConnecting
            ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200'
            : `hover:border-blue-500 cursor-pointer ${
                props.isDark
                  ? 'bg-zinc-700 border-zinc-600 hover:bg-zinc-600'
                  : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
              }`
        }`}
      >
        <div class="w-10 h-10 flex items-center justify-center">
          <img
            src={props.isDark
              ? "https://mintcdn.com/phantom-e50e2e68/fkWrmnMWhjoXSGZ9/logo/phantom-light.svg?fit=max&auto=format&n=fkWrmnMWhjoXSGZ9&q=85&s=c21a66db70347ca7a31053b98a0b5b0a"
              : "https://mintcdn.com/phantom-e50e2e68/fkWrmnMWhjoXSGZ9/logo/phantom-dark.svg?fit=max&auto=format&n=fkWrmnMWhjoXSGZ9&q=85&s=af17fb78921412073a894ea97523898c"
            }
            alt="Phantom"
            class="w-10 h-10"
          />
        </div>
        <div class="flex-1 text-left">
          <div class={`font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
            Phantom Wallet
          </div>
          <div class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {props.isConnecting
              ? 'Connecting...'
              : props.connectionStatus === 'connected'
              ? 'Connected - Ready to exchange'
              : 'Click to connect'
            }
          </div>
        </div>
        <Show when={props.isConnecting}>
          <div class="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </Show>
        <Show when={!props.isConnecting && props.connectionStatus === 'connected'}>
          <div class="text-green-500 font-bold">✓</div>
        </Show>
      </button>

      {/* MetaMask Option (Coming Soon) */}
      <button
        disabled
        class={`w-full p-4 border-2 opacity-50 cursor-not-allowed flex items-center gap-4 ${
          props.isDark
            ? 'bg-zinc-700 border-zinc-600'
            : 'bg-gray-50 border-gray-300'
        }`}
      >
        <div class={`w-10 h-10 flex items-center justify-center font-bold ${props.isDark ? 'text-orange-400' : 'text-orange-600'}`}>
          MM
        </div>
        <div class="flex-1 text-left">
          <div class={`font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
            MetaMask
          </div>
          <div class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Solana support coming soon
          </div>
        </div>
        <span class={`text-xs px-2 py-1 ${
          props.isDark ? 'bg-zinc-600 text-gray-300' : 'bg-gray-200 text-gray-600'
        }`}>
          Coming Soon
        </span>
      </button>

      {/* Mobile Installation Prompt */}
      <Show when={props.showMobileInstallation}>
        <MobileWalletInstallation
          isDark={props.isDark}
          platform={props.mobileInstallationPlatform}
          walletName="Phantom"
          onClose={props.onCloseMobileInstallation}
        />
      </Show>
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
  exchangeRate: number;
}

const ExchangeForm: Component<ExchangeFormProps> = (props) => {
  const MIN_SOL_AMOUNT = 0.01;

  const solAmountNum = createMemo(() => {
    const num = parseFloat(props.solAmount);
    return isNaN(num) ? 0 : num;
  });

  const isValidAmount = createMemo(() => {
    return solAmountNum() >= MIN_SOL_AMOUNT;
  });

  const splitdoAmount = createMemo(() => {
    // Calculate SPLITDO amount: SOL / exchange_rate
    // If exchange_rate is 0.11, then 1 SOL = 1/0.11 = ~9.09 SPLITDO
    if (props.exchangeRate <= 0) return 0;
    return Math.floor((solAmountNum() / props.exchangeRate) * 100) / 100; // Round to 2 decimals
  });

  const solPerSplitdo = createMemo(() => {
    return props.exchangeRate;
  });

  const splitdoPerSol = createMemo(() => {
    if (props.exchangeRate <= 0) return 0;
    return Math.floor((1 / props.exchangeRate) * 100) / 100;
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
          placeholder={`Enter SOL amount (min ${MIN_SOL_AMOUNT})`}
          min={MIN_SOL_AMOUNT}
          step="0.01"
          class={`w-full px-4 py-3 rounded-lg border transition-colors duration-200 ${
            props.isDark
              ? 'bg-zinc-700 border-zinc-600 text-white placeholder-gray-400 focus:border-blue-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
        />
        <Show when={props.solAmount && !isValidAmount()}>
          <p class="text-red-500 text-sm mt-1">
            Minimum amount is {MIN_SOL_AMOUNT} SOL
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
                ~{splitdoAmount().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SPLITDO
              </span>
            </div>
            <div class={`flex justify-between pt-2 border-t ${
              props.isDark ? 'border-zinc-600' : 'border-gray-200'
            }`}>
              <span class={`text-xs ${props.isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Exchange rate:
              </span>
              <span class={`text-xs ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                1 SOL ≈ {splitdoPerSol()} SPLITDO (${solPerSplitdo()} per token)
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
        <div class="p-3 bg-green-50 border border-green-200">
          <p class="text-green-700 text-sm font-medium">
            Exchange completed successfully! Your SPLITDO tokens will appear in your wallet shortly.
          </p>
        </div>
      </Show>
    </div>
  );
};