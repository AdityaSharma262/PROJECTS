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

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC1155 is IERC165 {
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes calldata data) external;
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
 * @title RWAMarketplace
 * @dev P2P marketplace for trading RWA tokens with limit orders.
 *      Supports both ERC-20 and ERC-1155 asset tokens.
 *      All orders are on-chain with escrow-based settlement.
 *
 * DEPLOYMENT (BNB Smart Chain / Remix IDE):
 * 1. Compile with Solidity 0.8.20+
 * 2. Deploy via Injected Provider - MetaMask (BSC Testnet chainId 97)
 * 3. Constructor arg: kycRegistry address (address(0) if not yet deployed)
 * 4. BscScan Verification: Choose "Solidity (Single file)", paste this exact code.
 */
contract RWAMarketplace is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum OrderStatus { Active, Filled, Cancelled, Expired }
    enum TokenType { ERC20, ERC1155 }

    struct Order {
        uint256 id;
        address maker;
        address tokenAddress;
        uint256 tokenId;        // Only for ERC-1155
        TokenType tokenType;
        uint256 amount;
        uint256 filledAmount;
        uint256 pricePerToken;  // In wei (BNB)
        bool isSellOrder;       // true = sell, false = buy
        OrderStatus status;
        uint256 createdAt;
        uint256 expiresAt;
    }

    // State
    uint256 public nextOrderId = 1;
    uint256 public platformFeeBps = 25; // 0.25% fee
    address public feeRecipient;

    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) public makerOrders;
    mapping(address => uint256[]) public userOrderHistory;

    // KYC registry reference
    address public kycRegistry;

    // Events
    event OrderPlaced(
        uint256 indexed orderId,
        address indexed maker,
        address indexed tokenAddress,
        uint256 tokenId,
        uint256 amount,
        uint256 pricePerToken,
        bool isSellOrder,
        TokenType tokenType
    );
    event OrderFilled(
        uint256 indexed orderId,
        address indexed taker,
        uint256 fillAmount,
        uint256 totalPrice
    );
    event OrderCancelled(uint256 indexed orderId, address indexed maker);
    event OrderExpired(uint256 indexed orderId);
    event FeeUpdated(uint256 newFeeBps);
    event FeeRecipientUpdated(address newRecipient);

    modifier onlyKYCVerified(address account) {
        if (kycRegistry != address(0)) {
            (bool success, bytes memory data) = kycRegistry.staticcall(
                abi.encodeWithSignature("isVerified(address)", account)
            );
            require(success && abi.decode(data, (bool)), "KYC verification required");
        }
        _;
    }

    constructor(address _kycRegistry) Ownable(msg.sender) {
        kycRegistry = _kycRegistry;
        feeRecipient = msg.sender;
    }

    // ============ Admin Functions ============

    function setKYCRegistry(address _kycRegistry) external onlyOwner {
        kycRegistry = _kycRegistry;
    }

    function setPlatformFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 500, "Fee cannot exceed 5%");
        platformFeeBps = _feeBps;
        emit FeeUpdated(_feeBps);
    }

    function setFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid address");
        feeRecipient = _recipient;
        emit FeeRecipientUpdated(_recipient);
    }

    // ============ Order Placement ============

    function placeERC20Order(
        address tokenAddress,
        uint256 amount,
        uint256 pricePerToken,
        bool isSellOrder,
        uint256 durationSeconds
    ) external payable onlyKYCVerified(msg.sender) nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        require(pricePerToken > 0, "Price must be > 0");
        require(durationSeconds > 0 && durationSeconds <= 90 days, "Invalid duration");

        if (isSellOrder) {
            // Escrow tokens
            IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), amount);
        } else {
            // Escrow BNB for buy orders
            uint256 totalCost = (amount * pricePerToken) / 1e18;
            require(msg.value >= totalCost, "Insufficient BNB for buy order");
            if (msg.value > totalCost) {
                (bool refunded, ) = msg.sender.call{value: msg.value - totalCost}("");
                require(refunded, "Refund failed");
            }
        }

        uint256 orderId = nextOrderId++;
        orders[orderId] = Order({
            id: orderId,
            maker: msg.sender,
            tokenAddress: tokenAddress,
            tokenId: 0,
            tokenType: TokenType.ERC20,
            amount: amount,
            filledAmount: 0,
            pricePerToken: pricePerToken,
            isSellOrder: isSellOrder,
            status: OrderStatus.Active,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + durationSeconds
        });

        makerOrders[msg.sender].push(orderId);
        userOrderHistory[msg.sender].push(orderId);

        emit OrderPlaced(orderId, msg.sender, tokenAddress, 0, amount, pricePerToken, isSellOrder, TokenType.ERC20);
        return orderId;
    }

    function placeERC1155Order(
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        uint256 pricePerToken,
        bool isSellOrder,
        uint256 durationSeconds
    ) external payable onlyKYCVerified(msg.sender) nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        require(pricePerToken > 0, "Price must be > 0");
        require(durationSeconds > 0 && durationSeconds <= 90 days, "Invalid duration");

        if (isSellOrder) {
            IERC1155(tokenAddress).safeTransferFrom(msg.sender, address(this), tokenId, amount, "");
        } else {
            uint256 totalCost = (amount * pricePerToken) / 1e18;
            require(msg.value >= totalCost, "Insufficient BNB for buy order");
            if (msg.value > totalCost) {
                (bool refunded, ) = msg.sender.call{value: msg.value - totalCost}("");
                require(refunded, "Refund failed");
            }
        }

        uint256 orderId = nextOrderId++;
        orders[orderId] = Order({
            id: orderId,
            maker: msg.sender,
            tokenAddress: tokenAddress,
            tokenId: tokenId,
            tokenType: TokenType.ERC1155,
            amount: amount,
            filledAmount: 0,
            pricePerToken: pricePerToken,
            isSellOrder: isSellOrder,
            status: OrderStatus.Active,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + durationSeconds
        });

        makerOrders[msg.sender].push(orderId);
        userOrderHistory[msg.sender].push(orderId);

        emit OrderPlaced(orderId, msg.sender, tokenAddress, tokenId, amount, pricePerToken, isSellOrder, TokenType.ERC1155);
        return orderId;
    }

    // ============ Order Filling ============

    function fillOrder(uint256 orderId, uint256 fillAmount) external payable onlyKYCVerified(msg.sender) nonReentrant {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Active, "Order not active");
        require(block.timestamp <= order.expiresAt, "Order expired");
        require(msg.sender != order.maker, "Cannot fill own order");
        require(fillAmount > 0, "Fill amount must be > 0");

        uint256 remaining = order.amount - order.filledAmount;
        require(fillAmount <= remaining, "Exceeds remaining amount");

        uint256 totalPrice = (fillAmount * order.pricePerToken) / 1e18;
        uint256 fee = (totalPrice * platformFeeBps) / 10000;
        uint256 netPrice = totalPrice - fee;

        order.filledAmount += fillAmount;
        if (order.filledAmount == order.amount) {
            order.status = OrderStatus.Filled;
        }

        if (order.isSellOrder) {
            // Buyer pays BNB, receives tokens
            require(msg.value >= totalPrice, "Insufficient BNB");

            // Transfer tokens from escrow to buyer
            if (order.tokenType == TokenType.ERC20) {
                IERC20(order.tokenAddress).safeTransfer(msg.sender, fillAmount);
            } else {
                IERC1155(order.tokenAddress).safeTransferFrom(address(this), msg.sender, order.tokenId, fillAmount, "");
            }

            // Pay seller (minus fee)
            (bool sellerPaid, ) = order.maker.call{value: netPrice}("");
            require(sellerPaid, "Seller payment failed");

            // Platform fee
            if (fee > 0) {
                (bool feePaid, ) = feeRecipient.call{value: fee}("");
                require(feePaid, "Fee payment failed");
            }

            // Refund excess BNB
            if (msg.value > totalPrice) {
                (bool refunded, ) = msg.sender.call{value: msg.value - totalPrice}("");
                require(refunded, "Refund failed");
            }
        } else {
            // Seller sends tokens, receives BNB from escrow
            if (order.tokenType == TokenType.ERC20) {
                IERC20(order.tokenAddress).safeTransferFrom(msg.sender, order.maker, fillAmount);
            } else {
                IERC1155(order.tokenAddress).safeTransferFrom(msg.sender, order.maker, order.tokenId, fillAmount, "");
            }

            // Pay seller from escrowed BNB (minus fee)
            (bool sellerPaid, ) = msg.sender.call{value: netPrice}("");
            require(sellerPaid, "Payment failed");

            if (fee > 0) {
                (bool feePaid, ) = feeRecipient.call{value: fee}("");
                require(feePaid, "Fee payment failed");
            }
        }

        userOrderHistory[msg.sender].push(orderId);
        emit OrderFilled(orderId, msg.sender, fillAmount, totalPrice);
    }

    // ============ Order Cancellation ============

    function cancelOrder(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.maker == msg.sender, "Not order maker");
        require(order.status == OrderStatus.Active, "Order not active");

        order.status = OrderStatus.Cancelled;

        uint256 remaining = order.amount - order.filledAmount;

        if (order.isSellOrder) {
            // Return escrowed tokens
            if (order.tokenType == TokenType.ERC20) {
                IERC20(order.tokenAddress).safeTransfer(msg.sender, remaining);
            } else {
                IERC1155(order.tokenAddress).safeTransferFrom(address(this), msg.sender, order.tokenId, remaining, "");
            }
        } else {
            // Return escrowed BNB
            uint256 refund = (remaining * order.pricePerToken) / 1e18;
            if (refund > 0) {
                (bool success, ) = msg.sender.call{value: refund}("");
                require(success, "Refund failed");
            }
        }

        emit OrderCancelled(orderId, msg.sender);
    }

    // ============ View Functions ============

    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }

    function getActiveOrders() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i < nextOrderId; i++) {
            if (orders[i].status == OrderStatus.Active && block.timestamp <= orders[i].expiresAt) {
                count++;
            }
        }
        uint256[] memory active = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i < nextOrderId; i++) {
            if (orders[i].status == OrderStatus.Active && block.timestamp <= orders[i].expiresAt) {
                active[idx++] = i;
            }
        }
        return active;
    }

    function getMakerOrders(address maker) external view returns (uint256[] memory) {
        return makerOrders[maker];
    }

    function getUserHistory(address user) external view returns (uint256[] memory) {
        return userOrderHistory[user];
    }

    // ============ ERC-1155 Receiver Support ============

    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x01ffc9a7 || // ERC-165
               interfaceId == 0x4e2312e0;   // ERC-1155 Token Receiver
    }

    receive() external payable {}
}
