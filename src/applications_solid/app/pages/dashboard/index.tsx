import type { Component } from 'solid-js';
import { createSignal, onMount, createEffect, Show, createMemo } from 'solid-js';
import { useUnifiedWallet } from 'src/applications_solid/app/lib/wallet/unified-wallet-context';

const DashboardPage: Component<{ isDark: boolean }> = (props) => {
  const [userEmail, setUserEmail] = createSignal<string>('');

  // Wallet context - using unified wallet
  const wallet = useUnifiedWallet();

  // Check balances when wallet is connected
  createEffect(() => {
    if (wallet.connectionStatus() === 'connected' && wallet.wallet()) {
      console.log('[Dashboard] Wallet connected, refreshing balances');
      wallet.refreshBalances();
    }
  });

  // Helper to get SPLITDO balance as a readable number
  const splitdoBalanceTokens = createMemo(() => {
    const balance = wallet.splitdoATA().balance;
    if (!balance) return 0;

    // Try uiAmount first (if available), otherwise convert from raw amount
    if (balance.uiAmount !== undefined && balance.uiAmount !== null) {
      return balance.uiAmount;
    }

    // Fallback: convert from raw amount (9 decimals like SOL)
    return (balance.amount || 0) / 1_000_000_000;
  });

  // Calculate portfolio value (SPLITDO value in SOL)
  const portfolioValueSOL = createMemo(() => {
    const splitdoBalance = splitdoBalanceTokens();
    // SPLITDO exchange rate: 1 SPLITDO = 0.00004545 SOL
    const splitdoToSolRate = 0.00004545;
    const splitdoValueInSol = splitdoBalance * splitdoToSolRate;
    const solBalance = wallet.solBalance()?.sol || 0;
    return splitdoValueInSol + solBalance;
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
      {/* Hero Section */}
      <div class="relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10"></div>
        <div class="relative px-4 pt-12 pb-20 md:px-8 md:pt-20 md:pb-32">
          <div class="max-w-4xl mx-auto text-center space-y-6">
            <div class="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
              <span class="text-sm font-medium text-cyan-400">
                {userEmail() ? userEmail() : 'Welcome to SPLITDO'}
              </span>
            </div>

            <h1 class="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
              Your Portfolio
            </h1>

            <Show
              when={wallet.connectionStatus() === 'connected' && wallet.splitdoATA().status === 'exists'}
              fallback={
                <div class="space-y-6">
                  <div class="text-7xl md:text-8xl font-bold text-zinc-700">
                    --
                  </div>
                </div>
              }
            >
              <div class="space-y-4">
                <div class="text-6xl md:text-8xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {formatCurrency(portfolioValueSOL(), 4)}
                </div>
                <div class="text-xl md:text-2xl text-zinc-400 font-medium">
                  SOL
                </div>
              </div>
            </Show>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div class="px-4 md:px-8 pb-12 -mt-8">
        <div class="max-w-4xl mx-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SPLITDO Balance */}
            <div class="bg-zinc-900/50 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800">
              <div class="flex items-center justify-between mb-4">
                <span class="text-sm font-medium text-zinc-500 uppercase tracking-wider">SPLITDO</span>
                <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
              <Show
                when={wallet.connectionStatus() === 'connected' && wallet.splitdoATA().status === 'exists'}
                fallback={
                  <div class="text-3xl font-bold text-zinc-700">--</div>
                }
              >
                <div class="text-3xl font-bold text-white">
                  {formatCurrency(splitdoBalanceTokens())}
                </div>
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
                when={wallet.connectionStatus() === 'connected' && wallet.solBalance()}
                fallback={
                  <div class="text-3xl font-bold text-zinc-700">--</div>
                }
              >
                <div class="text-3xl font-bold text-white">
                  {formatCurrency(wallet.solBalance()?.sol || 0, 4)}
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div class="px-4 md:px-8 pb-12">
        <div class="max-w-4xl mx-auto space-y-4">
          <a
            href="/app/splitdo-exchange"
            class="group block bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/20 rounded-3xl p-6 transition-all"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-white">Exchange Tokens</h3>
                  <p class="text-sm text-zinc-400">Trade SOL for SPLITDO</p>
                </div>
              </div>
              <svg class="w-6 h-6 text-zinc-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </a>

          <a
            href="/app/profile"
            class="group block bg-zinc-900/50 hover:bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 transition-all"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
                  <svg class="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-white">Profile Settings</h3>
                  <p class="text-sm text-zinc-400">Manage your account</p>
                </div>
              </div>
              <svg class="w-6 h-6 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </a>
        </div>
      </div>

      {/* Getting Started */}
      <Show when={wallet.connectionStatus() !== 'connected'}>
        <div class="px-4 md:px-8 pb-12">
          <div class="max-w-4xl mx-auto">
            <div class="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 md:p-8">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-bold text-white mb-3">Getting Started</h3>
                  <ol class="space-y-2 text-sm text-zinc-400">
                    <li class="flex gap-2">
                      <span class="text-cyan-400 font-semibold">1.</span>
                      <span>Connect your Solana wallet</span>
                    </li>
                    <li class="flex gap-2">
                      <span class="text-cyan-400 font-semibold">2.</span>
                      <span>Create your SPLITDO token account</span>
                    </li>
                    <li class="flex gap-2">
                      <span class="text-cyan-400 font-semibold">3.</span>
                      <span>Exchange SOL for SPLITDO tokens</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default DashboardPage;
