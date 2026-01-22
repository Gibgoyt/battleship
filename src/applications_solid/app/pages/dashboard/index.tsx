import type { Component } from 'solid-js';
import { createSignal, onMount, createEffect, Show, createMemo } from 'solid-js';
import { useUnifiedWallet } from 'src/applications_solid/app/lib/wallet/unified-wallet-context';
import { useCurrency, getCurrencySymbol, formatCurrency as formatCurrencyWithSymbol } from '../../stores/currency-store';
import { fetchCryptoPrices } from '../../services/coingecko';

const DashboardPage: Component<{ isDark: boolean }> = (props) => {
  const [userEmail, setUserEmail] = createSignal<string>('');

  // Currency store
  const currencyStore = useCurrency();

  // Live crypto prices in selected currency
  const [cryptoPrices, setCryptoPrices] = createSignal<Record<string, number>>({});

  // Wallet context - using unified wallet
  const wallet = useUnifiedWallet();

  // Check balances when wallet is connected
  createEffect(() => {
    if (wallet.connectionStatus() === 'connected' && wallet.wallet()) {
      console.log('[Dashboard] Wallet connected, refreshing balances');
      wallet.refreshBalances();
    }
  });

  // Fetch crypto prices when currency changes
  createEffect(async () => {
    const currency = currencyStore.currency();
    console.log('[Dashboard] Fetching prices for currency:', currency);

    try {
      const prices = await fetchCryptoPrices(['SOL', 'SPLITDO'], currency);
      setCryptoPrices(prices);
      console.log('[Dashboard] Fetched prices:', prices);
    } catch (error) {
      console.error('[Dashboard] Failed to fetch prices:', error);
    }
  });

  // Get SPLITDO balance - just use it as is, no conversion
  const splitdoBalanceTokens = createMemo(() => {
    const balance = wallet.splitdoATA().balance;
    if (!balance) return 0;

    // Use uiAmount directly - the API already gives us the formatted balance
    return balance.uiAmount || 0;
  });

  // Calculate portfolio value in selected currency
  // Formula: (SOL balance × SOL price) + (SPLITDO balance × SPLITDO price)
  const portfolioValue = createMemo(() => {
    const prices = cryptoPrices();
    const splitdoBalance = splitdoBalanceTokens();
    const solBalance = wallet.solBalance()?.sol || 0;

    // Get prices from CoinGecko, fallback to defaults if not available
    const solPrice = prices['SOL'] || 0;
    const splitdoPrice = prices['SPLITDO'] || 0.11; // Fallback to presale price

    const splitdoValue = splitdoBalance * splitdoPrice;
    const solValue = solBalance * solPrice;

    return splitdoValue + solValue;
  });

  onMount(() => {
    // Extract email from JWT
    try {
      const cookieNames = ['firebase-auth-token', 'firebase-idToken', 'auth-token'];
      let token = null;

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

      if (token) {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          setUserEmail(payload.email || '');
        }
      }
    } catch (error) {
      console.error('Error extracting email:', error);
    }
  });

  const formatCurrency = (amount: number, decimals: number = 2) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  return (
    <div class="min-h-screen bg-zinc-900">
      {/* Header */}
      <div class="border-b border-zinc-800">
        <div class="max-w-6xl mx-auto px-4 md:px-8 py-8">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl md:text-3xl font-bold text-white mb-1">Dashboard</h1>
              <p class="text-sm text-zinc-500">{userEmail() || 'Welcome back'}</p>
            </div>
            <div class="text-right">
              <div class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Portfolio</div>
              <Show
                when={wallet.connectionStatus() === 'connected'}
                fallback={<div class="text-2xl font-bold text-zinc-700">--</div>}
              >
                <div class="text-2xl md:text-3xl font-bold text-cyan-400">
                  {formatCurrencyWithSymbol(portfolioValue(), currencyStore.currency())}
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div class="max-w-6xl mx-auto px-4 md:px-8 py-12">
        {/* Primary Action - Exchange Tokens */}
        <div class="mb-8">
          <a
            href="/app/splitdo-exchange"
            class="group flex items-center justify-between p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/20 hover:border-cyan-500/40 transition-all"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                </svg>
              </div>
              <div>
                <div class="text-lg font-semibold text-white mb-1">Exchange Tokens</div>
                <div class="text-sm text-zinc-400">Trade SOL for SPLITDO at $0.11 each</div>
              </div>
            </div>
            <svg class="w-6 h-6 text-cyan-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </a>
        </div>

        {/* Assets Section */}
        <div class="mb-8">
          <h2 class="text-lg font-semibold text-white mb-6">Assets</h2>
          <div class="space-y-3">
            {/* SPLITDO Balance */}
            <div class="flex items-center justify-between py-4 px-6 border-l-2 border-cyan-500 bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center overflow-hidden">
                  <img src="/splitdo/logo.png" alt="SPLITDO" class="w-7 h-7 object-contain" />
                </div>
                <div>
                  <div class="text-sm font-medium text-white">SPLITDO</div>
                  <div class="text-xs text-zinc-500">Custom Token</div>
                </div>
              </div>
              <div class="text-right">
                <Show
                  when={wallet.connectionStatus() === 'connected' && wallet.splitdoATA().status === 'exists'}
                  fallback={<div class="text-xl font-bold text-zinc-700">--</div>}
                >
                  <div class="text-xl font-bold text-white">
                    {formatCurrency(splitdoBalanceTokens(), 2)}
                  </div>
                  <div class="text-xs text-zinc-500">
                    {formatCurrencyWithSymbol(splitdoBalanceTokens() * (cryptoPrices()['SPLITDO'] || 0.11), currencyStore.currency())}
                  </div>
                </Show>
              </div>
            </div>

            {/* SOL Balance */}
            <div class="flex items-center justify-between py-4 px-6 border-l-2 border-purple-500 bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center overflow-hidden p-2">
                  <img src="/solana-logo.svg" alt="Solana" class="w-full h-full object-contain" />
                </div>
                <div>
                  <div class="text-sm font-medium text-white">Solana</div>
                  <div class="text-xs text-zinc-500">Native Token</div>
                </div>
              </div>
              <div class="text-right">
                <Show
                  when={wallet.connectionStatus() === 'connected' && wallet.solBalance()}
                  fallback={<div class="text-xl font-bold text-zinc-700">--</div>}
                >
                  <div class="text-xl font-bold text-white">
                    {formatCurrency(wallet.solBalance()?.sol || 0, 4)} SOL
                  </div>
                  <div class="text-xs text-zinc-500">
                    {formatCurrencyWithSymbol((wallet.solBalance()?.sol || 0) * (cryptoPrices()['SOL'] || 0), currencyStore.currency())}
                  </div>
                </Show>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div class="mb-8">
          <h2 class="text-lg font-semibold text-white mb-6">Quick Actions</h2>
          <a
            href="/app/profile"
            class="group flex items-center justify-between p-6 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 transition-all"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <div>
                <div class="text-base font-semibold text-white mb-1">Profile Settings</div>
                <div class="text-sm text-zinc-400">Manage your account</div>
              </div>
            </div>
            <svg class="w-5 h-5 text-zinc-500 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </a>
        </div>

        {/* Getting Started */}
        <Show when={wallet.connectionStatus() !== 'connected'}>
          <div class="border-t border-zinc-800 pt-8">
            <div class="bg-zinc-800/50 border border-zinc-700 p-6">
              <h3 class="text-base font-semibold text-white mb-4">Getting Started</h3>
              <div class="space-y-3 text-sm text-zinc-400">
                <div class="flex gap-3">
                  <span class="text-cyan-400 font-mono">01</span>
                  <span>Connect your Solana wallet</span>
                </div>
                <div class="flex gap-3">
                  <span class="text-cyan-400 font-mono">02</span>
                  <span>Create your SPLITDO token account</span>
                </div>
                <div class="flex gap-3">
                  <span class="text-cyan-400 font-mono">03</span>
                  <span>Exchange SOL for SPLITDO tokens</span>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default DashboardPage;
