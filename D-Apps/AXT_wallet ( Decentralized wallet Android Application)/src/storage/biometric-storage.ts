import { secureStorage } from '../security/secure-storage';
import { appStorage } from './app-storage';

export const BIOMETRIC_STORAGE_KEYS = {
  ENABLED: 'AXT_BIOMETRIC_ENABLED_V1',
  CREDENTIAL: 'AXT_BIOMETRIC_VAULT_CREDENTIAL_V1',
};

export const biometricStorage = {
  /**
   * Checks if biometric authentication has been explicitly enabled by the user.
   */
  async isBiometricEnabled(): Promise<boolean> {
    const val = await appStorage.getItem(BIOMETRIC_STORAGE_KEYS.ENABLED);
    return val === 'true';
  },

  /**
   * Sets the biometric enabled status flag.
   */
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    if (enabled) {
      await appStorage.setItem(BIOMETRIC_STORAGE_KEYS.ENABLED, 'true');
    } else {
      await appStorage.deleteItem(BIOMETRIC_STORAGE_KEYS.ENABLED);
    }
  },

  /**
   * Stores the encrypted biometric authorization credential into hardware SecureStore.
   */
  async storeBiometricCredential(pin: string): Promise<void> {
    await secureStorage.setItem(BIOMETRIC_STORAGE_KEYS.CREDENTIAL, pin);
    await appStorage.setItem(BIOMETRIC_STORAGE_KEYS.ENABLED, 'true');
  },

  /**
   * Retrieves the biometric authorization credential from SecureStore.
   */
  async getBiometricCredential(): Promise<string | null> {
    return await secureStorage.getItem(BIOMETRIC_STORAGE_KEYS.CREDENTIAL);
  },

  /**
   * Clears all stored biometric credentials and flags.
   */
  async clearBiometricStorage(): Promise<void> {
    await secureStorage.deleteItem(BIOMETRIC_STORAGE_KEYS.CREDENTIAL);
    await appStorage.deleteItem(BIOMETRIC_STORAGE_KEYS.ENABLED);
  },
};
