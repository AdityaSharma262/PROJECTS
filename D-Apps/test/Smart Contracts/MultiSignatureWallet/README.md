# MultiSig Wallet Smart Contract

## Overview
This smart contract implements a basic multisignature wallet where multiple owners must confirm transactions before execution. It allows owners to submit transactions that require multiple confirmations.

## Features
- Supports multiple wallet owners.
- Requires a minimum number of confirmations before executing a transaction.
- Owners can submit transactions with an amount and recipient.
- Tracks confirmations for each transaction.
- Emits event when a transaction is submitted.

## Technologies
- Solidity ^0.8.0

## Contract Files
- `MultiSigWallet.sol` — main smart contract file

## How to Deploy
1. Compile with Solidity compiler version 0.8.0 or higher.
2. Deploy with constructor parameters:
   - `_owners`: array of owner addresses.
   - `_noOfConfirmationReq`: number of confirmations required.

## Usage
- Owners submit transactions with a recipient address and Ether value.
- Transactions require multiple owner confirmations (not fully implemented in this snippet).
- Emitted events track submitted transactions.

## Notes
- This contract currently supports submission but needs additional functions for confirming and executing transactions.
- Designed for learning multisignature wallet basics.
