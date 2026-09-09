// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title RWASecurityToken
 * @dev ERC-3643/ERC-1400 inspired security token with KYC compliance
 * Implements investor whitelisting, transfer restrictions, and compliance checks
 * 
 * DEPLOYMENT STEPS (tBNB via Remix IDE):
 * 1. Open Remix IDE (https://remix.ethereum.org)
 * 2. Create new file: RWASecurityToken.sol
 * 3. Paste this contract
 * 4. Compile with Solidity 0.8.20+
 * 5. Deploy to BNB Smart Chain Testnet (chainId 97) via "Injected Provider - MetaMask"
 * 6. Constructor args: name (e.g., "RWA Security Token"), symbol (e.g., "RWAST")
 * 
 * INTERACTION EXAMPLES:
 * - addToWhitelist(address): Add investor after KYC (owner only)
 * - removeFromWhitelist(address): Remove investor from whitelist
 * - issue(address, amount): Issue tokens to verified investor
 * - canTransfer(from, to, amount): Check if transfer is compliant
 * - setComplianceOfficer(address): Add compliance officer role
 */
contract RWASecurityToken is ERC20, Ownable, Pausable {
    // KYC Status
    enum KYCStatus {
        None,
        Pending,
        Verified,
        Rejected,
        Expired
    }
    
    struct InvestorInfo {
        KYCStatus kycStatus;
        uint256 verificationDate;
        uint256 expirationDate;
        string jurisdiction;
        uint256 investmentLimit;
        uint256 totalInvested;
    }
    
    // State
    mapping(address => InvestorInfo) public investors;
    mapping(address => bool) public complianceOfficers;
    mapping(string => bool) public restrictedJurisdictions;
    
    uint256 public maxInvestors;
    uint256 public currentInvestorCount;
    uint256 public kycValidityPeriod = 365 days;
    bool public transfersEnabled = true;
    
    // Events
    event Issued(address indexed to, uint256 amount);
    event Redeemed(address indexed from, uint256 amount);
    event AddedToWhitelist(address indexed account, string jurisdiction);
    event RemovedFromWhitelist(address indexed account);
    event KYCStatusUpdated(address indexed account, KYCStatus status);
    event ComplianceOfficerUpdated(address indexed officer, bool status);
    event TransferBlocked(address indexed from, address indexed to, uint256 amount, string reason);
    event JurisdictionRestricted(string jurisdiction, bool restricted);
    
    modifier onlyCompliance() {
        require(
            msg.sender == owner() || complianceOfficers[msg.sender],
            "Not a compliance officer"
        );
        _;
    }
    
    modifier onlyVerified(address account) {
        require(isVerified(account), "Account not KYC verified");
        _;
    }
    
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) Ownable(msg.sender) {
        complianceOfficers[msg.sender] = true;
        maxInvestors = 10000; // Default max
    }
    
    // ============ View Functions ============
    
    function isVerified(address account) public view returns (bool) {
        InvestorInfo memory info = investors[account];
        return info.kycStatus == KYCStatus.Verified && 
               block.timestamp <= info.expirationDate;
    }
    
    function canTransfer(
        address from,
        address to,
        uint256 amount
    ) public view returns (bool transferable, string memory reason) {
        if (!transfersEnabled) {
            return (false, "Transfers are currently disabled");
        }
        if (paused()) {
            return (false, "Contract is paused");
        }
        if (!isVerified(from)) {
            return (false, "Sender not KYC verified");
        }
        if (!isVerified(to)) {
            return (false, "Recipient not KYC verified");
        }
        if (balanceOf(from) < amount) {
            return (false, "Insufficient balance");
        }
        
        InvestorInfo memory toInfo = investors[to];
        if (restrictedJurisdictions[toInfo.jurisdiction]) {
            return (false, "Recipient jurisdiction restricted");
        }
        if (toInfo.investmentLimit > 0 && 
            toInfo.totalInvested + amount > toInfo.investmentLimit) {
            return (false, "Exceeds recipient investment limit");
        }
        
        return (true, "");
    }
    
    function getInvestorInfo(address account) external view returns (InvestorInfo memory) {
        return investors[account];
    }
    
    // ============ Compliance Functions ============
    
    function addToWhitelist(
        address account,
        string memory jurisdiction,
        uint256 investmentLimit
    ) external onlyCompliance {
        require(account != address(0), "Invalid address");
        
        if (investors[account].kycStatus != KYCStatus.Verified) {
            currentInvestorCount++;
            require(currentInvestorCount <= maxInvestors, "Max investor limit reached");
        }
        
        investors[account] = InvestorInfo({
            kycStatus: KYCStatus.Verified,
            verificationDate: block.timestamp,
            expirationDate: block.timestamp + kycValidityPeriod,
            jurisdiction: jurisdiction,
            investmentLimit: investmentLimit,
            totalInvested: investors[account].totalInvested
        });
        
        emit AddedToWhitelist(account, jurisdiction);
        emit KYCStatusUpdated(account, KYCStatus.Verified);
    }
    
    // Simplified whitelist (no jurisdiction/limit)
    function addToWhitelist(address account) external onlyCompliance {
        require(account != address(0), "Invalid address");
        
        if (investors[account].kycStatus != KYCStatus.Verified) {
            currentInvestorCount++;
            require(currentInvestorCount <= maxInvestors, "Max investor limit reached");
        }
        
        investors[account].kycStatus = KYCStatus.Verified;
        investors[account].verificationDate = block.timestamp;
        investors[account].expirationDate = block.timestamp + kycValidityPeriod;
        
        emit AddedToWhitelist(account, "");
        emit KYCStatusUpdated(account, KYCStatus.Verified);
    }
    
    function removeFromWhitelist(address account) external onlyCompliance {
        require(investors[account].kycStatus == KYCStatus.Verified, "Not whitelisted");
        investors[account].kycStatus = KYCStatus.None;
        currentInvestorCount--;
        emit RemovedFromWhitelist(account);
        emit KYCStatusUpdated(account, KYCStatus.None);
    }
    
    function setKYCStatus(address account, KYCStatus status) external onlyCompliance {
        investors[account].kycStatus = status;
        emit KYCStatusUpdated(account, status);
    }
    
    function setComplianceOfficer(address officer, bool status) external onlyOwner {
        complianceOfficers[officer] = status;
        emit ComplianceOfficerUpdated(officer, status);
    }
    
    function setJurisdictionRestriction(string memory jurisdiction, bool restricted) external onlyCompliance {
        restrictedJurisdictions[jurisdiction] = restricted;
        emit JurisdictionRestricted(jurisdiction, restricted);
    }
    
    function setTransfersEnabled(bool enabled) external onlyOwner {
        transfersEnabled = enabled;
    }
    
    function setMaxInvestors(uint256 max) external onlyOwner {
        maxInvestors = max;
    }
    
    function setKYCValidityPeriod(uint256 period) external onlyOwner {
        kycValidityPeriod = period;
    }
    
    // ============ Token Operations ============
    
    function issue(
        address to,
        uint256 amount
    ) external onlyOwner onlyVerified(to) {
        investors[to].totalInvested += amount;
        _mint(to, amount);
        emit Issued(to, amount);
    }
    
    function redeem(uint256 amount) external onlyVerified(msg.sender) {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        investors[msg.sender].totalInvested -= amount;
        _burn(msg.sender, amount);
        emit Redeemed(msg.sender, amount);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============ Overrides ============
    
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override whenNotPaused {
        // Skip compliance checks for mint/burn
        if (from != address(0) && to != address(0)) {
            require(transfersEnabled, "Transfers disabled");
            
            (bool allowed, string memory reason) = canTransfer(from, to, value);
            if (!allowed) {
                emit TransferBlocked(from, to, value, reason);
                revert(reason);
            }
            
            investors[to].totalInvested += value;
        }
        
        super._update(from, to, value);
    }
}
