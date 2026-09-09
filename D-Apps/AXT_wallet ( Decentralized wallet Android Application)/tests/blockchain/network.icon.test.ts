import { describe, it, expect } from '@jest/globals';
import {
  getChainIconSource,
  ETH_CHAIN_ICON,
  BNB_CHAIN_ICON,
  POL_CHAIN_ICON,
} from '../../src/blockchain/networks/network.icon';
import { NetworkConfig } from '../../src/blockchain/networks/network.types';

describe('Network Chain Icon Resolution', () => {
  it('resolves ETH icon for Ethereum and Sepolia', () => {
    const mainnet: NetworkConfig = {
      chainId: 1,
      name: 'Ethereum Mainnet',
      shortName: 'Ethereum',
      rpcUrl: 'https://eth.llamarpc.com',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      isTestnet: false,
    };
    expect(getChainIconSource(mainnet)).toBe(ETH_CHAIN_ICON);
    expect(getChainIconSource(1)).toBe(ETH_CHAIN_ICON);
    expect(getChainIconSource(11155111)).toBe(ETH_CHAIN_ICON);
    expect(getChainIconSource('ETH')).toBe(ETH_CHAIN_ICON);
  });

  it('resolves BNB icon for BSC and BSC Testnet', () => {
    const bsc: NetworkConfig = {
      chainId: 56,
      name: 'BNB Smart Chain',
      shortName: 'BSC',
      rpcUrl: 'https://bsc-dataseed.binance.org',
      nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
      isTestnet: false,
    };
    expect(getChainIconSource(bsc)).toBe(BNB_CHAIN_ICON);
    expect(getChainIconSource(56)).toBe(BNB_CHAIN_ICON);
    expect(getChainIconSource(97)).toBe(BNB_CHAIN_ICON);
    expect(getChainIconSource('BNB')).toBe(BNB_CHAIN_ICON);
  });

  it('resolves POL icon for Polygon and Polygon Amoy', () => {
    const polygon: NetworkConfig = {
      chainId: 137,
      name: 'Polygon Mainnet',
      shortName: 'Polygon',
      rpcUrl: 'https://polygon-rpc.com',
      nativeCurrency: { name: 'Polygon Ecosystem Token', symbol: 'POL', decimals: 18 },
      isTestnet: false,
    };
    expect(getChainIconSource(polygon)).toBe(POL_CHAIN_ICON);
    expect(getChainIconSource(137)).toBe(POL_CHAIN_ICON);
    expect(getChainIconSource(80002)).toBe(POL_CHAIN_ICON);
    expect(getChainIconSource('POL')).toBe(POL_CHAIN_ICON);
    expect(getChainIconSource('MATIC')).toBe(POL_CHAIN_ICON);
  });

  it('returns null for unknown chain ID without matching symbol', () => {
    expect(getChainIconSource(999999)).toBeNull();
    expect(getChainIconSource(null)).toBeNull();
  });
});
