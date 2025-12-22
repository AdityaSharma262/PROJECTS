# Lottery Smart Contract

## Overview
This smart contract implements a simple lottery system where participants can enter by sending exactly 1 Ether. The manager can pick a random winner who receives the entire balance.

## Features
- Manager sets up the contract.
- Participants enter the lottery by sending 1 Ether.
- Manager can view the contract balance.
- Random winner is selected based on a pseudo-random hash.
- Winner receives the entire contract balance.
- Lottery resets after each winner selection.

## Technologies
- Solidity ^0.8.0

## Contract Files
- `lottery.sol` — main smart contract file

## How to Deploy
1. Compile using Solidity compiler version 0.8.0 or higher.
2. Deploy without constructor parameters.

## Usage
- Anyone can enter the lottery by sending exactly 1 Ether.
- Only the manager can pick the winner.
- The winner is chosen randomly and receives the full pot.
- Lottery participants reset after each draw.

## Notes
- Randomness is pseudo-random and not secure for large stakes.
- Suitable for demonstration or educational use.
