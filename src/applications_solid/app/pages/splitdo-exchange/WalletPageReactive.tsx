import type { Component } from 'solid-js';
import { createSignal, createEffect, onMount, Show } from 'solid-js';
import {
  useSplitdoATA,
  useWalletModal,
  useWallet,
  useWalletConnection,
  useWalletBalances,
  useExchangeModal,
  useExchange
} from 'src/applications_solid/app/lib/wallet/wallet-reactive-store';
import WalletModal from '../../components/WalletModal';
import { ExchangeModal } from '../../components/ExchangeModal';
import PortfolioOverview from './components/PortfolioOverview';
import AssetCard from './components/AssetCard';
import EnhancedExchangeWidget from './components/EnhancedExchangeWidget';
import TransactionHistory from './components/TransactionHistory';

const WalletPageReactive: Component<{ isDark: boolean }> = (props) => {
  // SolidJS Reactive Store Hooks
  const { splitdoATA, checkSplitdoBalance, createSplitdoATA: createSplitdoATAStore } = useSplitdoATA();
  const { openModal, closeModal, isModalOpen } = useWalletModal();
  const { wallet, connectionStatus, connectionError } = useWallet();
  const { connectWallet, disconnectWallet } = useWalletConnection();
  const { solBalance, refreshBalances } = useWalletBalances();

  // Local state for ATA creation
  const [isCreatingATA, setIsCreatingATA] = createSignal(false);


  // Create ATA function using real reactive store implementation
  const createSplitdoATA = async (): Promise<{ success: boolean; signature?: string; error?: string }> => {
    setIsCreatingATA(true);
    console.log('[WalletPageReactive] Creating SPLITDO ATA...');

    try {
      const result = await createSplitdoATAStore();
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
    openModal();
  };

  // Debug modal state
  createEffect(() => {
    console.log('[WalletPageReactive] Modal state changed:', isModalOpen());
  });

  createEffect(() => {
    console.log('[WalletPageReactive] Connection status changed:', connectionStatus());
  });

  // Check SPLITDO account status on page load (run once)
  onMount(() => {
    console.log('[WalletPageReactive] Checking SPLITDO balance on page load');
    checkSplitdoBalance();
  });


  // Refresh balances when wallet is connected
  createEffect(() => {
    if (connectionStatus() === 'connected' && wallet()) {
      console.log('[WalletPageReactive] Wallet connected, refreshing balances');
      refreshBalances();
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

  // Prepare asset data for the AssetCard components
  const solAssetData = () => ({
    symbol: 'SOL',
    name: 'Solana',
    balance: solBalance()?.sol || 0,
    balanceFormatted: `${formatCurrency(solBalance()?.sol || 0, 4)} SOL`,
    usdValue: (solBalance()?.sol || 0) * 100, // Mock $100 per SOL
    change24h: 2.45, // Mock 24h change
    status: connectionStatus() === 'connected' ? 'connected' as const : 'not_connected' as const,
    address: wallet()?.address,
    error: connectionError() || undefined
  });

  const splitdoAssetData = () => {
    const ata = splitdoATA();
    let status: 'connected' | 'not_connected' | 'not_found' | 'error' | 'creating' | 'checking';

    if (ata.status === 'exists' || ata.status === 'created') {
      status = 'connected';
    } else if (connectionStatus() !== 'connected') {
      status = 'not_connected';
    } else {
      status = ata.status as any;
    }

    return {
      symbol: 'SPLITDO',
      name: 'SPLITDO Token',
      balance: ata.balance?.uiAmount || 0,
      balanceFormatted: `${formatCurrency(ata.balance?.uiAmount || 0)} SPLITDO`,
      usdValue: ata.balance?.uiAmount || 0, // Mock $1 per SPLITDO
      change24h: 5.82, // Mock 24h change
      status,
      address: ata.address,
      error: ata.error || undefined
    };
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
        <Show when={connectionStatus() === 'connecting'}>
          <div class="text-center">
            <div class="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <div class="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
              <span class="font-semibold text-yellow-600 dark:text-yellow-400">Connecting to wallet...</span>
            </div>
          </div>
        </Show>

        <Show when={connectionStatus() === 'error' && connectionError()}>
          <div class="error-state">
            <div class="font-semibold mb-1">Connection Error</div>
            <div>{connectionError()}</div>
          </div>
        </Show>

        <Show when={connectionStatus() === 'connected' && wallet()}>
          <div class="success-state">
            <div class="flex items-center justify-center gap-3">
              <div class="w-2 h-2 bg-crypto-accent-green rounded-full"></div>
              <span class="font-semibold">Wallet Connected:</span>
              <span>{wallet()?.name} ({formatAddress(wallet()?.address || '')})</span>
            </div>
          </div>
        </Show>

        {/* Portfolio Overview */}
        <PortfolioOverview isDark={props.isDark} />

        {/* Main Dashboard Grid */}
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column: Asset Cards */}
          <div class="xl:col-span-2 space-y-6">
            {/* Asset Cards Grid */}
            <div class="asset-grid">
              <AssetCard
                isDark={props.isDark}
                asset={solAssetData()}
                onConnect={handleConnectWalletClick}
                onRetry={() => refreshBalances()}
              />
              <AssetCard
                isDark={props.isDark}
                asset={splitdoAssetData()}
                onConnect={handleConnectWalletClick}
                onCreate={createSplitdoATA}
                onRetry={() => checkSplitdoBalance()}
                isCreating={isCreatingATA()}
              />
            </div>

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
          isOpen={isModalOpen}
          onClose={() => closeModal()}
          isDark={props.isDark}
        />

        {/* Exchange Modal */}
        <ExchangeModal isDark={props.isDark} />
      </div>
    </div>
  );
};

export default WalletPageReactive;
