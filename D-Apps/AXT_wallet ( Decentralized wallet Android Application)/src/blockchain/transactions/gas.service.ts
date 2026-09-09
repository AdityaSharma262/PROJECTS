import { JsonRpcProvider, formatEther, isAddress } from 'ethers';
import { FeeEstimate, FeeModel } from './transaction.types';
import { NetworkConfig } from '../networks/network.types';
import { trimDecimals } from '../balances/balance.utils';

export class GasService {
  /**
   * Standard gas limit floor for a basic EVM native token transfer to an EOA.
   */
  public static readonly STANDARD_TRANSFER_GAS_FLOOR = 21000n;

  /**
   * Typical baseline gas limit for a standard ERC-20 token transfer.
   */
  public static readonly ERC20_TRANSFER_GAS_FLOOR = 65000n;

  /**
   * Dynamically inspects the network fee structure (EIP-1559 vs Legacy) and simulates
   * gas limits with a safety buffer for both native and contract (ERC-20) transfers.
   *
   * @param provider - Active JsonRpcProvider
   * @param from - Sender EVM address
   * @param to - Target address (recipient for native, contract for ERC-20)
   * @param valueWei - Amount in wei (0n for ERC-20)
   * @param network - Active network configuration
   * @param data - Optional calldata (for ERC-20 transfers)
   */
  async estimateTransactionFee(
    provider: JsonRpcProvider,
    from: string,
    to: string,
    valueWei: bigint,
    network: NetworkConfig,
    data?: string
  ): Promise<FeeEstimate> {
    // 1. Fetch current network fee data
    const feeData = await provider.getFeeData();

    let feeModel: FeeModel = 'legacy';
    let maxFeePerGas: bigint | undefined;
    let maxPriorityFeePerGas: bigint | undefined;
    let gasPrice: bigint | undefined;

    // Dynamically determine whether the chain supports EIP-1559 Type 2 fees
    if (feeData.maxFeePerGas != null && feeData.maxPriorityFeePerGas != null) {
      feeModel = 'eip1559';
      maxFeePerGas = feeData.maxFeePerGas;
      maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
    } else if (feeData.gasPrice != null) {
      feeModel = 'legacy';
      gasPrice = feeData.gasPrice;
    } else {
      // Fallback if provider returns incomplete feeData
      feeModel = 'legacy';
      gasPrice = 20000000000n; // 20 Gwei baseline
    }

    // 2. Dynamically estimate gas limit with 10% safety buffer
    const floor = data ? GasService.ERC20_TRANSFER_GAS_FLOOR : GasService.STANDARD_TRANSFER_GAS_FLOOR;
    let gasLimit = floor;

    if (isAddress(to) && isAddress(from)) {
      try {
        const estimated = await provider.estimateGas({
          from,
          to,
          value: valueWei > 0n ? valueWei : 0n,
          data: data || undefined,
        });

        // Apply 10% safety buffer
        const withBuffer = (estimated * 110n) / 100n;
        // Never let a fixed floor override a higher estimate
        gasLimit = withBuffer > floor ? withBuffer : floor;
      } catch {
        // If simulation fails (e.g. 0 balance on test account during early input), fallback to floor
        gasLimit = floor;
      }
    }

    // 3. Compute worst-case maximum possible fee and estimated fee
    let maxPossibleFeeWei: bigint;
    let estimatedFeeWei: bigint;

    if (feeModel === 'eip1559' && maxFeePerGas != null) {
      maxPossibleFeeWei = gasLimit * maxFeePerGas;
      estimatedFeeWei = maxPossibleFeeWei;
    } else if (gasPrice != null) {
      maxPossibleFeeWei = gasLimit * gasPrice;
      estimatedFeeWei = maxPossibleFeeWei;
    } else {
      maxPossibleFeeWei = gasLimit * 20000000000n;
      estimatedFeeWei = maxPossibleFeeWei;
    }

    const symbol = network.nativeCurrency.symbol;
    const formattedMaxFee = `${trimDecimals(formatEther(maxPossibleFeeWei), 6)} ${symbol}`;
    const formattedFee = `${trimDecimals(formatEther(estimatedFeeWei), 6)} ${symbol}`;

    return {
      feeModel,
      maxFeePerGas,
      maxPriorityFeePerGas,
      gasPrice,
      gasLimit,
      maxPossibleFeeWei,
      estimatedFeeWei,
      formattedFee,
      formattedMaxFee,
    };
  }

  /**
   * Calculates the maximum sendable native token amount, strictly reserving the
   * maximum possible fee to prevent out-of-gas or insufficient funds reverts.
   */
  calculateMaxSendable(balanceWei: bigint, feeEstimate: FeeEstimate): bigint {
    const maxFee = feeEstimate.maxPossibleFeeWei;
    if (balanceWei <= maxFee) {
      return 0n;
    }
    return balanceWei - maxFee;
  }

  /**
   * Pre-flight balance sufficiency validation for native token transfers.
   */
  validateSufficiency(
    balanceWei: bigint,
    amountWei: bigint,
    feeEstimate: FeeEstimate
  ): { isValid: boolean; error?: string } {
    if (amountWei <= 0n) {
      return { isValid: false, error: 'Amount must be greater than 0.' };
    }

    const totalNeeded = amountWei + feeEstimate.maxPossibleFeeWei;
    if (balanceWei < totalNeeded) {
      return {
        isValid: false,
        error: 'Insufficient balance to cover amount and maximum network fee.',
      };
    }

    return { isValid: true };
  }

  /**
   * Pre-flight dual-balance validation for ERC-20 token transfers.
   * Independently checks token balance AND native balance for gas.
   */
  validateTokenSufficiency(
    tokenBalanceUnits: bigint,
    tokenAmountUnits: bigint,
    nativeBalanceWei: bigint,
    feeEstimate: FeeEstimate,
    tokenSymbol: string,
    nativeSymbol: string
  ): { isValid: boolean; error?: string } {
    if (tokenAmountUnits <= 0n) {
      return { isValid: false, error: 'Amount must be greater than 0.' };
    }

    if (tokenBalanceUnits < tokenAmountUnits) {
      return {
        isValid: false,
        error: `Insufficient ${tokenSymbol} balance.`,
      };
    }

    if (nativeBalanceWei < feeEstimate.maxPossibleFeeWei) {
      return {
        isValid: false,
        error: `Insufficient ${nativeSymbol} to pay estimated maximum network fee (${feeEstimate.formattedMaxFee}).`,
      };
    }

    return { isValid: true };
  }
}

export const gasService = new GasService();
