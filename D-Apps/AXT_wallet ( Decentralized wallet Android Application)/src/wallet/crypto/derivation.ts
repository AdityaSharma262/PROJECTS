import { HDNodeWallet } from 'ethers';
import { DerivedWallet } from '../types';

export const DEFAULT_DERIVATION_PATH = "m/44'/60'/0'/0/0";

/**
 * Constructs the standard BIP-44 Ethereum derivation path for a specific account index.
 * e.g. index 0 -> m/44'/60'/0'/0/0
 *      index 1 -> m/44'/60'/0'/0/1
 *      index n -> m/44'/60'/0'/0/n
 */
export function getDerivationPathForIndex(accountIndex: number): string {
  if (accountIndex < 0 || !Number.isInteger(accountIndex)) {
    throw new Error(`Invalid account index: ${accountIndex}. Must be a non-negative integer.`);
  }
  return `m/44'/60'/0'/0/${accountIndex}`;
}

/**
 * Derives an EVM wallet address from a given mnemonic and derivation path.
 * 
 * @param mnemonic The valid BIP-39 mnemonic phrase.
 * @param path The derivation path (defaults to standard Ethereum path).
 * @returns A DerivedWallet object containing the address and path.
 */
export function deriveEVMAddress(mnemonic: string, path: string = DEFAULT_DERIVATION_PATH): DerivedWallet {
  // We use HDNodeWallet from ethers to create a wallet instance from the mnemonic and path.
  // This operation happens entirely in memory and the private key is never exposed.
  const hdNode = HDNodeWallet.fromPhrase(mnemonic, undefined, path);
  
  return {
    address: hdNode.address,
    derivationPath: path,
  };
}
