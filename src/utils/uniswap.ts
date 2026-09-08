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
