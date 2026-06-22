import { useState, useCallback } from "react";
import { BrowserProvider, Contract, parseEther, formatEther } from "ethers";
import {
  CONTRACT_ADDRESSES,
  RWA_YIELD_TOKEN_ABI,
  ASSET_TOKEN_ABI,
  SECURITY_TOKEN_ABI,
} from "@/lib/contracts";

interface TransactionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
}

export function useContract() {
  const [txState, setTxState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    txHash: null,
  });

  const getSignerAndProvider = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask not found");
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return { provider, signer };
  }, []);

  const executeTransaction = useCallback(
    async (fn: () => Promise<any>) => {
      setTxState({ isLoading: true, error: null, txHash: null });
      try {
        const tx = await fn();
        const receipt = await tx.wait();
        setTxState({ isLoading: false, error: null, txHash: receipt.hash });
        return receipt;
      } catch (err: any) {
        const reason = err?.reason || err?.message || "Transaction failed";
        setTxState({ isLoading: false, error: reason, txHash: null });
        throw err;
      }
    },
    []
  );

  // ERC-20 Yield Token functions
  const mintYieldTokens = useCallback(
    async (to: string, amount: string) => {
      const { signer } = await getSignerAndProvider();
      const contract = new Contract(CONTRACT_ADDRESSES.rwaYieldToken, RWA_YIELD_TOKEN_ABI, signer);
      return executeTransaction(() => contract.mint(to, parseEther(amount)));
    },
    [getSignerAndProvider, executeTransaction]
  );

  const burnYieldTokens = useCallback(
    async (from: string, amount: string) => {
      const { signer } = await getSignerAndProvider();
      const contract = new Contract(CONTRACT_ADDRESSES.rwaYieldToken, RWA_YIELD_TOKEN_ABI, signer);
      return executeTransaction(() => contract.burn(from, parseEther(amount)));
    },
    [getSignerAndProvider, executeTransaction]
  );

  const claimYield = useCallback(async () => {
    const { signer } = await getSignerAndProvider();
    const contract = new Contract(CONTRACT_ADDRESSES.rwaYieldToken, RWA_YIELD_TOKEN_ABI, signer);
    return executeTransaction(() => contract.claimYield());
  }, [getSignerAndProvider, executeTransaction]);

  const distributeYield = useCallback(
    async (amount: string) => {
      const { signer } = await getSignerAndProvider();
      const contract = new Contract(CONTRACT_ADDRESSES.rwaYieldToken, RWA_YIELD_TOKEN_ABI, signer);
      return executeTransaction(() => contract.distributeYield(parseEther(amount)));
    },
    [getSignerAndProvider, executeTransaction]
  );

  const getYieldBalance = useCallback(
    async (address: string) => {
      const { provider } = await getSignerAndProvider();
      const contract = new Contract(CONTRACT_ADDRESSES.rwaYieldToken, RWA_YIELD_TOKEN_ABI, provider);
      const balance = await contract.balanceOf(address);
      return formatEther(balance);
    },
    [getSignerAndProvider]
  );

  const getPendingYield = useCallback(
    async (address: string) => {
      const { provider } = await getSignerAndProvider();
      const contract = new Contract(CONTRACT_ADDRESSES.rwaYieldToken, RWA_YIELD_TOKEN_ABI, provider);
      const pending = await contract.pendingYield(address);
      return formatEther(pending);
    },
    [getSignerAndProvider]
  );

  // ERC-1155 Asset Token functions
  const mintAssetToken = useCallback(
    async (to: string, id: number, amount: number) => {
      const { signer } = await getSignerAndProvider();
      const contract = new Contract(CONTRACT_ADDRESSES.assetToken, ASSET_TOKEN_ABI, signer);
      return executeTransaction(() => contract.mint(to, id, amount, "0x"));
    },
    [getSignerAndProvider, executeTransaction]
  );

  // Security Token functions
  const addToWhitelist = useCallback(
    async (account: string) => {
      const { signer } = await getSignerAndProvider();
      const contract = new Contract(CONTRACT_ADDRESSES.securityToken, SECURITY_TOKEN_ABI, signer);
      return executeTransaction(() => contract.addToWhitelist(account));
    },
    [getSignerAndProvider, executeTransaction]
  );

  const removeFromWhitelist = useCallback(
    async (account: string) => {
      const { signer } = await getSignerAndProvider();
      const contract = new Contract(CONTRACT_ADDRESSES.securityToken, SECURITY_TOKEN_ABI, signer);
      return executeTransaction(() => contract.removeFromWhitelist(account));
    },
    [getSignerAndProvider, executeTransaction]
  );

  const checkKYCStatus = useCallback(
    async (account: string) => {
      const { provider } = await getSignerAndProvider();
      const contract = new Contract(CONTRACT_ADDRESSES.securityToken, SECURITY_TOKEN_ABI, provider);
      return contract.isVerified(account);
    },
    [getSignerAndProvider]
  );

  const issueSecurityTokens = useCallback(
    async (to: string, amount: string) => {
      const { signer } = await getSignerAndProvider();
      const contract = new Contract(CONTRACT_ADDRESSES.securityToken, SECURITY_TOKEN_ABI, signer);
      return executeTransaction(() => contract.issue(to, parseEther(amount)));
    },
    [getSignerAndProvider, executeTransaction]
  );

  const resetTxState = useCallback(() => {
    setTxState({ isLoading: false, error: null, txHash: null });
  }, []);

  return {
    txState,
    resetTxState,
    // Yield Token
    mintYieldTokens,
    burnYieldTokens,
    claimYield,
    distributeYield,
    getYieldBalance,
    getPendingYield,
    // Asset Token
    mintAssetToken,
    // Security Token
    addToWhitelist,
    removeFromWhitelist,
    checkKYCStatus,
    issueSecurityTokens,
  };
}
