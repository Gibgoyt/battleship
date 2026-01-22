import type { Component, Accessor } from 'solid-js';
import { createSignal, Show, For } from 'solid-js';
import { useUnifiedWallet } from 'src/applications_solid/app/lib/wallet/unified-wallet-context';
import { getDeviceInfo } from '../lib/wallet/exchange-utils';

// Import install URLs for wallet installation
const WALLET_INSTALL_URLS = {
  phantom: 'https://phantom.app',
  metamask: 'https://metamask.io',
  solflare: 'https://solflare.com',
  backpack: 'https://backpack.app',
  glow: 'https://glow.app',
  slope: 'https://slope.finance',
  trust: 'https://trustwallet.com',
  coinbase: 'https://wallet.coinbase.com',
  ledger: 'https://www.ledger.com/ledger-live',
  trezor: 'https://trezor.io'
} as const;

interface WalletModalProps {
  isOpen: Accessor<boolean>;
  onClose: () => void;
  isDark: boolean;
}

const WalletModal: Component<WalletModalProps> = (props) => {
  const wallet = useUnifiedWallet();
  const [isConnecting, setIsConnecting] = createSignal<string | null>(null);
  const [connectionError, setConnectionError] = createSignal<string | null>(null);

  console.log('[WalletModal] Rendering with isOpen:', props.isOpen);

  // Enhanced connection status messages with better user guidance
  const getConnectionStatusMessage = (walletId: string): string => {
    if (walletId === 'phantom') {
      return 'Initializing Phantom connection • Check for popup window';
    } else if (walletId === 'metamask') {
      return 'Connecting to MetaMask • Check for popup window';
    }
    return `Connecting to ${walletId} • Check for popup window`;
  };

  const handleConnect = async (walletId: string) => {
    if (isConnecting()) return; // Prevent double-clicks

    const availableWallet = wallet.availableWallets().find(w => w.id === walletId);

    // If wallet not detected, open installation page
    if (!availableWallet?.isAvailable) {
      console.log('[WalletModal] Wallet not detected, opening installation page:', walletId);
      const installUrl = WALLET_INSTALL_URLS[walletId as keyof typeof WALLET_INSTALL_URLS];
      if (installUrl) {
        window.open(installUrl, '_blank');
      }
      return;
    }

    // FIXED: Remove direct phantom.connect() call - let wallet service handle it
    // The previous code was calling phantom.connect() directly AND then calling
    // wallet.connectWallet() which calls phantom.connect() again, causing double
    // connection attempts and preventing the popup from showing properly.

    // Set loading state before try block
    console.log('[WalletModal] Connecting to wallet:', walletId);
    setIsConnecting(walletId);
    setConnectionError(null);

    // Record user gesture for iOS authorization validation
    const deviceInfo = getDeviceInfo();
    if (deviceInfo.platform === 'iOS' && deviceInfo.isPhantomApp && walletId === 'phantom') {
      console.log('[WalletModal] 🎯 Recording iOS user gesture for Phantom authorization');
      // Store gesture timestamp for validation
      if (typeof window !== 'undefined') {
        (window as any).__lastUserGestureTime = Date.now();
      }
    }

    try {
      // Connect wallet using context system with timeout
      const connectionPromise = wallet.connectWallet(walletId);
      
      // Add 30-second timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout - Please try again')), 30000);
      });

      await Promise.race([connectionPromise, timeoutPromise]);

      // Only execute success flow if we reach here without error
      console.log('[WalletModal] Wallet connected successfully, closing modal');
      props.onClose?.();

    } catch (error) {
      console.error('[WalletModal] Wallet connection failed:', error);

      // Enhanced error handling with iOS-specific messages
      let errorMessage = 'Connection failed';
      const deviceInfo = getDeviceInfo();
      
      if (error instanceof Error) {
        if (error.message.includes('not been authorized') || error.message.includes('Authorization required')) {
          if (deviceInfo.platform === 'iOS' && deviceInfo.isPhantomApp) {
            errorMessage = 'Authorization required. Try refreshing the Phantom app or connecting again.';
          } else {
            errorMessage = 'App not authorized. Please try connecting again.';
          }
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Connection timeout - Please try again';
        } else if (error.message.includes('User rejected') || error.message.includes('cancelled')) {
          errorMessage = 'Connection cancelled by user';
        } else if (error.message.includes('IOS_AUTHORIZATION_FAILED')) {
          errorMessage = 'iOS authorization failed. Try refreshing Phantom app and connecting again.';
        } else {
          errorMessage = error.message;
        }
        
        // Log recovery steps if available
        if ((error as any).recoverySteps) {
          console.log('[WalletModal] Recovery steps available:', (error as any).recoverySteps);
        }
      }
      
      setConnectionError(errorMessage);

      // Don't close modal so user can see the error and try again
      console.log('[WalletModal] Connection failed, keeping modal open for retry');
    } finally {
      // CRITICAL: Always clear loading state, no matter what happens
      setIsConnecting(null);
      console.log('[WalletModal] Loading state cleared');
    }
  };

  console.log('[WalletModal] Rendering with isOpen:', props.isOpen());

  return (
    <Show when={props.isOpen()}>
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          class="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => props.onClose?.()}
        />

        {/* Modal */}
        <div class="relative w-full max-w-md bg-zinc-900 rounded-2xl shadow-2xl z-10 overflow-hidden">
          {/* Header */}
          <div class="px-6 py-5 border-b border-zinc-800">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold text-white">Connect Wallet</h2>
              <button
                onClick={() => props.onClose?.()}
                class="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white"
                aria-label="Close modal"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div class="p-6">
            {/* Connection Error */}
            <Show when={connectionError()}>
              <div class="mb-4 p-4 rounded-xl bg-red-500/10 text-red-400">
                <div class="flex items-start gap-3">
                  <svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                  </svg>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-red-300">Connection Failed</p>
                    <p class="text-sm mt-1 text-red-400/80">{connectionError()}</p>
                  </div>
                </div>
              </div>
            </Show>

            {/* Wallet List */}
            <div class="space-y-3">
              <For each={wallet.availableWallets()}>
                {(walletOption) => (
                  <button
                    onClick={() => handleConnect(walletOption.id)}
                    disabled={!!isConnecting()}
                    class={`w-full p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-all text-left group ${
                      isConnecting() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    } ${isConnecting() === walletOption.id ? 'ring-2 ring-cyan-500' : ''}`}
                  >
                    <div class="flex items-center gap-4">
                      <Show
                        when={walletOption.id === 'phantom'}
                        fallback={
                          <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-white text-xl flex-shrink-0">
                            {walletOption.icon}
                          </div>
                        }
                      >
                        <div class="w-11 h-11 flex items-center justify-center flex-shrink-0">
                          <img
                            src="https://mintcdn.com/phantom-e50e2e68/fkWrmnMWhjoXSGZ9/logo/phantom-light.svg?fit=max&auto=format&n=fkWrmnMWhjoXSGZ9&q=85&s=c21a66db70347ca7a31053b98a0b5b0a"
                            alt="Phantom"
                            class="w-11 h-11"
                          />
                        </div>
                      </Show>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="font-semibold text-white">{walletOption.name}</span>
                          <Show when={walletOption.isAvailable && walletOption.id === 'phantom'}>
                            <span class="text-[10px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded font-medium">
                              POPULAR
                            </span>
                          </Show>
                          <Show when={!walletOption.isAvailable}>
                            <span class="text-[10px] px-1.5 py-0.5 bg-zinc-700 text-zinc-400 rounded font-medium">
                              NOT INSTALLED
                            </span>
                          </Show>
                        </div>
                        <p class="text-sm text-zinc-500 mt-0.5">
                          <Show when={isConnecting() === walletOption.id} fallback={
                            walletOption.isAvailable 
                              ? (walletOption.id === 'phantom' ? 'Best for Solana & SPLITDO' : 'Multi-chain wallet')
                              : 'Click to install'
                          }>
                            <span class="text-cyan-400">Connecting...</span>
                          </Show>
                        </p>
                      </div>
                      <div class="flex-shrink-0">
                        <Show when={isConnecting() === walletOption.id} fallback={
                          <svg class="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                          </svg>
                        }>
                          <div class="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                        </Show>
                      </div>
                    </div>
                  </button>
                )}
              </For>
            </div>
          </div>

          {/* Footer */}
          <div class="px-6 py-4 bg-zinc-800/30 text-center">
            <p class="text-xs text-zinc-500">
              By connecting, you agree to our Terms of Service
            </p>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default WalletModal;