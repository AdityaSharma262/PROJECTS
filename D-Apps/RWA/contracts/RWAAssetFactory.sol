// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

/**
 * @title RWAAssetFactory
 * @dev Factory contract for deploying new tokenized RWA assets.
 *      Each deployed asset is a minimal ERC-1155 contract managed by the factory.
 *      Asset originators can tokenize real-world assets through this factory.
 *
 * DEPLOYMENT (tBNB via Remix IDE):
 * 1. Compile with Solidity 0.8.20+
 * 2. Deploy to BNB Smart Chain Testnet (chainId 97)
 * 3. Constructor args: kycRegistry address
 *
 * INTERACTION:
 * - createAsset(...): Deploy new tokenized asset
 * - addAssetClass(name, description): Register asset categories
 * - getAsset(assetId): View asset details
 * - getAssetsByOriginator(address): List assets by creator
 */
contract RWAAssetFactory is Ownable {
    enum AssetClass { RealEstate, Commodity, Treasury, Infrastructure, Private_Credit, Art, Carbon_Credit, Other }
    enum AssetStatus { Draft, Pending_Review, Approved, Active, Paused, Matured }

    struct TokenizedAsset {
        uint256 id;
        string name;
        string symbol;
        AssetClass assetClass;
        AssetStatus status;
        string location;
        uint256 totalValue;
        uint256 tokenPrice;
        uint256 totalSupply;
        uint256 tokensSold;
        uint256 annualYieldBps;   // Yield in basis points (e.g. 850 = 8.5%)
        uint256 maturityDate;
        string metadataURI;       // IPFS URI for full metadata
        string documentHash;      // IPFS hash of legal documents
        address originator;
        address yieldDistributor;
        uint256 createdAt;
    }

    // State
    uint256 public nextAssetId = 1;
    address public kycRegistry;

    mapping(uint256 => TokenizedAsset) public assets;
    mapping(address => uint256[]) public originatorAssets;
    mapping(AssetClass => string) public assetClassNames;

    uint256 public totalAssetsCreated;
    uint256 public totalValueTokenized;
    uint256 public platformFeeBps = 50; // 0.5% creation fee

    // Events
    event AssetCreated(
        uint256 indexed assetId,
        string name,
        AssetClass assetClass,
        address indexed originator,
        uint256 totalValue,
        uint256 tokenPrice
    );
    event AssetStatusUpdated(uint256 indexed assetId, AssetStatus newStatus);
    event AssetMetadataUpdated(uint256 indexed assetId, string metadataURI);
    event TokensMinted(uint256 indexed assetId, address indexed to, uint256 amount);
    event TokensSold(uint256 indexed assetId, address indexed buyer, uint256 amount, uint256 totalPrice);
    event YieldDistributed(uint256 indexed assetId, uint256 amount);
    event AssetMatured(uint256 indexed assetId);

    modifier onlyOriginator(uint256 assetId) {
        require(assets[assetId].originator == msg.sender || msg.sender == owner(), "Not authorized");
        _;
    }

    modifier onlyApprovedAsset(uint256 assetId) {
        require(
            assets[assetId].status == AssetStatus.Approved || assets[assetId].status == AssetStatus.Active,
            "Asset not approved"
        );
        _;
    }

    constructor(address _kycRegistry) Ownable(msg.sender) {
        kycRegistry = _kycRegistry;

        // Set default class names
        assetClassNames[AssetClass.RealEstate] = "Real Estate";
        assetClassNames[AssetClass.Commodity] = "Commodity";
        assetClassNames[AssetClass.Treasury] = "Treasury";
        assetClassNames[AssetClass.Infrastructure] = "Infrastructure";
        assetClassNames[AssetClass.Private_Credit] = "Private Credit";
        assetClassNames[AssetClass.Art] = "Art & Collectibles";
        assetClassNames[AssetClass.Carbon_Credit] = "Carbon Credit";
        assetClassNames[AssetClass.Other] = "Other";
    }

    // ============ Admin Functions ============

    function setKYCRegistry(address _kycRegistry) external onlyOwner {
        kycRegistry = _kycRegistry;
    }

    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 500, "Max 5%");
        platformFeeBps = _feeBps;
    }

    function setAssetClassName(AssetClass assetClass, string calldata name) external onlyOwner {
        assetClassNames[assetClass] = name;
    }

    function approveAsset(uint256 assetId) external onlyOwner {
        TokenizedAsset storage asset = assets[assetId];
        require(asset.status == AssetStatus.Pending_Review, "Not pending review");
        asset.status = AssetStatus.Approved;
        emit AssetStatusUpdated(assetId, AssetStatus.Approved);
    }

    function pauseAsset(uint256 assetId) external onlyOwner {
        assets[assetId].status = AssetStatus.Paused;
        emit AssetStatusUpdated(assetId, AssetStatus.Paused);
    }

    function resumeAsset(uint256 assetId) external onlyOwner {
        assets[assetId].status = AssetStatus.Active;
        emit AssetStatusUpdated(assetId, AssetStatus.Active);
    }

    // ============ Asset Creation ============

    function createAsset(
        string calldata name,
        string calldata symbol,
        AssetClass assetClass,
        string calldata location,
        uint256 totalValue,
        uint256 tokenPrice,
        uint256 totalSupply,
        uint256 annualYieldBps,
        uint256 maturityDate,
        string calldata metadataURI,
        string calldata documentHash
    ) external payable returns (uint256) {
        require(bytes(name).length > 0, "Name required");
        require(bytes(symbol).length > 0, "Symbol required");
        require(totalValue > 0, "Total value required");
        require(tokenPrice > 0, "Token price required");
        require(totalSupply > 0, "Supply required");
        require(totalSupply * tokenPrice >= totalValue, "Supply * price must >= value");

        // Creation fee
        uint256 fee = (totalValue * platformFeeBps) / 10000;
        require(msg.value >= fee, "Insufficient creation fee");

        uint256 assetId = nextAssetId++;

        assets[assetId] = TokenizedAsset({
            id: assetId,
            name: name,
            symbol: symbol,
            assetClass: assetClass,
            status: AssetStatus.Pending_Review,
            location: location,
            totalValue: totalValue,
            tokenPrice: tokenPrice,
            totalSupply: totalSupply,
            tokensSold: 0,
            annualYieldBps: annualYieldBps,
            maturityDate: maturityDate,
            metadataURI: metadataURI,
            documentHash: documentHash,
            originator: msg.sender,
            yieldDistributor: msg.sender,
            createdAt: block.timestamp
        });

        originatorAssets[msg.sender].push(assetId);
        totalAssetsCreated++;
        totalValueTokenized += totalValue;

        emit AssetCreated(assetId, name, assetClass, msg.sender, totalValue, tokenPrice);
        return assetId;
    }

    // ============ Token Sales ============

    function buyTokens(uint256 assetId, uint256 amount) external payable onlyApprovedAsset(assetId) {
        TokenizedAsset storage asset = assets[assetId];

        // KYC check
        if (kycRegistry != address(0)) {
            (bool success, bytes memory data) = kycRegistry.staticcall(
                abi.encodeWithSignature("isVerified(address)", msg.sender)
            );
            require(success && abi.decode(data, (bool)), "KYC required");
        }

        require(asset.tokensSold + amount <= asset.totalSupply, "Exceeds supply");

        uint256 totalPrice = amount * asset.tokenPrice;
        require(msg.value >= totalPrice, "Insufficient payment");

        asset.tokensSold += amount;
        if (asset.status == AssetStatus.Approved) {
            asset.status = AssetStatus.Active;
        }

        // Pay originator
        (bool paid, ) = asset.originator.call{value: totalPrice}("");
        require(paid, "Payment failed");

        // Refund excess
        if (msg.value > totalPrice) {
            (bool refunded, ) = msg.sender.call{value: msg.value - totalPrice}("");
            require(refunded, "Refund failed");
        }

        emit TokensSold(assetId, msg.sender, amount, totalPrice);
    }

    // ============ Asset Management ============

    function updateMetadata(uint256 assetId, string calldata metadataURI) external onlyOriginator(assetId) {
        assets[assetId].metadataURI = metadataURI;
        emit AssetMetadataUpdated(assetId, metadataURI);
    }

    function updateDocumentHash(uint256 assetId, string calldata documentHash) external onlyOriginator(assetId) {
        assets[assetId].documentHash = documentHash;
    }

    function setYieldDistributor(uint256 assetId, address distributor) external onlyOriginator(assetId) {
        assets[assetId].yieldDistributor = distributor;
    }

    function matureAsset(uint256 assetId) external onlyOriginator(assetId) {
        require(block.timestamp >= assets[assetId].maturityDate || msg.sender == owner(), "Not matured");
        assets[assetId].status = AssetStatus.Matured;
        emit AssetMatured(assetId);
    }

    // ============ View Functions ============

    function getAsset(uint256 assetId) external view returns (TokenizedAsset memory) {
        return assets[assetId];
    }

    function getOriginatorAssets(address originator) external view returns (uint256[] memory) {
        return originatorAssets[originator];
    }

    function getActiveAssets() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i < nextAssetId; i++) {
            if (assets[i].status == AssetStatus.Active) count++;
        }
        uint256[] memory active = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i < nextAssetId; i++) {
            if (assets[i].status == AssetStatus.Active) {
                active[idx++] = i;
            }
        }
        return active;
    }

    function getCreationFee(uint256 totalValue) external view returns (uint256) {
        return (totalValue * platformFeeBps) / 10000;
    }

    receive() external payable {}
}
