import { describe, it, expect, beforeEach } from '@jest/globals';
import { priceService } from '../../src/blockchain/prices/price.service';
import { generateQRCodeMatrix } from '../../src/utils/qr.utils';
import { TokenConfig } from '../../src/blockchain/tokens/token.types';
import { NetworkConfig } from '../../src/blockchain/networks/network.types';

describe('Holdings Pricing & QR Code Generation', () => {
  beforeEach(() => {
    priceService.clearCache();
  });

  describe('1. Holding USD Value Calculations', () => {
    it('calculates USD value for normal positive balance and unit price', () => {
      const result = priceService.calculateHoldingUsdValue('2.5', 3000);
      expect(result).toBe(7500);
    });

    it('handles zero balance correctly', () => {
      const result = priceService.calculateHoldingUsdValue('0', 3000);
      expect(result).toBe(0);
    });

    it('returns null when price is null (testnet or unpriced)', () => {
      const result = priceService.calculateHoldingUsdValue('10.5', null);
      expect(result).toBeNull();
    });

    it('handles formatted numbers with commas', () => {
      const result = priceService.calculateHoldingUsdValue('1,250.50', 2.0);
      expect(result).toBe(2501);
    });

    it('returns null for invalid balance strings', () => {
      const result = priceService.calculateHoldingUsdValue('invalid', 2000);
      expect(result).toBeNull();
    });
  });

  describe('2. USD Value Formatting', () => {
    it('formats null as em-dash', () => {
      expect(priceService.formatUsdValue(null)).toBe('—');
    });

    it('formats 0 as $0.00', () => {
      expect(priceService.formatUsdValue(0)).toBe('$0.00');
    });

    it('formats small sub-cent fractions as <$0.01', () => {
      expect(priceService.formatUsdValue(0.004)).toBe('<$0.01');
    });

    it('formats values >= $1 with 2 decimal places and commas', () => {
      expect(priceService.formatUsdValue(1250.5)).toBe('$1,250.50');
      expect(priceService.formatUsdValue(50000)).toBe('$50,000.00');
    });

    it('formats values between 0.01 and 1 with up to 4 decimal places', () => {
      expect(priceService.formatUsdValue(0.0456)).toBe('$0.0456');
    });
  });

  describe('3. Token Symbol to CoinGecko ID Mapping', () => {
    it('resolves well-known stablecoins and tokens', () => {
      const usdcToken: TokenConfig = {
        chainId: 1,
        contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
      };
      expect(priceService.getTokenCoinGeckoId(usdcToken)).toBe('usd-coin');

      const usdtToken: TokenConfig = {
        chainId: 1,
        contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
      };
      expect(priceService.getTokenCoinGeckoId(usdtToken)).toBe('tether');

      const linkToken: TokenConfig = {
        chainId: 1,
        contractAddress: '0x514910771af9ca656af840dff83e8264ecf986ca',
        name: 'Chainlink',
        symbol: 'LINK',
        decimals: 18,
      };
      expect(priceService.getTokenCoinGeckoId(linkToken)).toBe('chainlink');
    });

    it('returns null for unknown custom token symbols', () => {
      const customToken: TokenConfig = {
        chainId: 1,
        contractAddress: '0x1234567890123456789012345678901234567890',
        name: 'My Custom Token',
        symbol: 'MYTOKEN',
        decimals: 18,
      };
      expect(priceService.getTokenCoinGeckoId(customToken)).toBeNull();
    });

    it('returns null on testnets for native token price', async () => {
      const testnetConfig: NetworkConfig = {
        chainId: 11155111,
        name: 'Sepolia',
        shortName: 'Sepolia',
        rpcUrl: 'https://rpc.sepolia.org',
        nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
        isTestnet: true,
      };
      const info = await priceService.getNativeTokenPrice(testnetConfig);
      expect(info.isTestnet).toBe(true);
      expect(info.priceUsd).toBeNull();
      expect(info.formattedPrice).toBeNull();
    });
  });

  describe('4. Dynamic QR Code Matrix Generator', () => {
    const TEST_ADDRESS = '0x55E7C86978586326d9dB3E41A1a56396e953b2E9';

    it('generates a valid 2D boolean grid for an EVM address', () => {
      const matrix = generateQRCodeMatrix(TEST_ADDRESS);
      expect(Array.isArray(matrix)).toBe(true);
      expect(matrix.length).toBeGreaterThanOrEqual(21);
      expect(matrix[0].length).toBe(matrix.length); // Square
    });

    it('includes valid top-left, top-right, and bottom-left finder patterns', () => {
      const matrix = generateQRCodeMatrix(TEST_ADDRESS);
      const size = matrix.length;

      // Top-left center (3,3) must be true
      expect(matrix[3][3]).toBe(true);
      // Top-right center (3, size - 4) must be true
      expect(matrix[3][size - 4]).toBe(true);
      // Bottom-left center (size - 4, 3) must be true
      expect(matrix[size - 4][3]).toBe(true);
    });
  });
});
