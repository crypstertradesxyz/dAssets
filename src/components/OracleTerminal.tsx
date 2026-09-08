import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Droplets, 
  ShieldCheck, 
  RefreshCw, 
  ArrowUpRight, 
  Layers, 
  ExternalLink,
  ChevronRight,
  Clock,
  Activity
} from 'lucide-react';
import { LeveragedAsset, WalletState } from '../types';
import { OracleService } from '../services/oracle';
import { CopyButton } from './CopyButton';

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

  // Generate synthetic chart data points based on asset current NAV and volatility
  const chartPoints = useMemo(() => {
    const count = timeframe === '1H' ? 24 : timeframe === '24H' ? 48 : 70;
    const points: number[] = [];
    let price = asset.currentNav * (1 - (asset.change24h / 100) * (timeframe === '1H' ? 0.2 : 0.8));
    
    for (let i = 0; i < count; i++) {
      const step = ((Math.random() - 0.48) * 0.02 * Math.abs(asset.leverage)) + ((asset.change24h / 100) / count);
      price = Math.max(0.1, price * (1 + step));
      points.push(price);
    }
    // Guarantee last point matches current NAV
    points[points.length - 1] = asset.currentNav;
    return points;
  }, [asset.id, asset.currentNav, timeframe]);

  // Compute SVG polyline
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
  const ammSpread = Number(((Math.random() * 0.18) - 0.09).toFixed(2));
  const ammPrice = Number((asset.currentNav * (1 + ammSpread / 100)).toFixed(2));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner: Pair Picker & Overview */}
      <div className="bg-[#0C1116] border border-zinc-800 rounded-2xl p-6 backdrop-blur shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Asset Info */}
          <div className="flex items-center space-x-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg"
              style={{
                backgroundColor: `${asset.iconColor}20`,
                color: asset.iconColor,
                border: `1px solid ${asset.iconColor}40`,
              }}
            >
              {asset.underlying.slice(0, 3)}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-white">{asset.symbol}</h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                    asset.isShort
                      ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                      : asset.leverage >= 5
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-rh-green/15 text-rh-green border border-rh-green/30'
                  }`}
                >
                  {Math.abs(asset.leverage)}x {asset.isShort ? 'Short' : 'Long'}
                </span>
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
                  {asset.underlyingName}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 mt-1">
                <span>Underlying Spot: <strong className="text-zinc-200 font-mono">${asset.indexPrice.toLocaleString()}</strong></span>
                <span>•</span>
                <span>HyperEVM Source: <strong className="text-zinc-300 font-mono">Bounce.tech Precompile</strong></span>
                <span>•</span>
                <span>Destination: <strong className="text-rh-green font-mono">Robinhood Chain</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Stats Block */}
          <div className="flex flex-wrap items-center gap-6 border-t lg:border-t-0 lg:border-l border-zinc-800 pt-4 lg:pt-0 lg:pl-6">
            <div>
              <div className="text-[11px] text-zinc-400 uppercase font-semibold">Oracle NAV Price</div>
              <div className="text-2xl font-bold font-mono text-white flex items-center gap-2">
                <span>${asset.currentNav.toFixed(2)}</span>
                <span className={`text-xs font-bold ${isPositive ? 'text-rh-green' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}{asset.change24h}%
                </span>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-zinc-400 uppercase font-semibold">AMM Pool Spot</div>
              <div className="text-2xl font-bold font-mono text-zinc-200">
                ${ammPrice.toFixed(2)}
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">
                Arb Spread: {ammSpread >= 0 ? '+' : ''}{ammSpread}%
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onMintAsset(asset)}
                className="flex items-center gap-1.5 bg-rh-green hover:bg-rh-greenHover text-black font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-rh-green/20 transition transform active:scale-95 text-xs"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Mint {asset.symbol}</span>
              </button>

              <button
                onClick={() => onSeedPool(asset)}
                className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-semibold px-4 py-2.5 rounded-xl transition text-xs"
              >
                <Droplets className="w-4 h-4 text-blue-400" />
                <span>Seed Pool</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Main Grid: Chart + Backing Mechanics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Interactive Terminal Chart */}
        <div className="lg:col-span-2 bg-[#0C1116] border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          
          {/* Chart Header Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rh-green" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Live Oracle NAV Price Feed (HyperEVM Synced)
              </span>
            </div>

            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs">
              {(['1H', '24H', '7D'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
                    timeframe === tf
                      ? 'bg-zinc-800 text-white font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Price Chart */}
          <div className="relative w-full h-64 bg-zinc-950/40 rounded-xl border border-zinc-900 p-2 overflow-hidden">
            <svg
              viewBox="0 0 600 240"
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositive ? '#00C805' : '#EF4444'} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={isPositive ? '#00C805' : '#EF4444'} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gradient fill polygon */}
              <polygon
                points={`0,240 ${svgPoints} 600,240`}
                fill="url(#chartGradient)"
              />

              {/* Stroke line */}
              <polyline
                fill="none"
                stroke={isPositive ? '#00C805' : '#EF4444'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={svgPoints}
              />
            </svg>

            {/* Micro grid indicators */}
            <div className="absolute right-3 top-3 text-[10px] font-mono text-zinc-500">
              High: ${maxVal.toFixed(2)}
            </div>
            <div className="absolute right-3 bottom-3 text-[10px] font-mono text-zinc-500">
              Low: ${minVal.toFixed(2)}
            </div>
          </div>

          {/* Bottom Live Ticker Bar */}
          <div className="mt-4 pt-4 border-t border-zinc-800/80 grid grid-cols-3 gap-4 text-xs font-mono text-center">
            <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-850">
              <span className="text-zinc-400 block text-[10px]">24H Volume</span>
              <span className="text-zinc-200 font-bold">${asset.volume24h.toLocaleString()}</span>
            </div>
            <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-850">
              <span className="text-zinc-400 block text-[10px]">Hyperliquid Funding Rate</span>
              <span className="text-rh-green font-bold">{asset.fundingRate}%</span>
            </div>
            <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-850">
              <span className="text-zinc-400 block text-[10px]">Open Interest</span>
              <span className="text-zinc-200 font-bold">${asset.openInterest.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Right Col: Bounce.tech Backing & Rebalancing Details */}
        <div className="bg-[#0C1116] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rh-green" />
              <span>Bounce.tech Perp Engine</span>
            </h3>
            <span className="text-[10px] bg-rh-green/15 text-rh-green px-2 py-0.5 rounded font-mono font-bold">
              Active
            </span>
          </div>

          {/* Rebalancing Countdown Box */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center space-y-1">
            <div className="text-[11px] text-zinc-400 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Next Automated Perp Rebalance:</span>
            </div>
            <div className="text-xl font-bold font-mono text-white tracking-wider">
              {String(countdown.hours).padStart(2, '0')}h : {String(countdown.minutes).padStart(2, '0')}m : {String(countdown.seconds).padStart(2, '0')}s
            </div>
            <p className="text-[10px] text-zinc-400">
              Rebalances back to {Math.abs(asset.leverage)}.00x via HyperCore precompiles without liquidating holders.
            </p>
          </div>

          {/* Specs Checklist */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Underlying Collateral:</span>
              <span className="font-mono text-zinc-200">USDC Margin Vault</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Perpetual Protocol:</span>
              <span className="font-mono text-zinc-200">Hyperliquid L1</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Interchain Bridge:</span>
              <span className="font-mono text-rh-green">Hyperlane Warp Route</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>Robinhood Contract:</span>
              {asset.tokenAddress ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-zinc-200 text-[11px] truncate max-w-[120px]">
                    {asset.tokenAddress}
                  </span>
                  <CopyButton text={asset.tokenAddress} label="Copy CA" />
                </div>
              ) : (
                <span className="font-mono text-zinc-500">Not Yet Deployed</span>
              )}
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Liquidity Pool TVL:</span>
              <span className="font-mono text-blue-400">
                {asset.poolLiquidity ? `$${asset.poolLiquidity.toLocaleString()}` : 'Unseeded'}
              </span>
            </div>
          </div>

          {/* External Docs Link */}
          <div className="pt-2 border-t border-zinc-800">
            <a
              href="https://bounce.tech"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between w-full p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-xs text-zinc-300 transition"
            >
              <span>Verify on Bounce.tech Docs</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
