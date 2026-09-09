import { describe, it, expect } from '@jest/globals';
import { resolveTokenLogoUrl } from '../../src/blockchain/tokens/token.logo';
import { TokenConfig } from '../../src/blockchain/tokens/token.types';

describe('Token Logo Resolution', () => {
  it('resolves logo for well-known native and ERC-20 symbols', () => {
    expect(resolveTokenLogoUrl('ETH')).toContain('trustwallet');
    expect(resolveTokenLogoUrl('USDC')).toContain('trustwallet');
    expect(resolveTokenLogoUrl('USDT')).toContain('trustwallet');
    expect(resolveTokenLogoUrl('DAI')).toContain('trustwallet');
    expect(resolveTokenLogoUrl('LINK')).toContain('trustwallet');
    expect(resolveTokenLogoUrl('MATIC')).toContain('trustwallet');
  });

  it('resolves custom HTTP logoUrl when provided in TokenConfig', () => {
    const customToken: TokenConfig = {
      chainId: 1,
      contractAddress: '0x1111111111111111111111111111111111111111',
      name: 'Custom Coin',
      symbol: 'CUSTOM',
      decimals: 18,
      logoUrl: 'https://example.com/custom-logo.png',
    };
    expect(resolveTokenLogoUrl(customToken)).toBe('https://example.com/custom-logo.png');
  });

  it('resolves IPFS logoUrl through IPFS gateways', () => {
    const ipfsToken: TokenConfig = {
      chainId: 1,
      contractAddress: '0x2222222222222222222222222222222222222222',
      name: 'IPFS Coin',
      symbol: 'IPFS',
      decimals: 18,
      logoUrl: 'ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/logo.png',
    };
    const resolved = resolveTokenLogoUrl(ipfsToken);
    expect(resolved).toContain('https://ipfs.io/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/logo.png');
  });

  it('returns null for unknown token without logoUrl', () => {
    const unknownToken: TokenConfig = {
      chainId: 1,
      contractAddress: '0x3333333333333333333333333333333333333333',
      name: 'Unknown Token',
      symbol: 'UNKNOWNXYZ',
      decimals: 18,
    };
    expect(resolveTokenLogoUrl(unknownToken)).toBeNull();
  });

  it('returns null for undefined or empty input', () => {
    expect(resolveTokenLogoUrl(null)).toBeNull();
    expect(resolveTokenLogoUrl(undefined)).toBeNull();
  });
});
