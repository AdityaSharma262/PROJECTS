# Threat Marketplace Smart Contract

A decentralized marketplace built on Ethereum for securely buying and selling **cyber threat intelligence reports** using blockchain technology.  
This contract enables individuals or organizations to submit, list, and purchase threat reports in a **trustless** and **transparent** manner.

---

## 📜 Features

- **Submit Threat Reports**  
  Sellers can submit threat reports with a title, IPFS hash, and price.

- **Buy Threat Reports**  
  Buyers can purchase reports securely using ETH.

- **Escrow-like Payment Flow**  
  Payment is instantly transferred to the seller after a successful purchase.

- **Retrieve Reports**  
  - View all unsold reports.  
  - View reports submitted by the current user.  
  - View purchased reports.  
  - Fetch report details by ID.

---

## 🛠 Technology Stack

- **Language:** Solidity `^0.8.20`
- **Blockchain:** Ethereum
- **Storage for Reports:** IPFS (InterPlanetary File System)  
- **License:** MIT

---

## 📂 Contract Structure

### Structs
- **ThreatReport** — Stores report details including seller, title, IPFS hash, price, and sale status.

### Mappings
- `threatReports` — Stores all reports by ID.
- `buyers` — Stores the buyer address for each report.

### Key Functions
| Function | Description |
|----------|-------------|
| `SubmitReport(string _Title, string _hash, uint256 _price)` | Submit a new threat report for sale. |
| `BuyReport(uint256 _id)` | Purchase a specific report by ID. |
| `getUnsoldReports()` | Retrieve all available (unsold) reports. |
| `getMyReports()` | Retrieve reports submitted by the current wallet. |
| `getPurchasedReports()` | Retrieve reports purchased by the current wallet. |
| `getReportByID(uint256 id)` | Fetch a single report by ID. |

---

## 🚀 Deployment & Testing

1. **Clone Repository**
    ```bash
    git clone https://github.com/your-username/threat-marketplace.git
    cd threat-marketplace
    ```

2. **Open in Remix**
    - Copy the contract into a `.sol` file.
    - Compile with Solidity `^0.8.20`.
    - Deploy to a local network (Ganache) or testnet (Goerli, Sepolia).

3. **Set up IPFS**
    - Upload your threat report files to IPFS.
    - Use the IPFS hash in `SubmitReport`.

4. **Interaction**
    - Use MetaMask or Web3.js/Ethers.js to interact with the deployed contract.

---

## ⚖ License
This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 📧 Author
**Aditya Sharma**  
Blockchain Developer | Smart Contract Engineer  
