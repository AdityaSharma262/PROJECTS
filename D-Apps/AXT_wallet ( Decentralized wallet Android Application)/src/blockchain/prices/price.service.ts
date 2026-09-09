import { NetworkConfig } from '../networks/network.types';
import { TokenConfig } from '../tokens/token.types';
import { TokenPriceInfo } from './price.types';

export const COINGECKO_DEMO_API_KEY = 'CG-FBwMYfwRG2864QU8pc7y4U1L';
export const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

const CACHE_TTL_MS = 60 * 1000; // 60 seconds

interface CacheEntry {
  priceUsd: number;
  timestamp: number;
}

export class PriceService {
  private cache = new Map<string, CacheEntry>();

  /**
   * Resolves the CoinGecko asset ID from the NetworkConfig.
   * Returns null for testnets or unrecognized custom networks.
   */
  getCoinGeckoId(network: NetworkConfig): string | null {
    if (network.isTestnet) {
      return null;
    }

    const symbol = (network.nativeCurrency?.symbol || '').toUpperCase();
    const chainId = network.chainId;

    // Chain ID specific overrides
    if (chainId === 1 || chainId === 8453 || chainId === 10 || chainId === 42161) {
      return 'ethereum';
    }
    if (chainId === 56) {
      return 'binancecoin';
    }
    if (chainId === 137) {
      return 'matic-network';
    }

    // Symbol fallback
    switch (symbol) {
      case 'ETH':
        return 'ethereum';
      case 'BNB':
        return 'binancecoin';
      case 'POL':
      case 'MATIC':
        return 'matic-network';
      case 'AVAX':
        return 'avalanche-2';
      case 'FTM':
        return 'fantom';
      default:
        return null;
    }
  }

  /**
   * Maps common ERC-20 token symbols to CoinGecko asset IDs.
   */
  getTokenCoinGeckoId(token: TokenConfig): string | null {
    const sym = (token.symbol || '').toUpperCase().trim();
    switch (sym) {
      case 'USDC':
      case 'USDBC':
        return 'usd-coin';
      case 'USDT':
        return 'tether';
      case 'DAI':
        return 'dai';
      case 'WBTC':
        return 'wrapped-bitcoin';
      case 'BTC':
        return 'bitcoin';
      case 'ETH':
      case 'WETH':
        return 'ethereum';
      case 'LINK':
        return 'chainlink';
      case 'UNI':
        return 'uniswap';
      case 'AAVE':
        return 'aave';
      case 'SHIB':
        return 'shiba-inu';
      case 'PEPE':
        return 'pepe';
      case 'POL':
      case 'MATIC':
        return 'matic-network';
      case 'BNB':
      case 'WBNB':
        return 'binancecoin';
      case 'AVAX':
      case 'WAVAX':
        return 'avalanche-2';
      case 'FTM':
        return 'fantom';
      case 'ARB':
        return 'arbitrum';
      case 'OP':
        return 'optimism';
      case 'CRO':
        return 'crypto-com-chain';
      default:
        return null;
    }
  }

  /**
   * Returns CoinGecko platform identifier for contract-based price lookups.
   */
  getCoinGeckoPlatformId(chainId: number): string | null {
    switch (chainId) {
      case 1:
      case 11155111:
        return 'ethereum';
      case 56:
      case 97:
        return 'binance-smart-chain';
      case 137:
      case 80002:
        return 'polygon-pos';
      case 42161:
        return 'arbitrum-one';
      case 10:
        return 'optimistic-ethereum';
      case 8453:
        return 'base';
      case 43114:
        return 'avalanche';
      case 250:
        return 'fantom';
      default:
        return null;
    }
  }

  /**
   * Formats a raw numeric USD unit price into a user-friendly string.
   * e.g. 4250.32 -> "$4,250.32", 0.452 -> "$0.452"
   */
  formatUsdPrice(price: number): string {
    if (price >= 1) {
      return `$${price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `$${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })}`;
  }

  /**
   * Calculates total USD value for a given holding balance and unit price.
   */
  calculateHoldingUsdValue(
    formattedBalance: string,
    priceUsd: number | null
  ): number | null {
    if (priceUsd === null || priceUsd === undefined) {
      return null;
    }
    const cleanBalance = parseFloat(formattedBalance.replace(/,/g, ''));
    if (isNaN(cleanBalance) || cleanBalance < 0) {
      return null;
    }
    return cleanBalance * priceUsd;
  }

  /**
   * Formats a total holding USD value into a formatted string.
   * e.g. 1250.5 -> "$1,250.50", 0 -> "$0.00", 0.0004 -> "<$0.01", null -> "—"
   */
  formatUsdValue(value: number | null): string {
    if (value === null || value === undefined) {
      return '—';
    }
    if (value === 0) {
      return '$0.00';
    }
    if (value > 0 && value < 0.01) {
      return '<$0.01';
    }
    if (value >= 1) {
      return `$${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })}`;
  }

  /**
   * Fetches the current USD price for a specific CoinGecko asset ID with in-memory caching.
   * Gracefully fails without throwing.
   */
  async fetchPriceUsd(coingeckoId: string): Promise<number | null> {
    if (!coingeckoId) return null;

    const cached = this.cache.get(coingeckoId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.priceUsd;
    }

    let timeoutId: NodeJS.Timeout | undefined;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 6000);

      const url = `${COINGECKO_BASE_URL}/simple/price?vs_currencies=usd&ids=${coingeckoId}&x_cg_demo_api_key=${COINGECKO_DEMO_API_KEY}`;

      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) {
        return cached ? cached.priceUsd : null;
      }

      const data = await res.json();
      const price = data?.[coingeckoId]?.usd;

      if (typeof price === 'number') {
        this.cache.set(coingeckoId, { priceUsd: price, timestamp: Date.now() });
        return price;
      }

      return cached ? cached.priceUsd : null;
    } catch {
      // Graceful fallback to cached or null on network error / timeout
      return cached ? cached.priceUsd : null;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  /**
   * Fetches token price by contract address on a supported platform.
   */
  async fetchTokenPriceByContract(
    chainId: number,
    contractAddress: string
  ): Promise<number | null> {
    const platform = this.getCoinGeckoPlatformId(chainId);
    if (!platform || !contractAddress) return null;

    const cacheKey = `contract_${chainId}_${contractAddress.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.priceUsd;
    }

    let timeoutId: NodeJS.Timeout | undefined;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 6000);

      const url = `${COINGECKO_BASE_URL}/simple/token_price/${platform}?contract_addresses=${contractAddress.toLowerCase()}&vs_currencies=usd&x_cg_demo_api_key=${COINGECKO_DEMO_API_KEY}`;

      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        return cached ? cached.priceUsd : null;
      }

      const data = await res.json();
      const price = data?.[contractAddress.toLowerCase()]?.usd;

      if (typeof price === 'number') {
        this.cache.set(cacheKey, { priceUsd: price, timestamp: Date.now() });
        return price;
      }

      return cached ? cached.priceUsd : null;
    } catch {
      return cached ? cached.priceUsd : null;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  /**
   * Retrieves live USD price for an ERC-20 token using symbol mapping or contract address.
   */
  async getTokenPrice(
    token: TokenConfig,
    network: NetworkConfig
  ): Promise<number | null> {
    if (network.isTestnet) {
      return null;
    }

    // 1. Try known symbol mapping
    const coingeckoId = this.getTokenCoinGeckoId(token);
    if (coingeckoId) {
      const price = await this.fetchPriceUsd(coingeckoId);
      if (price !== null) return price;
    }

    // 2. Try contract address lookup on CoinGecko
    if (token.contractAddress) {
      const contractPrice = await this.fetchTokenPriceByContract(
        network.chainId,
        token.contractAddress
      );
      if (contractPrice !== null) return contractPrice;
    }

    return null;
  }

  /**
   * Retrieves live price info for the native token of the specified network.
   */
  async getNativeTokenPrice(network: NetworkConfig): Promise<TokenPriceInfo> {
    if (network.isTestnet) {
      return {
        priceUsd: null,
        formattedPrice: null,
        isTestnet: true,
        lastUpdated: Date.now(),
      };
    }

    const coingeckoId = this.getCoinGeckoId(network);
    if (!coingeckoId) {
      return {
        priceUsd: null,
        formattedPrice: null,
        isTestnet: false,
        lastUpdated: Date.now(),
      };
    }

    const price = await this.fetchPriceUsd(coingeckoId);

    return {
      priceUsd: price,
      formattedPrice: price !== null ? this.formatUsdPrice(price) : null,
      isTestnet: false,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Clears the in-memory price cache (e.g. for testing).
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const priceService = new PriceService();
