import { JsonRpcProvider } from 'ethers';
import { NetworkConfig } from '../networks/network.types';

/**
 * SECURITY RULES (DO NOT VIOLATE):
 * - This service is strictly READ-ONLY.
 * - No Signer is created. No private key is accepted or held.
 * - No mnemonic, PIN, Device Key, PK, or MEK is ever passed here.
 * - Only a public wallet address is used in RPC requests.
 * - RPC errors must not expose sensitive application information to logs or UI.
 */

export interface ProviderVerificationResult {
  success: boolean;
  chainId?: number;
  isFallback?: boolean;
  rpcUrl?: string;
  error?: string;
}

export class EVMProviderService {
  private provider: JsonRpcProvider | null = null;
  private activeNetwork: NetworkConfig | null = null;
  private currentRpcUrl: string | null = null;

  /**
   * Attempts to connect to an individual RPC endpoint with a timeout and verifies chain ID.
   */
  private async testEndpoint(
    url: string,
    expectedChainId: number,
    timeoutMs: number = 7000
  ): Promise<{ success: boolean; provider?: JsonRpcProvider; chainId?: number; error?: string }> {
    let timeoutId: NodeJS.Timeout | undefined;
    try {
      const p = new JsonRpcProvider(url);
      const networkPromise = p.getNetwork();
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('RPC connection timed out.')), timeoutMs);
      });

      const remoteNetwork = await Promise.race([networkPromise, timeoutPromise]);
      if (timeoutId) clearTimeout(timeoutId);

      const remoteChainId = Number(remoteNetwork.chainId);

      if (remoteChainId !== expectedChainId) {
        p.destroy();
        return {
          success: false,
          error: `Chain ID mismatch: expected ${expectedChainId}, got ${remoteChainId}.`,
        };
      }

      return { success: true, provider: p, chainId: remoteChainId };
    } catch (err: any) {
      if (timeoutId) clearTimeout(timeoutId);
      return { success: false, error: err?.message || 'Connection failed.' };
    }
  }

  /**
   * Initializes the provider for a given network configuration.
   * Priority:
   * 1. Primary Alchemy RPC (`network.rpcUrl`)
   * 2. Automatic Fallback Public RPC (`network.fallbackRpcUrl`) if primary is unreachable.
   */
  async initialize(network: NetworkConfig): Promise<ProviderVerificationResult> {
    // If already connected to this network and provider is alive, reuse existing provider
    if (this.provider && this.activeNetwork?.chainId === network.chainId) {
      return {
        success: true,
        chainId: network.chainId,
        isFallback: this.isUsingFallback(),
        rpcUrl: this.currentRpcUrl || network.rpcUrl,
      };
    }

    // Destroy previous instance before creating a new one
    this.destroy();

    // 1. Attempt Primary Alchemy RPC
    if (__DEV__) {
      console.log(`[EVMProvider] Connecting to primary RPC for ${network.name}: ${network.rpcUrl}`);
    }

    const primaryResult = await this.testEndpoint(network.rpcUrl, network.chainId);

    if (primaryResult.success && primaryResult.provider) {
      this.provider = primaryResult.provider;
      this.activeNetwork = network;
      this.currentRpcUrl = network.rpcUrl;

      if (__DEV__) {
        console.log(`[EVMProvider] Connected to primary RPC for ${network.name} (Chain ID: ${primaryResult.chainId})`);
      }

      return {
        success: true,
        chainId: primaryResult.chainId,
        isFallback: false,
        rpcUrl: network.rpcUrl,
      };
    }

    // 2. Primary failed — check for automatic fallback public RPC
    if (network.fallbackRpcUrl) {
      if (__DEV__) {
        console.warn(
          `[EVMProvider] Primary RPC failed (${primaryResult.error}). Attempting automatic fallback to: ${network.fallbackRpcUrl}`
        );
      }

      const fallbackResult = await this.testEndpoint(network.fallbackRpcUrl, network.chainId);

      if (fallbackResult.success && fallbackResult.provider) {
        this.provider = fallbackResult.provider;
        this.activeNetwork = network;
        this.currentRpcUrl = network.fallbackRpcUrl;

        if (__DEV__) {
          console.log(
            `[EVMProvider] Connected to fallback RPC for ${network.name} (Chain ID: ${fallbackResult.chainId})`
          );
        }

        return {
          success: true,
          chainId: fallbackResult.chainId,
          isFallback: true,
          rpcUrl: network.fallbackRpcUrl,
        };
      }
    }

    // 3. Both endpoints failed
    this.destroy();
    return {
      success: false,
      error: `Unable to connect to primary or fallback RPC for ${network.name}.`,
    };
  }

  /**
   * Attempts automatic failover to the configured fallback RPC if currently on primary.
   */
  async failoverToFallback(): Promise<boolean> {
    if (!this.activeNetwork || !this.activeNetwork.fallbackRpcUrl) {
      return false;
    }

    if (this.currentRpcUrl === this.activeNetwork.fallbackRpcUrl) {
      return false; // Already on fallback
    }

    if (__DEV__) {
      console.warn(`[EVMProvider] Triggering automatic runtime failover to fallback RPC: ${this.activeNetwork.fallbackRpcUrl}`);
    }

    const fallbackResult = await this.testEndpoint(
      this.activeNetwork.fallbackRpcUrl,
      this.activeNetwork.chainId
    );

    if (fallbackResult.success && fallbackResult.provider) {
      if (this.provider) this.provider.destroy();
      this.provider = fallbackResult.provider;
      this.currentRpcUrl = this.activeNetwork.fallbackRpcUrl;
      return true;
    }

    return false;
  }

  /**
   * Returns the initialized provider.
   * Throws if the provider has not been initialized or connection failed.
   */
  getProvider(): JsonRpcProvider {
    if (!this.provider) {
      throw new Error('Provider not initialized. Call initialize() first.');
    }
    return this.provider;
  }

  getActiveNetwork(): NetworkConfig | null {
    return this.activeNetwork;
  }

  getCurrentRpcUrl(): string | null {
    return this.currentRpcUrl;
  }

  isUsingFallback(): boolean {
    return (
      !!this.activeNetwork?.fallbackRpcUrl &&
      this.currentRpcUrl === this.activeNetwork.fallbackRpcUrl
    );
  }

  isConnected(): boolean {
    return this.provider !== null;
  }

  /**
   * Convenience helper to switch active network.
   */
  async setNetwork(network: NetworkConfig): Promise<ProviderVerificationResult> {
    return this.initialize(network);
  }

  /**
   * Destroys the current provider instance.
   */
  destroy(): void {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
      this.activeNetwork = null;
      this.currentRpcUrl = null;
    }
  }
}

/**
 * Singleton provider service instance.
 * The UI layer must not import 'ethers' directly.
 */
export const evmProviderService = new EVMProviderService();
