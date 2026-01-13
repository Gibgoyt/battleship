import type { Component } from 'solid-js';
import { createSignal, createEffect, Show } from 'solid-js';
import {
  useSplitdoATA,
  useWalletModal,
  useWallet,
  useWalletConnection,
  useWalletBalances
} from 'src/applications_solid/app/lib/wallet/wallet-global-store';
import WalletSelectionModalWithStore from '../../components/WalletSelectionModalWithStore';
import TestModal from '../../components/TestModal';

const WalletPageWithStore: Component<{ isDark: boolean }> = (props) => {
  // SolidJS Global Store Hooks
  const { splitdoATA, checkSplitdoBalance } = useSplitdoATA();
  const { openModal, closeModal, isModalOpen } = useWalletModal();

  // Debug modal state
  createEffect(() => {
    console.log('[WalletPageWithStore] Modal state changed:', isModalOpen());
  });
  const { wallet, connectionStatus, connectionError } = useWallet();
  const { connectWallet, disconnectWallet } = useWalletConnection();
  const { solBalance, refreshBalances } = useWalletBalances();

  // Check SPLITDO account status on page load
  createEffect(() => {
    console.log('[WalletPageWithStore] Checking SPLITDO balance on page load');
    checkSplitdoBalance();
  });

  // Refresh balances when wallet is connected
  createEffect(() => {
    if (connectionStatus() === 'connected' && wallet()) {
      console.log('[WalletPageWithStore] Wallet connected, refreshing balances');
      refreshBalances();
    }
  });

  const formatCurrency = (amount: number, currency: string = 'SPLITDO') => {
    return `${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const formatAddress = (address: string) => {
    if (address.length <= 8) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div class="p-8 space-y-6">
      <div class="flex items-center justify-between">
        <h2 class={`text-2xl font-bold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
          Wallet (Global Store)
        </h2>
        <div class="flex space-x-3">
          {/* Test Modal Button */}
          <TestModal isDark={props.isDark} />
          {/* Show Connect/Disconnect Button */}
          <Show
            when={connectionStatus() === 'connected'}
            fallback={
              <button
                onClick={() => openModal()}
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
          Connecting to wallet...
        </div>
      </Show>

      <Show when={connectionStatus() === 'error' && connectionError()}>
        <div class={`p-4 rounded-lg border ${props.isDark ? 'bg-zinc-800 border-red-700 text-red-400' : 'bg-red-50 border-red-200 text-red-800'}`}>
          Connection Error: {connectionError()}
        </div>
      </Show>

      {/* Balance Overview */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SPLITDO Balance */}
        <div class={`p-6 rounded-lg border shadow-professional card-hover ${props.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <div class="flex items-center justify-between mb-2">
            <h3 class={`text-lg font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
              SPLITDO Token
            </h3>
            <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span class="text-white text-sm font-bold">S</span>
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
                No SPLITDO Account
              </p>
              <button
                onClick={() => openModal()}
                class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create SPLITDO Token Account
              </button>
              <p class={`text-xs ${props.isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Connect wallet to create your SPLITDO token account
              </p>
            </div>
          </Show>

          <Show when={splitdoATA().status === 'creating'}>
            <div class="space-y-2">
              <p class={`text-lg text-blue-500`}>
                Creating Account...
              </p>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-blue-600 h-2 rounded-full animate-pulse" style="width: 60%"></div>
              </div>
              <p class={`text-xs ${props.isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Please confirm transaction in your wallet
              </p>
            </div>
          </Show>

          <Show when={splitdoATA().status === 'checking'}>
            <p class={`text-lg ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Checking account status...
            </p>
          </Show>

          <Show when={splitdoATA().status === 'error' && splitdoATA().error}>
            <div class="space-y-2">
              <p class={`text-lg text-red-500`}>
                Error
              </p>
              <p class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {splitdoATA().error}
              </p>
              <button
                onClick={() => checkSplitdoBalance()}
                class="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </Show>
        </div>

        {/* USDC Balance */}
        <div class={`p-6 rounded-lg border shadow-professional card-hover ${props.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <div class="flex items-center justify-between mb-2">
            <h3 class={`text-lg font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
              USDC
            </h3>
            <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span class="text-white text-sm font-bold">$</span>
            </div>
          </div>
          <p class={`text-2xl font-bold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(0, 'USDC')}
          </p>
          <p class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            USD Coin
          </p>
        </div>

        {/* SOL Balance */}
        <div class={`p-6 rounded-lg border shadow-professional card-hover ${props.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <div class="flex items-center justify-between mb-2">
            <h3 class={`text-lg font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
              Solana
            </h3>
            <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <span class="text-white text-sm font-bold">◎</span>
            </div>
          </div>

          <Show
            when={connectionStatus() === 'connected' && wallet()}
            fallback={
              <div>
                <p class={`text-lg ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Connect wallet to see balance
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
      </div>

      {/* Swap/Trade Area */}
      <div class={`p-6 rounded-lg border shadow-professional ${props.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class={`text-lg font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
              Token Swap
            </h3>
            <p class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Swap SOL for SPLITDO tokens
            </p>
          </div>
          <button
            disabled
            class="px-6 py-2 bg-gray-600 text-gray-400 rounded-lg cursor-not-allowed"
          >
            Swap (Coming Soon)
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class={`p-4 rounded-lg border ${props.isDark ? 'border-zinc-600 bg-zinc-700' : 'border-gray-200 bg-gray-50'}`}>
            <p class={`text-sm font-medium ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Current Rate
            </p>
            <p class={`text-xl font-bold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
              1 SOL = 1000 SPLITDO
            </p>
          </div>
          <div class={`p-4 rounded-lg border ${props.isDark ? 'border-zinc-600 bg-zinc-700' : 'border-gray-200 bg-gray-50'}`}>
            <p class={`text-sm font-medium ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Minimum Amount
            </p>
            <p class={`text-xl font-bold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
              0.1 SOL
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div class={`p-6 rounded-lg border shadow-professional ${props.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
        <h3 class={`text-lg font-semibold mb-4 ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
          Transaction History
        </h3>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class={`border-b ${props.isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
                <th class={`text-left py-3 px-4 font-medium ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Type
                </th>
                <th class={`text-left py-3 px-4 font-medium ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Amount
                </th>
                <th class={`text-left py-3 px-4 font-medium ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date
                </th>
                <th class={`text-left py-3 px-4 font-medium ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status
                </th>
                <th class={`text-left py-3 px-4 font-medium ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Hash
                </th>
              </tr>
            </thead>
            <tbody>
              <Show
                when={connectionStatus() === 'connected'}
                fallback={
                  <tr>
                    <td colspan="5" class={`py-8 px-4 text-center ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Connect your wallet to view transaction history
                    </td>
                  </tr>
                }
              >
                <tr>
                  <td colspan="5" class={`py-8 px-4 text-center ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    No transactions yet. Create a SPLITDO token account to get started.
                  </td>
                </tr>
              </Show>
            </tbody>
          </table>
        </div>
      </div>

      {/* Wallet Selection Modal for ATA Creation */}
      <WalletSelectionModalWithStore
        isOpen={isModalOpen()}
        onClose={() => closeModal()}
        isDark={props.isDark}
      />
    </div>
  );
};

export default WalletPageWithStore;