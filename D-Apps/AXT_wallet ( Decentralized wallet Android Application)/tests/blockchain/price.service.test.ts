import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PriceService } from '../../src/blockchain/prices/price.service';
import {
  ETHEREUM,
  BASE,
  BSC,
  POLYGON,
  OPTIMISM,
  ARBITRUM,
  SEPOLIA,
  BSC_TESTNET,
} from '../../src/blockchain/networks/networks';
import { NetworkConfig } from '../../src/blockchain/networks/network.types';

describe('PriceService — CoinGecko Live Price & Caching', () => {
  let priceService: PriceService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    priceService = new PriceService();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('getCoinGeckoId', () => {
    it('returns correct CoinGecko ID for default mainnets', () => {
      expect(priceService.getCoinGeckoId(ETHEREUM)).toBe('ethereum');
      expect(priceService.getCoinGeckoId(BASE)).toBe('ethereum');
      expect(priceService.getCoinGeckoId(BSC)).toBe('binancecoin');
      expect(priceService.getCoinGeckoId(POLYGON)).toBe('matic-network');
      expect(priceService.getCoinGeckoId(OPTIMISM)).toBe('ethereum');
      expect(priceService.getCoinGeckoId(ARBITRUM)).toBe('ethereum');
    });

    it('returns null for testnets', () => {
      expect(priceService.getCoinGeckoId(SEPOLIA)).toBeNull();
      expect(priceService.getCoinGeckoId(BSC_TESTNET)).toBeNull();
    });

    it('returns null for unrecognized custom network', () => {
      const customNet: NetworkConfig = {
        chainId: 9999,
        name: 'Custom Chain',
        shortName: 'CUST',
        nativeCurrency: { name: 'Token', symbol: 'UNKNOWN', decimals: 18 },
        rpcUrl: 'https://custom-rpc.com',
        isTestnet: false,
      };
      expect(priceService.getCoinGeckoId(customNet)).toBeNull();
    });
  });

  describe('formatUsdPrice', () => {
    it('formats prices >= 1 with 2 decimal places and commas', () => {
      expect(priceService.formatUsdPrice(4250.32)).toBe('$4,250.32');
      expect(priceService.formatUsdPrice(610.5)).toBe('$610.50');
      expect(priceService.formatUsdPrice(1)).toBe('$1.00');
    });

    it('formats prices < 1 with up to 4 decimal places', () => {
      expect(priceService.formatUsdPrice(0.4521)).toBe('$0.4521');
    });
  });

  describe('fetchPriceUsd & caching', () => {
    it('fetches price from CoinGecko API and caches the result', async () => {
      const mockResponse = {
        ethereum: { usd: 3450.75 },
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockResponse,
        } as Response)
      );

      const price1 = await priceService.fetchPriceUsd('ethereum');
      expect(price1).toBe(3450.75);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call should hit the cache without calling fetch again
      const price2 = await priceService.fetchPriceUsd('ethereum');
      expect(price2).toBe(3450.75);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('handles API errors gracefully without throwing', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network offline')));

      const price = await priceService.fetchPriceUsd('ethereum');
      expect(price).toBeNull();
    });
  });

  describe('getNativeTokenPrice', () => {
    it('returns testnet indicator for testnets without making network calls', async () => {
      global.fetch = jest.fn() as any;

      const result = await priceService.getNativeTokenPrice(SEPOLIA);

      expect(result.isTestnet).toBe(true);
      expect(result.priceUsd).toBeNull();
      expect(result.formattedPrice).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns formatted live price for mainnets', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ ethereum: { usd: 4250.32 } }),
        } as Response)
      );

      const result = await priceService.getNativeTokenPrice(ETHEREUM);

      expect(result.isTestnet).toBe(false);
      expect(result.priceUsd).toBe(4250.32);
      expect(result.formattedPrice).toBe('$4,250.32');
    });
  });
});
