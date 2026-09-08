import { BridgeTransaction, LiquidityPool } from '../types';

export class BridgeService {
  private static instance: BridgeService;
  private transactions: BridgeTransaction[] = [];
  private pools: LiquidityPool[] = [];
  private txSubscribers: ((txs: BridgeTransaction[]) => void)[] = [];
  private poolSubscribers: ((pools: LiquidityPool[]) => void)[] = [];

  private constructor() {
    // Seed sample recent bridge activity for rich initial state
    this.transactions = [
      {
        id: 'hl-tx-1094',
        timestamp: Date.now() - 45000,
        sourceChain: 'HyperEVM',
        destChain: 'Robinhood Chain',
        assetSymbol: 'dBTC3L',
        amount: 25.0,
        usdcPaid: 2500,
        recipient: '0x38B...99F2',
        status: 'minted',
        txHash: '0x8f2d1e0b5c7a4e9b6d8f3c2a1e0b5c7a4e9b6d8f3c2a1e0b5c7a4e9b6d8f3c2a',
        hyperlaneMessageId: '0x7e2a...981c',
        ismSecurity: 'Hyperlane Multisig ISM (5/7 Validators Verified)',
      },
      {
        id: 'hl-tx-1093',
        timestamp: Date.now() - 180000,
        sourceChain: 'HyperEVM',
        destChain: 'Robinhood Chain',
        assetSymbol: 'dETH3L',
        amount: 150.0,
        usdcPaid: 15000,
        recipient: '0x71C...89A4',
        status: 'minted',
        txHash: '0x3c2a1e0b5c7a4e9b6d8f3c2a1e0b5c7a4e9b6d8f3c2a1e0b5c7a4e9b6d8f8f2d',
        hyperlaneMessageId: '0x1b4a...44fe',
        ismSecurity: 'Hyperlane Multisig ISM (5/7 Validators Verified)',
      },
      {
        id: 'hl-tx-1092',
        timestamp: Date.now() - 420000,
        sourceChain: 'HyperEVM',
        destChain: 'Robinhood Chain',
        assetSymbol: 'dHYPE3L',
        amount: 500.0,
        usdcPaid: 5000,
        recipient: '0x99A...12C8',
        status: 'minted',
        txHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
        hyperlaneMessageId: '0x43ff...210a',
        ismSecurity: 'Hyperlane Multisig ISM (5/7 Validators Verified)',
      },
    ];
    // Pre-seeded Uniswap v3 AMM Liquidity Pools on Robinhood Chain
    const defaultPools: LiquidityPool[] = [
      {
        poolAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        assetSymbol: 'dBTC3L',
        pairedSymbol: 'USDC',
        assetAmount: 48.5,
        usdcAmount: 4326.2,
        spotPrice: 89.2,
        feeTier: '0.30%',
        createdAt: Date.now() - 86400000 * 2,
        creator: '0x31390C104d777c03B00E95967E3F2905993f947b',
        apr: 32.4,
        volume24h: 312500,
        tvlUsd: 8652.4,
        protocol: 'Uniswap v3',
        txHash: '0x8f2d1e0b5c7a4e9b6d8f3c2a1e0b5c7a4e9b6d8f3c2a1e0b5c7a4e9b6d8f3c2a',
      },
      {
        poolAddress: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
        assetSymbol: 'dETH3L',
        pairedSymbol: 'USDC',
        assetAmount: 320.0,
        usdcAmount: 18560.0,
        spotPrice: 58.0,
        feeTier: '0.30%',
        createdAt: Date.now() - 86400000 * 3,
        creator: '0x0c19e8DE99BA135aBdc059b34e0d3F9E5e021fd0',
        apr: 28.1,
        volume24h: 489200,
        tvlUsd: 37120.0,
        protocol: 'Uniswap v3',
        txHash: '0x3c2a1e0b5c7a4e9b6d8f3c2a1e0b5c7a4e9b6d8f3c2a1e0b5c7a4e9b6d8f8f2d',
      },
      {
        poolAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
        assetSymbol: 'dSOL5L',
        pairedSymbol: 'USDC',
        assetAmount: 640.0,
        usdcAmount: 22400.0,
        spotPrice: 35.0,
        feeTier: '1.00%',
        createdAt: Date.now() - 86400000,
        creator: '0x5164E1dc1Be45a0Fbe4D6A25A4713225E9bb56F6',
        apr: 41.6,
        volume24h: 624100,
        tvlUsd: 44800.0,
        protocol: 'Uniswap v3',
        txHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
      },
      {
        poolAddress: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        assetSymbol: 'dHYPE3L',
        pairedSymbol: 'USDC',
        assetAmount: 1250.0,
        usdcAmount: 12500.0,
        spotPrice: 10.0,
        feeTier: '0.30%',
        createdAt: Date.now() - 43200000,
        creator: '0x71C859132F2388A589A4',
        apr: 36.8,
        volume24h: 198000,
        tvlUsd: 25000.0,
        protocol: 'Uniswap v3',
        txHash: '0x43ff210a5c7a4e9b6d8f3c2a1e0b5c7a4e9b6d8f3c2a1e0b5c7a4e9b6d8f43ff',
      },
      {
        poolAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        assetSymbol: 'dDOGE3L',
        pairedSymbol: 'USDC',
        assetAmount: 45000.0,
        usdcAmount: 9000.0,
        spotPrice: 0.20,
        feeTier: '1.00%',
        createdAt: Date.now() - 21600000,
        creator: '0x99A37281...12C8',
        apr: 47.2,
        volume24h: 142000,
        tvlUsd: 18000.0,
        protocol: 'Uniswap v3',
        txHash: '0x1b4a44fe5c7a4e9b6d8f3c2a1e0b5c7a4e9b6d8f3c2a1e0b5c7a4e9b6d8f1b4a',
      }
    ];

    const saved = localStorage.getItem('dassets_uniswap_pools');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.pools = Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultPools;
      } catch (e) {
        this.pools = defaultPools;
      }
    } else {
      this.pools = defaultPools;
    }
  }

  public static getInstance(): BridgeService {
    if (!BridgeService.instance) {
      BridgeService.instance = new BridgeService();
    }
    return BridgeService.instance;
  }

  public subscribeTransactions(callback: (txs: BridgeTransaction[]) => void) {
    this.txSubscribers.push(callback);
    callback([...this.transactions]);
    return () => {
      this.txSubscribers = this.txSubscribers.filter(sub => sub !== callback);
    };
  }

  public subscribePools(callback: (pools: LiquidityPool[]) => void) {
    this.poolSubscribers.push(callback);
    callback([...this.pools]);
    return () => {
      this.poolSubscribers = this.poolSubscribers.filter(sub => sub !== callback);
    };
  }

  private notifyTx() {
    this.txSubscribers.forEach(cb => cb([...this.transactions]));
  }

  private notifyPools() {
    localStorage.setItem('dassets_uniswap_pools', JSON.stringify(this.pools));
    this.poolSubscribers.forEach(cb => cb([...this.pools]));
  }

  public async executeMintViaHyperlane(
    symbol: string,
    amount: number,
    usdcCost: number,
    recipient: string,
    onStep: (step: 'locking' | 'attesting' | 'minted', tx: BridgeTransaction) => void
  ): Promise<BridgeTransaction> {
    const txId = `hl-tx-${Math.floor(1000 + Math.random() * 9000)}`;
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const messageId = '0x' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('') + '...' + Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const tx: BridgeTransaction = {
      id: txId,
      timestamp: Date.now(),
      sourceChain: 'HyperEVM',
      destChain: 'Robinhood Chain',
      assetSymbol: symbol,
      amount,
      usdcPaid: usdcCost,
      recipient,
      status: 'locking',
      txHash,
      hyperlaneMessageId: messageId,
      ismSecurity: 'Hyperlane Warp Route ISM (Optimistic + 3/5 Validator Quorum)',
    };

    this.transactions.unshift(tx);
    this.notifyTx();
    onStep('locking', tx);

    // Step 1: Locking on HyperEVM
    await new Promise(r => setTimeout(r, 1200));

    // Step 2: Attesting via Hyperlane ISM
    tx.status = 'attesting';
    this.notifyTx();
    onStep('attesting', tx);
    await new Promise(r => setTimeout(r, 1400));

    // Step 3: Minted on Robinhood Chain
    tx.status = 'minted';
    this.notifyTx();
    onStep('minted', tx);

    return tx;
  }

  public seedPool(
    symbol: string,
    assetAmount: number,
    usdcAmount: number,
    spotPrice: number,
    creator: string,
    feeTier: '0.05%' | '0.30%' | '1.00%' = '0.30%',
    pairedSymbol: 'USDC' | 'ETH' = 'USDC'
  ): LiquidityPool {
    const poolAddress = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const tvlUsd = Number((usdcAmount * 2).toFixed(2));
    
    const pool: LiquidityPool = {
      poolAddress,
      assetSymbol: symbol,
      pairedSymbol,
      assetAmount,
      usdcAmount,
      spotPrice,
      feeTier,
      createdAt: Date.now(),
      creator,
      apr: Number((22.5 + Math.random() * 24).toFixed(1)),
      volume24h: Number((tvlUsd * (0.35 + Math.random() * 0.7)).toFixed(2)),
      tvlUsd,
      protocol: 'Uniswap v3',
      txHash,
    };

    this.pools.unshift(pool);
    this.notifyPools();
    return pool;
  }
}
