import AsyncStorage from '@react-native-async-storage/async-storage';

export const APP_STORAGE_KEYS = {
  WALLET_VAULT: 'AXT_WALLET_VAULT_V1',
  WALLET_METADATA: 'AXT_WALLET_METADATA',
};

/**
 * Plaintext application storage (AsyncStorage).
 * Used for persisting non-sensitive metadata and the ENCRYPTED vault payload.
 * The underlying data is accessible if the device is rooted or unlocked,
 * so no raw key material should be placed here.
 */
export const appStorage = {
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  },

  async deleteItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
};
