// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RWAYieldToken
 * @dev ERC-20 token representing tokenized real-world yield assets (e.g., treasury funds)
 * 
 * DEPLOYMENT STEPS (tBNB via Remix IDE):
 * 1. Open Remix IDE (https://remix.ethereum.org)
 * 2. Create new file: RWAYieldToken.sol
 * 3. Paste this contract
 * 4. Compile with Solidity 0.8.20+
 * 5. Deploy to BNB Smart Chain Testnet (chainId 97) via "Injected Provider - MetaMask"
 * 6. Constructor args: name (e.g., "RWA Yield Token"), symbol (e.g., "RWAYLD")
 * 
 * INTERACTION EXAMPLES:
 * - mint(address, amount): Mint tokens to an address (owner only)
 * - burn(address, amount): Burn tokens from an address (owner only)
 * - distributeYield(amount): Distribute yield to all holders
 * - claimYield(): Claim pending yield as a token holder
 * - pause()/unpause(): Pause/unpause transfers (owner only)
 */
contract RWAYieldToken is ERC20, ERC20Burnable, Pausable, Ownable {
    // Yield tracking
    uint256 public totalYieldDistributed;
    uint256 public yieldPerTokenStored;
    
    mapping(address => uint256) public userYieldPerTokenPaid;
    mapping(address => uint256) public pendingYield;
    
    // Events
    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);
    event YieldDistributed(uint256 amount, uint256 timestamp);
    event YieldClaimed(address indexed account, uint256 amount);
    
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) Ownable(msg.sender) {}
    
    // ============ Modifiers ============
    
    modifier updateYield(address account) {
        if (account != address(0)) {
            pendingYield[account] = earned(account);
            userYieldPerTokenPaid[account] = yieldPerTokenStored;
        }
        _;
    }
    
    // ============ View Functions ============
    
    function earned(address account) public view returns (uint256) {
        uint256 balance = balanceOf(account);
        if (balance == 0) return pendingYield[account];
        
        return (balance * (yieldPerTokenStored - userYieldPerTokenPaid[account])) / 1e18 
               + pendingYield[account];
    }
    
    // ============ Owner Functions ============
    
    function mint(address to, uint256 amount) external onlyOwner updateYield(to) {
        _mint(to, amount);
        emit Minted(to, amount);
    }
    
    function burn(address from, uint256 amount) external onlyOwner updateYield(from) {
        _burn(from, amount);
        emit Burned(from, amount);
    }
    
    function distributeYield(uint256 amount) external onlyOwner {
        require(totalSupply() > 0, "No tokens in circulation");
        require(amount > 0, "Amount must be greater than 0");
        
        yieldPerTokenStored += (amount * 1e18) / totalSupply();
        totalYieldDistributed += amount;
        
        emit YieldDistributed(amount, block.timestamp);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Public Functions ============
    
    function claimYield() external updateYield(msg.sender) {
        uint256 yield_ = pendingYield[msg.sender];
        require(yield_ > 0, "No yield to claim");
        
        pendingYield[msg.sender] = 0;
        _mint(msg.sender, yield_);
        
        emit YieldClaimed(msg.sender, yield_);
    }
    
    // ============ Overrides ============
    
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override whenNotPaused updateYield(from) updateYield(to) {
        super._update(from, to, value);
    }
}
