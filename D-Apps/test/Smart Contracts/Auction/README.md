# 🏷️ Simple Auction Smart Contract

This project is a basic implementation of a **sealed-bid auction** using Solidity. Bidders compete by sending Ether, and the **highest bidder at the end of the auction wins**. The contract includes secure refund handling, custom error messages, and safe bidding logic following best practices.

## 🚀 Features

- Secure auction with a deadline (`AuctionEndTime`)
- Automatically tracks the highest bid and bidder
- Refunds previous highest bidders safely using the withdrawal pattern
- Only allows ending the auction once
- Custom Solidity `error`s for gas optimization and clarity
- Emits events for UI integrations and transparency

---

## 🔧 Smart Contract Details

### Contract Name: `SimpleAuction`

### Deployed Variables

| Variable          | Type              | Description                                      |
|-------------------|-------------------|--------------------------------------------------|
| `beneficiary`     | `address payable` | The recipient of the final winning bid amount    |
| `AuctionEndTime`  | `uint`            | The auction deadline in Unix timestamp           |
| `HighestBidder`   | `address`         | Current highest bidder                           |
| `highestBid`      | `uint`            | Amount of the current highest bid in wei         |
| `pendingReturns`  | `mapping`         | Stores refund amounts for outbid bidders         |
| `ended`           | `bool`            | Tracks whether the auction has already ended     |

---

## 📦 Functions

### ✅ `constructor(address payable beneficiaryAddress, uint biddingTime)`
Initializes the auction:
- `beneficiaryAddress`: The address that receives the winning bid
- `biddingTime`: Duration of the auction in seconds

---

### ✅ `function Bid() external payable`
Places a bid:
- Reverts if the auction has ended
- Reverts if the bid is lower than the current highest
- Refunds the previous highest bidder
- Updates the highest bidder and amount

---

### ✅ `function withdrawal() external returns (bool)`
Allows outbid users to safely withdraw their refund:
- Uses the **withdrawal pattern** to prevent re-entrancy
- Resets the user's balance before attempting to send Ether

---

### ✅ `function auctionEnd() external`
Ends the auction and sends the highest bid to the beneficiary:
- Reverts if the auction has not yet ended
- Reverts if already called once
- Emits the `AuctionEnded` event

---

## 🛡️ Security Considerations

- **Withdrawal Pattern** is used to handle refunds safely.
- Uses **custom errors** for gas-efficient error handling.
- Protects against **re-entrancy attacks** by resetting balances before transfers.

---

## 📋 Events

| Event                    | Description                                      |
|--------------------------|--------------------------------------------------|
| `HighestBidderIncreased` | Emitted when a new highest bid is placed        |
| `AuctionEnded`           | Emitted when the auction is officially ended    |

---

## 🧠 Requirements

- Solidity version `^0.8.0`
- Compatible with Remix, Hardhat, or Truffle for testing/deployment

---

## 📁 File Structure

