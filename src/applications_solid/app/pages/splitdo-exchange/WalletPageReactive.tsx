import type { Component } from 'solid-js';
import { createSignal, createEffect, onMount, Show } from 'solid-js';
import { useUnifiedWallet } from 'src/applications_solid/app/lib/wallet/unified-wallet-context';
import WalletModal from '../../components/WalletModal';
import { ExchangeModal } from '../../components/ExchangeModal';
import { CreateAccountModal } from '../../components/CreateAccountModal';
import PortfolioOverview from './components/PortfolioOverview';
import EnhancedExchangeWidget from './components/EnhancedExchangeWidget';
import TransactionHistory from './components/TransactionHistory';

const WalletPageReactive: Component<{ isDark: boolean }> = (props) => {
  // SolidJS Reactive Store Hooks
  const wallet = useUnifiedWallet();

  // Local state for ATA creation
  const [isCreatingATA, setIsCreatingATA] = createSignal(false);


  // Create ATA function using unified wallet implementation
  const createSplitdoATA = async (): Promise<{ success: boolean; signature?: string; error?: string }> => {
    setIsCreatingATA(true);
    console.log('[WalletPageReactive] Creating SPLITDO ATA...');

    try {
      const result = await wallet.createSplitdoATA();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Creation failed'
      };
    } finally {
      setIsCreatingATA(false);
    }
  };

  // Copy exact working pattern from Start Token Exchange button
  const handleConnectWalletClick = () => {
    wallet.openWalletModal();
  };

  // Debug modal state
  createEffect(() => {
    console.log('[WalletPageReactive] Modal state changed:', wallet.isWalletModalOpen());
  });

  createEffect(() => {
    console.log('[WalletPageReactive] Connection status changed:', wallet.connectionStatus());
  });

  // Check SPLITDO account status on page load (run once)
  onMount(() => {
    console.log('[WalletPageReactive] Checking SPLITDO balance on page load');
    // The unified wallet automatically manages balance data, no need for explicit check
    wallet.refreshBalances();
  });


  // Refresh balances when wallet is connected
  createEffect(() => {
    if (wallet.connectionStatus() === 'connected' && wallet.wallet()) {
      console.log('[WalletPageReactive] Wallet connected, refreshing balances');
      wallet.refreshBalances();
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
    <div class="min-h-screen" style="background: var(--crypto-bg-primary); color: var(--crypto-text-primary);">
      <div class="p-6 md:p-8 max-w-screen-2xl mx-auto space-y-8">
        {/* Header */}
        <div class="text-center mb-8">
          <h1 class="crypto-heading-1 mb-3">
            SPLITDO Exchange
          </h1>
          <p class="crypto-text-large max-w-2xl mx-auto">
            Professional crypto exchange for SPLITDO token presale on Solana blockchain
          </p>
        </div>

        {/* Connection Status Banners */}
        <Show when={wallet.connectionStatus() === 'connecting'}>
          <div class="text-center">
            <div class="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <div class="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
              <span class="font-semibold text-yellow-600 dark:text-yellow-400">Connecting to wallet...</span>
            </div>
          </div>
        </Show>

        <Show when={wallet.connectionStatus() === 'error' && wallet.connectionError()}>
          <div class="error-state">
            <div class="font-semibold mb-1">Connection Error</div>
            <div>{wallet.connectionError()}</div>
          </div>
        </Show>

        <Show when={wallet.connectionStatus() === 'connected' && wallet.wallet()}>
          <div class="success-state">
            <div class="flex items-center justify-center gap-3">
              <div class="w-2 h-2 bg-crypto-accent-green rounded-full"></div>
              <span class="font-semibold">Wallet Connected:</span>
              <span>{wallet.wallet()?.name} ({formatAddress(wallet.wallet()?.address || '')})</span>
            </div>
          </div>
        </Show>

        {/* Portfolio Overview */}
        <PortfolioOverview isDark={props.isDark} />

        {/* Main Dashboard Grid */}
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column: Transaction History */}
          <div class="xl:col-span-2 space-y-6">
            {/* Transaction History */}
            <TransactionHistory isDark={props.isDark} />
          </div>

          {/* Right Column: Exchange Widget */}
          <div class="xl:col-span-1">
            <EnhancedExchangeWidget isDark={props.isDark} />
          </div>
        </div>

        {/* Wallet Selection Modal */}
        <WalletModal
          isOpen={wallet.isWalletModalOpen}
          onClose={() => wallet.closeWalletModal()}
          isDark={props.isDark}
        />

        {/* Exchange Modal */}
        <ExchangeModal isDark={props.isDark} />

        {/* Create Account Modal */}
        <CreateAccountModal isDark={props.isDark} />
      </div>
    </div>
  );
};

export default WalletPageReactive;
