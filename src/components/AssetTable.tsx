import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ArrowUpDown,
  ExternalLink,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  List,
  Flame,
  Shield,
  Zap,
  Activity,
  Droplets
} from 'lucide-react';
import { LeveragedAsset, AssetCategory } from '../types';
import { CopyButton } from './CopyButton';

interface AssetTableProps {
  assets: LeveragedAsset[];
  onSelectAsset: (asset: LeveragedAsset) => void;
  onMintAsset: (asset: LeveragedAsset) => void;
  onSeedPool: (asset: LeveragedAsset) => void;
}

type LeverageTier = 'all' | '2x' | '3x' | '5x' | 'short';
type ViewMode = 'table' | 'grid';

// Reusable Deterministic SVG Sparkline Chart
const Sparkline: React.FC<{ change24h: number; currentNav: number; width?: number; height?: number }> = ({ 
  change24h, 
  currentNav, 
  width = 80, 
  height = 24 
}) => {
  const pointsCount = 10;
  const isPositive = change24h >= 0;
  const startNav = currentNav / (1 + (change24h / 100));
  const points: { x: number; y: number }[] = [];
  
  for (let i = 0; i < pointsCount; i++) {
    const progress = i / (pointsCount - 1);
    const wave = Math.sin(progress * Math.PI) * (isPositive ? 0.35 : -0.35);
    const val = startNav + (currentNav - startNav) * progress + (i > 0 && i < pointsCount - 1 ? wave * 0.04 * currentNav : 0);
    points.push({ x: (i / (pointsCount - 1)) * width, y: val });
  }

  const min = Math.min(...points.map(p => p.y)) * 0.998;
  const max = Math.max(...points.map(p => p.y)) * 1.002;
  const range = max - min || 1;

  const coords = points.map(p => {
    const normY = height - ((p.y - min) / range) * (height - 6) - 3;
    return `${p.x.toFixed(1)},${normY.toFixed(1)}`;
  });

  const polylineStr = coords.join(' ');
  const polygonStr = `0,${height} ${coords.join(' ')} ${width},${height}`;
  const strokeColor = isPositive ? '#00C805' : '#EF4444';
  const fillGradientId = `spark-${Math.abs(Math.round(currentNav * 1000))}-${Math.abs(Math.round(change24h * 100))}-${width}`;

  return (
    <svg width={width} height={height} className="overflow-visible inline-block">
      <defs>
        <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={polygonStr} fill={`url(#${fillGradientId})`} />
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polylineStr}
      />
    </svg>
  );
};

export const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  onSelectAsset,
  onMintAsset,
  onSeedPool,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('all');
  const [leverageTier, setLeverageTier] = useState<LeverageTier>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<'spot' | 'nav' | 'change' | 'name'>('spot');
  const [sortAsc, setSortAsc] = useState(false);

  const categories: { key: AssetCategory; label: string }[] = [
    { key: 'all', label: 'All Markets' },
    { key: 'majors', label: 'Majors' },
    { key: 'layer1', label: 'Layer 1 / 2' },
    { key: 'defi', label: 'DeFi' },
    { key: 'ai', label: 'AI & Compute' },
    { key: 'meme', label: 'Memes' },
  ];

  const leverageTiers: { key: LeverageTier; label: string; count?: number }[] = [
    { key: 'all', label: 'All Tiers' },
    { key: '2x', label: '▲ 2x Long' },
    { key: '3x', label: '▲ 3x Long' },
    { key: '5x', label: '▲ 5x Long' },
    { key: 'short', label: '▼ Inverse Short' },
  ];

  // Top Movers and Flagships
  const flagship = useMemo(() => assets.find(a => a.symbol === 'dBTC3L') || assets[0], [assets]);
  const topGainer = useMemo(() => {
    return [...assets].filter(a => !a.isShort).sort((a, b) => b.change24h - a.change24h)[0] || assets[0];
  }, [assets]);
  const topHedge = useMemo(() => {
    return [...assets].filter(a => a.isShort).sort((a, b) => b.change24h - a.change24h)[0] || assets[1];
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return assets
      .filter((a) => {
        // Category Filter
        if (selectedCategory !== 'all' && a.category !== selectedCategory) {
          return false;
        }
        // Leverage Tier Filter
        if (leverageTier === '2x' && (a.leverage !== 2)) return false;
        if (leverageTier === '3x' && (a.leverage !== 3)) return false;
        if (leverageTier === '5x' && (a.leverage !== 5)) return false;
        if (leverageTier === 'short' && !a.isShort) return false;

        // Search Filter
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            a.symbol.toLowerCase().includes(q) ||
            a.name.toLowerCase().includes(q) ||
            a.underlying.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'spot') diff = b.indexPrice - a.indexPrice;
        else if (sortField === 'nav') diff = b.currentNav - a.currentNav;
        else if (sortField === 'change') diff = b.change24h - a.change24h;
        else if (sortField === 'name') diff = a.symbol.localeCompare(b.symbol);
        return sortAsc ? -diff : diff;
      });
  }, [assets, search, selectedCategory, leverageTier, sortField, sortAsc]);

  const handleSort = (field: 'spot' | 'nav' | 'change' | 'name') => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-slate-100 selection:bg-rh-green selection:text-black"
    >
      
      {/* Header & Controls */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-slate-300 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-rh-green animate-pulse"></span>
              <span>270+ Leveraged Positions • Robinhood Chain (4663)</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">
              Token Markets Directory
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed font-sans">
              Permissionless leveraged tokens with continuous rebalancing, zero borrowing debt, and continuous on-chain Oracle NAV pricing.
            </p>
          </div>

          {/* Search & View Mode Switcher */}
          <div className="flex items-center gap-2.5 self-start sm:self-center w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search symbol (BTC, SOL, AI)..."
                className="w-full bg-[#090C10]/80 border border-white/[0.08] focus:border-rh-green/50 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition font-mono"
              />
            </div>

            {/* Table / Grid Mode Toggle */}
            <div className="flex items-center bg-[#090C10]/80 border border-white/[0.08] p-1 rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition ${
                  viewMode === 'table'
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition ${
                  viewMode === 'grid'
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Top Movers Spotlight Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 font-mono">
          
          {/* Flagship Card */}
          <div 
            onClick={() => onSelectAsset(flagship)}
            className="glass-panel glass-panel-hover rounded-xl p-4 cursor-pointer space-y-2 border-emerald-500/20"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[10px] uppercase font-sans font-bold text-rh-green tracking-wider">
                <Flame className="w-3 h-3" />
                <span>Flagship Benchmark</span>
              </span>
              <span className="text-[10px] text-rh-green bg-rh-green/10 border border-rh-green/30 px-1.5 py-0.2 rounded">
                Live on 4663
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div 
                  className="w-7 h-7 rounded flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: `${flagship.iconColor}20`, color: flagship.iconColor, border: `1px solid ${flagship.iconColor}40` }}
                >
                  {flagship.underlying.slice(0, 3)}
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{flagship.symbol}</div>
                  <div className="text-[10px] text-slate-400 font-sans">{flagship.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-white">${flagship.currentNav.toFixed(2)}</div>
                <div className="text-[11px] font-bold text-rh-green">+{flagship.change24h}%</div>
              </div>
            </div>
          </div>

          {/* Top Bull Gainer */}
          <div 
            onClick={() => onSelectAsset(topGainer)}
            className="glass-panel glass-panel-hover rounded-xl p-4 cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[10px] uppercase font-sans font-bold text-sky-400 tracking-wider">
                <TrendingUp className="w-3 h-3" />
                <span>Top Bull Gainer</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {topGainer.leverage}x Multiplier
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div 
                  className="w-7 h-7 rounded flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: `${topGainer.iconColor}20`, color: topGainer.iconColor, border: `1px solid ${topGainer.iconColor}40` }}
                >
                  {topGainer.underlying.slice(0, 3)}
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{topGainer.symbol}</div>
                  <div className="text-[10px] text-slate-400 font-sans">{topGainer.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-white">${topGainer.currentNav.toFixed(2)}</div>
                <div className="text-[11px] font-bold text-rh-green">+{topGainer.change24h}%</div>
              </div>
            </div>
          </div>

          {/* Top Inverse Short Hedge */}
          <div 
            onClick={() => onSelectAsset(topHedge)}
            className="glass-panel glass-panel-hover rounded-xl p-4 cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[10px] uppercase font-sans font-bold text-amber-400 tracking-wider">
                <Shield className="w-3 h-3" />
                <span>Inverse Short Hedge</span>
              </span>
              <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/30 px-1.5 py-0.2 rounded font-mono">
                {topHedge.leverage}x Inverse
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div 
                  className="w-7 h-7 rounded flex items-center justify-center font-bold text-xs"
                  style={{ backgroundColor: `${topHedge.iconColor}20`, color: topHedge.iconColor, border: `1px solid ${topHedge.iconColor}40` }}
                >
                  {topHedge.underlying.slice(0, 3)}
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{topHedge.symbol}</div>
                  <div className="text-[10px] text-slate-400 font-sans">{topHedge.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-white">${topHedge.currentNav.toFixed(2)}</div>
                <div className={`text-[11px] font-bold ${topHedge.change24h >= 0 ? 'text-rh-green' : 'text-red-400'}`}>
                  {topHedge.change24h >= 0 ? '+' : ''}{topHedge.change24h}%
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Dual Filter Controls Bar */}
        <div className="space-y-3">
          
          {/* Category Tabs */}
          <div className="flex items-center space-x-1 border-b border-white/[0.08] pb-3 overflow-x-auto text-xs">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`relative px-3.5 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                    isSelected
                      ? 'text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeCategoryTab"
                      className="absolute inset-0 bg-white/[0.12] rounded-lg -z-10 shadow-sm"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Leverage Tier Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-sans font-medium mr-1">
              Leverage Multiplier:
            </span>
            {leverageTiers.map((tier) => {
              const isSelected = leverageTier === tier.key;
              return (
                <button
                  key={tier.key}
                  onClick={() => setLeverageTier(tier.key)}
                  className={`px-3 py-1 rounded-md transition text-[11px] font-semibold flex items-center gap-1.5 ${
                    isSelected
                      ? tier.key === 'short'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm'
                        : 'bg-rh-green/20 text-rh-green border border-rh-green/40 shadow-sm'
                      : 'bg-[#090C10]/80 text-slate-400 border border-white/[0.08] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{tier.label}</span>
                </button>
              );
            })}
            
            <span className="ml-auto text-[11px] text-slate-400 font-sans hidden sm:block">
              Showing <strong className="text-white">{filteredAssets.length}</strong> markets
            </span>
          </div>

        </div>
      </div>

      {/* Main Content Area: Table vs Grid Mode */}
      {viewMode === 'table' ? (
        
        /* High-Craft Table View */
        <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#07090D]/80 text-[11px] font-mono text-slate-400 uppercase">
                  <th className="py-3 px-4 cursor-pointer select-none" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      <span>Market Asset</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Leverage Tier</th>
                  <th className="py-3 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('nav')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>Oracle NAV</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('change')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>24h Change</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center hidden md:table-cell">
                    <span>7D Trend</span>
                  </th>
                  <th className="py-3 px-4 text-right cursor-pointer select-none hidden sm:table-cell" onClick={() => handleSort('spot')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>Underlying Spot</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center hidden lg:table-cell">Robinhood Chain Contract</th>
                  <th className="py-3 px-4 text-right">Execution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-mono">
                {filteredAssets.slice(0, 100).map((asset) => {
                  const isPositive = asset.change24h >= 0;
                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-white/[0.035] transition-colors duration-150 cursor-pointer group"
                      onClick={() => onSelectAsset(asset)}
                    >
                      {/* Asset Name */}
                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-7 h-7 rounded flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                            style={{
                              backgroundColor: `${asset.iconColor}15`,
                              color: asset.iconColor,
                              border: `1px solid ${asset.iconColor}30`,
                            }}
                          >
                            {asset.underlying.slice(0, 3)}
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-rh-green transition-colors">
                              {asset.symbol}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {asset.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Leverage Badge */}
                      <td className="py-3.5 px-3">
                        <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1 ${
                          asset.isShort 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : 'bg-rh-green/10 text-rh-green border border-rh-green/20'
                        }`}>
                          <span>{asset.isShort ? '▼' : '▲'}</span>
                          <span>{Math.abs(asset.leverage)}x {asset.isShort ? 'Short' : 'Long'}</span>
                        </span>
                      </td>

                      {/* NAV */}
                      <td className="py-3.5 px-4 text-right text-white font-bold text-sm">
                        ${asset.currentNav.toFixed(2)}
                      </td>

                      {/* 24h Change */}
                      <td className="py-3.5 px-4 text-right">
                        <span className={`text-[11px] font-bold inline-flex items-center justify-end gap-0.5 ${isPositive ? 'text-rh-green' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''}{asset.change24h}%
                        </span>
                      </td>

                      {/* 7D Trend Sparkline */}
                      <td className="py-3.5 px-4 text-center hidden md:table-cell">
                        <Sparkline change24h={asset.change24h} currentNav={asset.currentNav} width={75} height={20} />
                      </td>

                      {/* Underlying Spot Price */}
                      <td className="py-3.5 px-4 text-right text-slate-300 hidden sm:table-cell">
                        ${asset.indexPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* On-Chain Contract Address */}
                      <td className="py-3.5 px-4 text-center font-sans hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                        {asset.tokenAddress ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[10px] bg-rh-green/10 text-rh-green border border-rh-green/30 px-1.5 py-0.5 rounded font-mono font-semibold">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Deployed
                            </span>
                            <a
                              href={`https://robinhoodchain.blockscout.com/address/${asset.tokenAddress}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-mono text-slate-300 hover:text-white hover:underline flex items-center gap-1"
                            >
                              <span>{asset.tokenAddress.slice(0, 6)}...{asset.tokenAddress.slice(-4)}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                            <CopyButton text={asset.tokenAddress} />
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">
                            Available on Mint
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2 font-sans">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onMintAsset(asset)}
                            className="px-3 py-1 rounded-md bg-white hover:bg-slate-200 text-black text-xs font-semibold transition shadow-sm"
                          >
                            Mint
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onSelectAsset(asset)}
                            className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.10] text-slate-300 hover:text-white text-xs transition border border-white/[0.08]"
                          >
                            Trade
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredAssets.length > 100 && (
            <div className="py-3 px-4 text-center text-xs text-slate-400 border-t border-white/[0.08] font-mono bg-[#06080C]/80">
              Displaying top 100 of {filteredAssets.length} markets. Use search to filter any specific pair.
            </div>
          )}
        </div>

      ) : (
        
        /* High-End Grid Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {filteredAssets.slice(0, 60).map((asset) => {
            const isPositive = asset.change24h >= 0;
            return (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => onSelectAsset(asset)}
                className="glass-panel glass-panel-hover rounded-2xl p-5 space-y-4 cursor-pointer relative overflow-hidden group"
              >
                {/* Card Top: Asset Icon, Symbol, Multiplier */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs"
                      style={{
                        backgroundColor: `${asset.iconColor}20`,
                        color: asset.iconColor,
                        border: `1px solid ${asset.iconColor}40`,
                      }}
                    >
                      {asset.underlying.slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-bold text-white text-base font-display group-hover:text-rh-green transition-colors">
                        {asset.symbol}
                      </div>
                      <div className="text-xs text-slate-400 font-sans">
                        {asset.name}
                      </div>
                    </div>
                  </div>

                  {/* Multiplier Tag */}
                  <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full ${
                    asset.isShort
                      ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                      : 'bg-rh-green/10 text-rh-green border border-rh-green/30'
                  }`}>
                    {asset.isShort ? '▼' : '▲'} {Math.abs(asset.leverage)}x {asset.isShort ? 'Short' : 'Long'}
                  </span>
                </div>

                {/* Price & Change Block */}
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-medium block">
                      Oracle NAV Price
                    </span>
                    <div className="text-2xl font-bold text-white font-mono mt-0.5">
                      ${asset.currentNav.toFixed(2)}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-medium block">
                      24h Volatility
                    </span>
                    <div className={`text-sm font-bold font-mono inline-flex items-center gap-1 mt-0.5 ${
                      isPositive ? 'text-rh-green' : 'text-red-400'
                    }`}>
                      {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span>{isPositive ? '+' : ''}{asset.change24h}%</span>
                    </div>
                  </div>
                </div>

                {/* Embedded Wide Sparkline */}
                <div className="bg-black/40 border border-white/[0.04] rounded-xl p-2.5 flex items-center justify-center">
                  <Sparkline change24h={asset.change24h} currentNav={asset.currentNav} width={270} height={40} />
                </div>

                {/* Specs Inlay */}
                <div className="carbon-inlay rounded-xl p-3 text-xs font-mono space-y-1.5 text-slate-400">
                  <div className="flex justify-between">
                    <span>Spot Benchmark:</span>
                    <strong className="text-slate-200">${asset.indexPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Robinhood Chain:</span>
                    <strong className={asset.tokenAddress ? 'text-rh-green' : 'text-slate-400'}>
                      {asset.tokenAddress ? 'Live Contract (4663)' : 'Available on Mint'}
                    </strong>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 font-sans" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onSelectAsset(asset)}
                    className="flex-1 bg-white/[0.06] hover:bg-white/[0.12] text-white py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-white/[0.08]"
                  >
                    <Activity className="w-3.5 h-3.5 text-rh-green" />
                    <span>View Feed</span>
                  </button>
                  <button
                    onClick={() => onMintAsset(asset)}
                    className="flex-1 bg-white hover:bg-slate-200 text-black py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Mint</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

    </motion.div>
  );
};
