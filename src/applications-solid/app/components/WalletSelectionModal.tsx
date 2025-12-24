import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import { useMultiWallet, useWalletConnection } from '../../../lib/wallet/wallet-context';

interface WalletSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  comingSoon: boolean;
  popular?: boolean;
}

const WalletSelectionModal: Component<WalletSelectionModalProps> = (props) => {
  const multiWallet = useMultiWallet();
  const { connectWallet } = useWalletConnection();
  const [isConnecting, setIsConnecting] = createSignal<string | null>(null);
  const [connectionError, setConnectionError] = createSignal<string | null>(null);

  // Wallet Options with real integration
  const walletOptions: WalletOption[] = [
    {
      id: "phantom",
      name: "Phantom",
      icon: "🟣",
      description: "Popular Solana wallet",
      comingSoon: false,
      popular: true
    },
    {
      id: "metamask",
      name: "MetaMask",
      icon: "🦊",
      description: "Multi-chain wallet with Solana support",
      comingSoon: false, // ENABLED!
      popular: false
    },
    {
      id: "solflare",
      name: "Solflare",
      icon: "☀️",
      description: "Native Solana wallet",
      comingSoon: true
    },
    {
      id: "backpack",
      name: "Backpack",
      icon: "🎒",
      description: "Multi-chain wallet",
      comingSoon: true
    },
    {
      id: "glow",
      name: "Glow",
      icon: "✨",
      description: "Solana mobile wallet",
      comingSoon: true
    },
    {
      id: "slope",
      name: "Slope",
      icon: "📈",
      description: "Solana DeFi wallet",
      comingSoon: true
    }
  ];

  const handleWalletSelect = async (walletOption: WalletOption) => {
    if (walletOption.comingSoon) {
      alert(`${walletOption.name} is not available yet. Coming soon!`);
      return;
    }

    // Check if wallet is available
    if (!multiWallet.isWalletAvailable(walletOption.id)) {
      const description = multiWallet.getWalletDescription(walletOption.id);
      alert(description);
      return;
    }

    setIsConnecting(walletOption.id);
    setConnectionError(null);

    try {
      await connectWallet(walletOption.id);
      props.onClose();
    } catch (error) {
      console.error(`Failed to connect to ${walletOption.name}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setConnectionError(`Failed to connect to ${walletOption.name}: ${errorMessage}`);
    } finally {
      setIsConnecting(null);
    }
  };

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose();
    }
  };

  if (!props.isOpen) return null;

  return (
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 fade-in"
      onClick={handleBackdropClick}
    >
      <div
        class={`max-w-lg w-full mx-4 rounded-xl shadow-xl transition-all duration-300 ${
          props.isDark ? 'bg-zinc-800' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div class={`px-6 py-4 border-b ${props.isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
          <div class="flex items-center justify-between">
            <h3 class={`text-xl font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
              Choose Wallet
            </h3>
            <button
              onClick={props.onClose}
              class={`p-2 rounded-lg transition-colors ${
                props.isDark
                  ? 'hover:bg-zinc-700 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <p class={`text-sm mt-1 ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Connect your wallet to swap SPLITDO tokens
          </p>
        </div>

        {/* Modal Body */}
        <div class="px-6 py-4 max-h-96 overflow-y-auto">
          <div class="space-y-3">
            {walletOptions.map((wallet) => {
              const isConnectingToThis = isConnecting() === wallet.id;
              const isAvailable = multiWallet.isWalletAvailable(wallet.id);
              const isDisabled = wallet.comingSoon || isConnecting() !== null;

              return (
                <button
                  onClick={() => handleWalletSelect(wallet)}
                  disabled={isDisabled}
                  class={`w-full p-4 rounded-lg border transition-all duration-200 text-left card-hover ${
                    isDisabled
                      ? `opacity-60 cursor-not-allowed ${
                          props.isDark
                            ? 'border-zinc-700 bg-zinc-700/50'
                            : 'border-gray-200 bg-gray-50'
                        }`
                      : `${
                          props.isDark
                            ? 'border-zinc-600 bg-zinc-700 hover:bg-zinc-600 hover:border-zinc-500'
                            : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                        } hover:shadow-lg transform hover:-translate-y-1`
                  }`}
                >
                  <div class="flex items-center space-x-4">
                    <div class="text-3xl">{wallet.icon}</div>
                    <div class="flex-1">
                      <div class="flex items-center space-x-2">
                        <span class={`font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
                          {wallet.name}
                        </span>
                        {wallet.popular && (
                          <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            Popular
                          </span>
                        )}
                        {wallet.comingSoon && (
                          <span class={`px-2 py-1 text-xs font-medium rounded-full ${
                            props.isDark
                              ? 'bg-zinc-600 text-zinc-300'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            Coming soon
                          </span>
                        )}
                        {!wallet.comingSoon && !isAvailable && (
                          <span class={`px-2 py-1 text-xs font-medium rounded-full ${
                            props.isDark
                              ? 'bg-orange-600 text-orange-300'
                              : 'bg-orange-200 text-orange-600'
                          }`}>
                            Not installed
                          </span>
                        )}
                        {isConnectingToThis && (
                          <span class={`px-2 py-1 text-xs font-medium rounded-full ${
                            props.isDark
                              ? 'bg-blue-600 text-blue-300'
                              : 'bg-blue-200 text-blue-600'
                          }`}>
                            Connecting...
                          </span>
                        )}
                      </div>
                      <p class={`text-sm ${
                        wallet.comingSoon
                          ? props.isDark ? 'text-gray-500' : 'text-gray-400'
                          : props.isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {wallet.description}
                      </p>
                    </div>
                    {!wallet.comingSoon && !isConnectingToThis && (
                      <div class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </div>
                    )}
                    {isConnectingToThis && (
                      <div class={`text-sm ${props.isDark ? 'text-blue-400' : 'text-blue-500'}`}>
                        <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Connection Error Display */}
        {connectionError() && (
          <div class={`px-6 py-3 border-t ${props.isDark ? 'border-red-800 bg-red-900/30' : 'border-red-200 bg-red-50'}`}>
            <div class="flex items-start space-x-2">
              <div class="text-red-500">
                <svg class="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="flex-1">
                <p class={`text-sm font-medium ${props.isDark ? 'text-red-300' : 'text-red-800'}`}>
                  Connection Failed
                </p>
                <p class={`text-xs mt-1 ${props.isDark ? 'text-red-400' : 'text-red-600'}`}>
                  {connectionError()}
                </p>
              </div>
              <button
                onClick={() => setConnectionError(null)}
                class={`text-sm ${props.isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-500'}`}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div class={`px-6 py-4 border-t ${props.isDark ? 'border-zinc-700 bg-zinc-800/50' : 'border-gray-200 bg-gray-50'}`}>
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <div class={`w-3 h-3 rounded-full bg-green-400`}></div>
              <span class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Secure connection
              </span>
            </div>
            <button
              onClick={props.onClose}
              disabled={isConnecting() !== null}
              class={`px-4 py-2 rounded-lg border transition-colors ${
                isConnecting() !== null
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              } ${
                props.isDark
                  ? 'border-zinc-600 text-gray-300 hover:bg-zinc-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
          </div>
          <p class={`text-xs mt-2 ${props.isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            By connecting a wallet, you agree to our Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletSelectionModal;