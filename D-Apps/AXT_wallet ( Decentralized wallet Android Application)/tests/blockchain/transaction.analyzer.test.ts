import { describe, it, expect } from '@jest/globals';
import { Interface, parseEther, parseUnits, MaxUint256 } from 'ethers';
import {
  transactionAnalyzer,
  SELECTORS,
} from '../../src/blockchain/security/transaction.analyzer';
import { ETHEREUM, BASE, POLYGON } from '../../src/blockchain/networks/networks';
import { TokenConfig } from '../../src/blockchain/tokens/token.types';

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
];

const IFACE = new Interface(ERC20_ABI);

describe('TransactionAnalyzer — Security Classification & Risk Engine', () => {
  const SENDER = '0x1111111111111111111111111111111111111111';
  const RECIPIENT = '0x2222222222222222222222222222222222222222';
  const SPENDER = '0x3333333333333333333333333333333333333333';
  const TOKEN_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'; // USDC on Ethereum

  const USDC_TOKEN: TokenConfig = {
    contractAddress: TOKEN_CONTRACT,
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    chainId: 1,
  };

  describe('1. Native Transfers', () => {
    it('analyzes standard native transfer with low risk', () => {
      const analysis = transactionAnalyzer.analyzeTransaction(
        {
          from: SENDER,
          to: RECIPIENT,
          value: parseEther('1.5'),
        },
        ETHEREUM
      );

      expect(analysis.kind).toBe('native_transfer');
      expect(analysis.risk).toBe('low');
      expect(analysis.title).toBe('Send ETH');
      expect(analysis.formattedAmount).toBe('1.5 ETH');
      expect(analysis.recipient).toBe(RECIPIENT);
      expect(analysis.warnings).toHaveLength(0);
    });

    it('analyzes zero-value native transfer with low risk', () => {
      const analysis = transactionAnalyzer.analyzeTransaction(
        {
          from: SENDER,
          to: RECIPIENT,
          value: 0n,
          data: '0x',
        },
        POLYGON
      );

      expect(analysis.kind).toBe('native_transfer');
      expect(analysis.risk).toBe('low');
      expect(analysis.title).toBe('Send POL');
      expect(analysis.formattedAmount).toBe('0 POL');
    });
  });

  describe('2. ERC-20 Transfers', () => {
    it('decodes transfer(address,uint256) with low risk', () => {
      const amount = parseUnits('250', 6);
      const data = IFACE.encodeFunctionData('transfer', [RECIPIENT, amount]);

      const analysis = transactionAnalyzer.analyzeTransaction(
        {
          from: SENDER,
          to: TOKEN_CONTRACT,
          value: 0n,
          data,
        },
        ETHEREUM,
        { address: SENDER },
        [USDC_TOKEN]
      );

      expect(analysis.kind).toBe('erc20_transfer');
      expect(analysis.risk).toBe('low');
      expect(analysis.title).toBe('Send USDC');
      expect(analysis.formattedAmount).toBe('250 USDC');
      expect(analysis.recipient?.toLowerCase()).toBe(RECIPIENT.toLowerCase());
      expect(analysis.token?.symbol).toBe('USDC');
      expect(analysis.token?.decimals).toBe(6);
      expect(analysis.warnings).toHaveLength(0);
    });

    it('flags native value sent alongside ERC-20 transfer', () => {
      const amount = parseUnits('100', 6);
      const data = IFACE.encodeFunctionData('transfer', [RECIPIENT, amount]);

      const analysis = transactionAnalyzer.analyzeTransaction(
        {
          from: SENDER,
          to: TOKEN_CONTRACT,
          value: parseEther('0.1'),
          data,
        },
        ETHEREUM,
        { address: SENDER },
        [USDC_TOKEN]
      );

      expect(analysis.kind).toBe('erc20_transfer');
      expect(analysis.warnings).toHaveLength(1);
      expect(analysis.warnings[0]).toContain('native value');
    });
  });

  describe('3. ERC-20 Approvals & Unlimited Approval Detection', () => {
    it('classifies limited ERC-20 approval as medium risk', () => {
      const amount = parseUnits('500', 6);
      const data = IFACE.encodeFunctionData('approve', [SPENDER, amount]);

      const analysis = transactionAnalyzer.analyzeTransaction(
        {
          from: SENDER,
          to: TOKEN_CONTRACT,
          value: 0n,
          data,
        },
        ETHEREUM,
        { address: SENDER },
        [USDC_TOKEN]
      );

      expect(analysis.kind).toBe('erc20_approval');
      expect(analysis.risk).toBe('medium');
      expect(analysis.title).toBe('Token Approval');
      expect(analysis.approval?.spender.toLowerCase()).toBe(SPENDER.toLowerCase());
      expect(analysis.approval?.unlimited).toBe(false);
      expect(analysis.approval?.formattedAmount).toBe('500 USDC');
      expect(analysis.warnings).toHaveLength(0);
    });

    it('flags MaxUint256 approval as high risk with prominent warning', () => {
      const data = IFACE.encodeFunctionData('approve', [SPENDER, MaxUint256]);

      const analysis = transactionAnalyzer.analyzeTransaction(
        {
          from: SENDER,
          to: TOKEN_CONTRACT,
          value: 0n,
          data,
        },
        ETHEREUM,
        { address: SENDER },
        [USDC_TOKEN]
      );

      expect(analysis.kind).toBe('erc20_approval');
      expect(analysis.risk).toBe('high');
      expect(analysis.title).toContain('Token Approval');
      expect(analysis.approval?.unlimited).toBe(true);
      expect(analysis.approval?.formattedAmount).toBe('Unlimited USDC');
      expect(analysis.warnings).toHaveLength(1);
      expect(analysis.warnings[0]).toContain(
        'Unlimited approval allows this contract to spend an unrestricted amount'
      );
    });

    it('flags threshold (>= 2^255) approval as unlimited high risk', () => {
      const nearMax = 1n << 255n;
      const data = IFACE.encodeFunctionData('approve', [SPENDER, nearMax]);

      const analysis = transactionAnalyzer.analyzeTransaction(
        {
          from: SENDER,
          to: TOKEN_CONTRACT,
          value: 0n,
          data,
        },
        ETHEREUM,
        { address: SENDER },
        [USDC_TOKEN]
      );

      expect(analysis.risk).toBe('high');
      expect(analysis.approval?.unlimited).toBe(true);
    });
  });

  describe('4. ERC-20 transferFrom', () => {
    it('decodes transferFrom with medium risk', () => {
      const amount = parseUnits('50', 6);
      const data = IFACE.encodeFunctionData('transferFrom', [
        SENDER,
        RECIPIENT,
        amount,
      ]);

      const analysis = transactionAnalyzer.analyzeTransaction(
        {
          from: SPENDER,
          to: TOKEN_CONTRACT,
          data,
        },
        ETHEREUM,
        { address: SPENDER },
        [USDC_TOKEN]
      );

      expect(analysis.kind).toBe('erc20_transfer_from');
      expect(analysis.risk).toBe('medium');
      expect(analysis.formattedAmount).toBe('50 USDC');
      expect(analysis.recipient?.toLowerCase()).toBe(RECIPIENT.toLowerCase());
    });
  });

  describe('5. Unknown Contract Interactions & Edge Cases', () => {
    it('classifies custom/unknown contract call as high risk with 4-byte selector', () => {
      const customCalldata = '0x38ed17390000000000000000000000000000000000000000000000000000000000000001'; // swapExactTokensForTokens selector

      const analysis = transactionAnalyzer.analyzeTransaction(
        {
          from: SENDER,
          to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
          value: parseEther('0.05'),
          data: customCalldata,
        },
        ETHEREUM
      );

      expect(analysis.kind).toBe('contract_interaction');
      expect(analysis.risk).toBe('high');
      expect(analysis.contract?.selector).toBe('0x38ed1739');
      expect(analysis.contract?.calldata).toBe(customCalldata);
      expect(analysis.warnings.some((w) => w.includes('could not fully decode'))).toBe(true);
    });

    it('handles contract deployment (missing to address) as high risk', () => {
      const deployCalldata = '0x608060405234801561001057600080fd5b506040516101';

      const analysis = transactionAnalyzer.analyzeTransaction(
        {
          from: SENDER,
          data: deployCalldata,
        },
        BASE
      );

      expect(analysis.kind).toBe('unknown');
      expect(analysis.risk).toBe('high');
      expect(analysis.title).toBe('Contract Deployment');
    });

    it('gracefully handles malformed / truncated calldata without throwing', () => {
      const corruptData = '0xa9059cbb1234'; // transfer selector but truncated calldata

      const analysis = transactionAnalyzer.analyzeTransaction(
        {
          from: SENDER,
          to: TOKEN_CONTRACT,
          data: corruptData,
        },
        ETHEREUM
      );

      // Falls back safely to contract_interaction
      expect(analysis.kind).toBe('contract_interaction');
      expect(analysis.risk).toBe('high');
      expect(analysis.contract?.selector).toBe('0xa9059cbb');
    });
  });

  describe('6. Consistency: In-App Send & WalletConnect Equivalence', () => {
    it('produces identical analysis for in-app and WalletConnect formatted payloads', () => {
      const rawNativeTx = {
        from: SENDER,
        to: RECIPIENT,
        value: parseEther('2.0'),
        data: '0x',
      };

      const inAppAnalysis = transactionAnalyzer.analyzeTransaction(
        rawNativeTx,
        ETHEREUM
      );

      const wcAnalysis = transactionAnalyzer.analyzeTransaction(
        {
          from: SENDER,
          to: RECIPIENT,
          value: '0x1bc16d674ec80000', // 2.0 ETH in hex
          data: undefined,
        },
        ETHEREUM
      );

      expect(inAppAnalysis.kind).toBe(wcAnalysis.kind);
      expect(inAppAnalysis.risk).toBe(wcAnalysis.risk);
      expect(inAppAnalysis.formattedAmount).toBe(wcAnalysis.formattedAmount);
      expect(inAppAnalysis.recipient).toBe(wcAnalysis.recipient);
    });
  });
});
