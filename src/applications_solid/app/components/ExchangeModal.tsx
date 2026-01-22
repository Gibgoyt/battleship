import type { Component } from 'solid-js';
import { Show, createSignal, createMemo, createEffect } from 'solid-js';
import { useUnifiedWallet } from 'src/applications_solid/app/lib/wallet/unified-wallet-context';
import { MobileWalletInstallation } from './MobileWalletInstallation';
import { detectMobilePlatform } from 'src/applications_solid/app/lib/wallet/mobile-detection';
import { executeMobileWalletDeepLink, attemptMobileWalletConnection } from 'src/applications_solid/app/lib/wallet/mobile-wallet-connector';
import { addMobileTransactionListener, setupMobileReturnListener } from 'src/applications_solid/app/lib/wallet/mobile-transaction-handler';

export interface ExchangeModalProps {
  isDark: boolean;
}

export const ExchangeModal: Component<ExchangeModalProps> = (props) => {
  const wallet = useUnifiedWallet();

  const [step, setStep] = createSignal<'wallet' | 'exchange'>('wallet');
  const [solAmount, setSolAmount] = createSignal('');
  const [isConnecting, setIsConnecting] = createSignal(false);
  const [showMobileInstallation, setShowMobileInstallation] = createSignal(false);
  const [mobileInstallationPlatform, setMobileInstallationPlatform] = createSignal<'ios' | 'android'>('ios');
  const [solPriceUSD, setSolPriceUSD] = createSignal(135.98); // Default fallback price

  // Track whether we've already fetched program info for the current modal session
  const [hasFetchedForCurrentModal, setHasFetchedForCurrentModal] = createSignal(false);

  // Function to fetch SOL price from CoinGecko
  const fetchSolPrice = async () => {
    try {
      const { middlewareFetch } = await import('src/applications_solid/app/middleware/endpoints');
      const response = await middlewareFetch.Endpoints.CoinGecko._Api.V3.Simple.Price.GET({
        ids: 'solana',
        vs_currencies: 'usd'
      });

      if (response.status === 200 && response.data.solana?.usd) {
        setSolPriceUSD(response.data.solana.usd);
        console.log('[ExchangeModal] SOL price updated:', response.data.solana.usd);
      } else {
        console.warn('[ExchangeModal] Failed to fetch SOL price, using fallback');
      }
    } catch (error) {
      console.error('[ExchangeModal] Error fetching SOL price:', error);
    }
  };

  // Fetch program info and SOL price when modal opens and setup mobile listeners
  createEffect(() => {
    if (wallet.isExchangeModalOpen() && !hasFetchedForCurrentModal()) {
      setHasFetchedForCurrentModal(true);
      wallet.fetchExchangeRates();
      fetchSolPrice();

      // Setup mobile wallet return listeners for iOS/Android deep links
      setupMobileReturnListener();
    } else if (!wallet.isExchangeModalOpen()) {
      // Reset when modal closes so next open triggers fetch
      setHasFetchedForCurrentModal(false);
    }
  });

  const handleClose = () => {
    wallet.closeExchangeModal();
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
    <Show when={wallet.isExchangeModalOpen()}>
    <div
      class="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div class={`absolute inset-0 transition-all duration-300 ${
        props.isDark ? 'modal-backdrop-dark' : 'modal-backdrop-light'
      }`} />

      {/* Modal Content */}
      <div
        class={`relative w-full max-w-2xl max-h-screen md:max-h-fit mx-2 sm:mx-4 p-0 rounded-xl shadow-2xl z-10 overflow-hidden transition-all duration-300 ${
          props.isDark
            ? 'bg-crypto-bg-primary border border-crypto-border'
            : 'bg-white/95 border border-gray-200/50 shadow-xl backdrop-blur-sm'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Professional Header */}
        <div class="bg-gradient-to-r from-crypto-primary-blue to-crypto-primary-cyan px-4 py-4 sm:px-8 sm:py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/splitdo/logo.png" alt="SPLITDO" class="w-8 h-8 object-contain" />
              </div>
              <div>
                <h2 class="text-xl sm:text-2xl font-bold text-white mb-1">
                  Exchange SOL for SPLITDO
                </h2>
                <p class="text-blue-100 opacity-90">
                  Secure token exchange powered by Solana
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              class="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white hover:bg-opacity-20 transition-colors text-xl font-light"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div class="p-4 sm:p-8 max-h-[calc(95vh-120px)] md:max-h-none overflow-y-auto">
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
                exchangeRate={wallet.exchangeRates()?.exchangeRate || 1}
                solPriceUSD={solPriceUSD()}
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
  onSelectWalletConnect: () => void;
  onCloseMobileInstallation: () => void;
}

const WalletSelection: Component<WalletSelectionProps> = (props) => {
  return (
    <div class="space-y-6">
      <div class="text-center">
        <h3 class={`text-2xl font-bold mb-2 ${props.isDark ? 'text-white' : 'text-gray-900'}`}>Connect Your Wallet</h3>
        <p class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Choose your preferred wallet to continue with the exchange
        </p>
      </div>

      {/* Phantom Wallet Option */}
      <button
        onClick={props.onSelectPhantom}
        disabled={props.isConnecting}
        class={`w-full p-6 border-2 transition-all duration-200 flex items-center gap-4 rounded-xl ${
          props.isConnecting
            ? `opacity-50 cursor-not-allowed ${props.isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`
            : `hover:border-blue-500 hover:shadow-lg cursor-pointer ${
                props.isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50'
              } ${
                props.connectionStatus === 'connected'
                  ? props.isDark
                    ? 'border-green-500 bg-green-900 bg-opacity-30'
                    : 'border-green-500 bg-green-50'
                  : ''
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
          <div class={`text-lg font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
            Phantom Wallet
          </div>
          <div class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {props.isConnecting
              ? 'Connecting...'
              : props.connectionStatus === 'connected'
              ? 'Connected - Ready to exchange'
              : 'Most popular Solana wallet'
            }
          </div>
        </div>
        <Show when={props.isConnecting}>
          <div class="w-5 h-5 border-2 border-crypto-primary-blue border-t-transparent rounded-full animate-spin"></div>
        </Show>
        <Show when={!props.isConnecting && props.connectionStatus === 'connected'}>
          <div class="text-crypto-accent-green font-bold text-xl">✓</div>
        </Show>
      </button>

      {/* MetaMask Option (Coming Soon) */}
      <button
        disabled
        class={`w-full p-6 border-2 opacity-50 cursor-not-allowed flex items-center gap-4 rounded-xl ${
          props.isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'
        }`}
      >
        <div class="w-10 h-10 flex items-center justify-center font-bold text-orange-400 bg-orange-100 rounded-full">
          MM
        </div>
        <div class="flex-1 text-left">
          <div class={`text-lg font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
            MetaMask
          </div>
          <div class={`text-sm ${props.isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            Solana support coming soon
          </div>
        </div>
        <span class={`text-xs px-3 py-1 rounded-full font-medium ${
          props.isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
        }`}>
          Coming Soon
        </span>
      </button>

      {/* WalletConnect Option */}
      <button
        onClick={props.onSelectWalletConnect}
        disabled={props.isConnecting}
        class={`w-full p-6 border-2 transition-all duration-200 flex items-center gap-4 rounded-xl ${
          props.isConnecting
            ? `opacity-50 cursor-not-allowed ${props.isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`
            : `hover:border-blue-500 hover:shadow-lg cursor-pointer ${
                props.isDark
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                  : 'bg-white border-gray-300 hover:bg-gray-50'
              }`
        }`}
      >
        <div class="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="text-white">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="flex-1 text-left">
          <div class={`text-lg font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
            WalletConnect
          </div>
          <div class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {props.isConnecting
              ? 'Connecting...'
              : 'Scan QR code with mobile wallet'
            }
          </div>
        </div>
        <Show when={props.isConnecting}>
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
        </Show>
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
  solPriceUSD: number;
}

const ExchangeForm: Component<ExchangeFormProps> = (props) => {
  const MIN_SOL_AMOUNT = 0.01;
  const SPLITDO_PRICE_USD = 0.11; // Fixed presale price: $0.11 per SPLITDO

  const solAmountNum = createMemo(() => {
    const num = parseFloat(props.solAmount);
    return isNaN(num) ? 0 : num;
  });

  const isValidAmount = createMemo(() => {
    return solAmountNum() >= MIN_SOL_AMOUNT;
  });

  // Calculate how much SOL is worth in USD
  const solValueUSD = createMemo(() => {
    return solAmountNum() * props.solPriceUSD;
  });

  // Calculate SPLITDO amount: SOL_USD_VALUE / SPLITDO_PRICE_USD
  // Example: 1 SOL @ $135.98 = $135.98 / $0.11 = ~1,236 SPLITDO
  const splitdoAmount = createMemo(() => {
    return Math.floor((solValueUSD() / SPLITDO_PRICE_USD) * 100) / 100; // Round to 2 decimals
  });

  // Calculate how many SPLITDO per 1 SOL (dynamic based on SOL price)
  const splitdoPerSol = createMemo(() => {
    return Math.floor((props.solPriceUSD / SPLITDO_PRICE_USD) * 100) / 100;
  });

  // USD equivalent calculations
  const splitdoPerUSD = createMemo(() => {
    return Math.floor((1 / SPLITDO_PRICE_USD) * 100) / 100; // 1 USD = ~9.09 SPLITDO
  });

  const handleExchange = async () => {
    if (!isValidAmount() || props.exchangeStatus === 'loading') return;
    await props.executeExchange(solAmountNum());
  };

  return (
    <div class="space-y-8">
      {/* Back Button */}
      <button
        onClick={props.onBack}
        class={`text-sm flex items-center gap-2 transition-colors ${
          props.isDark
            ? 'text-gray-400 hover:text-white'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        ← Back to wallet selection
      </button>

      {/* Input Section */}
      <div class="space-y-4">
        <div>
          <h3 class={`text-2xl font-bold mb-4 ${props.isDark ? 'text-white' : 'text-gray-900'}`}>Enter Exchange Amount</h3>
          <div class="relative">
            <label class={`block text-sm mb-3 ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              SOL Amount (minimum {MIN_SOL_AMOUNT})
            </label>
            <div class="relative">
              <input
                type="number"
                value={props.solAmount}
                onInput={(e) => props.setSolAmount(e.currentTarget.value)}
                placeholder="0.00"
                min={MIN_SOL_AMOUNT}
                step="0.01"
                class={`w-full px-6 py-4 text-xl font-semibold rounded-xl border-2 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  props.isDark
                    ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500 focus:border-blue-500'
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500'
                }`}
              />
              <div class={`absolute right-4 top-1/2 -translate-y-1/2 ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                SOL
              </div>
            </div>
            <Show when={props.solAmount && !isValidAmount()}>
              <div class="flex items-center gap-2 mt-3 text-crypto-accent-red text-sm">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="flex-shrink-0">
                  <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM7 4h2v5H7V4zm0 6h2v2H7v-2z"/>
                </svg>
                Minimum amount is {MIN_SOL_AMOUNT} SOL
              </div>
            </Show>
          </div>
        </div>
      </div>

      {/* Exchange Preview */}
      <Show when={isValidAmount()}>
        <div class={`rounded-xl p-6 border ${
          props.isDark
            ? 'bg-gray-800 border-gray-600'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <h4 class={`text-xl font-bold mb-4 flex items-center gap-2 ${
            props.isDark ? 'text-white' : 'text-gray-900'
          }`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="text-blue-500">
              <rect x="3" y="3" width="7" height="7" stroke="currentColor" stroke-width="2"/>
              <rect x="14" y="3" width="7" height="7" stroke="currentColor" stroke-width="2"/>
              <rect x="14" y="14" width="7" height="7" stroke="currentColor" stroke-width="2"/>
              <rect x="3" y="14" width="7" height="7" stroke="currentColor" stroke-width="2"/>
            </svg>
            Exchange Preview
          </h4>
          <div class="space-y-4">
            <div class="flex justify-between items-center py-3">
              <span class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>You pay:</span>
              <div class="text-right">
                <div class={`text-lg font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
                  {props.solAmount || '0'} SOL
                </div>
              </div>
            </div>

            <div class="flex justify-center">
              <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" class="fill-white rotate-90">
                  <path d="M8 1l-4 4h3v6h2V5h3L8 1z"/>
                </svg>
              </div>
            </div>

            <div class="flex justify-between items-center py-3">
              <span class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>You receive:</span>
              <div class="text-right">
                <div class="text-lg font-semibold text-green-500">
                  ~{splitdoAmount().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SPLITDO
                </div>
              </div>
            </div>

            <div class={`border-t pt-4 ${props.isDark ? 'border-gray-600' : 'border-gray-200'}`}>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class={`text-sm ${props.isDark ? 'text-gray-500' : 'text-gray-500'}`}>Current SOL Price:</span>
                  <span class={`text-sm font-semibold ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    ${props.solPriceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class={`text-sm ${props.isDark ? 'text-gray-500' : 'text-gray-500'}`}>Exchange Rate:</span>
                  <span class={`text-sm font-semibold ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    1 SOL = {splitdoPerSol().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SPLITDO
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class={`text-sm ${props.isDark ? 'text-gray-500' : 'text-gray-500'}`}>SPLITDO Price:</span>
                  <span class={`text-sm font-semibold ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    $0.11 USD = 1 SPLITDO (${splitdoPerUSD()} SPLITDO per $1)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* Exchange Button */}
      <button
        onClick={handleExchange}
        disabled={!isValidAmount() || props.exchangeStatus === 'loading'}
        class={`w-full py-4 px-6 font-bold text-lg rounded-xl transition-all duration-200 ${
          !isValidAmount() || props.exchangeStatus === 'loading'
            ? `cursor-not-allowed border-2 ${
                props.isDark
                  ? 'bg-gray-800 text-gray-500 border-gray-700'
                  : 'bg-gray-100 text-gray-400 border-gray-300'
              }`
            : 'bg-green-500 hover:bg-green-600 text-white hover:shadow-lg hover:shadow-green-500/20 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-30'
        }`}
      >
        <Show
          when={props.exchangeStatus !== 'loading'}
          fallback={
            <span class="flex items-center justify-center gap-3">
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing Exchange...
            </span>
          }
        >
          <span class="flex items-center justify-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="text-white">
              <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Exchange Tokens
          </span>
        </Show>
      </button>

      {/* Success Message */}
      <Show when={props.exchangeStatus === 'success'}>
        <div class={`p-4 border-2 border-crypto-accent-green rounded-xl ${
          props.isDark
            ? 'bg-green-900/20 text-green-100'
            : 'bg-green-50 text-green-900'
        }`}>
          <div class="flex items-center gap-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="text-crypto-accent-green flex-shrink-0">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <div>
              <div class="font-semibold text-crypto-accent-green mb-1">Exchange Successful!</div>
              <p class={`text-sm ${props.isDark ? 'text-green-200' : 'text-green-700'}`}>
                Your SPLITDO tokens have been deposited to your wallet.
              </p>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};