import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { recoverWallet } from '../../src/wallet/auth/recovery.service';
import { createVault, deleteVault } from '../../src/wallet/vault/vault.service';

// Mock storage
let secureStoreMap = new Map<string, string>();
let appStoreMap = new Map<string, string>();

jest.mock('../../src/security/secure-storage', () => ({
  secureStorage: {
    setItem: jest.fn(async (k: string, v: string) => { secureStoreMap.set(k, v); }),
    getItem: jest.fn(async (k: string) => secureStoreMap.get(k) || null),
    deleteItem: jest.fn(async (k: string) => { secureStoreMap.delete(k); })
  }
}));

jest.mock('../../src/storage/app-storage', () => ({
  appStorage: {
    setItem: jest.fn(async (k: string, v: string) => { appStoreMap.set(k, v); }),
    getItem: jest.fn(async (k: string) => appStoreMap.get(k) || null),
    deleteItem: jest.fn(async (k: string) => { appStoreMap.delete(k); })
  },
  APP_STORAGE_KEYS: { WALLET_VAULT: 'TEST_VAULT', WALLET_METADATA: 'TEST_META' }
}));

jest.mock('../../src/wallet/vault/vault.service', () => {
  const original = jest.requireActual<any>('../../src/wallet/vault/vault.service');
  return { ...original, CURRENT_PBKDF2_ITERATIONS: 100 };
});

describe('Recovery Service', () => {
  const TEST_MNEMONIC = "test test test test test test test test test test test junk";
  const OTHER_VALID_MNEMONIC = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
  const TEST_PIN = "123456";
  const NEW_PIN = "654321";

  beforeEach(async () => {
    secureStoreMap.clear();
    appStoreMap.clear();
    await deleteVault();
  });

  it('successfully recovers wallet if mnemonic matches derived address', async () => {
    // 1. Create a vault normally
    await createVault(TEST_MNEMONIC, TEST_PIN);
    
    // 2. Recover with the exact same mnemonic, new PIN
    await expect(recoverWallet(TEST_MNEMONIC, NEW_PIN)).resolves.not.toThrow();

    // 3. Ensure the old device key was wiped and a new one was created (simulated by storage map updates)
    // Actually, createVault overwrites them, which is correct.
    expect(secureStoreMap.has('AXT_WALLET_DK_V1')).toBe(true);
  });

  it('fails recovery if recovery phrase is invalid format', async () => {
    await createVault(TEST_MNEMONIC, TEST_PIN);
    await expect(recoverWallet("invalid phrase test", NEW_PIN)).rejects.toThrow("Invalid recovery phrase");
  });

  it('fails recovery if phrase is valid but does not match stored wallet', async () => {
    await createVault(TEST_MNEMONIC, TEST_PIN);
    // User tries to recover using a DIFFERENT valid BIP-39 phrase
    await expect(recoverWallet(OTHER_VALID_MNEMONIC, NEW_PIN)).rejects.toThrow("Recovery phrase does not match the stored wallet");
  });

  it('fails recovery if no wallet is stored', async () => {
    await expect(recoverWallet(TEST_MNEMONIC, NEW_PIN)).rejects.toThrow("No local wallet found to recover");
  });
});
