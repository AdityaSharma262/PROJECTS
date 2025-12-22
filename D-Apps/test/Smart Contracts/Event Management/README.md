# Event Management Smart Contract

## Overview
This smart contract allows organizers to create events with tickets, and users to buy tickets for those events using Ether.

## Features
- Event organizers can create future events specifying name, date, ticket price, and total ticket count.
- Users can buy tickets for active events by paying the exact Ether amount.
- Tracks tickets owned by users for each event.
- Prevents buying tickets for past or non-existent events.
- Updates remaining ticket count after each purchase.

## Technologies
- Solidity ^0.8.0

## Contract Files
- `EventContract.sol` — main smart contract file

## How to Deploy
1. Compile using Solidity compiler version 0.8.0 or higher.
2. Deploy the contract without constructor parameters.

## Usage
- Organizers call `createEvent(name, date, price, ticketCount)` to create an event.
- Users call `buyTicket(eventId, quantity)` to purchase tickets for the specified event.
- Requires sending exact Ether equal to `price * quantity`.

## Notes
- Event date must be in the future when creating.
- Users cannot buy tickets for past events.
- Tickets availability is updated on purchase.
