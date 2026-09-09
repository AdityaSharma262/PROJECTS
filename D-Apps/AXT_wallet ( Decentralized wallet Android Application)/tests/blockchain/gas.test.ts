import { describe, it, expect, jest } from '@jest/globals';
import { GasService } from '../../src/blockchain/transactions/gas.service';
import { FeeEstimate } from '../../src/blockchain/transactions/transaction.types';
import { SEPOLIA, BSC_TESTNET } from '../../src/blockchain/networks/networks';

describe('GasService', () => {
  const gasService = new GasService();

  describe('calculateMaxSendable', () => {
    it('correctly subtracts maximum possible fee from balance', () => {
      const balanceWei = 1000000000000000000n; // 1.0 ETH
      const feeEstimate: FeeEstimate = {
        feeModel: 'eip1559',
        gasLimit: 21000n,
        maxFeePerGas: 20000000000n, // 20 gwei
        maxPossibleFeeWei: 420000000000000n, // 21000 * 20 gwei = 0.00042 ETH
        estimatedFeeWei: 420000000000000n,
        formattedFee: '0.00042 ETH',
        formattedMaxFee: '0.00042 ETH',
      };

      const maxSendable = gasService.calculateMaxSendable(balanceWei, feeEstimate);
      expect(maxSendable).toBe(1000000000000000000n - 420000000000000n);
      expect(maxSendable).toBe(999580000000000000n);
    });

    it('returns 0n when balance is less than or equal to max possible fee', () => {
      const balanceWei = 400000000000000n; // 0.00040 ETH (less than 0.00042)
      const feeEstimate: FeeEstimate = {
        feeModel: 'eip1559',
        gasLimit: 21000n,
        maxPossibleFeeWei: 420000000000000n,
        estimatedFeeWei: 420000000000000n,
        formattedFee: '0.00042 ETH',
        formattedMaxFee: '0.00042 ETH',
      };

      const maxSendable = gasService.calculateMaxSendable(balanceWei, feeEstimate);
      expect(maxSendable).toBe(0n);
    });
  });

  describe('validateSufficiency', () => {
    const feeEstimate: FeeEstimate = {
      feeModel: 'eip1559',
      gasLimit: 21000n,
      maxPossibleFeeWei: 420000000000000n,
      estimatedFeeWei: 420000000000000n,
      formattedFee: '0.00042 ETH',
      formattedMaxFee: '0.00042 ETH',
    };

    it('rejects an amount of 0 or negative', () => {
      const result = gasService.validateSufficiency(1000000000000000000n, 0n, feeEstimate);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('greater than 0');
    });

    it('rejects when balance is insufficient for amount + fee', () => {
      const balanceWei = 1000000000000000000n; // 1.0 ETH
      const amountWei = 1000000000000000000n; // 1.0 ETH (no room for 0.00042 ETH fee)
      const result = gasService.validateSufficiency(balanceWei, amountWei, feeEstimate);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Insufficient balance');
    });

    it('accepts when balance covers amount + max fee', () => {
      const balanceWei = 1000000000000000000n; // 1.0 ETH
      const amountWei = 500000000000000000n; // 0.5 ETH
      const result = gasService.validateSufficiency(balanceWei, amountWei, feeEstimate);
      expect(result.isValid).toBe(true);
    });
  });

  describe('estimateTransactionFee - Dynamic Model Detection', () => {
    it('detects EIP-1559 fee model when maxFeePerGas is returned by provider', async () => {
      const mockProvider: any = {
        getFeeData: jest.fn(async () => ({
          maxFeePerGas: 25000000000n,
          maxPriorityFeePerGas: 1500000000n,
          gasPrice: null,
        })),
        estimateGas: jest.fn(async () => 21000n),
      };

      const from = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
      const to = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
      const amount = 100000000000000000n;

      const estimate = await gasService.estimateTransactionFee(
        mockProvider,
        from,
        to,
        amount,
        SEPOLIA
      );

      expect(estimate.feeModel).toBe('eip1559');
      expect(estimate.maxFeePerGas).toBe(25000000000n);
      expect(estimate.maxPriorityFeePerGas).toBe(1500000000n);
      expect(estimate.gasLimit).toBeGreaterThanOrEqual(21000n);
    });

    it('detects Legacy fee model when only gasPrice is returned by provider', async () => {
      const mockProvider: any = {
        getFeeData: jest.fn(async () => ({
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
          gasPrice: 10000000000n, // 10 gwei
        })),
        estimateGas: jest.fn(async () => 21000n),
      };

      const from = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
      const to = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
      const amount = 100000000000000000n;

      const estimate = await gasService.estimateTransactionFee(
        mockProvider,
        from,
        to,
        amount,
        BSC_TESTNET
      );

      expect(estimate.feeModel).toBe('legacy');
      expect(estimate.gasPrice).toBe(10000000000n);
      expect(estimate.maxFeePerGas).toBeUndefined();
    });

    it('applies a 10% safety buffer to estimated gas limit without dropping below floor', async () => {
      const mockProvider: any = {
        getFeeData: jest.fn(async () => ({
          gasPrice: 10000000000n,
        })),
        estimateGas: jest.fn(async () => 50000n), // Higher contract estimate
      };

      const from = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
      const to = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';

      const estimate = await gasService.estimateTransactionFee(
        mockProvider,
        from,
        to,
        100000000000000000n,
        SEPOLIA
      );

      // 50000 * 1.1 = 55000
      expect(estimate.gasLimit).toBe(55000n);
    });
  });

  describe('validateTokenSufficiency', () => {
    const feeEstimate: FeeEstimate = {
      feeModel: 'eip1559',
      gasLimit: 65000n,
      maxPossibleFeeWei: 1300000000000000n, // 0.0013 ETH
      estimatedFeeWei: 1300000000000000n,
      formattedFee: '0.0013 ETH',
      formattedMaxFee: '0.0013 ETH',
    };

    it('rejects when token amount is 0', () => {
      const result = gasService.validateTokenSufficiency(
        100000000n, // 100 USDC (6 decimals)
        0n,
        1000000000000000000n, // 1.0 ETH
        feeEstimate,
        'USDC',
        'ETH'
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('greater than 0');
    });

    it('rejects when token balance is less than requested amount', () => {
      const result = gasService.validateTokenSufficiency(
        50000000n, // 50 USDC
        100000000n, // trying to send 100 USDC
        1000000000000000000n, // 1.0 ETH
        feeEstimate,
        'USDC',
        'ETH'
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Insufficient USDC balance');
    });

    it('rejects when token balance is sufficient but native gas balance is insufficient', () => {
      const result = gasService.validateTokenSufficiency(
        100000000n, // 100 USDC
        100000000n, // 100 USDC
        100000000000000n, // 0.0001 ETH (less than 0.0013 ETH fee)
        feeEstimate,
        'USDC',
        'ETH'
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Insufficient ETH to pay estimated maximum network fee');
    });

    it('accepts when both token balance and native gas balance are sufficient', () => {
      const result = gasService.validateTokenSufficiency(
        100000000n, // 100 USDC
        100000000n, // 100 USDC
        50000000000000000n, // 0.05 ETH (plenty for 0.0013 ETH fee)
        feeEstimate,
        'USDC',
        'ETH'
      );
      expect(result.isValid).toBe(true);
    });
  });
});
