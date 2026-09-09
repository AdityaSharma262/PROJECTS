// @ts-ignore - noble/hashes does not ship separate type declarations for subpaths in all environments
import { pbkdf2Async } from '@noble/hashes/pbkdf2';
// @ts-ignore
import { hkdf } from '@noble/hashes/hkdf';
// @ts-ignore
import { sha256 } from '@noble/hashes/sha2';

/**
 * Derives a key from a PIN (or password) using PBKDF2-HMAC-SHA256.
 * @param pin The user's PIN (plaintext string).
 * @param salt The 16-byte random salt.
 * @param iterations The configurable work factor.
 * @returns 32-byte derived key.
 */
export async function derivePINKey(pin: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const pinBytes = new TextEncoder().encode(pin);
  // Using 32 bytes (256-bit) as the required output length
  return pbkdf2Async(sha256, pinBytes, salt, { c: iterations, dkLen: 32 });
}

/**
 * Derives the Master Encryption Key (MEK) using HKDF-SHA256.
 * IKM is constructed by concatenating the Device Key (DK) and the PIN Key (PK).
 * 
 * @param dk The 32-byte Device Key (from SecureStore).
 * @param pk The 32-byte PIN-derived Key.
 * @param salt The same 16-byte salt used for PBKDF2.
 * @returns 32-byte Master Encryption Key.
 */
export function deriveMasterKey(dk: Uint8Array, pk: Uint8Array, salt: Uint8Array): Uint8Array {
  // IKM = DK || PK
  const ikm = new Uint8Array(dk.length + pk.length);
  ikm.set(dk, 0);
  ikm.set(pk, dk.length);

  const info = new TextEncoder().encode("AXT_WALLET_V1_MEK");

  return hkdf(sha256, ikm, salt, info, 32);
}
