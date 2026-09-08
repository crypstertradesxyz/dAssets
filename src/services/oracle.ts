import { LeveragedAsset } from '../types';

export class OracleService {
  private static instance: OracleService;
  private subscribers: ((assets: LeveragedAsset[]) => void)[] = [];
  private currentAssets: LeveragedAsset[] = [];
  private intervalId: any = null;

  private constructor() {}

  public static getInstance(): OracleService {
    if (!OracleService.instance) {
      OracleService.instance = new OracleService();
    }
    return OracleService.instance;
  }

  public init(initialAssets: LeveragedAsset[]) {
    this.currentAssets = [...initialAssets];
    if (!this.intervalId) {
      this.intervalId = setInterval(() => this.tick(), 2500);
    }
  }

  public subscribe(callback: (assets: LeveragedAsset[]) => void) {
    this.subscribers.push(callback);
    callback(this.currentAssets);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private tick() {
    // Pick 3-6 random assets to simulate live price fluctuations
    const updatedCount = Math.floor(Math.random() * 4) + 3;
    for (let i = 0; i < updatedCount; i++) {
      const idx = Math.floor(Math.random() * this.currentAssets.length);
      const asset = this.currentAssets[idx];

      // Jitter underlying index by -0.15% to +0.15%
      const jitter = (Math.random() - 0.49) * 0.003;
      const newIndexPrice = Number((asset.indexPrice * (1 + jitter)).toFixed(4));
      
      // Calculate leveraged NAV movement
      const effectiveReturn = jitter * asset.leverage;
      const newNav = Number((asset.currentNav * (1 + effectiveReturn)).toFixed(2));
      const newChange24h = Number((asset.change24h + effectiveReturn * 20).toFixed(2));

      this.currentAssets[idx] = {
        ...asset,
        indexPrice: newIndexPrice,
        currentNav: Math.max(0.01, newNav),
        change24h: newChange24h,
      };
    }

    this.subscribers.forEach(cb => cb([...this.currentAssets]));
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
