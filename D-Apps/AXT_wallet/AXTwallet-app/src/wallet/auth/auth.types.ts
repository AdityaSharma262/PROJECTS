export type AuthStatus = 
  | "initializing"
  | "no_wallet"
  | "locked"
  | "unlocked"
  | "locked_out";

export interface WalletSession {
  address: string;
  status: AuthStatus;
  // Account metadata could include network, name, etc. later.
}

export interface LockoutPolicy {
  maxFreeAttempts: number;
  mediumLockoutThreshold: number;
  mediumLockoutDurationMs: number;
  severeLockoutThreshold: number;
  severeLockoutDurationMs: number;
}

export const DEFAULT_LOCKOUT_POLICY: LockoutPolicy = {
  maxFreeAttempts: 4,               // 1-4
  mediumLockoutThreshold: 5,        // 5-9
  mediumLockoutDurationMs: 30 * 1000, // 30 seconds
  severeLockoutThreshold: 10,       // 10+
  severeLockoutDurationMs: 5 * 60 * 1000 // 5 minutes
};
