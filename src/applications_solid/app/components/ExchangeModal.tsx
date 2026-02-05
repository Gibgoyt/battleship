import type { Component } from 'solid-js';
import { Show, createSignal, createMemo, createEffect, onCleanup } from 'solid-js';
import { useUnifiedWallet } from 'src/applications_solid/app/lib/wallet/unified-wallet-context';
import { MobileWalletInstallation } from './MobileWalletInstallation';
import { detectMobilePlatform } from 'src/applications_solid/app/lib/wallet/mobile-detection';
import { executeMobileWalletDeepLink, attemptMobileWalletConnection } from 'src/applications_solid/app/lib/wallet/mobile-wallet-connector';
import { addMobileTransactionListener, setupMobileReturnListener } from 'src/applications_solid/app/lib/wallet/mobile-transaction-handler';
import { fetchSolPricePyth } from '../services/pyth-price';

export interface ExchangeModalProps {
  isDark: boolean;
}

export const ExchangeModal: Component<ExchangeModalProps> = (props) => {
  const wallet = useUnifiedWallet();

  // Skip wallet selection if already connected — go straight to exchange
  const [step, setStep] = createSignal<'wallet' | 'exchange'>(
    wallet.connectionStatus() === 'connected' ? 'exchange' : 'wallet'
  );
  const [solAmount, setSolAmount] = createSignal('');
  const [isConnecting, setIsConnecting] = createSignal(false);
  const [showMobileInstallation, setShowMobileInstallation] = createSignal(false);
  const [mobileInstallationPlatform, setMobileInstallationPlatform] = createSignal<'ios' | 'android'>('ios');
  const [solPriceUSD, setSolPriceUSD] = createSignal(0);
  const [isPriceRefreshing, setIsPriceRefreshing] = createSignal(false);

  // Track whether we've already fetched program info for the current modal session
  const [hasFetchedForCurrentModal, setHasFetchedForCurrentModal] = createSignal(false);

  // Function to fetch SOL price from Pyth
  const fetchSolPrice = async () => {
    try {
      setIsPriceRefreshing(true);
      const result = await fetchSolPricePyth();
      if (result) {
        setSolPriceUSD(result.price);
        console.log('[ExchangeModal] SOL price updated via Pyth:', result.price);
      } else {
        console.warn('[ExchangeModal] Failed to fetch SOL price from Pyth');
      }
    } catch (error) {
      console.error('[ExchangeModal] Error fetching SOL price:', error);
    } finally {
      setIsPriceRefreshing(false);
    }
  };

  // Fetch program info and SOL price when modal opens and setup mobile listeners
  createEffect(() => {
    if (wallet.isExchangeModalOpen() && !hasFetchedForCurrentModal()) {
      setHasFetchedForCurrentModal(true);
      wallet.fetchExchangeRates();
      fetchSolPrice();

      // Skip wallet selection if already connected
      if (wallet.connectionStatus() === 'connected') {
        setStep('exchange');
      }

      // Setup mobile wallet return listeners for iOS/Android deep links
      setupMobileReturnListener();
    } else if (!wallet.isExchangeModalOpen()) {
      // Reset when modal closes so next open triggers fetch
      setHasFetchedForCurrentModal(false);
    }
  });

  // Reactively switch to exchange step when wallet connects
  // This handles async connections and mobile deep link returns
  createEffect(() => {
    if (wallet.connectionStatus() === 'connected' && step() === 'wallet') {
      console.log('[ExchangeModal] Wallet connected - switching to exchange step');
      setStep('exchange');
    }
  });

  const handleClose = () => {
    wallet.closeExchangeModal();
    // Reset to exchange if connected, wallet selection otherwise
    setStep(wallet.connectionStatus() === 'connected' ? 'exchange' : 'wallet');
    setSolAmount('');
    setShowMobileInstallation(false);
  };

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <Show when={wallet.isExchangeModalOpen()}>
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        class="relative w-full max-w-lg max-h-[90vh] bg-zinc-900 rounded-2xl shadow-2xl z-10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div class="px-6 py-5 border-b border-zinc-800">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center overflow-hidden p-1.5">
                <img src="/splitdo/logo.svg" alt="SPLITDO" class="w-full h-full object-contain" />
              </div>
              <div>
                <h2 class="text-lg font-bold text-white">Exchange Tokens</h2>
                <p class="text-xs text-zinc-500">SOL to SPLITDO</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              class="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div class="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
          <Show
            when={step() === 'wallet'}
            fallback={
              <ExchangeForm
                isDark={props.isDark}
                solAmount={solAmount()}
                setSolAmount={setSolAmount}
                exchangeStatus={wallet.exchangeStatus()}
                exchangeError={wallet.exchangeError()}
                executeExchange={wallet.executeExchange}
                onBack={() => setStep('wallet')}
                showBack={wallet.connectionStatus() !== 'connected'}
                exchangeRate={wallet.exchangeRates()?.exchangeRate || 1}
                solPriceUSD={solPriceUSD()}
                isPriceRefreshing={isPriceRefreshing()}
                onRefreshPrice={fetchSolPrice}
              />
            }
          >
            <WalletSelection
              isDark={props.isDark}
              connectionStatus={wallet.connectionStatus()}
              isConnecting={isConnecting()}
              showMobileInstallation={showMobileInstallation()}
              mobileInstallationPlatform={mobileInstallationPlatform()}
              onSelectPhantom={async () => {
              if (wallet.connectionStatus() === 'connected') {
                // Already connected, go to exchange
                setStep('exchange');
              } else {
                // Need to connect wallet first
                setIsConnecting(true);
                try {
                  await wallet.connectWallet('phantom');
                  setStep('exchange');
                } catch (error) {
                  console.error('Failed to connect wallet:', error);
                } finally {
                  // Check if this should trigger mobile deep link flow (when desktop connection fails)
                  const mobileDetection = detectMobilePlatform();
                  if (mobileDetection.isMobile && wallet.connectionStatus() !== 'connected') {
                    console.log('[ExchangeModal] Mobile device detected - attempting deep link connection');

                    // Try mobile wallet connection
                    const mobileConnectionResult = attemptMobileWalletConnection('phantom');

                    if (mobileConnectionResult.success && mobileConnectionResult.deepLinkUrl) {
                      console.log('[ExchangeModal] Deep link available - opening Phantom app');

                      // Set up transaction listener before navigating to app
                      addMobileTransactionListener(
                        'phantom-exchange',
                        async (result) => {
                          console.log('[ExchangeModal] Mobile transaction result:', result);

                          if (result.success) {
                            console.log('[ExchangeModal] Mobile wallet connection successful - re-attempting wallet connection');

                            try {
                              // Re-attempt wallet connection now that mobile app has approved
                              await wallet.connectWallet('phantom');
                              setStep('exchange');
                              console.log('[ExchangeModal] Desktop wallet connection successful after mobile approval');
                            } catch (retryError) {
                              console.error('[ExchangeModal] Wallet connection still failed after mobile approval:', retryError);
                              // Keep trying - sometimes there's a delay
                              setTimeout(async () => {
                                try {
                                  await wallet.connectWallet('phantom');
                                  setStep('exchange');
                                } catch (delayedError) {
                                  console.error('[ExchangeModal] Delayed wallet connection also failed:', delayedError);
                                }
                              }, 2000);
                            }
                          } else {
                            console.error('[ExchangeModal] Mobile wallet connection failed:', result.error);
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
            onSelectMetaMask={async () => {
              if (wallet.connectionStatus() === 'connected') {
                // Already connected, go to exchange
                setStep('exchange');
              } else {
                // Need to connect MetaMask first
                setIsConnecting(true);
                try {
                  await wallet.connectWallet('metamask');
                  setStep('exchange');
                } catch (error) {
                  console.error('Failed to connect MetaMask:', error);
                } finally {
                  setIsConnecting(false);
                }
              }
            }}
            onSelectWalletConnect={async () => {
              if (wallet.connectionStatus() === 'connected') {
                // Already connected, go to exchange
                setStep('exchange');
              } else {
                // Need to connect WalletConnect
                setIsConnecting(true);
                try {
                  await wallet.connectWallet('walletconnect');  // This opens QR modal
                  setStep('exchange');
                } catch (error) {
                  console.error('Failed to connect WalletConnect:', error);
                } finally {
                  setIsConnecting(false);
                }
              }
            }}
            onCloseMobileInstallation={() => setShowMobileInstallation(false)}
          />
          </Show>
        </div>
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
  onSelectMetaMask: () => void;
  onSelectWalletConnect: () => void;
  onCloseMobileInstallation: () => void;
}

const WalletSelection: Component<WalletSelectionProps> = (props) => {
  return (
    <div class="space-y-4">
      <div class="text-center mb-6">
        <h3 class="text-xl font-bold text-white mb-1">Connect Wallet</h3>
        <p class="text-sm text-zinc-500">Select a wallet to continue</p>
      </div>

      {/* Phantom Wallet Option */}
      <button
        onClick={props.onSelectPhantom}
        disabled={props.isConnecting}
        class={`w-full p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-all text-left group ${
          props.isConnecting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${props.connectionStatus === 'connected' ? 'ring-2 ring-emerald-500' : ''}`}
      >
        <div class="flex items-center gap-4">
          <div class="w-11 h-11 flex items-center justify-center flex-shrink-0">
            <img
              src="https://mintcdn.com/phantom-e50e2e68/fkWrmnMWhjoXSGZ9/logo/phantom-light.svg?fit=max&auto=format&n=fkWrmnMWhjoXSGZ9&q=85&s=c21a66db70347ca7a31053b98a0b5b0a"
              alt="Phantom"
              class="w-11 h-11"
            />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-white">Phantom</span>
              <span class="text-[10px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded font-medium">POPULAR</span>
            </div>
            <p class="text-sm text-zinc-500 mt-0.5">
              {props.isConnecting ? 'Connecting...' : props.connectionStatus === 'connected' ? 'Connected' : 'Best for Solana'}
            </p>
          </div>
          <div class="flex-shrink-0">
            <Show when={props.isConnecting}>
              <div class="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            </Show>
            <Show when={!props.isConnecting && props.connectionStatus === 'connected'}>
              <div class="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </Show>
            <Show when={!props.isConnecting && props.connectionStatus !== 'connected'}>
              <svg class="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </Show>
          </div>
        </div>
        <Show when={props.isConnecting}>
          <div class="w-5 h-5 border-2 border-crypto-primary-blue border-t-transparent rounded-full animate-spin"></div>
        </Show>
        <Show when={!props.isConnecting && props.connectionStatus === 'connected'}>
          <div class="text-crypto-accent-green font-bold text-xl">✓</div>
        </Show>
      </button>

      {/* MetaMask Option */}
      <button
        onClick={props.onSelectMetaMask}
        disabled={props.isConnecting}
        class={`w-full p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-all text-left group ${
          props.isConnecting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <div class="flex items-center gap-4">
          <div class="w-11 h-11 flex items-center justify-center bg-gradient-to-br from-orange-500 to-yellow-600 rounded-xl flex-shrink-0">
            <span class="text-white font-bold text-sm">M</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-white">MetaMask</span>
            </div>
            <p class="text-sm text-zinc-500 mt-0.5">
              {props.isConnecting && props.connectionStatus === 'connecting' ? 'Connecting...' : 'Secure Solana wallet'}
            </p>
          </div>
          <div class="flex-shrink-0">
            <Show when={props.isConnecting && props.connectionStatus === 'connecting'} fallback={
              <Show when={props.connectionStatus === 'connected'} fallback={
                <svg class="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              }>
                <div class="w-5 h-5 text-green-400 flex items-center justify-center">✓</div>
              </Show>
            }>
              <div class="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
            </Show>
          </div>
        </div>
      </button>

      {/* WalletConnect Option */}
      <button
        onClick={props.onSelectWalletConnect}
        disabled={props.isConnecting}
        class={`w-full p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-all text-left group ${
          props.isConnecting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <div class="flex items-center gap-4">
          <div class="w-11 h-11 flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex-shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" class="text-white">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-white">WalletConnect</span>
            </div>
            <p class="text-sm text-zinc-500 mt-0.5">
              {props.isConnecting ? 'Connecting...' : 'Scan QR with mobile'}
            </p>
          </div>
          <div class="flex-shrink-0">
            <Show when={props.isConnecting} fallback={
              <svg class="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            }>
              <div class="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            </Show>
          </div>
        </div>
      </button>

      {/* MetaMask Option (Coming Soon) */}
      <button
        disabled
        class="w-full p-4 rounded-xl bg-zinc-800/30 text-left opacity-50 cursor-not-allowed"
      >
        <div class="flex items-center gap-4">
          <div class="w-11 h-11 flex items-center justify-center bg-orange-500/20 rounded-xl flex-shrink-0">
            <span class="text-orange-400 font-bold text-sm">MM</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-zinc-400">MetaMask</span>
              <span class="text-[10px] px-1.5 py-0.5 bg-zinc-700 text-zinc-500 rounded font-medium">SOON</span>
            </div>
            <p class="text-sm text-zinc-600 mt-0.5">Coming soon</p>
          </div>
        </div>
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
  showBack: boolean;
  exchangeRate: number;
  solPriceUSD: number;
  isPriceRefreshing: boolean;
  onRefreshPrice: () => Promise<void>;
}

// Countdown timer duration in seconds
const PRICE_REFRESH_INTERVAL = 5;

const ExchangeForm: Component<ExchangeFormProps> = (props) => {
  const MIN_SOL_AMOUNT = 0.01;
  const SPLITDO_PRICE_USD = 0.11;

  // Countdown state for price refresh
  const [countdown, setCountdown] = createSignal(PRICE_REFRESH_INTERVAL);
  let countdownInterval: ReturnType<typeof setInterval> | null = null;

  // Start/restart the countdown timer
  const startCountdown = () => {
    if (countdownInterval) clearInterval(countdownInterval);
    setCountdown(PRICE_REFRESH_INTERVAL);

    countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Timer expired - refresh price
          if (countdownInterval) clearInterval(countdownInterval);
          props.onRefreshPrice().then(() => {
            // Restart countdown after price refresh
            startCountdown();
          });
          return PRICE_REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start countdown when component mounts / price is available
  createEffect(() => {
    if (props.solPriceUSD > 0) {
      startCountdown();
    }
  });

  // Cleanup on unmount
  onCleanup(() => {
    if (countdownInterval) clearInterval(countdownInterval);
  });

  // SVG countdown ring calculations
  const ringRadius = 12;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringProgress = createMemo(() => {
    return (countdown() / PRICE_REFRESH_INTERVAL) * ringCircumference;
  });

  const solAmountNum = createMemo(() => {
    const num = parseFloat(props.solAmount);
    return isNaN(num) ? 0 : num;
  });

  const isValidAmount = createMemo(() => {
    return solAmountNum() >= MIN_SOL_AMOUNT;
  });

  const solValueUSD = createMemo(() => {
    return solAmountNum() * props.solPriceUSD;
  });

  const splitdoAmount = createMemo(() => {
    return Math.floor((solValueUSD() / SPLITDO_PRICE_USD) * 100) / 100;
  });

  const splitdoPerSol = createMemo(() => {
    return Math.floor((props.solPriceUSD / SPLITDO_PRICE_USD) * 100) / 100;
  });

  const handleExchange = async () => {
    if (!isValidAmount() || props.exchangeStatus === 'loading' || props.isPriceRefreshing) return;
    // Stop countdown during exchange
    if (countdownInterval) clearInterval(countdownInterval);
    await props.executeExchange(solAmountNum());
  };

  return (
    <div class="space-y-5">
      {/* Back Button - only show if wallet selection step is available */}
      <Show when={props.showBack}>
        <button
          onClick={props.onBack}
          class="text-sm flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </Show>

      {/* You Pay */}
      <div>
        <label class="text-sm text-zinc-500 mb-2 block">You Pay</label>
        <div class="p-4 rounded-xl bg-zinc-800/50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-zinc-700 flex items-center justify-center overflow-hidden p-2 flex-shrink-0">
              <img src="/solana-logo.svg" alt="SOL" class="w-full h-full object-contain" />
            </div>
            <div class="flex-1">
              <input
                type="number"
                value={props.solAmount}
                onInput={(e) => props.setSolAmount(e.currentTarget.value)}
                placeholder="0.00"
                min={MIN_SOL_AMOUNT}
                step="0.01"
                class="w-full text-2xl font-bold bg-transparent border-none focus:outline-none text-white placeholder-zinc-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div class="text-xs text-zinc-500 mt-0.5">
                {solAmountNum() > 0 ? `~$${solValueUSD().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` : 'Enter amount'}
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="font-semibold text-white">SOL</div>
            </div>
          </div>
        </div>
        <Show when={props.solAmount && !isValidAmount()}>
          <p class="text-xs text-red-400 mt-2">Minimum: {MIN_SOL_AMOUNT} SOL</p>
        </Show>
      </div>

      {/* Swap Arrow */}
      <div class="flex justify-center -my-1">
        <div class="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
          <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* You Receive */}
      <div>
        <label class="text-sm text-zinc-500 mb-2 block">You Receive</label>
        <div class={`p-4 rounded-xl ${isValidAmount() ? 'bg-cyan-500/10' : 'bg-zinc-800/50'}`}>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-zinc-700 flex items-center justify-center overflow-hidden p-1.5 flex-shrink-0">
              <img src="/splitdo/logo.svg" alt="SPLITDO" class="w-full h-full object-contain" />
            </div>
            <div class="flex-1">
              <div class={`text-2xl font-bold ${isValidAmount() ? 'text-cyan-400' : 'text-zinc-600'}`}>
                {isValidAmount() ? `~${splitdoAmount().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '0.00'}
              </div>
              <div class="text-xs text-zinc-500 mt-0.5">
                {isValidAmount() ? `~$${(splitdoAmount() * 0.11).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` : 'Output amount'}
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <div class="font-semibold text-white">SPLITDO</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rate Info with Countdown Ring */}
      <Show when={isValidAmount()}>
        <div class="p-3 rounded-xl bg-zinc-800/30 space-y-2">
          <div class="flex justify-between items-center text-sm">
            <span class="text-zinc-500">Rate</span>
            <div class="flex items-center gap-2">
              <span class="text-white">1 SOL = {splitdoPerSol().toLocaleString()} SPLITDO</span>
              {/* Countdown Ring */}
              <div class="relative w-7 h-7 flex items-center justify-center">
                <svg class="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
                  {/* Background circle */}
                  <circle
                    cx="14"
                    cy="14"
                    r={ringRadius}
                    fill="none"
                    stroke="rgb(63, 63, 70)"
                    stroke-width="2"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="14"
                    cy="14"
                    r={ringRadius}
                    fill="none"
                    stroke="rgb(6, 182, 212)"
                    stroke-width="2"
                    stroke-dasharray={String(ringCircumference)}
                    stroke-dashoffset={String(ringCircumference - ringProgress())}
                    stroke-linecap="round"
                    class="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <span class="absolute text-[9px] font-bold text-cyan-400">{countdown()}</span>
              </div>
            </div>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-zinc-500">SOL Price</span>
            <div class="flex items-center gap-2">
              <Show when={props.isPriceRefreshing}>
                <div class="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              </Show>
              <span class="text-white">${props.solPriceUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <span class="text-[10px] text-zinc-600">live</span>
            </div>
          </div>
        </div>
      </Show>

      {/* Exchange Button */}
      <button
        onClick={handleExchange}
        disabled={!isValidAmount() || props.exchangeStatus === 'loading' || props.isPriceRefreshing || props.solPriceUSD === 0}
        class={`w-full py-4 font-bold text-base rounded-xl transition-all ${
          !isValidAmount() || props.exchangeStatus === 'loading' || props.isPriceRefreshing || props.solPriceUSD === 0
            ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white'
        }`}
      >
        <Show when={props.exchangeStatus !== 'loading'} fallback={
          <span class="flex items-center justify-center gap-2">
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Processing...
          </span>
        }>
          <Show when={!props.isPriceRefreshing} fallback={
            <span class="flex items-center justify-center gap-2">
              <div class="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
              Refreshing price...
            </span>
          }>
            Exchange Tokens
          </Show>
        </Show>
      </button>

      {/* Success */}
      <Show when={props.exchangeStatus === 'success'}>
        <div class="p-4 rounded-xl bg-emerald-500/10 text-emerald-400">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div class="font-semibold text-emerald-300">Exchange Successful!</div>
              <p class="text-sm text-emerald-400/80">SPLITDO tokens sent to your wallet</p>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};