import { Interface, formatUnits, isAddress, getAddress } from 'ethers';
import { NetworkConfig } from '../networks/network.types';
import { TokenConfig } from '../tokens/token.types';
import {
  TransactionAnalysis,
  TransactionKind,
  TransactionRisk,
  RawTransactionInput,
  TokenSummary,
} from './security.types';
import { trimDecimals } from '../balances/balance.utils';
import { formatAddress } from '../../utils/address';

// Standard ERC-20 Minimal ABI for decoding
const ERC20_SECURITY_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
];

const ERC20_INTERFACE = new Interface(ERC20_SECURITY_ABI);

// 4-byte selectors
export const SELECTORS = {
  ERC20_TRANSFER: '0xa9059cbb',
  ERC20_APPROVE: '0x095ea7b3',
  ERC20_TRANSFER_FROM: '0x23b872dd',
} as const;

// EVM MaxUint256 threshold for unlimited approval detection (2^256 - 1)
const MAX_UINT256 = (1n << 256n) - 1n;
const UNLIMITED_THRESHOLD = 1n << 255n; // >= 2^255 is treated as unlimited



export class TransactionAnalyzer {
  /**
   * Checks if an approval allowance is effectively unlimited.
   */
  isUnlimitedApproval(amount: bigint): boolean {
    return amount >= UNLIMITED_THRESHOLD || amount === MAX_UINT256;
  }

  /**
   * Parses raw value to BigInt safely.
   */
  private parseRawValue(val?: bigint | string | number): bigint {
    if (val === undefined || val === null || val === '') return 0n;
    if (typeof val === 'bigint') return val;
    if (typeof val === 'number') {
      if (isNaN(val) || !isFinite(val)) return 0n;
      return BigInt(Math.floor(val));
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed) return 0n;
      if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
        try {
          return BigInt(trimmed);
        } catch {
          return 0n;
        }
      }
      try {
        return BigInt(trimmed);
      } catch {
        return 0n;
      }
    }
    return 0n;
  }

  /**
   * Resolves token metadata from known tokens or default fallback.
   */
  private resolveToken(
    contractAddress: string,
    knownTokens?: TokenConfig[]
  ): TokenSummary {
    const formattedAddr = isAddress(contractAddress)
      ? getAddress(contractAddress)
      : contractAddress;

    if (knownTokens && knownTokens.length > 0) {
      const found = knownTokens.find(
        (t) => t.contractAddress.toLowerCase() === contractAddress.toLowerCase()
      );
      if (found) {
        return {
          address: formattedAddr,
          name: found.name,
          symbol: found.symbol,
          decimals: found.decimals,
        };
      }
    }

    return {
      address: formattedAddr,
      name: 'ERC-20 Token',
      symbol: 'TOKEN',
      decimals: 18,
    };
  }

  /**
   * Comprehensive, fail-safe transaction analyzer.
   * Classifies transactions into normalized kinds and risk levels with explicit warning generation.
   *
   * @param tx - Raw transaction parameters
   * @param network - Current network configuration
   * @param activeAccount - Active account context
   * @param knownTokens - Optional list of recognized token configurations
   */
  analyzeTransaction(
    tx: RawTransactionInput,
    network: NetworkConfig,
    activeAccount?: { address: string } | null,
    knownTokens?: TokenConfig[]
  ): TransactionAnalysis {
    const valueWei = this.parseRawValue(tx.value);
    const toAddress = tx.to?.trim() || '';
    const calldata = tx.data?.trim() || '';
    const hasCalldata = Boolean(
      calldata &&
        calldata !== '0x' &&
        calldata !== '0x0' &&
        calldata !== '0x00'
    );

    const nativeSymbol = network.nativeCurrency.symbol;
    const nativeDecimals = network.nativeCurrency.decimals;
    const formattedNativeValue = trimDecimals(
      formatUnits(valueWei, nativeDecimals),
      6
    );

    // ─────────────────────────────────────────────────────────────
    // 1. Missing / Invalid Destination
    // ─────────────────────────────────────────────────────────────
    if (!toAddress) {
      return {
        kind: 'unknown',
        risk: 'high',
        title: 'Contract Deployment',
        summary: 'Transaction has no recipient address (Contract Creation).',
        amountRaw: valueWei.toString(),
        formattedAmount: `${formattedNativeValue} ${nativeSymbol}`,
        contract: {
          address: '',
          selector: hasCalldata ? calldata.slice(0, 10) : undefined,
          calldata: hasCalldata ? calldata : undefined,
        },
        warnings: [
          'No recipient address specified. This transaction may deploy a smart contract.',
        ],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 2. Standard Native Transfer (No Calldata)
    // ─────────────────────────────────────────────────────────────
    if (!hasCalldata) {
      return {
        kind: 'native_transfer',
        risk: 'low',
        title: `Send ${nativeSymbol}`,
        summary: `Send ${formattedNativeValue} ${nativeSymbol} to ${formatAddress(toAddress)}`,
        recipient: toAddress,
        amountRaw: valueWei.toString(),
        formattedAmount: `${formattedNativeValue} ${nativeSymbol}`,
        warnings: [],
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Calldata Present -> Inspect Function Selector
    // ─────────────────────────────────────────────────────────────
    const selector = calldata.slice(0, 10).toLowerCase();

    // 3A. ERC-20 transfer(address to, uint256 amount)
    if (selector === SELECTORS.ERC20_TRANSFER) {
      try {
        const decoded = ERC20_INTERFACE.decodeFunctionData('transfer', calldata);
        const recipient = decoded[0] as string;
        const amountRaw = decoded[1] as bigint;

        const token = this.resolveToken(toAddress, knownTokens);
        const formattedTokenAmount = trimDecimals(
          formatUnits(amountRaw, token.decimals ?? 18),
          6
        );

        const warnings: string[] = [];
        if (valueWei > 0n) {
          warnings.push(
            `Transaction also attaches ${formattedNativeValue} ${nativeSymbol} native value to this contract call.`
          );
        }

        return {
          kind: 'erc20_transfer',
          risk: 'low',
          title: `Send ${token.symbol}`,
          summary: `Transfer ${formattedTokenAmount} ${token.symbol} to ${formatAddress(recipient)}`,
          recipient,
          token,
          amountRaw: amountRaw.toString(),
          formattedAmount: `${formattedTokenAmount} ${token.symbol}`,
          warnings,
        };
      } catch {
        // Fall through to contract interaction if decoding fails
      }
    }

    // 3B. ERC-20 approve(address spender, uint256 amount)
    if (selector === SELECTORS.ERC20_APPROVE) {
      try {
        const decoded = ERC20_INTERFACE.decodeFunctionData('approve', calldata);
        const spender = decoded[0] as string;
        const amountRaw = decoded[1] as bigint;

        const token = this.resolveToken(toAddress, knownTokens);
        const isUnlimited = this.isUnlimitedApproval(amountRaw);
        const formattedTokenAmount = isUnlimited
          ? 'Unlimited'
          : trimDecimals(formatUnits(amountRaw, token.decimals ?? 18), 6);

        const warnings: string[] = [];
        if (isUnlimited) {
          warnings.push(
            'Unlimited approval allows this contract to spend an unrestricted amount of this token from your wallet.'
          );
        }
        if (valueWei > 0n) {
          warnings.push(
            `Transaction also attaches ${formattedNativeValue} ${nativeSymbol} native value.`
          );
        }

        return {
          kind: 'erc20_approval',
          risk: isUnlimited ? 'high' : 'medium',
          title: isUnlimited ? '⚠️ Token Approval' : 'Token Approval',
          summary: isUnlimited
            ? `Grant permission to ${formatAddress(spender)} to spend unlimited ${token.symbol}`
            : `Grant permission to ${formatAddress(spender)} to spend ${formattedTokenAmount} ${token.symbol}`,
          token,
          amountRaw: amountRaw.toString(),
          formattedAmount: isUnlimited
            ? `Unlimited ${token.symbol}`
            : `${formattedTokenAmount} ${token.symbol}`,
          approval: {
            spender,
            amountRaw: amountRaw.toString(),
            formattedAmount: isUnlimited
              ? `Unlimited ${token.symbol}`
              : `${formattedTokenAmount} ${token.symbol}`,
            unlimited: isUnlimited,
          },
          warnings,
        };
      } catch {
        // Fall through to contract interaction if decoding fails
      }
    }

    // 3C. ERC-20 transferFrom(address from, address to, uint256 amount)
    if (selector === SELECTORS.ERC20_TRANSFER_FROM) {
      try {
        const decoded = ERC20_INTERFACE.decodeFunctionData(
          'transferFrom',
          calldata
        );
        const sourceFrom = decoded[0] as string;
        const destTo = decoded[1] as string;
        const amountRaw = decoded[2] as bigint;

        const token = this.resolveToken(toAddress, knownTokens);
        const formattedTokenAmount = trimDecimals(
          formatUnits(amountRaw, token.decimals ?? 18),
          6
        );

        return {
          kind: 'erc20_transfer_from',
          risk: 'medium',
          title: `Transfer ${token.symbol}`,
          summary: `Transfer ${formattedTokenAmount} ${token.symbol} from ${formatAddress(sourceFrom)} to ${formatAddress(destTo)}`,
          recipient: destTo,
          token,
          amountRaw: amountRaw.toString(),
          formattedAmount: `${formattedTokenAmount} ${token.symbol}`,
          warnings: [],
        };
      } catch {
        // Fall through to contract interaction if decoding fails
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 4. Unknown / General Smart Contract Interaction
    // ─────────────────────────────────────────────────────────────
    const warnings = [
      'You are interacting with a smart contract. AXT Wallet could not fully decode this request. Only proceed if you trust this dApp.',
    ];

    if (valueWei > 0n) {
      warnings.push(
        `Sending ${formattedNativeValue} ${nativeSymbol} to this contract.`
      );
    }

    return {
      kind: 'contract_interaction',
      risk: 'high',
      title: '⚠️ Contract Interaction',
      summary:
        valueWei > 0n
          ? `Interact with contract ${formatAddress(toAddress)} sending ${formattedNativeValue} ${nativeSymbol}`
          : `Interact with contract ${formatAddress(toAddress)}`,
      amountRaw: valueWei.toString(),
      formattedAmount: `${formattedNativeValue} ${nativeSymbol}`,
      contract: {
        address: toAddress,
        selector: selector.length >= 10 ? selector : undefined,
        calldata,
      },
      warnings,
    };
  }
}

export const transactionAnalyzer = new TransactionAnalyzer();
