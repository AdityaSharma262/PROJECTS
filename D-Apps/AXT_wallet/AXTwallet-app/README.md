# AXT Wallet

A professional, non-custodial decentralized cryptocurrency wallet mobile application built with React Native and Expo.

## Architecture

- `src/app/` - Expo Router file-based routing
- `src/components/` - Reusable UI components
- `src/features/` - Domain-specific business logic and screens
- `src/blockchain/` - Web3 and blockchain interaction layer
- `src/security/` - Cryptography and secure storage
- `src/storage/` - Persistence layer
- `src/services/` - General external services
- `src/state/` - Global state management
- `src/types/` - Shared TypeScript types

## Development

- `npm start` - Start Expo development server
- `npm run android` - Start on Android emulator
- `npm run ios` - Start on iOS simulator
- `npm run lint` - Run ESLint
- `npx tsc --noEmit` - Run TypeScript compiler check
