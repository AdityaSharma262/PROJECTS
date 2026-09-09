import { describe, it, expect } from '@jest/globals';
import {
  DEFAULT_TOKENS_BY_CHAIN,
  getDefaultTokensForChain,
} from '../../src/blockchain/tokens/token.registry';

describe('Token Registry', () => {
  const sepoliaChainId = 11155111;
  const bscTestnetChainId = 97;

  it('defaults to an empty token list so tokens only show when imported', () => {
    const sepoliaTokens = getDefaultTokensForChain(sepoliaChainId);
    const bscTokens = getDefaultTokensForChain(bscTestnetChainId);

    expect(sepoliaTokens).toEqual([]);
    expect(bscTokens).toEqual([]);
  });

  it('returns empty array for an unsupported chain ID', () => {
    const tokens = getDefaultTokensForChain(999999);
    expect(tokens).toEqual([]);
  });
});
