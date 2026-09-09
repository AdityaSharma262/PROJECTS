import { HDNodeWallet, Wallet, TransactionRequest } from 'ethers';
import { LockoutTracker } from './lockout.service';
import {
  unlockVault,
  getVaultMetadata,
  storeImportedAccountKey,
  unlockImportedAccountKey,
  deleteImportedAccountKey,
} from '../vault/vault.service';
import { getDerivationPathForIndex } from '../crypto/derivation';
import { WalletSession, AuthStatus } from './auth.types';
import { accountService } from '../accounts/account.service';
import { accountStorage } from '../../storage/account-storage';
import { WalletAccount } from '../accounts/account.types';
import { biometricService } from '../biometric/biometric.service';

class AuthService {
  private lockoutTracker = new LockoutTracker();
  private session: WalletSession | null = null;
  private status: AuthStatus = "initializing";

  /**
   * Checks if a wallet exists and sets initial state.
   */
  async init(): Promise<void> {
    const meta = await getVaultMetadata();
    if (!meta) {
      this.status = "no_wallet";
      return;
    }
    // Always start locked — never auto-restore an authenticated session from previous app launch
    this.status = "locked";
  }

  /**
   * Attempts to unlock the vault with a PIN.
   * Modifies authentication state and tracks lockouts.
   * Performs verified Account 0 migration if account storage is empty.
   */
  async login(pin: string): Promise<WalletSession> {
    if (this.lockoutTracker.isLockedOut()) {
      const seconds = Math.ceil(this.lockoutTracker.getRemainingLockoutMs() / 1000);
      throw new Error(`Locked out. Try again in ${seconds} seconds.`);
    }

    try {
      const mnemonic = await unlockVault(pin);
      
      const meta = await getVaultMetadata();
      if (!meta) throw new Error("Vault unlocked but metadata missing.");

      // Verified Account 0 migration check:
      // Derives index 0 from mnemonic and verifies it strictly matches the existing vault address
      await accountService.verifyAndMigrateAccountZero(mnemonic, meta.address);

      // Get active account from storage (or fallback to Account 0)
      const activeAccount = await accountStorage.getActiveAccount();
      const activeAddress = activeAccount?.address || meta.address;

      this.lockoutTracker.reset();
      this.status = "unlocked";
      this.session = {
        address: activeAddress,
        status: "unlocked",
      };

      return this.session;
    } catch (err: any) {
      if (err?.message && err.message.includes("Device Key missing")) {
        throw err;
      }
      this.lockoutTracker.recordFailedAttempt();
      this.status = this.lockoutTracker.isLockedOut() ? "locked_out" : "locked";
      throw new Error(err?.message?.includes("Migration verification failed") ? err.message : "Invalid PIN.");
    }
  }

  /**
   * Securely authorizes and derives the next sequential HD account using the PIN.
   * Reuses the unified lockout tracker and authentication security boundary.
   */
  async createAccountAuthorized(pin: string, customName?: string): Promise<WalletAccount> {
    if (this.lockoutTracker.isLockedOut()) {
      const seconds = Math.ceil(this.lockoutTracker.getRemainingLockoutMs() / 1000);
      throw new Error(`Locked out. Try again in ${seconds} seconds.`);
    }

    try {
      const mnemonic = await unlockVault(pin);
      const newAccount = await accountService.deriveNextAccountWithMutex(mnemonic, customName);

      // Update active session address if currently unlocked
      if (this.session) {
        this.session.address = newAccount.address;
      }

      this.lockoutTracker.reset();
      return newAccount;
    } catch (err: any) {
      if (err?.message && (err.message.includes("Device Key missing") || err.message.includes("already in progress"))) {
        throw err;
      }
      this.lockoutTracker.recordFailedAttempt();
      if (this.lockoutTracker.isLockedOut()) {
        this.status = "locked_out";
      }
      throw new Error("Invalid PIN.");
    }
  }

  /**
   * Securely validates, encrypts, and imports an existing EVM private key into the vault.
   * Reuses the unified PIN authorization and lockout tracker.
   */
  async importAccountAuthorized(
    pin: string,
    privateKey: string,
    customName?: string
  ): Promise<WalletAccount> {
    if (this.lockoutTracker.isLockedOut()) {
      const seconds = Math.ceil(this.lockoutTracker.getRemainingLockoutMs() / 1000);
      throw new Error(`Locked out. Try again in ${seconds} seconds.`);
    }

    try {
      // 1. Verify PIN by testing vault unlock
      await unlockVault(pin);

      // 2. Validate private key format and derive public address
      const { address, normalizedKey } = accountService.validatePrivateKey(privateKey);

      // 3. Ensure address is not a duplicate
      await accountService.validateImportAddressUnique(address);

      // 4. Generate deterministic imported account identifier
      const accountId = `imported-${address.toLowerCase()}`;

      // 5. Encrypt and store private key in secure vault
      await storeImportedAccountKey(accountId, normalizedKey, pin);

      // 6. Persist public metadata
      const newAccount: WalletAccount = {
        id: accountId,
        name: customName?.trim() || 'Imported Account',
        address,
        type: 'imported',
        createdAt: Date.now(),
      };

      await accountStorage.addAccount(newAccount);
      await accountStorage.setActiveAccountId(newAccount.id);

      if (this.session) {
        this.session.address = newAccount.address;
      }

      this.lockoutTracker.reset();
      return newAccount;
    } catch (err: any) {
      if (
        err?.message &&
        (err.message.includes("Device Key missing") ||
          err.message.includes("already exists") ||
          err.message.includes("Invalid private key") ||
          err.message.includes("cannot be empty"))
      ) {
        throw err;
      }
      this.lockoutTracker.recordFailedAttempt();
      if (this.lockoutTracker.isLockedOut()) {
        this.status = "locked_out";
      }
      throw new Error("Invalid PIN.");
    }
  }

  /**
   * Deletes an account (and cleans up its encrypted vault if imported).
   */
  async deleteAccountAuthorized(accountId: string): Promise<void> {
    const accounts = await accountStorage.getAccounts();
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return;

    if (account.type === 'imported') {
      await deleteImportedAccountKey(accountId);
    }

    await accountStorage.deleteAccount(accountId);

    const activeAccount = await accountStorage.getActiveAccount();
    if (this.session && activeAccount) {
      this.session.address = activeAccount.address;
    }
  }

  /**
   * Securely decrypts and reveals the master recovery phrase after PIN verification.
   * Enforces unified lockout policies and ensures the phrase is not stored in state or logs.
   */
  async revealRecoveryPhrase(pin: string): Promise<string> {
    if (this.lockoutTracker.isLockedOut()) {
      const seconds = Math.ceil(this.lockoutTracker.getRemainingLockoutMs() / 1000);
      throw new Error(`Locked out. Try again in ${seconds} seconds.`);
    }

    try {
      const mnemonic = await unlockVault(pin);
      this.lockoutTracker.reset();
      return mnemonic;
    } catch (err: any) {
      if (err?.message && err.message.includes("Device Key missing")) {
        throw err;
      }
      this.lockoutTracker.recordFailedAttempt();
      if (this.lockoutTracker.isLockedOut()) {
        this.status = "locked_out";
      }
      throw new Error("Invalid PIN.");
    }
  }

  /**
   * Switches the active account without requiring PIN re-entry.
   */
  async switchAccount(accountId: string): Promise<WalletAccount> {
    await accountStorage.setActiveAccountId(accountId);
    const activeAccount = await accountStorage.getActiveAccount();
    if (!activeAccount) {
      throw new Error(`Account not found: ${accountId}`);
    }

    if (this.session) {
      this.session.address = activeAccount.address;
    }

    return activeAccount;
  }

  /**
   * Resolves a target account from a WalletAccount object, account ID, public address, or index.
   */
  private async resolveAccount(
    target?: WalletAccount | string | number,
    expectedAddress?: string
  ): Promise<WalletAccount> {
    if (typeof target === 'object' && target?.address && target?.type) {
      return target;
    }

    const accounts = await accountStorage.getAccounts();

    if (typeof target === 'string') {
      const foundById = accounts.find((a) => a.id === target);
      if (foundById) return foundById;

      const foundByAddr = accounts.find(
        (a) => a.address.toLowerCase() === target.toLowerCase()
      );
      if (foundByAddr) return foundByAddr;
    } else if (typeof target === 'number') {
      const foundByIndex = accounts.find(
        (a) => a.type === 'hd' && a.index === target
      );
      if (foundByIndex) return foundByIndex;

      // Virtual HD account representation for index-based signing
      return {
        id: `account-${target}`,
        index: target,
        name: `Account ${target + 1}`,
        address: expectedAddress || '',
        type: 'hd',
        createdAt: 0,
      };
    }

    const active = await accountStorage.getActiveAccount();
    if (active) return active;

    if (accounts.length > 0) return accounts[0];

    throw new Error('No valid account found for signing request.');
  }

  /**
   * Ephemerally unlocks and instantiates the proper signer (HDNodeWallet or Wallet)
   * for the designated account based on its account type ('hd' vs 'imported').
   * Enforces strict address invariant verification before returning.
   */
  private async getEphemeralSigner(
    pin: string,
    account: WalletAccount
  ): Promise<HDNodeWallet | Wallet> {
    if (account.type === 'imported') {
      const privateKey = await unlockImportedAccountKey(account.id, pin);
      const wallet = new Wallet(privateKey);

      if (account.address && wallet.address.toLowerCase() !== account.address.toLowerCase()) {
        throw new Error(
          `Imported signer address (${wallet.address}) does not match expected account address (${account.address}).`
        );
      }

      return wallet;
    } else {
      const mnemonic = await unlockVault(pin);
      const derivationPath = getDerivationPathForIndex(account.index ?? 0);
      const wallet = HDNodeWallet.fromPhrase(mnemonic, undefined, derivationPath);

      if (account.address && wallet.address.toLowerCase() !== account.address.toLowerCase()) {
        throw new Error(
          `Derived HD signer address (${wallet.address}) does not match expected account address (${account.address}).`
        );
      }

      return wallet;
    }
  }

  /**
   * Authorizes and signs a transaction in a single enclosed pass using the provided PIN
   * for the designated account (HD or imported).
   *
   * Centralized: The caller remains completely agnostic of the account origin/type.
   */
  async signTransactionAuthorized(
    pin: string,
    populatedTx: TransactionRequest,
    targetAccount?: WalletAccount | string | number,
    expectedAddress?: string
  ): Promise<string> {
    if (this.lockoutTracker.isLockedOut()) {
      const seconds = Math.ceil(this.lockoutTracker.getRemainingLockoutMs() / 1000);
      throw new Error(`Locked out. Try again in ${seconds} seconds.`);
    }

    try {
      const account = await this.resolveAccount(targetAccount, expectedAddress);

      const signer = await this.getEphemeralSigner(pin, account);

      if (expectedAddress && signer.address.toLowerCase() !== expectedAddress.toLowerCase()) {
        throw new Error(
          `Derived wallet address (${signer.address}) does not match expected account address (${expectedAddress}).`
        );
      }

      const signedTxHex = await signer.signTransaction(populatedTx);

      this.lockoutTracker.reset();
      return signedTxHex;
    } catch (err: any) {
      if (
        err?.message &&
        (err.message.includes("Device Key missing") ||
          err.message.includes("does not match") ||
          err.message.includes("not found"))
      ) {
        throw err;
      }
      this.lockoutTracker.recordFailedAttempt();
      if (this.lockoutTracker.isLockedOut()) {
        this.status = "locked_out";
      }
      throw new Error("Invalid PIN.");
    }
  }

  /**
   * Authorizes and signs a personal message (EIP-191) using the provided PIN
   * for the designated account (HD or imported).
   */
  async signMessageAuthorized(
    pin: string,
    message: string | Uint8Array,
    targetAccount?: WalletAccount | string | number,
    expectedAddress?: string
  ): Promise<string> {
    if (this.lockoutTracker.isLockedOut()) {
      const seconds = Math.ceil(this.lockoutTracker.getRemainingLockoutMs() / 1000);
      throw new Error(`Locked out. Try again in ${seconds} seconds.`);
    }

    try {
      const account = await this.resolveAccount(targetAccount, expectedAddress);

      const signer = await this.getEphemeralSigner(pin, account);

      if (expectedAddress && signer.address.toLowerCase() !== expectedAddress.toLowerCase()) {
        throw new Error(
          `Derived wallet address (${signer.address}) does not match expected account address (${expectedAddress}).`
        );
      }

      const signature = await signer.signMessage(message);

      this.lockoutTracker.reset();
      return signature;
    } catch (err: any) {
      if (
        err?.message &&
        (err.message.includes("Device Key missing") ||
          err.message.includes("does not match") ||
          err.message.includes("not found"))
      ) {
        throw err;
      }
      this.lockoutTracker.recordFailedAttempt();
      if (this.lockoutTracker.isLockedOut()) {
        this.status = "locked_out";
      }
      throw new Error("Invalid PIN.");
    }
  }

  /**
   * Authorizes and signs typed structured data (EIP-712) using the provided PIN
   * for the designated account (HD or imported).
   */
  async signTypedDataAuthorized(
    pin: string,
    domain: any,
    types: Record<string, any[]>,
    value: Record<string, any>,
    targetAccount?: WalletAccount | string | number,
    expectedAddress?: string
  ): Promise<string> {
    if (this.lockoutTracker.isLockedOut()) {
      const seconds = Math.ceil(this.lockoutTracker.getRemainingLockoutMs() / 1000);
      throw new Error(`Locked out. Try again in ${seconds} seconds.`);
    }

    try {
      const account = await this.resolveAccount(targetAccount, expectedAddress);

      // Sanitize types: remove EIP712Domain if passed by dApp
      const sanitizedTypes: Record<string, any[]> = {};
      for (const [key, val] of Object.entries(types)) {
        if (key !== 'EIP712Domain') {
          sanitizedTypes[key] = val;
        }
      }

      const signer = await this.getEphemeralSigner(pin, account);

      if (expectedAddress && signer.address.toLowerCase() !== expectedAddress.toLowerCase()) {
        throw new Error(
          `Derived wallet address (${signer.address}) does not match expected account address (${expectedAddress}).`
        );
      }

      const signature = await signer.signTypedData(domain, sanitizedTypes, value);

      this.lockoutTracker.reset();
      return signature;
    } catch (err: any) {
      if (
        err?.message &&
        (err.message.includes("Device Key missing") ||
          err.message.includes("does not match") ||
          err.message.includes("not found"))
      ) {
        throw err;
      }
      this.lockoutTracker.recordFailedAttempt();
      if (this.lockoutTracker.isLockedOut()) {
        this.status = "locked_out";
      }
      throw new Error("Invalid PIN.");
    }
  }

  /**
   * Attempts to login using biometric authentication.
   * Uses the securely stored biometric credential to unlock the vault.
   */
  async loginWithBiometrics(): Promise<WalletSession> {
    if (this.lockoutTracker.isLockedOut()) {
      const seconds = Math.ceil(this.lockoutTracker.getRemainingLockoutMs() / 1000);
      throw new Error(`Locked out. Try again in ${seconds} seconds.`);
    }

    const authenticated = await biometricService.authenticate('Unlock AXT Wallet');
    if (!authenticated) {
      throw new Error('Biometric authentication failed or was cancelled.');
    }

    const pin = await biometricService.getCredential();
    if (!pin) {
      throw new Error('Biometrics not enabled or credential not found.');
    }

    return await this.login(pin);
  }

  /**
   * Signs a transaction using biometric authorization.
   */
  async signTransactionBiometric(
    txRequest: TransactionRequest,
    targetAccount?: WalletAccount | string | number,
    expectedAddress?: string
  ): Promise<string> {
    if (this.lockoutTracker.isLockedOut()) {
      const seconds = Math.ceil(this.lockoutTracker.getRemainingLockoutMs() / 1000);
      throw new Error(`Locked out. Try again in ${seconds} seconds.`);
    }

    const authenticated = await biometricService.authenticate('Authorize Transaction');
    if (!authenticated) {
      throw new Error('Biometric authorization failed or was cancelled.');
    }

    const pin = await biometricService.getCredential();
    if (!pin) {
      throw new Error('Biometrics not enabled or credential missing.');
    }

    return await this.signTransactionAuthorized(pin, txRequest, targetAccount, expectedAddress);
  }

  /**
   * Signs a message using biometric authorization.
   */
  async signMessageBiometric(
    message: string,
    targetAccount?: WalletAccount | string | number,
    expectedAddress?: string
  ): Promise<string> {
    if (this.lockoutTracker.isLockedOut()) {
      const seconds = Math.ceil(this.lockoutTracker.getRemainingLockoutMs() / 1000);
      throw new Error(`Locked out. Try again in ${seconds} seconds.`);
    }

    const authenticated = await biometricService.authenticate('Authorize Signature');
    if (!authenticated) {
      throw new Error('Biometric authorization failed or was cancelled.');
    }

    const pin = await biometricService.getCredential();
    if (!pin) {
      throw new Error('Biometrics not enabled or credential missing.');
    }

    return await this.signMessageAuthorized(pin, message, targetAccount, expectedAddress);
  }

  /**
   * Signs typed data using biometric authorization.
   */
  async signTypedDataBiometric(
    domain: any,
    types: Record<string, any[]>,
    value: Record<string, any>,
    targetAccount?: WalletAccount | string | number,
    expectedAddress?: string
  ): Promise<string> {
    if (this.lockoutTracker.isLockedOut()) {
      const seconds = Math.ceil(this.lockoutTracker.getRemainingLockoutMs() / 1000);
      throw new Error(`Locked out. Try again in ${seconds} seconds.`);
    }

    const authenticated = await biometricService.authenticate('Authorize Typed Data');
    if (!authenticated) {
      throw new Error('Biometric authorization failed or was cancelled.');
    }

    const pin = await biometricService.getCredential();
    if (!pin) {
      throw new Error('Biometrics not enabled or credential missing.');
    }

    return await this.signTypedDataAuthorized(pin, domain, types, value, targetAccount, expectedAddress);
  }

  /**
   * Explicitly locks the wallet, destroying the session.
   */
  logout(): void {
    this.session = null;
    this.status = "locked";
  }

  getStatus(): AuthStatus {
    if (this.lockoutTracker.isLockedOut()) return "locked_out";
    return this.status;
  }

  getSession(): WalletSession | null {
    return this.session;
  }

  getLockoutRemaining(): number {
    return this.lockoutTracker.getRemainingLockoutMs();
  }
}

export const authService = new AuthService();

