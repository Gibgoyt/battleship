import { createSignal, createEffect } from 'solid-js';

// Default currency
const DEFAULT_CURRENCY = 'USD';

// Get initial currency from localStorage or use default
const getInitialCurrency = (): string => {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY;

  try {
    const stored = localStorage.getItem('preferred-currency');
    return stored || DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
};

// Create global currency signal
const [currency, setCurrency] = createSignal<string>(getInitialCurrency());

// Save to localStorage whenever currency changes
if (typeof window !== 'undefined') {
  createEffect(() => {
    try {
      localStorage.setItem('preferred-currency', currency());
    } catch (error) {
      console.error('Failed to save currency preference:', error);
    }
  });
}

// Export currency store
export const useCurrency = () => ({
  currency,
  setCurrency,
});

// Helper to get currency symbol
export const getCurrencySymbol = (currencyCode: string): string => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    CNY: '¥',
  };
  return symbols[currencyCode] || currencyCode;
};

// Helper to format currency amount
export const formatCurrency = (amount: number, currencyCode: string): string => {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
