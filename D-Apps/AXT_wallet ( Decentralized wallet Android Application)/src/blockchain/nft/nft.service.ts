import { Contract, AbstractProvider, Interface, isAddress } from 'ethers';
import {
  NFTItem,
  NFTStandard,
  NFTTrait,
  NFTMetadata,
  InspectNFTResult,
} from './nft.types';
import {
  fetchMetadataWithTimeout,
  formatErc1155TokenUri,
  resolveImageUrl,
} from './ipfs.utils';
import { getNftCompositeId } from '../../storage/nft-storage';

const ERC165_ABI = [
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
];

const ERC721_ABI = [
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
];

const ERC1155_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function uri(uint256 id) view returns (string)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
];

const ERC721_INTERFACE_ID = '0x80ac58cd';
const ERC1155_INTERFACE_ID = '0xd9b21057';

export class NftService {
  /**
   * Detects whether an on-chain contract is ERC-721 or ERC-1155.
   */
  async detectStandard(
    provider: AbstractProvider,
    contractAddress: string,
    tokenId: string,
    ownerAddress: string
  ): Promise<NFTStandard> {
    const erc165 = new Contract(contractAddress, ERC165_ABI, provider);

    // 1. Try ERC-165 standard interface check
    try {
      const is721 = await erc165.supportsInterface(ERC721_INTERFACE_ID);
      if (is721) return 'ERC-721';
    } catch {
      // Interface check unsupported or reverted
    }

    try {
      const is1155 = await erc165.supportsInterface(ERC1155_INTERFACE_ID);
      if (is1155) return 'ERC-1155';
    } catch {
      // Interface check unsupported or reverted
    }

    // 2. Direct Method Probing Fallback
    try {
      const contract721 = new Contract(contractAddress, ERC721_ABI, provider);
      await contract721.ownerOf(tokenId);
      return 'ERC-721';
    } catch {
      // Not ERC-721 or non-existent token on 721
    }

    try {
      const contract1155 = new Contract(contractAddress, ERC1155_ABI, provider);
      await contract1155.balanceOf(ownerAddress, tokenId);
      return 'ERC-1155';
    } catch {
      // Not ERC-1155
    }

    // Default fallback assumption
    return 'ERC-721';
  }

  /**
   * Checks dynamic on-chain ownership of an NFT for the active wallet address.
   */
  async checkOwnership(
    provider: AbstractProvider,
    contractAddress: string,
    tokenId: string,
    standard: NFTStandard,
    ownerAddress: string
  ): Promise<{ isOwned: boolean; balance?: string }> {
    if (!ownerAddress || !isAddress(ownerAddress) || !isAddress(contractAddress)) {
      return { isOwned: false };
    }

    try {
      if (standard === 'ERC-721') {
        const contract = new Contract(contractAddress, ERC721_ABI, provider);
        const onChainOwner: string = await contract.ownerOf(tokenId);
        const isOwned = onChainOwner.toLowerCase() === ownerAddress.toLowerCase();
        return { isOwned, balance: isOwned ? '1' : '0' };
      } else {
        const contract = new Contract(contractAddress, ERC1155_ABI, provider);
        const balanceBig: bigint = await contract.balanceOf(ownerAddress, tokenId);
        const isOwned = balanceBig > 0n;
        return { isOwned, balance: balanceBig.toString() };
      }
    } catch {
      return { isOwned: false, balance: '0' };
    }
  }

  /**
   * Fetches token URI from contract based on detected standard.
   */
  async fetchTokenUri(
    provider: AbstractProvider,
    contractAddress: string,
    tokenId: string,
    standard: NFTStandard
  ): Promise<string> {
    try {
      if (standard === 'ERC-721') {
        const contract = new Contract(contractAddress, ERC721_ABI, provider);
        return await contract.tokenURI(tokenId);
      } else {
        const contract = new Contract(contractAddress, ERC1155_ABI, provider);
        const rawUri = await contract.uri(tokenId);
        return formatErc1155TokenUri(rawUri, tokenId);
      }
    } catch (err: any) {
      throw new Error(`Failed to fetch token URI: ${err?.message || 'Contract call reverted'}`);
    }
  }

  /**
   * Fetches collection name and symbol with safe fallbacks.
   */
  async fetchCollectionDetails(
    provider: AbstractProvider,
    contractAddress: string
  ): Promise<{ name: string; symbol: string }> {
    const contract = new Contract(contractAddress, ERC721_ABI, provider);

    let name = 'Unknown Collection';
    let symbol = '';

    try {
      name = await contract.name();
    } catch {
      name = `NFT (${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)})`;
    }

    try {
      symbol = await contract.symbol();
    } catch {
      symbol = '';
    }

    return { name, symbol };
  }

  /**
   * Normalizes raw attributes array from NFT metadata.
   */
  private normalizeAttributes(rawAttrs: any): NFTTrait[] {
    if (!rawAttrs) return [];

    if (Array.isArray(rawAttrs)) {
      return rawAttrs
        .filter((a) => a && (a.trait_type !== undefined || a.name !== undefined))
        .map((a) => ({
          trait_type: String(a.trait_type || a.name || 'Property'),
          value: a.value !== undefined ? String(a.value) : '',
        }));
    }

    if (typeof rawAttrs === 'object') {
      return Object.entries(rawAttrs).map(([k, v]) => ({
        trait_type: k,
        value: typeof v === 'object' ? JSON.stringify(v) : String(v),
      }));
    }

    return [];
  }

  /**
   * Inspects and validates an NFT for importing:
   * 1. Detects standard (ERC-721 vs ERC-1155)
   * 2. Verifies on-chain ownership by active address
   * 3. Fetches token URI and resolves metadata + image
   * 4. Returns preview NFT item
   */
  async inspectNft(
    provider: AbstractProvider,
    contractAddress: string,
    tokenId: string,
    ownerAddress: string,
    chainId: number
  ): Promise<InspectNFTResult> {
    if (!isAddress(contractAddress)) {
      return { success: false, error: 'Invalid contract address.' };
    }
    if (!tokenId || tokenId.trim() === '') {
      return { success: false, error: 'Please specify a valid Token ID.' };
    }
    if (!ownerAddress || !isAddress(ownerAddress)) {
      return { success: false, error: 'No active wallet address available.' };
    }

    const cleanContract = contractAddress.trim().toLowerCase();
    const cleanTokenId = tokenId.trim();

    try {
      // 1. Detect standard
      const standard = await this.detectStandard(
        provider,
        cleanContract,
        cleanTokenId,
        ownerAddress
      );

      // 2. Verify ownership
      const { isOwned, balance } = await this.checkOwnership(
        provider,
        cleanContract,
        cleanTokenId,
        standard,
        ownerAddress
      );

      if (!isOwned) {
        return {
          success: false,
          error:
            standard === 'ERC-721'
              ? 'Your active wallet address is not the owner of this NFT.'
              : 'Your active wallet address has 0 balance for this ERC-1155 token.',
        };
      }

      // 3. Collection details
      const { name: collectionName, symbol: collectionSymbol } =
        await this.fetchCollectionDetails(provider, cleanContract);

      // 4. Token URI & Metadata
      let tokenUri = '';
      let metadata: NFTMetadata = {};
      try {
        tokenUri = await this.fetchTokenUri(
          provider,
          cleanContract,
          cleanTokenId,
          standard
        );
        if (tokenUri) {
          metadata = await fetchMetadataWithTimeout(tokenUri, 6000);
        }
      } catch (metaErr: any) {
        // Fallback for metadata failure: continue with minimal info
        metadata = {
          name: `${collectionName} #${cleanTokenId}`,
          description: '',
        };
      }

      const nftName =
        metadata.name || `${collectionName} #${cleanTokenId}`;
      const description = metadata.description || '';
      const rawImage =
        metadata.image || metadata.image_url || metadata.imageUrl || '';
      const imageUrl = resolveImageUrl(rawImage);
      const attributes = this.normalizeAttributes(
        metadata.attributes || metadata.properties
      );

      const id = getNftCompositeId(chainId, cleanContract, cleanTokenId);

      const nft: NFTItem = {
        id,
        contractAddress: cleanContract,
        tokenId: cleanTokenId,
        standard,
        chainId,
        name: nftName,
        description,
        imageUrl,
        collectionName,
        collectionSymbol,
        tokenUri,
        balance,
        attributes,
        importedAt: Date.now(),
        isOwned: true,
      };

      return { success: true, nft };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to inspect NFT on-chain.',
      };
    }
  }

  /**
   * Refreshes ownership status for a list of stored NFTs without deleting unowned ones.
   */
  async refreshNftOwnershipList(
    provider: AbstractProvider,
    nfts: NFTItem[],
    ownerAddress: string
  ): Promise<NFTItem[]> {
    if (!ownerAddress || nfts.length === 0) return nfts;

    const updated = await Promise.all(
      nfts.map(async (nft) => {
        try {
          const { isOwned, balance } = await this.checkOwnership(
            provider,
            nft.contractAddress,
            nft.tokenId,
            nft.standard,
            ownerAddress
          );
          return { ...nft, isOwned, balance: balance ?? nft.balance };
        } catch {
          // If RPC fails for individual token, maintain current status
          return nft;
        }
      })
    );

    return updated;
  }
}

export const nftService = new NftService();
