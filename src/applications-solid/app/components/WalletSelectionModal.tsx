import type { Component } from 'solid-js';

interface WalletSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

interface WalletOption {
  name: string;
  icon: string;
  description: string;
  comingSoon: boolean;
  popular?: boolean;
}

const WalletSelectionModal: Component<WalletSelectionModalProps> = (props) => {
  // Wallet Options (UI only - keine echte Integration)
  const walletOptions: WalletOption[] = [
    {
      name: "Phantom",
      icon: "🟣",
      description: "Popular Solana wallet",
      comingSoon: false,
      popular: true
    },
    {
      name: "MetaMask",
      icon: "🦊",
      description: "Ethereum & multi-chain wallet",
      comingSoon: true
    },
    {
      name: "Solflare",
      icon: "☀️",
      description: "Native Solana wallet",
      comingSoon: true
    },
    {
      name: "Backpack",
      icon: "🎒",
      description: "Multi-chain wallet",
      comingSoon: true
    },
    {
      name: "Glow",
      icon: "✨",
      description: "Solana mobile wallet",
      comingSoon: true
    },
    {
      name: "Slope",
      icon: "📈",
      description: "Solana DeFi wallet",
      comingSoon: true
    }
  ];

  const handleWalletSelect = (walletName: string) => {
    if (walletName === "Phantom") {
      // Show message for now
      alert("Phantom Wallet integration will be implemented in the next version.");
    } else {
      alert(`${walletName} is not available yet. Coming soon!`);
    }
    props.onClose();
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
            {walletOptions.map((wallet) => (
              <button
                onClick={() => handleWalletSelect(wallet.name)}
                disabled={wallet.comingSoon}
                class={`w-full p-4 rounded-lg border transition-all duration-200 text-left card-hover ${
                  wallet.comingSoon
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
                    </div>
                    <p class={`text-sm ${
                      wallet.comingSoon
                        ? props.isDark ? 'text-gray-500' : 'text-gray-400'
                        : props.isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {wallet.description}
                    </p>
                  </div>
                  {!wallet.comingSoon && (
                    <div class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

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
              class={`px-4 py-2 rounded-lg border transition-colors ${
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