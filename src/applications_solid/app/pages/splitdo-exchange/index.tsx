import type { Component } from 'solid-js';
import { createSignal, createEffect, Show, createMemo, For } from 'solid-js';
import {
  useSplitdoATA,
  useWalletModal,
  useWallet,
  useWalletConnection,
  useWalletBalances,
  useCreateAccountModal,
  useExchangeModal,
  useSolPrice
} from 'src/applications_solid/app/lib/wallet/wallet-context';
import WalletModal from '../../components/WalletModal';
import { CreateAccountModal } from '../../components/CreateAccountModal';
import { ExchangeModal } from '../../components/ExchangeModal';

interface TokenTransaction {
  transaction_id: string;
  type: string;
  from_user_id: string;
  to_user_id: string;
  amount_tokens: number;
  amount_usdc?: number;
  tx_signature: string;
  status: string;
  created_at: string;
  completed_at: string;
  error_message?: string;
}

const WalletPage: Component<{ isDark: boolean }> = (props) => {
  // SolidJS Wallet Context Hooks
  const { splitdoATA, createSplitdoATA, isCreatingATA } = useSplitdoATA();
  const { openModal, closeModal, isModalOpen } = useWalletModal();
  const { isCreateAccountModalOpen, closeCreateAccountModal, openCreateAccountModal } = useCreateAccountModal();
  const { isExchangeModalOpen, openExchangeModal } = useExchangeModal();
  const { wallet, connectionStatus, connectionError } = useWallet();
  const { connectWallet, disconnect } = useWalletConnection();
  const { solBalance, refreshBalances } = useWalletBalances();
  const { solPrice } = useSolPrice();

  // Transaction history state
  const [transactions, setTransactions] = createSignal<TokenTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = createSignal(false);

  // Fetch transactions
  const fetchTransactions = async () => {
    if (connectionStatus() !== 'connected') return;

    try {
      setIsLoadingTransactions(true);

      // Get Firebase token from cookies or storage
      let token = null;
      const cookieNames = ['firebase-auth-token', 'firebase-idToken', 'auth-token'];
      for (const cookieName of cookieNames) {
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${cookieName}=`))
          ?.split('=')[1];
        if (cookieValue) {
          token = cookieValue;
          break;
        }
      }

      if (!token) {
        token = sessionStorage.getItem('firebase-idToken') || localStorage.getItem('firebase-idToken');
      }

      if (!token) {
        console.log('[WalletPage] No auth token found, skipping transaction fetch');
        return;
      }

      const response = await fetch('/api/splitdo-token/transactions?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.transactions) {
          setTransactions(data.data.transactions);
        }
      }
    } catch (error) {
      console.error('[WalletPage] Failed to fetch transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Check SPLITDO account status on page load
  createEffect(() => {
    console.log('[WalletPage] Checking SPLITDO balance on page load');
    refreshBalances();
  });

  // Refresh balances when wallet is connected
  createEffect(() => {
    if (connectionStatus() === 'connected' && wallet()) {
      console.log('[WalletPage] Wallet connected, refreshing balances');
      refreshBalances();
      fetchTransactions();
    }
  });

  // Auto-open modal when no SPLITDO account exists and wallet is connected
  createEffect(() => {
    if (splitdoATA().status === 'not_found' && connectionStatus() === 'connected') {
      console.log('[WalletPage] No SPLITDO account found, opening creation modal');
      openCreateAccountModal();
    }
  });

  const formatCurrency = (amount: number, decimals: number = 2) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const formatAddress = (address: string) => {
    if (address.length <= 8) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return timestamp;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy':
      case 'purchase':
        return (
          <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
        );
      case 'sell':
        return (
          <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
          </svg>
        );
      case 'transfer':
        return (
          <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
          </svg>
        );
      default:
        return (
          <svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
          </svg>
        );
    }
  };

  // Calculate portfolio value in USD
  const portfolioValueUSD = createMemo(() => {
    const splitdoBalance = splitdoATA().balance?.uiAmount || 0;
    const splitdoPrice = 0.11; // $0.11 per SPLITDO
    const solValue = (solBalance()?.sol || 0) * (solPrice()?.usd || 0);
    return (splitdoBalance * splitdoPrice) + solValue;
  });

  return (
    <div class="min-h-screen bg-zinc-900">
      {/* Hero Section */}
      <div class="relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10"></div>
        <div class="relative px-4 pt-12 pb-20 md:px-8 md:pt-20 md:pb-32">
          <div class="max-w-4xl mx-auto text-center space-y-6">
            <div class="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
              <span class="text-sm font-medium text-cyan-400">
                {wallet()?.address ? formatAddress(wallet()!.address) : 'Exchange'}
              </span>
            </div>

            <h1 class="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
              Token Exchange
            </h1>

            <Show
              when={connectionStatus() === 'connected' && splitdoATA().status === 'exists'}
              fallback={
                <div class="space-y-6">
                  <div class="text-5xl md:text-6xl font-bold text-zinc-700">
                    ${formatCurrency(0)}
                  </div>
                  <Show
                    when={connectionStatus() === 'connected'}
                    fallback={
                      <button
                        onClick={openModal}
                        class="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all text-white font-semibold text-lg shadow-lg shadow-cyan-500/25"
                      >
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        Connect Wallet
                      </button>
                    }
                  >
                    <button
                      onClick={openCreateAccountModal}
                      class="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 transition-all text-white font-semibold text-lg shadow-lg shadow-emerald-500/25"
                    >
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                      Create SPLITDO Account
                    </button>
                  </Show>
                </div>
              }
            >
              <div class="space-y-4">
                <div class="text-5xl md:text-7xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  ${formatCurrency(portfolioValueUSD())}
                </div>
                <div class="text-xl md:text-2xl text-zinc-400 font-medium">
                  Total Value
                </div>
              </div>
            </Show>
          </div>
        </div>
      </div>

      {/* Balance Cards */}
      <div class="px-4 md:px-8 pb-12 -mt-8">
        <div class="max-w-4xl mx-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SPLITDO Balance */}
            <div class="bg-zinc-900/50 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800">
              <div class="flex items-center justify-between mb-4">
                <span class="text-sm font-medium text-zinc-500 uppercase tracking-wider">SPLITDO</span>
                <div class="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
              <Show
                when={connectionStatus() === 'connected' && splitdoATA().status === 'exists'}
                fallback={
                  <div>
                    <div class="text-3xl font-bold text-zinc-700 mb-2">--</div>
                    <p class="text-xs text-zinc-500">
                      {connectionStatus() === 'connected' ? 'Create account to trade' : 'Connect wallet to view'}
                    </p>
                  </div>
                }
              >
                <div class="text-3xl font-bold text-white mb-2">
                  {formatCurrency(splitdoATA().balance?.uiAmount || 0)}
                </div>
                <p class="text-xs text-zinc-500 font-mono">
                  {formatAddress(splitdoATA().address || '')}
                </p>
              </Show>
            </div>

            {/* SOL Balance */}
            <div class="bg-zinc-900/50 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800">
              <div class="flex items-center justify-between mb-4">
                <span class="text-sm font-medium text-zinc-500 uppercase tracking-wider">Solana</span>
                <div class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
              </div>
              <Show
                when={connectionStatus() === 'connected' && solBalance()}
                fallback={
                  <div>
                    <div class="text-3xl font-bold text-zinc-700 mb-2">--</div>
                    <p class="text-xs text-zinc-500">Connect wallet to view</p>
                  </div>
                }
              >
                <div class="text-3xl font-bold text-white mb-2">
                  {formatCurrency(solBalance()?.sol || 0, 4)}
                </div>
                <p class="text-xs text-zinc-500">For transaction fees</p>
              </Show>
            </div>
          </div>
        </div>
      </div>

      {/* Current Prices */}
      <div class="px-4 md:px-8 pb-12">
        <div class="max-w-4xl mx-auto space-y-4">
          <h2 class="text-lg font-semibold text-white mb-4">Current Prices</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SPLITDO Price */}
            <div class="bg-zinc-900/50 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800">
              <div class="flex items-center justify-between mb-4">
                <span class="text-sm font-medium text-zinc-500 uppercase tracking-wider">SPLITDO/USD</span>
                <div class="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
              <div class="text-3xl font-bold text-white mb-1">
                ${formatCurrency(0.11, 2)}
              </div>
              <p class="text-xs text-zinc-500">Fixed exchange rate</p>
            </div>

            {/* SOL Price */}
            <div class="bg-zinc-900/50 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800">
              <div class="flex items-center justify-between mb-4">
                <span class="text-sm font-medium text-zinc-500 uppercase tracking-wider">SOL/USD</span>
                <div class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
                </div>
              </div>
              <Show
                when={solPrice()?.usd}
                fallback={
                  <div>
                    <div class="text-3xl font-bold text-zinc-700 mb-1">--</div>
                    <p class="text-xs text-zinc-500">Loading price...</p>
                  </div>
                }
              >
                <div class="text-3xl font-bold text-white mb-1">
                  ${formatCurrency(solPrice()?.usd || 0, 2)}
                </div>
                <p class="text-xs text-zinc-500">Live market price</p>
              </Show>
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Action */}
      <Show when={connectionStatus() === 'connected' && splitdoATA().status === 'exists'}>
        <div class="px-4 md:px-8 pb-12">
          <div class="max-w-4xl mx-auto">
            <button
              onClick={openExchangeModal}
              class="group w-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/20 rounded-3xl p-8 transition-all"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-6">
                  <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                    </svg>
                  </div>
                  <div class="text-left">
                    <h3 class="text-2xl font-bold text-white mb-1">Exchange Tokens</h3>
                    <p class="text-sm text-zinc-400">Trade SOL for SPLITDO at $0.11 each</p>
                  </div>
                </div>
                <svg class="w-8 h-8 text-zinc-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </button>
          </div>
        </div>
      </Show>

      {/* Quick Actions */}
      <Show when={connectionStatus() === 'connected'}>
        <div class="px-4 md:px-8 pb-12">
          <div class="max-w-4xl mx-auto space-y-4">
            <h2 class="text-lg font-semibold text-white mb-4">Quick Actions</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={disconnect}
                class="group block bg-zinc-900/50 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/20 rounded-3xl p-6 transition-all text-left"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-zinc-800 group-hover:bg-red-500/20 flex items-center justify-center transition-colors">
                      <svg class="w-6 h-6 text-zinc-400 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-base font-bold text-white group-hover:text-red-400 transition-colors">Disconnect</h3>
                      <p class="text-sm text-zinc-400">End wallet session</p>
                    </div>
                  </div>
                  <svg class="w-6 h-6 text-zinc-600 group-hover:text-red-400 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </button>

              <button
                onClick={refreshBalances}
                class="group block bg-zinc-900/50 hover:bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 transition-all text-left"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
                      <svg class="w-6 h-6 text-zinc-400 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-base font-bold text-white">Refresh</h3>
                      <p class="text-sm text-zinc-400">Update balances</p>
                    </div>
                  </div>
                  <svg class="w-6 h-6 text-zinc-600 group-hover:text-zinc-400 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Transaction History */}
      <Show when={connectionStatus() === 'connected'}>
        <div class="px-4 md:px-8 pb-12">
          <div class="max-w-4xl mx-auto">
            <h2 class="text-lg font-semibold text-white mb-4">Recent Activity</h2>
            <div class="bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-zinc-800 overflow-hidden">
              <Show
                when={!isLoadingTransactions() && transactions().length > 0}
                fallback={
                  <div class="flex flex-col items-center justify-center py-12 text-center">
                    <Show
                      when={isLoadingTransactions()}
                      fallback={
                        <>
                          <svg class="w-16 h-16 text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                          </svg>
                          <h3 class="text-lg font-semibold text-zinc-400 mb-2">No transactions yet</h3>
                          <p class="text-sm text-zinc-500">Your transaction history will appear here</p>
                        </>
                      }
                    >
                      <div class="flex items-center gap-3">
                        <svg class="animate-spin w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p class="text-sm text-zinc-400">Loading transactions...</p>
                      </div>
                    </Show>
                  </div>
                }
              >
                <div class="divide-y divide-zinc-800">
                  <For each={transactions()}>
                    {(tx) => (
                      <div class="p-6 hover:bg-zinc-800/50 transition-colors">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-4 flex-1">
                            {/* Transaction Icon */}
                            <div class="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                              {getTransactionIcon(tx.type)}
                            </div>

                            {/* Transaction Details */}
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center gap-2 mb-1">
                                <h3 class="text-sm font-semibold text-white capitalize">
                                  {tx.type}
                                </h3>
                                <Show when={tx.status === 'completed'}>
                                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                                    Success
                                  </span>
                                </Show>
                                <Show when={tx.status === 'pending'}>
                                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">
                                    Pending
                                  </span>
                                </Show>
                                <Show when={tx.status === 'failed'}>
                                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                                    Failed
                                  </span>
                                </Show>
                              </div>
                              <p class="text-xs text-zinc-500 font-mono truncate">
                                {formatAddress(tx.tx_signature)}
                              </p>
                            </div>
                          </div>

                          {/* Amount and Time */}
                          <div class="text-right ml-4">
                            <p class="text-sm font-bold text-white mb-1">
                              {formatCurrency(tx.amount_tokens)} SPLITDO
                            </p>
                            <p class="text-xs text-zinc-500">
                              {formatTimestamp(tx.completed_at || tx.created_at)}
                            </p>
                          </div>
                        </div>

                        {/* View on Explorer Link */}
                        <Show when={tx.tx_signature}>
                          <a
                            href={`https://solscan.io/tx/${tx.tx_signature}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center gap-1 mt-3 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            View on Solscan
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                          </a>
                        </Show>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </Show>

      {/* Wallet Selection Modal */}
      <WalletModal
        isOpen={isModalOpen}
        onClose={closeModal}
        isDark={props.isDark}
      />

      {/* Exchange Modal */}
      <ExchangeModal isDark={props.isDark} />

      {/* Create Account Modal */}
      <CreateAccountModal isDark={props.isDark} />
    </div>
  );
};

export default WalletPage;
