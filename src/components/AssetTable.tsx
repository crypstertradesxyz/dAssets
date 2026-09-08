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
  Zap,
  Activity,
  ArrowRight,
  SlidersHorizontal
} from 'lucide-react';
import { LeveragedAsset, AssetCategory } from '../types';
import { CopyButton } from './CopyButton';
import { TokenLogo } from './TokenLogo';
import { getUniswapSwapUrl } from '../utils/uniswap';

interface AssetTableProps {
  assets: LeveragedAsset[];
  onSelectAsset: (asset: LeveragedAsset) => void;
  onMintAsset: (asset: LeveragedAsset) => void;
  onSeedPool?: (asset: LeveragedAsset) => void;
}

type GlobalLeverageFilter = 'all' | '2x' | '3x' | '5x' | 'short';
type ViewMode = 'grid' | 'table';

interface AssetGroup {
  underlying: string;
  name: string;
  category: AssetCategory;
  spotPrice: number;
  iconColor: string;
  tokens: LeveragedAsset[];
}

// Crisp, Smooth SVG Sparkline
const Sparkline: React.FC<{ change24h: number; currentNav: number; width?: number; height?: number }> = ({ 
  change24h, 
  currentNav, 
  width = 120, 
  height = 32 
}) => {
  const pointsCount = 12;
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
    const normY = height - ((p.y - min) / range) * (height - 8) - 4;
    return `${p.x.toFixed(1)},${normY.toFixed(1)}`;
  });

  const polylineStr = coords.join(' ');
  const polygonStr = `0,${height} ${coords.join(' ')} ${width},${height}`;
  const strokeColor = isPositive ? '#00C805' : '#EF4444';
  const fillGradientId = `spark-${Math.abs(Math.round(currentNav * 1000))}-${Math.abs(Math.round(change24h * 100))}-${width}`;

  return (
    <svg width={width} height={height} className="overflow-visible w-full">
      <defs>
        <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={polygonStr} fill={`url(#${fillGradientId})`} />
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
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
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('all');
  const [globalLeverage, setGlobalLeverage] = useState<GlobalLeverageFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid'); // Default to modern card grid for Style C
  const [selectedMultiplierByAsset, setSelectedMultiplierByAsset] = useState<Record<string, number>>({});
  const [sortField, setSortField] = useState<'spot' | 'nav' | 'change' | 'name'>('spot');
  const [sortAsc, setSortAsc] = useState(false);

  const categories: { key: AssetCategory; label: string }[] = [
    { key: 'all', label: 'All Markets' },
    { key: 'majors', label: 'Majors' },
    { key: 'layer1', label: 'Layer 1 & 2' },
    { key: 'defi', label: 'DeFi' },
    { key: 'ai', label: 'AI & Compute' },
    { key: 'meme', label: 'Memes' },
  ];

  const globalLeverageTiers: { key: GlobalLeverageFilter; label: string }[] = [
    { key: 'all', label: 'All Multipliers' },
    { key: '2x', label: '▲ 2x Long' },
    { key: '3x', label: '▲ 3x Long' },
    { key: '5x', label: '▲ 5x Long' },
    { key: 'short', label: '▼ Inverse Short' },
  ];

  // Group tokens by underlying asset
  const groupedAssets = useMemo(() => {
    const map = new Map<string, AssetGroup>();

    for (const token of assets) {
      if (!map.has(token.underlying)) {
        map.set(token.underlying, {
          underlying: token.underlying,
          name: token.underlyingName || token.name,
          category: token.category,
          spotPrice: token.indexPrice,
          iconColor: token.iconColor,
          tokens: [],
        });
      }
      map.get(token.underlying)!.tokens.push(token);
    }

    // Sort tokens within each group by leverage ascending (e.g. 2, 3, 5, -1, -2, -3)
    map.forEach(group => {
      group.tokens.sort((a, b) => {
        if (a.isShort !== b.isShort) return a.isShort ? 1 : -1;
        return a.leverage - b.leverage;
      });
    });

    return Array.from(map.values());
  }, [assets]);

  // Helper to determine the currently active token for a group
  const getActiveToken = (group: AssetGroup): LeveragedAsset => {
    // If a global leverage tier is active, prefer that
    if (globalLeverage === '2x') {
      const found = group.tokens.find(t => t.leverage === 2);
      if (found) return found;
    }
    if (globalLeverage === '3x') {
      const found = group.tokens.find(t => t.leverage === 3);
      if (found) return found;
    }
    if (globalLeverage === '5x') {
      const found = group.tokens.find(t => t.leverage === 5);
      if (found) return found;
    }
    if (globalLeverage === 'short') {
      const found = group.tokens.find(t => t.isShort);
      if (found) return found;
    }

    // Check individual card selection
    const customLev = selectedMultiplierByAsset[group.underlying];
    if (customLev !== undefined) {
      const found = group.tokens.find(t => t.leverage === customLev);
      if (found) return found;
    }

    // Default: Prefer 3x Long if available, otherwise first long, otherwise first token
    return group.tokens.find(t => t.leverage === 3) || 
           group.tokens.find(t => !t.isShort) || 
           group.tokens[0];
  };

  const handleSort = (field: 'spot' | 'nav' | 'change' | 'name') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleSelectMultiplier = (underlying: string, leverage: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMultiplierByAsset(prev => ({
      ...prev,
      [underlying]: leverage,
    }));
  };

  // Filter groups
  const filteredGroups = useMemo(() => {
    return groupedAssets.filter((group) => {
      // Category filter
      if (selectedCategory !== 'all' && group.category !== selectedCategory) {
        return false;
      }

      // Global leverage filter
      if (globalLeverage === '2x' && !group.tokens.some(t => t.leverage === 2)) return false;
      if (globalLeverage === '3x' && !group.tokens.some(t => t.leverage === 3)) return false;
      if (globalLeverage === '5x' && !group.tokens.some(t => t.leverage === 5)) return false;
      if (globalLeverage === 'short' && !group.tokens.some(t => t.isShort)) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesUnderlying = group.underlying.toLowerCase().includes(q);
        const matchesName = group.name.toLowerCase().includes(q);
        const matchesToken = group.tokens.some(t => t.symbol.toLowerCase().includes(q));
        if (!matchesUnderlying && !matchesName && !matchesToken) return false;
      }

      return true;
    }).sort((a, b) => {
      let diff = 0;
      if (sortField === 'spot') diff = b.spotPrice - a.spotPrice;
      else if (sortField === 'name') diff = a.name.localeCompare(b.name);
      else if (sortField === 'nav') diff = getActiveToken(b).currentNav - getActiveToken(a).currentNav;
      else if (sortField === 'change') diff = getActiveToken(b).change24h - getActiveToken(a).change24h;
      return sortAsc ? -diff : diff;
    });
  }, [groupedAssets, selectedCategory, globalLeverage, search, sortField, sortAsc, selectedMultiplierByAsset]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-slate-100 selection:bg-rh-green selection:text-black"
    >
      
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rh-green/10 border border-rh-green/25 text-xs font-semibold text-rh-green mb-3">
            <span className="w-2 h-2 rounded-full bg-rh-green animate-pulse"></span>
            <span>Robinhood Chain Mainnet (Chain 4663)</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-display">
            Token Markets
          </h1>
          <p className="text-base text-slate-400 mt-2 font-normal max-w-2xl">
            Select an asset, customize your leverage multiplier (2x, 3x, 5x, or Inverse Short), and trade with continuous Oracle NAV & zero liquidation risk.
          </p>
        </div>

        {/* Search Bar & View Mode Toggle */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search 270+ assets (BTC, ETH, SOL)..."
              className="w-full bg-[#0D111A] border border-white/[0.12] focus:border-rh-green/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition font-sans shadow-inner"
            />
          </div>

          <div className="flex items-center bg-[#0D111A] border border-white/[0.12] p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Modern Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Dense Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modern Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Category Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs sm:text-sm font-medium">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-4 py-2 rounded-xl transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Global Multiplier Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
          <span className="text-slate-400 text-xs font-sans mr-1 hidden sm:inline">Multiplier:</span>
          {globalLeverageTiers.map((tier) => {
            const isSelected = globalLeverage === tier.key;
            return (
              <button
                key={tier.key}
                onClick={() => setGlobalLeverage(tier.key)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
                  isSelected
                    ? tier.key === 'short'
                      ? 'bg-red-500 text-white shadow-sm font-bold'
                      : 'bg-rh-green text-black shadow-sm font-bold'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                }`}
              >
                {tier.label}
              </button>
            );
          })}
        </div>

      </div>

      {/* Main Markets Content */}
      {viewMode === 'grid' ? (
        
        /* STYLE C: Modern High-Octane DEX Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredGroups.map((group) => {
            const activeToken = getActiveToken(group);
            const isPos = activeToken.change24h >= 0;

            return (
              <motion.div
                key={group.underlying}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => onSelectAsset(activeToken)}
                className="bg-[#0B0F19]/90 border border-white/[0.08] hover:border-rh-green/40 hover:shadow-[0_12px_36px_rgba(0,200,5,0.14)] rounded-2xl p-5 space-y-4 cursor-pointer relative overflow-hidden transition-all duration-200 group flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Card Header: Token Logo, Symbol, Underlying Spot */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <TokenLogo 
                        underlying={group.underlying} 
                        iconColor={group.iconColor} 
                        size="lg" 
                        rounded="xl" 
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-white text-base font-display group-hover:text-rh-green transition-colors">
                            {activeToken.symbol}
                          </h3>
                          {activeToken.tokenAddress && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rh-green" title="Deployed on Robinhood Chain" />
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-sans">
                          {group.name}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">Spot Index</span>
                      <span className="text-xs font-bold text-slate-200">
                        ${group.spotPrice >= 1000 ? group.spotPrice.toLocaleString(undefined, { maximumFractionDigits: 0 }) : group.spotPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Pricing & 24h Volatility Row */}
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-medium block">
                        Oracle NAV Price
                      </span>
                      <div className="text-2xl font-bold text-white font-mono mt-0.5">
                        ${activeToken.currentNav.toFixed(2)}
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-medium block">
                        24h Volatility
                      </span>
                      <div className={`text-sm font-bold inline-flex items-center gap-0.5 mt-0.5 ${
                        isPos ? 'text-rh-green' : 'text-red-400'
                      }`}>
                        {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span>{isPos ? '+' : ''}{activeToken.change24h}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Inline Multiplier Pill Selectors */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-medium block">
                      Target Multiplier:
                    </span>
                    <div className="flex flex-wrap items-center gap-1 font-mono text-xs" onClick={(e) => e.stopPropagation()}>
                      {group.tokens.map((tok) => {
                        const isSelected = tok.leverage === activeToken.leverage;
                        const label = tok.isShort ? `${Math.abs(tok.leverage)}x Short` : `${tok.leverage}x Long`;

                        return (
                          <button
                            key={tok.symbol}
                            onClick={(e) => handleSelectMultiplier(group.underlying, tok.leverage, e)}
                            className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${
                              isSelected
                                ? tok.isShort
                                  ? 'bg-red-500 text-white shadow-sm'
                                  : 'bg-rh-green text-black shadow-sm'
                                : 'bg-white/[0.05] hover:bg-white/[0.12] text-slate-300 border border-white/[0.06]'
                            }`}
                          >
                            {tok.isShort ? `▼ ${Math.abs(tok.leverage)}S` : `▲ ${tok.leverage}L`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clean SVG Trend Chart */}
                  <div className="bg-black/30 border border-white/[0.04] rounded-xl p-2.5 flex items-center justify-center">
                    <Sparkline change24h={activeToken.change24h} currentNav={activeToken.currentNav} width={240} height={36} />
                  </div>
                </div>

                {/* Card Action Buttons Footer */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06] font-sans" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={getUniswapSwapUrl(activeToken.tokenAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 hover:text-pink-200 py-2.5 px-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-pink-500/30 cursor-pointer shadow-sm"
                    title={`Trade ${activeToken.symbol} on Uniswap`}
                  >
                    <img src="/logos/uni.png" alt="Uniswap" className="w-3.5 h-3.5 rounded-full" />
                    <span>Trade</span>
                  </a>
                  <button
                    onClick={() => onMintAsset(activeToken)}
                    className="flex-1 bg-white hover:bg-slate-200 text-black py-2.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Mint</span>
                  </button>
                  <a
                    href={`/terminal/${activeToken.symbol}`}
                    onClick={(e) => {
                      if (!e.metaKey && !e.ctrlKey) {
                        e.preventDefault();
                        onSelectAsset(activeToken);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] text-slate-300 hover:text-white transition border border-white/[0.08] cursor-pointer flex items-center justify-center"
                    title="Live Oracle Feed"
                  >
                    <Activity className="w-3.5 h-3.5 text-rh-green" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>

      ) : (

        /* Dense Table View (When Toggled) */
        <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-white/[0.08]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#07090E]/90 text-xs font-mono text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6 cursor-pointer select-none" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1.5">
                      <span>Market Asset</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </th>
                  <th className="py-4 px-4">Multiplier Tiers</th>
                  <th className="py-4 px-5 text-right cursor-pointer select-none" onClick={() => handleSort('nav')}>
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Oracle NAV</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </th>
                  <th className="py-4 px-5 text-right cursor-pointer select-none" onClick={() => handleSort('change')}>
                    <div className="flex items-center justify-end gap-1.5">
                      <span>24h Volatility</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </th>
                  <th className="py-4 px-5 text-center hidden md:table-cell">
                    <span>7D Trend</span>
                  </th>
                  <th className="py-4 px-5 text-right cursor-pointer select-none hidden sm:table-cell" onClick={() => handleSort('spot')}>
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Spot Benchmark</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredGroups.map((group) => {
                  const activeToken = getActiveToken(group);
                  const isPos = activeToken.change24h >= 0;

                  return (
                    <tr
                      key={group.underlying}
                      className="hover:bg-white/[0.035] transition-colors duration-150 cursor-pointer group"
                      onClick={() => onSelectAsset(activeToken)}
                    >
                      {/* Asset Info */}
                      <td className="py-4 px-6 font-sans">
                        <div className="flex items-center space-x-3.5">
                          <TokenLogo 
                            underlying={group.underlying} 
                            iconColor={group.iconColor} 
                            size="md" 
                            rounded="lg" 
                          />
                          <div>
                            <div className="font-bold text-base text-white group-hover:text-rh-green transition-colors">
                              {activeToken.symbol}
                            </div>
                            <div className="text-xs text-slate-400 font-sans">
                              {group.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Multiplier Tiers */}
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 font-mono text-xs">
                          {group.tokens.map((tok) => {
                            const isSelected = tok.leverage === activeToken.leverage;
                            return (
                              <button
                                key={tok.symbol}
                                onClick={(e) => handleSelectMultiplier(group.underlying, tok.leverage, e)}
                                className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                                  isSelected
                                    ? tok.isShort
                                      ? 'bg-red-500 text-white'
                                      : 'bg-rh-green text-black'
                                    : 'bg-white/[0.05] hover:bg-white/[0.12] text-slate-300'
                                }`}
                              >
                                {tok.isShort ? `▼${Math.abs(tok.leverage)}S` : `▲${tok.leverage}L`}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Oracle NAV */}
                      <td className="py-4 px-5 text-right font-mono font-bold text-base text-white">
                        ${activeToken.currentNav.toFixed(2)}
                      </td>

                      {/* 24h Volatility */}
                      <td className="py-4 px-5 text-right font-mono">
                        <span className={`text-sm font-bold inline-flex items-center justify-end gap-1 ${isPos ? 'text-rh-green' : 'text-red-400'}`}>
                          {isPos ? '+' : ''}{activeToken.change24h}%
                        </span>
                      </td>

                      {/* Sparkline */}
                      <td className="py-4 px-5 text-center hidden md:table-cell">
                        <Sparkline change24h={activeToken.change24h} currentNav={activeToken.currentNav} width={90} height={24} />
                      </td>

                      {/* Spot Price */}
                      <td className="py-4 px-5 text-right text-sm font-mono text-slate-300 hidden sm:table-cell">
                        ${group.spotPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={getUniswapSwapUrl(activeToken.tokenAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 hover:text-pink-200 text-xs font-semibold transition border border-pink-500/30 inline-flex items-center gap-1 cursor-pointer shadow-sm"
                            title={`Trade ${activeToken.symbol} on Uniswap`}
                          >
                            <img src="/logos/uni.png" alt="Uniswap" className="w-3 h-3 rounded-full" />
                            <span>Trade</span>
                          </a>
                          <button
                            onClick={() => onMintAsset(activeToken)}
                            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-200 text-black text-xs font-bold transition shadow-sm"
                          >
                            Mint
                          </button>
                          <a
                            href={`/terminal/${activeToken.symbol}`}
                            onClick={(e) => {
                              if (!e.metaKey && !e.ctrlKey) {
                                e.preventDefault();
                                onSelectAsset(activeToken);
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white text-xs font-medium transition border border-white/[0.08] cursor-pointer"
                          >
                            Feed
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      )}

    </motion.div>
  );
};
