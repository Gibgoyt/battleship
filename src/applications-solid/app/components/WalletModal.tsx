import type { Component } from 'solid-js';
import { createSignal, Show, For } from 'solid-js';
import { useMultiWallet, useWalletConnection } from 'src/lib/wallet/wallet-reactive-store';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

const WalletModal: Component<WalletModalProps> = (props) => {
  const multiWallet = useMultiWallet();
  const { connectWallet } = useWalletConnection();
  const [isConnecting, setIsConnecting] = createSignal<string | null>(null);
  const [connectionError, setConnectionError] = createSignal<string | null>(null);

  console.log('[WalletModal] Rendering with isOpen:', props.isOpen);

  const handleConnect = async (walletId: string) => {
    if (isConnecting()) return; // Prevent double-clicks

    try {
      console.log('[WalletModal] Connecting to wallet:', walletId);
      setIsConnecting(walletId);
      setConnectionError(null);

      await connectWallet(walletId);

      // Close modal on successful connection
      props.onClose?.();
      console.log('[WalletModal] Wallet connected successfully, closing modal');

    } catch (error) {
      console.error('[WalletModal] Wallet connection failed:', error);
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setIsConnecting(null);
    }
  };

  if (!props.isOpen) {
    console.log('[WalletModal] Not rendering - modal closed');
    return null;
  }

  console.log('[WalletModal] Rendering modal content');

  return (
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

        {/* Wallet List */}
        <div class="space-y-3">
          {/* Phantom Wallet */}
          <button
            onClick={() => handleConnect('phantom')}
            disabled={!!isConnecting()}
            class={`w-full p-4 rounded-lg border transition-all duration-200 text-left ${
              props.isDark
                ? 'border-zinc-600 bg-zinc-700 hover:bg-zinc-600'
                : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
            } ${isConnecting() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
              isConnecting() === 'phantom' ? 'animate-pulse' : ''
            }`}
          >
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-2xl">
                🟣
              </div>
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <h3 class="font-semibold text-lg">Phantom</h3>
                  <span class={`px-2 py-1 rounded-full text-xs font-medium ${
                    props.isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                  }`}>
                    Popular
                  </span>
                </div>
                <p class={`text-sm mt-1 ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {isConnecting() === 'phantom'
                    ? 'Connecting to Phantom...'
                    : 'Popular Solana wallet with DeFi support'
                  }
                </p>
                <p class={`text-xs mt-1 ${props.isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Best for Solana and SPLITDO tokens
                </p>
              </div>
              <div class="text-right">
                <Show when={isConnecting() === 'phantom'} fallback={
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                }>
                  <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
                </Show>
              </div>
            </div>
          </button>

          {/* MetaMask Wallet */}
          <button
            onClick={() => handleConnect('metamask')}
            disabled={!!isConnecting()}
            class={`w-full p-4 rounded-lg border transition-all duration-200 text-left ${
              props.isDark
                ? 'border-zinc-600 bg-zinc-700 hover:bg-zinc-600'
                : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
            } ${isConnecting() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
              isConnecting() === 'metamask' ? 'animate-pulse' : ''
            }`}
          >
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center text-white text-2xl">
                🦊
              </div>
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <h3 class="font-semibold text-lg">MetaMask</h3>
                  <span class={`px-2 py-1 rounded-full text-xs font-medium ${
                    props.isDark ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800'
                  }`}>
                    Widely Used
                  </span>
                </div>
                <p class={`text-sm mt-1 ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {isConnecting() === 'metamask'
                    ? 'Connecting to MetaMask...'
                    : 'Most popular Ethereum wallet'
                  }
                </p>
                <p class={`text-xs mt-1 ${props.isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  For Ethereum and cross-chain tokens
                </p>
              </div>
              <div class="text-right">
                <Show when={isConnecting() === 'metamask'} fallback={
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                }>
                  <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
                </Show>
              </div>
            </div>
          </button>

          {/* Solflare Wallet - Coming Soon */}
          <button
            disabled
            class={`w-full p-4 rounded-lg border transition-all duration-200 text-left opacity-50 cursor-not-allowed ${
              props.isDark
                ? 'border-zinc-600 bg-zinc-700'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center text-white text-2xl">
                ☀️
              </div>
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <h3 class="font-semibold text-lg">Solflare</h3>
                  <span class={`px-2 py-1 rounded-full text-xs font-medium ${
                    props.isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                  }`}>
                    Coming Soon
                  </span>
                </div>
                <p class={`text-sm mt-1 ${props.isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Native Solana wallet with staking
                </p>
                <p class={`text-xs mt-1 ${props.isDark ? 'text-gray-600' : 'text-gray-500'}`}>
                  Support coming in next update
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div class={`mt-6 pt-4 border-t text-center ${
          props.isDark ? 'border-zinc-600 text-gray-400' : 'border-gray-200 text-gray-600'
        }`}>
          <p class="text-sm mb-2">
            🚀 Connect your wallet to create a SPLITDO token account
          </p>
          <p class="text-xs">
            Your wallet will be used to sign transactions on the Solana blockchain
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;