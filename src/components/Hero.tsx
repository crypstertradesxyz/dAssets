import React from 'react';
import { 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  Droplets,
  ExternalLink 
} from 'lucide-react';

interface HeroProps {
  totalAssetsCount: number;
  onOpenMintFast: () => void;
  onOpenSeedPoolFast: () => void;
}

export const Hero: React.FC<HeroProps> = ({ 
  totalAssetsCount, 
  onOpenMintFast, 
  onOpenSeedPoolFast 
}) => {
  return (
    <div className="relative overflow-hidden pt-8 pb-10 border-b border-zinc-800/80 bg-gradient-to-b from-[#0B1015] via-[#050708] to-[#050708]">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-rh-green/5 blur-3xl pointer-events-none rounded-full" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          
          {/* Main copy */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 mb-4">
              <span className="flex h-2 w-2 rounded-full bg-rh-green"></span>
              <span className="font-medium text-rh-green">Bridge Live:</span>
              <span>HyperEVM ⇄ Robinhood Chain Warp Route</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Leveraged Assets for the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rh-green via-[#66FFAA] to-white">
                Robinhood Chain Ecosystem
              </span>
            </h1>

            <p className="mt-4 text-base text-zinc-400 leading-relaxed">
              Mint any of Bounce.tech’s <span className="text-zinc-100 font-semibold">{totalAssetsCount}+ HyperEVM leveraged tokens</span> directly onto Robinhood Chain via Hyperlane. Seed your own AMM liquidity pools, trade with zero personal liquidation risk, and track real-time Oracle NAV.
            </p>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenMintFast}
                className="flex items-center gap-2 bg-rh-green hover:bg-rh-greenHover text-black font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-rh-green/20 transition-all transform active:scale-95"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Mint Leveraged Asset</span>
              </button>

              <button
                onClick={onOpenSeedPoolFast}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-semibold px-4 py-2.5 rounded-xl transition-all"
              >
                <Droplets className="w-4 h-4 text-rh-green" />
                <span>Seed AMM Pool</span>
              </button>

              <a
                href="https://bounce.tech" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-3 py-2 transition"
              >
                <span>Bounce.tech HyperEVM</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 lg:w-96">
            <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4 backdrop-blur">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Total Assets</span>
                <Layers className="w-4 h-4 text-rh-green" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-white">
                {totalAssetsCount}+
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                Bounce.tech Pairs
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4 backdrop-blur">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Personal Liquidation</span>
                <ShieldCheck className="w-4 h-4 text-rh-green" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-rh-green">
                0% Risk
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                Auto-Rebalanced Perps
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4 backdrop-blur">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Bridge Latency</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-white">
                ~1.2s
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                Hyperlane ISM Finality
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4 backdrop-blur">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Hyperliquid Backing</span>
                <RefreshCw className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-white">
                100%
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                HyperCore Precompile Collateral
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
