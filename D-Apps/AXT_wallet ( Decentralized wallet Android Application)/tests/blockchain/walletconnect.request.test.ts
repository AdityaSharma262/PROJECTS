import { describe, it, expect } from '@jest/globals';
import { walletConnectRequestHandler } from '../../src/blockchain/walletconnect/walletconnect.request.handler';
import { WCRequest } from '../../src/blockchain/walletconnect/walletconnect.types';
import { SessionBinding } from '../../src/blockchain/walletconnect/walletconnect.service';
import { ETHEREUM } from '../../src/blockchain/networks/networks';

describe('WalletConnectRequestHandler — EIP-1193 Methods & Validation', () => {
  const mockBinding: SessionBinding = {
    topic: 'topic-test-123',
    approvedAccount: '0x1111111111111111111111111111111111111111',
    approvedAccountIndex: 0,
    approvedAccountName: 'Account 1',
    approvedChainIds: [1, 8453],
  };

  describe('parseTransactionRequest', () => {
    it('parses native transfer request and calculates formatted amount', async () => {
      const request: WCRequest = {
        id: 101,
        topic: 'topic-test-123',
        chainId: 1,
        method: 'eth_sendTransaction',
        params: [
          {
            from: '0x1111111111111111111111111111111111111111',
            to: '0x2222222222222222222222222222222222222222',
            value: '0xde0b6b3a7640000', // 1.0 ETH
          },
        ],
        account: '',
      };

      const result = await walletConnectRequestHandler.parseTransactionRequest(
        request,
        mockBinding,
        ETHEREUM
      );

      expect(result.requestId).toBe(101);
      expect(result.from).toBe('0x1111111111111111111111111111111111111111');
      expect(result.to).toBe('0x2222222222222222222222222222222222222222');
      expect(result.formattedValue).toBe('1');
      expect(result.symbol).toBe('ETH');
      expect(result.isContractInteraction).toBe(false);
      expect(result.analysis).toBeDefined();
      expect(result.analysis.kind).toBe('native_transfer');
      expect(result.analysis.risk).toBe('low');
    });

    it('identifies contract interactions when calldata is present', async () => {
      const request: WCRequest = {
        id: 102,
        topic: 'topic-test-123',
        chainId: 1,
        method: 'eth_sendTransaction',
        params: [
          {
            from: '0x1111111111111111111111111111111111111111',
            to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            value: '0x0',
            data: '0xa9059cbb00000000000000000000000022222222222222222222222222222222222222220000000000000000000000000000000000000000000000000000000005f5e100',
          },
        ],
        account: '',
      };

      const result = await walletConnectRequestHandler.parseTransactionRequest(
        request,
        mockBinding,
        ETHEREUM
      );

      expect(result.isContractInteraction).toBe(true);
      expect(result.data).toBe(request.params[0].data);
      expect(result.analysis).toBeDefined();
      expect(result.analysis.kind).toBe('erc20_transfer');
      expect(result.analysis.risk).toBe('low');
      expect(result.analysis.recipient?.toLowerCase()).toBe(
        '0x2222222222222222222222222222222222222222'
      );
    });

    it('rejects transaction if from address does not match approved session account', async () => {
      const request: WCRequest = {
        id: 103,
        topic: 'topic-test-123',
        chainId: 1,
        method: 'eth_sendTransaction',
        params: [
          {
            from: '0x9999999999999999999999999999999999999999',
            to: '0x2222222222222222222222222222222222222222',
            value: '0x1',
          },
        ],
        account: '',
      };

      await expect(
        walletConnectRequestHandler.parseTransactionRequest(request, mockBinding, ETHEREUM)
      ).rejects.toThrow('Sender address');
    });
  });

  describe('parseMessageRequest', () => {
    it('parses and decodes personal_sign hex message into UTF-8 text', async () => {
      const hexMessage = '0x48656c6c6f20576f726c64'; // "Hello World"
      const request: WCRequest = {
        id: 201,
        topic: 'topic-test-123',
        chainId: 1,
        method: 'personal_sign',
        params: [hexMessage, mockBinding.approvedAccount],
        account: '',
      };

      const result = await walletConnectRequestHandler.parseMessageRequest(
        request,
        mockBinding,
        ETHEREUM
      );

      expect(result.method).toBe('personal_sign');
      expect(result.displayMessage).toBe('Hello World');
      expect(result.from).toBe(mockBinding.approvedAccount);
      expect(result.analysis).toBeDefined();
      expect(result.analysis.kind).toBe('personal_message');
      expect(result.analysis.risk).toBe('low');
    });

    it('parses personal_sign with reversed parameter order [address, message]', async () => {
      const hexMessage = '0x48656c6c6f20576f726c64';
      const request: WCRequest = {
        id: 2012,
        topic: 'topic-test-123',
        chainId: 1,
        method: 'personal_sign',
        params: [mockBinding.approvedAccount, hexMessage],
        account: '',
      };

      const result = await walletConnectRequestHandler.parseMessageRequest(
        request,
        mockBinding,
        ETHEREUM
      );

      expect(result.from).toBe(mockBinding.approvedAccount);
      expect(result.displayMessage).toBe('Hello World');
      expect(result.analysis.kind).toBe('personal_message');
    });

    it('parses EIP-712 eth_signTypedData_v4 JSON parameters and computes analysis', async () => {
      const typedData = {
        domain: { name: 'Ether Mail', version: '1', chainId: 1 },
        types: {
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
        },
        primaryType: 'Person',
        message: { name: 'Alice', wallet: '0x2222222222222222222222222222222222222222' },
      };

      const request: WCRequest = {
        id: 202,
        topic: 'topic-test-123',
        chainId: 1,
        method: 'eth_signTypedData_v4',
        params: [mockBinding.approvedAccount, JSON.stringify(typedData)],
        account: '',
      };

      const result = await walletConnectRequestHandler.parseMessageRequest(
        request,
        mockBinding,
        ETHEREUM
      );

      expect(result.method).toBe('eth_signTypedData_v4');
      expect(result.typedDataDomain.name).toBe('Ether Mail');
      expect(result.typedDataValue.name).toBe('Alice');
      expect(result.analysis).toBeDefined();
      expect(result.analysis.kind).toBe('typed_data');
      expect(result.analysis.risk).toBe('medium');
    });

    it('rejects unsupported signing methods', async () => {
      const request: WCRequest = {
        id: 203,
        topic: 'topic-test-123',
        chainId: 1,
        method: 'eth_signTransaction', // Not a supported direct message sign method
        params: [],
        account: '',
      };

      await expect(
        walletConnectRequestHandler.validateRequest(request, [ETHEREUM])
      ).rejects.toThrow('Unsupported method');
    });
  });
});

