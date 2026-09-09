import { describe, it, expect, jest } from '@jest/globals';
import { Interface, parseUnits } from 'ethers';
import { tokenService } from '../../src/blockchain/tokens/token.service';
import { ERC20_MINIMAL_ABI } from '../../src/blockchain/tokens/erc20.abi';
import { TokenConfig } from '../../src/blockchain/tokens/token.types';

describe('Token Service', () => {
  const recipient = '0x1111111111111111111111111111111111111111';
  const tokenAddress = '0x2222222222222222222222222222222222222222';
  const chainId = 11155111;

  describe('encodeTransferData', () => {
    it('generates standard ERC-20 transfer calldata with correct function selector 0xa9059cbb', () => {
      const amountUnits = parseUnits('100.5', 18);
      const calldata = tokenService.encodeTransferData(recipient, amountUnits);

      expect(calldata.startsWith('0xa9059cbb')).toBe(true);

      const iface = new Interface(ERC20_MINIMAL_ABI);
      const decoded = iface.decodeFunctionData('transfer', calldata);

      expect(decoded[0].toLowerCase()).toBe(recipient.toLowerCase());
      expect(decoded[1]).toBe(amountUnits);
    });

    it('encodes 6-decimal token amounts accurately without precision loss', () => {
      const amountUnits = parseUnits('50.123456', 6);
      const calldata = tokenService.encodeTransferData(recipient, amountUnits);

      const iface = new Interface(ERC20_MINIMAL_ABI);
      const decoded = iface.decodeFunctionData('transfer', calldata);

      expect(decoded[1]).toBe(50123456n);
    });
  });

  describe('fetchTokenMetadata', () => {
    it('rejects invalid EVM address strings', async () => {
      const mockProvider: any = {};
      const result = await tokenService.fetchTokenMetadata(
        mockProvider,
        'not-an-address',
        chainId
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid EVM address');
    });

    it('rejects addresses with no bytecode on the network (EOA)', async () => {
      const mockProvider: any = {
        getCode: jest.fn<() => Promise<string>>().mockResolvedValue('0x'),
      };

      const result = await tokenService.fetchTokenMetadata(
        mockProvider,
        tokenAddress,
        chainId
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('No smart contract found');
    });

    it('safely extracts name, symbol, and decimals from a valid contract', async () => {
      const mockProvider: any = {
        getCode: jest.fn<() => Promise<string>>().mockResolvedValue('0x608060405234801561001057600080fd5b50'),
        call: jest.fn<({ data }: { data: string }) => Promise<string>>().mockImplementation(async ({ data }: { data: string }) => {
          const iface = new Interface(ERC20_MINIMAL_ABI);
          // symbol()
          if (data.startsWith(iface.getFunction('symbol')!.selector)) {
            return iface.encodeFunctionResult('symbol', ['MOCK']);
          }
          // name()
          if (data.startsWith(iface.getFunction('name')!.selector)) {
            return iface.encodeFunctionResult('name', ['Mock USD']);
          }
          // decimals()
          if (data.startsWith(iface.getFunction('decimals')!.selector)) {
            return iface.encodeFunctionResult('decimals', [6]);
          }
          return '0x';
        }),
      };

      const result = await tokenService.fetchTokenMetadata(
        mockProvider,
        tokenAddress,
        chainId
      );

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.token?.name).toBe('Mock USD');
      expect(result.token?.symbol).toBe('MOCK');
      expect(result.token?.decimals).toBe(6);
      expect(result.token?.isCustom).toBe(true);
    });

    it('handles untrusted or reverting contract calls with safe fallbacks', async () => {
      const mockProvider: any = {
        getCode: jest.fn<() => Promise<string>>().mockResolvedValue('0x608060405234801561001057600080fd5b50'),
        call: jest.fn<({ data }: { data: string }) => Promise<string>>().mockRejectedValue(new Error('execution reverted')),
      };

      const result = await tokenService.fetchTokenMetadata(
        mockProvider,
        tokenAddress,
        chainId
      );

      expect(result.success).toBe(true);
      expect(result.token?.symbol).toBe('TOKEN');
      expect(result.token?.name).toBe('TOKEN');
      expect(result.token?.decimals).toBe(18);
    });
  });

  describe('getTokenBalance', () => {
    it('queries balanceOf and formats balance accurately for 18 decimals', async () => {
      const token: TokenConfig = {
        chainId,
        contractAddress: tokenAddress,
        name: 'Dai Stablecoin',
        symbol: 'DAI',
        decimals: 18,
      };

      const mockProvider: any = {
        call: jest.fn<({ data }: { data: string }) => Promise<string>>().mockImplementation(async ({ data }: { data: string }) => {
          const iface = new Interface(ERC20_MINIMAL_ABI);
          if (data.startsWith(iface.getFunction('balanceOf')!.selector)) {
            return iface.encodeFunctionResult('balanceOf', [150000000000000000000n]); // 150.0 DAI
          }
          return '0x';
        }),
      };

      const balance = await tokenService.getTokenBalance(
        mockProvider,
        recipient,
        token
      );

      expect(balance.rawBalance).toBe(150000000000000000000n);
      expect(balance.formatted).toBe('150.0');
      expect(balance.token.symbol).toBe('DAI');
    });

    it('queries balanceOf and formats balance accurately for 6 decimals', async () => {
      const token: TokenConfig = {
        chainId,
        contractAddress: tokenAddress,
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
      };

      const mockProvider: any = {
        call: jest.fn<({ data }: { data: string }) => Promise<string>>().mockImplementation(async ({ data }: { data: string }) => {
          const iface = new Interface(ERC20_MINIMAL_ABI);
          if (data.startsWith(iface.getFunction('balanceOf')!.selector)) {
            return iface.encodeFunctionResult('balanceOf', [250500000n]); // 250.5 USDC
          }
          return '0x';
        }),
      };

      const balance = await tokenService.getTokenBalance(
        mockProvider,
        recipient,
        token
      );

      expect(balance.rawBalance).toBe(250500000n);
      expect(balance.formatted).toBe('250.5');
    });
  });
});
