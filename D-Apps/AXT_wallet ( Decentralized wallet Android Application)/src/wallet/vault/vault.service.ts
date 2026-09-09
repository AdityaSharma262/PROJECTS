import { secureStorage } from '../../security/secure-storage';
import { appStorage, APP_STORAGE_KEYS } from '../../storage/app-storage';
import { derivePINKey, deriveMasterKey, encryptAESGCM, decryptAESGCM } from '../../security/encryption';
import { EncryptedVaultPayload } from './vault.types';
import { deriveEVMAddress } from '../crypto/derivation';
// NOTE: react-native-get-random-values is imported in src/app/_layout.tsx which
// polyfills globalThis.crypto.getRandomValues before any other module runs.
// Do NOT add a require('crypto') fallback here — Node stdlib is not available in React Native.

export const CURRENT_VAULT_VERSION = 1;
// 250,000 iterations blocks the JS thread for too long in unoptimized development builds
export const CURRENT_PBKDF2_ITERATIONS = (typeof __DEV__ !== 'undefined' && __DEV__) ? 10000 : 250000;
export const DK_SECURE_STORE_KEY = 'AXT_WALLET_DK_V1';

// Base64 Helpers
// React Native doesn't have native btoa/atob that handle binary arrays cleanly without polyfills,
// so we provide basic Uint8Array to/from Base64 utilities.
function bytesToBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
  return btoa(binString);
}
function base64ToBytes(base64: string): Uint8Array {
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.codePointAt(0)!);
}

function generateRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  // globalThis.crypto is guaranteed by the react-native-get-random-values polyfill.
  globalThis.crypto.getRandomValues(array);
  return array;
}

/**
 * Creates and stores a new encrypted vault.
 * 
 * Flow:
 * 1. Generates 32-byte Device Key (DK) and saves to SecureStore.
 * 2. Generates 16-byte KDF salt.
 * 3. Derives PK from PIN + salt.
 * 4. Derives MEK from DK + PK.
 * 5. Generates 12-byte encryption nonce.
 * 6. Encrypts mnemonic using AES-256-GCM.
 * 7. Stores the resulting JSON vault payload to AppStorage.
 */
export async function createVault(mnemonic: string, pin: string): Promise<void> {
  // 1. Generate and store DK
  const dk = generateRandomBytes(32);
  await secureStorage.setItem(DK_SECURE_STORE_KEY, bytesToBase64(dk));

  // 2. KDF Parameters
  const salt = generateRandomBytes(16);
  const iterations = CURRENT_PBKDF2_ITERATIONS;

  // 3. Derive PK
  const pk = await derivePINKey(pin, salt, iterations);

  // 4. Derive MEK
  const mek = deriveMasterKey(dk, pk, salt);

  // 5 & 6. Encrypt Mnemonic
  const nonce = generateRandomBytes(12);
  const mnemonicBytes = new TextEncoder().encode(mnemonic);
  const { ciphertext, tag } = encryptAESGCM(mnemonicBytes, mek, nonce);

  // 7. Construct Vault Format and Save
  const vaultPayload: EncryptedVaultPayload = {
    version: CURRENT_VAULT_VERSION,
    kdf: {
      algorithm: "PBKDF2-HMAC-SHA256",
      salt: bytesToBase64(salt),
      iterations,
    },
    encryption: {
      algorithm: "AES-256-GCM",
      nonce: bytesToBase64(nonce),
      tag: bytesToBase64(tag),
    },
    ciphertext: bytesToBase64(ciphertext)
  };

  await appStorage.setItem(APP_STORAGE_KEYS.WALLET_VAULT, JSON.stringify(vaultPayload));

  // 8. Derive and store public metadata (Address)
  const derivedWallet = deriveEVMAddress(mnemonic);
  await appStorage.setItem(APP_STORAGE_KEYS.WALLET_METADATA, JSON.stringify({
    address: derivedWallet.address
  }));
}

/**
 * Retrieves the stored public metadata for the wallet.
 */
export async function getVaultMetadata(): Promise<{ address: string } | null> {
  const metaJson = await appStorage.getItem(APP_STORAGE_KEYS.WALLET_METADATA);
  if (!metaJson) return null;
  return JSON.parse(metaJson);
}

function validateVaultPayload(payload: any): payload is EncryptedVaultPayload {
  return Boolean(
    payload &&
    typeof payload === 'object' &&
    payload.version === CURRENT_VAULT_VERSION &&
    payload.kdf &&
    typeof payload.kdf.salt === 'string' &&
    typeof payload.kdf.iterations === 'number' &&
    payload.encryption &&
    typeof payload.encryption.nonce === 'string' &&
    typeof payload.encryption.tag === 'string' &&
    typeof payload.ciphertext === 'string'
  );
}

/**
 * Unlocks the vault using the user's PIN.
 * 
 * Flow:
 * 1. Load DK from SecureStore. (Fails if Keystore is wiped).
 * 2. Load Vault JSON from AppStorage.
 * 3. Validate structural integrity of vault payload.
 * 4. Extract salt, nonce, tag, ciphertext.
 * 5. Derive PK from PIN + salt.
 * 6. Derive MEK from DK + PK.
 * 7. Decrypt ciphertext using MEK. (Throws if wrong PIN or corrupted tag).
 */
export async function unlockVault(pin: string): Promise<string> {
  // Load material
  const dkBase64 = await secureStorage.getItem(DK_SECURE_STORE_KEY);
  if (!dkBase64) throw new Error("Device Key missing. Keystore may have been cleared.");
  const dk = base64ToBytes(dkBase64);

  const vaultJson = await appStorage.getItem(APP_STORAGE_KEYS.WALLET_VAULT);
  if (!vaultJson) throw new Error("Wallet vault not found.");

  let vault: any;
  try {
    vault = JSON.parse(vaultJson);
  } catch {
    throw new Error("Corrupted vault payload: invalid JSON.");
  }

  if (!validateVaultPayload(vault)) {
    throw new Error("Corrupted vault payload: missing required cryptographic parameters.");
  }

  const salt = base64ToBytes(vault.kdf.salt);
  const nonce = base64ToBytes(vault.encryption.nonce);
  const tag = base64ToBytes(vault.encryption.tag);
  const ciphertext = base64ToBytes(vault.ciphertext);

  // Derive keys
  const pk = await derivePINKey(pin, salt, vault.kdf.iterations);
  const mek = deriveMasterKey(dk, pk, salt);

  // Decrypt
  const plaintextBytes = decryptAESGCM(ciphertext, mek, nonce, tag);
  return new TextDecoder().decode(plaintextBytes);
}

/**
 * Securely encrypts and stores an imported private key.
 * Tied to the specific accountId and protected with the same DK + PIN architecture.
 */
export async function storeImportedAccountKey(
  accountId: string,
  privateKey: string,
  pin: string
): Promise<void> {
  const dkBase64 = await secureStorage.getItem(DK_SECURE_STORE_KEY);
  if (!dkBase64) throw new Error("Device Key missing. Keystore may have been cleared.");
  const dk = base64ToBytes(dkBase64);

  const salt = generateRandomBytes(16);
  const iterations = CURRENT_PBKDF2_ITERATIONS;

  const pk = await derivePINKey(pin, salt, iterations);
  const mek = deriveMasterKey(dk, pk, salt);

  const nonce = generateRandomBytes(12);
  const pkBytes = new TextEncoder().encode(privateKey);
  const { ciphertext, tag } = encryptAESGCM(pkBytes, mek, nonce);

  const vaultPayload: EncryptedVaultPayload = {
    version: CURRENT_VAULT_VERSION,
    kdf: {
      algorithm: "PBKDF2-HMAC-SHA256",
      salt: bytesToBase64(salt),
      iterations,
    },
    encryption: {
      algorithm: "AES-256-GCM",
      nonce: bytesToBase64(nonce),
      tag: bytesToBase64(tag),
    },
    ciphertext: bytesToBase64(ciphertext),
  };

  const key = `${APP_STORAGE_KEYS.IMPORTED_VAULT_PREFIX}${accountId}`;
  await appStorage.setItem(key, JSON.stringify(vaultPayload));
}

/**
 * Decrypts an imported private key using the PIN.
 */
export async function unlockImportedAccountKey(
  accountId: string,
  pin: string
): Promise<string> {
  const dkBase64 = await secureStorage.getItem(DK_SECURE_STORE_KEY);
  if (!dkBase64) throw new Error("Device Key missing. Keystore may have been cleared.");
  const dk = base64ToBytes(dkBase64);

  const key = `${APP_STORAGE_KEYS.IMPORTED_VAULT_PREFIX}${accountId}`;
  const vaultJson = await appStorage.getItem(key);
  if (!vaultJson) throw new Error("Imported account credentials not found in vault.");

  let vault: any;
  try {
    vault = JSON.parse(vaultJson);
  } catch {
    throw new Error("Corrupted imported vault payload: invalid JSON.");
  }

  if (!validateVaultPayload(vault)) {
    throw new Error("Corrupted imported vault payload: missing required cryptographic parameters.");
  }

  const salt = base64ToBytes(vault.kdf.salt);
  const nonce = base64ToBytes(vault.encryption.nonce);
  const tag = base64ToBytes(vault.encryption.tag);
  const ciphertext = base64ToBytes(vault.ciphertext);

  const pk = await derivePINKey(pin, salt, vault.kdf.iterations);
  const mek = deriveMasterKey(dk, pk, salt);

  const plaintextBytes = decryptAESGCM(ciphertext, mek, nonce, tag);
  return new TextDecoder().decode(plaintextBytes);
}

/**
 * Permanently removes an imported account's encrypted credentials.
 */
export async function deleteImportedAccountKey(accountId: string): Promise<void> {
  const key = `${APP_STORAGE_KEYS.IMPORTED_VAULT_PREFIX}${accountId}`;
  await appStorage.deleteItem(key);
}

/**
 * Permanently deletes the wallet vault and device key.
 */
export async function deleteVault(): Promise<void> {
  await secureStorage.deleteItem(DK_SECURE_STORE_KEY);
  await appStorage.deleteItem(APP_STORAGE_KEYS.WALLET_VAULT);
  await appStorage.deleteItem(APP_STORAGE_KEYS.WALLET_METADATA);
}
