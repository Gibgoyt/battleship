import type { Component } from 'solid-js';
import { createSignal, createEffect, Show, createMemo, For, onMount, onCleanup } from 'solid-js';
import { useUnifiedWallet } from 'src/applications_solid/app/lib/wallet/unified-wallet-context';
import WalletModal from '../../components/WalletModal';
import { CreateAccountModal } from '../../components/CreateAccountModal';
import { ExchangeModal } from '../../components/ExchangeModal';
import { fetchSolPricePyth } from '../../services/pyth-price';

// SOL price refresh interval (30 seconds for Pyth - much more reliable than CoinGecko)
const SOL_PRICE_REFRESH_INTERVAL = 30 * 1000;

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
  // SolidJS Wallet Context - using unified wallet
  const wallet = useUnifiedWallet();

  // Transaction history state
  const [transactions, setTransactions] = createSignal<TokenTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = createSignal(false);
  
  // Local SOL price state (fetched directly, bypassing cache issues)
  const [liveSolPrice, setLiveSolPrice] = createSignal<number | null>(null);
  const [isPriceLoading, setIsPriceLoading] = createSignal(true);

  // Function to fetch SOL price from Pyth
  const fetchSolPriceDirectly = async () => {
    try {
      setIsPriceLoading(true);
      const result = await fetchSolPricePyth();

      if (result) {
        setLiveSolPrice(result.price);
        console.log('[Exchange] SOL price fetched via Pyth:', result.price);
      } else {
        console.warn('[Exchange] Pyth returned no price');
      }
    } catch (error) {
      console.error('[Exchange] Error fetching SOL price:', error);
    } finally {
      setIsPriceLoading(false);
    }
  };

  // Fetch SOL price on mount and set up 5-minute refresh interval
  onMount(() => {
    console.log('[Exchange] Fetching initial SOL price');
    fetchSolPriceDirectly();

    // Set up interval to refresh SOL price every 5 minutes
    const priceInterval = setInterval(() => {
      console.log('[Exchange] Refreshing SOL price (5 min interval)');
      fetchSolPriceDirectly();
    }, SOL_PRICE_REFRESH_INTERVAL);

    // Cleanup interval on unmount
    onCleanup(() => {
      clearInterval(priceInterval);
    });
  });

  // Fetch transactions
  const fetchTransactions = async () => {
    if (wallet.connectionStatus() !== 'connected') return;

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
    wallet.refreshBalances();
  });

  // Refresh balances when wallet is connected
  createEffect(() => {
    if (wallet.connectionStatus() === 'connected' && wallet.wallet()) {
      console.log('[WalletPage] Wallet connected, refreshing balances');
      wallet.refreshBalances();
      fetchTransactions();
    }
  });

  // Auto-open modal when no SPLITDO account exists and wallet is connected
  createEffect(() => {
    if (wallet.splitdoATA().status === 'not_found' && wallet.connectionStatus() === 'connected') {
      console.log('[WalletPage] No SPLITDO account found, opening creation modal');
      wallet.openCreateAccountModal();
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

  // Get SPLITDO balance - just use it as is, no conversion
  const splitdoBalanceTokens = createMemo(() => {
    const balance = wallet.splitdoATA().balance;
    if (!balance) return 0;

    // Use uiAmount directly - the API already gives us the formatted balance
    return balance.uiAmount || 0;
  });

  // Calculate portfolio value in USD
  // Formula: (SOL balance × SOL price) + (SPLITDO balance × SPLITDO price)
  const portfolioValueUSD = createMemo(() => {
    const splitdoBalance = splitdoBalanceTokens();
    const splitdoPriceUSD = 0.11; // $0.11 per SPLITDO (can be from API later)

    const solBalance = wallet.solBalance()?.sol || 0;
    const solPriceUSD = liveSolPrice() || 0;

    // Direct USD calculation
    const splitdoValueUSD = splitdoBalance * splitdoPriceUSD;
    const solValueUSD = solBalance * solPriceUSD;

    console.log('[Exchange Portfolio Calculation]', {
      splitdoBalance,
      splitdoPriceUSD,
      splitdoValueUSD,
      solBalance,
      solPriceUSD,
      solValueUSD,
      total: splitdoValueUSD + solValueUSD
    });

    return splitdoValueUSD + solValueUSD;
  });

  return (
    <div class="min-h-screen bg-zinc-900">
      {/* Header */}
      <div class="border-b border-zinc-800">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div>
              <h1 class="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-0.5 sm:mb-1">Exchange</h1>
              <p class="text-xs sm:text-sm text-zinc-500">
                {wallet.wallet()?.address ? formatAddress(wallet.wallet()!.address) : 'Trade SOL for SPLITDO'}
              </p>
            </div>
            <div class="text-left sm:text-right">
              <div class="text-xs text-zinc-500 uppercase tracking-wider mb-0.5 sm:mb-1">Total Value</div>
              <Show
                when={wallet.connectionStatus() === 'connected'}
                fallback={<div class="text-xl sm:text-2xl font-bold text-zinc-700">--</div>}
              >
                <div class="text-xl sm:text-2xl md:text-3xl font-bold text-cyan-400">
                  ${formatCurrency(portfolioValueUSD())}
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        {/* Primary Action - Exchange Tokens (shown when ready) */}
        <Show when={wallet.connectionStatus() === 'connected' && wallet.splitdoATA().status === 'exists'}>
          <div class="mb-6 sm:mb-8">
            <button
              onClick={wallet.openExchangeModal}
              class="group w-full flex items-center justify-between p-4 sm:p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/20 hover:border-cyan-500/40 transition-all rounded-lg sm:rounded-none"
            >
              <div class="flex items-center gap-3 sm:gap-4">
                <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                  </svg>
                </div>
                <div class="text-left min-w-0">
                  <div class="text-base sm:text-lg font-semibold text-white mb-0.5 sm:mb-1">Exchange Tokens</div>
                  <div class="text-xs sm:text-sm text-zinc-400 truncate">Trade SOL for SPLITDO at $0.11</div>
                </div>
              </div>
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </Show>

        {/* Connect Wallet or Create Account */}
        <Show when={wallet.connectionStatus() !== 'connected' || wallet.splitdoATA().status !== 'exists'}>
          <div class="mb-6 sm:mb-8 p-4 sm:p-6 bg-zinc-800/50 border border-zinc-700 rounded-lg sm:rounded-none">
            <Show
              when={wallet.connectionStatus() === 'connected'}
              fallback={
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div>
                    <div class="text-sm sm:text-base font-semibold text-white mb-0.5 sm:mb-1">Connect your wallet</div>
                    <div class="text-xs sm:text-sm text-zinc-400">Connect to start trading tokens</div>
                  </div>
                  <button
                    onClick={wallet.openWalletModal}
                    class="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold transition-all rounded-lg sm:rounded-none text-sm sm:text-base"
                  >
                    Connect Wallet
                  </button>
                </div>
              }
            >
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div>
                  <div class="text-sm sm:text-base font-semibold text-white mb-0.5 sm:mb-1">Create SPLITDO Account</div>
                  <div class="text-xs sm:text-sm text-zinc-400">You need a token account to hold SPLITDO</div>
                </div>
                <button
                  onClick={wallet.openCreateAccountModal}
                  class="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold transition-all rounded-lg sm:rounded-none text-sm sm:text-base"
                >
                  Create Account
                </button>
              </div>
            </Show>
          </div>
        </Show>

        {/* Assets Section */}
        <div class="mb-6 sm:mb-8">
          <h2 class="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Your Assets</h2>
          <div class="space-y-2 sm:space-y-3">
            {/* SPLITDO Balance */}
            <div class="flex items-center justify-between py-3 sm:py-4 px-4 sm:px-6 border-l-2 border-cyan-500 bg-zinc-800/50 hover:bg-zinc-800 transition-colors rounded-r-lg sm:rounded-r-none">
              <div class="flex items-center gap-3 sm:gap-4">
                <div class="w-9 h-9 sm:w-10 sm:h-10 bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden p-1 flex-shrink-0">
                  <img src="/splitdo/logo.svg" alt="SPLITDO" class="w-full h-full object-contain" />
                </div>
                <div class="min-w-0">
                  <div class="text-sm font-medium text-white">SPLITDO</div>
                  <div class="text-xs text-zinc-500 hidden sm:block">Custom Token</div>
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <Show
                  when={wallet.connectionStatus() === 'connected' && wallet.splitdoATA().status === 'exists'}
                  fallback={<div class="text-lg sm:text-xl font-bold text-zinc-700">--</div>}
                >
                  <div class="text-lg sm:text-xl font-bold text-white">
                    {formatCurrency(splitdoBalanceTokens(), 2)}
                  </div>
                  <div class="text-xs text-zinc-500">
                    ${formatCurrency(splitdoBalanceTokens() * 0.11, 2)}
                  </div>
                </Show>
              </div>
            </div>

            {/* SOL Balance */}
            <div class="flex items-center justify-between py-3 sm:py-4 px-4 sm:px-6 border-l-2 border-purple-500 bg-zinc-800/50 hover:bg-zinc-800 transition-colors rounded-r-lg sm:rounded-r-none">
              <div class="flex items-center gap-3 sm:gap-4">
                <div class="w-9 h-9 sm:w-10 sm:h-10 bg-zinc-900 rounded-full flex items-center justify-center overflow-hidden p-2 flex-shrink-0">
                  <img src="/solana-logo.svg" alt="Solana" class="w-full h-full object-contain" />
                </div>
                <div class="min-w-0">
                  <div class="text-sm font-medium text-white">Solana</div>
                  <div class="text-xs text-zinc-500 hidden sm:block">Native Token</div>
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <Show
                  when={wallet.connectionStatus() === 'connected' && wallet.solBalance()}
                  fallback={<div class="text-lg sm:text-xl font-bold text-zinc-700">--</div>}
                >
                  <div class="text-lg sm:text-xl font-bold text-white">
                    {formatCurrency(wallet.solBalance()?.sol || 0, 4)} SOL
                  </div>
                  <div class="text-xs text-zinc-500">
                    ${formatCurrency((wallet.solBalance()?.sol || 0) * (liveSolPrice() || 0), 2)}
                  </div>
                </Show>
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Rate Section */}
        <div class="mb-6 sm:mb-8">
          <div class="flex items-center justify-between mb-4 sm:mb-6">
            <h2 class="text-base sm:text-lg font-semibold text-white">Exchange Rates</h2>
            <Show when={liveSolPrice()}>
              <div class="flex items-center gap-1.5">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span class="text-xs text-emerald-400 font-medium">Live</span>
              </div>
            </Show>
          </div>
          <div class="space-y-2 sm:space-y-3">
            {/* SOL Price - Live */}
            <div class="flex items-center justify-between py-3 sm:py-4 px-4 sm:px-6 bg-zinc-800/50 hover:bg-zinc-800 transition-colors rounded-lg sm:rounded-none border-l-2 border-purple-500">
              <div class="flex items-center gap-3 sm:gap-4">
                <div class="w-9 h-9 sm:w-10 sm:h-10 bg-zinc-900 rounded-full flex items-center justify-center overflow-hidden p-2 flex-shrink-0">
                  <img src="/solana-logo.svg" alt="Solana" class="w-full h-full object-contain" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-white">SOL / USD</span>
                    <span class="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">LIVE</span>
                  </div>
                  <div class="text-xs text-zinc-500">Live market price</div>
                </div>
              </div>
              <Show
                when={!isPriceLoading() && liveSolPrice()}
                fallback={
                  <div class="flex items-center gap-2">
                    <svg class="animate-spin w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span class="text-lg sm:text-xl font-bold text-zinc-700">--</span>
                  </div>
                }
              >
                <div class="text-right flex-shrink-0">
                  <div class="text-lg sm:text-xl font-bold text-white">${formatCurrency(liveSolPrice() || 0, 2)}</div>
                  <div class="text-[10px] text-zinc-500">Updated live</div>
                </div>
              </Show>
            </div>

            {/* SPLITDO Price - Fixed */}
            <div class="flex items-center justify-between py-3 sm:py-4 px-4 sm:px-6 bg-zinc-800/50 hover:bg-zinc-800 transition-colors rounded-lg sm:rounded-none border-l-2 border-cyan-500">
              <div class="flex items-center gap-3 sm:gap-4">
                <div class="w-9 h-9 sm:w-10 sm:h-10 bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden p-1 flex-shrink-0">
                  <img src="/splitdo/logo.svg" alt="SPLITDO" class="w-full h-full object-contain" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-white">SPLITDO / USD</span>
                    <span class="text-[10px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">PRESALE</span>
                  </div>
                  <div class="text-xs text-zinc-500">Fixed presale rate</div>
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <div class="text-lg sm:text-xl font-bold text-cyan-400">$0.11</div>
                <div class="text-[10px] text-zinc-500">Fixed price</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <Show when={wallet.connectionStatus() === 'connected'}>
          <div class="mb-6 sm:mb-8">
            <h2 class="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Quick Actions</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={wallet.disconnectWallet}
                class="group flex items-center justify-between p-6 bg-zinc-800/50 hover:bg-red-500/10 border border-zinc-700 hover:border-red-500/20 transition-all text-left"
              >
                <div>
                  <div class="text-base font-semibold text-white group-hover:text-red-400 mb-1">Disconnect</div>
                  <div class="text-sm text-zinc-400">End wallet session</div>
                </div>
                <svg class="w-5 h-5 text-zinc-500 group-hover:text-red-400 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>

              <button
                onClick={wallet.refreshBalances}
                class="group flex items-center justify-between p-6 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 transition-all text-left"
              >
                <div>
                  <div class="text-base font-semibold text-white mb-1">Refresh</div>
                  <div class="text-sm text-zinc-400">Update balances</div>
                </div>
                <svg class="w-5 h-5 text-zinc-500 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </Show>

        {/* Transaction History */}
        <div class="border-t border-zinc-800 pt-8">
          <h2 class="text-lg font-semibold text-white mb-6">Recent Activity</h2>
          <div class="bg-zinc-800/50 border border-zinc-700 overflow-hidden">
            <Show
              when={wallet.connectionStatus() === 'connected'}
              fallback={
                <div class="flex flex-col items-center justify-center py-12 text-center">
                  <svg class="w-16 h-16 text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  <h3 class="text-lg font-semibold text-zinc-400 mb-2">Connect wallet to view</h3>
                  <p class="text-sm text-zinc-500">Your transaction history will appear here</p>
                </div>
              }
            >
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
                <div class="divide-y divide-zinc-700">
                  <For each={transactions()}>
                    {(tx) => (
                      <div class="p-4 hover:bg-zinc-800 transition-colors">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-4 flex-1">
                            <div class="w-8 h-8 bg-zinc-900 flex items-center justify-center flex-shrink-0">
                              {getTransactionIcon(tx.type)}
                            </div>
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center gap-2 mb-1">
                                <span class="text-sm font-medium text-white capitalize">{tx.type}</span>
                                <Show when={tx.status === 'completed'}>
                                  <span class="text-xs text-emerald-400">Success</span>
                                </Show>
                                <Show when={tx.status === 'pending'}>
                                  <span class="text-xs text-amber-400">Pending</span>
                                </Show>
                                <Show when={tx.status === 'failed'}>
                                  <span class="text-xs text-red-400">Failed</span>
                                </Show>
                              </div>
                              <p class="text-xs text-zinc-500 font-mono">{formatAddress(tx.tx_signature)}</p>
                            </div>
                          </div>
                          <div class="text-right ml-4">
                            <p class="text-sm font-bold text-white">{formatCurrency(tx.amount_tokens)} SPLITDO</p>
                            <p class="text-xs text-zinc-500">{formatTimestamp(tx.completed_at || tx.created_at)}</p>
                          </div>
                        </div>
                        <Show when={tx.tx_signature}>
                          <a
                            href={`https://solscan.io/tx/${tx.tx_signature}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center gap-1 mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
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
            </Show>
          </div>
        </div>
      </div>

      {/* Wallet Selection Modal */}
      <WalletModal
        isOpen={wallet.isWalletModalOpen}
        onClose={wallet.closeWalletModal}
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
