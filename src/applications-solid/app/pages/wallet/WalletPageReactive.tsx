import type { Component } from 'solid-js';
import { createSignal, createEffect, Show } from 'solid-js';
import {
  useSplitdoATA,
  useWalletModal,
  useWallet,
  useWalletConnection,
  useWalletBalances
} from 'src/lib/wallet/wallet-reactive-store';
import WalletModal from '../../components/WalletModal';
import TestModal from '../../components/TestModal';

const WalletPageReactive: Component<{ isDark: boolean }> = (props) => {
  // SolidJS Reactive Store Hooks
  const { splitdoATA, checkSplitdoBalance } = useSplitdoATA();
  const { openModal, closeModal, isModalOpen } = useWalletModal();
  const { wallet, connectionStatus, connectionError } = useWallet();
  const { connectWallet, disconnectWallet } = useWalletConnection();
  const { solBalance, refreshBalances } = useWalletBalances();

  // Debug modal state - this should now trigger!
  createEffect(() => {
    console.log('[WalletPageReactive] Modal state changed:', isModalOpen());
  });

  createEffect(() => {
    console.log('[WalletPageReactive] Connection status changed:', connectionStatus());
  });

  // Check SPLITDO account status on page load
  createEffect(() => {
    console.log('[WalletPageReactive] Checking SPLITDO balance on page load');
    checkSplitdoBalance();
  });

  // Refresh balances when wallet is connected
  createEffect(() => {
    if (connectionStatus() === 'connected' && wallet()) {
      console.log('[WalletPageReactive] Wallet connected, refreshing balances');
      refreshBalances();
    }
  });

  const formatCurrency = (amount: number, currency: string = 'SPLITDO') => {
    return `${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} ${currency}`;
  };

  const formatAddress = (address: string) => {
    if (address.length <= 8) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div class="p-8 space-y-6">
      <div class="flex items-center justify-between">
        <h2 class={`text-2xl font-bold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
          Wallet (Reactive Store)
        </h2>
        <div class="flex space-x-3">
          {/* Test Modal Button */}
          <TestModal isDark={props.isDark} />

          {/* Show Connect/Disconnect Button */}
          <Show
            when={connectionStatus() === 'connected'}
            fallback={
              <button
                onClick={() => {
                  console.log('[WalletPageReactive] Connect button clicked');
                  openModal();
                }}
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Connect Wallet
              </button>
            }
          >
            <button
              onClick={() => disconnectWallet()}
              class={`px-4 py-2 rounded-lg border transition-colors ${
                props.isDark
                  ? 'border-red-600 text-red-400 hover:bg-red-600 hover:text-white'
                  : 'border-red-500 text-red-600 hover:bg-red-500 hover:text-white'
              }`}
            >
              Disconnect
            </button>
          </Show>
        </div>
      </div>

      {/* Connection Status */}
      <Show when={connectionStatus() === 'connecting'}>
        <div class={`p-4 rounded-lg border ${props.isDark ? 'bg-zinc-800 border-zinc-700 text-yellow-400' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
          🔄 Connecting to wallet...
        </div>
      </Show>

      <Show when={connectionStatus() === 'error' && connectionError()}>
        <div class={`p-4 rounded-lg border ${props.isDark ? 'bg-zinc-800 border-red-700 text-red-400' : 'bg-red-50 border-red-200 text-red-800'}`}>
          ❌ Connection Error: {connectionError()}
        </div>
      </Show>

      <Show when={connectionStatus() === 'connected' && wallet()}>
        <div class={`p-4 rounded-lg border ${props.isDark ? 'bg-zinc-800 border-green-700 text-green-400' : 'bg-green-50 border-green-200 text-green-800'}`}>
          ✅ Connected to {wallet()?.name} ({formatAddress(wallet()?.address || '')})
        </div>
      </Show>

      {/* Balance Overview */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SPLITDO Balance */}
        <div class={`p-6 rounded-lg border shadow-lg ${props.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <div class="flex items-center justify-between mb-4">
            <h3 class={`text-lg font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
              SPLITDO Token
            </h3>
            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span class="text-white text-lg font-bold">S</span>
            </div>
          </div>

          {/* SPLITDO ATA Status - Reactive SolidJS */}
          <Show when={splitdoATA().status === 'exists'}>
            <p class={`text-2xl font-bold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(splitdoATA().balance?.uiAmount || 0)}
            </p>
            <p class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Account: {formatAddress(splitdoATA().address || '')}
            </p>
          </Show>

          <Show when={splitdoATA().status === 'not_found'}>
            <div class="space-y-3">
              <p class={`text-lg ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                🚫 No SPLITDO Account
              </p>
              <button
                onClick={() => {
                  console.log('[WalletPageReactive] Create account button clicked');
                  openModal();
                }}
                class="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
              >
                🚀 Create SPLITDO Token Account
              </button>
              <p class={`text-xs ${props.isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Connect your wallet to create and manage your SPLITDO tokens
              </p>
            </div>
          </Show>

          <Show when={splitdoATA().status === 'creating'}>
            <div class="space-y-2">
              <p class={`text-lg text-blue-500`}>
                🔄 Creating Account...
              </p>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full animate-pulse" style="width: 60%"></div>
              </div>
              <p class={`text-xs ${props.isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Please confirm the transaction in your wallet
              </p>
            </div>
          </Show>

          <Show when={splitdoATA().status === 'checking'}>
            <p class={`text-lg ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              🔍 Checking account status...
            </p>
          </Show>

          <Show when={splitdoATA().status === 'error' && splitdoATA().error}>
            <div class="space-y-2">
              <p class={`text-lg text-red-500`}>
                ❌ Error
              </p>
              <p class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {splitdoATA().error}
              </p>
              <button
                onClick={() => checkSplitdoBalance()}
                class="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                🔄 Retry
              </button>
            </div>
          </Show>
        </div>

        {/* SOL Balance */}
        <div class={`p-6 rounded-lg border shadow-lg ${props.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <div class="flex items-center justify-between mb-4">
            <h3 class={`text-lg font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
              Solana (SOL)
            </h3>
            <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span class="text-white text-lg font-bold">◎</span>
            </div>
          </div>

          <Show
            when={connectionStatus() === 'connected' && wallet()}
            fallback={
              <div class="text-center">
                <p class={`text-lg ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  🔗 Connect wallet to see balance
                </p>
              </div>
            }
          >
            <p class={`text-2xl font-bold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(solBalance()?.sol || 0, 'SOL')}
            </p>
            <p class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              For transaction fees
            </p>
            <Show when={wallet()?.address}>
              <p class={`text-xs mt-2 ${props.isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {formatAddress(wallet()?.address || '')}
              </p>
            </Show>
          </Show>
        </div>

        {/* Statistics Card */}
        <div class={`p-6 rounded-lg border shadow-lg ${props.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <div class="flex items-center justify-between mb-4">
            <h3 class={`text-lg font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
              Account Stats
            </h3>
            <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <span class="text-white text-lg font-bold">📊</span>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex justify-between">
              <span class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status:</span>
              <span class={`text-sm font-medium ${connectionStatus() === 'connected' ? 'text-green-500' : props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {connectionStatus() === 'connected' ? '✅ Connected' : '🔴 Disconnected'}
              </span>
            </div>
            <div class="flex justify-between">
              <span class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>SPLITDO ATA:</span>
              <span class={`text-sm font-medium ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {splitdoATA().status === 'exists' ? '✅ Active' : '🔴 None'}
              </span>
            </div>
            <div class="flex justify-between">
              <span class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>Network:</span>
              <span class={`text-sm font-medium ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                🌐 Solana Mainnet
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div class={`p-6 rounded-lg border shadow-lg ${props.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class={`text-lg font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
              🚀 Getting Started with SPLITDO
            </h3>
            <p class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Your gateway to the SPLITDO ecosystem
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class={`p-4 rounded-lg border ${props.isDark ? 'border-zinc-600 bg-zinc-700' : 'border-gray-200 bg-gray-50'}`}>
            <h4 class={`text-sm font-medium ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              💰 Token Economics
            </h4>
            <p class={`text-xs mt-1 ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              SPLITDO tokens power the ecosystem with staking rewards and governance rights
            </p>
          </div>
          <div class={`p-4 rounded-lg border ${props.isDark ? 'border-zinc-600 bg-zinc-700' : 'border-gray-200 bg-gray-50'}`}>
            <h4 class={`text-sm font-medium ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              🔐 Security First
            </h4>
            <p class={`text-xs mt-1 ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Your wallet keys remain secure. We never store or access your private keys
            </p>
          </div>
        </div>
      </div>

      {/* Wallet Selection Modal */}
      {(() => {
        console.log('[WalletPageReactive] About to render modal, isOpen:', isModalOpen());
        return (
          <WalletModal
            isOpen={isModalOpen()}
            onClose={() => {
              console.log('[WalletPageReactive] Closing modal');
              closeModal();
            }}
            isDark={props.isDark}
          />
        );
      })()}
    </div>
  );
};

export default WalletPageReactive;