# AXT Wallet — Project Map & File Directory Reference

This document provides a comprehensive map of all files and folders across the AXT Wallet codebase, with a concise one-line explanation for each file's purpose and functionality.

---

## 📁 Root Configuration & Project Files

| File / Folder | Description |
| :--- | :--- |
| **`app.json`** | Expo and React Native project configuration (app name, bundle identifiers, icons, splash screens, permissions). |
| **`package.json`** | Project dependencies, scripts (start, test, build), and package metadata. |
| **`package-lock.json`** | Deterministic lockfile pinning exact versions of all npm dependencies. |
| **`tsconfig.json`** | TypeScript compiler options and path aliases (e.g. `@/*` pointing to `./src/*`). |
| **`jest.config.js`** | Jest test runner configuration with TypeScript and module name mapping. |
| **`metro.config.js`** | Metro bundler configuration with Node.js crypto polyfill resolutions. |
| **`eslint.config.js`** | ESLint code quality and style rule configurations. |
| **`AGENTS.md`** | AI agent behavioral rules and Expo versioned documentation requirements. |
| **`README.md`** | Project documentation and developer getting-started guide. |
| **`LICENSE`** | Software licensing terms for the repository. |
| **`assets/`** | Static assets including app icons, splash screens, background images, and wallet logos. |

---

## 📁 `src/app/` — Expo Router Navigation & Screen Hierarchy

### Root Navigation
| File | Description |
| :--- | :--- |
| **`src/app/_layout.tsx`** | Root application layout initializing Providers (`AuthProvider`, `AccountProvider`, `NetworkProvider`, `WalletConnectProvider`), deep linking handler, and global modal overlays. |
| **`src/app/index.tsx`** | Entry gatekeeper redirecting users to `(onboarding)` if no vault exists, `(auth)/unlock` if locked, or `(main)` if authenticated. |

### `src/app/(onboarding)/` — New User Onboarding
| File | Description |
| :--- | :--- |
| **`src/app/(onboarding)/_layout.tsx`** | Stack navigator layout for the onboarding sequence. |
| **`src/app/(onboarding)/welcome.tsx`** | Welcome landing screen offering "Create New Wallet" and "Import Existing Wallet". |
| **`src/app/(onboarding)/create.tsx`** | Generates a 12-word BIP-39 recovery phrase with verification quiz and 6-digit PIN setup. |
| **`src/app/(onboarding)/import.tsx`** | Imports an existing BIP-39 mnemonic phrase and sets up a new 6-digit PIN. |

### `src/app/(auth)/` — Authentication & Recovery
| File | Description |
| :--- | :--- |
| **`src/app/(auth)/_layout.tsx`** | Stack navigator layout for authentication screens. |
| **`src/app/(auth)/unlock.tsx`** | 6-digit PIN entry screen with progressive lockout and biometric support to unlock the vault. |
| **`src/app/(auth)/set-pin.tsx`** | PIN creation and confirmation interface. |
| **`src/app/(auth)/recovery.tsx`** | Forgot-PIN recovery screen resetting the PIN using the 12-word recovery phrase. |

### `src/app/(main)/` — Authenticated Main Wallet Flow
| File | Description |
| :--- | :--- |
| **`src/app/(main)/_layout.tsx`** | Main bottom tab navigator layout with centered header logo and route protection guards. |
| **`src/app/(main)/index.tsx`** | Home dashboard displaying active account, live native token price, balances, quick actions, and recent activity. |
| **`src/app/(main)/assets.tsx`** | Multi-asset portfolio screen listing native currency and imported ERC-20 tokens with balances. |
| **`src/app/(main)/activity.tsx`** | Full transaction activity history screen with direction filters and pull-to-refresh. |
| **`src/app/(main)/settings.tsx`** | Settings screen for security, connected dApps, network management, account management, and app lockout. |
| **`src/app/(main)/connected-dapps.tsx`** | Connected dApps management screen to inspect active sessions, approved accounts/chains, disconnect sessions, and revoke all. |

### `src/app/actions/` — Transaction Actions
| File | Description |
| :--- | :--- |
| **`src/app/actions/_layout.tsx`** | Stack navigator layout for transactional modal sheets. |
| **`src/app/actions/send.tsx`** | Send asset wizard handling asset selection, recipient validation, gas estimation, and PIN-authorized signing. |
| **`src/app/actions/receive.tsx`** | Receive asset screen showing QR code, full wallet address, copy button, and account switcher. |

---

## 📁 `src/blockchain/` — Blockchain Services & Web3 Pipeline

### `src/blockchain/walletconnect/` — WalletConnect dApp Connectivity
| File | Description |
| :--- | :--- |
| **`walletconnect.types.ts`** | TypeScript definitions for dApp metadata, active sessions, proposals, review requests, and method parameters. |
| **`walletconnect.service.ts`** | Core service initializing Web3Wallet client, pairing with `wc:` URIs, dispatching lifecycle events, and persisting session bindings. |
| **`walletconnect.session.service.ts`** | Service constructing strict account-bound and chain-bound `eip155` namespaces, approving/rejecting proposals, and revoking sessions. |
| **`walletconnect.request.handler.ts`** | EIP-1193 router validating and parsing `eth_sendTransaction`, `personal_sign`, `eth_sign`, `eth_signTypedData_v4`, and chain switching. |
| **`index.ts`** | Public barrel export for WalletConnect services and types. |

### `src/blockchain/networks/` — Multi-Chain EVM Configuration
| File | Description |
| :--- | :--- |
| **`network.types.ts`** | TypeScript interfaces for `NetworkConfig`, `NativeCurrency`, and custom network inputs. |
| **`networks.ts`** | Registry of default mainnets and testnets with primary Alchemy RPCs and public fallbacks. |
| **`network.service.ts`** | Service performing live RPC verification, chain ID assertions, and duplicate detection. |
| **`index.ts`** | Public barrel export for network types, constants, and services. |

### `src/blockchain/providers/` — EVM RPC Provider & Automatic Fallback
| File | Description |
| :--- | :--- |
| **`provider.service.ts`** | Singleton `EVMProviderService` managing active ethers `JsonRpcProvider` with automatic fallback on RPC failure. |
| **`index.ts`** | Public barrel export for provider services. |

### `src/blockchain/balances/` — Multi-Asset Balance Fetching
| File | Description |
| :--- | :--- |
| **`balance.service.ts`** | Service querying on-chain native balances (`provider.getBalance`) and ERC-20 token balances (`contract.balanceOf`). |
| **`balance.utils.ts`** | Utility formatting atomic wei amounts into human-readable strings with bounded decimal precision. |
| **`index.ts`** | Public barrel export for balance services. |

### `src/blockchain/tokens/` — ERC-20 Token Engine
| File | Description |
| :--- | :--- |
| **`erc20.abi.ts`** | Minimal ERC-20 Application Binary Interface (`name`, `symbol`, `decimals`, `balanceOf`, `transfer`). |
| **`token.types.ts`** | TypeScript interfaces for `TokenConfig`, `TokenBalance`, and imported token metadata. |
| **`token.service.ts`** | Service validating ERC-20 contract code, reading on-chain metadata, and managing imported tokens. |
| **`token.registry.ts`** | Known ERC-20 token configurations registry. |
| **`index.ts`** | Public barrel export for token engine components. |

### `src/blockchain/transactions/` — Transaction Lifecycle & Gas
| File | Description |
| :--- | :--- |
| **`transaction.types.ts`** | TypeScript interfaces for `UnsignedTransaction`, `LocalTransactionRecord`, and transaction requests. |
| **`gas.service.ts`** | Service estimating native and ERC-20 transfer gas limits and querying current gas fees. |
| **`transaction.service.ts`** | Service broadcasting signed raw transactions to the RPC, revalidating arbitrary dApp calls, and tracking confirmation status. |
| **`index.ts`** | Public barrel export for transaction services. |

### `src/blockchain/history/` — Transaction History & Indexing
| File | Description |
| :--- | :--- |
| **`history.types.ts`** | TypeScript interfaces for `UnifiedTransactionRecord`, filters, and history results. |
| **`history.provider.interface.ts`** | Pluggable `IHistoryProvider` interface for blockchain indexer adapters. |
| **`explorer.history.provider.ts`** | History provider adapter querying Alchemy Asset Transfers API and Etherscan/BscScan explorer APIs. |
| **`history.service.ts`** | Unified history service merging on-chain discovered records with local pending/confirmed storage records. |
| **`index.ts`** | Public barrel export for history services. |

### `src/blockchain/prices/` — CoinGecko Live Market Pricing
| File | Description |
| :--- | :--- |
| **`price.types.ts`** | TypeScript interfaces for token price information and cache structures. |
| **`price.service.ts`** | Service fetching live USD prices from CoinGecko API with 60-second in-memory caching and testnet isolation. |

### `src/blockchain/hooks/` — React Blockchain Hooks
| File | Description |
| :--- | :--- |
| **`useWalletBalance.ts`** | React hook fetching and refreshing active account's native coin balance. |
| **`useWalletAssets.ts`** | React hook fetching native asset and all imported ERC-20 token balances for the active account and network. |
| **`useGasEstimate.ts`** | React hook estimating gas limit, gas price, and total estimated fee in real time. |
| **`useSendTransaction.ts`** | React hook orchestrating PIN authorization, single-pass signing, broadcast, and confirmation tracking. |
| **`useTransactionHistory.ts`** | React hook fetching and filtering unified transaction history with pagination and pull-to-refresh. |
| **`useNativeTokenPrice.ts`** | React hook providing live CoinGecko USD price display for the active network's native token. |

---

## 📁 `src/wallet/` — Cryptography, Accounts & Security Architecture

### `src/wallet/crypto/` — Cryptographic Primitives
| File | Description |
| :--- | :--- |
| **`mnemonic.ts`** | BIP-39 mnemonic generator, validator, and seed derivation engine. |
| **`derivation.ts`** | BIP-44 standard HD path derivation (`m/44'/60'/0'/0/index`) for multi-account wallet management. |

### `src/wallet/vault/` — Encrypted Vault Storage
| File | Description |
| :--- | :--- |
| **`vault.types.ts`** | TypeScript interfaces for encrypted vault payload (`ciphertext`, `iv`, `salt`, `authTag`, `address`). |
| **`vault.service.ts`** | Secure vault service managing creation, encryption, decryption, and migration of the encrypted seed vault. |

### `src/wallet/auth/` — Authentication & Single-Pass Signing
| File | Description |
| :--- | :--- |
| **`auth.types.ts`** | TypeScript interfaces for `AuthSession`, `LockoutState`, and authentication results. |
| **`auth.service.ts`** | Core authentication service handling PIN verification, ephemeral single-pass transaction, message, and typed data signing. |
| **`lockout.service.ts`** | Progressive lockout service tracking failed PIN attempts and enforcing exponential lock durations. |
| **`recovery.service.ts`** | Service verifying recovery phrases and resetting vault encryption with a new PIN. |

### `src/wallet/accounts/` — Multi-Account HD Management
| File | Description |
| :--- | :--- |
| **`account.types.ts`** | TypeScript interfaces for `HDAccount` (`address`, `index`, `name`, `createdAt`). |
| **`account.service.ts`** | Service creating, naming, listing, and switching HD derived accounts with concurrency safety. |

---

## 📁 `src/security/` — Low-Level Encryption & Hardware Keystore

### `src/security/encryption/`
| File | Description |
| :--- | :--- |
| **`aes-gcm.ts`** | Authenticated AES-256-GCM encryption and decryption module. |
| **`key-derivation.ts`** | PBKDF2-HMAC-SHA256 and HKDF key derivation functions transforming PIN and Device Key into MEK. |
| **`index.ts`** | Public barrel export for encryption functions. |

### `src/security/secure-storage/`
| File | Description |
| :--- | :--- |
| **`interface.ts`** | Interface defining hardware-backed key-value storage contracts. |
| **`secure-storage.android.ts`** | Android hardware-backed Keystore implementation using `expo-secure-store`. |
| **`index.ts`** | Public barrel export for secure hardware storage. |

---

## 📁 `src/storage/` — Local & Persistent Storage Layer

| File | Description |
| :--- | :--- |
| **`app-storage.ts`** | General-purpose persistent key-value storage wrapper using `AsyncStorage`. |
| **`account-storage.ts`** | Persistent storage for user's HD account metadata and active account index (`AXT_ACCOUNTS_V1`). |
| **`token-storage.ts`** | Persistent storage for user-imported custom ERC-20 tokens scoped by address and chainId. |
| **`transaction-storage.ts`** | Persistent storage for submitted, pending, and confirmed transaction records scoped by address and chainId. |
| **`custom-network-storage.ts`** | Persistent storage for user-added custom EVM network configurations (`AXT_CUSTOM_NETWORKS_V1`). |

---

## 📁 `src/context/` — React State Context Providers

| File | Description |
| :--- | :--- |
| **`AuthContext.tsx`** | Global authentication state providing session status (`isUnlocked`, `address`, `lock`, `unlock`). |
| **`AccountContext.tsx`** | Multi-account state providing `accounts`, `activeAccount`, `switchAccount`, `renameAccount`, and `createAccount`. |
| **`NetworkContext.tsx`** | EVM network state providing `activeNetwork`, `mainnets`, `testnets`, `customNetworks`, and network management actions. |
| **`WalletConnectContext.tsx`** | WalletConnect state managing active sessions, pending proposals, transaction/message review requests, and single-pass authorization. |

---

## 📁 `src/components/` — UI Component Library

### `src/components/ui/` — Design System Primitives
| File | Description |
| :--- | :--- |
| **`Screen.tsx`** | Base screen container with background image styling and SafeAreaView wrapping. |
| **`Button.tsx`** | Reusable button component supporting primary, secondary, danger, and disabled variants. |
| **`Input.tsx`** | Standard text input component with focus states and error styling. |
| **`PinPad.tsx`** | 6-digit numeric keypad with randomizable keys and visual pin dot indicators. |

### `src/components/walletconnect/`
| File | Description |
| :--- | :--- |
| **`ConnectionProposalModal.tsx`** | Modal sheet to inspect dApp info, select bound account, review approved networks and permissions, and approve/reject. |
| **`TransactionRequestModal.tsx`** | Modal sheet to inspect `eth_sendTransaction` parameters, contract interactions, gas fees, and authorize with PIN. |
| **`MessageSignRequestModal.tsx`** | Modal sheet to inspect `personal_sign` and EIP-712 typed structured data and authorize signature with PIN. |
| **`PairingInputModal.tsx`** | Modal dialog to paste and connect `wc:` pairing URIs from clipboard or manual entry. |

### `src/components/accounts/`
| File | Description |
| :--- | :--- |
| **`AccountSelectorModal.tsx`** | Modal bottom sheet for switching active accounts, creating new accounts (+ PIN pad), and renaming accounts. |

### `src/components/networks/`
| File | Description |
| :--- | :--- |
| **`NetworkSelectorModal.tsx`** | Modal bottom sheet listing Mainnets, Testnets (with warning badges), and Custom Networks. |
| **`AddCustomNetworkModal.tsx`** | Form modal to input and live-verify custom EVM networks via RPC test before saving. |
| **`EditCustomNetworkModal.tsx`** | Modal to edit parameters of existing custom networks. |

### `src/components/tokens/`
| File | Description |
| :--- | :--- |
| **`ImportTokenModal.tsx`** | Modal to import custom ERC-20 tokens by contract address with live metadata inspection. |

---

## 📁 `src/constants/` — Design Tokens & Constants

| File | Description |
| :--- | :--- |
| **`theme.ts`** | Global design tokens for dark theme colors, spacing units, border radii, and typography scales. |

---

## 📁 `tests/` — Automated Unit & Integration Test Suites

### `tests/blockchain/`
| File | Description |
| :--- | :--- |
| **`balance.test.ts`** | Tests for native and ERC-20 balance fetching and precision formatting. |
| **`gas.test.ts`** | Tests for gas limit estimation, fee calculation, and transfer type detection. |
| **`network.test.ts`** | Tests verifying all default mainnets and testnets, Alchemy RPCs, and public fallbacks. |
| **`network.service.test.ts`** | Tests verifying live RPC validation, chain ID assertions, and duplicate detection. |
| **`price.service.test.ts`** | Tests verifying CoinGecko price resolution, USD formatting, caching, and testnet isolation. |
| **`provider.service.test.ts`** | Tests verifying primary Alchemy RPC connection, automatic public fallback, and runtime failover. |
| **`token.registry.test.ts`** | Tests verifying token registry lookups and network filtering. |
| **`token.service.test.ts`** | Tests verifying ERC-20 contract validation, metadata fetching, and balance reading. |
| **`explorer.history.provider.test.ts`** | Tests verifying Alchemy asset transfers, explorer API parsing, and custom network handling. |
| **`history.service.test.ts`** | Tests verifying merging, reconciliation, sorting, and deduplication of transaction history. |
| **`walletconnect.service.test.ts`** | Tests verifying WalletConnect client initialization, proposal normalization, request normalization, and session persistence. |
| **`walletconnect.session.test.ts`** | Tests verifying account-specific and chain-specific namespace binding, approval, and disconnection. |
| **`walletconnect.request.test.ts`** | Tests verifying `eth_sendTransaction`, `personal_sign`, and `eth_signTypedData_v4` parameter parsing and validation. |

### `tests/wallet/`
| File | Description |
| :--- | :--- |
| **`crypto.test.ts`** | Tests verifying BIP-39 mnemonic generation, validation, seed derivation, and address derivation. |
| **`vault.test.ts`** | Tests verifying vault encryption, decryption, invalid PIN rejection, and address verification. |
| **`auth.test.ts`** | Tests verifying PIN authentication, progressive lockout enforcement, and unlock flows. |
| **`recovery.test.ts`** | Tests verifying forgot-PIN recovery using recovery phrases. |
| **`signing.test.ts`** | Tests verifying secure single-pass transaction, personal message (EIP-191), and typed data (EIP-712) signing. |
| **`account.service.test.ts`** | Tests verifying HD account derivation, migration, index allocation, and concurrency locking. |

### `tests/security/`
| File | Description |
| :--- | :--- |
| **`encryption.test.ts`** | Tests verifying AES-256-GCM authenticated encryption and PBKDF2/HKDF key derivation. |

### `tests/storage/`
| File | Description |
| :--- | :--- |
| **`account-storage.test.ts`** | Tests verifying persistence, listing, updating, and active index setting for HD accounts. |
| **`token-storage.test.ts`** | Tests verifying persistence, retrieval, and deletion of custom imported tokens. |
| **`transaction-storage.test.ts`** | Tests verifying saving, status updating, and scoped retrieval of transaction records. |
| **`custom-network-storage.test.ts`** | Tests verifying persistence, updating, and deletion of custom EVM networks. |
