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

    // Initial balance check
    checkSplitdoBalance();
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
    <div class="p-6 md:p-8 max-w-screen-2xl mx-auto space-y-6">
      {/* Header */}
      <div class="border-b pb-4" style={props.isDark ? 'border-color: #27272a;' : 'border-color: #e5e7eb;'}>
        <h1 class={`text-2xl md:text-3xl font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
          Dashboard
        </h1>
        <p class={`mt-2 text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {userEmail() ? `Welcome back, ${userEmail()}` : 'Welcome to SPLITDO'}
        </p>
      </div>

      {/* Stats Overview */}
      <div>
        <h2 class={`text-lg font-semibold mb-4 ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
          Account Overview
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Portfolio Value */}
          <div class={`p-6 border-l-4 border-blue-500 ${props.isDark ? 'bg-zinc-800/30' : 'bg-blue-50'}`}>
            <div class={`text-sm font-medium uppercase tracking-wider ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Portfolio Value
            </div>
            <Show
              when={connectionStatus() === 'connected' && splitdoATA().status === 'exists'}
              fallback={
                <div>
                  <div class={`mt-2 text-2xl font-semibold ${props.isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    --
                  </div>
                  <div class={`text-xs mt-1 ${props.isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Connect wallet to view
                  </div>
                </div>
              }
            >
              <div class={`mt-2 text-2xl font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(portfolioValueSOL())} SOL
              </div>
              <div class={`text-xs mt-1 ${props.isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                SPLITDO holdings value
              </div>
            </Show>
          </div>

          {/* SPLITDO Balance */}
          <div class={`p-6 border-l-4 border-green-500 ${props.isDark ? 'bg-zinc-800/30' : 'bg-green-50'}`}>
            <div class={`text-sm font-medium uppercase tracking-wider ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              SPLITDO Balance
            </div>
            <Show
              when={connectionStatus() === 'connected' && splitdoATA().status === 'exists'}
              fallback={
                <div>
                  <div class={`mt-2 text-2xl font-semibold ${props.isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    --
                  </div>
                  <div class={`text-xs mt-1 ${props.isDark ? 'text-gray-500' : 'text-gray-600'}`}>
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
              <div class={`mt-2 text-2xl font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(splitdoATA().balance?.uiAmount || 0)}
              </div>
              <div class={`text-xs mt-1 ${props.isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                SPLITDO tokens
              </div>
            </Show>
          </div>

          {/* SOL Balance */}
          <div class={`p-6 border-l-4 border-purple-500 ${props.isDark ? 'bg-zinc-800/30' : 'bg-purple-50'}`}>
            <div class={`text-sm font-medium uppercase tracking-wider ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              SOL Balance
            </div>
            <Show
              when={connectionStatus() === 'connected' && solBalance()}
              fallback={
                <div>
                  <div class={`mt-2 text-2xl font-semibold ${props.isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    --
                  </div>
                  <div class={`text-xs mt-1 ${props.isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    Connect wallet to view
                  </div>
                </div>
              }
            >
              <div class={`mt-2 text-2xl font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(solBalance()?.sol || 0, 4)} SOL
              </div>
              <div class={`text-xs mt-1 ${props.isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                For transaction fees
              </div>
            </Show>
          </div>
        </div>

      </div>

      {/* Quick Actions */}
      <div>
        <h2 class={`text-lg font-semibold mb-4 ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
          Quick Actions
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <a
              href={action.action}
              class={`p-6 border transition-colors ${
                props.isDark
                  ? 'bg-zinc-800/30 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <h3 class={`text-lg font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
                {action.title}
              </h3>
              <p class={`mt-1 text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {action.description}
              </p>
              <div class="mt-4">
                <span class="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {action.label} →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Getting Started Guide */}
      <div class={`p-6 border-l-4 border-yellow-500 ${props.isDark ? 'bg-zinc-800/30' : 'bg-yellow-50'}`}>
        <h2 class={`text-lg font-semibold mb-2 ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
          Getting Started
        </h2>
        <p class={`text-sm mb-4 ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Follow these steps to start using SPLITDO:
        </p>
        <ol class={`list-decimal list-inside space-y-2 text-sm ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          <li>Go to the Wallet page and connect your Solana wallet</li>
          <li>Create your SPLITDO token account if you don't have one</li>
          <li>Exchange SOL for SPLITDO tokens to get started</li>
        </ol>
      </div>
    </div>
  );
};

export default DashboardPage;
