// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title KYCRegistry
 * @dev On-chain identity registry for KYC/AML compliance.
 *      Stores verified identity attestations linked to wallet addresses.
 *      Supports multiple attestation providers and expiration management.
 *
 * DEPLOYMENT (tBNB via Remix IDE):
 * 1. Compile with Solidity 0.8.20+
 * 2. Deploy to BNB Smart Chain Testnet (chainId 97)
 * 3. No constructor args
 *
 * INTERACTION:
 * - submitKYC(jurisdiction, investorType): Submit KYC for verification
 * - approveKYC(address, jurisdiction, investorType, limit): Approve user
 * - rejectKYC(address): Reject KYC application
 * - isVerified(address): Check verification status
 * - getIdentity(address): Get full identity details
 */
contract KYCRegistry is Ownable {
    enum KYCStatus { None, Pending, Verified, Rejected, Revoked, Expired }
    enum InvestorType { Retail, Accredited, Institutional, Unknown }

    struct Identity {
        KYCStatus status;
        InvestorType investorType;
        string jurisdiction;        // ISO country code
        uint256 submittedAt;
        uint256 verifiedAt;
        uint256 expiresAt;
        uint256 investmentLimit;    // Max investment in wei
        uint256 totalInvested;
        string documentHash;        // IPFS hash of KYC documents
        address attestationProvider;
    }

    // State
    mapping(address => Identity) public identities;
    mapping(address => bool) public attesters;       // Authorized KYC attesters
    mapping(string => bool) public restrictedJurisdictions;

    uint256 public kycValidityPeriod = 365 days;
    uint256 public totalVerified;
    uint256 public totalPending;

    // Events
    event KYCSubmitted(address indexed account, string jurisdiction, InvestorType investorType);
    event KYCApproved(address indexed account, string jurisdiction, InvestorType investorType, uint256 expiresAt);
    event KYCRejected(address indexed account, string reason);
    event KYCRevoked(address indexed account);
    event KYCExpired(address indexed account);
    event IdentityUpdated(address indexed account, string documentHash);
    event AttesterUpdated(address indexed attester, bool authorized);
    event JurisdictionRestricted(string jurisdiction, bool restricted);

    modifier onlyAttester() {
        require(msg.sender == owner() || attesters[msg.sender], "Not authorized attester");
        _;
    }

    constructor() Ownable(msg.sender) {
        attesters[msg.sender] = true;
    }

    // ============ Admin Functions ============

    function setAttester(address attester, bool authorized) external onlyOwner {
        attesters[attester] = authorized;
        emit AttesterUpdated(attester, authorized);
    }

    function setJurisdictionRestriction(string calldata jurisdiction, bool restricted) external onlyAttester {
        restrictedJurisdictions[jurisdiction] = restricted;
        emit JurisdictionRestricted(jurisdiction, restricted);
    }

    function setKYCValidityPeriod(uint256 period) external onlyOwner {
        kycValidityPeriod = period;
    }

    // ============ KYC Submission ============

    function submitKYC(
        string calldata jurisdiction,
        InvestorType investorType,
        string calldata documentHash
    ) external {
        require(identities[msg.sender].status != KYCStatus.Verified, "Already verified");
        require(!restrictedJurisdictions[jurisdiction], "Jurisdiction restricted");
        require(bytes(jurisdiction).length > 0, "Jurisdiction required");

        identities[msg.sender] = Identity({
            status: KYCStatus.Pending,
            investorType: investorType,
            jurisdiction: jurisdiction,
            submittedAt: block.timestamp,
            verifiedAt: 0,
            expiresAt: 0,
            investmentLimit: 0,
            totalInvested: identities[msg.sender].totalInvested,
            documentHash: documentHash,
            attestationProvider: address(0)
        });

        totalPending++;
        emit KYCSubmitted(msg.sender, jurisdiction, investorType);
    }

    // ============ KYC Approval ============

    function approveKYC(
        address account,
        string calldata jurisdiction,
        InvestorType investorType,
        uint256 investmentLimit
    ) external onlyAttester {
        require(account != address(0), "Invalid address");
        require(!restrictedJurisdictions[jurisdiction], "Jurisdiction restricted");

        Identity storage identity = identities[account];

        if (identity.status == KYCStatus.Pending) {
            totalPending--;
        }
        if (identity.status != KYCStatus.Verified) {
            totalVerified++;
        }

        identity.status = KYCStatus.Verified;
        identity.investorType = investorType;
        identity.jurisdiction = jurisdiction;
        identity.verifiedAt = block.timestamp;
        identity.expiresAt = block.timestamp + kycValidityPeriod;
        identity.investmentLimit = investmentLimit;
        identity.attestationProvider = msg.sender;

        emit KYCApproved(account, jurisdiction, investorType, identity.expiresAt);
    }

    function rejectKYC(address account, string calldata reason) external onlyAttester {
        Identity storage identity = identities[account];
        require(identity.status == KYCStatus.Pending, "Not pending");

        identity.status = KYCStatus.Rejected;
        totalPending--;

        emit KYCRejected(account, reason);
    }

    function revokeKYC(address account) external onlyAttester {
        Identity storage identity = identities[account];
        require(identity.status == KYCStatus.Verified, "Not verified");

        identity.status = KYCStatus.Revoked;
        totalVerified--;

        emit KYCRevoked(account);
    }

    // ============ Identity Management ============

    function updateDocumentHash(string calldata documentHash) external {
        require(identities[msg.sender].status != KYCStatus.None, "No identity");
        identities[msg.sender].documentHash = documentHash;
        emit IdentityUpdated(msg.sender, documentHash);
    }

    function trackInvestment(address account, uint256 amount) external onlyAttester {
        identities[account].totalInvested += amount;
    }

    // ============ View Functions ============

    function isVerified(address account) public view returns (bool) {
        Identity memory identity = identities[account];
        if (identity.status != KYCStatus.Verified) return false;
        if (block.timestamp > identity.expiresAt) return false;
        return true;
    }

    function getIdentity(address account) external view returns (Identity memory) {
        return identities[account];
    }

    function canInvest(address account, uint256 amount) external view returns (bool, string memory) {
        if (!isVerified(account)) {
            return (false, "Not KYC verified or expired");
        }

        Identity memory identity = identities[account];

        if (restrictedJurisdictions[identity.jurisdiction]) {
            return (false, "Jurisdiction restricted");
        }

        if (identity.investmentLimit > 0 && identity.totalInvested + amount > identity.investmentLimit) {
            return (false, "Exceeds investment limit");
        }

        return (true, "");
    }

    function getVerifiedCount() external view returns (uint256) {
        return totalVerified;
    }

    function getPendingCount() external view returns (uint256) {
        return totalPending;
    }
}
