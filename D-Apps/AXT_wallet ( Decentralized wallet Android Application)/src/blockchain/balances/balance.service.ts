import { isAddress, formatEther } from 'ethers';
import { EVMProviderService } from '../providers/provider.service';
import { NetworkConfig } from '../networks/network.types';

/**
 * SECURITY RULES (DO NOT VIOLATE):
 * - This service only receives a public wallet address.
 * - No mnemonic, private key, PIN, DK, PK, or MEK is ever accepted or used here.
 * - Balance data is read-only. No transactions are constructed or signed.
 */

export interface BalanceModel {
  /** Raw balance in wei (as bigint, to avoid precision loss) */
  rawWei: bigint;
  /** Human-readable formatted balance e.g. "0.5" */
  formatted: string;
  /** Native token symbol e.g. "ETH" or "tBNB" */
  symbol: string;
  /** Chain ID of the network the balance was fetched from */
  chainId: number;
  /** ISO timestamp of when the balance was last updated */
  lastUpdatedAt: string;
}

export interface BalanceResult {
  success: boolean;
  balance?: BalanceModel;
  error?: string;
}

export class NativeBalanceService {
  constructor(private readonly providerService: EVMProviderService) {}

  /**
   * Fetches the native token balance for a given wallet address.
   *
   * @param address - A valid EVM wallet address (public, not sensitive)
   * @param network - The network configuration to use
   */
  async getBalance(address: string, network: NetworkConfig): Promise<BalanceResult> {
    // 1. Validate address before making any RPC call
    if (!isAddress(address)) {
      return { success: false, error: 'Invalid wallet address.' };
    }

    if (!this.providerService.isConnected()) {
      return { success: false, error: 'Not connected to network.' };
    }

    try {
      const provider = this.providerService.getProvider();

      // Fetch raw balance in wei (bigint — no floating point)
      const rawWei = await provider.getBalance(address);

      // formatEther converts wei → ETH string safely (no float precision loss)
      const formatted = formatEther(rawWei);

      const balance: BalanceModel = {
        rawWei,
        formatted,
        symbol: network.nativeCurrency.symbol,
        chainId: network.chainId,
        lastUpdatedAt: new Date().toISOString(),
      };

      return { success: true, balance };
    } catch (err) {
      if (__DEV__) console.warn('[BalanceService] getBalance() threw:', err);
      // Never expose raw RPC error details to the caller or to logs
      return { success: false, error: 'Unable to fetch balance. Please try again.' };
    }
  }
}
