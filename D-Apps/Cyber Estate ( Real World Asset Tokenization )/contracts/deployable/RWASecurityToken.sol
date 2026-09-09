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

interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

interface IERC20Metadata is IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
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

abstract contract Pausable is Context {
    bool private _paused;

    event Paused(address account);
    event Unpaused(address account);

    error EnforcedPause();
    error ExpectedPause();

    constructor() {
        _paused = false;
    }

    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    modifier whenPaused() {
        _requirePaused();
        _;
    }

    function paused() public view virtual returns (bool) {
        return _paused;
    }

    function _requireNotPaused() internal view virtual {
        if (paused()) {
            revert EnforcedPause();
        }
    }

    function _requirePaused() internal view virtual {
        if (!paused()) {
            revert ExpectedPause();
        }
    }

    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}

abstract contract ERC20 is Context, IERC20, IERC20Metadata {
    mapping(address account => uint256) private _balances;
    mapping(address account => mapping(address spender => uint256)) private _allowances;

    uint256 private _totalSupply;
    string private _name;
    string private _symbol;

    error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);
    error ERC20InvalidSender(address sender);
    error ERC20InvalidReceiver(address receiver);
    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);
    error ERC20InvalidApprover(address approver);
    error ERC20InvalidSpender(address spender);

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function name() public view virtual returns (string memory) {
        return _name;
    }

    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    function decimals() public view virtual returns (uint8) {
        return 18;
    }

    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view virtual returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, value);
        return true;
    }

    function allowance(address owner, address spender) public view virtual returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public virtual returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        if (from == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(from, to, value);
    }

    function _update(address from, address to, uint256 value) internal virtual {
        if (from == address(0)) {
            _totalSupply += value;
        } else {
            uint256 fromBalance = _balances[from];
            if (fromBalance < value) {
                revert ERC20InsufficientBalance(from, fromBalance, value);
            }
            unchecked {
                _balances[from] = fromBalance - value;
            }
        }

        if (to == address(0)) {
            unchecked {
                _totalSupply -= value;
            }
        } else {
            unchecked {
                _balances[to] += value;
            }
        }

        emit Transfer(from, to, value);
    }

    function _mint(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(address(0), account, value);
    }

    function _burn(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        _update(account, address(0), value);
    }

    function _approve(address owner, address spender, uint256 value) internal {
        _approve(owner, spender, value, true);
    }

    function _approve(address owner, address spender, uint256 value, bool emitEvent) internal virtual {
        if (owner == address(0)) {
            revert ERC20InvalidApprover(address(0));
        }
        if (spender == address(0)) {
            revert ERC20InvalidSpender(address(0));
        }
        _allowances[owner][spender] = value;
        if (emitEvent) {
            emit Approval(owner, spender, value);
        }
    }

    function _spendAllowance(address owner, address spender, uint256 value) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            if (currentAllowance < value) {
                revert ERC20InsufficientAllowance(spender, currentAllowance, value);
            }
            unchecked {
                _approve(owner, spender, currentAllowance - value, false);
            }
        }
    }
}

/**
 * @title RWASecurityToken
 * @dev ERC-3643/ERC-1400 inspired security token with KYC compliance
 * Implements investor whitelisting, transfer restrictions, and compliance checks
 * 
 * DEPLOYMENT (BNB Smart Chain / Remix IDE):
 * 1. Compile with Solidity 0.8.20+
 * 2. Deploy via Injected Provider - MetaMask (BSC Testnet chainId 97)
 * 3. Constructor args: name (e.g., "RWA Security Token"), symbol (e.g., "RWAST")
 * 4. BscScan Verification: Choose "Solidity (Single file)", paste this exact code.
 */
contract RWASecurityToken is ERC20, Ownable, Pausable {
    enum KYCStatus { None, Pending, Verified, Rejected, Expired }
    
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
        maxInvestors = 10000;
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
