/**
 * The standard versioned encrypted vault structure.
 * This is the JSON payload stored on disk (via AsyncStorage).
 * The plaintext mnemonic is NEVER stored in this structure.
 */
export interface EncryptedVaultPayload {
  version: number;
  kdf: {
    algorithm: string;
    salt: string;       // base64
    iterations: number;
  };
  encryption: {
    algorithm: string;
    nonce: string;      // base64
    tag: string;        // base64
  };
  ciphertext: string;   // base64 (encrypted mnemonic)
}
