import { Wallet } from 'ethers';
import { deriveEVMAddress, getDerivationPathForIndex } from '../crypto/derivation';
import { WalletAccount } from './account.types';
import { accountStorage } from '../../storage/account-storage';

class AccountService {
  private isCreatingAccountMutex = false;

  /**
   * Derives public account metadata (address, path, index) for a specific account index.
   * SECURITY INVARIANT:
   * - Mnemonic and HD wallet instance exist only within this local function scope.
   * - Only public metadata is returned.
   */
  deriveAccountPublicInfo(
    mnemonic: string,
    index: number,
    name?: string
  ): WalletAccount {
    const derivationPath = getDerivationPathForIndex(index);
    const derived = deriveEVMAddress(mnemonic, derivationPath);

    return {
      id: `account-${index}`,
      index,
      name: name?.trim() || `Account ${index + 1}`,
      address: derived.address,
      type: 'hd',
      createdAt: Date.now(),
    };
  }

  /**
   * Validates a raw private key string and derives its public EVM address.
   * SECURITY INVARIANT:
   * - Wallet instance is created ephemerally only to derive the public address.
   */
  validatePrivateKey(rawKey: string): { address: string; normalizedKey: string } {
    const trimmed = (rawKey || '').trim();
    if (!trimmed) {
      throw new Error('Private key cannot be empty.');
    }

    const hexOnly = trimmed.startsWith('0x') || trimmed.startsWith('0X')
      ? trimmed.slice(2)
      : trimmed;

    if (hexOnly.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(hexOnly)) {
      throw new Error('Invalid private key format. Must be a 64-character hex string (32 bytes).');
    }

    const normalizedKey = `0x${hexOnly}`;

    try {
      const wallet = new Wallet(normalizedKey);
      return {
        address: wallet.address,
        normalizedKey,
      };
    } catch {
      throw new Error('Invalid private key. Failed to derive wallet address.');
    }
  }

  /**
   * Checks whether an address is already present in the wallet accounts list.
   */
  async validateImportAddressUnique(address: string): Promise<void> {
    const existing = await accountStorage.getAccounts();
    const exists = existing.some(
      (a) => a.address.toLowerCase() === address.toLowerCase()
    );
    if (exists) {
      throw new Error('An account with this address already exists in the wallet.');
    }
  }

  /**
   * Verifies that the address derived from mnemonic at index 0 matches the expected vault address,
   * then initializes Account 1 in storage if storage is empty.
   *
   * SECURITY INVARIANT:
   * - Fails safely if derived address at index 0 does not match stored vault address.
   * - Idempotent: Does not duplicate accounts if already migrated.
   */
  async verifyAndMigrateAccountZero(
    mnemonic: string,
    expectedAddress: string
  ): Promise<WalletAccount[]> {
    const existing = await accountStorage.getAccounts();
    if (existing.length > 0) {
      return existing;
    }

    const accountZero = this.deriveAccountPublicInfo(mnemonic, 0, 'Account 1');

    if (accountZero.address.toLowerCase() !== expectedAddress.toLowerCase()) {
      throw new Error(
        `Migration verification failed: Derived address at index 0 (${accountZero.address}) does not match existing vault address (${expectedAddress}).`
      );
    }

    await accountStorage.saveAccounts([accountZero]);
    await accountStorage.setActiveAccountId(accountZero.id);

    return [accountZero];
  }

  /**
   * Derives the next sequential account and persists it in storage.
   * Protected with a concurrency mutex to prevent double-tap race conditions.
   */
  async deriveNextAccountWithMutex(
    mnemonic: string,
    customName?: string
  ): Promise<WalletAccount> {
    if (this.isCreatingAccountMutex) {
      throw new Error('Account creation is already in progress. Please wait.');
    }

    this.isCreatingAccountMutex = true;

    try {
      const existing = await accountStorage.getAccounts();
      const existingIndices = new Set(existing.map((a) => a.index));

      // Find the next available non-negative integer index
      let nextIndex = 0;
      while (existingIndices.has(nextIndex)) {
        nextIndex++;
      }

      const defaultName = `Account ${nextIndex + 1}`;
      const newAccount = this.deriveAccountPublicInfo(
        mnemonic,
        nextIndex,
        customName?.trim() || defaultName
      );

      await accountStorage.addAccount(newAccount);
      await accountStorage.setActiveAccountId(newAccount.id);

      return newAccount;
    } finally {
      this.isCreatingAccountMutex = false;
    }
  }
}

export const accountService = new AccountService();
