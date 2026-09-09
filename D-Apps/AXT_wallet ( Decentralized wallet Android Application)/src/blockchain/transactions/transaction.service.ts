import { isAddress, formatEther, getAddress } from 'ethers';
import { evmProviderService } from '../providers/provider.service';
import { gasService } from './gas.service';
import { tokenService } from '../tokens/token.service';
import { TokenConfig } from '../tokens/token.types';
import {
  FeeEstimate,
  PopulatedTxRequest,
  LocalTransactionRecord,
  TransactionStatus,
  AssetType,
} from './transaction.types';
import { NetworkConfig } from '../networks/network.types';
import { transactionStorage } from '../../storage/transaction-storage';
import { accountStorage } from '../../storage/account-storage';
import { trimDecimals } from '../balances/balance.utils';

export class TransactionService {
  /**
   * Pre-sign freshness revalidation for native token transfers:
   * Re-fetches latest nonce, dynamic fee data, and sender balance directly from RPC
   * immediately before signing.
   */
  async revalidateAndPopulate(
    from: string,
    to: string,
    amountWei: bigint,
    network: NetworkConfig
  ): Promise<{ populatedTx: PopulatedTxRequest; feeEstimate: FeeEstimate }> {
    if (!isAddress(from)) {
      throw new Error('Invalid sender address.');
    }
    if (!isAddress(to)) {
      throw new Error('Invalid recipient address.');
    }
    if (amountWei <= 0n) {
      throw new Error('Transfer amount must be greater than 0.');
    }

    const provider = evmProviderService.getProvider();

    // 1. Re-fetch current sender balance
    const currentBalance = await provider.getBalance(from);

    // 2. Re-fetch fresh fee data and gas limit
    const feeEstimate = await gasService.estimateTransactionFee(
      provider,
      from,
      to,
      amountWei,
      network
    );

    // 3. Re-validate balance sufficiency with fresh maximum possible fee
    const sufficiency = gasService.validateSufficiency(currentBalance, amountWei, feeEstimate);
    if (!sufficiency.isValid) {
      throw new Error(sufficiency.error ?? 'Insufficient funds for transfer and network fee.');
    }

    // 4. Fetch the authoritative pending nonce
    const nonce = await provider.getTransactionCount(from, 'pending');

    // 5. Assemble the PopulatedTxRequest
    const populatedTx: PopulatedTxRequest = {
      to: getAddress(to),
      from: getAddress(from),
      value: amountWei,
      nonce,
      gasLimit: feeEstimate.gasLimit,
      chainId: network.chainId,
      type: feeEstimate.feeModel === 'eip1559' ? 2 : 0,
    };

    if (feeEstimate.feeModel === 'eip1559' && feeEstimate.maxFeePerGas != null) {
      populatedTx.maxFeePerGas = feeEstimate.maxFeePerGas;
      populatedTx.maxPriorityFeePerGas = feeEstimate.maxPriorityFeePerGas;
    } else if (feeEstimate.gasPrice != null) {
      populatedTx.gasPrice = feeEstimate.gasPrice;
    }

    return { populatedTx, feeEstimate };
  }

  /**
   * Pre-sign freshness revalidation for ERC-20 token transfers:
   * Re-fetches token balance, native balance for gas, calldata-simulated gas limit,
   * fresh fee data, and sender nonce immediately before signing.
   */
  async revalidateAndPopulateTokenTransfer(
    from: string,
    recipient: string,
    token: TokenConfig,
    amountUnits: bigint,
    network: NetworkConfig
  ): Promise<{ populatedTx: PopulatedTxRequest; feeEstimate: FeeEstimate }> {
    if (!isAddress(from)) {
      throw new Error('Invalid sender address.');
    }
    if (!isAddress(recipient)) {
      throw new Error('Invalid recipient address.');
    }
    if (!isAddress(token.contractAddress)) {
      throw new Error('Invalid token contract address.');
    }
    if (amountUnits <= 0n) {
      throw new Error('Transfer amount must be greater than 0.');
    }

    const provider = evmProviderService.getProvider();
    const tokenContractAddress = getAddress(token.contractAddress);
    const recipientAddress = getAddress(recipient);

    // 1. Re-fetch current native balance (for gas payment)
    const nativeBalance = await provider.getBalance(from);

    // 2. Re-fetch current token balance
    const tokenBalance = await tokenService.getTokenBalance(provider, from, token);

    // 3. Encode ERC-20 transfer calldata
    const data = tokenService.encodeTransferData(recipientAddress, amountUnits);

    // 4. Re-estimate gas fee using contract calldata
    const feeEstimate = await gasService.estimateTransactionFee(
      provider,
      from,
      tokenContractAddress,
      0n,
      network,
      data
    );

    // 5. Dual-balance sufficiency validation
    const sufficiency = gasService.validateTokenSufficiency(
      tokenBalance.rawBalance,
      amountUnits,
      nativeBalance,
      feeEstimate,
      token.symbol,
      network.nativeCurrency.symbol
    );
    if (!sufficiency.isValid) {
      throw new Error(sufficiency.error ?? 'Insufficient funds for token transfer.');
    }

    // 6. Fetch pending nonce
    const nonce = await provider.getTransactionCount(from, 'pending');

    // 7. Assemble ERC-20 transaction: to = token contract, value = 0, data = calldata
    const populatedTx: PopulatedTxRequest = {
      to: tokenContractAddress,
      from: getAddress(from),
      value: 0n,
      data,
      nonce,
      gasLimit: feeEstimate.gasLimit,
      chainId: network.chainId,
      type: feeEstimate.feeModel === 'eip1559' ? 2 : 0,
    };

    if (feeEstimate.feeModel === 'eip1559' && feeEstimate.maxFeePerGas != null) {
      populatedTx.maxFeePerGas = feeEstimate.maxFeePerGas;
      populatedTx.maxPriorityFeePerGas = feeEstimate.maxPriorityFeePerGas;
    } else if (feeEstimate.gasPrice != null) {
      populatedTx.gasPrice = feeEstimate.gasPrice;
    }

    return { populatedTx, feeEstimate };
  }

  /**
   * Pre-sign freshness revalidation for arbitrary EVM transactions (such as WalletConnect dApp requests).
   * Re-fetches current sender balance, simulates gas limit with calldata (or gas override),
   * fetches fresh fee data, pending nonce, and assembles PopulatedTxRequest.
   */
  async revalidateAndPopulateRaw(
    from: string,
    to: string | undefined,
    valueWei: bigint,
    data: string | undefined,
    network: NetworkConfig,
    customGasLimit?: bigint
  ): Promise<{ populatedTx: PopulatedTxRequest; feeEstimate: FeeEstimate }> {
    if (!isAddress(from)) {
      throw new Error('Invalid sender address.');
    }
    if (to && !isAddress(to)) {
      throw new Error('Invalid recipient / contract address.');
    }

    const provider = evmProviderService.getProvider();
    const currentBalance = await provider.getBalance(from);

    // 1. Fetch fresh fee data and estimate gas
    const feeEstimate = await gasService.estimateTransactionFee(
      provider,
      from,
      to || from,
      valueWei,
      network,
      data
    );

    if (customGasLimit && customGasLimit > feeEstimate.gasLimit) {
      feeEstimate.gasLimit = customGasLimit;
    }

    // 2. Validate sufficiency
    const sufficiency = gasService.validateSufficiency(currentBalance, valueWei, feeEstimate);
    if (!sufficiency.isValid) {
      throw new Error(sufficiency.error ?? 'Insufficient funds for transaction and network fee.');
    }

    // 3. Fetch pending nonce
    const nonce = await provider.getTransactionCount(from, 'pending');

    // 4. Assemble PopulatedTxRequest
    const populatedTx: PopulatedTxRequest = {
      to: to ? getAddress(to) : getAddress(from),
      from: getAddress(from),
      value: valueWei,
      data: data || '0x',
      nonce,
      gasLimit: feeEstimate.gasLimit,
      chainId: network.chainId,
      type: feeEstimate.feeModel === 'eip1559' ? 2 : 0,
    };

    if (feeEstimate.feeModel === 'eip1559' && feeEstimate.maxFeePerGas != null) {
      populatedTx.maxFeePerGas = feeEstimate.maxFeePerGas;
      populatedTx.maxPriorityFeePerGas = feeEstimate.maxPriorityFeePerGas;
    } else if (feeEstimate.gasPrice != null) {
      populatedTx.gasPrice = feeEstimate.gasPrice;
    }

    return { populatedTx, feeEstimate };
  }

  /**
   * Broadcasts a raw signed transaction hex string to the active network RPC.
   *
   * @returns The transaction hash.
   */
  async broadcastTransaction(signedTxHex: string): Promise<string> {
    const provider = evmProviderService.getProvider();
    const txResponse = await provider.broadcastTransaction(signedTxHex);
    return txResponse.hash;
  }

  /**
   * Saves the transaction as 'pending' in local storage immediately after broadcast,
   * supporting both native and ERC-20 token transfers, then launches background tracking.
   */
  async recordAndTrack(
    hash: string,
    from: string,
    to: string,
    amountUnits: bigint,
    feeEstimate: FeeEstimate,
    nonce: number,
    network: NetworkConfig,
    tokenMeta?: {
      tokenAddress: string;
      symbol: string;
      formattedAmount: string;
      decimals: number;
    }
  ): Promise<LocalTransactionRecord> {
    const isToken = !!tokenMeta;
    const symbol = isToken ? tokenMeta.symbol : network.nativeCurrency.symbol;
    const formattedAmount = isToken
      ? trimDecimals(tokenMeta.formattedAmount, 6)
      : trimDecimals(formatEther(amountUnits), 6);
    const explorerUrl = `${network.explorerUrl}/tx/${hash}`;

    const record: LocalTransactionRecord = {
      id: `${network.chainId}_${hash}`,
      hash,
      from,
      to,
      amountWei: amountUnits.toString(),
      formattedAmount,
      symbol,
      chainId: network.chainId,
      timestamp: Date.now(),
      status: 'pending',
      feeWei: feeEstimate.maxPossibleFeeWei.toString(),
      formattedFee: feeEstimate.formattedFee,
      nonce,
      explorerUrl,
      assetType: isToken ? 'erc20' : 'native',
      tokenAddress: tokenMeta?.tokenAddress,
      tokenDecimals: tokenMeta?.decimals,
    };

    // 1. Immediately persist locally for the sender
    await transactionStorage.saveTransaction(record, from);

    // 2. If recipient is another account in this wallet, save incoming record for that account as well
    try {
      const allAccounts = await accountStorage.getAccounts();
      const isInternalRecipient = allAccounts.some(
        (a) => a.address.toLowerCase() === to.toLowerCase() && a.address.toLowerCase() !== from.toLowerCase()
      );
      if (isInternalRecipient) {
        await transactionStorage.saveTransaction(record, to);
      }
    } catch {
      // Ignore account lookup error
    }

    // 3. Track confirmation asynchronously in the background
    this.trackConfirmation(hash, from, network, to).catch((err) => {
      if (__DEV__) console.warn('[TransactionService] Background tracking error:', err);
    });

    return record;
  }

  /**
   * Asynchronously monitors transaction receipt and updates local storage.
   * Uses safe interval polling with getTransactionReceipt to avoid internal ethers
   * block subscription/cancellation errors when providers change.
   */
  async trackConfirmation(
    hash: string,
    from: string,
    network: NetworkConfig,
    to?: string
  ): Promise<void> {
    const startTime = Date.now();
    const TIMEOUT_MS = 90000;
    const POLL_INTERVAL_MS = 3000;

    const poll = async () => {
      while (Date.now() - startTime < TIMEOUT_MS) {
        try {
          if (!evmProviderService.isConnected()) {
            break;
          }
          const provider = evmProviderService.getProvider();
          const receipt = await provider.getTransactionReceipt(hash);

          if (receipt) {
            const isSuccess = receipt.status === 1;
            const status: TransactionStatus = isSuccess ? 'confirmed' : 'failed';
            const extra = {
              blockNumber: receipt.blockNumber,
              gasUsed: receipt.gasUsed?.toString(),
            };

            await transactionStorage.updateTransactionStatus(
              hash,
              from,
              network.chainId,
              status,
              extra
            );

            if (to) {
              await transactionStorage.updateTransactionStatus(
                hash,
                to,
                network.chainId,
                status,
                extra
              );
            }
            return;
          }
        } catch {
          // Ignore individual poll errors
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    };

    poll().catch(() => {});
  }

  /**
   * Reconciles all pending transactions in local storage against the active blockchain RPC.
   * Invoked on app launch, Activity screen focus, or pull-to-refresh.
   */
  async reconcilePending(
    address: string,
    network: NetworkConfig
  ): Promise<LocalTransactionRecord[]> {
    if (!address) return [];

    try {
      const pendingTxs = await transactionStorage.getPendingTransactions(
        address,
        network.chainId
      );

      if (pendingTxs.length > 0 && evmProviderService.isConnected()) {
        const provider = evmProviderService.getProvider();

        for (const tx of pendingTxs) {
          try {
            const receipt = await provider.getTransactionReceipt(tx.hash);
            if (receipt) {
              const status = receipt.status === 1 ? 'confirmed' : 'failed';
              await transactionStorage.updateTransactionStatus(
                tx.hash,
                address,
                network.chainId,
                status,
                {
                  blockNumber: receipt.blockNumber,
                  gasUsed: receipt.gasUsed?.toString(),
                }
              );
            }
          } catch {
            // Individual receipt query failure — skip and continue
          }
        }
      }
    } catch {
      // Reconcile failed — return current storage snapshot
    }

    return await transactionStorage.getTransactions(address, network.chainId);
  }
}

export const transactionService = new TransactionService();
