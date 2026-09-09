export type NFTStandard = 'ERC-721' | 'ERC-1155';

export interface NFTTrait {
  trait_type: string;
  value: string | number;
}

export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  image_url?: string;
  imageUrl?: string;
  attributes?: NFTTrait[] | Record<string, any>;
  properties?: Record<string, any>;
  [key: string]: any;
}

export interface NFTItem {
  /** Unique composite ID: `${chainId}_${contractAddress.toLowerCase()}_${tokenId}` */
  id: string;
  contractAddress: string;
  tokenId: string;
  standard: NFTStandard;
  chainId: number;
  name: string;
  description: string;
  imageUrl: string;
  collectionName: string;
  collectionSymbol?: string;
  tokenUri: string;
  balance?: string; // for ERC-1155
  attributes: NFTTrait[];
  importedAt: number;
  /** Dynamic on-chain ownership status (not permanently frozen) */
  isOwned?: boolean;
}

export interface InspectNFTResult {
  success: boolean;
  nft?: NFTItem;
  error?: string;
}
