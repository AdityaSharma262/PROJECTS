import { appStorage } from './app-storage';
import { NetworkConfig } from '../blockchain/networks/network.types';

export const CUSTOM_NETWORK_STORAGE_KEY = 'AXT_CUSTOM_NETWORKS_V1';

/**
 * Storage layer for user-added custom EVM networks.
 * SECURITY INVARIANT:
 * - Persists only public network metadata (RPC URLs, Chain IDs, Names, Symbols).
 * - Never stores private keys or credentials.
 */
export const customNetworkStorage = {
  /**
   * Retrieves all saved custom networks from persistent storage.
   */
  async getCustomNetworks(): Promise<NetworkConfig[]> {
    try {
      const raw = await appStorage.getItem(CUSTOM_NETWORK_STORAGE_KEY);
      if (!raw) return [];
      const list: NetworkConfig[] = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },

  /**
   * Overwrites the list of saved custom networks.
   */
  async saveCustomNetworks(networks: NetworkConfig[]): Promise<void> {
    await appStorage.setItem(CUSTOM_NETWORK_STORAGE_KEY, JSON.stringify(networks));
  },

  /**
   * Adds a new custom network to storage if chain ID is not already saved.
   */
  async addCustomNetwork(network: NetworkConfig): Promise<void> {
    const list = await this.getCustomNetworks();
    const existingIndex = list.findIndex((n) => n.chainId === network.chainId);
    if (existingIndex >= 0) {
      list[existingIndex] = network;
    } else {
      list.push(network);
    }
    await this.saveCustomNetworks(list);
  },

  /**
   * Updates an existing custom network in storage.
   */
  async updateCustomNetwork(
    chainId: number,
    updatedFields: Partial<NetworkConfig>
  ): Promise<NetworkConfig> {
    const list = await this.getCustomNetworks();
    const index = list.findIndex((n) => n.chainId === chainId);
    if (index === -1) {
      throw new Error(`Custom network with Chain ID ${chainId} not found.`);
    }

    const merged: NetworkConfig = {
      ...list[index],
      ...updatedFields,
      chainId, // Immutable identifier
      isCustom: true,
      isDefault: false,
    };

    list[index] = merged;
    await this.saveCustomNetworks(list);
    return merged;
  },

  /**
   * Deletes a custom network by Chain ID.
   */
  async deleteCustomNetwork(chainId: number): Promise<void> {
    const list = await this.getCustomNetworks();
    const filtered = list.filter((n) => n.chainId !== chainId);
    await this.saveCustomNetworks(filtered);
  },

  /**
   * Clears all custom networks (e.g. on full wallet wipe).
   */
  async clear(): Promise<void> {
    await appStorage.deleteItem(CUSTOM_NETWORK_STORAGE_KEY);
  },
};
