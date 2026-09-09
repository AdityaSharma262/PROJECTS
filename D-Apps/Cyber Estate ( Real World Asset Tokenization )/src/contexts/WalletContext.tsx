import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { BrowserProvider, formatEther } from "ethers";
import { CHAIN_CONFIG } from "@/lib/contracts";

interface WalletState {
  address: string | null;
  balance: string;
  chainId: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
}

interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  shortenAddress: (addr: string) => string;
  isWrongNetwork: boolean;
}

const STORAGE_KEY = "cyberestate_wallet_connected";

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    balance: "0",
    chainId: null,
    isConnecting: false,
    isConnected: false,
    error: null,
  });

  const getProvider = useCallback(() => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
    }
    return new BrowserProvider(window.ethereum);
  }, []);

  const updateBalance = useCallback(async (address: string) => {
    try {
      const provider = getProvider();
      const balance = await provider.getBalance(address);
      setState((prev) => ({ ...prev, balance: formatEther(balance) }));
    } catch {
      // silent fail on balance update
    }
  }, [getProvider]);

  const connectSilent = useCallback(async () => {
    try {
      if (!window.ethereum) return;
      const provider = new BrowserProvider(window.ethereum);
      const accounts: string[] = await provider.send("eth_accounts", []);
      if (accounts.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      const network = await provider.getNetwork();
      const address = accounts[0];
      const balance = await provider.getBalance(address);
      setState({
        address,
        balance: formatEther(balance),
        chainId: "0x" + network.chainId.toString(16),
        isConnecting: false,
        isConnected: true,
        error: null,
      });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      const provider = getProvider();
      const accounts = await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      const address = accounts[0];
      const balance = await provider.getBalance(address);
      localStorage.setItem(STORAGE_KEY, "true");
      setState({
        address,
        balance: formatEther(balance),
        chainId: "0x" + network.chainId.toString(16),
        isConnecting: false,
        isConnected: true,
        error: null,
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: err.message || "Failed to connect wallet",
      }));
    }
  }, [getProvider]);

  const disconnect = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      address: null,
      balance: "0",
      chainId: null,
      isConnecting: false,
      isConnected: false,
      error: null,
    });
  }, []);

  const switchNetwork = useCallback(async () => {
    try {
      await window.ethereum?.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN_CONFIG.chainId }],
      });
    } catch (err: any) {
      if (err.code === 4902) {
        await window.ethereum?.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: CHAIN_CONFIG.chainId,
            chainName: CHAIN_CONFIG.chainName,
            rpcUrls: [CHAIN_CONFIG.rpcUrl],
            blockExplorerUrls: [CHAIN_CONFIG.blockExplorer],
            nativeCurrency: CHAIN_CONFIG.nativeCurrency,
          }],
        });
      }
    }
  }, []);

  const shortenAddress = useCallback((addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  // Auto-reconnect on mount
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      connectSilent();
    }
  }, [connectSilent]);

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setState((prev) => ({ ...prev, address: accounts[0] }));
        updateBalance(accounts[0]);
      }
    };

    const handleChainChanged = (chainId: string) => {
      setState((prev) => ({ ...prev, chainId }));
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnect, updateBalance]);

  const value: WalletContextValue = {
    ...state,
    connect,
    disconnect,
    switchNetwork,
    shortenAddress,
    isWrongNetwork: state.chainId !== null && state.chainId !== CHAIN_CONFIG.chainId,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
