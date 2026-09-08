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

  private constructor() {}

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

