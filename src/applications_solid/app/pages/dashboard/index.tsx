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
    <div class="p-6 md:p-8 max-w-screen-2xl mx-auto space-y-8">
      {/* Header */}
      <div class="space-y-2">
        <h1 class="text-3xl md:text-4xl font-bold crypto-text-primary">
          Dashboard
        </h1>
        <p class="text-sm crypto-text-secondary">
          {userEmail() ? `Welcome back, ${userEmail()}` : 'Welcome to SPLITDO'}
        </p>
      </div>

      {/* Stats Overview */}
      <div class="space-y-4">
        <h2 class="text-xl font-bold crypto-text-primary">
          Account Overview
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Portfolio Value */}
          <div class="relative overflow-hidden rounded-xl bg-crypto-bg-secondary border border-crypto-border p-6 hover:border-crypto-primary-blue/50 transition-all duration-300 group">
            <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-crypto-primary-blue to-crypto-primary-cyan"></div>
            <div class="flex items-start justify-between mb-4">
              <div class="text-sm font-semibold uppercase tracking-wider crypto-text-secondary">
                Portfolio Value
              </div>
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-crypto-primary-blue/20 to-crypto-primary-cyan/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg class="w-5 h-5 text-crypto-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <Show
              when={connectionStatus() === 'connected' && splitdoATA().status === 'exists'}
              fallback={
                <div>
                  <div class="text-3xl font-bold crypto-text-muted mb-2">
                    --
                  </div>
                  <div class="text-sm crypto-text-secondary">
                    Connect wallet to view
                  </div>
                </div>
              }
            >
              <div class="text-3xl font-bold crypto-text-primary mb-2">
                {formatCurrency(portfolioValueSOL())} SOL
              </div>
              <div class="text-sm crypto-text-secondary">
                SPLITDO holdings value
              </div>
            </Show>
          </div>

          {/* SPLITDO Balance */}
          <div class="relative overflow-hidden rounded-xl bg-crypto-bg-secondary border border-crypto-border p-6 hover:border-crypto-accent-green/50 transition-all duration-300 group">
            <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-crypto-accent-green to-emerald-400"></div>
            <div class="flex items-start justify-between mb-4">
              <div class="text-sm font-semibold uppercase tracking-wider crypto-text-secondary">
                SPLITDO Balance
              </div>
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-crypto-accent-green/20 to-emerald-400/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg class="w-5 h-5 text-crypto-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <Show
              when={connectionStatus() === 'connected' && splitdoATA().status === 'exists'}
              fallback={
                <div>
                  <div class="text-3xl font-bold crypto-text-muted mb-2">
                    --
                  </div>
                  <div class="text-sm crypto-text-secondary">
                    <Show
                      when={connectionStatus() === 'connected'}
                      fallback="Connect wallet to view"
                    >
                      Create SPLITDO account
                    </Show>
                  </div>
                </div>
              }
            >
              <div class="text-3xl font-bold crypto-text-primary mb-2">
                {formatCurrency(splitdoATA().balance?.uiAmount || 0)}
              </div>
              <div class="text-sm crypto-text-secondary">
                SPLITDO tokens
              </div>
            </Show>
          </div>

          {/* SOL Balance */}
          <div class="relative overflow-hidden rounded-xl bg-crypto-bg-secondary border border-crypto-border p-6 hover:border-crypto-accent-purple/50 transition-all duration-300 group">
            <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-crypto-accent-purple to-purple-400"></div>
            <div class="flex items-start justify-between mb-4">
              <div class="text-sm font-semibold uppercase tracking-wider crypto-text-secondary">
                SOL Balance
              </div>
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-crypto-accent-purple/20 to-purple-400/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg class="w-5 h-5 text-crypto-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
            </div>
            <Show
              when={connectionStatus() === 'connected' && solBalance()}
              fallback={
                <div>
                  <div class="text-3xl font-bold crypto-text-muted mb-2">
                    --
                  </div>
                  <div class="text-sm crypto-text-secondary">
                    Connect wallet to view
                  </div>
                </div>
              }
            >
              <div class="text-3xl font-bold crypto-text-primary mb-2">
                {formatCurrency(solBalance()?.sol || 0, 4)} SOL
              </div>
              <div class="text-sm crypto-text-secondary">
                For transaction fees
              </div>
            </Show>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div class="space-y-4">
        <h2 class="text-xl font-bold crypto-text-primary">
          Quick Actions
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {quickActions.map((action) => (
            <a
              href={action.action}
              class="group relative overflow-hidden rounded-xl bg-crypto-bg-secondary border border-crypto-border p-6 hover:border-crypto-primary-cyan/50 transition-all duration-300 hover:shadow-lg hover:shadow-crypto-primary-cyan/10"
            >
              <div class="flex items-start justify-between mb-3">
                <h3 class="text-lg font-bold crypto-text-primary">
                  {action.title}
                </h3>
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-crypto-primary-blue/20 to-crypto-primary-cyan/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg class="w-4 h-4 text-crypto-primary-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>
              <p class="text-sm crypto-text-secondary mb-4">
                {action.description}
              </p>
              <div class="flex items-center gap-2 text-sm font-semibold text-crypto-primary-cyan group-hover:gap-3 transition-all">
                <span>{action.label}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Getting Started Guide */}
      <div class="relative overflow-hidden rounded-xl bg-crypto-bg-secondary border border-crypto-border p-6">
        <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-orange-500"></div>
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="flex-1">
            <h2 class="text-lg font-bold crypto-text-primary mb-2">
              Getting Started
            </h2>
            <p class="text-sm crypto-text-secondary mb-4">
              Follow these steps to start using SPLITDO:
            </p>
            <ol class="space-y-3 text-sm crypto-text-primary">
              <li class="flex items-start gap-3">
                <span class="flex items-center justify-center w-6 h-6 rounded-full bg-crypto-primary-blue/20 text-crypto-primary-blue font-semibold text-xs flex-shrink-0">1</span>
                <span>Go to the Wallet page and connect your Solana wallet</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex items-center justify-center w-6 h-6 rounded-full bg-crypto-primary-blue/20 text-crypto-primary-blue font-semibold text-xs flex-shrink-0">2</span>
                <span>Create your SPLITDO token account if you don't have one</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex items-center justify-center w-6 h-6 rounded-full bg-crypto-primary-blue/20 text-crypto-primary-blue font-semibold text-xs flex-shrink-0">3</span>
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
