import { NetworkConfig } from './network.types';

export const ETH_CHAIN_ICON = require('../../../assets/images/eth.svg');
export const BNB_CHAIN_ICON = require('../../../assets/images/bnb.svg');
export const POL_CHAIN_ICON = require('../../../assets/images/pol.svg');

/**
 * Resolves the appropriate local SVG chain icon for a network, chainId, or symbol.
 */
export function getChainIconSource(
  target: NetworkConfig | number | string | null | undefined
): any | null {
  if (target === null || target === undefined) return null;

  let chainId: number | undefined;
  let symbol: string | undefined;

  if (typeof target === 'number') {
    chainId = target;
  } else if (typeof target === 'string') {
    symbol = target.toUpperCase().trim();
  } else {
    chainId = target.chainId;
    symbol = target.nativeCurrency?.symbol?.toUpperCase().trim();
  }

  // 1. Match by Chain ID
  if (
    chainId === 1 ||
    chainId === 11155111 ||
    chainId === 8453 ||
    chainId === 42161 ||
    chainId === 10
  ) {
    return ETH_CHAIN_ICON;
  }
  if (chainId === 56 || chainId === 97) {
    return BNB_CHAIN_ICON;
  }
  if (chainId === 137 || chainId === 80002) {
    return POL_CHAIN_ICON;
  }

  // 2. Match by native currency symbol
  if (symbol === 'ETH' || symbol === 'WETH') {
    return ETH_CHAIN_ICON;
  }
  if (symbol === 'BNB' || symbol === 'WBNB') {
    return BNB_CHAIN_ICON;
  }
  if (symbol === 'POL' || symbol === 'MATIC') {
    return POL_CHAIN_ICON;
  }

  return null;
}
