import { ethers } from 'ethers';

const ROBINHOOD_PUBLIC_RPC = 'https://rpc.mainnet.chain.robinhood.com';

/**
 * Fast transaction receipt polling that queries the direct Robinhood Chain public RPC
 * in addition to the browser wallet provider to avoid provider caching delays or stalled filter subscriptions.
 */
export async function waitForReceiptFast(
  txHash: string,
  browserProvider?: ethers.BrowserProvider | null,
  timeoutMs: number = 60000,
  pollIntervalMs: number = 1200
): Promise<ethers.TransactionReceipt | null> {
  const publicRpc = new ethers.JsonRpcProvider(ROBINHOOD_PUBLIC_RPC);
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    // 1. Direct high-speed check via public node
    try {
      const receipt = await publicRpc.getTransactionReceipt(txHash);
      if (receipt && receipt.blockNumber) {
        return receipt;
      }
    } catch {
      // transient RPC error, continue loop
    }

    // 2. Check browser provider if available
    if (browserProvider) {
      try {
        const receipt = await browserProvider.getTransactionReceipt(txHash);
        if (receipt && receipt.blockNumber) {
          return receipt;
        }
      } catch {
        // ignore
      }
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  // Final check attempt
  try {
    return await publicRpc.getTransactionReceipt(txHash);
  } catch {
    return null;
  }
}
