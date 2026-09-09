import { JsonRpcProvider } from 'ethers';
import {
  NetworkConfig,
  AddCustomNetworkInput,
  NetworkValidationResult,
} from './network.types';
import { customNetworkStorage } from '../../storage/custom-network-storage';
import { DEFAULT_NETWORKS } from './networks';

export function isSafeHttpUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;
  const trimmed = urlStr.trim().toLowerCase();

  // Reject dangerous protocols explicitly
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('file:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return false;
  }

  // Must start with http:// or https://
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false;
  }

  try {
    const parsed = new URL(urlStr.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export class NetworkService {
  /**
   * Validates an RPC URL by attempting to connect and verifying that the returned chainId
   * strictly matches the expected chain ID provided by the user.
   */
  async validateRpcAndChainId(
    rpcUrl: string,
    expectedChainId: number
  ): Promise<NetworkValidationResult> {
    const trimmedUrl = rpcUrl?.trim();

    if (!trimmedUrl) {
      return { isValid: false, error: 'RPC URL is required.' };
    }

    if (!isSafeHttpUrl(trimmedUrl)) {
      return { isValid: false, error: 'RPC URL must start with http:// or https://' };
    }

    if (!expectedChainId || expectedChainId <= 0 || !Number.isInteger(expectedChainId)) {
      return { isValid: false, error: 'Chain ID must be a positive integer.' };
    }

    let timeoutId: NodeJS.Timeout | undefined;
    try {
      // Connect to RPC with a 8-second timeout
      const provider = new JsonRpcProvider(trimmedUrl);

      const networkPromise = provider.getNetwork();
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('RPC connection timed out.')), 8000);
      });

      const network = await Promise.race([networkPromise, timeoutPromise]);
      clearTimeout(timeoutId);

      const actualChainId = Number(network.chainId);

      if (actualChainId !== expectedChainId) {
        return {
          isValid: false,
          actualChainId,
          error: `Chain ID mismatch: RPC reported Chain ID ${actualChainId}, but you entered ${expectedChainId}.`,
        };
      }

      return {
        isValid: true,
        actualChainId,
      };
    } catch (err: any) {
      if (timeoutId) clearTimeout(timeoutId);
      return {
        isValid: false,
        error:
          err?.message?.includes('timed out')
            ? 'RPC connection timed out. Please verify the URL.'
            : `Could not connect to RPC: ${err?.message || 'Connection failed.'}`,
      };
    }
  }

  /**
   * Validates that the chain ID is not a duplicate of an existing network.
   */
  async isDuplicateChainId(chainId: number, existingCustomNetworks?: NetworkConfig[]): Promise<boolean> {
    const isDefault = DEFAULT_NETWORKS.some((n) => n.chainId === chainId);
    if (isDefault) return true;

    const custom = existingCustomNetworks || (await customNetworkStorage.getCustomNetworks());
    return custom.some((n) => n.chainId === chainId);
  }

  /**
   * Constructs a complete NetworkConfig from user input.
   */
  buildCustomNetworkConfig(input: AddCustomNetworkInput): NetworkConfig {
    const symbol = input.symbol.trim().toUpperCase();
    const name = input.name.trim();

    const cleanExplorer = input.explorerUrl?.trim();
    const explorerUrl = cleanExplorer && isSafeHttpUrl(cleanExplorer) ? cleanExplorer : undefined;

    return {
      chainId: input.chainId,
      name,
      shortName: symbol || name.slice(0, 8),
      nativeCurrency: {
        name: `${name} Native`,
        symbol,
        decimals: input.decimals ?? 18,
      },
      rpcUrl: input.rpcUrl.trim(),
      explorerUrl,
      isTestnet: false, // Custom networks treated as general EVM chains
      isDefault: false,
      isCustom: true,
    };
  }
}

export const networkService = new NetworkService();
