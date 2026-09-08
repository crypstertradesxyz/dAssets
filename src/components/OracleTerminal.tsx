import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Droplets, 
  Clock, 
  ExternalLink,
  Activity
} from 'lucide-react';
import { LeveragedAsset, WalletState } from '../types';
import { OracleService } from '../services/oracle';
import { CopyButton } from './CopyButton';
import { KeeperTerminal } from './KeeperTerminal';
import { TokenLogo } from './TokenLogo';
import { getUniswapSwapUrl } from '../utils/uniswap';

interface OracleTerminalProps {
  asset: LeveragedAsset;
  wallet: WalletState;
  onMintAsset: (asset: LeveragedAsset) => void;
  onSeedPool: (asset: LeveragedAsset) => void;
  allAssets: LeveragedAsset[];
  onSelectAsset: (asset: LeveragedAsset) => void;
}

export const OracleTerminal: React.FC<OracleTerminalProps> = ({
  asset,
  wallet,
  onMintAsset,
  onSeedPool,
  allAssets,
  onSelectAsset,
}) => {
  const [timeframe, setTimeframe] = useState<'1H' | '24H' | '7D'>('24H');
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(OracleService.getInstance().getNextRebalanceTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Deterministic chart trajectory based on current NAV and 24h change
  const chartPoints = useMemo(() => {
    const count = timeframe === '1H' ? 24 : timeframe === '24H' ? 48 : 70;
    const points: number[] = [];
    const changeFactor = asset.change24h / 100;
    const startNav = asset.currentNav / (1 + changeFactor * (timeframe === '1H' ? 0.2 : 1.0));
    
    for (let i = 0; i < count; i++) {
      const progress = i / (count - 1);
      // Smooth easing trajectory
      const val = startNav + (asset.currentNav - startNav) * progress;
      points.push(Math.max(0.01, Number(val.toFixed(4))));
    }
    return points;
  }, [asset.id, asset.currentNav, asset.change24h, timeframe]);

  const minVal = Math.min(...chartPoints) * 0.99;
  const maxVal = Math.max(...chartPoints) * 1.01;
  const range = maxVal - minVal || 1;

  const svgPoints = chartPoints
    .map((val, idx) => {
      const x = (idx / (chartPoints.length - 1)) * 600;
      const y = 220 - ((val - minVal) / range) * 200;
      return `${x},${y}`;
    })
    .join(' ');

  const isPositive = asset.change24h >= 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-slate-100 selection:bg-rh-green selection:text-black"
    >
      
      {/* Top Banner: Asset Summary */}
      <div className="glass-panel rounded-2xl p-6 shadow-2xl space-y-4 glow-border-green">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-rh-green animate-pulse"></span>
          <span>Live Oracle NAV Feeds • Robinhood Chain (4663)</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="flex items-center space-x-4">
            <TokenLogo 
              underlying={asset.underlying} 
              iconColor={asset.iconColor} 
              size="xl" 
              rounded="xl" 
            />

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">{asset.symbol}</h1>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  asset.isShort 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                    : 'bg-rh-green/10 text-rh-green border border-rh-green/20'
                }`}>
                  {Math.abs(asset.leverage)}x {asset.isShort ? 'Short' : 'Long'}
                </span>
                <span className="text-xs text-slate-400 font-sans">
                  {asset.name}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5 font-mono">
                <span>Spot: <strong className="text-slate-200">${asset.indexPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                <span>•</span>
                <span>Source: <strong className="text-slate-300">Bounce Perpetual Vaults</strong></span>
                <span>•</span>
                <span>Target: <strong className="text-rh-green">Robinhood Chain (4663)</strong></span>
              </div>

              {/* Sibling Leverage / Direction Multiplier Switcher */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-white/[0.06]">
                <span className="text-[10px] text-slate-500 font-mono uppercase">Exposure:</span>
                {allAssets
                  .filter(a => a.underlying === asset.underlying)
                  .sort((a, b) => {
                    if (a.isShort !== b.isShort) return a.isShort ? 1 : -1;
                    return a.leverage - b.leverage;
                  })
                  .map(tok => {
                    const isCurrent = tok.symbol === asset.symbol;
                    return (
                      <button
                        key={tok.symbol}
                        onClick={() => onSelectAsset(tok)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition flex items-center gap-1 ${
                          isCurrent
                            ? tok.isShort
                              ? 'bg-red-500 text-white shadow-sm'
                              : 'bg-rh-green text-black shadow-sm'
                            : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.12] border border-white/[0.06]'
                        }`}
                      >
                        <span>{tok.isShort ? `▼ ${Math.abs(tok.leverage)}S` : `▲ ${tok.leverage}L`}</span>
                        {tok.tokenAddress && (
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" title="Deployed on-chain"></span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 border-t lg:border-t-0 lg:border-l border-white/[0.06] pt-4 lg:pt-0 lg:pl-6 font-mono">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-sans font-medium">Oracle NAV Price</div>
              <div className="text-2xl font-bold text-white flex items-center gap-2 mt-0.5">
                <span>${asset.currentNav.toFixed(2)}</span>
                <span className={`text-xs ${isPositive ? 'text-rh-green' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}{asset.change24h}%
                </span>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-sans font-medium">AMM Pool Status</div>
              <div className="text-base font-bold text-slate-300 mt-0.5">
                {asset.poolAddress ? 'Active Pool' : 'Unseeded AMM'}
              </div>
              <div className="text-[10px] text-slate-500">
                {asset.poolAddress ? 'Trading Live' : 'Mint via Factory'}
              </div>
            </div>

            <div className="flex items-center gap-2 font-sans">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onMintAsset(asset)}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-200 text-black font-semibold px-4 py-2.5 rounded-md text-xs transition shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Mint {asset.symbol}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSeedPool(asset)}
                className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 px-3.5 py-2.5 rounded-md text-xs font-medium transition"
              >
                <Droplets className="w-3.5 h-3.5 text-rh-green" />
                <span>Seed Pool</span>
              </motion.button>

              {(asset.tokenAddress || asset.poolAddress) && (
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={getUniswapSwapUrl(asset.tokenAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 hover:text-pink-300 border border-pink-500/25 px-3.5 py-2.5 rounded-md text-xs font-medium transition cursor-pointer"
                  title="Trade on Uniswap (Robinhood Chain)"
                >
                  <img src="/logos/uni.png" alt="Uniswap" className="w-3.5 h-3.5 rounded-full" />
                  <span>Trade on Uniswap</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </motion.a>
              )}
            </div>
          </div>


        </div>
      </div>

      {/* Main Grid: Chart + Backing Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Column */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 space-y-4 shadow-2xl">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Activity className="w-3.5 h-3.5 text-rh-green" />
              <span>Live NAV Price Feed</span>
            </div>

            <div className="flex items-center space-x-1 bg-[#0E1218]/90 p-1 rounded-lg border border-white/[0.08] text-xs font-mono">
              {(['1H', '24H', '7D'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 rounded text-xs transition ${
                    timeframe === tf
                      ? 'bg-white text-black font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Chart */}
          <div className="relative w-full h-64 bg-black/40 rounded-xl border border-white/[0.06] p-2 overflow-hidden">
            <svg
              viewBox="0 0 600 240"
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositive ? '#00C805' : '#EF4444'} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={isPositive ? '#00C805' : '#EF4444'} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <polygon
                points={`0,240 ${svgPoints} 600,240`}
                fill="url(#chartGradient)"
              />

              <polyline
                fill="none"
                stroke={isPositive ? '#00C805' : '#EF4444'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={svgPoints}
              />
            </svg>

            <div className="absolute right-3 top-3 text-[10px] font-mono text-slate-500">
              High: ${maxVal.toFixed(2)}
            </div>
            <div className="absolute right-3 bottom-3 text-[10px] font-mono text-slate-500">
              Low: ${minVal.toFixed(2)}
            </div>
          </div>

          {/* Market Stats Bar */}
          <div className="grid grid-cols-3 gap-3 text-xs font-mono text-center pt-2">
            <div className="bg-black/40 p-2.5 rounded-xl border border-white/[0.06]">
              <span className="text-slate-500 block text-[10px]">Underlying Benchmark</span>
              <span className="text-slate-200 font-bold">{asset.underlying} (${asset.indexPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
            </div>
            <div className="bg-black/40 p-2.5 rounded-xl border border-white/[0.06]">
              <span className="text-slate-500 block text-[10px]">Leverage Multiplier</span>
              <span className="text-rh-green font-bold">{Math.abs(asset.leverage)}x {asset.isShort ? 'Inverse Short' : 'Constant Long'}</span>
            </div>
            <div className="bg-black/40 p-2.5 rounded-xl border border-white/[0.06]">
              <span className="text-slate-500 block text-[10px]">Robinhood Chain State</span>
              <span className={`font-bold ${asset.tokenAddress ? 'text-rh-green' : 'text-slate-400'}`}>
                {asset.tokenAddress ? 'Deployed On-Chain' : 'Ready to Deploy'}
              </span>
            </div>
          </div>

        </div>

        {/* Engine Specs Column */}
        <div className="glass-panel rounded-2xl p-6 space-y-5 shadow-2xl">
          
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h3 className="font-bold text-sm text-white font-display">Bounce Rebalance Engine</h3>
            <span className="text-[10px] font-mono text-rh-green bg-rh-green/10 border border-rh-green/20 px-1.5 py-0.5 rounded">
              Active
            </span>
          </div>

          {/* Rebalance Timer */}
          <div className="carbon-inlay rounded-xl p-4 text-center space-y-1">
            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Next Automated Rebalance:</span>
            </div>
            <div className="text-xl font-bold font-mono text-white tracking-wider">
              {String(countdown.hours).padStart(2, '0')}h : {String(countdown.minutes).padStart(2, '0')}m : {String(countdown.seconds).padStart(2, '0')}s
            </div>
            <p className="text-[11px] text-slate-500">
              Rebalances back to {Math.abs(asset.leverage)}.00x exposure with zero margin liquidation.
            </p>
          </div>

          {/* Specs List */}
          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Collateral Vault:</span>
              <span className="text-slate-200">USDC (Bounce.tech)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Execution Bridge:</span>
              <span className="text-rh-green">Hyperlane Warp Route</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Token CA:</span>
              {asset.tokenAddress ? (
                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://robinhoodchain.blockscout.com/address/${asset.tokenAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-200 hover:text-white hover:underline truncate max-w-[110px]"
                  >
                    {asset.tokenAddress}
                  </a>
                  <CopyButton text={asset.tokenAddress} label="Copy" />
                </div>
              ) : (
                <span className="text-slate-500">Ready on Mint</span>
              )}
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Pool Liquidity:</span>
              <span className="text-slate-200">
                {asset.poolLiquidity ? `$${asset.poolLiquidity.toLocaleString()}` : 'Unseeded'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            <a
              href="https://bounce.tech"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between w-full p-2.5 rounded bg-[#0C0F15] hover:bg-[#121620] text-xs text-slate-300 transition"
            >
              <span>Bounce.tech Specifications</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          </div>

        </div>

      </div>

      {/* Autonomous 24/7 Keeper Console Stream */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-rh-green animate-pulse" />
            <h3 className="font-bold text-sm text-white font-display">
              Autonomous 24/7 Oracle & Rebalancer Terminal
            </h3>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
            <span className="text-rh-green">Autonomous Keeper Node</span>
            <span>•</span>
            <span>Robinhood Chain Mainnet (4663)</span>
          </div>
        </div>

        <KeeperTerminal />
      </div>

    </motion.div>
  );
};
