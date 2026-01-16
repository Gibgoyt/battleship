import type { Component } from 'solid-js';
import { createSignal, createEffect, Show } from 'solid-js';
import {
  useSplitdoATA,
  useWalletModal,
  useWallet,
  useWalletConnection,
  useWalletBalances
} from 'src/applications_solid/app/lib/wallet/wallet-reactive-store';
import WalletModal from '../../components/WalletModal';
import CreateSplitdoAccount from './components/CreateSplitdoAccount';

const WalletPage: Component<{ isDark: boolean }> = (props) => {
  // SolidJS Wallet Reactive Store Hooks
  const { splitdoATA, checkSplitdoBalance } = useSplitdoATA();
  const { openModal, closeModal, isModalOpen } = useWalletModal();
  const { wallet, connectionStatus, connectionError } = useWallet();
  const { connectWallet, disconnectWallet } = useWalletConnection();
  const { solBalance, refreshBalances } = useWalletBalances();

  // Check SPLITDO account status on page load
  createEffect(() => {
    console.log('[WalletPage] Checking SPLITDO balance on page load');
    checkSplitdoBalance();
  });

  // Refresh balances when wallet is connected
  createEffect(() => {
    if (connectionStatus() === 'connected' && wallet()) {
      console.log('[WalletPage] Wallet connected, refreshing balances');
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
    <div class="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-zinc-800">
        <div>
          <h2 class={`text-2xl md:text-3xl font-bold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
            Your Wallet
          </h2>
          <p class={`text-sm mt-1 ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your SPLITDO tokens and balances
          </p>
        </div>
        <div class="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Show Connect/Disconnect Button */}
          <Show
            when={connectionStatus() === 'connected'}
            fallback={
              <button
                onClick={() => openModal()}
                class="w-full sm:w-auto px-6 py-3 bg-[#00d9ff] text-white hover:bg-[#00b8d4] transition-colors text-sm md:text-base font-semibold"
              >
                Connect Wallet
              </button>
            }
          >
            <button
              onClick={() => disconnectWallet()}
              class={`w-full sm:w-auto px-6 py-3 border transition-colors text-sm md:text-base font-semibold ${
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

      {/* Show CreateSplitdoAccount component when no account exists */}
      <Show when={splitdoATA().status === 'not_found'}>
        <CreateSplitdoAccount />
      </Show>

      {/* Balance Overview - Only show when account exists or is being checked */}
      <Show when={splitdoATA().status !== 'not_found'}>
        <div class="space-y-6">
          <h3 class={`text-lg font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
            Balances
          </h3>

        <div class="space-y-4">
          {/* SPLITDO Balance */}
          <div class={`p-6 border-l-4 border-[#00d9ff] ${props.isDark ? 'bg-zinc-800/30' : 'bg-gray-50'}`}>
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-[#00d9ff] rounded-full flex items-center justify-center">
                  <span class="text-white text-lg font-bold">S</span>
                </div>
                <div>
                  <h4 class={`text-sm font-medium uppercase tracking-wider ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    SPLITDO Token
                  </h4>
                </div>
              </div>
            </div>

            {/* SPLITDO ATA Status - Reactive SolidJS */}
            <Show when={splitdoATA().status === 'exists'}>
              <p class={`text-3xl md:text-4xl font-bold mb-2 ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(splitdoATA().balance?.uiAmount || 0)}
              </p>
              <p class={`text-xs ${props.isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                {formatAddress(splitdoATA().address || '')}
              </p>
            </Show>

            <Show when={splitdoATA().status === 'not_found'}>
              <div class="text-center py-4">
                <p class={`text-lg mb-2 ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  No SPLITDO Account Found
                </p>
                <p class={`text-sm ${props.isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  You need to create a SPLITDO token account to start trading
                </p>
              </div>
            </Show>

            <Show when={splitdoATA().status === 'creating'}>
              <div class="space-y-2 mt-4">
                <p class="text-lg text-[#00d9ff] font-semibold">
                  Creating Account...
                </p>
                <div class={`w-full h-2 ${props.isDark ? 'bg-zinc-700' : 'bg-gray-200'}`}>
                  <div class="bg-[#00d9ff] h-2 animate-pulse" style="width: 60%"></div>
                </div>
                <p class={`text-xs ${props.isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Please confirm transaction in your wallet
                </p>
              </div>
            </Show>

            <Show when={splitdoATA().status === 'checking'}>
              <p class={`text-lg mt-4 ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Checking account status...
              </p>
            </Show>

            <Show when={splitdoATA().status === 'error' && splitdoATA().error}>
              <div class="space-y-2 mt-4">
                <p class="text-lg text-red-500 font-semibold">Error</p>
                <p class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {splitdoATA().error}
                </p>
                <button
                  onClick={() => checkSplitdoBalance()}
                  class="px-6 py-2 bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </Show>
          </div>

          {/* SOL Balance */}
          <div class={`p-6 border-l-4 border-purple-500 ${props.isDark ? 'bg-zinc-800/30' : 'bg-purple-50'}`}>
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <span class="text-white text-lg font-bold">◎</span>
                </div>
                <div>
                  <h4 class={`text-sm font-medium uppercase tracking-wider ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Solana
                  </h4>
                </div>
              </div>
            </div>

            <Show
              when={connectionStatus() === 'connected' && wallet()}
              fallback={
                <p class={`text-lg ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Connect wallet to see balance
                </p>
              }
            >
              <p class={`text-3xl md:text-4xl font-bold mb-2 ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(solBalance()?.sol || 0, 'SOL')}
              </p>
              <p class={`text-xs ${props.isDark ? 'text-gray-500' : 'text-gray-600'}`}>
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
        </div>
      </Show>

      {/* Quick Actions - Only show when account exists */}
      <Show when={splitdoATA().status !== 'not_found'}>
      <div class="pt-6 border-t border-gray-200 dark:border-zinc-800">
        <h3 class={`text-lg font-semibold mb-4 ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
          Quick Actions
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            disabled
            class={`p-6 border-l-4 border-gray-500 text-left ${props.isDark ? 'bg-zinc-800/30' : 'bg-gray-50'} opacity-60 cursor-not-allowed`}
          >
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <h4 class={`font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>Token Swap</h4>
                <p class={`text-xs ${props.isDark ? 'text-gray-500' : 'text-gray-600'}`}>Coming Soon</p>
              </div>
            </div>
            <p class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Swap SOL for SPLITDO tokens
            </p>
          </button>

          <button
            disabled
            class={`p-6 border-l-4 border-gray-500 text-left ${props.isDark ? 'bg-zinc-800/30' : 'bg-gray-50'} opacity-60 cursor-not-allowed`}
          >
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 class={`font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>Send Tokens</h4>
                <p class={`text-xs ${props.isDark ? 'text-gray-500' : 'text-gray-600'}`}>Coming Soon</p>
              </div>
            </div>
            <p class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Transfer SPLITDO to another wallet
            </p>
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div class="pt-6 border-t border-gray-200 dark:border-zinc-800">
        <h3 class={`text-lg font-semibold mb-4 ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
          Recent Activity
        </h3>

        <div class="overflow-x-auto -mx-4 md:mx-0">
          <div class="inline-block min-w-full align-middle">
            <table class="min-w-full">
              <thead class={`border-b-2 ${props.isDark ? 'border-zinc-800' : 'border-gray-200'}`}>
                <tr>
                  <th class={`text-left py-3 px-2 md:px-4 font-semibold text-xs uppercase tracking-wider ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Type
                  </th>
                  <th class={`text-left py-3 px-2 md:px-4 font-semibold text-xs uppercase tracking-wider ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Amount
                  </th>
                  <th class={`text-left py-3 px-2 md:px-4 font-semibold text-xs uppercase tracking-wider hidden sm:table-cell ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Date
                  </th>
                  <th class={`text-left py-3 px-2 md:px-4 font-semibold text-xs uppercase tracking-wider ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Status
                  </th>
                  <th class={`text-left py-3 px-2 md:px-4 font-semibold text-xs uppercase tracking-wider hidden md:table-cell ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Hash
                  </th>
                </tr>
              </thead>
              <tbody>
                <Show
                  when={connectionStatus() === 'connected'}
                  fallback={
                    <tr>
                      <td colspan="5" class={`py-12 px-2 md:px-4 text-center ${props.isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        <div class="flex flex-col items-center gap-3">
                          <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <p class="text-sm font-medium">Connect your wallet to view transaction history</p>
                        </div>
                      </td>
                    </tr>
                  }
                >
                  <tr>
                    <td colspan="5" class={`py-12 px-2 md:px-4 text-center ${props.isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                      <div class="flex flex-col items-center gap-3">
                        <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p class="text-sm font-medium">No transactions yet</p>
                      </div>
                    </td>
                  </tr>
                </Show>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </Show>

      {/* Wallet Selection Modal for ATA Creation */}
      <WalletModal
        isOpen={isModalOpen}
        onClose={() => closeModal()}
        isDark={props.isDark}
      />
    </div>
  );
};

export default WalletPage;