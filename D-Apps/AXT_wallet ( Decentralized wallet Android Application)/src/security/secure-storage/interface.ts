export interface ISecureStorage {
  /**
   * Securely store a string value.
   * @param key Identifier for the value.
   * @param value The plaintext value to store.
   * @param requireBiometrics Optional: If true, retrieval requires OS biometric auth.
   */
  setItem(key: string, value: string, requireBiometrics?: boolean): Promise<void>;
  
  /**
   * Retrieve a securely stored string.
   * @param key Identifier for the value.
   * @returns The value, or null if it doesn't exist.
   */
  getItem(key: string): Promise<string | null>;

  /**
   * Securely delete a stored value.
   * @param key Identifier for the value.
   */
  deleteItem(key: string): Promise<void>;
}
