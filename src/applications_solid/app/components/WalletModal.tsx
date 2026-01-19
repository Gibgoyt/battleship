import type { Component, Accessor } from 'solid-js';
import { createSignal, Show, For } from 'solid-js';
import { useUnifiedWallet } from 'src/applications_solid/app/lib/wallet/unified-wallet-context';

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

    // CRITICAL: For Phantom, trigger connect() IMMEDIATELY in user gesture context
    let phantomConnectionPromise: Promise<any> | null = null;
    if (walletId === 'phantom') {
      console.log('[WalletModal] IMMEDIATE Phantom connect trigger in user gesture context');

      // Check if Phantom is available
      const phantom = (window as any).phantom?.solana;
      if (phantom?.isPhantom) {
        // Check Phantom state before calling connect
        console.log('[WalletModal] Phantom state check:', {
          isPhantom: phantom.isPhantom,
          isConnected: phantom.isConnected,
          publicKey: phantom.publicKey,
          readyState: phantom.readyState
        });

        // Check if already connected
        if (phantom.isConnected && phantom.publicKey) {
          console.log('[WalletModal] Phantom already connected, skipping connect() call');
          // Create a resolved promise for already connected state
          phantomConnectionPromise = Promise.resolve({
            publicKey: phantom.publicKey
          });
        } else {
          // Trigger popup IMMEDIATELY - this must happen before any state updates
          console.log('[WalletModal] Calling phantom.connect() IMMEDIATELY');

          try {
            phantomConnectionPromise = phantom.connect();
            console.log('[WalletModal] Phantom connect() called - popup should appear now');

            // Add immediate diagnostics
            setTimeout(() => {
              console.log('[WalletModal] 🕐 1 second check - popup appeared?');
              console.log('[WalletModal] Document state:', {
                hidden: document.hidden,
                visibilityState: document.visibilityState,
                hasFocus: document.hasFocus()
              });
            }, 1000);

            // Add promise state monitoring
            let promiseResolved = false;
            phantomConnectionPromise.then(() => {
              promiseResolved = true;
              console.log('[WalletModal] ✅ Phantom connection promise RESOLVED');
            }).catch((error) => {
              promiseResolved = true;
              console.log('[WalletModal] ❌ Phantom connection promise REJECTED:', error);
            });

            // Monitor if promise never resolves
            setTimeout(() => {
              if (!promiseResolved) {
                console.log('[WalletModal] ⚠️  WARNING: Phantom connection promise still pending after 5 seconds');
                console.log('[WalletModal] This suggests Phantom is not responding');
              }
            }, 5000);

          } catch (error) {
            console.error('[WalletModal] Error calling phantom.connect():', error);
            setConnectionError(`Failed to trigger Phantom connection: ${error}`);
            return;
          }
        }
      } else {
        setConnectionError('Phantom wallet not found. Please install Phantom and refresh the page.');
        return;
      }
    }

    try {
      console.log('[WalletModal] Connecting to wallet:', walletId);
      setIsConnecting(walletId);
      setConnectionError(null);

      // Connect wallet using context system
      // Note: Phantom-specific optimization moved to context layer
      await wallet.connectWallet(walletId);

      // Close modal on successful connection
      props.onClose?.();
      console.log('[WalletModal] Wallet connected successfully, closing modal');

    } catch (error) {
      console.error('[WalletModal] Wallet connection failed:', error);

      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setConnectionError(errorMessage);

      // Stop the connecting animation
      setIsConnecting(null);

      // Don't close modal so user can see the error and try again
      console.log('[WalletModal] Connection failed, keeping modal open for retry');
    }
  };

  console.log('[WalletModal] Rendering with isOpen:', props.isOpen());

  return (
    <Show when={props.isOpen()}>
      <div class="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        class="absolute inset-0 bg-black bg-opacity-50"
        onClick={() => props.onClose?.()}
      />

      {/* Modal */}
      <div class={`relative w-full max-w-md mx-4 p-6 rounded-lg shadow-xl z-10 ${
        props.isDark ? 'bg-zinc-800 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold">Connect Wallet</h2>
          <button
            onClick={() => props.onClose?.()}
            class={`p-2 rounded-lg hover:bg-opacity-10 transition-colors ${
              props.isDark ? 'hover:bg-white' : 'hover:bg-gray-500'
            }`}
            aria-label="Close modal"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Connection Error */}
        <Show when={connectionError()}>
          <div class={`p-3 mb-4 rounded-lg border ${
            props.isDark ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <p class="text-sm font-medium">Connection Error</p>
            <p class="text-sm mt-1">{connectionError()}</p>
          </div>
        </Show>

        {/* Dynamic Wallet List */}
        <div class="space-y-3">
          <For each={wallet.availableWallets()}>
            {(wallet) => (
              <button
                onClick={() => handleConnect(wallet.id)}
                disabled={!!isConnecting()}
                class={`w-full p-4 rounded-lg border transition-all duration-200 text-left ${
                  props.isDark
                    ? 'border-zinc-600 bg-zinc-700 hover:bg-zinc-600'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                } ${isConnecting() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
                  isConnecting() === wallet.id ? 'animate-pulse' : ''
                } ${!wallet.isAvailable ? 'border-dashed' : ''}`}
              >
                <div class="flex items-center space-x-4">
                  <Show
                    when={wallet.id === 'phantom'}
                    fallback={
                      <div class={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl ${
                        wallet.id === 'phantom'
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                          : 'bg-gradient-to-br from-orange-500 to-yellow-500'
                      }`}>
                        {wallet.icon}
                      </div>
                    }
                  >
                    <div class="w-12 h-12 flex items-center justify-center">
                      <img
                        src={props.isDark
                          ? "https://mintcdn.com/phantom-e50e2e68/fkWrmnMWhjoXSGZ9/logo/phantom-light.svg?fit=max&auto=format&n=fkWrmnMWhjoXSGZ9&q=85&s=c21a66db70347ca7a31053b98a0b5b0a"
                          : "https://mintcdn.com/phantom-e50e2e68/fkWrmnMWhjoXSGZ9/logo/phantom-dark.svg?fit=max&auto=format&n=fkWrmnMWhjoXSGZ9&q=85&s=af17fb78921412073a894ea97523898c"
                        }
                        alt="Phantom"
                        class="w-12 h-12"
                      />
                    </div>
                  </Show>
                  <div class="flex-1">
                    <div class="flex items-center space-x-2">
                      <h3 class="font-semibold text-lg">{wallet.name}</h3>
                      <Show when={wallet.isAvailable} fallback={
                        <span class={`px-2 py-1 rounded-full text-xs font-medium ${
                          props.isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                        }`}>
                          Not Installed
                        </span>
                      }>
                        <span class={`px-2 py-1 rounded-full text-xs font-medium ${
                          wallet.id === 'phantom'
                            ? (props.isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800')
                            : (props.isDark ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800')
                        }`}>
                          {wallet.id === 'phantom' ? 'Popular' : 'Widely Used'}
                        </span>
                      </Show>
                    </div>
                    <p class={`text-sm mt-1 ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Show when={isConnecting() === wallet.id} fallback={wallet.description}>
                        <Show when={wallet.isAvailable} fallback={`Connecting to ${wallet.name}...`}>
                          <span class="inline-flex items-center space-x-2">
                            <div class="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>
                              {getConnectionStatusMessage(wallet.id)}
                            </span>
                          </span>
                        </Show>
                      </Show>
                    </p>
                    <Show when={!wallet.isAvailable}>
                      <p class={`text-xs mt-1 ${props.isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                        Click to install • Opens {wallet.name} website
                      </p>
                    </Show>
                    <Show when={wallet.isAvailable}>
                      <p class={`text-xs mt-1 ${props.isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {wallet.id === 'phantom' ? 'Best for Solana and SPLITDO tokens' : 'For Ethereum and cross-chain tokens'}
                      </p>
                    </Show>
                  </div>
                  <div class="text-right">
                    <Show when={isConnecting() === wallet.id} fallback={
                      <Show when={wallet.isAvailable} fallback={
                        <svg class="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                        </svg>
                      }>
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                        </svg>
                      </Show>
                    }>
                      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
                    </Show>
                  </div>
                </div>
              </button>
            )}
          </For>
        </div>

        {/* Footer */}
        <div class={`mt-6 pt-4 border-t text-center ${
          props.isDark ? 'border-zinc-600 text-gray-400' : 'border-gray-200 text-gray-600'
        }`}>
          <p class="text-sm mb-2">
            Connect your wallet to create a SPLITDO token account
          </p>
          <p class="text-xs mb-1">
            Don't have a wallet? Click any "Not Installed" option to install
          </p>
          <p class="text-xs">
            Your wallet will be used to sign transactions on the Solana blockchain
          </p>
        </div>
      </div>
    </div>
    </Show>
  );
};

export default WalletModal;