import React, { useState, useEffect, useMemo } from 'react';
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

  // Synthetic price points
  const chartPoints = useMemo(() => {
    const count = timeframe === '1H' ? 24 : timeframe === '24H' ? 48 : 70;
    const points: number[] = [];
    let price = asset.currentNav * (1 - (asset.change24h / 100) * (timeframe === '1H' ? 0.2 : 0.8));
    
    for (let i = 0; i < count; i++) {
      const step = ((Math.random() - 0.48) * 0.02 * Math.abs(asset.leverage)) + ((asset.change24h / 100) / count);
      price = Math.max(0.1, price * (1 + step));
      points.push(price);
    }
    points[points.length - 1] = asset.currentNav;
    return points;
  }, [asset.id, asset.currentNav, timeframe]);

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner: Asset Summary */}
      <div className="bg-[#0A0D12] border border-white/[0.08] rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="flex items-center space-x-4">
            <div
              className="w-12 h-12 rounded flex items-center justify-center font-bold text-base"
              style={{
                backgroundColor: `${asset.iconColor}15`,
                color: asset.iconColor,
                border: `1px solid ${asset.iconColor}35`,
              }}
            >
              {asset.underlying.slice(0, 3)}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white">{asset.symbol}</h1>
                <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${
                  asset.isShort 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                    : 'bg-white/[0.06] text-slate-300 border border-white/[0.1]'
                }`}>
                  {Math.abs(asset.leverage)}x {asset.isShort ? 'Short' : 'Long'}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {asset.underlyingName}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                <span>Spot: <strong className="text-slate-200">${asset.indexPrice.toLocaleString()}</strong></span>
                <span>•</span>
                <span>Source: <strong className="text-slate-300">Bounce.tech HyperEVM</strong></span>
                <span>•</span>
                <span>Target: <strong className="text-rh-green">Robinhood Chain (4663)</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 border-t lg:border-t-0 lg:border-l border-white/[0.06] pt-4 lg:pt-0 lg:pl-6 font-mono">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Oracle NAV Price</div>
              <div className="text-2xl font-bold text-white flex items-center gap-2">
                <span>${asset.currentNav.toFixed(2)}</span>
                <span className={`text-xs ${isPositive ? 'text-rh-green' : 'text-red-400'}`}>
                  {isPositive ? '+' : ''}{asset.change24h}%
                </span>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">AMM Spot Price</div>
              <div className="text-2xl font-bold text-slate-200">
                ${ammPrice.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500">
                Spread: {ammSpread >= 0 ? '+' : ''}{ammSpread}%
              </div>
            </div>

            <div className="flex items-center gap-2 font-sans">
              <button
                onClick={() => onMintAsset(asset)}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-200 text-black font-semibold px-4 py-2 rounded-md text-xs transition active:scale-95 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Mint {asset.symbol}</span>
              </button>

              <button
                onClick={() => onSeedPool(asset)}
                className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 px-3.5 py-2 rounded-md text-xs font-medium transition"
              >
                <Droplets className="w-3.5 h-3.5 text-slate-400" />
                <span>Seed Pool</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Main Grid: Chart + Backing Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Column */}
        <div className="lg:col-span-2 bg-[#0A0D12] border border-white/[0.08] rounded-lg p-6 space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <Activity className="w-3.5 h-3.5 text-rh-green" />
              <span>Live NAV Price Feed</span>
            </div>

            <div className="flex items-center space-x-1 bg-[#0E1218] p-1 rounded border border-white/[0.06] text-xs font-mono">
              {(['1H', '24H', '7D'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2 py-0.5 rounded text-xs transition ${
                    timeframe === tf
                      ? 'bg-white/[0.12] text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Chart */}
          <div className="relative w-full h-64 bg-[#07090D] rounded border border-white/[0.04] p-2 overflow-hidden">
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
            <div className="bg-[#0C0F15] p-2.5 rounded border border-white/[0.04]">
              <span className="text-slate-500 block text-[10px]">24H Volume</span>
              <span className="text-slate-200 font-bold">${asset.volume24h.toLocaleString()}</span>
            </div>
            <div className="bg-[#0C0F15] p-2.5 rounded border border-white/[0.04]">
              <span className="text-slate-500 block text-[10px]">Funding Rate (8h)</span>
              <span className="text-rh-green font-bold">{asset.fundingRate}%</span>
            </div>
            <div className="bg-[#0C0F15] p-2.5 rounded border border-white/[0.04]">
              <span className="text-slate-500 block text-[10px]">Open Interest</span>
              <span className="text-slate-200 font-bold">${asset.openInterest.toLocaleString()}</span>
            </div>
          </div>

        </div>

        {/* Engine Specs Column */}
        <div className="bg-[#0A0D12] border border-white/[0.08] rounded-lg p-6 space-y-5">
          
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="font-bold text-sm text-white">Bounce Rebalance Engine</h3>
            <span className="text-[10px] font-mono text-rh-green bg-rh-green/10 border border-rh-green/20 px-1.5 py-0.5 rounded">
              Active
            </span>
          </div>

          {/* Rebalance Timer */}
          <div className="bg-[#0C0F15] border border-white/[0.06] rounded p-4 text-center space-y-1">
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
    </div>
  );
};
