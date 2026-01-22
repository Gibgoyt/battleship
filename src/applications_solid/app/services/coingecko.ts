/**
 * CoinGecko API Service
 * Fetches live cryptocurrency prices in different fiat currencies
 */

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

export interface CryptoPrices {
  [crypto: string]: {
    [fiat: string]: number;
  };
}

// Map of common crypto symbols to CoinGecko IDs
const CRYPTO_ID_MAP: Record<string, string> = {
  SOL: 'solana',
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDC: 'usd-coin',
  USDT: 'tether',
  SPLITDO: 'splitdo', // Placeholder - replace with actual token ID when available
};

// Convert currency code to lowercase for CoinGecko API
const normalizeCurrency = (currency: string): string => currency.toLowerCase();

/**
 * Fetch prices for multiple cryptocurrencies in a specific fiat currency
 * @param cryptoSymbols Array of crypto symbols (e.g., ['SOL', 'BTC', 'ETH'])
 * @param fiatCurrency Fiat currency code (e.g., 'USD', 'EUR')
 * @returns Object mapping crypto symbols to their prices in the fiat currency
 */
export async function fetchCryptoPrices(
  cryptoSymbols: string[],
  fiatCurrency: string = 'USD'
): Promise<Record<string, number>> {
  try {
    // Convert crypto symbols to CoinGecko IDs
    const ids = cryptoSymbols
      .map((symbol) => CRYPTO_ID_MAP[symbol.toUpperCase()])
      .filter(Boolean)
      .join(',');

    if (!ids) {
      console.warn('No valid crypto symbols provided');
      return {};
    }

    const currency = normalizeCurrency(fiatCurrency);
    const url = `${COINGECKO_API_BASE}/simple/price?ids=${ids}&vs_currencies=${currency}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Convert CoinGecko IDs back to crypto symbols
    const prices: Record<string, number> = {};
    for (const [symbol, coinGeckoId] of Object.entries(CRYPTO_ID_MAP)) {
      if (data[coinGeckoId] && data[coinGeckoId][currency]) {
        prices[symbol] = data[coinGeckoId][currency];
      }
    }

    return prices;
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error);
    return {};
  }
}

/**
 * Fetch a single crypto price in a specific fiat currency
 * @param cryptoSymbol Crypto symbol (e.g., 'SOL', 'BTC')
 * @param fiatCurrency Fiat currency code (e.g., 'USD', 'EUR')
 * @returns The price as a number, or null if unavailable
 */
export async function fetchSingleCryptoPrice(
  cryptoSymbol: string,
  fiatCurrency: string = 'USD'
): Promise<number | null> {
  const prices = await fetchCryptoPrices([cryptoSymbol], fiatCurrency);
  return prices[cryptoSymbol.toUpperCase()] || null;
}

/**
 * Convert crypto amount to fiat value
 * @param cryptoAmount Amount of cryptocurrency
 * @param cryptoSymbol Crypto symbol (e.g., 'SOL')
 * @param fiatCurrency Fiat currency code (e.g., 'USD')
 * @returns The fiat value, or null if price unavailable
 */
export async function convertCryptoToFiat(
  cryptoAmount: number,
  cryptoSymbol: string,
  fiatCurrency: string = 'USD'
): Promise<number | null> {
  const price = await fetchSingleCryptoPrice(cryptoSymbol, fiatCurrency);
  if (price === null) return null;
  return cryptoAmount * price;
}

/**
 * Batch fetch prices for multiple cryptos in multiple fiat currencies
 * Useful for pre-loading prices for currency switching
 * @param cryptoSymbols Array of crypto symbols
 * @param fiatCurrencies Array of fiat currency codes
 * @returns Nested object of prices
 */
export async function fetchMultiCurrencyPrices(
  cryptoSymbols: string[],
  fiatCurrencies: string[]
): Promise<CryptoPrices> {
  const prices: CryptoPrices = {};

  await Promise.all(
    fiatCurrencies.map(async (fiat) => {
      const cryptoPrices = await fetchCryptoPrices(cryptoSymbols, fiat);
      for (const [crypto, price] of Object.entries(cryptoPrices)) {
        if (!prices[crypto]) {
          prices[crypto] = {};
        }
        prices[crypto][fiat] = price;
      }
    })
  );

  return prices;
}
