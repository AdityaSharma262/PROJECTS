import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  NetworkConfig,
  DEFAULT_MAINNETS,
  DEFAULT_TESTNETS,
  DEFAULT_NETWORKS,
  DEFAULT_NETWORK,
  AddCustomNetworkInput,
  NetworkValidationResult,
  networkService,
} from '../blockchain/networks';
import { customNetworkStorage } from '../storage/custom-network-storage';
import { appStorage } from '../storage/app-storage';
import { evmProviderService } from '../blockchain/providers/provider.service';

interface NetworkContextValue {
  activeNetwork: NetworkConfig;
  mainnets: NetworkConfig[];
  testnets: NetworkConfig[];
  customNetworks: NetworkConfig[];
  allNetworks: NetworkConfig[];
  supportedNetworks: NetworkConfig[];
  setNetwork: (network: NetworkConfig) => void;
  addCustomNetwork: (input: AddCustomNetworkInput) => Promise<NetworkConfig>;
  updateCustomNetwork: (
    chainId: number,
    input: Partial<AddCustomNetworkInput>
  ) => Promise<NetworkConfig>;
  deleteCustomNetwork: (chainId: number) => Promise<void>;
  validateNetworkRpc: (
    rpcUrl: string,
    chainId: number
  ) => Promise<NetworkValidationResult>;
  refreshNetworks: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

const STORAGE_KEY_ACTIVE_CHAIN = 'AXT_ACTIVE_CHAIN_ID';

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [activeNetwork, setActiveNetwork] = useState<NetworkConfig>(DEFAULT_NETWORK);
  const [customNetworks, setCustomNetworks] = useState<NetworkConfig[]>([]);

  // Load custom networks and active network on mount
  const refreshNetworks = useCallback(async () => {
    try {
      const storedCustom = await customNetworkStorage.getCustomNetworks();
      setCustomNetworks(storedCustom);

      const allAvailable = [...DEFAULT_NETWORKS, ...storedCustom];

      const savedChainIdStr = await appStorage.getItem(STORAGE_KEY_ACTIVE_CHAIN);
      if (savedChainIdStr) {
        const chainId = parseInt(savedChainIdStr, 10);
        const found = allAvailable.find((n) => n.chainId === chainId);
        if (found) {
          setActiveNetwork(found);
          evmProviderService.setNetwork(found);
          return;
        }
      }

      // Default fallback
      evmProviderService.setNetwork(DEFAULT_NETWORK);
    } catch {
      evmProviderService.setNetwork(DEFAULT_NETWORK);
    }
  }, []);

  useEffect(() => {
    refreshNetworks();
  }, [refreshNetworks]);

  // Sets active network and persists choice
  const setNetwork = useCallback((network: NetworkConfig) => {
    setActiveNetwork(network);
    evmProviderService.setNetwork(network);
    appStorage.setItem(STORAGE_KEY_ACTIVE_CHAIN, network.chainId.toString()).catch(() => {});
  }, []);

  // Adds a custom network after validating RPC and chain ID
  const addCustomNetwork = useCallback(
    async (input: AddCustomNetworkInput): Promise<NetworkConfig> => {
      // 1. Check for duplicate chain ID
      const isDuplicate = await networkService.isDuplicateChainId(
        input.chainId,
        customNetworks
      );
      if (isDuplicate) {
        throw new Error(
          `A network with Chain ID ${input.chainId} already exists in your wallet.`
        );
      }

      // 2. Validate RPC connectivity and chain ID matching
      const validation = await networkService.validateRpcAndChainId(
        input.rpcUrl,
        input.chainId
      );
      if (!validation.isValid) {
        throw new Error(validation.error || 'Failed to validate custom network RPC.');
      }

      // 3. Construct and save custom network
      const config = networkService.buildCustomNetworkConfig(input);
      await customNetworkStorage.addCustomNetwork(config);
      await refreshNetworks();

      // Automatically activate new network
      setNetwork(config);
      return config;
    },
    [customNetworks, refreshNetworks, setNetwork]
  );

  // Updates an existing custom network
  const updateCustomNetwork = useCallback(
    async (
      chainId: number,
      input: Partial<AddCustomNetworkInput>
    ): Promise<NetworkConfig> => {
      // If RPC URL is changed, validate connectivity
      if (input.rpcUrl) {
        const validation = await networkService.validateRpcAndChainId(
          input.rpcUrl,
          chainId
        );
        if (!validation.isValid) {
          throw new Error(validation.error || 'RPC validation failed.');
        }
      }

      const updatedFields: Partial<NetworkConfig> = {};
      if (input.name) updatedFields.name = input.name.trim();
      if (input.symbol) {
        updatedFields.nativeCurrency = {
          name: `${input.name || 'Custom'} Native`,
          symbol: input.symbol.trim().toUpperCase(),
          decimals: input.decimals ?? 18,
        };
        updatedFields.shortName = input.symbol.trim().toUpperCase();
      }
      if (input.rpcUrl) updatedFields.rpcUrl = input.rpcUrl.trim();
      if (input.explorerUrl !== undefined) {
        updatedFields.explorerUrl = input.explorerUrl.trim() || undefined;
      }

      const updated = await customNetworkStorage.updateCustomNetwork(
        chainId,
        updatedFields
      );
      await refreshNetworks();

      if (activeNetwork.chainId === chainId) {
        setActiveNetwork(updated);
        evmProviderService.setNetwork(updated);
      }

      return updated;
    },
    [activeNetwork.chainId, refreshNetworks]
  );

  // Deletes a custom network
  const deleteCustomNetwork = useCallback(
    async (chainId: number): Promise<void> => {
      const target = customNetworks.find((n) => n.chainId === chainId);
      if (!target || !target.isCustom) {
        throw new Error('Default networks cannot be deleted.');
      }

      await customNetworkStorage.deleteCustomNetwork(chainId);
      await refreshNetworks();

      // If the deleted network was active, switch to Sepolia fallback
      if (activeNetwork.chainId === chainId) {
        setNetwork(DEFAULT_NETWORK);
      }
    },
    [customNetworks, activeNetwork.chainId, refreshNetworks, setNetwork]
  );

  // Helper validation method
  const validateNetworkRpc = useCallback(
    async (rpcUrl: string, chainId: number): Promise<NetworkValidationResult> => {
      return networkService.validateRpcAndChainId(rpcUrl, chainId);
    },
    []
  );

  const mainnets = useMemo(() => DEFAULT_MAINNETS, []);
  const testnets = useMemo(() => DEFAULT_TESTNETS, []);
  const allNetworks = useMemo(
    () => [...DEFAULT_NETWORKS, ...customNetworks],
    [customNetworks]
  );

  return (
    <NetworkContext.Provider
      value={{
        activeNetwork,
        mainnets,
        testnets,
        customNetworks,
        allNetworks,
        supportedNetworks: allNetworks,
        setNetwork,
        addCustomNetwork,
        updateCustomNetwork,
        deleteCustomNetwork,
        validateNetworkRpc,
        refreshNetworks,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextValue {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used within NetworkProvider');
  return ctx;
}
