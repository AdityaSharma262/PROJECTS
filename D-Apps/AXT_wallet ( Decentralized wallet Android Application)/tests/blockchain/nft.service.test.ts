import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Interface } from 'ethers';
import { nftService } from '../../src/blockchain/nft/nft.service';
import {
  resolveUriToGateways,
  formatErc1155TokenUri,
  resolveImageUrl,
} from '../../src/blockchain/nft/ipfs.utils';
import { nftStorage, getNftCompositeId } from '../../src/storage/nft-storage';
import { NFTItem } from '../../src/blockchain/nft/nft.types';

// Mock appStorage in-memory
const memoryStore = new Map<string, string>();
jest.mock('../../src/storage/app-storage', () => ({
  appStorage: {
    setItem: jest.fn(async (k: string, v: string) => {
      memoryStore.set(k, v);
    }),
    getItem: jest.fn(async (k: string) => memoryStore.get(k) || null),
    deleteItem: jest.fn(async (k: string) => {
      memoryStore.delete(k);
    }),
  },
}));

const ERC721_IFACE = new Interface([
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
]);

const ERC1155_IFACE = new Interface([
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function uri(uint256 id) view returns (string)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
]);

describe('NFT Service & Storage (Phase 11)', () => {
  const TEST_OWNER = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const OTHER_USER = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const NFT_CONTRACT_721 = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';
  const NFT_CONTRACT_1155 = '0x495f947276749Ce646f68AC8c248420045cb7b5e';
  const TOKEN_ID = '101';
  const CHAIN_ID = 1;

  beforeEach(() => {
    memoryStore.clear();
    jest.restoreAllMocks();
  });

  describe('1. IPFS & URI Utilities', () => {
    it('converts ipfs:// URI into multi-gateway fallback list', () => {
      const uri = 'ipfs://QmZtmD2qtAVWeMRYKNx3OhbBQ1xCXmSgzGo2YVQ2g1wG8c/1.json';
      const gateways = resolveUriToGateways(uri);

      expect(gateways.length).toBeGreaterThan(1);
      expect(gateways[0]).toBe(
        'https://ipfs.io/ipfs/QmZtmD2qtAVWeMRYKNx3OhbBQ1xCXmSgzGo2YVQ2g1wG8c/1.json'
      );
      expect(gateways[1]).toBe(
        'https://cloudflare-ipfs.com/ipfs/QmZtmD2qtAVWeMRYKNx3OhbBQ1xCXmSgzGo2YVQ2g1wG8c/1.json'
      );
    });

    it('converts ipfs://ipfs/ redundant path cleanly', () => {
      const uri = 'ipfs://ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
      const gateways = resolveUriToGateways(uri);
      expect(gateways[0]).toBe(
        'https://ipfs.io/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
      );
    });

    it('resolves Arweave ar:// URIs', () => {
      const uri = 'ar://xT9FjV8p0YqW3L';
      const gateways = resolveUriToGateways(uri);
      expect(gateways[0]).toBe('https://arweave.net/xT9FjV8p0YqW3L');
    });

    it('formats EIP-1155 {id} parameterized token URIs with 64-hex substitution', () => {
      const template = 'https://api.opensea.io/api/v1/metadata/{id}.json';
      const formatted = formatErc1155TokenUri(template, '255');
      // 255 in hex is 'ff', padded to 64 chars
      expect(formatted).toBe(
        `https://api.opensea.io/api/v1/metadata/${'0'.repeat(62)}ff.json`
      );
    });

    it('resolves primary image URL from ipfs:// link', () => {
      const rawImage = 'ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/image.png';
      const resolved = resolveImageUrl(rawImage);
      expect(resolved).toBe(
        'https://ipfs.io/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/image.png'
      );
    });
  });

  describe('2. Composite ID & Storage Isolation', () => {
    it('creates composite ID containing chainId, contract, and tokenId', () => {
      const id = getNftCompositeId(CHAIN_ID, NFT_CONTRACT_721, TOKEN_ID);
      expect(id).toBe(`${CHAIN_ID}_${NFT_CONTRACT_721.toLowerCase()}_${TOKEN_ID}`);
    });

    it('saves and retrieves imported NFTs per wallet and chain', async () => {
      const sampleNft: NFTItem = {
        id: getNftCompositeId(CHAIN_ID, NFT_CONTRACT_721, TOKEN_ID),
        contractAddress: NFT_CONTRACT_721,
        tokenId: TOKEN_ID,
        standard: 'ERC-721',
        chainId: CHAIN_ID,
        name: 'Cool Ape #101',
        description: 'A very cool ape NFT',
        imageUrl: 'https://ipfs.io/ipfs/Qm.../101.png',
        collectionName: 'Cool Apes',
        tokenUri: 'ipfs://Qm.../101.json',
        attributes: [{ trait_type: 'Hat', value: 'Beanie' }],
        importedAt: Date.now(),
        isOwned: true,
      };

      await nftStorage.saveNft(TEST_OWNER, CHAIN_ID, sampleNft);

      // Verify retrieved under TEST_OWNER and CHAIN_ID
      const nfts = await nftStorage.getNfts(TEST_OWNER, CHAIN_ID);
      expect(nfts.length).toBe(1);
      expect(nfts[0].id).toBe(sampleNft.id);
      expect(nfts[0].name).toBe('Cool Ape #101');

      // Verify isolated from other wallet or chain
      const otherWalletNfts = await nftStorage.getNfts(OTHER_USER, CHAIN_ID);
      expect(otherWalletNfts.length).toBe(0);

      const otherChainNfts = await nftStorage.getNfts(TEST_OWNER, 137);
      expect(otherChainNfts.length).toBe(0);
    });

    it('removes NFT reference from local storage without deleting others', async () => {
      const nft1: NFTItem = {
        id: getNftCompositeId(CHAIN_ID, NFT_CONTRACT_721, '1'),
        contractAddress: NFT_CONTRACT_721,
        tokenId: '1',
        standard: 'ERC-721',
        chainId: CHAIN_ID,
        name: 'Ape #1',
        description: '',
        imageUrl: '',
        collectionName: 'Apes',
        tokenUri: '',
        attributes: [],
        importedAt: Date.now(),
      };
      const nft2: NFTItem = {
        id: getNftCompositeId(CHAIN_ID, NFT_CONTRACT_721, '2'),
        contractAddress: NFT_CONTRACT_721,
        tokenId: '2',
        standard: 'ERC-721',
        chainId: CHAIN_ID,
        name: 'Ape #2',
        description: '',
        imageUrl: '',
        collectionName: 'Apes',
        tokenUri: '',
        attributes: [],
        importedAt: Date.now(),
      };

      await nftStorage.saveNft(TEST_OWNER, CHAIN_ID, nft1);
      await nftStorage.saveNft(TEST_OWNER, CHAIN_ID, nft2);

      await nftStorage.removeNft(TEST_OWNER, CHAIN_ID, NFT_CONTRACT_721, '1');

      const remaining = await nftStorage.getNfts(TEST_OWNER, CHAIN_ID);
      expect(remaining.length).toBe(1);
      expect(remaining[0].tokenId).toBe('2');
    });
  });

  describe('3. Standard Detection & Ownership Verification', () => {
    it('verifies ERC-721 ownership via ownerOf call', async () => {
      const mockProvider: any = {
        call: jest.fn(async ({ data }: any) => {
          if (data.startsWith(ERC721_IFACE.getFunction('ownerOf')!.selector)) {
            const decoded = ERC721_IFACE.decodeFunctionData('ownerOf', data);
            if (decoded[0].toString() === '101') {
              return ERC721_IFACE.encodeFunctionResult('ownerOf', [TEST_OWNER]);
            }
            return ERC721_IFACE.encodeFunctionResult('ownerOf', [OTHER_USER]);
          }
          return '0x';
        }),
      };

      const check1 = await nftService.checkOwnership(
        mockProvider,
        NFT_CONTRACT_721,
        '101',
        'ERC-721',
        TEST_OWNER
      );
      expect(check1.isOwned).toBe(true);

      const check2 = await nftService.checkOwnership(
        mockProvider,
        NFT_CONTRACT_721,
        '999',
        'ERC-721',
        TEST_OWNER
      );
      expect(check2.isOwned).toBe(false);
    });

    it('verifies ERC-1155 ownership via balanceOf call', async () => {
      const mockProvider: any = {
        call: jest.fn(async ({ data }: any) => {
          if (data.startsWith(ERC1155_IFACE.getFunction('balanceOf')!.selector)) {
            const decoded = ERC1155_IFACE.decodeFunctionData('balanceOf', data);
            if (
              decoded[0].toLowerCase() === TEST_OWNER.toLowerCase() &&
              decoded[1].toString() === '101'
            ) {
              return ERC1155_IFACE.encodeFunctionResult('balanceOf', [5n]);
            }
            return ERC1155_IFACE.encodeFunctionResult('balanceOf', [0n]);
          }
          return '0x';
        }),
      };

      const check1 = await nftService.checkOwnership(
        mockProvider,
        NFT_CONTRACT_1155,
        '101',
        'ERC-1155',
        TEST_OWNER
      );
      expect(check1.isOwned).toBe(true);
      expect(check1.balance).toBe('5');

      const check2 = await nftService.checkOwnership(
        mockProvider,
        NFT_CONTRACT_1155,
        '999',
        'ERC-1155',
        TEST_OWNER
      );
      expect(check2.isOwned).toBe(false);
      expect(check2.balance).toBe('0');
    });
  });

  describe('4. Dynamic Ownership Soft-Refresh', () => {
    it('sets isOwned to false if NFT was transferred, without deleting the item', async () => {
      const mockProvider: any = {
        call: jest.fn(async ({ data }: any) => {
          if (data.startsWith(ERC721_IFACE.getFunction('ownerOf')!.selector)) {
            // Mock ownerOf returning a different user (NFT was transferred away)
            return ERC721_IFACE.encodeFunctionResult('ownerOf', [OTHER_USER]);
          }
          return '0x';
        }),
      };

      const storedNft: NFTItem = {
        id: getNftCompositeId(CHAIN_ID, NFT_CONTRACT_721, '101'),
        contractAddress: NFT_CONTRACT_721,
        tokenId: '101',
        standard: 'ERC-721',
        chainId: CHAIN_ID,
        name: 'Transferred Ape',
        description: '',
        imageUrl: '',
        collectionName: 'Apes',
        tokenUri: '',
        attributes: [],
        importedAt: Date.now(),
        isOwned: true,
      };

      const refreshed = await nftService.refreshNftOwnershipList(
        mockProvider,
        [storedNft],
        TEST_OWNER
      );

      expect(refreshed.length).toBe(1);
      expect(refreshed[0].isOwned).toBe(false);
      expect(refreshed[0].name).toBe('Transferred Ape');
    });
  });
});
