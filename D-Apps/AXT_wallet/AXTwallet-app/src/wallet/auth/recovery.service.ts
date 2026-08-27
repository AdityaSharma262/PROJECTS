import { getVaultMetadata, deleteVault, createVault } from '../vault/vault.service';
import { deriveEVMAddress } from '../crypto/derivation';
import { validateMnemonic } from '../crypto/mnemonic';

/**
 * Recovers a wallet when the user forgets their PIN.
 * Ownership Verification: Proves the provided phrase corresponds to the locally stored wallet.
 * 
 * @param mnemonic The 12-word recovery phrase
 * @param newPin The new PIN to encrypt the new vault
 */
export async function recoverWallet(mnemonic: string, newPin: string): Promise<void> {
  if (!validateMnemonic(mnemonic)) {
    throw new Error("Invalid recovery phrase.");
  }

  const meta = await getVaultMetadata();
  if (!meta) {
    throw new Error("No local wallet found to recover.");
  }

  // Derive the EVM address from the provided phrase
  const derivedWallet = deriveEVMAddress(mnemonic);
  
  // Ownership verification check
  if (derivedWallet.address.toLowerCase() !== meta.address.toLowerCase()) {
    throw new Error("Recovery phrase does not match the stored wallet.");
  }

  // Verification passed. The user owns this wallet.
  // We can safely destroy the old vault (since they forgot the PIN) and create a new one.
  await deleteVault();
  await createVault(mnemonic, newPin);
}
