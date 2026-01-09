import type { Component } from 'solid-js';
import { createSignal, createMemo, Show, For } from 'solid-js';

interface Transaction {
  id: string;
  type: 'exchange' | 'transfer' | 'account_creation';
  status: 'success' | 'pending' | 'failed';
  fromAsset: string;
  toAsset?: string;
  amount: number;
  toAmount?: number;
  timestamp: Date;
  signature?: string;
  fee?: number;
}

interface TransactionHistoryProps {
  isDark: boolean;
}

const TransactionHistory: Component<TransactionHistoryProps> = (props) => {
  const [filter, setFilter] = createSignal<'all' | 'exchange' | 'transfer' | 'account_creation'>('all');
  const [sortBy, setSortBy] = createSignal<'newest' | 'oldest'>('newest');

  // Mock transaction data - in real app this would come from the wallet store
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      type: 'exchange',
      status: 'success',
      fromAsset: 'SOL',
      toAsset: 'SPLITDO',
      amount: 2.5,
      toAmount: 2500,
      timestamp: new Date('2026-01-09T10:30:00Z'),
      signature: 'abc123...def789',
      fee: 0.001
    },
    {
      id: '2',
      type: 'account_creation',
      status: 'success',
      fromAsset: 'SOL',
      amount: 0.00204,
      timestamp: new Date('2026-01-09T09:15:00Z'),
      signature: 'xyz789...abc123',
      fee: 0.00204
    },
    {
      id: '3',
      type: 'exchange',
      status: 'pending',
      fromAsset: 'SOL',
      toAsset: 'SPLITDO',
      amount: 1.0,
      toAmount: 1000,
      timestamp: new Date('2026-01-09T11:45:00Z'),
      fee: 0.001
    },
    {
      id: '4',
      type: 'transfer',
      status: 'failed',
      fromAsset: 'SPLITDO',
      amount: 500,
      timestamp: new Date('2026-01-08T14:20:00Z'),
      signature: 'failed123',
      fee: 0.0005
    }
  ];

  const filteredTransactions = createMemo(() => {
    let filtered = mockTransactions;

    if (filter() !== 'all') {
      filtered = filtered.filter(tx => tx.type === filter());
    }

    return filtered.sort((a, b) => {
      if (sortBy() === 'newest') {
        return b.timestamp.getTime() - a.timestamp.getTime();
      } else {
        return a.timestamp.getTime() - b.timestamp.getTime();
      }
    });
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatAmount = (amount: number, asset: string) => {
    const decimals = asset === 'SOL' ? 4 : 2;
    return `${amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })} ${asset}`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'exchange':
        return (
          <div class="w-8 h-8 rounded-full bg-crypto-primary-blue/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" class="fill-current text-crypto-primary-blue">
              <path d="M8 2l3 3H9v6H7V5H5l3-3zm0 12l-3-3h2V5h2v6h2l-3 3z"/>
            </svg>
          </div>
        );
      case 'transfer':
        return (
          <div class="w-8 h-8 rounded-full bg-crypto-primary-cyan/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" class="fill-current text-crypto-primary-cyan">
              <path d="M2 5l6-3 6 3v6l-6 3-6-3V5zm2 1.5v4l4 2 4-2v-4l-4 2-4-2z"/>
            </svg>
          </div>
        );
      case 'account_creation':
        return (
          <div class="w-8 h-8 rounded-full bg-crypto-accent-green/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" class="fill-current text-crypto-accent-green">
              <path d="M8 3a5 5 0 110 10A5 5 0 018 3zm0 1a4 4 0 100 8 4 4 0 000-8zm1 2v2h2v1h-2v2H8V9H6V8h2V6h1z"/>
            </svg>
          </div>
        );
      default:
        return (
          <div class="w-8 h-8 rounded-full bg-crypto-border flex items-center justify-center">
            <span class="text-crypto-text-muted">?</span>
          </div>
        );
    }
  };

  const getTransactionTitle = (tx: Transaction) => {
    switch (tx.type) {
      case 'exchange':
        return `Exchange ${tx.fromAsset} → ${tx.toAsset}`;
      case 'transfer':
        return `Transfer ${tx.fromAsset}`;
      case 'account_creation':
        return 'Account Creation';
      default:
        return 'Unknown Transaction';
    }
  };

  const getTransactionDescription = (tx: Transaction) => {
    switch (tx.type) {
      case 'exchange':
        return `${formatAmount(tx.amount, tx.fromAsset)} → ${formatAmount(tx.toAmount!, tx.toAsset!)}`;
      case 'transfer':
        return `${formatAmount(tx.amount, tx.fromAsset)}`;
      case 'account_creation':
        return 'SPLITDO Token Account';
      default:
        return '';
    }
  };

  return (
    <div class="transaction-history slide-in-up">
      {/* Header */}
      <div class="transaction-history-header">
        <div class="flex items-center justify-between mb-4">
          <h3 class={`crypto-heading-3 ${props.isDark ? 'text-crypto-text-primary' : 'text-crypto-text-primary'}`}>
            Transaction History
          </h3>
          <button class="btn-crypto-outline text-sm py-2 px-4">
            Export
          </button>
        </div>

        {/* Filters */}
        <div class="flex flex-wrap gap-3">
          <div class="flex items-center gap-2">
            <label class={`text-sm font-medium ${props.isDark ? 'text-crypto-text-secondary' : 'text-crypto-text-secondary'}`}>
              Filter:
            </label>
            <select
              value={filter()}
              onChange={(e) => setFilter(e.target.value as any)}
              class={`text-sm px-3 py-1 rounded-md border ${
                props.isDark
                  ? 'bg-crypto-bg-primary border-crypto-border text-crypto-text-primary'
                  : 'bg-crypto-bg-primary border-crypto-border text-crypto-text-primary'
              }`}
            >
              <option value="all">All Types</option>
              <option value="exchange">Exchanges</option>
              <option value="transfer">Transfers</option>
              <option value="account_creation">Account Creation</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <label class={`text-sm font-medium ${props.isDark ? 'text-crypto-text-secondary' : 'text-crypto-text-secondary'}`}>
              Sort:
            </label>
            <select
              value={sortBy()}
              onChange={(e) => setSortBy(e.target.value as any)}
              class={`text-sm px-3 py-1 rounded-md border ${
                props.isDark
                  ? 'bg-crypto-bg-primary border-crypto-border text-crypto-text-primary'
                  : 'bg-crypto-bg-primary border-crypto-border text-crypto-text-primary'
              }`}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div class="space-y-0">
        <Show when={filteredTransactions().length > 0} fallback={
          <div class="text-center py-12">
            <div class="w-16 h-16 mx-auto mb-4 bg-crypto-border rounded-full flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 32 32" class="fill-current text-crypto-text-muted">
                <path d="M16 4C9.4 4 4 9.4 4 16s5.4 12 12 12 12-5.4 12-12S22.6 4 16 4zm0 2c5.5 0 10 4.5 10 10s-4.5 10-10 10S6 21.5 6 16 10.5 6 16 6zm-1 4v6h2v-6h-2zm0 8v2h2v-2h-2z"/>
              </svg>
            </div>
            <h4 class={`crypto-heading-3 mb-2 ${props.isDark ? 'text-crypto-text-primary' : 'text-crypto-text-primary'}`}>
              No Transactions Yet
            </h4>
            <p class={`crypto-text-large ${props.isDark ? 'text-crypto-text-secondary' : 'text-crypto-text-secondary'}`}>
              Your transaction history will appear here once you start trading.
            </p>
          </div>
        }>
          <For each={filteredTransactions()}>
            {(transaction) => (
              <div class="transaction-item group">
                <div class="flex items-center gap-4">
                  {/* Icon */}
                  <div class="flex-shrink-0">
                    {getTransactionIcon(transaction.type)}
                  </div>

                  {/* Transaction Info */}
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between">
                      <div>
                        <h4 class={`font-semibold ${props.isDark ? 'text-crypto-text-primary' : 'text-crypto-text-primary'}`}>
                          {getTransactionTitle(transaction)}
                        </h4>
                        <p class={`text-sm ${props.isDark ? 'text-crypto-text-secondary' : 'text-crypto-text-secondary'}`}>
                          {getTransactionDescription(transaction)}
                        </p>
                        <Show when={transaction.signature}>
                          <p class={`text-xs mt-1 ${props.isDark ? 'text-crypto-text-muted' : 'text-crypto-text-muted'}`}>
                            {transaction.signature?.slice(0, 8)}...{transaction.signature?.slice(-8)}
                          </p>
                        </Show>
                      </div>

                      <div class="text-right flex-shrink-0">
                        <div class={`text-sm font-semibold ${props.isDark ? 'text-crypto-text-primary' : 'text-crypto-text-primary'}`}>
                          {formatDate(transaction.timestamp)}
                        </div>
                        <div class={`transaction-status ${transaction.status} mt-1`}>
                          {transaction.status}
                        </div>
                        <Show when={transaction.fee}>
                          <div class={`text-xs mt-1 ${props.isDark ? 'text-crypto-text-muted' : 'text-crypto-text-muted'}`}>
                            Fee: {formatAmount(transaction.fee!, 'SOL')}
                          </div>
                        </Show>
                      </div>
                    </div>
                  </div>

                  {/* Action Button (appears on hover) */}
                  <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Show when={transaction.signature}>
                      <button class="p-2 rounded-md hover:bg-crypto-bg-tertiary transition-colors">
                        <svg width="16" height="16" viewBox="0 0 16 16" class={`fill-current ${props.isDark ? 'text-crypto-text-muted' : 'text-crypto-text-muted'}`}>
                          <path d="M8 1l7 7-7 7V9H1V7h7V1z"/>
                        </svg>
                      </button>
                    </Show>
                  </div>
                </div>
              </div>
            )}
          </For>
        </Show>
      </div>

      {/* Load More Button */}
      <Show when={filteredTransactions().length > 0}>
        <div class="text-center pt-4 border-t border-crypto-border">
          <button class="btn-crypto-outline">
            Load More Transactions
          </button>
        </div>
      </Show>
    </div>
  );
};

export default TransactionHistory;