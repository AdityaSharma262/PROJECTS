import { LockoutTracker } from './lockout.service';
import { unlockVault, getVaultMetadata } from '../vault/vault.service';
import { WalletSession, AuthStatus } from './auth.types';

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
    // Always start locked — never auto-restore a session from previous app launch
    this.status = "locked";
  }

  /**
   * Attempts to unlock the vault with a PIN.
   * Modifies authentication state and tracks lockouts.
   */
  async login(pin: string): Promise<WalletSession> {
    if (this.lockoutTracker.isLockedOut()) {
      const seconds = Math.ceil(this.lockoutTracker.getRemainingLockoutMs() / 1000);
      throw new Error(`Locked out. Try again in ${seconds} seconds.`);
    }

    try {
      // We unlock the vault which throws if the PIN is incorrect.
      // The decrypted mnemonic is instantly garbage collected as we don't save it to state.
      await unlockVault(pin);
      
      const meta = await getVaultMetadata();
      if (!meta) throw new Error("Vault unlocked but metadata missing.");

      this.lockoutTracker.reset();
      this.status = "unlocked";
      this.session = {
        address: meta.address,
        status: "unlocked"
      };

      return this.session;
    } catch {
      this.lockoutTracker.recordFailedAttempt();
      this.status = this.lockoutTracker.isLockedOut() ? "locked_out" : "locked";
      throw new Error("Invalid PIN.");
    }
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
