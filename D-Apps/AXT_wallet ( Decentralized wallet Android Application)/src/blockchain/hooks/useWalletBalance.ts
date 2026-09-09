import { useState, useCallback, useEffect } from 'react';
import { evmProviderService } from '../providers/provider.service';
import { NativeBalanceService } from '../balances/balance.service';
import { BalanceModel } from '../balances/balance.service';
import { NetworkConfig } from '../networks/network.types';

/**
 * UI-facing hook for fetching and refreshing the wallet's native token balance.
 *
 * SECURITY RULES (DO NOT VIOLATE):
 * - Only the public wallet address is passed to the blockchain service layer.
 * - No private key, mnemonic, or other secret is accepted by this hook.
 * - Internal RPC or ethers errors are not forwarded to the UI.
 */

export type BalanceStatus = 'idle' | 'connecting' | 'loading' | 'success' | 'error';

export interface UseWalletBalanceResult {
  balance: BalanceModel | null;
  status: BalanceStatus;
  /** Generic user-facing error. Never contains raw RPC details. */
  error: string | null;
  activeNetwork: NetworkConfig | null;
  /** Manually trigger a balance refresh */
  refresh: () => void;
}

const balanceService = new NativeBalanceService(evmProviderService);

export function useWalletBalance(
  address: string | undefined,
  network: NetworkConfig
): UseWalletBalanceResult {
  const [balance, setBalance] = useState<BalanceModel | null>(null);
  const [status, setStatus] = useState<BalanceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [activeNetwork, setActiveNetwork] = useState<NetworkConfig | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refresh = useCallback(() => {
    setTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!address) return;

    let cancelled = false;

    const run = async () => {
      setStatus('connecting');
      setError(null);

      if (__DEV__) console.log('[useWalletBalance] Initializing provider for chain:', network.chainId, network.rpcUrl);

      // Initialize / reconnect provider for the active network
      const verifyResult = await evmProviderService.initialize(network);
      if (cancelled) return;

      if (__DEV__) console.log('[useWalletBalance] Provider init result:', JSON.stringify(verifyResult));

      if (!verifyResult.success) {
        setStatus('error');
        setError('Unable to connect to the network. Please check your connection.');
        return;
      }

      setActiveNetwork(evmProviderService.getActiveNetwork());
      setStatus('loading');

      if (__DEV__) console.log('[useWalletBalance] Fetching balance for address (last 4):', address?.slice(-4));

      const result = await balanceService.getBalance(address, network);
      if (cancelled) return;

      if (__DEV__) console.log('[useWalletBalance] Balance result:', result.success, result.error ?? result.balance?.formatted);

      if (result.success && result.balance) {
        setBalance(result.balance);
        setStatus('success');
      } else {
        setStatus('error');
        setError(result.error ?? 'Unable to fetch balance.');
      }
    };

    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, network.chainId, trigger]);

  return { balance, status, error, activeNetwork, refresh };
}
