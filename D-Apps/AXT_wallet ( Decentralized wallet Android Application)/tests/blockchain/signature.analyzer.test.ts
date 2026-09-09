import { describe, it, expect } from '@jest/globals';
import { signatureAnalyzer } from '../../src/blockchain/security/signature.analyzer';
import { ETHEREUM, BASE, POLYGON } from '../../src/blockchain/networks/networks';

describe('SignatureAnalyzer — Security Classification & Risk Engine', () => {
  const SIGNER = '0x1111111111111111111111111111111111111111';
  const DAPP_NAME = 'Uniswap Interface';

  describe('1. personal_sign', () => {
    it('analyzes clean human-readable ASCII text as low risk', () => {
      const analysis = signatureAnalyzer.analyzeSignature(
        {
          method: 'personal_sign',
          from: SIGNER,
          rawMessage: 'Sign in to Uniswap Interface at https://app.uniswap.org',
          dAppName: DAPP_NAME,
        },
        ETHEREUM
      );

      expect(analysis.kind).toBe('personal_message');
      expect(analysis.risk).toBe('low');
      expect(analysis.title).toBe('Personal Message Signature');
      expect(analysis.decodedMessage).toBe(
        'Sign in to Uniswap Interface at https://app.uniswap.org'
      );
      expect(analysis.warnings).toHaveLength(0);
    });

    it('decodes UTF-8 hex encoded text as low risk', () => {
      // "Welcome to Web3" in hex: 0x57656c636f6d6520746f2057656233
      const hex = '0x57656c636f6d6520746f2057656233';
      const analysis = signatureAnalyzer.analyzeSignature(
        {
          method: 'personal_sign',
          from: SIGNER,
          rawMessage: hex,
          dAppName: DAPP_NAME,
        },
        ETHEREUM
      );

      expect(analysis.kind).toBe('personal_message');
      expect(analysis.risk).toBe('low');
      expect(analysis.decodedMessage).toBe('Welcome to Web3');
      expect(analysis.warnings).toHaveLength(0);
    });

    it('flags unreadable / binary hex data as medium risk with warning', () => {
      const binaryHex = '0x00112233445566778899aabbccddeeff';
      const analysis = signatureAnalyzer.analyzeSignature(
        {
          method: 'personal_sign',
          from: SIGNER,
          rawMessage: binaryHex,
          dAppName: DAPP_NAME,
        },
        ETHEREUM
      );

      expect(analysis.kind).toBe('personal_message');
      expect(analysis.risk).toBe('medium');
      expect(analysis.title).toBe('Encoded Personal Message');
      expect(analysis.warnings).toHaveLength(1);
      expect(analysis.warnings[0]).toContain('unreadable or raw binary data');
    });
  });

  describe('2. eth_sign', () => {
    it('classifies eth_sign as high risk with dangerous arbitrary signing warning', () => {
      const rawHash =
        '0x0405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20212223';
      const analysis = signatureAnalyzer.analyzeSignature(
        {
          method: 'eth_sign',
          from: SIGNER,
          rawMessage: rawHash,
          dAppName: DAPP_NAME,
        },
        ETHEREUM
      );

      expect(analysis.kind).toBe('raw_message');
      expect(analysis.risk).toBe('high');
      expect(analysis.title).toContain('eth_sign');
      expect(analysis.warnings).toHaveLength(1);
      expect(analysis.warnings[0]).toContain('arbitrary binary data without clear intent');
    });
  });

  describe('3. eth_signTypedData / EIP-712', () => {
    const validTypedData = {
      domain: {
        name: 'Permit2',
        version: '1',
        chainId: 1,
        verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
      },
      types: {
        PermitSingle: [
          { name: 'details', type: 'PermitDetails' },
          { name: 'spender', type: 'address' },
          { name: 'sigDeadline', type: 'uint256' },
        ],
        PermitDetails: [
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint160' },
          { name: 'expiration', type: 'uint48' },
          { name: 'nonce', type: 'uint48' },
        ],
      },
      primaryType: 'PermitSingle',
      message: {
        details: {
          token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          amount: '100000000',
          expiration: '1725360000',
          nonce: '0',
        },
        spender: '0x3333333333333333333333333333333333333333',
        sigDeadline: '1725360000',
      },
    };

    it('parses valid EIP-712 typed data preserving domain, primary type, and nested fields', () => {
      const analysis = signatureAnalyzer.analyzeSignature(
        {
          method: 'eth_signTypedData_v4',
          from: SIGNER,
          rawMessage: JSON.stringify(validTypedData),
          dAppName: 'Permit2 Protocol',
        },
        ETHEREUM,
        1
      );

      expect(analysis.kind).toBe('typed_data');
      expect(analysis.risk).toBe('medium');
      expect(analysis.primaryType).toBe('PermitSingle');
      expect(analysis.typedDataDomain?.name).toBe('Permit2');
      expect(analysis.typedDataDomain?.verifyingContract).toBe(
        '0x000000000022D473030F116dDEE9F6B43aC78BA3'
      );

      // Verify nested structure preservation
      const detailsField = analysis.structuredFields?.find(
        (f) => f.key === 'details'
      );
      expect(detailsField).toBeDefined();
      expect(detailsField?.isNested).toBe(true);
      expect(detailsField?.value).toContain('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');

      const spenderField = analysis.structuredFields?.find(
        (f) => f.key === 'spender'
      );
      expect(spenderField?.value).toBe(
        '0x3333333333333333333333333333333333333333'
      );
      expect(analysis.warnings).toHaveLength(0);
    });

    it('detects chain ID mismatch between domain.chainId and session chainId', () => {
      const mismatchedData = {
        ...validTypedData,
        domain: {
          ...validTypedData.domain,
          chainId: 8453, // Base chain ID
        },
      };

      const analysis = signatureAnalyzer.analyzeSignature(
        {
          method: 'eth_signTypedData_v4',
          from: SIGNER,
          rawMessage: JSON.stringify(mismatchedData),
          dAppName: 'Cross-chain App',
        },
        ETHEREUM,
        1 // Ethereum session chain ID
      );

      expect(analysis.kind).toBe('typed_data');
      expect(analysis.risk).toBe('high');
      expect(analysis.warnings.some((w) => w.includes('Chain ID Mismatch'))).toBe(
        true
      );
    });

    it('handles malformed JSON or corrupted typed data safely', () => {
      const corruptJson = '{"domain": {"name": "Broken", broken_syntax';

      const analysis = signatureAnalyzer.analyzeSignature(
        {
          method: 'eth_signTypedData_v4',
          from: SIGNER,
          rawMessage: corruptJson,
          dAppName: DAPP_NAME,
        },
        ETHEREUM
      );

      expect(analysis.kind).toBe('unknown');
      expect(analysis.risk).toBe('high');
      expect(analysis.title).toContain('Malformed Typed Data');
      expect(analysis.rawPayload).toBe(corruptJson);
      expect(analysis.warnings[0]).toContain('malformed');
    });
  });

  describe('4. Unsupported and Edge Cases', () => {
    it('handles unknown / unsupported signing methods', () => {
      const analysis = signatureAnalyzer.analyzeSignature(
        {
          method: 'unknown_sign_method',
          from: SIGNER,
          rawMessage: 'hello',
        },
        ETHEREUM
      );

      expect(analysis.kind).toBe('unknown');
      expect(analysis.risk).toBe('high');
      expect(analysis.title).toContain('Unsupported');
    });

    it('safely handles non-string or null rawMessage without throwing', () => {
      const analysis = signatureAnalyzer.analyzeSignature(
        {
          method: 'personal_sign',
          from: SIGNER,
          rawMessage: null,
        },
        ETHEREUM
      );

      expect(analysis.kind).toBe('personal_message');
      expect(analysis.decodedMessage).toBe('null');
    });
  });
});
