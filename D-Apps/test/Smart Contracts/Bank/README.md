# Bank Smart Contract

## Overview
This is a simple decentralized bank smart contract that allows users to deposit and withdraw Ether. Each user has an individual balance tracked on-chain.

## Features
- Users can deposit Ether into the contract.
- Users can withdraw Ether up to their deposited balance.
- Emits events on deposits and withdrawals for easy tracking.
- Tracks the total Ether held by the contract.

## Technologies
- Solidity ^0.8.0
- Developed and tested using Remix IDE or any Solidity environment.

## Contract Files
- `Bank.sol` — main smart contract file

## How to Deploy
1. Open `Bank.sol` in Remix IDE or your preferred Solidity environment.
2. Compile with Solidity compiler version 0.8.0 or higher.
3. Deploy to a test network like Goerli or to your local blockchain (e.g., Ganache).

## Usage
- Call `deposit()` function with some Ether to add balance.
- Call `withdraw(amount)` to withdraw a specified amount of Ether.
- Use `getContractBalance()` to check total Ether held by the contract.

## Notes
- The contract ensures users cannot withdraw more than their balance.
- Ether transfers use `transfer()` for safety.
- Suitable for educational and experimental purposes; use caution before deploying on mainnet.
