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
  error?: string;
}

export class EVMProviderService {
  private provider: JsonRpcProvider | null = null;
  private activeNetwork: NetworkConfig | null = null;

  /**
   * Initialize the provider for a given network configuration.
   * Makes a real eth_chainId RPC call to verify the endpoint is reachable and
   * that the remote chain ID matches our configuration.
   */
  async initialize(network: NetworkConfig): Promise<ProviderVerificationResult> {
    // Destroy previous instance before creating a new one
    this.destroy();

    try {
      // Do NOT use staticNetwork — we need a real RPC call to verify the endpoint
      this.provider = new JsonRpcProvider(network.rpcUrl);

      // This makes a real eth_chainId RPC call. If the endpoint is unreachable, it throws here.
      const remoteNetwork = await this.provider.getNetwork();
      const remoteChainId = Number(remoteNetwork.chainId);

      if (__DEV__) {
        console.log(`[EVMProvider] Connected to ${network.name} — remote chainId: ${remoteChainId}`);
      }

      if (remoteChainId !== network.chainId) {
        if (__DEV__) {
          console.warn(`[EVMProvider] Chain ID mismatch: expected ${network.chainId}, got ${remoteChainId}`);
        }
        this.provider = null;
        this.activeNetwork = null;
        return {
          success: false,
          error: `Chain ID mismatch: expected ${network.chainId}, got ${remoteChainId}.`,
        };
      }

      this.activeNetwork = network;
      return { success: true, chainId: remoteChainId };
    } catch (err) {
      if (__DEV__) {
        // Log the full error in dev for diagnostics — no secrets involved
        console.warn('[EVMProvider] initialize() failed:', err);
      }
      this.provider = null;
      this.activeNetwork = null;
      return { success: false, error: 'Unable to connect to the network.' };
    }
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

  isConnected(): boolean {
    return this.provider !== null;
  }

  /**
   * Destroys the current provider instance.
   */
  destroy(): void {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
      this.activeNetwork = null;
    }
  }
}

/**
 * Singleton provider service instance.
 * The UI layer must not import 'ethers' directly.
 */
export const evmProviderService = new EVMProviderService();
