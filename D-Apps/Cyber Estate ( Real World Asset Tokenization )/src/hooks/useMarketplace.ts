import { useState, useCallback } from "react";
import { BrowserProvider, Contract, parseEther } from "ethers";
import { CONTRACT_ADDRESSES, MARKETPLACE_ABI } from "@/lib/contracts";

interface TransactionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
}

export function useMarketplace() {
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

  const placeERC20Order = useCallback(
    async (
      tokenAddress: string,
      amount: string,
      pricePerToken: string,
      isSellOrder: boolean,
      durationSeconds: number,
      value?: string
    ) => {
      const signer = await getSigner();
      const contract = new Contract(CONTRACT_ADDRESSES.marketplace, MARKETPLACE_ABI, signer);
      return executeTransaction(() =>
        contract.placeERC20Order(
          tokenAddress,
          parseEther(amount),
          parseEther(pricePerToken),
          isSellOrder,
          durationSeconds,
          { value: value ? parseEther(value) : 0 }
        )
      );
    },
    [getSigner, executeTransaction]
  );

  const placeERC1155Order = useCallback(
    async (
      tokenAddress: string,
      tokenId: number,
      amount: number,
      pricePerToken: string,
      isSellOrder: boolean,
      durationSeconds: number,
      value?: string
    ) => {
      const signer = await getSigner();
      const contract = new Contract(CONTRACT_ADDRESSES.marketplace, MARKETPLACE_ABI, signer);
      return executeTransaction(() =>
        contract.placeERC1155Order(
          tokenAddress,
          tokenId,
          amount,
          parseEther(pricePerToken),
          isSellOrder,
          durationSeconds,
          { value: value ? parseEther(value) : 0 }
        )
      );
    },
    [getSigner, executeTransaction]
  );

  const fillOrder = useCallback(
    async (orderId: number, fillAmount: number, value?: string) => {
      const signer = await getSigner();
      const contract = new Contract(CONTRACT_ADDRESSES.marketplace, MARKETPLACE_ABI, signer);
      return executeTransaction(() =>
        contract.fillOrder(orderId, fillAmount, {
          value: value ? parseEther(value) : 0,
        })
      );
    },
    [getSigner, executeTransaction]
  );

  const cancelOrder = useCallback(
    async (orderId: number) => {
      const signer = await getSigner();
      const contract = new Contract(CONTRACT_ADDRESSES.marketplace, MARKETPLACE_ABI, signer);
      return executeTransaction(() => contract.cancelOrder(orderId));
    },
    [getSigner, executeTransaction]
  );

  const resetTxState = useCallback(() => {
    setTxState({ isLoading: false, error: null, txHash: null });
  }, []);

  return {
    txState,
    resetTxState,
    placeERC20Order,
    placeERC1155Order,
    fillOrder,
    cancelOrder,
  };
}
