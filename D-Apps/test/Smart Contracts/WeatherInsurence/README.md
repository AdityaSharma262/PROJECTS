# Weather Insurance Smart Contract

## Overview
This smart contract allows users to buy insurance based on weather conditions (temperature). It integrates with a Chainlink weather oracle to fetch temperature data. If the temperature exceeds a threshold, insured users can claim a payout.

## Features
- Owner deploys the contract and sets the Chainlink weather oracle address.
- Users can buy insurance by sending Ether.
- Fetches real-time temperature data from the Chainlink oracle.
- Users can claim a payout if the temperature condition is met (temperature ≥ 35).
- Payout is twice the insured amount.
- Protects against unauthorized access using modifiers.

## Technologies
- Solidity ^0.8.0
- Chainlink AggregatorV3Interface Oracle

## Contract Files
- `WeatherContract.sol` — main smart contract file

## How to Deploy
1. Compile using Solidity compiler version 0.8.0 or higher.
2. Deploy with the Chainlink oracle contract address as a constructor argument.

## Usage
- Users call `buyInsurence()` with Ether to buy insurance.
- Users can call `clainPayout()` to receive payout if temperature conditions are met.
- Owner controls the oracle address and access.

## Notes
- Requires integration with a live Chainlink weather oracle on supported networks.
- Payouts depend on external oracle data.
- Suitable for demonstrating oracle integration in Solidity.
