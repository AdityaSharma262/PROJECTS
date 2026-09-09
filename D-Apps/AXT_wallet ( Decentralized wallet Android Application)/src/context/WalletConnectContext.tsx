import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  WCSession,
  WCProposal,
  WCRequest,
  WCTxReviewData,
  WCMsgReviewData,
  walletConnectService,
  walletConnectSessionService,
  walletConnectRequestHandler,
} from '../blockchain/walletconnect';
import { useAccount } from './AccountContext';
import { useNetwork } from './NetworkContext';
import { WalletAccount } from '../wallet/accounts/account.types';
import { NetworkConfig } from '../blockchain/networks/network.types';
import { transactionService } from '../blockchain/transactions/transaction.service';
import { authService } from '../wallet/auth/auth.service';

interface WalletConnectContextValue {
  isInitialized: boolean;
  sessions: WCSession[];
  pendingProposal: WCProposal | null;
  pendingTxRequest: WCTxReviewData | null;
  pendingMsgRequest: WCMsgReviewData | null;
  connect: (uri: string) => Promise<void>;
  approveProposal: (
    proposal: WCProposal,
    account: WalletAccount,
    approvedNetworks: NetworkConfig[]
  ) => Promise<void>;
  rejectProposal: (proposalId: number, reason?: string) => Promise<void>;
  approveTransactionRequest: (requestId: number, pin: string) => Promise<string>;
  approveTransactionRequestWithBiometrics: (requestId: number) => Promise<string>;
  rejectTransactionRequest: (requestId: number, reason?: string) => Promise<void>;
  approveMessageRequest: (requestId: number, pin: string) => Promise<string>;
  approveMessageRequestWithBiometrics: (requestId: number) => Promise<string>;
  rejectMessageRequest: (requestId: number, reason?: string) => Promise<void>;
  disconnectSession: (topic: string) => Promise<void>;
  revokeAllSessions: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  clearPendingProposal: () => void;
  clearPendingTxRequest: () => void;
  clearPendingMsgRequest: () => void;
}

const WalletConnectContext = createContext<WalletConnectContextValue | null>(null);

export function WalletConnectProvider({ children }: { children: React.ReactNode }) {
  const { allNetworks } = useNetwork();
  const { activeAccount, accounts } = useAccount();

  const [isInitialized, setIsInitialized] = useState(false);
  const [sessions, setSessions] = useState<WCSession[]>([]);
  const [pendingProposal, setPendingProposal] = useState<WCProposal | null>(null);
  const [pendingTxRequest, setPendingTxRequest] = useState<WCTxReviewData | null>(null);
  const [pendingMsgRequest, setPendingMsgRequest] = useState<WCMsgReviewData | null>(null);

  // Refresh active sessions
  const refreshSessions = useCallback(async () => {
    try {
      const active = await walletConnectService.getActiveSessions();
      setSessions(active);
    } catch (err) {
      if (__DEV__) console.warn('[WalletConnectContext] Failed to load sessions:', err);
    }
  }, []);

  // Initialize client on mount
  useEffect(() => {
    let mounted = true;

    const initClient = async () => {
      try {
        await walletConnectService.init();
        if (mounted) {
          setIsInitialized(true);
          await refreshSessions();
        }
      } catch (err) {
        if (__DEV__) console.warn('[WalletConnectContext] Init failed:', err);
      }
    };

    initClient();

    return () => {
      mounted = false;
    };
  }, [refreshSessions]);

  // Handle incoming session proposals
  const handleProposal = useCallback((proposal: WCProposal) => {
    setPendingProposal(proposal);
  }, []);

  // Handle incoming RPC session requests
  const handleRequest = useCallback(
    async (request: WCRequest) => {
      try {
        const { binding, network } = await walletConnectRequestHandler.validateRequest(
          request,
          allNetworks
        );

        if (request.method === 'eth_sendTransaction') {
          const txReview = await walletConnectRequestHandler.parseTransactionRequest(
            request,
            binding,
            network
          );
          setPendingTxRequest(txReview);
        } else if (
          request.method === 'personal_sign' ||
          request.method === 'eth_sign' ||
          request.method === 'eth_signTypedData' ||
          request.method === 'eth_signTypedData_v4'
        ) {
          const msgReview = await walletConnectRequestHandler.parseMessageRequest(
            request,
            binding,
            network
          );
          setPendingMsgRequest(msgReview);
        } else if (request.method === 'wallet_switchEthereumChain') {
          const targetChainIdHex = request.params?.[0]?.chainId;
          const targetChainId = targetChainIdHex
            ? parseInt(targetChainIdHex, 16)
            : 0;

          if (binding.approvedChainIds.includes(targetChainId)) {
            await walletConnectRequestHandler.respondSuccess(request.topic, request.id, null);
          } else {
            await walletConnectRequestHandler.respondError(
              request.topic,
              request.id,
              4902,
              `Chain ID ${targetChainId} is not approved for this session.`
            );
          }
        } else if (request.method === 'wallet_addEthereumChain') {
          await walletConnectRequestHandler.respondSuccess(request.topic, request.id, null);
        } else {
          // Unsupported method
          await walletConnectRequestHandler.respondError(
            request.topic,
            request.id,
            4200,
            `Method '${request.method}' is not supported.`
          );
        }
      } catch (err: any) {
        if (__DEV__) console.warn('[WalletConnectContext] Request handling error:', err);
        await walletConnectRequestHandler.respondError(
          request.topic,
          request.id,
          4001,
          err?.message || 'Invalid request'
        );
      }
    },
    [allNetworks]
  );

  // Subscribe to service events
  useEffect(() => {
    if (!isInitialized) return;

    const unsubProposal = walletConnectService.onProposal(handleProposal);
    const unsubRequest = walletConnectService.onRequest(handleRequest);
    const unsubDelete = walletConnectService.onSessionDelete(() => {
      refreshSessions();
    });

    return () => {
      unsubProposal();
      unsubRequest();
      unsubDelete();
    };
  }, [isInitialized, handleProposal, handleRequest, refreshSessions]);

  // Connect to dApp via URI
  const connect = useCallback(async (uri: string) => {
    await walletConnectService.pair(uri);
  }, []);

  // Approve session proposal
  const approveProposal = useCallback(
    async (
      proposal: WCProposal,
      account: WalletAccount,
      approvedNetworks: NetworkConfig[]
    ) => {
      await walletConnectSessionService.approveProposal(
        proposal,
        account,
        approvedNetworks
      );
      setPendingProposal(null);
      await refreshSessions();
    },
    [refreshSessions]
  );

  // Reject session proposal
  const rejectProposal = useCallback(async (proposalId: number, reason?: string) => {
    await walletConnectSessionService.rejectProposal(proposalId, reason);
    setPendingProposal(null);
  }, []);

  // Approve transaction request with PIN
  const approveTransactionRequest = useCallback(
    async (requestId: number, pin: string): Promise<string> => {
      if (!pendingTxRequest || pendingTxRequest.requestId !== requestId) {
        throw new Error('Transaction request not found or expired.');
      }

      const tx = pendingTxRequest;

      // 1. Re-validate and populate fresh transaction from RPC
      const { populatedTx, feeEstimate } = await transactionService.revalidateAndPopulateRaw(
        tx.from,
        tx.to,
        tx.valueWei,
        tx.data,
        tx.network,
        tx.gasLimit
      );

      // 2. Single-pass PIN authorized signing (centralized account resolution)
      const signedTxHex = await authService.signTransactionAuthorized(
        pin,
        populatedTx,
        tx.from,
        tx.from
      );

      // 3. Broadcast to RPC
      const txHash = await transactionService.broadcastTransaction(signedTxHex);

      // 4. Record and track transaction
      await transactionService.recordAndTrack(
        txHash,
        tx.from,
        tx.to || tx.from,
        tx.valueWei,
        feeEstimate,
        populatedTx.nonce,
        tx.network
      );

      // 5. Send success response back to dApp
      await walletConnectRequestHandler.respondSuccess(tx.topic, tx.requestId, txHash);

      setPendingTxRequest(null);
      return txHash;
    },
    [pendingTxRequest]
  );

  // Approve transaction request with Biometrics
  const approveTransactionRequestWithBiometrics = useCallback(
    async (requestId: number): Promise<string> => {
      if (!pendingTxRequest || pendingTxRequest.requestId !== requestId) {
        throw new Error('Transaction request not found or expired.');
      }

      const tx = pendingTxRequest;

      // 1. Re-validate and populate fresh transaction from RPC
      const { populatedTx, feeEstimate } = await transactionService.revalidateAndPopulateRaw(
        tx.from,
        tx.to,
        tx.valueWei,
        tx.data,
        tx.network,
        tx.gasLimit
      );

      // 2. Biometric authorized signing
      const signedTxHex = await authService.signTransactionBiometric(
        populatedTx,
        tx.from,
        tx.from
      );

      // 3. Broadcast to RPC
      const txHash = await transactionService.broadcastTransaction(signedTxHex);

      // 4. Record and track transaction
      await transactionService.recordAndTrack(
        txHash,
        tx.from,
        tx.to || tx.from,
        tx.valueWei,
        feeEstimate,
        populatedTx.nonce,
        tx.network
      );

      // 5. Send success response back to dApp
      await walletConnectRequestHandler.respondSuccess(tx.topic, tx.requestId, txHash);

      setPendingTxRequest(null);
      return txHash;
    },
    [pendingTxRequest]
  );

  // Reject transaction request
  const rejectTransactionRequest = useCallback(
    async (requestId: number, reason?: string) => {
      if (pendingTxRequest && pendingTxRequest.requestId === requestId) {
        await walletConnectRequestHandler.respondError(
          pendingTxRequest.topic,
          requestId,
          4001,
          reason || 'User rejected transaction'
        );
        setPendingTxRequest(null);
      }
    },
    [pendingTxRequest]
  );

  // Approve message sign request with PIN
  const approveMessageRequest = useCallback(
    async (requestId: number, pin: string): Promise<string> => {
      if (!pendingMsgRequest || pendingMsgRequest.requestId !== requestId) {
        throw new Error('Signing request not found or expired.');
      }

      const msg = pendingMsgRequest;
      let signature = '';

      if (msg.method === 'personal_sign' || msg.method === 'eth_sign') {
        signature = await authService.signMessageAuthorized(
          pin,
          msg.rawMessage,
          msg.from,
          msg.from
        );
      } else if (msg.method === 'eth_signTypedData_v4') {
        signature = await authService.signTypedDataAuthorized(
          pin,
          msg.typedDataDomain,
          msg.typedDataTypes,
          msg.typedDataValue,
          msg.from,
          msg.from
        );
      }

      // Send signature response back to dApp
      await walletConnectRequestHandler.respondSuccess(msg.topic, msg.requestId, signature);

      setPendingMsgRequest(null);
      return signature;
    },
    [pendingMsgRequest]
  );

  // Approve message sign request with Biometrics
  const approveMessageRequestWithBiometrics = useCallback(
    async (requestId: number): Promise<string> => {
      if (!pendingMsgRequest || pendingMsgRequest.requestId !== requestId) {
        throw new Error('Signing request not found or expired.');
      }

      const msg = pendingMsgRequest;
      let signature = '';

      if (msg.method === 'personal_sign' || msg.method === 'eth_sign') {
        signature = await authService.signMessageBiometric(
          msg.rawMessage,
          msg.from,
          msg.from
        );
      } else if (msg.method === 'eth_signTypedData_v4') {
        signature = await authService.signTypedDataBiometric(
          msg.typedDataDomain,
          msg.typedDataTypes,
          msg.typedDataValue,
          msg.from,
          msg.from
        );
      }

      // Send signature response back to dApp
      await walletConnectRequestHandler.respondSuccess(msg.topic, msg.requestId, signature);

      setPendingMsgRequest(null);
      return signature;
    },
    [pendingMsgRequest]
  );

  // Reject message sign request
  const rejectMessageRequest = useCallback(
    async (requestId: number, reason?: string) => {
      if (pendingMsgRequest && pendingMsgRequest.requestId === requestId) {
        await walletConnectRequestHandler.respondError(
          pendingMsgRequest.topic,
          requestId,
          4001,
          reason || 'User rejected signing request'
        );
        setPendingMsgRequest(null);
      }
    },
    [pendingMsgRequest]
  );

  // Disconnect session
  const disconnectSession = useCallback(
    async (topic: string) => {
      await walletConnectSessionService.disconnectSession(topic);
      await refreshSessions();
    },
    [refreshSessions]
  );

  // Revoke all sessions
  const revokeAllSessions = useCallback(async () => {
    await walletConnectSessionService.revokeAllSessions();
    await refreshSessions();
  }, [refreshSessions]);

  return (
    <WalletConnectContext.Provider
      value={{
        isInitialized,
        sessions,
        pendingProposal,
        pendingTxRequest,
        pendingMsgRequest,
        connect,
        approveProposal,
        rejectProposal,
        approveTransactionRequest,
        approveTransactionRequestWithBiometrics,
        rejectTransactionRequest,
        approveMessageRequest,
        approveMessageRequestWithBiometrics,
        rejectMessageRequest,
        disconnectSession,
        revokeAllSessions,
        refreshSessions,
        clearPendingProposal: () => setPendingProposal(null),
        clearPendingTxRequest: () => setPendingTxRequest(null),
        clearPendingMsgRequest: () => setPendingMsgRequest(null),
      }}
    >
      {children}
    </WalletConnectContext.Provider>
  );
}

export function useWalletConnect(): WalletConnectContextValue {
  const ctx = useContext(WalletConnectContext);
  if (!ctx) throw new Error('useWalletConnect must be used within WalletConnectProvider');
  return ctx;
}
