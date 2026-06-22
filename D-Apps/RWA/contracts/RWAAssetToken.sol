// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

/**
 * @title RWAAssetToken
 * @dev ERC-1155 multi-token for representing real-world assets with fractional ownership
 * Each token ID represents a different real-world asset (real estate, commodities, etc.)
 * 
 * DEPLOYMENT STEPS (tBNB via Remix IDE):
 * 1. Open Remix IDE (https://remix.ethereum.org)
 * 2. Create new file: RWAAssetToken.sol
 * 3. Paste this contract
 * 4. Compile with Solidity 0.8.20+
 * 5. Deploy to BNB Smart Chain Testnet (chainId 97) via "Injected Provider - MetaMask"
 * 6. Constructor arg: baseURI (e.g., "https://api.cyberestate.io/metadata/")
 * 
 * INTERACTION EXAMPLES:
 * - mint(address, id, amount, ""): Mint asset tokens (admin only)
 * - setAssetMetadata(id, name, location, totalValue): Set asset info
 * - setTransferRestriction(id, true): Restrict transfers for an asset
 * - balanceOf(address, id): Check ownership of specific asset
 */
contract RWAAssetToken is ERC1155, Ownable, ERC1155Supply {
    // Asset metadata
    struct AssetInfo {
        string name;
        string location;
        uint256 totalValue;
        uint256 tokenPrice;
        bool transferRestricted;
        bool exists;
    }
    
    mapping(uint256 => AssetInfo) public assets;
    mapping(address => bool) public admins;
    uint256 public nextAssetId = 1;
    
    // Events
    event AssetCreated(uint256 indexed id, string name, string location, uint256 totalValue);
    event AssetMinted(uint256 indexed id, address indexed to, uint256 amount);
    event AssetBurned(uint256 indexed id, address indexed from, uint256 amount);
    event TransferRestrictionUpdated(uint256 indexed id, bool restricted);
    event AdminUpdated(address indexed admin, bool status);
    
    modifier onlyAdmin() {
        require(msg.sender == owner() || admins[msg.sender], "Not authorized");
        _;
    }
    
    constructor(string memory baseURI) ERC1155(baseURI) Ownable(msg.sender) {
        admins[msg.sender] = true;
    }
    
    // ============ Admin Functions ============
    
    function setAdmin(address admin, bool status) external onlyOwner {
        admins[admin] = status;
        emit AdminUpdated(admin, status);
    }
    
    function createAsset(
        string memory name,
        string memory location,
        uint256 totalValue,
        uint256 tokenPrice,
        uint256 totalTokens,
        address initialHolder
    ) external onlyAdmin returns (uint256) {
        uint256 assetId = nextAssetId++;
        
        assets[assetId] = AssetInfo({
            name: name,
            location: location,
            totalValue: totalValue,
            tokenPrice: tokenPrice,
            transferRestricted: false,
            exists: true
        });
        
        if (totalTokens > 0 && initialHolder != address(0)) {
            _mint(initialHolder, assetId, totalTokens, "");
            emit AssetMinted(assetId, initialHolder, totalTokens);
        }
        
        emit AssetCreated(assetId, name, location, totalValue);
        return assetId;
    }
    
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external onlyAdmin {
        require(assets[id].exists, "Asset does not exist");
        _mint(to, id, amount, data);
        emit AssetMinted(id, to, amount);
    }
    
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external onlyAdmin {
        for (uint256 i = 0; i < ids.length; i++) {
            require(assets[ids[i]].exists, "Asset does not exist");
        }
        _mintBatch(to, ids, amounts, data);
    }
    
    function burn(
        address from,
        uint256 id,
        uint256 amount
    ) external onlyAdmin {
        _burn(from, id, amount);
        emit AssetBurned(id, from, amount);
    }
    
    function setAssetMetadata(
        uint256 id,
        string memory name,
        string memory location,
        uint256 totalValue
    ) external onlyAdmin {
        require(assets[id].exists, "Asset does not exist");
        assets[id].name = name;
        assets[id].location = location;
        assets[id].totalValue = totalValue;
    }
    
    function setTransferRestriction(uint256 id, bool restricted) external onlyAdmin {
        require(assets[id].exists, "Asset does not exist");
        assets[id].transferRestricted = restricted;
        emit TransferRestrictionUpdated(id, restricted);
    }
    
    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }
    
    // ============ View Functions ============
    
    function getAssetInfo(uint256 id) external view returns (AssetInfo memory) {
        require(assets[id].exists, "Asset does not exist");
        return assets[id];
    }
    
    // ============ Overrides ============
    
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        // Check transfer restrictions (skip for mint/burn)
        if (from != address(0) && to != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                require(!assets[ids[i]].transferRestricted, "Transfer restricted for this asset");
            }
        }
        super._update(from, to, ids, values);
    }
}
