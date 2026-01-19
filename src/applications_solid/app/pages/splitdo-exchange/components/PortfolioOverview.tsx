import type { Component } from 'solid-js';
import { createMemo, Show } from 'solid-js';
import { useUnifiedWallet } from 'src/applications_solid/app/lib/wallet/unified-wallet-context';

interface PortfolioOverviewProps {
  isDark: boolean;
}

const PortfolioOverview: Component<PortfolioOverviewProps> = (props) => {
  const wallet = useUnifiedWallet();

  // Calculate total portfolio value in USD
  const totalPortfolioValue = createMemo(() => {
    const solValue = (wallet.solBalance()?.sol || 0) * 100; // Assume $100 per SOL for demo
    const splitdoValue = (wallet.splitdoATA().balance?.amount || 0) * 0.11; // $0.11 per SPLITDO (presale price)
    return solValue + splitdoValue;
  });

  // Mock 24h change (in real app this would come from API)
  const portfolioChange = createMemo(() => {
    return {
      value: totalPortfolioValue() * 0.0245, // 2.45% gain for demo
      percentage: 2.45
    };
  });

  const formatCurrency = (amount: number, decimals: number = 2) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  return (
    <div class="portfolio-overview slide-in-up">
      {/* Main Portfolio Stats */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Portfolio Value */}
        <div class="lg:col-span-2">
          <div class="mb-2">
            <h2 class={`text-lg font-semibold crypto-text-secondary`}>
              Total Portfolio Value
            </h2>
          </div>
          <div class="portfolio-value">
            <Show when={wallet.connectionStatus() === 'connected'} fallback="$0.00">
              ${formatCurrency(totalPortfolioValue())}
            </Show>
          </div>
          <div class={`portfolio-change ${portfolioChange().percentage >= 0 ? 'positive' : 'negative'}`}>
            <Show when={wallet.connectionStatus() === 'connected'}>
              <svg width="16" height="16" viewBox="0 0 16 16" class="fill-current">
                <Show when={portfolioChange().percentage >= 0} fallback={
                  <path d="M8 12l-4-4h8l-4 4z"/> // Down arrow
                }>
                  <path d="M8 4l4 4H4l4-4z"/> // Up arrow
                </Show>
              </svg>
              <span>
                ${formatCurrency(Math.abs(portfolioChange().value))} ({Math.abs(portfolioChange().percentage).toFixed(2)}%)
              </span>
              <span class={`text-sm ${props.isDark ? 'text-crypto-text-muted' : 'text-crypto-text-muted'}`}>
                24h
              </span>
            </Show>
          </div>
        </div>

      </div>


      {/* Wallet Status for Disconnected State */}
      <Show when={wallet.connectionStatus() !== 'connected'}>
        <div class="text-center py-8">
          <div class="w-16 h-16 mx-auto mb-4 bg-crypto-border rounded-full flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" class="fill-current text-crypto-text-muted">
              <path d="M4 8v16h24V8H4zm2 2h20v12H6V10zm2 2v2h2v-2H8zm4 0v2h8v-2h-8z"/>
            </svg>
          </div>
          <h3 class={`crypto-heading-3 mb-2 crypto-text-primary`}>
            Connect Your Wallet
          </h3>
          <p class={`crypto-text-large max-w-md mx-auto crypto-text-secondary`}>
            Connect your Solana wallet to view your portfolio and start trading SPLITDO tokens.
          </p>
        </div>
      </Show>
    </div>
  );
};

export default PortfolioOverview;
