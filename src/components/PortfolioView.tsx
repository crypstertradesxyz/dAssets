import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  PieChart, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  ExternalLink, 
  Droplets, 
  Zap, 
  Layers, 
  RefreshCw, 
  ShieldCheck, 
  TrendingUp, 
  Copy,
  Plus,
  Coins,
  ArrowDownLeft
} from 'lucide-react';
import { LeveragedAsset, WalletState, AppView, LiquidityPool } from '../types';
import { BridgeService } from '../services/bridge';
import { Web3Service } from '../services/web3';
import { TokenLogo } from './TokenLogo';
import { CopyButton } from './CopyButton';
import { getUniswapSwapUrl, getUniswapSellUrl, getBlockscoutAddressUrl } from '../utils/uniswap';
import { RemoveLiquidityModal } from './RemoveLiquidityModal';

interface PortfolioViewProps {
  assets: LeveragedAsset[];
  wallet: WalletState;
  onOpenWalletModal: () => void;
  onMintAsset: (asset: LeveragedAsset, initialTab?: 'mint' | 'redeem') => void;
  onSeedPool: (asset: LeveragedAsset) => void;
  onNavigate: (view: AppView, asset?: LeveragedAsset) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  assets,
  wallet,
  onOpenWalletModal,
  onMintAsset,
  onSeedPool,
  onNavigate,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'tokens' | 'pools' | 'gas'>('all');
  const [removingPool, setRemovingPool] = useState<LiquidityPool | null>(null);

  // Estimate ETH spot price from available ETH assets (or fallback $2,800)
  const ethSpotPrice = useMemo(() => {
    const ethAsset = assets.find(a => a.underlying.toUpperCase() === 'ETH');
    return ethAsset?.indexPrice || 2800;
  }, [assets]);

  // 1. Calculate active token holdings & dollar valuation
  const holdingsList = useMemo(() => {
    if (!wallet.isConnected || !wallet.holdings) return [];
    return Object.entries(wallet.holdings)
      .filter(([_, qty]) => qty > 0)
      .map(([symbol, qty]) => {
        const asset = assets.find(a => a.symbol === symbol);
        const nav = asset?.currentNav || 1.0;
        const usdValue = qty * nav;
        const change24h = asset?.change24h || 0;
        return {
          symbol,
          qty,
          asset,
          nav,
          usdValue,
          change24h,
        };
      })
      .sort((a, b) => b.usdValue - a.usdValue);
  }, [wallet.holdings, wallet.isConnected, assets]);

  const totalDAssetsUsd = useMemo(() => {
    return holdingsList.reduce((sum, h) => sum + h.usdValue, 0);
  }, [holdingsList]);

  // 2. Calculate Uniswap LP positions created/held by this wallet
  const userLpPools = useMemo(() => {
    if (!wallet.isConnected || !wallet.address) return [];
    const allPools: LiquidityPool[] = BridgeService.getInstance().getPools();
    const userAddr = wallet.address.toLowerCase();
    return allPools.filter((p: LiquidityPool) => Boolean(p.creator && p.creator.toLowerCase() === userAddr));
  }, [wallet.address, wallet.isConnected]);

  const totalLpUsd = useMemo(() => {
    return userLpPools.reduce((sum: number, p: LiquidityPool) => sum + (p.tvlUsd || p.usdcAmount * 2), 0);
  }, [userLpPools]);

  // 3. Network Gas & Cash
  const ethBalanceNum = parseFloat(wallet.balanceEth || '0');
  const ethUsdValue = ethBalanceNum * ethSpotPrice;
  const usdcBalanceNum = parseFloat(wallet.balanceUsdc || '0');
  const totalGasAndCashUsd = ethUsdValue + usdcBalanceNum;

  // 4. Overall Net Worth
  const totalNetWorth = totalDAssetsUsd + totalLpUsd + totalGasAndCashUsd;

  // Percentages for Capital Placement
  const dAssetsPct = totalNetWorth > 0 ? (totalDAssetsUsd / totalNetWorth) * 100 : 0;
  const lpPct = totalNetWorth > 0 ? (totalLpUsd / totalNetWorth) * 100 : 0;
  const gasPct = totalNetWorth > 0 ? (totalGasAndCashUsd / totalNetWorth) * 100 : 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const eth = Web3Service.getInstance().getActiveProvider();
      if (eth && wallet.address) {
        await Web3Service.getInstance().syncAccountState(eth, wallet.address);
      }
    } catch (e) {
      console.warn('Manual portfolio refresh warning:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      
      {/* Header & Wallet Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center space-x-2 text-rh-green text-xs font-mono font-semibold uppercase tracking-wider">
            <PieChart className="w-3.5 h-3.5" />
            <span>Connected Wallet Portfolio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display mt-1">
            Capital Allocation & Holdings
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans leading-relaxed">
            Live on-chain breakdown of your current USD net worth and exact placement across leveraged synthetic positions, Uniswap v3 liquidity pools, and network reserves on Robinhood Chain.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          {wallet.isConnected ? (
            <>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-300 hover:text-white transition active:scale-98"
                title="Refresh balances on-chain"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-rh-green' : ''}`} />
                <span>Sync Balances</span>
              </button>
              <button
                onClick={onOpenWalletModal}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.10] text-xs font-mono text-white transition"
              >
                <Wallet className="w-3.5 h-3.5 text-rh-green" />
                <span>{wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}</span>
              </button>
            </>
          ) : (
            <button
              onClick={onOpenWalletModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-slate-200 text-black font-semibold text-xs transition shadow-sm active:scale-98"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect Wallet</span>
            </button>
          )}
        </div>
      </div>

      {/* Disconnected Notice */}
      {!wallet.isConnected ? (
        <div className="glass-panel rounded-2xl p-10 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-white/[0.06] border border-white/[0.10] flex items-center justify-center mx-auto text-rh-green">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-display">Connect Your Wallet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Connect Rabby, MetaMask, or Robinhood Wallet to view your leveraged holdings, active Uniswap pool positions, and live on-chain balances.
            </p>
          </div>
          <button
            onClick={onOpenWalletModal}
            className="bg-white hover:bg-slate-200 text-black font-semibold py-2.5 px-6 rounded-lg text-xs transition shadow-md"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          {/* Hero Metrics: Total Net Worth & Placement Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Total Net Worth */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-2xl p-5 space-y-2 border-white/[0.10] relative overflow-hidden bg-gradient-to-b from-white/[0.04] to-transparent"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="uppercase tracking-wider font-mono text-[11px] font-semibold">Total Net Worth</span>
                <span className="w-2 h-2 rounded-full bg-rh-green animate-pulse" />
              </div>
              <div className="text-3xl font-bold font-mono text-white tracking-tight">
                ${totalNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400 font-sans flex items-center gap-1.5">
                <span>Verified across 3 asset classes</span>
              </div>
            </motion.div>

            {/* 2. Leveraged dAssets */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass-panel rounded-2xl p-5 space-y-2 border-rh-green/20 bg-rh-green/[0.02]"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="uppercase tracking-wider font-mono text-[11px] font-semibold text-rh-green flex items-center gap-1.5">
                  <Coins className="w-3 h-3" />
                  <span>Leveraged Tokens</span>
                </span>
                <span className="text-xs font-mono font-bold text-white">{dAssetsPct.toFixed(1)}%</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                ${totalDAssetsUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400 font-sans">
                {holdingsList.length} active leveraged token{holdingsList.length === 1 ? '' : 's'}
              </div>
            </motion.div>

            {/* 3. Uniswap Liquidity Pools (LP) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-panel rounded-2xl p-5 space-y-2 border-pink-500/20 bg-pink-500/[0.02]"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="uppercase tracking-wider font-mono text-[11px] font-semibold text-pink-400 flex items-center gap-1.5">
                  <img src="/logos/uni.png" alt="Uniswap" className="w-3 h-3 rounded-full" />
                  <span>Uniswap v3 LP</span>
                </span>
                <span className="text-xs font-mono font-bold text-white">{lpPct.toFixed(1)}%</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                ${totalLpUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400 font-sans">
                {userLpPools.length} seeded pool{userLpPools.length === 1 ? '' : 's'} earning fees
              </div>
            </motion.div>

            {/* 4. Gas & Cash Reserves */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-panel rounded-2xl p-5 space-y-2 border-cyan-500/20 bg-cyan-500/[0.02]"
            >
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="uppercase tracking-wider font-mono text-[11px] font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Zap className="w-3 h-3" />
                  <span>Gas & Cash</span>
                </span>
                <span className="text-xs font-mono font-bold text-white">{gasPct.toFixed(1)}%</span>
              </div>
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                ${totalGasAndCashUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400 font-sans font-mono">
                {wallet.balanceEth} ETH on Chain 4663
              </div>
            </motion.div>
          </div>

          {/* Visual Capital Allocation Progress Bar */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white font-sans">Capital Distribution</span>
              <span className="text-slate-400 font-mono text-[11px]">Where your money is placed</span>
            </div>

            {/* Segmented Bar */}
            <div className="h-3 w-full rounded-full bg-white/[0.06] overflow-hidden flex p-0.5 gap-0.5">
              {dAssetsPct > 0 && (
                <div 
                  className="h-full bg-rh-green rounded-full transition-all duration-500" 
                  style={{ width: `${dAssetsPct}%` }}
                  title={`Leveraged Tokens: ${dAssetsPct.toFixed(1)}%`}
                />
              )}
              {lpPct > 0 && (
                <div 
                  className="h-full bg-pink-500 rounded-full transition-all duration-500" 
                  style={{ width: `${lpPct}%` }}
                  title={`Uniswap v3 LP Pools: ${lpPct.toFixed(1)}%`}
                />
              )}
              {gasPct > 0 && (
                <div 
                  className="h-full bg-cyan-400 rounded-full transition-all duration-500" 
                  style={{ width: `${gasPct}%` }}
                  title={`Network Gas (ETH): ${gasPct.toFixed(1)}%`}
                />
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs pt-1 font-mono">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rh-green" />
                <span className="text-slate-300">dAssets:</span>
                <span className="text-white font-bold">${totalDAssetsUsd.toFixed(2)} ({dAssetsPct.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                <span className="text-slate-300">Uniswap LP:</span>
                <span className="text-white font-bold">${totalLpUsd.toFixed(2)} ({lpPct.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span className="text-slate-300">Gas ETH:</span>
                <span className="text-white font-bold">${totalGasAndCashUsd.toFixed(2)} ({gasPct.toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown Sections */}
          <div className="space-y-6">
            
            {/* Filter Tabs */}
            <div className="flex items-center space-x-1 border-b border-white/[0.08] pb-3 text-xs font-medium">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-md transition ${activeTab === 'all' ? 'bg-white text-black font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                All Positions ({holdingsList.length + userLpPools.length})
              </button>
              <button
                onClick={() => setActiveTab('tokens')}
                className={`px-3 py-1.5 rounded-md transition ${activeTab === 'tokens' ? 'bg-white text-black font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                Leveraged Tokens ({holdingsList.length})
              </button>
              <button
                onClick={() => setActiveTab('pools')}
                className={`px-3 py-1.5 rounded-md transition ${activeTab === 'pools' ? 'bg-white text-black font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                Uniswap Pools ({userLpPools.length})
              </button>
              <button
                onClick={() => setActiveTab('gas')}
                className={`px-3 py-1.5 rounded-md transition ${activeTab === 'gas' ? 'bg-white text-black font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                Network Reserves
              </button>
            </div>

            {/* 1. Leveraged dAsset Holdings Section */}
            {(activeTab === 'all' || activeTab === 'tokens') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-sans flex items-center gap-2">
                    <Coins className="w-3.5 h-3.5 text-rh-green" />
                    <span>Leveraged dAsset Holdings (Wallet ERC20)</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Subtotal: <strong className="text-white">${totalDAssetsUsd.toFixed(2)}</strong>
                  </span>
                </div>

                {holdingsList.length === 0 ? (
                  <div className="glass-panel rounded-xl p-6 text-center text-slate-500 text-xs space-y-2">
                    <p>No synthetic leveraged tokens currently held in your wallet.</p>
                    <button
                      onClick={() => onNavigate('markets')}
                      className="text-rh-green hover:underline text-xs font-semibold"
                    >
                      Browse 270+ markets to mint exposure →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* How to Convert Back to ETH Banner */}
                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-lg bg-rh-green/10 text-rh-green font-mono font-bold text-xs">EXIT</span>
                        <div className="text-slate-300 leading-snug">
                          <span className="text-white font-semibold">How to convert back to regular ETH:</span>
                          <span className="text-slate-400 block sm:inline sm:ml-1">
                            Use <strong className="text-pink-300">Sell for ETH</strong> for instant Uniswap market swaps, or <strong className="text-emerald-300">Redeem</strong> to settle at live Oracle NAV without AMM slippage.
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-white/[0.08]">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#090C10]/90 text-slate-400 font-mono uppercase text-[10px] border-b border-white/[0.06]">
                            <tr>
                              <th className="py-3 px-4">Position Asset</th>
                              <th className="py-3 px-4">Tokens Held</th>
                              <th className="py-3 px-4">Oracle NAV</th>
                              <th className="py-3 px-4">Current Value ($ USD)</th>
                              <th className="py-3 px-4">24h Change</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.04]">
                            {holdingsList.map((h) => (
                              <tr key={h.symbol} className="hover:bg-white/[0.02] transition">
                                
                                {/* Position Asset */}
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center space-x-3">
                                    <TokenLogo 
                                      symbol={h.symbol} 
                                      iconColor={h.asset?.iconColor} 
                                      size="sm" 
                                      rounded="md" 
                                    />
                                    <div>
                                      <div className="font-bold text-white font-mono flex items-center gap-1.5 text-xs">
                                        <span>{h.symbol}</span>
                                        {h.asset && (
                                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                            h.asset.isShort 
                                              ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                              : 'bg-rh-green/10 text-rh-green border border-rh-green/20'
                                          }`}>
                                            {h.asset.isShort ? '▼' : '▲'} {Math.abs(h.asset.leverage)}x
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-slate-400 font-sans">
                                        {h.asset?.name || 'Synthetic Position'}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Balance */}
                                <td className="py-3.5 px-4 font-mono">
                                  <span className="font-bold text-white">{h.qty.toLocaleString()}</span>
                                  <span className="text-slate-500 text-[10px] block font-sans">tokens in wallet</span>
                                </td>

                                {/* Oracle NAV */}
                                <td className="py-3.5 px-4 font-mono">
                                  <span className="text-slate-300 font-semibold">${h.nav.toFixed(2)}</span>
                                  <span className="text-[10px] text-slate-500 block font-sans">1 {h.symbol}</span>
                                </td>

                                {/* Current Value */}
                                <td className="py-3.5 px-4 font-mono">
                                  <div className="text-white font-bold text-sm">
                                    ${h.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-sans">
                                    {totalNetWorth > 0 ? ((h.usdValue / totalNetWorth) * 100).toFixed(1) : 0}% of portfolio
                                  </span>
                                </td>

                                {/* 24h Change */}
                                <td className="py-3.5 px-4 font-mono">
                                  <span className={`font-semibold flex items-center gap-0.5 ${h.change24h >= 0 ? 'text-rh-green' : 'text-red-400'}`}>
                                    {h.change24h >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                    <span>{h.change24h >= 0 ? '+' : ''}{h.change24h.toFixed(2)}%</span>
                                  </span>
                                </td>

                                {/* Actions */}
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5 font-sans">
                                    {/* Direct Uniswap Sell for ETH Link */}
                                    {(h.asset?.tokenAddress || h.asset?.poolAddress) && (
                                      <a
                                        href={getUniswapSellUrl(h.asset?.tokenAddress)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 hover:text-pink-200 border border-pink-500/30 px-2.5 py-1.5 rounded text-xs font-semibold transition inline-flex items-center gap-1 cursor-pointer shadow-sm"
                                        title={`Sell ${h.symbol} for regular ETH on Uniswap`}
                                      >
                                        <img src="/logos/uni.png" alt="Uniswap" className="w-3 h-3 rounded-full" />
                                        <span>Sell for ETH</span>
                                        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                      </a>
                                    )}

                                    {/* In-App Oracle NAV Redeem Button */}
                                    {h.asset && (
                                      <button
                                        onClick={() => onMintAsset(h.asset!, 'redeem')}
                                        className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-2.5 py-1.5 rounded text-xs font-semibold transition inline-flex items-center gap-1 cursor-pointer"
                                        title={`Redeem ${h.symbol} at live Oracle NAV without AMM slippage`}
                                      >
                                        <ArrowDownLeft className="w-3 h-3" />
                                        <span>Redeem</span>
                                      </button>
                                    )}

                                    {/* Seed Pool */}
                                    {h.asset && (
                                      <button
                                        onClick={() => onSeedPool(h.asset!)}
                                        className="bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 px-2 py-1.5 rounded text-xs font-semibold transition flex items-center gap-1"
                                        title="Seed Uniswap Pool"
                                      >
                                        <Droplets className="w-3 h-3 text-rh-green" />
                                        <span>LP</span>
                                      </button>
                                    )}

                                    {/* Terminal / Trade */}
                                    {h.asset && (
                                      <button
                                        onClick={() => onNavigate('terminal', h.asset)}
                                        className="bg-white hover:bg-slate-200 text-black px-2.5 py-1.5 rounded text-xs font-semibold transition"
                                      >
                                        Manage
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Uniswap Liquidity Positions (LP) Section */}
            {(activeTab === 'all' || activeTab === 'pools') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-sans flex items-center gap-2">
                    <img src="/logos/uni.png" alt="Uniswap" className="w-3.5 h-3.5 rounded-full" />
                    <span>Uniswap v3 Liquidity Positions (LP)</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Subtotal: <strong className="text-white">${totalLpUsd.toFixed(2)}</strong>
                  </span>
                </div>

                {userLpPools.length === 0 ? (
                  <div className="glass-panel rounded-xl p-6 text-center text-slate-500 text-xs space-y-2">
                    <p>No active Uniswap pools seeded by this wallet yet.</p>
                    <button
                      onClick={() => onNavigate('pools')}
                      className="text-pink-400 hover:underline text-xs font-semibold"
                    >
                      Deploy a pool or provide liquidity →
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userLpPools.map((pool: LiquidityPool) => {
                      const poolUsd = pool.tvlUsd || pool.usdcAmount * 2;
                      const asset = assets.find(a => a.symbol === pool.assetSymbol);
                      return (
                        <div 
                          key={pool.poolAddress}
                          className="glass-panel rounded-2xl p-5 space-y-4 border border-pink-500/20 bg-gradient-to-b from-pink-500/[0.03] to-transparent relative overflow-hidden"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2.5">
                              <TokenLogo symbol={pool.assetSymbol} size="sm" rounded="md" />
                              <div>
                                <div className="font-bold text-white text-sm font-mono flex items-center gap-1.5">
                                  <span>{pool.assetSymbol}</span>
                                  <span className="text-slate-500">/</span>
                                  <span className="text-slate-300">{pool.pairedSymbol || 'USDC'}</span>
                                </div>
                                <a
                                  href={getBlockscoutAddressUrl(pool.poolAddress)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-rh-green hover:underline font-sans flex items-center gap-1"
                                  title="View on Robinhood Blockscout Explorer"
                                >
                                  <span>Pool on Blockscout • {pool.feeTier || '0.30%'}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] uppercase text-slate-500 font-mono block">Your LP Value</span>
                              <span className="text-lg font-bold text-white font-mono">${poolUsd.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 bg-black/40 border border-white/[0.04] p-2.5 rounded-lg text-xs font-mono">
                            <div>
                              <span className="text-[10px] text-slate-500 block font-sans">Seeded Collateral</span>
                              <span className="font-semibold text-white">
                                {pool.assetAmount} {pool.assetSymbol}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block font-sans">Paired Capital</span>
                              <span className="font-semibold text-slate-200">
                                ${pool.usdcAmount.toFixed(2)} {pool.pairedSymbol || 'USDC'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                              <span>{pool.poolAddress.slice(0, 6)}...{pool.poolAddress.slice(-4)}</span>
                              <CopyButton text={pool.poolAddress} label="" />
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Remove Liquidity Button */}
                              <button
                                onClick={() => setRemovingPool(pool)}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/25 px-2.5 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                                title="Withdraw or Remove Liquidity"
                              >
                                <ArrowDownRight className="w-3.5 h-3.5" />
                                <span>Remove LP</span>
                              </button>

                              {/* Direct Uniswap Trade on Robinhood Chain */}
                              <a
                                href={getUniswapSwapUrl(asset?.tokenAddress)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-pink-500 hover:bg-pink-400 text-white font-semibold px-3 py-1.5 rounded-md text-xs transition flex items-center gap-1.5 shadow-sm"
                                title="Trade Pair on Uniswap"
                              >
                                <img src="/logos/uni.png" alt="Uniswap" className="w-3.5 h-3.5 rounded-full bg-white p-0.5" />
                                <span>Trade ↗</span>
                              </a>

                              <a
                                href={getBlockscoutAddressUrl(pool.poolAddress)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-white/[0.04] hover:bg-white/[0.08] rounded-md text-slate-400 hover:text-white transition"
                                title="Blockscout Verified Contract"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3. Network Gas & Reserves Section */}
            {(activeTab === 'all' || activeTab === 'gas') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-sans flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Robinhood Chain Network Gas & Reserves</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Subtotal: <strong className="text-white">${totalGasAndCashUsd.toFixed(2)}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  
                  {/* Robinhood ETH */}
                  <div className="glass-panel rounded-2xl p-5 space-y-3 border-cyan-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xs">
                          ETH
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">Robinhood ETH</div>
                          <span className="text-[10px] text-slate-400 font-sans">L2 Transaction Gas</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-white">${ethUsdValue.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-500 block font-sans">@ ${ethSpotPrice.toFixed(0)}/ETH</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-slate-400">
                      <span>Available Balance:</span>
                      <span className="text-white font-bold">{wallet.balanceEth} ETH</span>
                    </div>
                  </div>

                  {/* Cash USDC */}
                  <div className="glass-panel rounded-2xl p-5 space-y-3 border-white/[0.08]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                          $
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">USDC Stablecoin</div>
                          <span className="text-[10px] text-slate-400 font-sans">Settlement & Seeding Capital</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-white">${usdcBalanceNum.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-500 block font-sans">Cash Reserve</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-slate-400">
                      <span>Available Balance:</span>
                      <span className="text-white font-bold">${wallet.balanceUsdc} USDC</span>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        </>
      )}

      {removingPool && (
        <RemoveLiquidityModal
          pool={removingPool}
          wallet={wallet}
          onClose={() => setRemovingPool(null)}
        />
      )}

    </div>
  );
};
