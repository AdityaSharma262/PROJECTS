import { useState, useCallback } from "react";
import { BrowserProvider, Contract, parseEther, formatEther } from "ethers";
import { CONTRACT_ADDRESSES, REDEMPTION_MANAGER_ABI } from "@/lib/contracts";

interface TransactionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
}

export function useRedemption() {
  const [txState, setTxState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    txHash: null,
  });

  const getSigner = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask not found");
    const provider = new BrowserProvider(window.ethereum);
    return provider.getSigner();
  }, []);

  const getProvider = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask not found");
    return new BrowserProvider(window.ethereum);
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

  const requestRedemption = useCallback(
    async (
      tokenAddress: string,
      amount: string,
      payoutMethod: number, // 0 = NativeToken, 1 = Stablecoin
      payoutToken: string
    ) => {
      const signer = await getSigner();
      const contract = new Contract(CONTRACT_ADDRESSES.redemptionManager, REDEMPTION_MANAGER_ABI, signer);
      return executeTransaction(() =>
        contract.requestRedemption(tokenAddress, parseEther(amount), payoutMethod, payoutToken)
      );
    },
    [getSigner, executeTransaction]
  );

  const cancelRedemption = useCallback(
    async (requestId: number) => {
      const signer = await getSigner();
      const contract = new Contract(CONTRACT_ADDRESSES.redemptionManager, REDEMPTION_MANAGER_ABI, signer);
      return executeTransaction(() => contract.cancelRedemption(requestId));
    },
    [getSigner, executeTransaction]
  );

  const approveRedemption = useCallback(
    async (requestId: number) => {
      const signer = await getSigner();
      const contract = new Contract(CONTRACT_ADDRESSES.redemptionManager, REDEMPTION_MANAGER_ABI, signer);
      return executeTransaction(() => contract.approveRedemption(requestId));
    },
    [getSigner, executeTransaction]
  );

  const rejectRedemption = useCallback(
    async (requestId: number, reason: string) => {
      const signer = await getSigner();
      const contract = new Contract(CONTRACT_ADDRESSES.redemptionManager, REDEMPTION_MANAGER_ABI, signer);
      return executeTransaction(() => contract.rejectRedemption(requestId, reason));
    },
    [getSigner, executeTransaction]
  );

  const getEstimatedPayout = useCallback(
    async (tokenAddress: string, amount: string) => {
      const provider = await getProvider();
      const contract = new Contract(CONTRACT_ADDRESSES.redemptionManager, REDEMPTION_MANAGER_ABI, provider);
      const result = await contract.getEstimatedPayout(tokenAddress, parseEther(amount));
      return {
        gross: formatEther(result.gross),
        fee: formatEther(result.fee),
        net: formatEther(result.net),
      };
    },
    [getProvider]
  );

  const getRedemptionFee = useCallback(async () => {
    const provider = await getProvider();
    const contract = new Contract(CONTRACT_ADDRESSES.redemptionManager, REDEMPTION_MANAGER_ABI, provider);
    return contract.redemptionFeeBps();
  }, [getProvider]);

  const getCooldownPeriod = useCallback(async () => {
    const provider = await getProvider();
    const contract = new Contract(CONTRACT_ADDRESSES.redemptionManager, REDEMPTION_MANAGER_ABI, provider);
    return contract.cooldownPeriod();
  }, [getProvider]);

  const resetTxState = useCallback(() => {
    setTxState({ isLoading: false, error: null, txHash: null });
  }, []);

  return {
    txState,
    resetTxState,
    requestRedemption,
    cancelRedemption,
    approveRedemption,
    rejectRedemption,
    getEstimatedPayout,
    getRedemptionFee,
    getCooldownPeriod,
  };
}
