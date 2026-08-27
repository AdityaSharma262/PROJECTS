/**
 * Pure utility functions for formatting EVM balances.
 * These do NOT import ethers, so they can be unit-tested in Node/Jest without ESM issues.
 * The actual formatEther call remains in balance.service.ts where ethers is already available.
 */

/**
 * Validates that a string looks like a valid checksummed or lowercase EVM address.
 * This is a lightweight pre-check. The authoritative validation uses ethers.isAddress.
 */
export function looksLikeEvmAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

/**
 * Trims a formatted balance string to a maximum number of decimal places.
 * Removes trailing zeros from the decimal part.
 *
 * @example trimDecimals("1.000000000000000000", 6) → "1.0"
 * @example trimDecimals("0.100000000000000000", 6) → "0.1"
 */
export function trimDecimals(formatted: string, maxDecimals: number = 6): string {
  const [whole, dec] = formatted.split('.');
  if (!dec) return whole;
  const trimmed = dec.slice(0, maxDecimals).replace(/0+$/, '');
  return trimmed ? `${whole}.${trimmed}` : whole;
}

/**
 * Converts a raw wei bigint to an ETH-unit string using manual arithmetic.
 * This is used only in tests. The production path uses ethers.formatEther.
 *
 * @param wei - Raw balance in wei
 * @returns Formatted string like "1.5" or "0.001"
 */
export function formatWeiToEth(wei: bigint): string {
  const WEI_PER_ETH = BigInt('1000000000000000000');
  const whole = wei / WEI_PER_ETH;
  const remainder = wei % WEI_PER_ETH;
  if (remainder === BigInt(0)) {
    return `${whole}.0`;
  }
  // Pad remainder to 18 digits
  const remStr = remainder.toString().padStart(18, '0').replace(/0+$/, '');
  return `${whole}.${remStr}`;
}
