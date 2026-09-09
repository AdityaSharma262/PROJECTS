// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

abstract contract Ownable is Context {
    address private _owner;

    error OwnableUnauthorizedAccount(address account);
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

interface IRWAAssetToken {
    function mint(address to, uint256 id, uint256 amount, bytes memory data) external;
}

/**
 * @title RWAAssetFactory
 * @dev Factory contract for deploying and registering tokenized RWA assets.
 *      Asset originators can tokenize real-world assets through this factory.
 *
 * DEPLOYMENT (BNB Smart Chain / Remix IDE):
 * 1. Compile with Solidity 0.8.20+
 * 2. Deploy via Injected Provider - MetaMask (BSC Testnet chainId 97)
 * 3. Constructor args: _kycRegistry, _assetToken
 * 4. BscScan Verification: Choose "Solidity (Single file)", paste this exact code.
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
    address public assetToken;

    mapping(uint256 => TokenizedAsset) internal assets;
    mapping(address => uint256[]) public originatorAssets;
    mapping(AssetClass => string) public assetClassNames;

    uint256 public totalAssetsCreated;
    uint256 public totalValueTokenized;
    uint256 public flatCreationFee = 0; // Flat creation fee in wei (0 for testnet)

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
    event FlatCreationFeeUpdated(uint256 newFee);
    event AssetTokenUpdated(address indexed newAssetToken);

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

    constructor(address _kycRegistry, address _assetToken) Ownable(msg.sender) {
        kycRegistry = _kycRegistry;
        assetToken = _assetToken;

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

    function setAssetToken(address _assetToken) external onlyOwner {
        assetToken = _assetToken;
        emit AssetTokenUpdated(_assetToken);
    }

    function setFlatCreationFee(uint256 _fee) external onlyOwner {
        flatCreationFee = _fee;
        emit FlatCreationFeeUpdated(_fee);
    }

    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdraw failed");
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

    struct AssetParams {
        string name;
        string symbol;
        AssetClass assetClass;
        string location;
        uint256 totalValue;
        uint256 tokenPrice;
        uint256 totalSupply;
        uint256 annualYieldBps;
        uint256 maturityDate;
        string metadataURI;
        string documentHash;
    }

    // ============ Asset Creation ============

    function createAsset(AssetParams calldata params) external payable returns (uint256) {
        require(bytes(params.name).length > 0, "Name required");
        require(bytes(params.symbol).length > 0, "Symbol required");
        require(params.totalValue > 0, "Total value required");
        require(params.tokenPrice > 0, "Token price required");
        require(params.totalSupply > 0, "Supply required");
        require(params.totalSupply * params.tokenPrice >= params.totalValue, "Supply * price must >= value");

        // Creation fee check
        require(msg.value >= flatCreationFee, "Insufficient creation fee");
        if (msg.value > flatCreationFee) {
            (bool refundOk, ) = msg.sender.call{value: msg.value - flatCreationFee}("");
            require(refundOk, "Fee refund failed");
        }

        uint256 assetId = nextAssetId++;

        TokenizedAsset storage newAsset = assets[assetId];
        newAsset.id = assetId;
        newAsset.name = params.name;
        newAsset.symbol = params.symbol;
        newAsset.assetClass = params.assetClass;
        newAsset.status = AssetStatus.Pending_Review;
        newAsset.location = params.location;
        newAsset.totalValue = params.totalValue;
        newAsset.tokenPrice = params.tokenPrice;
        newAsset.totalSupply = params.totalSupply;
        newAsset.tokensSold = 0;
        newAsset.annualYieldBps = params.annualYieldBps;
        newAsset.maturityDate = params.maturityDate;
        newAsset.metadataURI = params.metadataURI;
        newAsset.documentHash = params.documentHash;
        newAsset.originator = msg.sender;
        newAsset.yieldDistributor = msg.sender;
        newAsset.createdAt = block.timestamp;

        originatorAssets[msg.sender].push(assetId);
        totalAssetsCreated++;
        totalValueTokenized += params.totalValue;

        emit AssetCreated(assetId, params.name, params.assetClass, msg.sender, params.totalValue, params.tokenPrice);
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

        // Mint fractional tokens to buyer if assetToken contract is configured
        if (assetToken != address(0)) {
            IRWAAssetToken(assetToken).mint(msg.sender, assetId, amount, "");
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

    function getCreationFee(uint256) external view returns (uint256) {
        return flatCreationFee;
    }

    receive() external payable {}
}
