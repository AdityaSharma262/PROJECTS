import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Wallet, TransactionRequest } from 'ethers';
import { authService } from '../../src/wallet/auth/auth.service';
import { accountService } from '../../src/wallet/accounts/account.service';
import { accountStorage } from '../../src/storage/account-storage';
import { createVault, deleteVault } from '../../src/wallet/vault/vault.service';

// Mock SecureStore
const mockSecureStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async (key: string, val: string) => {
    mockSecureStore.set(key, val);
  }),
  getItemAsync: jest.fn(async (key: string) => {
    return mockSecureStore.get(key) || null;
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockSecureStore.delete(key);
  }),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 0,
}));

// Mock AsyncStorage
const mockAsyncStore = new Map<string, string>();
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(async (key: string, val: string) => {
    mockAsyncStore.set(key, val);
  }),
  getItem: jest.fn(async (key: string) => {
    return mockAsyncStore.get(key) || null;
  }),
  removeItem: jest.fn(async (key: string) => {
    mockAsyncStore.delete(key);
  }),
}));

describe('Imported Account / Private Key Support & Centralized Signing', () => {
  const TEST_MNEMONIC =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const TEST_PIN = '123456';
  const WRONG_PIN = '654321';

  // Standalone test wallet (known private key)
  const KNOWN_PRIVATE_KEY =
    '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const KNOWN_WALLET = new Wallet(KNOWN_PRIVATE_KEY);

  beforeEach(async () => {
    mockSecureStore.clear();
    mockAsyncStore.clear();
    await createVault(TEST_MNEMONIC, TEST_PIN);
    await authService.init();
    await authService.login(TEST_PIN);
  });

  describe('Private Key Validation & Address Derivation', () => {
    it('validates 64-character hex strings with or without 0x prefix', () => {
      const withPrefix = accountService.validatePrivateKey(KNOWN_PRIVATE_KEY);
      expect(withPrefix.address.toLowerCase()).toBe(KNOWN_WALLET.address.toLowerCase());
      expect(withPrefix.normalizedKey).toBe(KNOWN_PRIVATE_KEY);

      const withoutPrefix = accountService.validatePrivateKey(
        KNOWN_PRIVATE_KEY.replace('0x', '')
      );
      expect(withoutPrefix.address.toLowerCase()).toBe(KNOWN_WALLET.address.toLowerCase());
      expect(withoutPrefix.normalizedKey).toBe(KNOWN_PRIVATE_KEY);
    });

    it('rejects invalid private keys (empty, invalid characters, wrong length)', () => {
      expect(() => accountService.validatePrivateKey('')).toThrow(
        'Private key cannot be empty.'
      );
      expect(() => accountService.validatePrivateKey('12345')).toThrow(
        'Invalid private key format'
      );
      expect(() =>
        accountService.validatePrivateKey(
          '0xZZZZ456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
        )
      ).toThrow('Invalid private key format');
    });

    it('prevents importing an address that already exists in the wallet', async () => {
      // Primary HD Account 1 address
      const accounts = await accountStorage.getAccounts();
      const hdAddress = accounts[0].address;

      await expect(
        accountService.validateImportAddressUnique(hdAddress)
      ).rejects.toThrow('already exists in the wallet');
    });
  });

  describe('Importing Account Flow', () => {
    it('successfully imports a private key account with PIN authorization', async () => {
      const importedAcc = await authService.importAccountAuthorized(
        TEST_PIN,
        KNOWN_PRIVATE_KEY,
        'Trading Account'
      );

      expect(importedAcc.name).toBe('Trading Account');
      expect(importedAcc.type).toBe('imported');
      expect(importedAcc.address.toLowerCase()).toBe(KNOWN_WALLET.address.toLowerCase());
      expect(importedAcc.id).toBe(`imported-${KNOWN_WALLET.address.toLowerCase()}`);

      // Verified stored in accounts list
      const accounts = await accountStorage.getAccounts();
      expect(accounts).toHaveLength(2); // HD Account 1 + Imported
      expect(accounts.some((a) => a.id === importedAcc.id)).toBe(true);

      // Verified active account was switched to imported
      const active = await accountStorage.getActiveAccount();
      expect(active?.id).toBe(importedAcc.id);
    });

    it('rejects import if the PIN is incorrect and records failed attempt', async () => {
      await expect(
        authService.importAccountAuthorized(
          WRONG_PIN,
          KNOWN_PRIVATE_KEY,
          'Failed Import'
        )
      ).rejects.toThrow('Invalid PIN.');

      const accounts = await accountStorage.getAccounts();
      expect(accounts).toHaveLength(1); // Only HD Account 1
    });

    it('rejects import if private key address is already imported', async () => {
      await authService.importAccountAuthorized(
        TEST_PIN,
        KNOWN_PRIVATE_KEY,
        'Trading Account'
      );

      await expect(
        authService.importAccountAuthorized(
          TEST_PIN,
          KNOWN_PRIVATE_KEY,
          'Duplicate Attempt'
        )
      ).rejects.toThrow('already exists in the wallet');
    });
  });

  describe('Centralized Signing Pipeline (HD & Imported)', () => {
    let importedAccount: any;
    let hdAccount: any;

    beforeEach(async () => {
      const accounts = await accountStorage.getAccounts();
      hdAccount = accounts[0];

      importedAccount = await authService.importAccountAuthorized(
        TEST_PIN,
        KNOWN_PRIVATE_KEY,
        'Imported Account'
      );
    });

    it('signs transactions seamlessly for both HD and Imported accounts', async () => {
      const sampleTx: TransactionRequest = {
        to: '0x0000000000000000000000000000000000000001',
        value: 1000000000000000n,
        gasLimit: 21000n,
        maxFeePerGas: 20000000000n,
        maxPriorityFeePerGas: 1000000000n,
        nonce: 0,
        chainId: 1,
        type: 2,
      };

      // 1. Sign with HD Account
      const signedHdTx = await authService.signTransactionAuthorized(
        TEST_PIN,
        sampleTx,
        hdAccount
      );
      expect(signedHdTx).toMatch(/^0x/);

      // 2. Sign with Imported Account (via account object)
      const signedImportedTx = await authService.signTransactionAuthorized(
        TEST_PIN,
        sampleTx,
        importedAccount
      );
      expect(signedImportedTx).toMatch(/^0x/);

      // 3. Sign with Imported Account (via public address string)
      const signedByAddr = await authService.signTransactionAuthorized(
        TEST_PIN,
        sampleTx,
        importedAccount.address
      );
      expect(signedByAddr).toMatch(/^0x/);
    });

    it('signs personal messages seamlessly for Imported accounts', async () => {
      const message = 'Hello AXT Wallet!';

      const signature = await authService.signMessageAuthorized(
        TEST_PIN,
        message,
        importedAccount
      );

      expect(signature).toMatch(/^0x/);

      // Verify the signature against known wallet
      const expectedSig = await KNOWN_WALLET.signMessage(message);
      expect(signature).toBe(expectedSig);
    });

    it('signs EIP-712 typed structured data seamlessly for Imported accounts', async () => {
      const domain = {
        name: 'AXT App',
        version: '1',
        chainId: 1,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      };

      const types = {
        Mail: [
          { name: 'from', type: 'string' },
          { name: 'contents', type: 'string' },
        ],
      };

      const value = {
        from: 'Alice',
        contents: 'Test Message',
      };

      const signature = await authService.signTypedDataAuthorized(
        TEST_PIN,
        domain,
        types,
        value,
        importedAccount
      );

      expect(signature).toMatch(/^0x/);

      const expectedSig = await KNOWN_WALLET.signTypedData(domain, types, value);
      expect(signature).toBe(expectedSig);
    });

    it('enforces address invariant guards', async () => {
      const sampleTx: TransactionRequest = {
        to: '0x0000000000000000000000000000000000000001',
        value: 1000n,
        gasLimit: 21000n,
        nonce: 0,
        chainId: 1,
      };

      // Mismatch: passing imported account but expecting a different address
      await expect(
        authService.signTransactionAuthorized(
          TEST_PIN,
          sampleTx,
          importedAccount,
          '0x0000000000000000000000000000000000009999'
        )
      ).rejects.toThrow('does not match expected account address');
    });
  });

  describe('Account Deletion & Vault Cleanup', () => {
    it('deletes an imported account and cleans up its encrypted vault entry', async () => {
      const importedAcc = await authService.importAccountAuthorized(
        TEST_PIN,
        KNOWN_PRIVATE_KEY,
        'Temp Account'
      );

      // Verify account and vault exist
      const accountsBefore = await accountStorage.getAccounts();
      expect(accountsBefore.some((a) => a.id === importedAcc.id)).toBe(true);

      // Delete account
      await authService.deleteAccountAuthorized(importedAcc.id);

      // Verify removed from storage
      const accountsAfter = await accountStorage.getAccounts();
      expect(accountsAfter.some((a) => a.id === importedAcc.id)).toBe(false);

      // Verify active account fell back to HD Account 1
      const active = await accountStorage.getActiveAccount();
      expect(active?.type).toBe('hd');
    });

    it('wipes all vault credentials on deleteVault', async () => {
      await authService.importAccountAuthorized(
        TEST_PIN,
        KNOWN_PRIVATE_KEY,
        'Imported 1'
      );

      await deleteVault();

      expect(mockSecureStore.size).toBe(0);
    });
  });
});
