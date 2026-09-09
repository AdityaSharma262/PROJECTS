import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as LocalAuthentication from 'expo-local-authentication';

// Storage mocks
const secureStoreMap = new Map<string, string>();
const appStoreMap = new Map<string, string>();

jest.mock('../../src/security/secure-storage', () => ({
  secureStorage: {
    setItem: jest.fn(async (k: string, v: string) => {
      secureStoreMap.set(k, v);
    }),
    getItem: jest.fn(async (k: string) => secureStoreMap.get(k) || null),
    deleteItem: jest.fn(async (k: string) => {
      secureStoreMap.delete(k);
    }),
  },
}));

jest.mock('../../src/storage/app-storage', () => ({
  appStorage: {
    setItem: jest.fn(async (k: string, v: string) => {
      appStoreMap.set(k, v);
    }),
    getItem: jest.fn(async (k: string) => appStoreMap.get(k) || null),
    deleteItem: jest.fn(async (k: string) => {
      appStoreMap.delete(k);
    }),
  },
  APP_STORAGE_KEYS: {
    WALLET_VAULT: 'AXT_WALLET_VAULT_V1',
    WALLET_METADATA: 'AXT_WALLET_METADATA',
    IMPORTED_VAULT_PREFIX: 'AXT_WALLET_IMPORTED_VAULT_V1_',
  },
}));

jest.mock('../../src/wallet/vault/vault.service', () => {
  const original = jest.requireActual<any>('../../src/wallet/vault/vault.service');
  return {
    ...original,
    CURRENT_PBKDF2_ITERATIONS: 10,
  };
});

import { biometricService } from '../../src/wallet/biometric/biometric.service';
import { biometricStorage } from '../../src/storage/biometric-storage';
import { authService } from '../../src/wallet/auth/auth.service';
import { createVault } from '../../src/wallet/vault/vault.service';
import { accountStorage } from '../../src/storage/account-storage';
import { TransactionRequest } from 'ethers';

const TEST_MNEMONIC =
  'test test test test test test test test test test test junk';
const TEST_PIN = '123456';
const EXPECTED_ADDRESS_0 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

describe('Biometric Authentication & Quick Unlock (Phase 10)', () => {
  beforeEach(async () => {
    secureStoreMap.clear();
    appStoreMap.clear();
    authService.logout();
    (authService as any).lockoutTracker.reset();

    // Default mock behavior for LocalAuthentication
    (LocalAuthentication.hasHardwareAsync as any).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as any).mockResolvedValue(true);
    (LocalAuthentication.supportedAuthenticationTypesAsync as any).mockResolvedValue([
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    ]);
    (LocalAuthentication.authenticateAsync as any).mockResolvedValue({ success: true });
  });

  describe('1. Hardware & Enrollment Status Checks', () => {
    it('reports unavailable when device has no biometric hardware', async () => {
      (LocalAuthentication.hasHardwareAsync as any).mockResolvedValue(false);

      const status = await biometricService.checkStatus();
      expect(status.isAvailable).toBe(false);
      expect(status.isEnrolled).toBe(false);
      expect(status.isEnabled).toBe(false);
      expect(status.primaryTypeName).toBe('Not Available');
    });

    it('reports available but not enrolled when no biometrics are set up', async () => {
      (LocalAuthentication.hasHardwareAsync as any).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as any).mockResolvedValue(false);
      (LocalAuthentication.supportedAuthenticationTypesAsync as any).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      ]);

      const status = await biometricService.checkStatus();
      expect(status.isAvailable).toBe(true);
      expect(status.isEnrolled).toBe(false);
      expect(status.isEnabled).toBe(false);
      expect(status.primaryTypeName).toBe('Fingerprint');
    });

    it('detects Face ID when facial recognition is supported and enrolled', async () => {
      (LocalAuthentication.hasHardwareAsync as any).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as any).mockResolvedValue(true);
      (LocalAuthentication.supportedAuthenticationTypesAsync as any).mockResolvedValue([
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      ]);

      const status = await biometricService.checkStatus();
      expect(status.isAvailable).toBe(true);
      expect(status.isEnrolled).toBe(true);
      expect(status.primaryTypeName).toBe('Face ID');
      expect(status.isEnabled).toBe(false); // not enabled by user yet
    });
  });

  describe('2. Enabling & Disabling Biometrics', () => {
    it('enables biometrics by securely storing PIN credential', async () => {
      await biometricService.enable(TEST_PIN);

      const isEnabled = await biometricStorage.isBiometricEnabled();
      expect(isEnabled).toBe(true);

      const status = await biometricService.checkStatus();
      expect(status.isEnabled).toBe(true);

      const storedPin = await biometricService.getCredential();
      expect(storedPin).toBe(TEST_PIN);
    });

    it('disables biometrics by purging stored credential', async () => {
      await biometricService.enable(TEST_PIN);
      await biometricService.disable();

      const isEnabled = await biometricStorage.isBiometricEnabled();
      expect(isEnabled).toBe(false);

      const status = await biometricService.checkStatus();
      expect(status.isEnabled).toBe(false);

      const credential = await biometricService.getCredential();
      expect(credential).toBeNull();
    });
  });

  describe('3. Biometric Prompt & Authentication', () => {
    it('returns true on successful biometric prompt', async () => {
      (LocalAuthentication.authenticateAsync as any).mockResolvedValue({ success: true });

      const result = await biometricService.authenticate('Unlock Wallet');
      expect(result).toBe(true);
    });

    it('returns false when user cancels or fails biometric prompt', async () => {
      (LocalAuthentication.authenticateAsync as any).mockResolvedValue({
        success: false,
        error: 'user_cancel',
      });

      const result = await biometricService.authenticate('Unlock Wallet');
      expect(result).toBe(false);
    });
  });

  describe('4. AuthService Biometric Login & Signing', () => {
    beforeEach(async () => {
      await createVault(TEST_MNEMONIC, TEST_PIN);
      await accountStorage.saveAccounts([
        {
          id: 'acc-0',
          index: 0,
          name: 'Account 1',
          address: EXPECTED_ADDRESS_0,
          type: 'hd',
          createdAt: 0,
        },
      ]);
      await accountStorage.setActiveAccountId('acc-0');
      await biometricService.enable(TEST_PIN);
    });

    it('logs in and establishes session using biometric authentication', async () => {
      (LocalAuthentication.authenticateAsync as any).mockResolvedValue({ success: true });

      const session = await authService.loginWithBiometrics();
      expect(session).toBeDefined();
      expect(session.status).toBe('unlocked');
      expect(authService.getStatus()).toBe('unlocked');
    });

    it('rejects biometric login when biometric prompt is canceled', async () => {
      (LocalAuthentication.authenticateAsync as any).mockResolvedValue({
        success: false,
        error: 'user_cancel',
      });

      await expect(authService.loginWithBiometrics()).rejects.toThrow(
        'Biometric authentication failed'
      );
      expect(authService.getStatus()).toBe('locked');
    });

    it('signs message using biometric authorization', async () => {
      (LocalAuthentication.authenticateAsync as any).mockResolvedValue({ success: true });

      const sig = await authService.signMessageBiometric('Hello Biometrics');
      expect(sig).toMatch(/^0x[a-fA-F0-9]{130}$/);
    });

    it('signs transaction using biometric authorization', async () => {
      (LocalAuthentication.authenticateAsync as any).mockResolvedValue({ success: true });

      const tx: TransactionRequest = {
        to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        value: 1000000000000000000n,
        nonce: 0,
        gasLimit: 21000n,
        maxFeePerGas: 20000000000n,
        maxPriorityFeePerGas: 1000000000n,
        chainId: 1,
        type: 2,
      };

      const signedTx = await authService.signTransactionBiometric(tx);
      expect(signedTx).toMatch(/^0x02/); // EIP-1559 signed tx starts with 0x02
    });

    it('signs typed data using biometric authorization', async () => {
      (LocalAuthentication.authenticateAsync as any).mockResolvedValue({ success: true });

      const domain = {
        name: 'AXT Test App',
        version: '1',
        chainId: 1,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      };
      const types = {
        Mail: [
          { name: 'from', type: 'address' },
          { name: 'contents', type: 'string' },
        ],
      };
      const value = {
        from: EXPECTED_ADDRESS_0,
        contents: 'Test message',
      };

      const sig = await authService.signTypedDataBiometric(domain, types, value);
      expect(sig).toMatch(/^0x[a-fA-F0-9]{130}$/);
    });
  });
});
