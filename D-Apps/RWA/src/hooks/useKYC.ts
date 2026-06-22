import { useState, useCallback } from "react";
import { BrowserProvider, Contract } from "ethers";
import { CONTRACT_ADDRESSES, KYC_REGISTRY_ABI } from "@/lib/contracts";

interface KYCState {
  status: number; // 0=None, 1=Pending, 2=Verified, 3=Rejected, 4=Revoked, 5=Expired
  investorType: number;
  jurisdiction: string;
  submittedAt: number;
  verifiedAt: number;
  expiresAt: number;
  investmentLimit: string;
  totalInvested: string;
  documentHash: string;
}

interface TransactionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
}

const DEFAULT_KYC_STATE: KYCState = {
  status: 0,
  investorType: 0,
  jurisdiction: "",
  submittedAt: 0,
  verifiedAt: 0,
  expiresAt: 0,
  investmentLimit: "0",
  totalInvested: "0",
  documentHash: "",
};

export function useKYC() {
  const [kycState, setKycState] = useState<KYCState>(DEFAULT_KYC_STATE);
  const [txState, setTxState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    txHash: null,
  });

  const getProvider = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask not found");
    return new BrowserProvider(window.ethereum);
  }, []);

  const getSigner = useCallback(async () => {
    const provider = await getProvider();
    return provider.getSigner();
  }, [getProvider]);

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

  const submitKYC = useCallback(
    async (jurisdiction: string, investorType: number, documentHash: string) => {
      const signer = await getSigner();
      const contract = new Contract(CONTRACT_ADDRESSES.kycRegistry, KYC_REGISTRY_ABI, signer);
      return executeTransaction(() =>
        contract.submitKYC(jurisdiction, investorType, documentHash)
      );
    },
    [getSigner, executeTransaction]
  );

  const approveKYC = useCallback(
    async (account: string, jurisdiction: string, investorType: number, investmentLimit: string) => {
      const signer = await getSigner();
      const contract = new Contract(CONTRACT_ADDRESSES.kycRegistry, KYC_REGISTRY_ABI, signer);
      return executeTransaction(() =>
        contract.approveKYC(account, jurisdiction, investorType, investmentLimit)
      );
    },
    [getSigner, executeTransaction]
  );

  const rejectKYC = useCallback(
    async (account: string, reason: string) => {
      const signer = await getSigner();
      const contract = new Contract(CONTRACT_ADDRESSES.kycRegistry, KYC_REGISTRY_ABI, signer);
      return executeTransaction(() => contract.rejectKYC(account, reason));
    },
    [getSigner, executeTransaction]
  );

  const revokeKYC = useCallback(
    async (account: string) => {
      const signer = await getSigner();
      const contract = new Contract(CONTRACT_ADDRESSES.kycRegistry, KYC_REGISTRY_ABI, signer);
      return executeTransaction(() => contract.revokeKYC(account));
    },
    [getSigner, executeTransaction]
  );

  const checkKYCStatus = useCallback(
    async (address: string) => {
      const provider = await getProvider();
      const contract = new Contract(CONTRACT_ADDRESSES.kycRegistry, KYC_REGISTRY_ABI, provider);
      return contract.isVerified(address);
    },
    [getProvider]
  );

  const getIdentity = useCallback(
    async (address: string) => {
      const provider = await getProvider();
      const contract = new Contract(CONTRACT_ADDRESSES.kycRegistry, KYC_REGISTRY_ABI, provider);
      const identity = await contract.getIdentity(address);
      setKycState({
        status: Number(identity.status),
        investorType: Number(identity.investorType),
        jurisdiction: identity.jurisdiction,
        submittedAt: Number(identity.submittedAt),
        verifiedAt: Number(identity.verifiedAt),
        expiresAt: Number(identity.expiresAt),
        investmentLimit: identity.investmentLimit.toString(),
        totalInvested: identity.totalInvested.toString(),
        documentHash: identity.documentHash,
      });
      return identity;
    },
    [getProvider]
  );

  const updateDocumentHash = useCallback(
    async (documentHash: string) => {
      const signer = await getSigner();
      const contract = new Contract(CONTRACT_ADDRESSES.kycRegistry, KYC_REGISTRY_ABI, signer);
      return executeTransaction(() => contract.updateDocumentHash(documentHash));
    },
    [getSigner, executeTransaction]
  );

  const resetTxState = useCallback(() => {
    setTxState({ isLoading: false, error: null, txHash: null });
  }, []);

  return {
    kycState,
    txState,
    resetTxState,
    submitKYC,
    approveKYC,
    rejectKYC,
    revokeKYC,
    checkKYCStatus,
    getIdentity,
    updateDocumentHash,
  };
}
