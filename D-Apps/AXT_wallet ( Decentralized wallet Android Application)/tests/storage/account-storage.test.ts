import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { accountStorage } from '../../src/storage/account-storage';
import { WalletAccount } from '../../src/wallet/accounts/account.types';

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

describe('AccountStorage', () => {
  const mockAccount1: WalletAccount = {
    id: 'account-0',
    index: 0,
    name: 'Account 1',
    address: '0x1111111111111111111111111111111111111111',
    type: 'hd',
    createdAt: 1000,
  };

  const mockAccount2: WalletAccount = {
    id: 'account-1',
    index: 1,
    name: 'Account 2',
    address: '0x2222222222222222222222222222222222222222',
    type: 'hd',
    createdAt: 2000,
  };

  const mockImported: WalletAccount = {
    id: 'imported-0x3333',
    name: 'Imported 1',
    address: '0x3333333333333333333333333333333333333333',
    type: 'imported',
    createdAt: 3000,
  };

  beforeEach(() => {
    mockStore.clear();
  });

  it('saves and retrieves accounts sorted by index', async () => {
    await accountStorage.saveAccounts([mockAccount2, mockAccount1]);

    const accounts = await accountStorage.getAccounts();
    expect(accounts).toHaveLength(2);
    expect(accounts[0].id).toBe('account-0');
    expect(accounts[1].id).toBe('account-1');
  });

  it('tracks and persists activeAccountId across operations', async () => {
    await accountStorage.saveAccounts([mockAccount1, mockAccount2]);
    await accountStorage.setActiveAccountId(mockAccount2.id);

    const activeId = await accountStorage.getActiveAccountId();
    expect(activeId).toBe(mockAccount2.id);

    const activeAcc = await accountStorage.getActiveAccount();
    expect(activeAcc?.id).toBe(mockAccount2.id);
    expect(activeAcc?.name).toBe('Account 2');
  });

  it('adds new accounts without duplicating', async () => {
    await accountStorage.addAccount(mockAccount1);
    await accountStorage.addAccount(mockAccount1); // Duplicate attempt
    await accountStorage.addAccount(mockAccount2);

    const accounts = await accountStorage.getAccounts();
    expect(accounts).toHaveLength(2);
  });

  it('updates account display names', async () => {
    await accountStorage.saveAccounts([mockAccount1]);
    await accountStorage.updateAccountName('account-0', 'Primary Savings');

    const accounts = await accountStorage.getAccounts();
    expect(accounts[0].name).toBe('Primary Savings');
  });

  it('deletes imported accounts and falls back to primary account if active', async () => {
    await accountStorage.saveAccounts([mockAccount1, mockImported]);
    await accountStorage.setActiveAccountId(mockImported.id);

    expect(await accountStorage.getActiveAccountId()).toBe(mockImported.id);

    await accountStorage.deleteAccount(mockImported.id);

    const accounts = await accountStorage.getAccounts();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].id).toBe(mockAccount1.id);
    expect(await accountStorage.getActiveAccountId()).toBe(mockAccount1.id);
  });

  it('prevents deleting the only HD account', async () => {
    await accountStorage.saveAccounts([mockAccount1]);
    await expect(accountStorage.deleteAccount(mockAccount1.id)).rejects.toThrow(
      'Cannot remove the primary HD account.'
    );
  });
});
