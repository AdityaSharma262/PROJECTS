import { resolveUriToGateways } from '../nft/ipfs.utils';
import { TokenConfig } from './token.types';

/**
 * High quality token logo repository mapping for known tokens & native assets.
 * Uses trusted decentralized / raw assets repositories.
 */
const KNOWN_TOKEN_LOGOS: Record<string, string> = {
  // Native & Major Assets
  ETH: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
  WETH: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
  BTC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/bitcoin/info/logo.png',
  WBTC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
  BNB: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png',
  WBNB: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c/logo.png',
  POL: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
  MATIC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png',
  AVAX: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/avalanchex/info/logo.png',
  FTM: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/fantom/info/logo.png',
  ARB: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png',
  OP: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png',

  // Stablecoins
  USDC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  USDBC: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  USDT: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
  DAI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
  BUSD: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56/logo.png',

  // DeFi & Governance
  LINK: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png',
  UNI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
  AAVE: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png',
  SHIB: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE/logo.png',
  PEPE: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png',
  CRV: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xD533a949740bb3306d119CC777fa900bA034cd52/logo.png',
  MKR: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2/logo.png',
  LDO: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32/logo.png',
};

/**
 * Resolves a token's actual image/logo URL.
 * Handles custom token logoUrl (including IPFS resolution) and known symbols.
 */
export function resolveTokenLogoUrl(
  tokenOrSymbol?: TokenConfig | { symbol: string; logoUrl?: string } | string | null
): string | null {
  if (!tokenOrSymbol) return null;

  if (typeof tokenOrSymbol === 'string') {
    const sym = tokenOrSymbol.toUpperCase().trim();
    return KNOWN_TOKEN_LOGOS[sym] || null;
  }

  // 1. If token has custom logoUrl, resolve gateways
  if (tokenOrSymbol.logoUrl) {
    const urls = resolveUriToGateways(tokenOrSymbol.logoUrl);
    if (urls.length > 0) return urls[0];
  }

  // 2. Lookup known symbol
  const symbol = (tokenOrSymbol.symbol || '').toUpperCase().trim();
  return KNOWN_TOKEN_LOGOS[symbol] || null;
}
