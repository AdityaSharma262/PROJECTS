# Hotel Room Booking Smart Contract

## Overview
This smart contract simulates a simple hotel room booking system where users can book a single room by paying a fixed price. The room can only be booked if it is vacant.

## Features
- Tracks room status: vacant or occupied.
- Allows users to book the room by paying exactly 2 Ether.
- Transfers the booking payment directly to the contract owner.
- Emits an event when the room is booked.
- Prevents booking if the room is already occupied.

## Technologies
- Solidity ^0.8.0

## Contract Files
- `HotelRoom.sol` — main smart contract file

## How to Deploy
1. Compile using Solidity compiler version 0.8.0 or higher.
2. Deploy without constructor parameters.

## Usage
- Users call `BookRoom()` with exactly 2 Ether to book the room.
- Booking fails if the room is already occupied or payment amount is incorrect.
- Owner receives the payment immediately upon booking.

## Notes
- This is a basic model suitable for learning purposes.
- Only one room is managed by this contract.
