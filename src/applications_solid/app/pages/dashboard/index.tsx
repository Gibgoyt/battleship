import type { Component } from 'solid-js';
import { createSignal, onMount, createEffect, Show, createMemo } from 'solid-js';
import {
  useSplitdoATA,
  useWallet,
  useWalletBalances,
  useWalletModal
} from 'src/applications_solid/app/lib/wallet/wallet-context';

const DashboardPage: Component<{ isDark: boolean }> = (props) => {
  const [userEmail, setUserEmail] = createSignal<string>('');

  // Wallet hooks
  const { splitdoATA } = useSplitdoATA();
  const { wallet, connectionStatus } = useWallet();
  const { solBalance, refreshBalances } = useWalletBalances();
  const { openModal } = useWalletModal();

  // Check balances when wallet is connected
  createEffect(() => {
    if (connectionStatus() === 'connected' && wallet()) {
      console.log('[Dashboard] Wallet connected, refreshing balances');
      refreshBalances(); // This now includes SPLITDO ATA checking
    }
  });

  // Calculate portfolio value (SPLITDO value in SOL)
  const portfolioValueSOL = createMemo(() => {
    const splitdoBalance = splitdoATA().balance?.uiAmount || 0;
    const exchangeRate = 0.11; // 1 SPLITDO = 0.11 SOL
    return splitdoBalance * exchangeRate;
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

  const quickActions = [
    {
      title: 'SPLITDO Exchange',
      description: 'Manage your SPLITDO tokens',
      action: '/app/splitdo-exchange',
      label: 'Go to Exchange'
    },
    {
      title: 'Profile',
      description: 'View account details',
      action: '/app/profile',
      label: 'View Profile'
    }
  ];

  return (
    <div class="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 class="text-2xl md:text-3xl font-bold crypto-text-primary mb-1">
          Dashboard
        </h1>
        <p class="text-sm crypto-text-secondary">
          {userEmail() ? `Welcome back, ${userEmail()}` : 'Welcome to SPLITDO'}
        </p>
      </div>

      {/* Stats Overview */}
      <div class="space-y-4">
        <h2 class="text-lg md:text-xl font-semibold crypto-text-primary">
          Account Overview
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Portfolio Value */}
          <div class="bg-crypto-bg-secondary/50 backdrop-blur-sm rounded-2xl p-5 space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <span class="text-xs font-medium uppercase tracking-wide crypto-text-secondary">Portfolio Value</span>
            </div>
            <Show
              when={connectionStatus() === 'connected' && splitdoATA().status === 'exists'}
              fallback={
                <div class="pt-2">
                  <div class="text-2xl md:text-3xl font-bold crypto-text-muted">--</div>
                  <p class="text-xs crypto-text-muted mt-1">Connect wallet to view</p>
                </div>
              }
            >
              <div class="pt-2">
                <div class="text-2xl md:text-3xl font-bold crypto-text-primary">
                  {formatCurrency(portfolioValueSOL())} <span class="text-lg crypto-text-secondary">SOL</span>
                </div>
                <p class="text-xs crypto-text-secondary mt-1">SPLITDO holdings value</p>
              </div>
            </Show>
          </div>

          {/* SPLITDO Balance */}
          <div class="bg-crypto-bg-secondary/50 backdrop-blur-sm rounded-2xl p-5 space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <span class="text-xs font-medium uppercase tracking-wide crypto-text-secondary">SPLITDO Balance</span>
            </div>
            <Show
              when={connectionStatus() === 'connected' && splitdoATA().status === 'exists'}
              fallback={
                <div class="pt-2">
                  <div class="text-2xl md:text-3xl font-bold crypto-text-muted">--</div>
                  <p class="text-xs crypto-text-muted mt-1">
                    <Show when={connectionStatus() === 'connected'} fallback="Connect wallet to view">
                      Create SPLITDO account
                    </Show>
                  </p>
                </div>
              }
            >
              <div class="pt-2">
                <div class="text-2xl md:text-3xl font-bold crypto-text-primary">
                  {formatCurrency(splitdoATA().balance?.uiAmount || 0)}
                </div>
                <p class="text-xs crypto-text-secondary mt-1">SPLITDO tokens</p>
              </div>
            </Show>
          </div>

          {/* SOL Balance */}
          <div class="bg-crypto-bg-secondary/50 backdrop-blur-sm rounded-2xl p-5 space-y-3 sm:col-span-2 lg:col-span-1">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <span class="text-xs font-medium uppercase tracking-wide crypto-text-secondary">SOL Balance</span>
            </div>
            <Show
              when={connectionStatus() === 'connected' && solBalance()}
              fallback={
                <div class="pt-2">
                  <div class="text-2xl md:text-3xl font-bold crypto-text-muted">--</div>
                  <p class="text-xs crypto-text-muted mt-1">Connect wallet to view</p>
                </div>
              }
            >
              <div class="pt-2">
                <div class="text-2xl md:text-3xl font-bold crypto-text-primary">
                  {formatCurrency(solBalance()?.sol || 0, 4)} <span class="text-lg crypto-text-secondary">SOL</span>
                </div>
                <p class="text-xs crypto-text-secondary mt-1">For transaction fees</p>
              </div>
            </Show>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div class="space-y-4">
        <h2 class="text-lg md:text-xl font-semibold crypto-text-primary">
          Quick Actions
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <a
              href={action.action}
              class="group bg-crypto-bg-secondary/50 backdrop-blur-sm rounded-2xl p-5 hover:bg-crypto-bg-secondary/70 transition-all"
            >
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-base md:text-lg font-semibold crypto-text-primary">
                  {action.title}
                </h3>
                <svg class="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
              </div>
              <p class="text-sm crypto-text-secondary">
                {action.description}
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* Getting Started Guide */}
      <div class="bg-crypto-bg-secondary/30 backdrop-blur-sm rounded-2xl p-5 md:p-6">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-base md:text-lg font-semibold crypto-text-primary mb-3">
              Getting Started
            </h2>
            <ol class="space-y-2.5 text-sm crypto-text-secondary">
              <li class="flex items-start gap-2">
                <span class="text-cyan-400 font-semibold flex-shrink-0">1.</span>
                <span>Go to the Wallet page and connect your Solana wallet</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-cyan-400 font-semibold flex-shrink-0">2.</span>
                <span>Create your SPLITDO token account if you don't have one</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-cyan-400 font-semibold flex-shrink-0">3.</span>
                <span>Exchange SOL for SPLITDO tokens to get started</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
