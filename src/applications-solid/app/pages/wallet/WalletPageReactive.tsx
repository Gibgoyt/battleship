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
} from 'src/lib/wallet/wallet-reactive-store';
import WalletModal from '../../components/WalletModal';
import { ExchangeSection } from '../../components/ExchangeSection';
import { ExchangeModal } from '../../components/ExchangeModal';

const WalletPageReactive: Component<{ isDark: boolean }> = (props) => {
  // SolidJS Reactive Store Hooks
  const { splitdoATA, checkSplitdoBalance, createSplitdoATA: createSplitdoATAStore } = useSplitdoATA();
  const { openModal, closeModal, isModalOpen } = useWalletModal();
  const { wallet, connectionStatus, connectionError } = useWallet();
  const { connectWallet, disconnectWallet } = useWalletConnection();
  const { solBalance, refreshBalances } = useWalletBalances();

  // Local state for ATA creation
  const [isCreatingATA, setIsCreatingATA] = createSignal(false);

  // State for creation intent - to create ATA after wallet connection
  const [createATAAfterConnection, setCreateATAAfterConnection] = createSignal(false);

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

  // Smart SPLITDO button handler
  const handleSplitdoAccountCreation = async () => {
    if (connectionStatus() === 'connected') {
      // Wallet connected - directly create ATA
      console.log('[WalletPageReactive] Creating SPLITDO ATA with connected wallet');
      await createSplitdoATA();
    } else {
      // Need to connect wallet first, then create ATA
      console.log('[WalletPageReactive] Connecting wallet for SPLITDO ATA creation');
      setCreateATAAfterConnection(true);
      openModal();
    }
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

  // Auto-create ATA after wallet connection (if intended)
  createEffect(() => {
    if (connectionStatus() === 'connected' && createATAAfterConnection()) {
      console.log('[WalletPageReactive] Wallet connected - proceeding with ATA creation');
      setCreateATAAfterConnection(false);

      // Small delay to ensure wallet is ready
      setTimeout(async () => {
        await createSplitdoATA();
      }, 500);
    }
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

  return (
    <div class="p-6 md:p-8 space-y-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div class="border-b pb-4" style={props.isDark ? 'border-color: #27272a;' : 'border-color: #e5e7eb;'}>
        <h1 class={`text-2xl md:text-3xl font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
          SPLITDO Token Presale
        </h1>
        <p class={`mt-2 text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Manage your wallet and purchase SPLITDO tokens on Solana
        </p>
      </div>

      {/* Connection Status Banners */}
      <Show when={connectionStatus() === 'connecting'}>
        <div class={`p-3 border-l-4 ${props.isDark ? 'bg-zinc-800/50 border-yellow-500 text-yellow-400' : 'bg-yellow-50 border-yellow-500 text-yellow-800'}`}>
          <span class="font-medium">Connecting to wallet...</span>
        </div>
      </Show>

      <Show when={connectionStatus() === 'error' && connectionError()}>
        <div class={`p-3 border-l-4 ${props.isDark ? 'bg-zinc-800/50 border-red-500 text-red-400' : 'bg-red-50 border-red-500 text-red-800'}`}>
          <span class="font-medium">Connection Error:</span> {connectionError()}
        </div>
      </Show>

      <Show when={connectionStatus() === 'connected' && wallet()}>
        <div class={`p-3 border-l-4 ${props.isDark ? 'bg-zinc-800/50 border-green-500 text-green-400' : 'bg-green-50 border-green-500 text-green-800'}`}>
          <span class="font-medium">Wallet Connected:</span> {wallet()?.name} ({formatAddress(wallet()?.address || '')})
        </div>
      </Show>

      {/* Account Balances Table */}
      <div>
        <h2 class={`text-lg md:text-xl font-semibold mb-4 ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
          Account Balances
        </h2>
        <div class="overflow-x-auto">
          <table class={`w-full border-collapse ${props.isDark ? 'border-zinc-700' : 'border-gray-200'}`} style="border-width: 1px;">
            <thead>
              <tr class={props.isDark ? 'bg-zinc-800/50' : 'bg-gray-50'} style={props.isDark ? 'border-bottom: 1px solid #3f3f46;' : 'border-bottom: 1px solid #e5e7eb;'}>
                <th class={`px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Asset
                </th>
                <th class={`px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Balance
                </th>
                <th class={`px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status / Address
                </th>
                <th class={`px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {/* SPLITDO Token Row */}
              <tr class={props.isDark ? 'border-zinc-700' : 'border-gray-200'} style="border-bottom-width: 1px;">
                <td class={`px-4 md:px-6 py-4 whitespace-nowrap font-medium ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
                  SPLITDO
                </td>
                <td class={`px-4 md:px-6 py-4 whitespace-nowrap ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Show when={splitdoATA().status === 'exists'} fallback={<span class="text-gray-500">--</span>}>
                    <span class="font-semibold">{formatCurrency(splitdoATA().balance?.uiAmount || 0)}</span>
                  </Show>
                </td>
                <td class={`px-4 md:px-6 py-4 text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Show when={splitdoATA().status === 'exists'}>
                    <div>
                      <div class="text-green-600 dark:text-green-400 font-medium">Active</div>
                      <div class="text-xs">{formatAddress(splitdoATA().address || '')}</div>
                    </div>
                  </Show>
                  <Show when={splitdoATA().status === 'not_found'}>
                    <span class="text-gray-500">No account</span>
                  </Show>
                  <Show when={splitdoATA().status === 'checking'}>
                    <span class="text-blue-500">Checking...</span>
                  </Show>
                  <Show when={splitdoATA().status === 'creating'}>
                    <span class="text-blue-500">Creating...</span>
                  </Show>
                  <Show when={splitdoATA().status === 'error'}>
                    <span class="text-red-500">Error</span>
                  </Show>
                </td>
                <td class={`px-4 md:px-6 py-4`}>
                  <Show when={splitdoATA().status === 'not_found'}>
                    <Show
                      when={connectionStatus() === 'connected'}
                      fallback={
                        <button
                          onClick={handleSplitdoAccountCreation}
                          class={`px-3 py-1.5 text-sm border transition-colors ${
                            props.isDark
                              ? 'border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white'
                              : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                          }`}
                        >
                          Connect Wallet
                        </button>
                      }
                    >
                      <button
                        onClick={async () => await createSplitdoATA()}
                        disabled={isCreatingATA()}
                        class={`px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
                          props.isDark
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isCreatingATA() ? 'Creating...' : 'Create Account'}
                      </button>
                    </Show>
                  </Show>
                  <Show when={splitdoATA().status === 'error'}>
                    <button
                      onClick={() => checkSplitdoBalance()}
                      class="px-3 py-1.5 text-sm bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                    >
                      Retry
                    </button>
                  </Show>
                </td>
              </tr>

              {/* SOL Row */}
              <tr class={props.isDark ? 'border-zinc-700' : 'border-gray-200'} style="border-bottom-width: 1px;">
                <td class={`px-4 md:px-6 py-4 whitespace-nowrap font-medium ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
                  Solana
                </td>
                <td class={`px-4 md:px-6 py-4 whitespace-nowrap ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <Show when={connectionStatus() === 'connected' && solBalance()} fallback={<span class="text-gray-500">--</span>}>
                    <span class="font-semibold">{formatCurrency(solBalance()?.sol || 0, 'SOL')}</span>
                  </Show>
                </td>
                <td class={`px-4 md:px-6 py-4 text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Show when={connectionStatus() === 'connected' && wallet()}>
                    <div>
                      <div class="text-green-600 dark:text-green-400 font-medium">Connected</div>
                      <div class="text-xs">{formatAddress(wallet()?.address || '')}</div>
                    </div>
                  </Show>
                  <Show when={connectionStatus() !== 'connected'}>
                    <span class="text-gray-500">Not connected</span>
                  </Show>
                </td>
                <td class={`px-4 md:px-6 py-4`}>
                  <Show when={connectionStatus() !== 'connected'}>
                    <button
                      onClick={() => openModal()}
                      class={`px-3 py-1.5 text-sm border transition-colors ${
                        props.isDark
                          ? 'border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white'
                          : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                      }`}
                    >
                      Connect
                    </button>
                  </Show>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Exchange Section */}
      <ExchangeSection isDark={props.isDark} />

      {/* Wallet Selection Modal */}
      <WalletModal
        isOpen={isModalOpen()}
        onClose={() => closeModal()}
        isDark={props.isDark}
      />

      {/* Exchange Modal */}
      <ExchangeModal isDark={props.isDark} />
    </div>
  );
};

export default WalletPageReactive;
