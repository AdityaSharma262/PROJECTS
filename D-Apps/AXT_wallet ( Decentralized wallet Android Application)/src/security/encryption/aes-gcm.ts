// @ts-ignore
import { gcm } from '@noble/ciphers/aes';

export const AAD = new TextEncoder().encode("AXT_VAULT_V1");

/**
 * Encrypts a plaintext payload using AES-256-GCM.
 * @param plaintext The payload to encrypt (Uint8Array).
 * @param key The 32-byte encryption key (MEK).
 * @param nonce The 12-byte random nonce.
 * @returns Object containing the ciphertext and 16-byte authentication tag.
 */
export function encryptAESGCM(plaintext: Uint8Array, key: Uint8Array, nonce: Uint8Array): { ciphertext: Uint8Array, tag: Uint8Array } {
  if (key.length !== 32) throw new Error("Encryption key must be 32 bytes for AES-256");
  if (nonce.length !== 12) throw new Error("Nonce must be 12 bytes for AES-GCM");

  // In @noble/ciphers, the tag is appended to the ciphertext output.
  // We need to separate it to match our JSON vault format requirement.
  const cipher = gcm(key, nonce, AAD);
  const encryptedPayload = cipher.encrypt(plaintext);
  
  // Tag is the last 16 bytes
  const ciphertext = encryptedPayload.slice(0, -16);
  const tag = encryptedPayload.slice(-16);

  return { ciphertext, tag };
}

/**
 * Decrypts a payload using AES-256-GCM.
 * @param ciphertext The encrypted payload without the tag.
 * @param key The 32-byte encryption key (MEK).
 * @param nonce The 12-byte nonce used during encryption.
 * @param tag The 16-byte authentication tag.
 * @returns The decrypted plaintext (Uint8Array).
 */
export function decryptAESGCM(ciphertext: Uint8Array, key: Uint8Array, nonce: Uint8Array, tag: Uint8Array): Uint8Array {
  if (key.length !== 32) throw new Error("Decryption key must be 32 bytes for AES-256");
  if (nonce.length !== 12) throw new Error("Nonce must be 12 bytes for AES-GCM");
  if (tag.length !== 16) throw new Error("Tag must be 16 bytes for AES-GCM");

  const cipher = gcm(key, nonce, AAD);
  
  // Re-combine ciphertext and tag for @noble/ciphers decryption
  const payloadToDecrypt = new Uint8Array(ciphertext.length + tag.length);
  payloadToDecrypt.set(ciphertext, 0);
  payloadToDecrypt.set(tag, ciphertext.length);

  try {
    return cipher.decrypt(payloadToDecrypt);
  } catch {
    // We throw a generic error to prevent oracle attacks and to mask internal decryption failure reasons
    throw new Error('Decryption failed: Invalid key, modified ciphertext, or corrupted data.');
  }
}
