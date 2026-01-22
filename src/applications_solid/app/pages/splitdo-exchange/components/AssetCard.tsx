import type { Component } from 'solid-js';
import { Show, createSignal } from 'solid-js';

interface AssetCardProps {
  isDark: boolean;
  asset: {
    symbol: string;
    name: string;
    balance: number;
    balanceFormatted: string;
    usdValue: number;
    change24h?: number;
    status: 'connected' | 'not_connected' | 'not_found' | 'error' | 'creating' | 'checking';
    address?: string;
    error?: string;
  };
  onConnect?: () => void;
  onCreate?: () => void;
  onRetry?: () => void;
  isCreating?: boolean;
}

const AssetCard: Component<AssetCardProps> = (props) => {
  const formatAddress = (address: string) => {
    if (address.length <= 8) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatCurrency = (amount: number, decimals: number = 2) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const getStatusColor = () => {
    switch (props.asset.status) {
      case 'connected':
        return 'text-crypto-accent-green';
      case 'error':
        return 'text-crypto-accent-red';
      case 'creating':
      case 'checking':
        return 'text-crypto-primary-blue';
      default:
        return props.isDark ? 'text-crypto-text-muted' : 'text-crypto-text-muted';
    }
  };

  const getStatusText = () => {
    switch (props.asset.status) {
      case 'connected':
        return 'Connected';
      case 'not_connected':
        return 'Not Connected';
      case 'not_found':
        return 'No Account';
      case 'error':
        return 'Error';
      case 'creating':
        return 'Creating...';
      case 'checking':
        return 'Checking...';
      default:
        return 'Unknown';
    }
  };

  const getAssetIcon = () => {
    switch (props.asset.symbol) {
      case 'SOL':
        return (
          <div class="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden p-1.5">
            <img src="/solana-logo.svg" alt="Solana" class="w-full h-full object-contain" />
          </div>
        );
      case 'SPLITDO':
        return (
          <div class="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden p-1">
            <img src="/splitdo/logo.svg" alt="SPLITDO" class="w-full h-full object-contain" />
          </div>
        );
      default:
        return (
          <div class="w-12 h-12 rounded-lg bg-crypto-border flex items-center justify-center">
            <span class={`font-bold text-lg ${props.isDark ? 'text-crypto-text-muted' : 'text-crypto-text-muted'}`}>
              {props.asset.symbol.slice(0, 2)}
            </span>
          </div>
        );
    }
  };

  return (
    <div class="crypto-card asset-card slide-in-up">
      {/* Asset Header */}
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          {getAssetIcon()}
          <div>
            <h3 class={`crypto-heading-3 mb-1 crypto-text-primary`}>
              {props.asset.name}
            </h3>
            <div class="flex items-center gap-2">
              <span class={`text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
              <Show when={props.asset.address}>
                <span class={`text-xs ${props.isDark ? 'text-crypto-text-muted' : 'text-crypto-text-muted'}`}>
                  {formatAddress(props.asset.address!)}
                </span>
              </Show>
            </div>
          </div>
        </div>

        {/* 24h Change (if available) */}
        <Show when={props.asset.change24h !== undefined}>
          <div class={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            props.asset.change24h! >= 0
              ? 'bg-crypto-accent-green/10 text-crypto-accent-green'
              : 'bg-crypto-accent-red/10 text-crypto-accent-red'
          }`}>
            <svg width="12" height="12" viewBox="0 0 12 12" class="fill-current">
              <Show when={props.asset.change24h! >= 0} fallback={
                <path d="M6 8l-2-2h4l-2 2z"/>
              }>
                <path d="M6 4l2 2H4l2-2z"/>
              </Show>
            </svg>
            {Math.abs(props.asset.change24h!).toFixed(2)}%
          </div>
        </Show>
      </div>

      {/* Balance Information */}
      <div class="mb-6">
        <Show when={props.asset.status === 'connected' || props.asset.balance > 0} fallback={
          <div class={`text-2xl font-bold ${props.isDark ? 'text-crypto-text-muted' : 'text-crypto-text-muted'}`}>
            --
          </div>
        }>
          <div>
            <div class={`text-2xl font-bold mb-1 crypto-text-primary`}>
              {props.asset.balanceFormatted}
            </div>
            <div class={`text-lg font-semibold ${props.isDark ? 'text-crypto-text-secondary' : 'text-crypto-text-secondary'}`}>
              ${formatCurrency(props.asset.usdValue)}
            </div>
          </div>
        </Show>
      </div>

      {/* Error Message */}
      <Show when={props.asset.status === 'error' && props.asset.error}>
        <div class="error-state mb-4 text-sm">
          <div class="font-semibold mb-1">Connection Error</div>
          <div>{props.asset.error}</div>
        </div>
      </Show>

      {/* Action Buttons */}
      <div class="flex gap-2">
        <Show when={props.asset.status === 'not_connected'}>
          <button
            onClick={props.onConnect}
            class="btn-crypto-primary flex-1"
          >
            Connect Wallet
          </button>
        </Show>

        <Show when={props.asset.status === 'not_found' && props.asset.symbol === 'SPLITDO'}>
          <button
            onClick={props.onCreate}
            disabled={props.isCreating}
            class="btn-crypto-success flex-1 disabled:opacity-50"
          >
            {props.isCreating ? (
              <div class="flex items-center justify-center gap-2">
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </Show>

        <Show when={props.asset.status === 'error'}>
          <button
            onClick={props.onRetry}
            class="btn-crypto-outline flex-1"
          >
            Retry
          </button>
        </Show>

        <Show when={props.asset.status === 'connected'}>
          <Show when={props.asset.symbol === 'SOL'}>
            <button class="btn-crypto-primary flex-1">
              Exchange
            </button>
          </Show>
          <Show when={props.asset.symbol === 'SPLITDO'}>
            <button class="btn-crypto-outline flex-1">
              Transfer
            </button>
          </Show>
        </Show>
      </div>

      {/* Loading States */}
      <Show when={props.asset.status === 'checking'}>
        <div class="mt-4">
          <div class="skeleton h-4 w-full mb-2"></div>
          <div class="skeleton h-3 w-3/4"></div>
        </div>
      </Show>
    </div>
  );
};

export default AssetCard;