/**
 * Centralized URL generators for Uniswap on Robinhood Chain (Chain ID: 4663, Slug: 'robinhood').
 */

/**
 * Direct link to Uniswap Swap interface with Robinhood Chain and target token preselected.
 * This avoids Explore Subgraph indexing errors and allows immediate trading.
 */
export function getUniswapSwapUrl(tokenAddress?: string): string {
  if (!tokenAddress || !tokenAddress.startsWith('0x')) {
    return 'https://app.uniswap.org/swap?chain=robinhood';
  }
  return `https://app.uniswap.org/swap?chain=robinhood&inputCurrency=ETH&outputCurrency=${tokenAddress}`;
}

/**
 * Direct link to Uniswap Swap interface configured to sell the leveraged token back for ETH.
 * inputCurrency: tokenAddress (your leveraged token)
 * outputCurrency: ETH (native Robinhood Chain ETH)
 */
export function getUniswapSellUrl(tokenAddress?: string): string {
  if (!tokenAddress || !tokenAddress.startsWith('0x')) {
    return 'https://app.uniswap.org/swap?chain=robinhood&outputCurrency=ETH';
  }
  return `https://app.uniswap.org/swap?chain=robinhood&inputCurrency=${tokenAddress}&outputCurrency=ETH`;
}

/**
 * Direct link to Uniswap Add Liquidity interface for Robinhood Chain.
 */
export function getUniswapAddLiquidityUrl(tokenAddress?: string): string {
  if (!tokenAddress || !tokenAddress.startsWith('0x')) {
    return 'https://app.uniswap.org/pool?chain=robinhood';
  }
  return `https://app.uniswap.org/add/ETH/${tokenAddress}?chain=robinhood`;
}

/**
 * Direct link to Robinhood Chain Blockscout for on-chain pool / token contract verification.
 */
export function getBlockscoutAddressUrl(address: string): string {
  return `https://robinhoodchain.blockscout.com/address/${address}`;
}

/**
 * Direct link to Robinhood Chain Blockscout transaction.
 */
export function getBlockscoutTxUrl(txHash: string): string {
  return `https://robinhoodchain.blockscout.com/tx/${txHash}`;
}

/**
 * Check whether an asset has an active, legitimate Uniswap pool deployed on Robinhood Chain.
 * If true, the token is live for trading on Uniswap.
 * If false, swapping on Uniswap will fail with "Insufficient liquidity" and user should Mint via Protocol first.
 */
export function hasActivePool(asset?: { symbol?: string; poolAddress?: string } | null): boolean {
  if (!asset) return false;

  // 1. Direct poolAddress property check on asset
  if (asset.poolAddress && typeof asset.poolAddress === 'string') {
    const addr = asset.poolAddress.trim().toLowerCase();
    if (
      addr.startsWith('0x') &&
      addr.length === 42 &&
      addr !== '0x0000000000000000000000000000000000000000' &&
      !addr.startsWith('0x7a250d5630') &&
      !addr.startsWith('0x3fc91a3a')
    ) {
      return true;
    }
  }

  // 2. Check localStorage pools if in browser environment
  if (typeof window !== 'undefined' && window.localStorage && asset.symbol) {
    try {
      const savedPools = JSON.parse(localStorage.getItem('dassets_uniswap_pools') || '[]');
      if (Array.isArray(savedPools)) {
        const found = savedPools.find(
          (p: any) =>
            p.assetSymbol?.toUpperCase() === asset.symbol?.toUpperCase() &&
            p.poolAddress &&
            typeof p.poolAddress === 'string' &&
            p.poolAddress.startsWith('0x') &&
            p.poolAddress.length === 42 &&
            !p.poolAddress.startsWith('0x7a250d5630') &&
            !p.poolAddress.startsWith('0x3fc91a3a')
        );
        if (found) return true;
      }

      const deployed = JSON.parse(localStorage.getItem('dassets_deployed_tokens') || '{}');
      if (deployed[asset.symbol]?.poolAddress) {
        const poolAddr = String(deployed[asset.symbol].poolAddress).toLowerCase();
        if (
          poolAddr.startsWith('0x') &&
          poolAddr.length === 42 &&
          poolAddr !== '0x0000000000000000000000000000000000000000' &&
          !poolAddr.startsWith('0x7a250d5630') &&
          !poolAddr.startsWith('0x3fc91a3a')
        ) {
          return true;
        }
      }
    } catch (e) {
      // LocalStorage read error fallback
    }
  }

  return false;
}
