import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import WalletSelectionModal from '../../components/WalletSelectionModal';

const WalletPage: Component<{ isDark: boolean }> = (props) => {
  const [isSwapModalOpen, setIsSwapModalOpen] = createSignal(false);

  // Mock Wallet Data (basierend auf echter API-Struktur)
  const mockWalletData = {
    solBalance: {
      wallet_address: "demo_wallet_address_123abc...",
      balance_lamports: "2500000000",
      balance_sol: 2.5,
      timestamp: Date.now()
    },
    splitdoBalance: {
      user_id: "demo_user_123",
      token_account_pubkey: "demo_token_account_456def...",
      token_balance: 1500.50,
      equivalent_usdc: 1500.50,
      exchange_rate: 1.0,
      last_updated: new Date().toISOString()
    },
    usdcBalance: 1500.50,
    transactions: [
      { id: 'tx_1', type: "Deposit", amount: 1000, timestamp: "2024-12-16", status: "Completed", hash: "abc123..." },
      { id: 'tx_2', type: "Transfer", amount: -50, timestamp: "2024-12-15", status: "Completed", hash: "def456..." },
      { id: 'tx_3', type: "Withdrawal", amount: -100, timestamp: "2024-12-14", status: "Pending", hash: "ghi789..." },
      { id: 'tx_4', type: "Swap", amount: 200, timestamp: "2024-12-13", status: "Completed", hash: "jkl012..." }
    ]
  };

  const formatCurrency = (amount: number, currency: string = 'SPLITDO') => {
    return `${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const formatAddress = (address: string) => {
    if (address.length <= 8) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div class="p-8 space-y-6">
      <div class="flex items-center justify-between">
        <h2 class={`text-2xl font-bold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
          Wallet
        </h2>
        <div class="flex space-x-3">
          <button
            disabled
            class={`px-4 py-2 rounded-lg border transition-colors opacity-50 cursor-not-allowed ${
              props.isDark
                ? 'border-zinc-600 text-gray-400'
                : 'border-gray-300 text-gray-500'
            }`}
          >
            Receive
          </button>
          <button
            disabled
            class={`px-4 py-2 rounded-lg border transition-colors opacity-50 cursor-not-allowed ${
              props.isDark
                ? 'border-zinc-600 text-gray-400'
                : 'border-gray-300 text-gray-500'
            }`}
          >
            Send
          </button>
        </div>
      </div>

      {/* Balance Overview */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SPLITDO Balance */}
        <div class={`p-6 rounded-lg border shadow-professional card-hover ${props.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <div class="flex items-center justify-between mb-2">
            <h3 class={`text-lg font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
              SPLITDO Token
            </h3>
            <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span class="text-white text-sm font-bold">S</span>
            </div>
          </div>
          <p class={`text-2xl font-bold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(mockWalletData.splitdoBalance.token_balance)}
          </p>
          <p class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            ≈ {formatCurrency(mockWalletData.splitdoBalance.equivalent_usdc, 'USDC')}
          </p>
          <p class={`text-xs mt-2 ${props.isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Rate: {mockWalletData.splitdoBalance.exchange_rate} USDC
          </p>
        </div>

        {/* USDC Balance */}
        <div class={`p-6 rounded-lg border shadow-professional card-hover ${props.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <div class="flex items-center justify-between mb-2">
            <h3 class={`text-lg font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
              USDC
            </h3>
            <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span class="text-white text-sm font-bold">$</span>
            </div>
          </div>
          <p class={`text-2xl font-bold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(mockWalletData.usdcBalance, 'USDC')}
          </p>
          <p class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            USD Coin
          </p>
        </div>

        {/* SOL Balance */}
        <div class={`p-6 rounded-lg border shadow-professional card-hover ${props.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <div class="flex items-center justify-between mb-2">
            <h3 class={`text-lg font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
              Solana
            </h3>
            <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <span class="text-white text-sm font-bold">◎</span>
            </div>
          </div>
          <p class={`text-2xl font-bold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(mockWalletData.solBalance.balance_sol, 'SOL')}
          </p>
          <p class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            For transaction fees
          </p>
          <p class={`text-xs mt-2 ${props.isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {formatAddress(mockWalletData.solBalance.wallet_address)}
          </p>
        </div>
      </div>

      {/* Swap/Trade Area */}
      <div class={`p-6 rounded-lg border shadow-professional ${props.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class={`text-lg font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
              Token Swap
            </h3>
            <p class={`text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Swap SOL for SPLITDO tokens
            </p>
          </div>
          <button
            onClick={() => setIsSwapModalOpen(true)}
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors btn-animate"
          >
            Swap
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class={`p-4 rounded-lg border ${props.isDark ? 'border-zinc-600 bg-zinc-700' : 'border-gray-200 bg-gray-50'}`}>
            <p class={`text-sm font-medium ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Current Rate
            </p>
            <p class={`text-xl font-bold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
              1 SOL = 1000 SPLITDO
            </p>
          </div>
          <div class={`p-4 rounded-lg border ${props.isDark ? 'border-zinc-600 bg-zinc-700' : 'border-gray-200 bg-gray-50'}`}>
            <p class={`text-sm font-medium ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Minimum Amount
            </p>
            <p class={`text-xl font-bold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
              0.1 SOL
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div class={`p-6 rounded-lg border shadow-professional ${props.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
        <h3 class={`text-lg font-semibold mb-4 ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
          Transaction History
        </h3>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class={`border-b ${props.isDark ? 'border-zinc-700' : 'border-gray-200'}`}>
                <th class={`text-left py-3 px-4 font-medium ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Type
                </th>
                <th class={`text-left py-3 px-4 font-medium ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Amount
                </th>
                <th class={`text-left py-3 px-4 font-medium ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date
                </th>
                <th class={`text-left py-3 px-4 font-medium ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Status
                </th>
                <th class={`text-left py-3 px-4 font-medium ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Hash
                </th>
              </tr>
            </thead>
            <tbody>
              {mockWalletData.transactions.map((tx) => (
                <tr class={`border-b transition-colors hover:bg-opacity-50 ${
                  props.isDark
                    ? 'border-zinc-700 hover:bg-zinc-700'
                    : 'border-gray-100 hover:bg-gray-50'
                }`}>
                  <td class={`py-3 px-4 ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {tx.type}
                  </td>
                  <td class={`py-3 px-4 font-mono ${
                    tx.amount > 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                  </td>
                  <td class={`py-3 px-4 ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {formatDate(tx.timestamp)}
                  </td>
                  <td class="py-3 px-4">
                    <span class={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td class={`py-3 px-4 font-mono text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatAddress(tx.hash)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wallet Selection Modal */}
      <WalletSelectionModal
        isOpen={isSwapModalOpen()}
        onClose={() => setIsSwapModalOpen(false)}
        isDark={props.isDark}
      />
    </div>
  );
};

export default WalletPage;