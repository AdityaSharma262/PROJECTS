import * as SecureStore from 'expo-secure-store';
import { ISecureStorage } from './interface';

/**
 * Android implementation of ISecureStorage using Expo SecureStore.
 * SecureStore uses SharedPreferences encrypted via Android Keystore.
 * 
 * IMPORTANT: SecureStore values on Android are limited to ~2KB. 
 * Only small cryptographic key material (like the Device Key) should be stored here,
 * never full JSON vault structures.
 */
class AndroidSecureStorage implements ISecureStorage {
  async setItem(key: string, value: string, requireBiometrics: boolean = false): Promise<void> {
    await SecureStore.setItemAsync(key, value, {
      requireAuthentication: requireBiometrics,
    });
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      // Keystore key invalidated (e.g. device credential change). Return null — caller must handle recovery.
      return null;
    }
  }

  async deleteItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  }
}

export const secureStorage = new AndroidSecureStorage();
