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
