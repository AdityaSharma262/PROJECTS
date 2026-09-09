import { TokenConfig } from './token.types';

/**
 * Pre-configured default/known ERC-20 tokens.
 * By default, no tokens are displayed until explicitly imported by the user.
 */
export const DEFAULT_TOKENS_BY_CHAIN: Record<number, TokenConfig[]> = {
  // Empty by default — only user-imported tokens are displayed
  11155111: [],
  97: [],
};

/**
 * Returns default configured tokens for a specific chain.
 */
export function getDefaultTokensForChain(chainId: number): TokenConfig[] {
  return DEFAULT_TOKENS_BY_CHAIN[chainId] || [];
}
