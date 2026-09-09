import { Mnemonic, Wallet } from 'ethers';

/**
 * Generates a secure BIP-39 mnemonic phrase using cryptographically secure randomness.
 * @returns A string containing the mnemonic phrase.
 */
export function generateMnemonic(): string {
  // Wallet.createRandom() uses secure randomness under the hood (relies on crypto.getRandomValues)
  const wallet = Wallet.createRandom();
  if (!wallet.mnemonic) {
    throw new Error('Failed to generate mnemonic');
  }
  return wallet.mnemonic.phrase;
}

/**
 * Validates a given mnemonic phrase to ensure it conforms to BIP-39 and has a valid checksum.
 * @param phrase The mnemonic phrase to validate.
 * @returns True if valid, false otherwise.
 */
export function validateMnemonic(phrase: string): boolean {
  try {
    return Mnemonic.isValidMnemonic(phrase);
  } catch {
    return false;
  }
}

/**
 * Normalizes a mnemonic phrase by stripping leading/trailing whitespace,
 * converting all characters to lowercase, and reducing multiple spaces/newlines/tabs to a single space.
 * @param phrase The raw mnemonic input
 * @returns The normalized mnemonic phrase
 */
export function normalizeMnemonic(phrase: string): string {
  if (!phrase) return '';
  return phrase.trim().toLowerCase().replace(/\s+/g, ' ');
}

export type MnemonicValidationResult = 
  | { isValid: true; normalizedPhrase: string }
  | { isValid: false; error: string };

/**
 * Validates a mnemonic phrase and returns specific user-friendly error messages if invalid.
 * Also returns the safely normalized phrase if valid.
 * @param phrase The raw mnemonic input
 */
export function validateMnemonicWithReason(phrase: string): MnemonicValidationResult {
  const normalized = normalizeMnemonic(phrase);
  if (!normalized) {
    return { isValid: false, error: 'Enter your recovery phrase.' };
  }

  const wordCount = normalized.split(' ').length;
  if (![12, 15, 18, 21, 24].includes(wordCount)) {
    return { isValid: false, error: 'Recovery phrase must contain 12, 15, 18, 21, or 24 words.' };
  }

  if (!validateMnemonic(normalized)) {
    return { isValid: false, error: 'This recovery phrase is not valid. Please check the words and try again.' };
  }

  return { isValid: true, normalizedPhrase: normalized };
}
