import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  unlockVault,
  unlockImportedAccountKey,
  createVault,
  storeImportedAccountKey,
  DK_SECURE_STORE_KEY,
} from '../../src/wallet/vault/vault.service';
import { appStorage, APP_STORAGE_KEYS } from '../../src/storage/app-storage';
import { secureStorage } from '../../src/security/secure-storage';
import { isSafeHttpUrl } from '../../src/blockchain/networks/network.service';
import { isValidWalletConnectUri } from '../../src/blockchain/walletconnect/walletconnect.service';
import { copySensitiveText, copyPublicText, clearSensitiveClipboardTimer } from '../../src/security/clipboard.utils';
import * as Clipboard from 'expo-clipboard';

// Mock in-memory storage
const memoryStore = new Map<string, string>();
jest.mock('../../src/storage/app-storage', () => ({
  appStorage: {
    setItem: jest.fn(async (k: string, v: string) => {
      memoryStore.set(k, v);
    }),
    getItem: jest.fn(async (k: string) => memoryStore.get(k) || null),
    deleteItem: jest.fn(async (k: string) => {
      memoryStore.delete(k);
    }),
  },
  APP_STORAGE_KEYS: {
    WALLET_VAULT: 'AXT_WALLET_VAULT_PAYLOAD_V1',
    WALLET_METADATA: 'AXT_WALLET_PUBLIC_METADATA_V1',
    IMPORTED_VAULT_PREFIX: 'AXT_IMPORTED_KEY_VAULT_',
  },
}));

const secureMemoryStore = new Map<string, string>();
jest.mock('../../src/security/secure-storage', () => ({
  secureStorage: {
    setItem: jest.fn(async (k: string, v: string) => {
      secureMemoryStore.set(k, v);
    }),
    getItem: jest.fn(async (k: string) => secureMemoryStore.get(k) || null),
    deleteItem: jest.fn(async (k: string) => {
      secureMemoryStore.delete(k);
    }),
  },
}));

describe('Security Hardening & Invariants (Phase 13)', () => {
  const TEST_PIN = '123456';
  const TEST_MNEMONIC =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const TEST_PRIVATE_KEY =
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

  beforeEach(() => {
    memoryStore.clear();
    secureMemoryStore.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    clearSensitiveClipboardTimer();
  });

  describe('1. Vault Tampering & Corruption Resilience', () => {
    it('fails safely when vault JSON is malformed without crashing', async () => {
      await secureStorage.setItem(DK_SECURE_STORE_KEY, 'dGVzdERldmljZUtleTEyMzQ1Njc4OTAxMjM0NTY=');
      await appStorage.setItem(APP_STORAGE_KEYS.WALLET_VAULT, '{ corrupted json payload ...');

      await expect(unlockVault(TEST_PIN)).rejects.toThrow('Corrupted vault payload');
    });

    it('fails safely when vault payload is missing required cryptographic parameters', async () => {
      await secureStorage.setItem(DK_SECURE_STORE_KEY, 'dGVzdERldmljZUtleTEyMzQ1Njc4OTAxMjM0NTY=');
      // Incomplete payload missing ciphertext and tag
      const incompletePayload = {
        version: 1,
        kdf: { algorithm: 'PBKDF2-HMAC-SHA256', salt: 'c2FsdA==', iterations: 10000 },
        encryption: { algorithm: 'AES-256-GCM', nonce: 'bm9uY2U=' },
      };
      await appStorage.setItem(APP_STORAGE_KEYS.WALLET_VAULT, JSON.stringify(incompletePayload));

      await expect(unlockVault(TEST_PIN)).rejects.toThrow('Corrupted vault payload');
    });

    it('fails safely when imported account vault payload is corrupted', async () => {
      await secureStorage.setItem(DK_SECURE_STORE_KEY, 'dGVzdERldmljZUtleTEyMzQ1Njc4OTAxMjM0NTY=');
      const accountId = 'imported-account-test-1';
      await appStorage.setItem(
        `${APP_STORAGE_KEYS.IMPORTED_VAULT_PREFIX}${accountId}`,
        JSON.stringify({ bad: 'data' })
      );

      await expect(unlockImportedAccountKey(accountId, TEST_PIN)).rejects.toThrow(
        'Corrupted imported vault payload'
      );
    });

    it('fails safely when device key in secure enclave is missing', async () => {
      // Vault exists in appStorage but secureStorage is empty
      await appStorage.setItem(
        APP_STORAGE_KEYS.WALLET_VAULT,
        JSON.stringify({ version: 1, kdf: {}, encryption: {} })
      );

      await expect(unlockVault(TEST_PIN)).rejects.toThrow('Device Key missing');
    });

    it('successfully encrypts and decrypts valid vault with correct PIN', async () => {
      await createVault(TEST_MNEMONIC, TEST_PIN);
      const unlocked = await unlockVault(TEST_PIN);
      expect(unlocked).toBe(TEST_MNEMONIC);
    });

    it('successfully encrypts and decrypts imported private key with correct PIN', async () => {
      await createVault(TEST_MNEMONIC, TEST_PIN);
      const accountId = 'imported-acc-99';
      await storeImportedAccountKey(accountId, TEST_PRIVATE_KEY, TEST_PIN);

      const unlockedKey = await unlockImportedAccountKey(accountId, TEST_PIN);
      expect(unlockedKey).toBe(TEST_PRIVATE_KEY);
    });
  });

  describe('2. Network & RPC URL Protocol Security', () => {
    it('accepts valid HTTP and HTTPS URLs', () => {
      expect(isSafeHttpUrl('https://eth.llamarpc.com')).toBe(true);
      expect(isSafeHttpUrl('https://mainnet.infura.io/v3/key')).toBe(true);
      expect(isSafeHttpUrl('http://127.0.0.1:8545')).toBe(true);
      expect(isSafeHttpUrl('http://localhost:8545')).toBe(true);
    });

    it('rejects dangerous protocols', () => {
      expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeHttpUrl('file:///etc/passwd')).toBe(false);
      expect(isSafeHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isSafeHttpUrl('blob:https://example.com/uuid')).toBe(false);
      expect(isSafeHttpUrl('ftp://ftp.example.com')).toBe(false);
    });

    it('rejects empty, invalid, or malformed strings', () => {
      expect(isSafeHttpUrl('')).toBe(false);
      expect(isSafeHttpUrl('not-a-url')).toBe(false);
      expect(isSafeHttpUrl('://bad.url')).toBe(false);
    });
  });

  describe('3. WalletConnect URI Validation', () => {
    it('accepts valid WalletConnect v2 URIs regardless of parameter ordering', () => {
      const uri1 =
        'wc:7f6e504e63e16221ecdaac9f3170ea89@2?relay-protocol=irn&symKey=587d5484ce9170ac2303a165de1258d4b0a80f303334aaf';
      expect(isValidWalletConnectUri(uri1)).toBe(true);

      // Reversed parameter ordering
      const uri2 =
        'wc:7f6e504e63e16221ecdaac9f3170ea89@2?symKey=587d5484ce9170ac2303a165de1258d4b0a80f303334aaf&relay-protocol=irn';
      expect(isValidWalletConnectUri(uri2)).toBe(true);

      // With extra parameters
      const uri3 =
        'wc:topic12345678@2?expiryTimestamp=1700000000&relay-protocol=irn&symKey=abcdef0123456789abcdef0123456789&methods=eth_sendTransaction';
      expect(isValidWalletConnectUri(uri3)).toBe(true);
    });

    it('rejects malformed, v1, or incomplete WalletConnect URIs', () => {
      expect(isValidWalletConnectUri('https://example.com')).toBe(false);
      // v1 URI
      expect(isValidWalletConnectUri('wc:topic@1?bridge=...&key=...')).toBe(false);
      // Missing symKey
      expect(isValidWalletConnectUri('wc:topic12345678@2?relay-protocol=irn')).toBe(false);
      // Missing relay protocol
      expect(isValidWalletConnectUri('wc:topic12345678@2?symKey=1234567890abcdef1234567890abcdef')).toBe(
        false
      );
      // Empty or invalid string
      expect(isValidWalletConnectUri('')).toBe(false);
    });
  });

  describe('4. Selective Clipboard Security', () => {
    it('sets sensitive clipboard text', async () => {
      await copySensitiveText(TEST_PRIVATE_KEY, 60);
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith(TEST_PRIVATE_KEY);
    });

    it('copies public text without auto-clear overhead', async () => {
      const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      await copyPublicText(address);
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith(address);
    });
  });
});
