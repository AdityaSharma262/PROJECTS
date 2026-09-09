/**
 * Centralized IPFS, Arweave, and Metadata URI Resolver with Sequential Gateway Failover.
 */

export const DEFAULT_IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://dweb.link/ipfs/',
];

export const ARWEAVE_GATEWAY = 'https://arweave.net/';

/**
 * Converts a raw token or metadata URI into an array of candidate fetchable HTTP(S) URLs.
 */
export function resolveUriToGateways(
  uri: string,
  gateways: string[] = DEFAULT_IPFS_GATEWAYS
): string[] {
  if (!uri || typeof uri !== 'string') return [];
  const trimmed = uri.trim();

  // 1. Base64 / inline data URI
  if (trimmed.startsWith('data:')) {
    return [trimmed];
  }

  // 2. IPFS URI: ipfs://<cid> or ipfs://ipfs/<cid>
  if (trimmed.startsWith('ipfs://')) {
    let cleanPath = trimmed.replace(/^ipfs:\/\//i, '');
    if (cleanPath.startsWith('ipfs/')) {
      cleanPath = cleanPath.slice(5);
    }
    return gateways.map((gw) => `${gw.replace(/\/+$/, '')}/${cleanPath.replace(/^\/+/, '')}`);
  }

  // 3. Raw CID (e.g. Qm... or bafy...)
  if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{55})/i.test(trimmed)) {
    return gateways.map((gw) => `${gw.replace(/\/+$/, '')}/${trimmed}`);
  }

  // 4. Arweave URI: ar://<txId>
  if (trimmed.startsWith('ar://')) {
    const txId = trimmed.replace(/^ar:\/\//i, '');
    return [`${ARWEAVE_GATEWAY}${txId}`];
  }

  // 5. Standard HTTP / HTTPS
  if (/^https?:\/\//i.test(trimmed)) {
    // If it's an IPFS gateway URL already, extract CID and offer all gateways
    const ipfsMatch = trimmed.match(/\/ipfs\/([a-zA-Z0-9_\-\.\/]+)/i);
    if (ipfsMatch && ipfsMatch[1]) {
      const cidPath = ipfsMatch[1];
      const customList = [trimmed, ...gateways.map((gw) => `${gw.replace(/\/+$/, '')}/${cidPath}`)];
      return Array.from(new Set(customList));
    }
    return [trimmed];
  }

  return [trimmed];
}

/**
 * Formats an ERC-1155 token URI according to EIP-1155 specification.
 * Replaces `{id}` with a 64-character lowercase hex string without '0x' prefix.
 */
export function formatErc1155TokenUri(uri: string, tokenId: string): string {
  if (!uri || !uri.includes('{id}')) return uri;

  try {
    const hexId = BigInt(tokenId).toString(16).padStart(64, '0').toLowerCase();
    return uri.replace(/\{id\}/g, hexId);
  } catch {
    return uri;
  }
}

/**
 * Returns a primary displayable HTTP URL for an image URI.
 */
export function resolveImageUrl(
  imageUri: string | undefined | null,
  gateways: string[] = DEFAULT_IPFS_GATEWAYS
): string {
  if (!imageUri || typeof imageUri !== 'string') return '';
  const candidates = resolveUriToGateways(imageUri, gateways);
  return candidates.length > 0 ? candidates[0] : imageUri;
}

/**
 * Fetches JSON metadata with sequential gateway failover and strict timeout.
 */
export async function fetchMetadataWithTimeout(
  uri: string,
  timeoutMs = 6000,
  gateways: string[] = DEFAULT_IPFS_GATEWAYS
): Promise<any> {
  if (!uri) throw new Error('Empty metadata URI');

  // Handle Base64 Data URI directly
  if (uri.startsWith('data:application/json;base64,')) {
    const base64Data = uri.slice('data:application/json;base64,'.length);
    const jsonStr = atob(base64Data);
    return JSON.parse(jsonStr);
  }

  if (uri.startsWith('data:application/json,')) {
    const rawJson = decodeURIComponent(uri.slice('data:application/json,'.length));
    return JSON.parse(rawJson);
  }

  const candidateUrls = resolveUriToGateways(uri, gateways);
  let lastError: any = new Error('No candidate URLs to fetch metadata from');

  for (const url of candidateUrls) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
      });
      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} from ${url}`);
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (jsonErr) {
        throw new Error(`Invalid JSON returned from ${url}`);
      }
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      // Continue to next gateway
    }
  }

  throw lastError;
}
