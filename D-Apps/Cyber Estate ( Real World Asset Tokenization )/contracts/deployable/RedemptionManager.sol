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
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

library SafeERC20 {
    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        (bool success, bytes memory data) = address(token).call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, value)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "SafeERC20: transfer failed");
    }

    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        (bool success, bytes memory data) = address(token).call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, value)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "SafeERC20: transferFrom failed");
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

abstract contract ReentrancyGuard {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        _status = NOT_ENTERED;
    }
}

/**
 * @title RedemptionManager
 * @dev Manages token redemption flow: deposit tokens → release funds.
 *      Supports cooldown periods, redemption fees, and stablecoin payouts.
 *      Integrates with KYC registry for compliance checks.
 *
 * DEPLOYMENT (BNB Smart Chain / Remix IDE):
 * 1. Compile with Solidity 0.8.20+
 * 2. Deploy via Injected Provider - MetaMask (BSC Testnet chainId 97)
 * 3. Constructor args: _kycRegistry, _feeRecipient
 * 4. BscScan Verification: Choose "Solidity (Single file)", paste this exact code.
 */
contract RedemptionManager is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum RedemptionStatus { Pending, Approved, Processed, Cancelled, Rejected }
    enum PayoutMethod { NativeToken, Stablecoin }

    struct RedemptionRequest {
        uint256 id;
        address requester;
        address tokenAddress;
        uint256 amount;
        uint256 valueInBase;      // Equivalent BNB value
        uint256 netPayout;
        RedemptionStatus status;
        PayoutMethod payoutMethod;
        address payoutToken;       // Stablecoin address (0 for native)
        uint256 requestedAt;
        uint256 processedAt;
    }

    // State
    uint256 public nextRequestId = 1;
    uint256 public redemptionFeeBps = 100; // 1% fee
    uint256 public cooldownPeriod = 7 days;
    uint256 public minRedemptionAmount = 1e18; // Minimum 1 token

    address public kycRegistry;
    address public feeRecipient;

    // Token price oracle (simplified - admin sets prices)
    mapping(address => uint256) public tokenPrices; // token => price in wei

    // Cooldown tracking
    mapping(address => uint256) public lastRedemptionTime;

    // Requests
    mapping(uint256 => RedemptionRequest) public redemptionRequests;
    mapping(uint256 => string) public rejectionReasons;
    mapping(address => uint256[]) public userRedemptions;
    uint256[] public pendingQueue;

    // Stablecoin whitelist
    mapping(address => bool) public approvedStablecoins;

    // Events
    event RedemptionRequested(
        uint256 indexed requestId,
        address indexed requester,
        address tokenAddress,
        uint256 amount,
        uint256 estimatedValue,
        PayoutMethod payoutMethod
    );
    event RedemptionApproved(uint256 indexed requestId, address indexed approver);
    event RedemptionProcessed(uint256 indexed requestId, uint256 payoutAmount);
    event RedemptionCancelled(uint256 indexed requestId);
    event RedemptionRejected(uint256 indexed requestId, string reason);
    event TokenPriceUpdated(address indexed token, uint256 price);
    event FeeUpdated(uint256 newFeeBps);
    event CooldownUpdated(uint256 newPeriod);
    event LiquidityDeposited(address indexed sender, uint256 amount);
    event LiquidityWithdrawn(address indexed recipient, uint256 amount);

    modifier onlyKYCVerified(address account) {
        if (kycRegistry != address(0)) {
            (bool success, bytes memory data) = kycRegistry.staticcall(
                abi.encodeWithSignature("isVerified(address)", account)
            );
            require(success && abi.decode(data, (bool)), "KYC verification required");
        }
        _;
    }

    constructor(address _kycRegistry, address _feeRecipient) Ownable(msg.sender) {
        kycRegistry = _kycRegistry;
        feeRecipient = _feeRecipient != address(0) ? _feeRecipient : msg.sender;
    }

    // ============ Admin Functions ============

    function setKYCRegistry(address _kycRegistry) external onlyOwner {
        kycRegistry = _kycRegistry;
    }

    function setFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid address");
        feeRecipient = _recipient;
    }

    function depositLiquidity() external payable {
        require(msg.value > 0, "Amount must be > 0");
        emit LiquidityDeposited(msg.sender, msg.value);
    }

    function withdrawLiquidity(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Withdraw failed");
        emit LiquidityWithdrawn(owner(), amount);
    }

    function setRedemptionFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 500, "Fee cannot exceed 5%");
        redemptionFeeBps = _feeBps;
        emit FeeUpdated(_feeBps);
    }

    function setCooldownPeriod(uint256 _period) external onlyOwner {
        require(_period <= 30 days, "Max 30 days cooldown");
        cooldownPeriod = _period;
        emit CooldownUpdated(_period);
    }

    function setMinRedemption(uint256 _amount) external onlyOwner {
        minRedemptionAmount = _amount;
    }

    function setTokenPrice(address token, uint256 price) external onlyOwner {
        tokenPrices[token] = price;
        emit TokenPriceUpdated(token, price);
    }

    function approveStablecoin(address stablecoin, bool approved) external onlyOwner {
        approvedStablecoins[stablecoin] = approved;
    }

    // ============ Redemption Flow ============

    function requestRedemption(
        address tokenAddress,
        uint256 amount,
        PayoutMethod payoutMethod,
        address payoutToken
    ) external onlyKYCVerified(msg.sender) nonReentrant {
        require(amount >= minRedemptionAmount, "Below minimum redemption");
        require(tokenPrices[tokenAddress] > 0, "Token price not set");
        require(
            block.timestamp >= lastRedemptionTime[msg.sender] + cooldownPeriod,
            "Cooldown period active"
        );

        if (payoutMethod == PayoutMethod.Stablecoin) {
            require(approvedStablecoins[payoutToken], "Stablecoin not approved");
        }

        // Transfer tokens to escrow
        IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), amount);

        uint256 valueInBase = (amount * tokenPrices[tokenAddress]) / 1e18;
        uint256 fee = (valueInBase * redemptionFeeBps) / 10000;

        uint256 requestId = nextRequestId++;
        RedemptionRequest storage req = redemptionRequests[requestId];
        req.id = requestId;
        req.requester = msg.sender;
        req.tokenAddress = tokenAddress;
        req.amount = amount;
        req.valueInBase = valueInBase;
        req.netPayout = valueInBase - fee;
        req.status = RedemptionStatus.Pending;
        req.payoutMethod = payoutMethod;
        req.payoutToken = payoutToken;
        req.requestedAt = block.timestamp;
        req.processedAt = 0;

        userRedemptions[msg.sender].push(requestId);
        pendingQueue.push(requestId);

        emit RedemptionRequested(requestId, msg.sender, tokenAddress, amount, valueInBase, payoutMethod);
    }

    function approveRedemption(uint256 requestId) external onlyOwner nonReentrant {
        RedemptionRequest storage req = redemptionRequests[requestId];
        require(req.status == RedemptionStatus.Pending, "Not pending");

        req.status = RedemptionStatus.Approved;
        emit RedemptionApproved(requestId, msg.sender);

        _processRedemption(requestId);
    }

    function rejectRedemption(uint256 requestId, string calldata reason) external onlyOwner nonReentrant {
        RedemptionRequest storage req = redemptionRequests[requestId];
        require(req.status == RedemptionStatus.Pending, "Not pending");

        req.status = RedemptionStatus.Rejected;
        rejectionReasons[requestId] = reason;

        // Return escrowed tokens
        IERC20(req.tokenAddress).safeTransfer(req.requester, req.amount);

        emit RedemptionRejected(requestId, reason);
    }

    function cancelRedemption(uint256 requestId) external nonReentrant {
        RedemptionRequest storage req = redemptionRequests[requestId];
        require(req.requester == msg.sender, "Not requester");
        require(req.status == RedemptionStatus.Pending, "Not pending");

        req.status = RedemptionStatus.Cancelled;

        // Return escrowed tokens
        IERC20(req.tokenAddress).safeTransfer(msg.sender, req.amount);

        emit RedemptionCancelled(requestId);
    }

    // ============ Internal ============

    function _processRedemption(uint256 requestId) internal {
        RedemptionRequest storage req = redemptionRequests[requestId];
        require(req.status == RedemptionStatus.Approved, "Not approved");

        req.status = RedemptionStatus.Processed;
        req.processedAt = block.timestamp;
        lastRedemptionTime[req.requester] = block.timestamp;

        // Pay fee to fee recipient
        uint256 fee = req.valueInBase - req.netPayout;
        if (fee > 0) {
            if (req.payoutMethod == PayoutMethod.NativeToken) {
                (bool feeOk, ) = feeRecipient.call{value: fee}("");
                require(feeOk, "Fee transfer failed");
            } else {
                IERC20(req.payoutToken).safeTransfer(feeRecipient, fee);
            }
        }

        // Pay requester
        if (req.payoutMethod == PayoutMethod.NativeToken) {
            require(address(this).balance >= req.netPayout, "Insufficient contract liquidity");
            (bool paid, ) = req.requester.call{value: req.netPayout}("");
            require(paid, "Payout failed");
        } else {
            IERC20(req.payoutToken).safeTransfer(req.requester, req.netPayout);
        }

        emit RedemptionProcessed(requestId, req.netPayout);
    }

    // ============ View Functions ============

    function getRedemption(uint256 requestId) external view returns (RedemptionRequest memory) {
        return redemptionRequests[requestId];
    }

    function getUserRedemptions(address user) external view returns (uint256[] memory) {
        return userRedemptions[user];
    }

    function getPendingCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < pendingQueue.length; i++) {
            if (redemptionRequests[pendingQueue[i]].status == RedemptionStatus.Pending) {
                count++;
            }
        }
        return count;
    }

    function getEstimatedPayout(address tokenAddress, uint256 amount) external view returns (uint256 gross, uint256 fee, uint256 net) {
        uint256 price = tokenPrices[tokenAddress];
        gross = (amount * price) / 1e18;
        fee = (gross * redemptionFeeBps) / 10000;
        net = gross - fee;
    }

    receive() external payable {}
}
