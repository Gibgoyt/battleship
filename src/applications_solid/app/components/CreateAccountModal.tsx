import type { Component } from 'solid-js';
import { Show, createSignal, createEffect } from 'solid-js';
import { useUnifiedWallet } from 'src/applications_solid/app/lib/wallet/unified-wallet-context';
import { MobileWalletInstallation } from './MobileWalletInstallation';
import { detectMobilePlatform } from 'src/applications_solid/app/lib/wallet/mobile-detection';
import { executeMobileWalletDeepLink, attemptMobileWalletConnection } from 'src/applications_solid/app/lib/wallet/mobile-wallet-connector';
import { addMobileTransactionListener, setupMobileReturnListener } from 'src/applications_solid/app/lib/wallet/mobile-transaction-handler';

export interface CreateAccountModalProps {
  isDark: boolean;
}

export const CreateAccountModal: Component<CreateAccountModalProps> = (props) => {
  const wallet = useUnifiedWallet();

  // DEBUG: Log modal state changes
  createEffect(() => {
    console.log('[CreateAccountModal] Modal state changed:', {
      isOpen: wallet.isCreateAccountModalOpen(),
      componentRendered: true,
      props: props
    });
  });

  const [step, setStep] = createSignal<'wallet' | 'create'>('wallet');
  const [isConnecting, setIsConnecting] = createSignal(false);
  const [showMobileInstallation, setShowMobileInstallation] = createSignal(false);
  const [mobileInstallationPlatform, setMobileInstallationPlatform] = createSignal<'ios' | 'android'>('ios');
  const [isCreating, setIsCreating] = createSignal(false);
  const [creationError, setCreationError] = createSignal<string | null>(null);
  const [creationSuccess, setCreationSuccess] = createSignal(false);

  // Auto-advance to create step if wallet already connected
  const checkWalletAndAdvance = () => {
    if (wallet.connectionStatus() === 'connected' && wallet.wallet()) {
      setStep('create');
    }
  };

  // Auto-advance to create step when modal opens and wallet is connected
  createEffect(() => {
    if (wallet.isCreateAccountModalOpen() && wallet.connectionStatus() === 'connected' && wallet.wallet()) {
      console.log('[CreateAccountModal] Wallet connected, advancing to create step');
      setStep('create');
    }
  });

  // Handle backdrop click
  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    wallet.closeCreateAccountModal();
    // Reset all state when closing
    setStep('wallet');
    setIsConnecting(false);
    setShowMobileInstallation(false);
    setIsCreating(false);
    setCreationError(null);
    setCreationSuccess(false);
  };


  return (
    <Show when={wallet.isCreateAccountModalOpen()}>
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
        class={`relative w-full max-w-2xl mx-4 p-0 rounded-xl shadow-2xl z-10 overflow-hidden transition-all duration-300 ${
          props.isDark
            ? 'bg-crypto-bg-primary border border-crypto-border'
            : 'bg-gray-100 border border-gray-300 shadow-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Professional Header */}
        <div class="bg-gradient-to-r from-crypto-primary-blue to-crypto-primary-cyan px-4 py-4 sm:px-8 sm:py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden p-1">
                <img src="/splitdo/logo.svg" alt="SPLITDO" class="w-full h-full object-contain" />
              </div>
              <div>
                <h2 class="text-xl sm:text-2xl font-bold text-white mb-1">
                  Create SPLITDO Account
                </h2>
                <p class="text-blue-100 opacity-90">
                  Set up your token account to start trading
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
        <div class="p-8">
          <Show
            when={step() === 'wallet'}
            fallback={
              <CreateAccountForm
                isDark={props.isDark}
                isCreating={isCreating}
                creationError={creationError}
                creationSuccess={creationSuccess}
                createSplitdoATA={wallet.createSplitdoATA}
                setIsCreating={setIsCreating}
                setCreationError={setCreationError}
                setCreationSuccess={setCreationSuccess}
                onClose={handleClose}
              />
            }
          >
            <WalletSelection
              isDark={props.isDark}
              connectionStatus={wallet.connectionStatus}
              isConnecting={isConnecting}
              showMobileInstallation={showMobileInstallation}
              mobileInstallationPlatform={mobileInstallationPlatform}
              onSelectPhantom={async () => {
                if (wallet.connectionStatus() === 'connected') {
                  // Already connected, go to create
                  setStep('create');
                } else {
                  // Need to connect wallet first
                  setIsConnecting(true);
                  try {
                    await wallet.connectWallet('phantom');
                    setStep('create');
                  } catch (error: any) {
                    console.error('[CreateAccountModal] Connection failed:', error);

                    // Handle mobile wallet flow exactly like ExchangeModal
                    const platform = detectMobilePlatform();
                    if (platform && (platform === 'ios' || platform === 'android')) {
                      const isDeepLinkResult = await executeMobileWalletDeepLink('phantom');

                      if (isDeepLinkResult.success) {
                        console.log('[CreateAccountModal] Successfully opened Phantom mobile app');

                        const mobileConnectionResult = await attemptMobileWalletConnection('phantom');

                        if (!mobileConnectionResult.success) {
                          if (mobileConnectionResult.reason === 'not_installed') {
                            setMobileInstallationPlatform(platform);
                            setShowMobileInstallation(true);
                          } else {
                            setCreationError(`Mobile connection failed: ${mobileConnectionResult.reason}`);
                          }
                        } else {
                          setStep('create');
                        }
                      } else {
                        setMobileInstallationPlatform(platform);
                        setShowMobileInstallation(true);
                      }
                    } else {
                      setCreationError('Failed to connect wallet. Please try again.');
                    }
                  } finally {
                    setIsConnecting(false);
                  }
                }
              }}
              onSelectMetaMask={async () => {
                if (wallet.connectionStatus() === 'connected') {
                  // Already connected, go to create
                  setStep('create');
                } else {
                  // Need to connect wallet first
                  setIsConnecting(true);
                  try {
                    await wallet.connectWallet('metamask');
                    setStep('create');
                  } catch (error: any) {
                    console.error('[CreateAccountModal] MetaMask connection failed:', error);
                    setCreationError('Failed to connect MetaMask. Please try again.');
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

// Wallet Selection Component (reusing ExchangeModal pattern)
const WalletSelection: Component<{
  isDark: boolean;
  connectionStatus: () => string;
  isConnecting: () => boolean;
  showMobileInstallation: () => boolean;
  mobileInstallationPlatform: () => 'ios' | 'android';
  onSelectPhantom: () => Promise<void>;
  onSelectMetaMask: () => Promise<void>;
  onCloseMobileInstallation: () => void;
}> = (props) => {
  return (
    <div>
      <Show
        when={!props.showMobileInstallation()}
        fallback={
          <MobileWalletInstallation
            platform={props.mobileInstallationPlatform()}
            onClose={props.onCloseMobileInstallation}
            isDark={props.isDark}
          />
        }
      >
        <div class="text-center mb-8">
          <h3 class={`text-xl font-semibold mb-2 ${
            props.isDark ? 'text-crypto-text-primary' : 'text-gray-900'
          }`}>
            Connect Your Wallet
          </h3>
          <p class={`text-sm ${
            props.isDark ? 'text-crypto-text-secondary' : 'text-black'
          }`}>
            Choose your preferred wallet to create your SPLITDO account
          </p>
        </div>

        <div class="space-y-4">
          {/* Phantom Wallet Option */}
          <button
            onClick={props.onSelectPhantom}
            disabled={props.isConnecting()}
            class={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center space-x-4 ${
              props.isDark
                ? 'border-crypto-border bg-crypto-bg-secondary hover:bg-crypto-bg-tertiary text-crypto-text-primary'
                : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-900'
            } ${props.isConnecting() ? 'opacity-50 cursor-not-allowed' : 'hover:border-crypto-accent-purple cursor-pointer'}`}
          >
            <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span class="text-white font-bold text-lg">P</span>
            </div>
            <div class="flex-1 text-left">
              <h4 class="font-semibold">Phantom</h4>
              <p class="text-sm opacity-70">Secure Solana wallet</p>
            </div>
            <Show when={props.isConnecting()}>
              <div class="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </Show>
          </button>

          {/* MetaMask Wallet Option */}
          <button
            onClick={props.onSelectMetaMask}
            disabled={props.isConnecting()}
            class={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center space-x-4 ${
              props.isDark
                ? 'border-crypto-border bg-crypto-bg-secondary hover:bg-crypto-bg-tertiary text-crypto-text-primary'
                : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-900'
            } ${props.isConnecting() ? 'opacity-50 cursor-not-allowed' : 'hover:border-orange-500 cursor-pointer'}`}
          >
            <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-xl flex items-center justify-center">
              <span class="text-white font-bold text-lg">M</span>
            </div>
            <div class="flex-1 text-left">
              <h4 class="font-semibold">MetaMask</h4>
              <p class="text-sm opacity-70">Solana Snaps wallet</p>
            </div>
            <Show when={props.isConnecting()}>
              <div class="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </Show>
          </button>
        </div>
      </Show>
    </div>
  );
};

// Create Account Form Component
const CreateAccountForm: Component<{
  isDark: boolean;
  isCreating: () => boolean;
  creationError: () => string | null;
  creationSuccess: () => boolean;
  createSplitdoATA: () => Promise<any>;
  setIsCreating: (value: boolean) => void;
  setCreationError: (value: string | null) => void;
  setCreationSuccess: (value: boolean) => void;
  onClose: () => void;
}> = (props) => {

  const handleCreateAccount = async () => {
    props.setIsCreating(true);
    props.setCreationError(null);
    props.setCreationSuccess(false);

    try {
      console.log('[CreateAccountModal] Starting SPLITDO account creation...');
      const result = await props.createSplitdoATA();

      if (result.success) {
        props.setCreationSuccess(true);
        console.log('[CreateAccountModal] Account creation successful!');

        // Auto-close after 3 seconds on success
        setTimeout(() => {
          props.onClose();
        }, 3000);
      } else {
        throw new Error(result.error || 'Account creation failed');
      }
    } catch (error: any) {
      console.error('[CreateAccountModal] Account creation failed:', error);

      // User-friendly error messages
      let userFriendlyMessage = error.message || 'Unknown error occurred';

      if (error.message?.includes('timeout')) {
        userFriendlyMessage = 'Transaction signing timed out. Please try again.';
      } else if (error.message?.includes('User rejected')) {
        userFriendlyMessage = 'Transaction was cancelled. Please try again when ready.';
      } else if (error.message?.includes('Insufficient SOL')) {
        userFriendlyMessage = 'Insufficient SOL balance for transaction fees. Please add SOL to your wallet.';
      } else if (error.message?.includes('Backend API is not available')) {
        userFriendlyMessage = 'Service temporarily unavailable. Please try again in a moment.';
      }

      props.setCreationError(userFriendlyMessage);
    } finally {
      props.setIsCreating(false);
    }
  };

  return (
    <div class="text-center">
      <Show when={!props.creationSuccess()} fallback={
        <div class="space-y-6">
          <div class={`w-16 h-16 mx-auto rounded-full bg-green-500 flex items-center justify-center ${
            props.isDark ? 'shadow-lg shadow-green-500/20' : ''
          }`}>
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div>
            <h3 class={`text-xl font-semibold mb-2 text-green-600`}>
              Account Created Successfully!
            </h3>
            <p class={`text-sm ${
              props.isDark ? 'text-crypto-text-secondary' : 'text-black'
            }`}>
              Your SPLITDO account is ready. You can now start trading!
            </p>
          </div>
        </div>
      }>
        <div class="space-y-6">
          <div class="text-center mb-6">
            <div class={`w-16 h-16 mx-auto rounded-xl bg-zinc-800 flex items-center justify-center mb-4 overflow-hidden p-2 ${
              props.isDark ? 'shadow-lg shadow-crypto-primary-blue/20' : ''
            }`}>
              <img src="/splitdo/logo.svg" alt="SPLITDO" class="w-full h-full object-contain" />
            </div>
            <h3 class={`text-xl font-semibold mb-2 ${
              props.isDark ? 'text-crypto-text-primary' : 'text-gray-900'
            }`}>
              Create Your SPLITDO Account
            </h3>
            <p class={`text-sm ${
              props.isDark ? 'text-crypto-text-secondary' : 'text-black'
            }`}>
              This will create an Associated Token Account (ATA) for SPLITDO tokens on your wallet.
            </p>
          </div>

          {/* Error Display */}
          <Show when={props.creationError()}>
            <div class="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p class="text-red-500 text-sm">{props.creationError()}</p>
            </div>
          </Show>

          {/* Create Account Button */}
          <button
            onClick={handleCreateAccount}
            disabled={props.isCreating()}
            class={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
              props.isCreating()
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-crypto-primary-blue to-crypto-primary-cyan text-white hover:shadow-lg hover:shadow-crypto-primary-blue/30 transform hover:-translate-y-0.5'
            }`}
          >
            <Show when={!props.isCreating()} fallback={
              <div class="flex items-center justify-center space-x-2">
                <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </div>
            }>
              Create SPLITDO Account
            </Show>
          </button>

          <p class={`text-xs ${
            props.isDark ? 'text-crypto-text-secondary' : 'text-gray-600'
          }`}>
            This transaction requires a small SOL fee for account creation (~0.001 SOL)
          </p>
        </div>
      </Show>
    </div>
  );
};