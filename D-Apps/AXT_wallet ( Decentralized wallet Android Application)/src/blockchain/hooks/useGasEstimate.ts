import { useState, useEffect, useCallback, useRef } from 'react';
import { isAddress, parseEther, parseUnits } from 'ethers';
import { evmProviderService } from '../providers/provider.service';
import { gasService } from '../transactions/gas.service';
import { tokenService } from '../tokens/token.service';
import { FeeEstimate } from '../transactions/transaction.types';
import { NetworkConfig } from '../networks/network.types';
import { TokenConfig } from '../tokens/token.types';

export interface UseGasEstimateResult {
  feeEstimate: FeeEstimate | null;
  isEstimating: boolean;
  error: string | null;
  maxSendableUnits: bigint;
  refreshEstimate: () => void;
}

export function useGasEstimate(
  senderAddress: string | undefined,
  recipientAddress: string,
  amountText: string,
  network: NetworkConfig,
  nativeBalanceWei: bigint | undefined,
  selectedToken?: TokenConfig | null,
  tokenBalanceUnits?: bigint | undefined
): UseGasEstimateResult {
  const [feeEstimate, setFeeEstimate] = useState<FeeEstimate | null>(null);
  const [isEstimating, setIsEstimating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [maxSendableUnits, setMaxSendableUnits] = useState<bigint>(0n);
  const [trigger, setTrigger] = useState(0);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshEstimate = useCallback(() => {
    setTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!senderAddress || !evmProviderService.isConnected()) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsEstimating(true);
      setError(null);

      try {
        const provider = evmProviderService.getProvider();
        const validRecipient = isAddress(recipientAddress) ? recipientAddress : senderAddress;

        if (selectedToken) {
          // ── ERC-20 Token Estimation ──────────────────────────────────────
          let amountUnits = 0n;
          if (amountText.trim() && !isNaN(Number(amountText)) && Number(amountText) > 0) {
            try {
              amountUnits = parseUnits(amountText.trim(), selectedToken.decimals);
            } catch {
              amountUnits = 0n;
            }
          }

          const transferData = tokenService.encodeTransferData(validRecipient, amountUnits);

          const estimate = await gasService.estimateTransactionFee(
            provider,
            senderAddress,
            selectedToken.contractAddress,
            0n,
            network,
            transferData
          );

          setFeeEstimate(estimate);

          // For ERC-20, MAX is full token balance
          setMaxSendableUnits(tokenBalanceUnits ?? 0n);

          if (amountUnits > 0n && nativeBalanceWei != null) {
            const sufficiency = gasService.validateTokenSufficiency(
              tokenBalanceUnits ?? 0n,
              amountUnits,
              nativeBalanceWei,
              estimate,
              selectedToken.symbol,
              network.nativeCurrency.symbol
            );
            if (!sufficiency.isValid) {
              setError(sufficiency.error ?? 'Insufficient balance.');
            }
          }
        } else {
          // ── Native Token Estimation ──────────────────────────────────────
          let amountWei = 0n;
          if (amountText.trim() && !isNaN(Number(amountText)) && Number(amountText) > 0) {
            try {
              amountWei = parseEther(amountText.trim());
            } catch {
              amountWei = 0n;
            }
          }

          const estimate = await gasService.estimateTransactionFee(
            provider,
            senderAddress,
            validRecipient,
            amountWei,
            network
          );

          setFeeEstimate(estimate);

          if (nativeBalanceWei != null) {
            const maxSendable = gasService.calculateMaxSendable(nativeBalanceWei, estimate);
            setMaxSendableUnits(maxSendable);

            if (amountWei > 0n) {
              const sufficiency = gasService.validateSufficiency(
                nativeBalanceWei,
                amountWei,
                estimate
              );
              if (!sufficiency.isValid) {
                setError(sufficiency.error ?? 'Insufficient balance.');
              }
            }
          }
        }
      } catch (err: any) {
        if (__DEV__) console.warn('[useGasEstimate] Error estimating fee:', err);
        setError('Unable to estimate network fee.');
      } finally {
        setIsEstimating(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [
    senderAddress,
    recipientAddress,
    amountText,
    network.chainId,
    nativeBalanceWei,
    selectedToken,
    tokenBalanceUnits,
    trigger,
  ]);

  return {
    feeEstimate,
    isEstimating,
    error,
    maxSendableUnits,
    refreshEstimate,
  };
}
