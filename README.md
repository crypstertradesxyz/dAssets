# dAssets — Leveraged Assets on Robinhood Chain

**dAssets** is a decentralized liquidity and minting layer bridging **Bounce.tech’s 200+ HyperEVM-backed leveraged assets** directly to the **Robinhood Chain Mainnet (Chain ID: 4663)** via **Hyperlane Warp Routes**.

Users can mint tokenized perpetual positions (e.g., `dBTC3L`, `dETH3L`, `dSOL3L`, `dHYPE3L`, `dPEPE3L`), seed Robinhood AMM liquidity pools with NAV-aligned pricing, and track live Oracle NAV feeds with zero personal liquidation risk.

---

## 🌟 Core Features

- **270+ Leveraged Pairs**: Comprehensive catalog of Majors, Layer 1/2s, AI & Compute, DeFi, and Memes with 2x, 3x, 5x, -1x, -2x, and -3x leverage multipliers.
- **Zero Personal Liquidation Risk**: Assets are tokenized receipts backed by Hyperliquid perpetual positions on HyperCore, rebalanced programmatically on HyperEVM.
- **Hyperlane Warp Route Architecture**: Canonical cross-chain messaging connecting HyperEVM Mailbox (`0x3a464f746D23Ab22155710f44dB16dcA53e0775E`, Domain 999) to Robinhood Chain Mailbox (`0x3a867fCfFeC2B790970eeBDC9023E75B0a172aa7`, Domain 4663).
- **Instant AMM Liquidity Seeding**: One-click creation of `dAsset / USDC` AMM pools locked to Oracle NAV to prevent arbitrage depegging.
- **Dual Execution Modes**:
  - **Live Web3 Wallet**: Seamlessly connects to Robinhood Wallet, Rabby, MetaMask on Robinhood Chain Mainnet (4663).
  - **Quick Start Preview**: 1-click test mode preloaded with test funds to explore without friction.
- **Live Oracle Terminal**: Real-time TradingView-style charts, NAV vs AMM spot price spread tracking, and automated 8-hour rebalance countdown timers.

---

## 🏗️ Architecture

```
[ Bounce.tech / Hyperliquid ] ──(HyperCore Perps)──> [ HyperEVM Vault (999) ]
                                                            │
                                                     (Hyperlane ISM)
                                                            ▼
[ Robinhood Chain (4663) ] ───> [ dAssetFactory.sol ] ───> [ dAssetToken ERC-20 ]
             │
             ├──> [ Robinhood AMM Pool (dAsset / USDC) ]
             └──> [ MockRobinhoodOracle.sol (NAV Feed) ]
```

---

## 📜 Verified Live Deployments on Robinhood Chain Mainnet

| Contract | Address | Explorer Link |
| :--- | :--- | :--- |
| **`dAssetFactory`** | `0x31390C104d777c03B00E95967E3F2905993f947b` | [View on Blockscout](https://robinhoodchain.blockscout.com/address/0x31390C104d777c03B00E95967E3F2905993f947b) |
| **Flagship Token (`dBTC3L`)** | `0x5164E1dc1Be45a0Fbe4D6A25A4713225E9bb56F6` | [View on Blockscout](https://robinhoodchain.blockscout.com/address/0x5164E1dc1Be45a0Fbe4D6A25A4713225E9bb56F6) |
| **`MockRobinhoodOracle`** | `0x0c19e8DE99BA135aBdc059b34e0d3F9E5e021fd0` | [View on Blockscout](https://robinhoodchain.blockscout.com/address/0x0c19e8DE99BA135aBdc059b34e0d3F9E5e021fd0) |
| **Official Hyperlane Mailbox** | `0x3a867fCfFeC2B790970eeBDC9023E75B0a172aa7` | [Domain 4663](https://robinhoodchain.blockscout.com/address/0x3a867fCfFeC2B790970eeBDC9023E75B0a172aa7) |

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Build for Production
```bash
npm run build
```
Outputs optimized static assets to `dist/`.

---

## 🌐 Live Production Deployment

The dAssets platform is live on Vercel:
👉 **[https://dassets.vercel.app](https://dassets.vercel.app)**
