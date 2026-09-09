import { LockoutPolicy, DEFAULT_LOCKOUT_POLICY } from './auth.types';

export class LockoutTracker {
  private failedAttempts: number = 0;
  private lockedUntil: number = 0;
  private policy: LockoutPolicy;

  constructor(policy: LockoutPolicy = DEFAULT_LOCKOUT_POLICY) {
    this.policy = policy;
  }

  public recordFailedAttempt(): void {
    this.failedAttempts++;

    if (this.failedAttempts >= this.policy.severeLockoutThreshold) {
      this.lockedUntil = Date.now() + this.policy.severeLockoutDurationMs;
    } else if (this.failedAttempts >= this.policy.mediumLockoutThreshold) {
      this.lockedUntil = Date.now() + this.policy.mediumLockoutDurationMs;
    }
  }

  public reset(): void {
    this.failedAttempts = 0;
    this.lockedUntil = 0;
  }

  public isLockedOut(): boolean {
    return Date.now() < this.lockedUntil;
  }

  public getRemainingLockoutMs(): number {
    const remaining = this.lockedUntil - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  public getFailedAttempts(): number {
    return this.failedAttempts;
  }
}
