// Contract ABIs and addresses for the Cyber Estate RWA tokenization platform
// Deployed on BNB Smart Chain Testnet (tBNB)
// Update addresses after deploying contracts via Remix IDE

export const CHAIN_CONFIG = {
  chainId: "0x61", // BSC Testnet (97)
  chainName: "BNB Smart Chain Testnet",
  rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545",
  blockExplorer: "https://testnet.bscscan.com",
  nativeCurrency: {
    name: "tBNB",
    symbol: "tBNB",
    decimals: 18,
  },
};

// Deployed addresses on BSC Testnet (chainId 97)
export const CONTRACT_ADDRESSES = {
  rwaYieldToken: "0x7f8a7ea393E40c7D314EF0B8dF3545292F1D7814",
  assetToken: "0x537E66288890e9825C9b0C85850373106285311D",
  securityToken: "0x9b4524ea7c4F75016fc774E3Ea1dF31230C4BB5D",
  marketplace: "0x9Ac8c7a2BB33bF67dB3Af762731c120e5863CE76",
  kycRegistry: "0xff6840c8A2C08093f57c4a7301Ed9f57D0D45D41",
  redemptionManager: "0xd72D9529874298B74612DF1160E68a8e691869bc",
  assetFactory: "0xcC8d63F00A7C4c8b5cb37a4a788726d6Cd9e20bE",
};

export const RWA_YIELD_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function burn(address from, uint256 amount)",
  "function pause()",
  "function unpause()",
  "function distributeYield(uint256 amount)",
  "function claimYield()",
  "function pendingYield(address account) view returns (uint256)",
  "function earned(address account) view returns (uint256)",
  "function yieldPerTokenStored() view returns (uint256)",
  "function userYieldPerTokenPaid(address) view returns (uint256)",
  "function totalYieldDistributed() view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Minted(address indexed to, uint256 amount)",
  "event Burned(address indexed from, uint256 amount)",
  "event YieldDistributed(uint256 amount, uint256 timestamp)",
  "event YieldClaimed(address indexed account, uint256 amount)",
];

export const ASSET_TOKEN_ABI = [
  "function uri(uint256 id) view returns (string)",
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])",
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)",
  "function mint(address to, uint256 id, uint256 amount, bytes data)",
  "function burn(address from, uint256 id, uint256 amount)",
  "function totalSupply(uint256 id) view returns (uint256)",
  "function setTransferRestriction(uint256 id, bool restricted)",
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
  "event AssetMinted(uint256 indexed id, address indexed to, uint256 amount)",
];

export const SECURITY_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function isVerified(address account) view returns (bool)",
  "function addToWhitelist(address account)",
  "function removeFromWhitelist(address account)",
  "function issue(address to, uint256 amount)",
  "function redeem(uint256 amount)",
  "function canTransfer(address from, address to, uint256 amount) view returns (bool, string)",
  "event Issued(address indexed to, uint256 amount)",
  "event Redeemed(address indexed from, uint256 amount)",
  "event AddedToWhitelist(address indexed account)",
  "event RemovedFromWhitelist(address indexed account)",
];

export const MARKETPLACE_ABI = [
  "function placeERC20Order(address tokenAddress, uint256 amount, uint256 pricePerToken, bool isSellOrder, uint256 durationSeconds) payable returns (uint256)",
  "function placeERC1155Order(address tokenAddress, uint256 tokenId, uint256 amount, uint256 pricePerToken, bool isSellOrder, uint256 durationSeconds) payable returns (uint256)",
  "function fillOrder(uint256 orderId, uint256 fillAmount) payable",
  "function cancelOrder(uint256 orderId)",
  "function getOrder(uint256 orderId) view returns (tuple(uint256 id, address maker, address tokenAddress, uint256 tokenId, uint8 tokenType, uint256 amount, uint256 filledAmount, uint256 pricePerToken, bool isSellOrder, uint8 status, uint256 createdAt, uint256 expiresAt))",
  "function getActiveOrders() view returns (uint256[])",
  "function getMakerOrders(address maker) view returns (uint256[])",
  "function getUserHistory(address user) view returns (uint256[])",
  "function platformFeeBps() view returns (uint256)",
  "function nextOrderId() view returns (uint256)",
  "event OrderPlaced(uint256 indexed orderId, address indexed maker, address indexed tokenAddress, uint256 tokenId, uint256 amount, uint256 pricePerToken, bool isSellOrder, uint8 tokenType)",
  "event OrderFilled(uint256 indexed orderId, address indexed taker, uint256 fillAmount, uint256 totalPrice)",
  "event OrderCancelled(uint256 indexed orderId, address indexed maker)",
];

export const KYC_REGISTRY_ABI = [
  "function submitKYC(string jurisdiction, uint8 investorType, string documentHash)",
  "function approveKYC(address account, string jurisdiction, uint8 investorType, uint256 investmentLimit)",
  "function rejectKYC(address account, string reason)",
  "function revokeKYC(address account)",
  "function isVerified(address account) view returns (bool)",
  "function getIdentity(address account) view returns (tuple(uint8 status, uint8 investorType, string jurisdiction, uint256 submittedAt, uint256 verifiedAt, uint256 expiresAt, uint256 investmentLimit, uint256 totalInvested, string documentHash, address attestationProvider))",
  "function canInvest(address account, uint256 amount) view returns (bool, string)",
  "function getVerifiedCount() view returns (uint256)",
  "function getPendingCount() view returns (uint256)",
  "function updateDocumentHash(string documentHash)",
  "event KYCSubmitted(address indexed account, string jurisdiction, uint8 investorType)",
  "event KYCApproved(address indexed account, string jurisdiction, uint8 investorType, uint256 expiresAt)",
  "event KYCRejected(address indexed account, string reason)",
  "event KYCRevoked(address indexed account)",
];

export const REDEMPTION_MANAGER_ABI = [
  "function requestRedemption(address tokenAddress, uint256 amount, uint8 payoutMethod, address payoutToken)",
  "function approveRedemption(uint256 requestId)",
  "function rejectRedemption(uint256 requestId, string reason)",
  "function cancelRedemption(uint256 requestId)",
  "function depositLiquidity() payable",
  "function withdrawLiquidity(uint256 amount)",
  "function getRedemption(uint256 requestId) view returns (tuple(uint256 id, address requester, address tokenAddress, uint256 amount, uint256 valueInBase, uint256 fee, uint256 netPayout, uint8 status, uint8 payoutMethod, address payoutToken, uint256 requestedAt, uint256 processedAt, string reason))",
  "function getUserRedemptions(address user) view returns (uint256[])",
  "function getEstimatedPayout(address tokenAddress, uint256 amount) view returns (uint256 gross, uint256 fee, uint256 net)",
  "function getPendingCount() view returns (uint256)",
  "function tokenPrices(address) view returns (uint256)",
  "function redemptionFeeBps() view returns (uint256)",
  "function cooldownPeriod() view returns (uint256)",
  "function lastRedemptionTime(address) view returns (uint256)",
  "event RedemptionRequested(uint256 indexed requestId, address indexed requester, address tokenAddress, uint256 amount, uint256 estimatedValue, uint8 payoutMethod)",
  "event RedemptionProcessed(uint256 indexed requestId, uint256 payoutAmount)",
  "event RedemptionCancelled(uint256 indexed requestId)",
  "event LiquidityDeposited(address indexed sender, uint256 amount)",
  "event LiquidityWithdrawn(address indexed recipient, uint256 amount)",
];

export const ASSET_FACTORY_ABI = [
  "function createAsset(tuple(string name, string symbol, uint8 assetClass, string location, uint256 totalValue, uint256 tokenPrice, uint256 totalSupply, uint256 annualYieldBps, uint256 maturityDate, string metadataURI, string documentHash) params) payable returns (uint256)",
  "function buyTokens(uint256 assetId, uint256 amount) payable",
  "function approveAsset(uint256 assetId)",
  "function setAssetToken(address _assetToken)",
  "function setFlatCreationFee(uint256 fee)",
  "function withdrawFees()",
  "function flatCreationFee() view returns (uint256)",
  "function assetToken() view returns (address)",
  "function getAsset(uint256 assetId) view returns (tuple(uint256 id, string name, string symbol, uint8 assetClass, uint8 status, string location, uint256 totalValue, uint256 tokenPrice, uint256 totalSupply, uint256 tokensSold, uint256 annualYieldBps, uint256 maturityDate, string metadataURI, string documentHash, address originator, address yieldDistributor, uint256 createdAt))",
  "function getActiveAssets() view returns (uint256[])",
  "function getOriginatorAssets(address originator) view returns (uint256[])",
  "function getCreationFee(uint256 totalValue) view returns (uint256)",
  "function updateMetadata(uint256 assetId, string metadataURI)",
  "function matureAsset(uint256 assetId)",
  "function totalAssetsCreated() view returns (uint256)",
  "function totalValueTokenized() view returns (uint256)",
  "event AssetCreated(uint256 indexed assetId, string name, uint8 assetClass, address indexed originator, uint256 totalValue, uint256 tokenPrice)",
  "event TokensSold(uint256 indexed assetId, address indexed buyer, uint256 amount, uint256 totalPrice)",
  "event AssetStatusUpdated(uint256 indexed assetId, uint8 newStatus)",
  "event FlatCreationFeeUpdated(uint256 newFee)",
  "event AssetTokenUpdated(address indexed newAssetToken)",
];
