import { useState, useCallback } from "react";
import { BrowserProvider, Contract, parseEther, formatEther } from "ethers";
import { CONTRACT_ADDRESSES, ASSET_FACTORY_ABI } from "@/lib/contracts";

interface TransactionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
}

export function useFactory() {
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

  const createAsset = useCallback(
    async (params: {
      name: string;
      symbol: string;
      assetClass: number;
      location: string;
      totalValue: string;
      tokenPrice: string;
      totalSupply: string;
      annualYieldBps: number;
      maturityDate: number;
      metadataURI: string;
      documentHash: string;
      fee?: string;
    }) => {
      const signer = await getSigner();
      const contract = new Contract(CONTRACT_ADDRESSES.assetFactory, ASSET_FACTORY_ABI, signer);
      const assetParams = {
        name: params.name,
        symbol: params.symbol,
        assetClass: params.assetClass,
        location: params.location,
        totalValue: parseEther(params.totalValue),
        tokenPrice: parseEther(params.tokenPrice),
        totalSupply: BigInt(params.totalSupply),
        annualYieldBps: params.annualYieldBps,
        maturityDate: params.maturityDate,
        metadataURI: params.metadataURI,
        documentHash: params.documentHash,
      };
      return executeTransaction(() =>
        contract.createAsset(
          assetParams,
          { value: params.fee ? parseEther(params.fee) : 0 }
        )
      );
    },
    [getSigner, executeTransaction]
  );

  const buyTokens = useCallback(
    async (assetId: number, amount: number, value: string) => {
      const signer = await getSigner();
      const contract = new Contract(CONTRACT_ADDRESSES.assetFactory, ASSET_FACTORY_ABI, signer);
      return executeTransaction(() =>
        contract.buyTokens(assetId, amount, { value: parseEther(value) })
      );
    },
    [getSigner, executeTransaction]
  );

  const getCreationFee = useCallback(
    async (totalValue: string) => {
      const provider = await getProvider();
      const contract = new Contract(CONTRACT_ADDRESSES.assetFactory, ASSET_FACTORY_ABI, provider);
      const fee = await contract.getCreationFee(parseEther(totalValue));
      return formatEther(fee);
    },
    [getProvider]
  );

  const approveAsset = useCallback(
    async (assetId: number) => {
      const signer = await getSigner();
      const contract = new Contract(CONTRACT_ADDRESSES.assetFactory, ASSET_FACTORY_ABI, signer);
      return executeTransaction(() => contract.approveAsset(assetId));
    },
    [getSigner, executeTransaction]
  );

  const updateMetadata = useCallback(
    async (assetId: number, metadataURI: string) => {
      const signer = await getSigner();
      const contract = new Contract(CONTRACT_ADDRESSES.assetFactory, ASSET_FACTORY_ABI, signer);
      return executeTransaction(() => contract.updateMetadata(assetId, metadataURI));
    },
    [getSigner, executeTransaction]
  );

  const resetTxState = useCallback(() => {
    setTxState({ isLoading: false, error: null, txHash: null });
  }, []);

  return {
    txState,
    resetTxState,
    createAsset,
    buyTokens,
    getCreationFee,
    approveAsset,
    updateMetadata,
  };
}
