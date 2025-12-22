# Voting Smart Contract

## Overview
A simple voting contract where candidates can be added, and users can vote for their preferred candidate. Each address can vote only once.

## Features
- Add candidates dynamically.
- Vote for candidates by their ID.
- Prevent multiple votes from the same address.
- Retrieve the total votes for each candidate.
- Events emitted on votes for easy tracking.

## Technologies
- Solidity ^0.8.29

## Contract Files
- `Voting.sol` — main smart contract file

## How to Deploy
1. Compile with Solidity compiler version 0.8.29.
2. Deploy without constructor parameters.

## Usage
- Call `addCandidate(string)` to add candidates.
- Call `vote(uint)` to cast a vote for a candidate.
- Use `getVotes(uint)` to view votes for a candidate.
- Check voting status with `hasVoted` mapping.

## Notes
- This contract is for demonstration and educational purposes.
- No voter registration or access control is implemented.
