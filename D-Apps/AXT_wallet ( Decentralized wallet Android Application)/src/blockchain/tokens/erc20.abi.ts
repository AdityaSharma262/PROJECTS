/**
 * Minimal human-readable ABI containing only the functions necessary
 * for ERC-20 metadata reading, balance querying, and transfer calldata encoding.
 */
export const ERC20_MINIMAL_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
] as const;
