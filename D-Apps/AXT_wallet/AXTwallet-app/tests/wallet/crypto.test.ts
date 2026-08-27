import { describe, it, expect } from '@jest/globals';
import { generateMnemonic, validateMnemonic } from '../../src/wallet/crypto/mnemonic';
import { deriveEVMAddress, DEFAULT_DERIVATION_PATH } from '../../src/wallet/crypto/derivation';

describe('Wallet Cryptography - Mnemonic', () => {
  it('generates a valid 12-word mnemonic', () => {
    const mnemonic = generateMnemonic();
    expect(typeof mnemonic).toBe('string');
    expect(mnemonic.split(' ').length).toBe(12);
    expect(validateMnemonic(mnemonic)).toBe(true);
  });

  it('generates unique mnemonics', () => {
    const mnemonic1 = generateMnemonic();
    const mnemonic2 = generateMnemonic();
    expect(mnemonic1).not.toBe(mnemonic2);
  });

  it('validates correctly', () => {
    // Valid test fixture
    const validPhrase = "test test test test test test test test test test test junk";
    expect(validateMnemonic(validPhrase)).toBe(true);

    // Invalid checksum
    const invalidPhrase = "test test test test test test test test test test test test";
    expect(validateMnemonic(invalidPhrase)).toBe(false);

    // Invalid word
    expect(validateMnemonic("notaword test test test test test test test test test test junk")).toBe(false);
  });
});

describe('Wallet Cryptography - Derivation', () => {
  // This is a well-known test mnemonic. DO NOT USE FOR REAL FUNDS.
  const TEST_MNEMONIC = "test test test test test test test test test test test junk";
  // The expected address for the test mnemonic at m/44'/60'/0'/0/0
  const EXPECTED_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  it('derives the correct address deterministically', () => {
    const result = deriveEVMAddress(TEST_MNEMONIC);
    expect(result.address).toBe(EXPECTED_ADDRESS);
    expect(result.derivationPath).toBe(DEFAULT_DERIVATION_PATH);
  });

  it('derives a different address for a different path', () => {
    const customPath = "m/44'/60'/0'/0/1";
    const result = deriveEVMAddress(TEST_MNEMONIC, customPath);
    expect(result.address).not.toBe(EXPECTED_ADDRESS);
    expect(result.derivationPath).toBe(customPath);
  });

  it('derives a different address for a different mnemonic', () => {
    const newMnemonic = generateMnemonic();
    const result = deriveEVMAddress(newMnemonic);
    expect(result.address).not.toBe(EXPECTED_ADDRESS);
  });
});
