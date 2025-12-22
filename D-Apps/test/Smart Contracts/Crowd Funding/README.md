# Crowdfunding Smart Contract

## Overview
This is a decentralized crowdfunding smart contract that allows multiple contributors to fund a project towards a target amount before a deadline. It features contributor management, refund capability, and a voting system for spending requests.

## Features
- Contributors can send Ether to the campaign if the deadline is not passed and minimum contribution is met.
- Tracks contributors, their contributions, and the total amount raised.
- Allows contributors to get refunds if the target is not reached by the deadline.
- Manager (contract deployer) can create spending requests.
- Contributors vote on spending requests, which are executed only if a majority approves.
- Secure Ether transfers and role-based access control via modifiers.

## Technologies
- Solidity ^0.8.0

## Contract Files
- `crowdfunding.sol` — main smart contract file

## How to Deploy
1. Compile using Solidity compiler version 0.8.0 or higher.
2. Deploy with constructor parameters:  
   - `_target`: fundraising goal in wei  
   - `_deadline`: duration in seconds (added to current timestamp)

## Usage
- Contributors call `sendEth()` to contribute Ether.
- Call `refund()` after deadline if the goal is not met to get back contributions.
- Manager calls `createRequests()` to propose spending requests.
- Contributors vote on requests via `voteRequest()`.
- Manager executes approved requests using `makePayment()`.

## Notes
- Only the manager can create and execute requests.
- Voting requires majority approval (>50% contributors).
- Suitable for decentralized fundraising experiments or educational use.
