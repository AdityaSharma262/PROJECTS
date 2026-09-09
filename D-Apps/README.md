# ⚡ Decentralized Applications (D-Apps) Showcase

Welcome to the **D-Apps** directory of this repository! This collection contains full-stack decentralized applications combining modern, responsive frontends (React, Next.js, React Native/Expo, Vite) with robust blockchain protocols, EVM smart contracts, hardware-backed cryptography, and Web3 connection layers.

---

## 🌟 Featured Projects

| Project Name | Category | Primary Tech Stack | Description | Live / Folder Link |
| :--- | :--- | :--- | :--- | :--- |
| **🛡️ AXT Wallet** | **Mobile Web3 (Android)** | React Native, Expo 57, ethers.js, WalletConnect v2, AES-256-GCM | Production-grade non-custodial decentralized crypto wallet featuring Android Keystore hardware protection, biometrics, multi-chain EVM with custom RPCs, and ERC-20 token engine. | [Docs](./AXT_wallet%20(%20Decentralized%20wallet%20Android%20Application%29) • [📲 Download APK](https://expo.dev/accounts/velvosoft/projects/AXTwallet-app/builds/3d05ed1a-a3db-4bb5-a8b7-3fc7ada04a7b) |
| **🌉 CrossLink Bridge** | **Multi-Chain DeFi** | React 19, Vite, Tailwind CSS, Wagmi, RainbowKit | Seamless cross-chain asset bridging interface supporting 7+ major EVM chains and 10+ stablecoins with real-time balance checking and status tracking. | [Explore CrossLink](./CrossLink%20(Secure%20Bridges%20for%20a%20Decentralized%20World)) |
| **🆔 Block ID** | **Web3 Identity** | React, Vite, wagmi, RainbowKit, Solidity | Decentralized identity and `.bnb` domain registry allowing users to register, renew, and manage blockchain domains with full ownership. | [Explore Block ID](./Block%20ID%20(%20Your%20Web3%20identity%20on%20blockchains%20)) |
| **🤝 BlockLance** | **Freelance Escrow** | React, Vite, Hardhat, Solidity, Web3.js | Trustless freelance escrow platform with milestone-based smart contracts, automated dispute arbitration, and secure payment releases. | [Explore BlockLance](./BlockLance(%20Decentralized%20Freelance%20Escrow%20Platform%20)) |
| **🎨 CyroBid Arena** | **NFT Marketplace** | React, Vite, Hardhat, Solidity | Decentralized NFT auction house supporting timed auctions, real-time bid updates, and trustless NFT custody transfer. | [Explore CyroBid](./CyroBid%20Arena(%20NFT%20Auction%20House%20)) |
| **🌪️ Token Storm (TSender)** | **DeFi Utility** | Next.js, wagmi, RainbowKit, Solidity | Highly gas-optimized bulk ERC-20 token airdrop and multi-recipient distribution platform. | [Explore Token Storm](./Token%20Strom%20(%20Multi-Recipient%20ERC20%20Airdrop%20Platform%20)) |
| **🏢 Cyber Estate (RWA)** | **Tokenized Assets** | React, Vite, TypeScript, Tailwind CSS, ethers.js, Solidity | Institutional-grade Real World Asset (RWA) tokenization protocol featuring KYC verification, P2P secondary marketplace, and yield distribution on BNB Chain. | [Explore Cyber Estate](./RWA) |

---

## 📱 Spotlight: AXT Wallet (Android Web3 Mobile App)

<div align="center">
  <img src="./AXT_wallet%20(%20Decentralized%20wallet%20Android%20Application%29/assets/images/gitcover/photo_5_2026-09-09_12-07-41.jpg" width="220" alt="AXT Wallet Dashboard" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="./AXT_wallet%20(%20Decentralized%20wallet%20Android%20Application%29/assets/images/gitcover/photo_1_2026-09-09_12-07-41.jpg" width="220" alt="AXT Wallet PIN & Biometrics" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="./AXT_wallet%20(%20Decentralized%20wallet%20Android%20Application%29/assets/images/gitcover/photo_4_2026-09-09_12-07-41.jpg" width="220" alt="AXT Wallet Assets" />
</div>

<div align="center" style="margin-top: 14px;">
  <a href="https://expo.dev/accounts/velvosoft/projects/AXTwallet-app/builds/3d05ed1a-a3db-4bb5-a8b7-3fc7ada04a7b">
    <img src="https://img.shields.io/badge/📲_Download_Android_APK-Direct_Expo_Build-00C853?style=for-the-badge&logo=android&logoColor=white" alt="Download APK" />
  </a>
</div>

### Highlights:
- **Zero-Knowledge Hardware Security:** Secrets encrypted with AES-256-GCM + PBKDF2/HKDF; Master Keys sealed in Android Keystore.
- **Ephemeral Single-Pass Signing:** Private keys are created only in transient memory during PIN authorization and purged immediately after signing.
- **Universal dApp Connectivity:** Built-in WalletConnect v2 (`@walletconnect/web3wallet`) supporting session management, `eth_sendTransaction`, `personal_sign`, and EIP-712 structured data.
- **Multi-Chain Resilience:** Dynamic custom EVM RPC engine with automatic provider fallback to ensure uninterrupted blockchain uptime.

👉 **[Download Android APK Directly](https://expo.dev/accounts/velvosoft/projects/AXTwallet-app/builds/3d05ed1a-a3db-4bb5-a8b7-3fc7ada04a7b)** • **[Read the complete AXT Wallet documentation](./AXT_wallet%20(%20Decentralized%20wallet%20Android%20Application%29/README.md)**

---

## 🛠️ Unified Web3 Tech Stack

- **Mobile Framework:** React Native 0.86, Expo SDK 57, Expo Router v4
- **Web Frameworks:** React 18/19, Next.js, Vite
- **Styling:** Tailwind CSS, Glassmorphic Vanilla CSS, shadcn/ui, Radix UI
- **Smart Contract Development:** Solidity, Hardhat, Remix
- **Web3 Client Libraries:** Wagmi, Viem, Ethers.js v6, Web3.js, RainbowKit, Reown AppKit
- **Cryptography & Device Security:** @noble/ciphers, @noble/hashes, Android Keystore (`expo-secure-store`), Biometrics (`expo-local-authentication`)
