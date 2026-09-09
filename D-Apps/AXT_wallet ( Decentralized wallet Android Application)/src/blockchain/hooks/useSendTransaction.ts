import { useState, useCallback, useRef } from 'react';
import { parseEther, parseUnits, isAddress, Interface } from 'ethers';
import { transactionService } from '../transactions/transaction.service';
import { authService } from '../../wallet/auth/auth.service';
import { NetworkConfig } from '../networks/network.types';
import { TokenConfig } from '../tokens/token.types';
import {
  SendTxStatus,
  PopulatedTxRequest,
  FeeEstimate,
  LocalTransactionRecord,
} from '../transactions/transaction.types';
import { TransactionAnalysis } from '../security/security.types';
import { transactionAnalyzer } from '../security/transaction.analyzer';

const ERC20_TRANSFER_ABI = ['function transfer(address to, uint256 amount) returns (bool)'];
const ERC20_IFACE = new Interface(ERC20_TRANSFER_ABI);

export interface UseSendTransactionResult {
  status: SendTxStatus;
  isBusy: boolean;
  recipient: string;
  amountText: string;
  amountUnits: bigint;
  selectedToken: TokenConfig | null;
  feeEstimate: FeeEstimate | null;
  populatedTx: PopulatedTxRequest | null;
  txHash: string | null;
  txRecord: LocalTransactionRecord | null;
  analysis: TransactionAnalysis | null;
  error: string | null;
  startReview: (
    recipient: string,
    amount: string,
    feeEstimate: FeeEstimate,
    token?: TokenConfig | null,
    network?: NetworkConfig
  ) => boolean;
  cancelReview: () => void;
  submitWithPin: (pin: string, network: NetworkConfig) => Promise<boolean>;
  submitWithBiometrics: (network: NetworkConfig) => Promise<boolean>;
  reset: () => void;
}

export function useSendTransaction(
  senderAddress: string | undefined,
  accountIndex: number = 0
): UseSendTransactionResult {
  const [status, setStatus] = useState<SendTxStatus>('idle');
  const [recipient, setRecipient] = useState<string>('');
  const [amountText, setAmountText] = useState<string>('');
  const [amountUnits, setAmountUnits] = useState<bigint>(0n);
  const [selectedToken, setSelectedToken] = useState<TokenConfig | null>(null);
  const [feeEstimate, setFeeEstimate] = useState<FeeEstimate | null>(null);
  const [populatedTx, setPopulatedTx] = useState<PopulatedTxRequest | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txRecord, setTxRecord] = useState<LocalTransactionRecord | null>(null);
  const [analysis, setAnalysis] = useState<TransactionAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Anti-double-submission ref to prevent concurrent executions
  const isExecutingRef = useRef<boolean>(false);

  const isBusy =
    status === 'revalidating' ||
    status === 'signing' ||
    status === 'broadcasting';

  const startReview = useCallback(
    (
      targetRecipient: string,
      targetAmount: string,
      estimate: FeeEstimate,
      token?: TokenConfig | null,
      network?: NetworkConfig
    ): boolean => {
      setError(null);

      if (!senderAddress) {
        setError('Wallet not loaded.');
        return false;
      }
      if (!isAddress(targetRecipient.trim())) {
        setError('Please enter a valid recipient EVM address.');
        return false;
      }

      let parsedUnits = 0n;
      try {
        if (token) {
          parsedUnits = parseUnits(targetAmount.trim(), token.decimals);
        } else {
          parsedUnits = parseEther(targetAmount.trim());
        }
      } catch {
        setError('Please enter a valid numeric amount.');
        return false;
      }

      if (parsedUnits <= 0n) {
        setError('Amount must be greater than 0.');
        return false;
      }

      const cleanRecipient = targetRecipient.trim();

      // Compute security analysis
      if (network) {
        let rawInput;
        if (token) {
          const calldata = ERC20_IFACE.encodeFunctionData('transfer', [
            cleanRecipient,
            parsedUnits,
          ]);
          rawInput = {
            from: senderAddress,
            to: token.contractAddress,
            data: calldata,
            value: 0n,
          };
        } else {
          rawInput = {
            from: senderAddress,
            to: cleanRecipient,
            value: parsedUnits,
          };
        }

        const computedAnalysis = transactionAnalyzer.analyzeTransaction(
          rawInput,
          network,
          { address: senderAddress },
          token ? [token] : []
        );
        setAnalysis(computedAnalysis);
      }

      setRecipient(cleanRecipient);
      setAmountText(targetAmount.trim());
      setAmountUnits(parsedUnits);
      setSelectedToken(token || null);
      setFeeEstimate(estimate);
      setStatus('reviewing');
      return true;
    },
    [senderAddress]
  );

  const cancelReview = useCallback(() => {
    if (isExecutingRef.current) return;
    setStatus('idle');
    setAnalysis(null);
    setError(null);
  }, []);

  const executeTransactionFlow = useCallback(
    async (
      network: NetworkConfig,
      signFn: (freshTx: PopulatedTxRequest) => Promise<string>,
      errorMessage: string
    ): Promise<boolean> => {
      if (isExecutingRef.current || !senderAddress) {
        return false;
      }

      isExecutingRef.current = true;
      setError(null);

      try {
        setStatus('revalidating');

        let freshTx: PopulatedTxRequest;
        let freshFee: FeeEstimate;

        if (selectedToken) {
          const result = await transactionService.revalidateAndPopulateTokenTransfer(
            senderAddress,
            recipient,
            selectedToken,
            amountUnits,
            network
          );
          freshTx = result.populatedTx;
          freshFee = result.feeEstimate;
        } else {
          const result = await transactionService.revalidateAndPopulate(
            senderAddress,
            recipient,
            amountUnits,
            network
          );
          freshTx = result.populatedTx;
          freshFee = result.feeEstimate;
        }

        setPopulatedTx(freshTx);
        setFeeEstimate(freshFee);

        setStatus('signing');
        const signedTxHex = await signFn(freshTx);

        setStatus('broadcasting');
        const hash = await transactionService.broadcastTransaction(signedTxHex);
        setTxHash(hash);

        const record = await transactionService.recordAndTrack(
          hash,
          senderAddress,
          recipient,
          amountUnits,
          freshFee,
          freshTx.nonce,
          network,
          selectedToken
            ? {
                tokenAddress: selectedToken.contractAddress,
                symbol: selectedToken.symbol,
                formattedAmount: amountText,
                decimals: selectedToken.decimals,
              }
            : undefined
        );
        setTxRecord(record);

        setStatus('success');
        return true;
      } catch (err: any) {
        setStatus('error');
        setError(err?.message || errorMessage);
        return false;
      } finally {
        isExecutingRef.current = false;
      }
    },
    [senderAddress, recipient, amountUnits, selectedToken, amountText]
  );

  const submitWithPin = useCallback(
    async (pin: string, network: NetworkConfig): Promise<boolean> => {
      return executeTransactionFlow(
        network,
        (freshTx) => authService.signTransactionAuthorized(pin, freshTx, senderAddress!, senderAddress!),
        'Transaction failed. Please try again.'
      );
    },
    [executeTransactionFlow, senderAddress]
  );

  const submitWithBiometrics = useCallback(
    async (network: NetworkConfig): Promise<boolean> => {
      return executeTransactionFlow(
        network,
        (freshTx) => authService.signTransactionBiometric(freshTx, senderAddress!, senderAddress!),
        'Biometric authorization failed.'
      );
    },
    [executeTransactionFlow, senderAddress]
  );

  const reset = useCallback(() => {
    if (isExecutingRef.current) return;
    setStatus('idle');
    setRecipient('');
    setAmountText('');
    setAmountUnits(0n);
    setSelectedToken(null);
    setFeeEstimate(null);
    setPopulatedTx(null);
    setTxHash(null);
    setTxRecord(null);
    setAnalysis(null);
    setError(null);
  }, []);

  return {
    status,
    isBusy,
    recipient,
    amountText,
    amountUnits,
    selectedToken,
    feeEstimate,
    populatedTx,
    txHash,
    txRecord,
    analysis,
    error,
    startReview,
    cancelReview,
    submitWithPin,
    submitWithBiometrics,
    reset,
  };
}
