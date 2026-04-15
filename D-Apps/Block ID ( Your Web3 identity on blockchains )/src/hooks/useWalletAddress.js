import { useEffect, useState } from "react";
import { subscribeWalletEvents } from "@/lib/contractConfig.js";

/**
 * Custom hook to get the connected wallet address
 * Works with both RainbowKit and direct window.ethereum
 * Auto-updates on account/chain changes
 */
export function useWalletAddress() {
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const updateAddress = async () => {
    // Use the same provider detection logic as in contractConfig.js
    const injected = window.apolloWallet || window.myCustomWallet || window.ethereum;
    
    if (!injected) {
      setAddress(null);
      setIsConnected(false);
      return;
    }

    try {
      const accounts = await injected.request({ method: "eth_accounts" });
      const account = accounts?.[0] || null;
      setAddress(account);
      setIsConnected(!!account);
    } catch (err) {
      setAddress(null);
      setIsConnected(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    updateAddress();
  }, []);

  // Subscribe to wallet events
  useEffect(() => {
    // Use the same provider detection logic as in contractConfig.js
    const injected = window.apolloWallet || window.myCustomWallet || window.ethereum;
    
    if (!injected?.on) {
      return () => {};
    }

    const handleAccountsChanged = (accounts) => {
      const account = accounts?.[0] || null;
      setAddress(account);
      setIsConnected(!!account);
    };
    
    const handleChainChanged = () => {
      // Chain changed, but address should remain same
      // Re-fetch to ensure consistency
      updateAddress();
    };

    injected.on("accountsChanged", handleAccountsChanged);
    injected.on("chainChanged", handleChainChanged);

    return () => {
      if (injected?.removeListener) {
        injected.removeListener("accountsChanged", handleAccountsChanged);
        injected.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  return { address, isConnected };
}