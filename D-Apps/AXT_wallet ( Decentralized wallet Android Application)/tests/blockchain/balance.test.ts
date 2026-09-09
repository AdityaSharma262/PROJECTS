import { describe, it, expect } from '@jest/globals';
import { looksLikeEvmAddress, trimDecimals, formatWeiToEth } from '../../src/blockchain/balances/balance.utils';

/**
 * Balance utility tests — pure functions, no ESM dependencies.
 * Tests address validation, balance formatting, and precision safety.
 */
describe('looksLikeEvmAddress', () => {
  it('accepts a valid lowercase address', () => {
    expect(looksLikeEvmAddress('0x70997970c51812dc3a010c7d01b50e0d17dc79c8')).toBe(true);
  });

  it('accepts a valid checksummed address', () => {
    expect(looksLikeEvmAddress('0x70997970C51812dc3A010C7d01b50e0d17dc79C8')).toBe(true);
  });

  it('rejects an address that is too short', () => {
    expect(looksLikeEvmAddress('0x1234')).toBe(false);
  });

  it('rejects an address missing the 0x prefix', () => {
    expect(looksLikeEvmAddress('70997970C51812dc3A010C7d01b50e0d17dc79C8')).toBe(false);
  });

  it('rejects a plain string', () => {
    expect(looksLikeEvmAddress('not-an-address')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(looksLikeEvmAddress('')).toBe(false);
  });
});

describe('trimDecimals', () => {
  it('trims trailing zeros from a decimal string', () => {
    expect(trimDecimals('1.000000000000000000', 6)).toBe('1');
  });

  it('preserves significant decimal digits', () => {
    expect(trimDecimals('0.100000', 6)).toBe('0.1');
  });

  it('handles a string with no decimal point', () => {
    expect(trimDecimals('42')).toBe('42');
  });

  it('respects the maxDecimals parameter', () => {
    expect(trimDecimals('1.123456789', 4)).toBe('1.1234');
  });

  it('handles zero correctly', () => {
    expect(trimDecimals('0.0')).toBe('0');
  });
});

describe('formatWeiToEth', () => {
  it('formats 1 ETH (1e18 wei) correctly', () => {
    expect(formatWeiToEth(BigInt('1000000000000000000'))).toBe('1.0');
  });

  it('formats 0 wei as "0.0"', () => {
    expect(formatWeiToEth(BigInt('0'))).toBe('0.0');
  });

  it('formats 0.1 ETH without float precision loss', () => {
    expect(formatWeiToEth(BigInt('100000000000000000'))).toBe('0.1');
  });

  it('formats 0.5 ETH correctly', () => {
    expect(formatWeiToEth(BigInt('500000000000000000'))).toBe('0.5');
  });

  it('formats 1.5 ETH correctly', () => {
    expect(formatWeiToEth(BigInt('1500000000000000000'))).toBe('1.5');
  });

  it('formats a large balance correctly', () => {
    expect(formatWeiToEth(BigInt('100000000000000000000'))).toBe('100.0');
  });
});
