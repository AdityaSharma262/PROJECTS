import {
  JsonRpcProvider,
  Contract,
  Interface,
  isAddress,
  getAddress,
  formatUnits,
} from 'ethers';
import { ERC20_MINIMAL_ABI } from './erc20.abi';
import {
  TokenConfig,
  TokenMetadataResult,
  TokenBalanceModel,
} from './token.types';

export class TokenService {
  private readonly erc20Interface = new Interface(ERC20_MINIMAL_ABI);

  /**
   * Validates an ERC-20 contract on the given network, checks that bytecode exists,
   * and safely queries its name, symbol, and decimals with robust fallback handling.
   *
   * @param provider - Active JsonRpcProvider
   * @param contractAddress - The target token contract address
   * @param chainId - Active chain ID
   */
  async fetchTokenMetadata(
    provider: JsonRpcProvider,
    contractAddress: string,
    chainId: number
  ): Promise<TokenMetadataResult> {
    const trimmed = contractAddress.trim();

    if (!isAddress(trimmed)) {
      return { success: false, error: 'Invalid EVM address format.' };
    }

    try {
      const checksummed = getAddress(trimmed);

      // 1. Verify that smart contract code exists at the address on this network
      const bytecode = await provider.getCode(checksummed);
      if (!bytecode || bytecode === '0x' || bytecode === '0x0') {
        return {
          success: false,
          error: 'No smart contract found at this address on the current network.',
        };
      }

      // 2. Query ERC-20 metadata safely with individual fallbacks
      const contract = new Contract(checksummed, ERC20_MINIMAL_ABI, provider);

      let name = 'Custom Token';
      let symbol = 'TOKEN';
      let decimals = 18;

      const [rawSymbolResult, rawNameResult, rawDecimalsResult] = await Promise.allSettled([
        contract.symbol(),
        contract.name(),
        contract.decimals(),
      ]);

      if (rawSymbolResult.status === 'fulfilled' && rawSymbolResult.value && typeof rawSymbolResult.value === 'string') {
        symbol = rawSymbolResult.value.trim().slice(0, 16);
      }

      if (rawNameResult.status === 'fulfilled' && rawNameResult.value && typeof rawNameResult.value === 'string') {
        name = rawNameResult.value.trim().slice(0, 64);
      } else {
        name = symbol;
      }

      if (rawDecimalsResult.status === 'fulfilled') {
        const parsed = Number(rawDecimalsResult.value);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 36) {
          decimals = parsed;
        }
      }

      const token: TokenConfig = {
        chainId,
        contractAddress: checksummed,
        name,
        symbol,
        decimals,
        isCustom: true,
      };

      return { success: true, token };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to inspect token contract metadata.',
      };
    }
  }

  /**
   * Fetches the ERC-20 balance for a given wallet address and token configuration.
   */
  async getTokenBalance(
    provider: JsonRpcProvider,
    walletAddress: string,
    token: TokenConfig
  ): Promise<TokenBalanceModel> {
    const defaultModel: TokenBalanceModel = {
      token,
      rawBalance: 0n,
      formatted: '0.0',
      lastUpdatedAt: new Date().toISOString(),
    };

    if (!isAddress(walletAddress) || !isAddress(token.contractAddress)) {
      return defaultModel;
    }

    try {
      const contract = new Contract(token.contractAddress, ERC20_MINIMAL_ABI, provider);
      const raw = await contract.balanceOf(walletAddress);
      const rawBalance = BigInt(raw.toString());
      const formatted = formatUnits(rawBalance, token.decimals);

      return {
        token,
        rawBalance,
        formatted,
        lastUpdatedAt: new Date().toISOString(),
      };
    } catch {
      return defaultModel;
    }
  }

  /**
   * Queries balances for an array of tokens in parallel.
   */
  async getAllTokenBalances(
    provider: JsonRpcProvider,
    walletAddress: string,
    tokens: TokenConfig[]
  ): Promise<TokenBalanceModel[]> {
    if (!tokens || tokens.length === 0) return [];

    const promises = tokens.map((token) =>
      this.getTokenBalance(provider, walletAddress, token)
    );

    return await Promise.all(promises);
  }

  /**
   * Encodes standard ERC-20 transfer(address to, uint256 amount) calldata.
   */
  encodeTransferData(recipient: string, amountUnits: bigint): string {
    return this.erc20Interface.encodeFunctionData('transfer', [
      recipient,
      amountUnits,
    ]);
  }
}

export const tokenService = new TokenService();
