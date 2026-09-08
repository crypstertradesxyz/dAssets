# dAssets — Leveraged Assets on Robinhood Chain

**dAssets** is a decentralized liquidity and minting layer bridging **Bounce.tech’s 200+ HyperEVM-backed leveraged assets** directly to the **Robinhood Chain** ecosystem via **Hyperlane Warp Routes**.

Users can mint tokenized perpetual positions (e.g., `dBTC3L`, `dETH3L`, `dSOL3L`, `dHYPE3L`, `dPEPE3L`), seed Robinhood AMM liquidity pools with NAV-aligned pricing, and track live Oracle NAV feeds with zero personal liquidation risk.

---

## 🌟 Core Features

- **270+ Leveraged Pairs**: Comprehensive catalog of Majors, Layer 1/2s, AI & Compute, DeFi, and Memes with 2x, 3x, 5x, -1x, -2x, and -3x leverage multipliers.
- **Zero Personal Liquidation Risk**: Assets are tokenized receipts backed by Hyperliquid perpetual positions on HyperCore, rebalanced programmatically on HyperEVM.
- **Hyperlane Warp Route Architecture**: Interchain security module (ISM) with validator quorum verifying cross-chain dispatches from HyperEVM to Robinhood Chain in ~1.2s.
- **Instant AMM Liquidity Seeding**: One-click creation of `dAsset / USDC` AMM pools locked to Oracle NAV to prevent arbitrage depegging.
- **Dual Execution Modes**:
  - **Live Web3 Wallet**: Seamlessly connects to Robinhood Wallet, Rabby, MetaMask, or any EVM provider.
  - **Interactive Sandbox Mode**: 1-click test mode preloaded with $50,000 USDC and 14.8 ETH on Robinhood Chain (ID: `13371`).
- **Live Oracle Terminal**: Real-time TradingView-style charts, NAV vs AMM spot price spread tracking, and automated 8-hour rebalance countdown timers.

---

## 🏗️ Architecture

```
[ Bounce.tech / Hyperliquid ] ──(HyperCore Perps)──> [ HyperEVM Vault ]
                                                            │
                                                     (Hyperlane ISM)
                                                            ▼
[ Robinhood Chain (13371) ] ──> [ dAssetFactory.sol ] ──> [ dAssetToken ERC-20 ]
             │
             ├──> [ Robinhood AMM Pool (dAsset / USDC) ]
             └──> [ MockRobinhoodOracle.sol (NAV Feed) ]
```

---

## 📜 Smart Contracts (`/contracts`)

1. `dAssetToken.sol`: ERC-20 token tracking individual leveraged pairs with mint/burn permissions and metadata.
2. `dAssetFactory.sol`: Permissionless deployment factory registering newly bridged assets and tracking AMM pools.
3. `MockRobinhoodOracle.sol`: High-frequency NAV price oracle syncing underlying spot prices and funding rates.
4. `MockHyperlaneBridge.sol`: Mailbox dispatcher simulating Interchain Security Modules and cross-chain message proofs.

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
