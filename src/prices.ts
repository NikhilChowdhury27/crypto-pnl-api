// In-memory cache for latest prices (fetched once at startup)
const LATEST_PRICES: Record<string, number> = {};

// Mapping of symbols to CoinGecko IDs
const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  USDT: 'tether',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  AVAX: 'avalanche-2',
  DOT: 'polkadot'
};

export async function fetchLatestPrices(): Promise<void> {
  try {
    const ids = Object.values(SYMBOL_TO_COINGECKO_ID).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to fetch prices from CoinGecko, using fallback prices');
      setFallbackPrices();
      return;
    }

    const data = await response.json();

    // Map CoinGecko IDs back to symbols
    for (const [symbol, coinId] of Object.entries(SYMBOL_TO_COINGECKO_ID)) {
      if (data[coinId] && data[coinId].usd) {
        LATEST_PRICES[symbol] = data[coinId].usd;
      }
    }

    console.log('✓ Fetched latest prices:', LATEST_PRICES);
  } catch (error) {
    console.error('Error fetching prices, using fallback:', error);
    setFallbackPrices();
  }
}

function setFallbackPrices(): void {
  LATEST_PRICES.BTC = 40000;
  LATEST_PRICES.ETH = 2000;
  LATEST_PRICES.SOL = 100;
  console.log('Using fallback prices:', LATEST_PRICES);
}

export function getLatestPrice(symbol: string): number | null {
  return Object.prototype.hasOwnProperty.call(LATEST_PRICES, symbol)
    ? LATEST_PRICES[symbol]
    : null;
}

// Test-only helper to set prices manually
export function setPrice(symbol: string, price: number): void {
  LATEST_PRICES[symbol] = price;
}



