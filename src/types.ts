export type AssetCategory = 'all' | 'majors' | 'layer1' | 'defi' | 'ai' | 'meme';

export interface LeveragedAsset {
  id: string;
  symbol: string;             // e.g. dBTC3L
  name: string;               // e.g. Bitcoin 3x Long
  underlying: string;         // e.g. BTC
  underlyingName: string;     // e.g. Bitcoin
  leverage: number;           // 2, 3, 5, -1, -2, -3
  isShort: boolean;
  category: AssetCategory;
  baseNav: number;            // Baseline NAV USD
  currentNav: number;         // Live simulated NAV
  indexPrice: number;         // Underlying spot price
  change24h: number;          // % change
  volume24h: number;          // Volume in USD
  fundingRate: number;        // Funding rate %
  openInterest: number;       // Open interest in USD
  isMinted: boolean;          // Has this been deployed/minted on Robinhood chain?
  tokenAddress?: string;      // Contract on Robinhood chain
  poolAddress?: string;       // Active AMM pool address
  poolLiquidity?: number;     // USD liquidity in pool
  hyperevmAddress: string;    // Source contract on Bounce.tech / HyperEVM
  iconColor: string;
}

export interface BridgeTransaction {
  id: string;
  timestamp: number;
  sourceChain: 'HyperEVM';
  destChain: 'Robinhood Chain';
  assetSymbol: string;
  amount: number;
  usdcPaid: number;
  recipient: string;
  status: 'locking' | 'attesting' | 'minted';
  txHash: string;
  hyperlaneMessageId: string;
  ismSecurity: string;
}

export interface LiquidityPool {
  poolAddress: string;
  assetSymbol: string;
  assetAmount: number;
  usdcAmount: number;
  spotPrice: number;
  createdAt: number;
  creator: string;
  apr: number;
  volume24h: number;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number;
  networkName: string;
  balanceEth: string;
  balanceUsdc: string;
  isDemo: boolean;
}
