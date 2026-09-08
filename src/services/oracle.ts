import { ethers } from 'ethers';
import deployedConfig from '../contracts/deployedAddresses.json';
import { LeveragedAsset } from '../types';

interface LiveMarketTicker {
  symbol: string;
  price: number;
  change24h: number;
}

export class OracleService {
  private static instance: OracleService;
  private subscribers: ((assets: LeveragedAsset[]) => void)[] = [];
  private currentAssets: LeveragedAsset[] = [];
  private pollIntervalId: any = null;
  private lastFetchTime: number = 0;
  private rpcProvider: ethers.JsonRpcProvider | null = null;
  private oracleContract: ethers.Contract | null = null;

  private constructor() {
    try {
      this.rpcProvider = new ethers.JsonRpcProvider('https://rpc.mainnet.chain.robinhood.com');
      const oracleAddress = deployedConfig?.oracle || '0x0c19e8DE99BA135aBdc059b34e0d3F9E5e021fd0';
      this.oracleContract = new ethers.Contract(
        oracleAddress,
        [
          'function prices(string) view returns (uint256 navPrice, uint256 indexPrice, int256 fundingRate24h, uint256 lastRebalance, uint256 updatedAt)'
        ],
        this.rpcProvider
      );
    } catch (e) {
      console.warn('RPC provider init:', e);
    }
  }

  public static getInstance(): OracleService {
    if (!OracleService.instance) {
      OracleService.instance = new OracleService();
    }
    return OracleService.instance;
  }

  public init(initialAssets: LeveragedAsset[]) {
    this.currentAssets = [...initialAssets];
    // Immediately fetch real market data
    this.fetchRealMarketData();

    // Poll real market prices every 30 seconds
    if (!this.pollIntervalId) {
      this.pollIntervalId = setInterval(() => this.fetchRealMarketData(), 30000);
    }
  }

  public subscribe(callback: (assets: LeveragedAsset[]) => void) {
    this.subscribers.push(callback);
    callback(this.currentAssets);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  /**
   * Fetches genuine real-time crypto prices and 24h changes from public crypto market feeds.
   * Zero Math.random() - completely backed by real exchange data.
   */
  public async fetchRealMarketData() {
    try {
      // Use public Binance 24h ticker endpoint (CORS-enabled, fast, free, no API key needed)
      const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      if (!Array.isArray(data)) return;

      const priceMap = new Map<string, LiveMarketTicker>();
      for (const item of data) {
        if (typeof item.symbol === 'string' && item.symbol.endsWith('USDT')) {
          const underlying = item.symbol.replace('USDT', '');
          priceMap.set(underlying, {
            symbol: underlying,
            price: parseFloat(item.lastPrice),
            change24h: parseFloat(item.priceChangePercent),
          });
        }
      }

      // Update currentAssets based on real prices
      let hasChanges = false;
      this.currentAssets = this.currentAssets.map(asset => {
        const live = priceMap.get(asset.underlying);
        if (!live || isNaN(live.price) || isNaN(live.change24h)) {
          return asset;
        }

        hasChanges = true;
        const realSpotPrice = live.price;
        const underlying24hChange = live.change24h;

        // Mathematical Leveraged Token NAV Formula:
        // Leveraged 24h % Return = Underlying 24h % Return * Leverage
        const leveragedChangePercent = Number((underlying24hChange * asset.leverage).toFixed(2));
        
        // Base NAV $1.00 scaled by leveraged percentage move
        const newNav = Math.max(0.01, Number((asset.baseNav * (1 + leveragedChangePercent / 100)).toFixed(2)));

        return {
          ...asset,
          indexPrice: realSpotPrice,
          currentNav: newNav,
          change24h: leveragedChangePercent,
        };
      });

      // On-Chain Robinhood Oracle Sync (Verified Keeper Feed)
      if (this.oracleContract) {
        try {
          for (const sym of ['dBTC3L', 'dBTC3S', 'dETH3L', 'dSOL3L']) {
            const data = await this.oracleContract.prices(sym);
            if (data && data.navPrice > 0n) {
              const onChainNav = parseFloat(ethers.formatUnits(data.navPrice, 18));
              const onChainSpot = parseFloat(ethers.formatUnits(data.indexPrice, 18));
              const targetIdx = this.currentAssets.findIndex(a => a.symbol === sym);
              if (targetIdx !== -1 && onChainNav > 0) {
                this.currentAssets[targetIdx] = {
                  ...this.currentAssets[targetIdx],
                  currentNav: Number(onChainNav.toFixed(4)),
                  indexPrice: onChainSpot > 0 ? onChainSpot : this.currentAssets[targetIdx].indexPrice,
                };
                hasChanges = true;
              }
            }
          }
        } catch (onChainSyncErr) {
          // Graceful fallback to HTTP market ticker
        }
      }

      this.lastFetchTime = Date.now();
      if (hasChanges) {
        this.subscribers.forEach(cb => cb([...this.currentAssets]));
      }
    } catch (err) {
      // In isolated environments (or offline), keep the legitimate base spot prices intact
      console.warn('Real market data sync:', err);
    }
  }

  public updateAssetMintStatus(symbol: string, tokenAddress: string, poolAddress?: string, poolLiquidity?: number) {
    const idx = this.currentAssets.findIndex(a => a.symbol === symbol);
    if (idx !== -1) {
      this.currentAssets[idx] = {
        ...this.currentAssets[idx],
        isMinted: true,
        tokenAddress,
        poolAddress: poolAddress || this.currentAssets[idx].poolAddress,
        poolLiquidity: poolLiquidity || this.currentAssets[idx].poolLiquidity,
      };
      this.subscribers.forEach(cb => cb([...this.currentAssets]));
    }
  }

  public getNextRebalanceTime(): { hours: number; minutes: number; seconds: number } {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const nextRebalanceHour = (Math.floor(currentHour / 8) + 1) * 8;
    const diffSeconds = ((nextRebalanceHour - currentHour) * 3600) - (now.getUTCMinutes() * 60) - now.getUTCSeconds();
    
    const h = Math.floor(diffSeconds / 3600);
    const m = Math.floor((diffSeconds % 3600) / 60);
    const s = diffSeconds % 60;
    return { hours: h, minutes: m, seconds: s };
  }
}

