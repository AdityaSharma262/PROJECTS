import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createVault, unlockVault, deleteVault, DK_SECURE_STORE_KEY, CURRENT_PBKDF2_ITERATIONS } from '../../src/wallet/vault/vault.service';
import { secureStorage } from '../../src/security/secure-storage';
import { appStorage, APP_STORAGE_KEYS } from '../../src/storage/app-storage';

// Mock the storage layer to run tests entirely in memory
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
  APP_STORAGE_KEYS: { WALLET_VAULT: 'TEST_VAULT' }
}));

// We override iterations to a low number for tests to run instantly
jest.mock('../../src/wallet/vault/vault.service', () => {
  const original = jest.requireActual<any>('../../src/wallet/vault/vault.service');
  return {
    ...original,
    CURRENT_PBKDF2_ITERATIONS: 100 // VERY LOW FOR TESTS
  };
});

describe('Vault Service', () => {
  const TEST_MNEMONIC = "test test test test test test test test test test test junk";
  const TEST_PIN = "123456";

  beforeEach(() => {
    secureStoreMap.clear();
    appStoreMap.clear();
  });

  it('creates and decrypts the vault successfully', async () => {
    await createVault(TEST_MNEMONIC, TEST_PIN);
    
    // Check that items are stored
    expect(secureStoreMap.has(DK_SECURE_STORE_KEY)).toBe(true);
    expect(appStoreMap.has('TEST_VAULT')).toBe(true);

    const decryptedMnemonic = await unlockVault(TEST_PIN);
    expect(decryptedMnemonic).toBe(TEST_MNEMONIC);
  });

  it('fails decryption with wrong PIN', async () => {
    await createVault(TEST_MNEMONIC, TEST_PIN);
    await expect(unlockVault("654321")).rejects.toThrow();
  });

  it('fails if DK is wiped (simulated reinstall / keystore clear)', async () => {
    await createVault(TEST_MNEMONIC, TEST_PIN);
    secureStoreMap.delete(DK_SECURE_STORE_KEY); // Wipe DK
    
    await expect(unlockVault(TEST_PIN)).rejects.toThrow("Device Key missing");
  });

  it('deletes the vault completely', async () => {
    await createVault(TEST_MNEMONIC, TEST_PIN);
    await deleteVault();
    
    expect(secureStoreMap.has(DK_SECURE_STORE_KEY)).toBe(false);
    expect(appStoreMap.has('TEST_VAULT')).toBe(false);
  });
});
