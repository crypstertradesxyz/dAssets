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
    creator: string
  ): LiquidityPool {
    const poolAddress = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const pool: LiquidityPool = {
      poolAddress,
      assetSymbol: symbol,
      assetAmount,
      usdcAmount,
      spotPrice,
      createdAt: Date.now(),
      creator,
      apr: Number((18.5 + Math.random() * 25).toFixed(1)),
      volume24h: 0,
    };

    this.pools.unshift(pool);
    this.notifyPools();
    return pool;
  }
}
