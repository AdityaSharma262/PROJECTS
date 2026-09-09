import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { accountService } from '../../src/wallet/accounts/account.service';
import { getDerivationPathForIndex } from '../../src/wallet/crypto/derivation';
import { HDNodeWallet } from 'ethers';

// Mock appStorage
const mockStore = new Map<string, string>();
jest.mock('../../src/storage/app-storage', () => ({
  appStorage: {
    setItem: jest.fn(async (key: string, value: string) => {
      mockStore.set(key, value);
    }),
    getItem: jest.fn(async (key: string) => {
      return mockStore.get(key) || null;
    }),
    deleteItem: jest.fn(async (key: string) => {
      mockStore.delete(key);
    }),
  },
}));

describe('AccountService', () => {
  const testMnemonic = 'test test test test test test test test test test test junk';

  beforeEach(() => {
    mockStore.clear();
  });

  describe('getDerivationPathForIndex', () => {
    it('constructs standard BIP-44 Ethereum derivation paths', () => {
      expect(getDerivationPathForIndex(0)).toBe("m/44'/60'/0'/0/0");
      expect(getDerivationPathForIndex(1)).toBe("m/44'/60'/0'/0/1");
      expect(getDerivationPathForIndex(5)).toBe("m/44'/60'/0'/0/5");
    });

    it('rejects invalid or negative account indices', () => {
      expect(() => getDerivationPathForIndex(-1)).toThrow();
      expect(() => getDerivationPathForIndex(1.5)).toThrow();
    });
  });

  describe('deriveAccountPublicInfo', () => {
    it('derives accurate public account metadata from mnemonic', () => {
      const expectedWallet0 = HDNodeWallet.fromPhrase(testMnemonic, undefined, "m/44'/60'/0'/0/0");
      const expectedWallet1 = HDNodeWallet.fromPhrase(testMnemonic, undefined, "m/44'/60'/0'/0/1");

      const acc0 = accountService.deriveAccountPublicInfo(testMnemonic, 0);
      const acc1 = accountService.deriveAccountPublicInfo(testMnemonic, 1, 'Custom Account');

      expect(acc0.id).toBe('account-0');
      expect(acc0.index).toBe(0);
      expect(acc0.name).toBe('Account 1');
      expect(acc0.address.toLowerCase()).toBe(expectedWallet0.address.toLowerCase());

      expect(acc1.id).toBe('account-1');
      expect(acc1.index).toBe(1);
      expect(acc1.name).toBe('Custom Account');
      expect(acc1.address.toLowerCase()).toBe(expectedWallet1.address.toLowerCase());

      // Addresses for different indices must be different
      expect(acc0.address.toLowerCase()).not.toBe(acc1.address.toLowerCase());
    });
  });

  describe('verifyAndMigrateAccountZero', () => {
    it('verifies index 0 address and saves Account 1 during initial migration', async () => {
      const expectedWallet = HDNodeWallet.fromPhrase(testMnemonic, undefined, "m/44'/60'/0'/0/0");

      const accounts = await accountService.verifyAndMigrateAccountZero(
        testMnemonic,
        expectedWallet.address
      );

      expect(accounts).toHaveLength(1);
      expect(accounts[0].index).toBe(0);
      expect(accounts[0].name).toBe('Account 1');
      expect(accounts[0].address.toLowerCase()).toBe(expectedWallet.address.toLowerCase());
    });

    it('throws error and fails safely if derived index 0 does not match expected address', async () => {
      const wrongAddress = '0x1111111111111111111111111111111111111111';

      await expect(
        accountService.verifyAndMigrateAccountZero(testMnemonic, wrongAddress)
      ).rejects.toThrow('Migration verification failed');

      expect(mockStore.size).toBe(0);
    });

    it('is idempotent and does not overwrite existing accounts if already migrated', async () => {
      const expectedWallet = HDNodeWallet.fromPhrase(testMnemonic, undefined, "m/44'/60'/0'/0/0");

      // Initial migration
      await accountService.verifyAndMigrateAccountZero(testMnemonic, expectedWallet.address);

      // Add account 2
      await accountService.deriveNextAccountWithMutex(testMnemonic, 'Account 2');

      // Second migration call
      const accountsAfter = await accountService.verifyAndMigrateAccountZero(
        testMnemonic,
        expectedWallet.address
      );

      expect(accountsAfter).toHaveLength(2);
    });
  });

  describe('deriveNextAccountWithMutex', () => {
    it('sequentially allocates and persists next available account indices', async () => {
      const expectedWallet0 = HDNodeWallet.fromPhrase(testMnemonic, undefined, "m/44'/60'/0'/0/0");
      await accountService.verifyAndMigrateAccountZero(testMnemonic, expectedWallet0.address);

      const acc2 = await accountService.deriveNextAccountWithMutex(testMnemonic);
      expect(acc2.index).toBe(1);
      expect(acc2.name).toBe('Account 2');

      const acc3 = await accountService.deriveNextAccountWithMutex(testMnemonic, 'Trading Wallet');
      expect(acc3.index).toBe(2);
      expect(acc3.name).toBe('Trading Wallet');
    });
  });
});
