import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { LockoutTracker } from '../../src/wallet/auth/lockout.service';
import { authService } from '../../src/wallet/auth/auth.service';
import { createVault, deleteVault } from '../../src/wallet/vault/vault.service';

// Mock storage
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
  APP_STORAGE_KEYS: { WALLET_VAULT: 'TEST_VAULT', WALLET_METADATA: 'TEST_META' }
}));

jest.mock('../../src/wallet/vault/vault.service', () => {
  const original = jest.requireActual<any>('../../src/wallet/vault/vault.service');
  return { ...original, CURRENT_PBKDF2_ITERATIONS: 100 };
});

describe('Authentication & Lockout Service', () => {
  const TEST_MNEMONIC = "test test test test test test test test test test test junk";
  const TEST_PIN = "123456";

  beforeEach(async () => {
    secureStoreMap.clear();
    appStoreMap.clear();
    authService.logout();
    await deleteVault();
    // Use reflection to reset authService lockoutTracker for tests
    (authService as any).lockoutTracker.reset();
  });

  describe('LockoutTracker', () => {
    it('applies no delay for 1-4 attempts', () => {
      const tracker = new LockoutTracker();
      for(let i=0; i<4; i++) {
        tracker.recordFailedAttempt();
        expect(tracker.isLockedOut()).toBe(false);
      }
    });

    it('applies medium delay at 5 attempts', () => {
      const tracker = new LockoutTracker();
      for(let i=0; i<5; i++) tracker.recordFailedAttempt();
      
      expect(tracker.isLockedOut()).toBe(true);
      expect(tracker.getRemainingLockoutMs()).toBeGreaterThan(0);
      expect(tracker.getRemainingLockoutMs()).toBeLessThanOrEqual(30000);
    });

    it('applies severe delay at 10 attempts', () => {
      const tracker = new LockoutTracker();
      for(let i=0; i<10; i++) tracker.recordFailedAttempt();
      
      expect(tracker.isLockedOut()).toBe(true);
      expect(tracker.getRemainingLockoutMs()).toBeGreaterThan(30000); // 5 min
    });
  });

  describe('AuthService Integration', () => {
    it('initializes to locked if vault exists', async () => {
      await createVault(TEST_MNEMONIC, TEST_PIN);
      await authService.init();
      expect(authService.getStatus()).toBe("locked");
    });

    it('initializes to initializing if no vault', async () => {
      await authService.init();
      expect(authService.getStatus()).toBe("initializing");
    });

    it('unlocks with correct PIN', async () => {
      await createVault(TEST_MNEMONIC, TEST_PIN);
      await authService.init();
      
      const session = await authService.login(TEST_PIN);
      expect(session.status).toBe("unlocked");
      expect(session.address).toBeDefined();
      expect(authService.getStatus()).toBe("unlocked");
    });

    it('fails and tracks lockout on incorrect PIN', async () => {
      await createVault(TEST_MNEMONIC, TEST_PIN);
      await authService.init();
      
      await expect(authService.login("000000")).rejects.toThrow("Invalid PIN.");
      
      // Attempt 5 should throw Locked out
      for(let i=0; i<3; i++) {
        await expect(authService.login("000000")).rejects.toThrow("Invalid PIN.");
      }
      await expect(authService.login("000000")).rejects.toThrow(/Locked out/);
      expect(authService.getStatus()).toBe("locked_out");
    });

    it('clears session on logout', async () => {
      await createVault(TEST_MNEMONIC, TEST_PIN);
      await authService.login(TEST_PIN);
      expect(authService.getSession()).not.toBeNull();
      
      authService.logout();
      expect(authService.getSession()).toBeNull();
      expect(authService.getStatus()).toBe("locked");
    });
  });
});
