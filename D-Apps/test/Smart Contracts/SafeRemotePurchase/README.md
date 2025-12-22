# 🛒 Safe Remote Purchase Smart Contract

This smart contract implements a secure escrow mechanism for remote purchases between a buyer and a seller using Ethereum. It ensures **fair payment handling**, where both parties deposit funds, and the seller is only paid when the buyer confirms receipt of the item.

## 🔐 Purpose
The contract guarantees that:
- The **seller is paid** only after the buyer confirms they received the item.
- The **buyer can abort** before confirming the purchase.
- **Deposits** are used to keep both parties committed.

---

## 🧱 Features

- **Escrow-style payment locking**
- Safe transaction flow using `enum State`
- Solidity 0.8+ with custom errors
- Events to track key actions
- Protective modifiers (`onlyBuyer`, `onlySeller`, `instate`)

---

## ⚙️ Contract Flow

1. **Deployment**:
   - Seller deploys the contract and deposits `2 * value`.
2. **Abort (optional)**:
   - Seller can abort before buyer confirms, refunding themselves.
3. **Confirm Purchase**:
   - Buyer confirms by sending `2 * value`, locking the contract.
4. **Confirm Received**:
   - Buyer confirms item received → gets `value` refunded.
5. **Refund Seller**:
   - Seller retrieves `3 * value` (initial deposit + buyer payment).

---

## 🚀 Functions Overview

| Function | Access | Description |
|---------|--------|-------------|
| `abort()` | Only Seller | Aborts transaction, refunds seller |
| `confirmPurchase()` | Any | Buyer confirms purchase and deposits |
| `confirmRecieved()` | Only Buyer | Buyer confirms item received |
| `refundSeller()` | Only Seller | Final step: seller withdraws payment |

---

## 🧪 Tech Stack

- Solidity `^0.8.0`
- Custom errors for gas efficiency
- Event logging
- Enum-based state transitions

---

## 📌 Deployment Notes

- Initial contract must be funded with **an even value** (split in two).
- Buyer must send exactly `2 * value` on confirmation.
- Funds only flow when correct steps are followed.

---

## 📄 License

MIT License
