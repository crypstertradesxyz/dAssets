import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  ExternalLink, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  ShieldCheck,
  FileCode,
  Flame,
  Crown
} from 'lucide-react';
import { CopyButton } from './CopyButton';
import deployedConfig from '../contracts/deployedAddresses.json';
import { LeveragedAsset, AppView } from '../types';
import { TokenLogo } from './TokenLogo';
import { getUniswapSwapUrl } from '../utils/uniswap';

interface HomeViewProps {
  assets: LeveragedAsset[];
  onExploreMarkets: () => void;
  onSelectAsset: (asset: LeveragedAsset) => void;
  onMintAsset: (asset: LeveragedAsset) => void;
  onOpenContracts: () => void;
  onNavigate?: (view: AppView, asset?: LeveragedAsset) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ 
  assets,
  onExploreMarkets, 
  onSelectAsset, 
  onMintAsset,
  onOpenContracts,
  onNavigate,
}) => {
  const factoryAddress = deployedConfig?.factory || '0x31390C104d777c03B00E95967E3F2905993f947b';

  const [activeTabSymbol, setActiveTabSymbol] = useState('dBTC3L');
  const activeAsset = assets.find(a => a.symbol === activeTabSymbol) || assets[0];

  const [spotlightFilter, setSpotlightFilter] = useState<'top_movers' | 'top_gainers' | 'majors' | 'deployed'>('top_movers');

  const spotlightAssets = useMemo(() => {
    switch (spotlightFilter) {
      case 'top_movers':
        return [...assets]
          .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
          .slice(0, 4);

      case 'top_gainers':
        return [...assets]
          .sort((a, b) => b.change24h - a.change24h)
          .slice(0, 4);

      case 'majors':
        return [
          assets.find(a => a.symbol === 'dBTC3L') || assets[0],
          assets.find(a => a.symbol === 'dBTC5L') || assets[1],
          assets.find(a => a.symbol === 'dETH3L') || assets[2],
          assets.find(a => a.symbol === 'dSOL5L') || assets[3],
        ].filter(Boolean);

      case 'deployed':
        const deployed = assets.filter(a => a.tokenAddress || a.isMinted);
        if (deployed.length >= 4) return deployed.slice(0, 4);
        return [
          ...deployed,
          ...assets.filter(a => !deployed.includes(a))
        ].slice(0, 4);

      default:
        return assets.slice(0, 4);
    }
  }, [assets, spotlightFilter]);

  const quickSymbols = ['dBTC3L', 'dETH3L', 'dSOL5L', 'dHYPE3L'];
  const marqueeAssets = assets.slice(0, 16);

  return (
    <div className="relative min-h-screen text-slate-100 selection:bg-rh-green selection:text-black">
      
      {/* Live Market Marquee Ticker */}
      <div className="border-b border-white/[0.06] bg-[#060709]/80 backdrop-blur-md py-2 overflow-hidden select-none">
        <div className="animate-marquee items-center gap-8 text-xs font-mono">
          {[...marqueeAssets, ...marqueeAssets].map((item, idx) => {
            const isPos = item.change24h >= 0;
            return (
              <a
                key={`${item.id}-${idx}`}
                href={`/terminal/${item.symbol}`}
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    onSelectAsset(item);
                  }
                }}
                className="flex items-center space-x-2.5 cursor-pointer hover:text-white transition px-2 py-0.5 rounded"
              >
                <TokenLogo underlying={item.underlying} iconColor={item.iconColor} size="xs" />
                <span className="font-semibold text-slate-200">{item.symbol}</span>
                <span className="text-white">${item.currentNav.toFixed(2)}</span>
                <span className={`text-[11px] font-medium flex items-center gap-0.5 ${isPos ? 'text-rh-green' : 'text-red-400'}`}>
                  {isPos ? '+' : ''}{item.change24h}%
                </span>
                <span className="text-slate-800 ml-4">•</span>
              </a>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-24">
        
        {/* HERO: Two-Column Integrated Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Column */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping-subtle absolute inline-flex h-full w-full rounded-full bg-rh-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rh-green"></span>
              </span>
              <span>Robinhood Chain Mainnet • Chain 4663</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.06] font-display">
              Leveraged tokens on Robinhood Chain.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl font-normal">
              Hold constant <strong className="text-white font-semibold">2x, 3x, and 5x Long & Inverse Short</strong> exposure across 270+ crypto assets without margin debt, borrowing rates, or liquidation risk.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <motion.a
                href="/trade"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    if (onNavigate) onNavigate('trade');
                  }
                }}
                className="flex items-center gap-2 bg-pink-500 hover:bg-pink-400 text-white font-bold text-xs px-5 py-3 rounded-lg transition shadow-lg cursor-pointer"
              >
                <img src="/logos/uni.png" alt="Uniswap" className="w-4 h-4 rounded-full" />
                <span>Trade / Swap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.a>

              <motion.a
                href="/markets"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    onExploreMarkets();
                  }
                }}
                className="flex items-center gap-2 bg-white hover:bg-slate-100 text-black font-semibold text-xs px-5 py-3 rounded-lg transition shadow-sm cursor-pointer"
              >
                <span>Browse 270+ Markets</span>
              </motion.a>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onMintAsset(activeAsset)}
                className="flex items-center gap-2 bg-[#0E1218] hover:bg-[#141A22] text-slate-200 border border-white/[0.12] text-xs font-medium px-4 py-3 rounded-lg transition"
              >
                <Zap className="w-3.5 h-3.5 text-rh-green fill-current" />
                <span>Mint Vault</span>
              </motion.button>

              <a
                href="/contracts"
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    onOpenContracts();
                  }
                }}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs px-3 py-3 transition font-mono cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-slate-400" />
                <span>Verified Contracts</span>
              </a>
            </div>

            {/* 3-Step Quick Start Explainer */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 space-y-1">
                <div className="text-pink-400 font-mono font-bold flex items-center gap-1.5 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                  <span>1. Swap with ETH</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Buy any 2x, 3x, 5x token with native Robinhood ETH on Uniswap.
                </p>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 space-y-1">
                <div className="text-rh-green font-mono font-bold flex items-center gap-1.5 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-rh-green"></span>
                  <span>2. Hold Leverage</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  No margin debt, no borrowing fees, and zero liquidation risk.
                </p>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 space-y-1">
                <div className="text-cyan-400 font-mono font-bold flex items-center gap-1.5 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  <span>3. Convert Back</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Sell back for regular ETH on Uniswap or Redeem at Oracle NAV anytime.
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-6 grid grid-cols-3 gap-6 border-t border-white/[0.06]">
              <div>
                <div className="text-xs text-slate-500 font-medium">Markets Catalog</div>
                <div className="text-xl font-bold text-white font-display mt-0.5">270+ Pairs</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Liquidation Risk</div>
                <div className="text-xl font-bold text-white font-display mt-0.5">0% Margin Call</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Gas Settlement</div>
                <div className="text-xl font-bold text-rh-green font-display mt-0.5">~$0.05 L2</div>
              </div>
            </div>
          </motion.div>

          {/* Right Hero Column: Interactive Live Token Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="lg:col-span-5"
          >
            <div className="glass-panel glass-panel-hover rounded-2xl p-6 shadow-2xl space-y-4 glow-border-green">
              
              {/* Quick Pair Selector Tabs */}
              <div className="flex items-center space-x-1 border-b border-white/[0.08] pb-3">
                {quickSymbols.map((sym) => {
                  const isSelected = activeTabSymbol === sym;
                  return (
                    <button
                      key={sym}
                      onClick={() => setActiveTabSymbol(sym)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        isSelected 
                          ? 'bg-white/[0.12] text-white font-semibold shadow-sm' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      {sym}
                    </button>
                  );
                })}
              </div>

              {/* Asset Header with Logo */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3">
                  <TokenLogo 
                    underlying={activeAsset.underlying} 
                    iconColor={activeAsset.iconColor} 
                    size="lg" 
                    rounded="xl" 
                  />
                  <div>
                    <div className="font-bold text-lg text-white font-display flex items-center gap-2">
                      <span>{activeAsset.symbol}</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        activeAsset.isShort 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30' 
                          : 'bg-rh-green/10 text-rh-green border border-rh-green/30'
                      }`}>
                        {Math.abs(activeAsset.leverage)}x {activeAsset.isShort ? 'Short' : 'Long'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-sans">
                      {activeAsset.name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Price & NAV Display */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-xs text-slate-400">Oracle NAV Price</div>
                  <div className="text-3xl font-bold text-white font-display mt-0.5">
                    ${activeAsset.currentNav.toFixed(2)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">24h Change</div>
                  <div className={`text-sm font-semibold flex items-center justify-end gap-1 mt-0.5 ${
                    activeAsset.change24h >= 0 ? 'text-rh-green' : 'text-red-400'
                  }`}>
                    {activeAsset.change24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{activeAsset.change24h >= 0 ? '+' : ''}{activeAsset.change24h}%</span>
                  </div>
                </div>
              </div>

              {/* Asset Details Inlay */}
              <div className="carbon-inlay rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Underlying Asset:</span>
                  <span className="text-white font-medium">{activeAsset.name} (${activeAsset.indexPrice.toLocaleString()})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Leverage Multiplier:</span>
                  <span className="text-white font-semibold">{Math.abs(activeAsset.leverage)}x Constant Exposure</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Automated Rebalance:</span>
                  <span className="text-slate-200">Every 8 Hours</span>
                </div>
                {activeAsset.tokenAddress ? (
                  <div className="flex items-center justify-between text-slate-400 pt-1.5 border-t border-white/[0.04]">
                    <span>Contract CA:</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-slate-300">{activeAsset.tokenAddress.slice(0, 6)}...{activeAsset.tokenAddress.slice(-4)}</span>
                      <CopyButton text={activeAsset.tokenAddress} label="Copy" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-slate-400 pt-1.5 border-t border-white/[0.04]">
                    <span>Contract Status:</span>
                    <span className="text-slate-400 font-mono text-[11px]">Available to Deploy</span>
                  </div>
                )}
              </div>


              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 font-sans">
                <a
                  href={getUniswapSwapUrl(activeAsset.tokenAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-400 text-white font-bold py-3 px-3 rounded-xl text-xs transition shadow-md cursor-pointer"
                  title="Trade on Uniswap (Robinhood Chain)"
                >
                  <img src="/logos/uni.png" alt="Uniswap" className="w-4 h-4 rounded-full" />
                  <span>Trade Uniswap</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onMintAsset(activeAsset)}
                  className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-200 text-black font-bold py-3 px-3 rounded-xl text-xs transition shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Mint Vault</span>
                </motion.button>
              </div>

            </div>
          </motion.div>

        </section>

        {/* Market Spotlight & Movers Section */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-rh-green animate-pulse" />
                <h2 className="text-base font-bold text-white font-display">
                  Market Spotlight & Live Movers
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/[0.08]">
                  Pyth Oracle
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time algorithmic ranking of 270+ leveraged markets by volatility, momentum, and on-chain status.
              </p>
            </div>

            {/* Interactive Spotlight Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'top_movers' as const, label: 'Top Volatility', icon: Flame },
                { id: 'top_gainers' as const, label: 'Top Gainers', icon: TrendingUp },
                { id: 'majors' as const, label: 'Majors', icon: Crown },
                { id: 'deployed' as const, label: 'Live Deployed', icon: ShieldCheck },
              ].map(opt => {
                const Icon = opt.icon;
                const isActive = spotlightFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSpotlightFilter(opt.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-rh-green text-black font-bold shadow-md shadow-rh-green/10'
                        : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${isActive ? 'text-black' : 'text-slate-400'}`} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}

              <a
                href="/markets"
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey) {
                    e.preventDefault();
                    onExploreMarkets();
                  }
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-rh-green hover:text-white transition px-2 py-1 cursor-pointer"
              >
                <span>View All 270+</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {spotlightAssets.map((item, idx) => {
              const changeVal = typeof item.change24h === 'number' ? item.change24h : 0;
              const isPos = changeVal >= 0;
              const rankLabel =
                spotlightFilter === 'top_movers'
                  ? `#${idx + 1} Volatility`
                  : spotlightFilter === 'top_gainers'
                  ? `#${idx + 1} Gainer`
                  : spotlightFilter === 'majors'
                  ? 'Benchmark'
                  : 'On-Chain';

              return (
                <a
                  key={item.symbol}
                  href={`/terminal/${item.symbol}`}
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey) {
                      e.preventDefault();
                      onSelectAsset(item);
                    }
                  }}
                  className="block glass-panel glass-panel-hover rounded-2xl p-5 space-y-4 cursor-pointer group relative overflow-hidden transition-all hover:border-rh-green/30"
                >
                  {/* Card Header: Token Logo, Symbol, Underlying + Leverage Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <TokenLogo 
                        underlying={item.underlying} 
                        iconColor={item.iconColor} 
                        size="md" 
                        rounded="lg" 
                      />
                      <div>
                        <div className="font-bold text-white text-base font-display group-hover:text-rh-green transition-colors leading-tight">
                          {item.symbol}
                        </div>
                        <div className="text-xs text-slate-400 font-sans truncate max-w-[100px]">
                          {item.underlyingName}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                        item.isShort
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                          : 'bg-rh-green/10 text-rh-green border border-rh-green/30'
                      }`}>
                        {item.isShort ? '▼' : '▲'} {Math.abs(item.leverage)}x {item.isShort ? 'Short' : 'Long'}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 font-medium">
                        {rankLabel}
                      </span>
                    </div>
                  </div>

                  {/* Mid Row: Oracle NAV & 24h Change */}
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <div className="text-[10px] text-slate-400 font-sans uppercase tracking-wider">Oracle NAV</div>
                      <div className="text-xl font-bold text-white font-mono mt-0.5">
                        ${item.currentNav.toFixed(2)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-sans uppercase tracking-wider">24h Return</div>
                      <div className={`text-xs font-bold font-mono inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded ${
                        isPos ? 'bg-rh-green/10 text-rh-green' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{isPos ? '+' : ''}{changeVal.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Separated 2-column info grid to prevent any text overlap or collision */}
                  <div className="pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans">
                        Index Spot
                      </span>
                      <span className="text-slate-200 font-semibold block truncate">
                        ${item.indexPrice >= 1000 
                          ? Math.round(item.indexPrice).toLocaleString() 
                          : item.indexPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="text-right min-w-0">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans">
                        Contract
                      </span>
                      <span className={`inline-flex items-center justify-end gap-1.5 font-medium ${
                        item.tokenAddress ? 'text-rh-green' : 'text-slate-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          item.tokenAddress ? 'bg-rh-green shadow-[0_0_8px_rgba(0,200,5,0.8)] animate-pulse' : 'bg-slate-500'
                        }`} />
                        {item.tokenAddress ? 'Deployed' : 'Deployable'}
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {/* Official Protocol Brand Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#07090D] shadow-2xl group"
        >
          <img 
            src="/banner.png" 
            alt="dAssets Protocol Banner" 
            className="w-full h-auto object-cover max-h-[360px] select-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050608]/80 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-3 sm:bottom-4 left-4 sm:left-6 right-4 sm:right-6 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-rh-green"></span>
              <span className="text-[11px] sm:text-xs">Official Protocol Identity • Robinhood Chain</span>
            </div>
            <a
              href="https://x.com/dAssetsRH"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-semibold transition border border-white/10 shadow-sm"
            >
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Follow @dAssetsRH</span>
            </a>
          </div>
        </motion.div>

        {/* HOW IT WORKS: Human, Direct, Clear */}
        <section className="space-y-6">
          <div className="border-b border-white/[0.08] pb-3">
            <h2 className="text-base font-bold text-white font-display">
              How dAssets Works
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Leveraged tokens give you multiplier returns without borrowing rates, margin maintenance, or liquidation risk.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel glass-panel-hover rounded-2xl p-6 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-rh-green/10 border border-rh-green/30 text-rh-green flex items-center justify-center font-bold text-xs font-mono">
                01
              </div>
              <h3 className="text-sm font-bold text-white">Choose Your Multiplier</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pick from 270+ assets across Bitcoin, Ethereum, Solana, Layer 1s, AI, and DeFi in 2x, 3x, or 5x Long & Inverse Short exposure.
              </p>
            </div>

            <div className="glass-panel glass-panel-hover rounded-2xl p-6 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold text-xs font-mono">
                02
              </div>
              <h3 className="text-sm font-bold text-white">Mint Directly on Robinhood Chain</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deposit USDC natively on Robinhood Chain Mainnet (Chain 4663). Tokens mint instantly as standard self-custodial ERC-20s.
              </p>
            </div>

            <div className="glass-panel glass-panel-hover rounded-2xl p-6 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs font-mono">
                03
              </div>
              <h3 className="text-sm font-bold text-white">Zero Margin Calls</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Autonomous on-chain keepers continuously adjust exposure to target leverage. Trade on Uniswap v3 AMMs or redeem anytime at Oracle NAV.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
