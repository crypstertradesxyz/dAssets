import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
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
  Activity
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

// Crisp, Professional SVG Sparkline
const Sparkline: React.FC<{ change24h: number; currentNav: number; width?: number; height?: number }> = ({ 
  change24h, 
  currentNav, 
  width = 84, 
  height = 24 
}) => {
  const pointsCount = 10;
  const isPositive = change24h >= 0;
  const startNav = currentNav / (1 + (change24h / 100));
  const points: { x: number; y: number }[] = [];
  
  for (let i = 0; i < pointsCount; i++) {
    const progress = i / (pointsCount - 1);
    const wave = Math.sin(progress * Math.PI) * (isPositive ? 0.3 : -0.3);
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
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
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
    { key: 'layer1', label: 'Layer 1 & 2' },
    { key: 'defi', label: 'DeFi' },
    { key: 'ai', label: 'AI & Compute' },
    { key: 'meme', label: 'Memes' },
  ];

  const leverageTiers: { key: LeverageTier; label: string }[] = [
    { key: 'all', label: 'All Multipliers' },
    { key: '2x', label: '2x Long' },
    { key: '3x', label: '3x Long' },
    { key: '5x', label: '5x Long' },
    { key: 'short', label: 'Inverse Short' },
  ];

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-slate-100 selection:bg-rh-green selection:text-black"
    >
      
      {/* Clean Institutional Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rh-green/10 border border-rh-green/25 text-xs font-semibold text-rh-green mb-3">
            <span className="w-2 h-2 rounded-full bg-rh-green animate-pulse"></span>
            <span>Robinhood Chain Mainnet (4663)</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-display">
            Markets Directory
          </h1>
          <p className="text-base text-slate-400 mt-2 font-normal max-w-2xl">
            Trade tokenized 2x, 3x, and 5x Long & Inverse Short positions with continuous on-chain Oracle NAV and zero liquidation risk.
          </p>
        </div>

        {/* Big Search Input & View Switcher */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search 270+ assets (BTC, ETH, SOL)..."
              className="w-full bg-[#0C1017] border border-white/[0.12] focus:border-rh-green/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition font-sans shadow-inner"
            />
          </div>

          <div className="flex items-center bg-[#0C1017] border border-white/[0.12] p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition ${
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
              className={`p-2 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Spacious Unified Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Category Segmented Control */}
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

        {/* Leverage Tier Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
          <span className="text-slate-400 text-xs font-sans mr-1 hidden sm:inline">Multiplier:</span>
          {leverageTiers.map((tier) => {
            const isSelected = leverageTier === tier.key;
            return (
              <button
                key={tier.key}
                onClick={() => setLeverageTier(tier.key)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
                  isSelected
                    ? tier.key === 'short'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-rh-green text-black shadow-sm'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                }`}
              >
                {tier.label}
              </button>
            );
          })}
        </div>

      </div>

      {/* Main Markets List / Grid */}
      {viewMode === 'table' ? (
        
        /* Clean Institutional Table */
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
                  <th className="py-4 px-4">Multiplier</th>
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
                  <th className="py-4 px-5 text-center hidden lg:table-cell">Robinhood CA</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredAssets.slice(0, 100).map((asset) => {
                  const isPositive = asset.change24h >= 0;
                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-white/[0.035] transition-colors duration-150 cursor-pointer group"
                      onClick={() => onSelectAsset(asset)}
                    >
                      {/* Asset Name & Icon */}
                      <td className="py-4 px-6 font-sans">
                        <div className="flex items-center space-x-3.5">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm"
                            style={{
                              backgroundColor: `${asset.iconColor}20`,
                              color: asset.iconColor,
                              border: `1px solid ${asset.iconColor}40`,
                            }}
                          >
                            {asset.underlying.slice(0, 3)}
                          </div>
                          <div>
                            <div className="font-bold text-base text-white group-hover:text-rh-green transition-colors">
                              {asset.symbol}
                            </div>
                            <div className="text-xs text-slate-400 font-sans">
                              {asset.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Multiplier Badge */}
                      <td className="py-4 px-4">
                        <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1 ${
                          asset.isShort 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/25' 
                            : 'bg-rh-green/10 text-rh-green border border-rh-green/25'
                        }`}>
                          <span>{asset.isShort ? '▼' : '▲'}</span>
                          <span>{Math.abs(asset.leverage)}x {asset.isShort ? 'Short' : 'Long'}</span>
                        </span>
                      </td>

                      {/* NAV */}
                      <td className="py-4 px-5 text-right font-mono font-bold text-base text-white">
                        ${asset.currentNav.toFixed(2)}
                      </td>

                      {/* 24h Change */}
                      <td className="py-4 px-5 text-right font-mono">
                        <span className={`text-sm font-bold inline-flex items-center justify-end gap-1 ${isPositive ? 'text-rh-green' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''}{asset.change24h}%
                        </span>
                      </td>

                      {/* 7D Trend Sparkline */}
                      <td className="py-4 px-5 text-center hidden md:table-cell">
                        <Sparkline change24h={asset.change24h} currentNav={asset.currentNav} width={84} height={24} />
                      </td>

                      {/* Underlying Spot Price */}
                      <td className="py-4 px-5 text-right text-sm font-mono text-slate-300 hidden sm:table-cell">
                        ${asset.indexPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* On-Chain Contract Address */}
                      <td className="py-4 px-5 text-center font-sans hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                        {asset.tokenAddress ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="inline-flex items-center gap-1 text-xs bg-rh-green/10 text-rh-green border border-rh-green/30 px-2 py-0.5 rounded-md font-mono font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              Deployed
                            </span>
                            <a
                              href={`https://robinhoodchain.blockscout.com/address/${asset.tokenAddress}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-mono text-slate-300 hover:text-white hover:underline flex items-center gap-1"
                            >
                              <span>{asset.tokenAddress.slice(0, 6)}...{asset.tokenAddress.slice(-4)}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            </a>
                            <CopyButton text={asset.tokenAddress} />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">
                            Ready on Mint
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-6 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => onSelectAsset(asset)}
                            className="px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white text-xs font-semibold transition border border-white/[0.08]"
                          >
                            Trade
                          </button>
                          <button
                            onClick={() => onMintAsset(asset)}
                            className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-200 text-black text-xs font-bold transition shadow-sm"
                          >
                            Mint
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredAssets.length > 100 && (
            <div className="py-4 px-6 text-center text-xs text-slate-400 border-t border-white/[0.08] font-mono bg-[#07090E]/70">
              Showing top 100 of {filteredAssets.length} markets. Use search to filter any specific pair.
            </div>
          )}
        </div>

      ) : (
        
        /* High-End Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssets.slice(0, 60).map((asset) => {
            const isPositive = asset.change24h >= 0;
            return (
              <div
                key={asset.id}
                onClick={() => onSelectAsset(asset)}
                className="glass-panel glass-panel-hover rounded-2xl p-6 space-y-4.5 cursor-pointer relative overflow-hidden group"
              >
                {/* Header: Token Logo, Symbol, Multiplier */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm"
                      style={{
                        backgroundColor: `${asset.iconColor}20`,
                        color: asset.iconColor,
                        border: `1px solid ${asset.iconColor}40`,
                      }}
                    >
                      {asset.underlying.slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-bold text-white text-lg font-display group-hover:text-rh-green transition-colors">
                        {asset.symbol}
                      </div>
                      <div className="text-xs text-slate-400 font-sans">
                        {asset.name}
                      </div>
                    </div>
                  </div>

                  <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
                    asset.isShort
                      ? 'bg-red-500/10 text-red-400 border border-red-500/25'
                      : 'bg-rh-green/10 text-rh-green border border-rh-green/25'
                  }`}>
                    {asset.isShort ? '▼' : '▲'} {Math.abs(asset.leverage)}x {asset.isShort ? 'Short' : 'Long'}
                  </span>
                </div>

                {/* Price & Volatility */}
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-sans font-medium block">
                      Oracle NAV Price
                    </span>
                    <div className="text-2xl font-bold text-white font-mono mt-0.5">
                      ${asset.currentNav.toFixed(2)}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-sans font-medium block">
                      24h Volatility
                    </span>
                    <div className={`text-base font-bold font-mono inline-flex items-center gap-1 mt-0.5 ${
                      isPositive ? 'text-rh-green' : 'text-red-400'
                    }`}>
                      {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span>{isPositive ? '+' : ''}{asset.change24h}%</span>
                    </div>
                  </div>
                </div>

                {/* Embedded Wide Sparkline */}
                <div className="bg-black/30 border border-white/[0.04] rounded-xl p-3 flex items-center justify-center">
                  <Sparkline change24h={asset.change24h} currentNav={asset.currentNav} width={280} height={44} />
                </div>

                {/* Specs Box */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5 text-xs font-mono space-y-1.5 text-slate-400">
                  <div className="flex justify-between">
                    <span>Spot Benchmark:</span>
                    <strong className="text-slate-200">${asset.indexPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Robinhood Chain:</span>
                    <strong className={asset.tokenAddress ? 'text-rh-green' : 'text-slate-400'}>
                      {asset.tokenAddress ? '0x5164...56F6' : 'Ready on Mint'}
                    </strong>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 pt-1 font-sans" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onSelectAsset(asset)}
                    className="flex-1 bg-white/[0.06] hover:bg-white/[0.12] text-white py-2.5 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-white/[0.08]"
                  >
                    <Activity className="w-4 h-4 text-rh-green" />
                    <span>View Feed</span>
                  </button>
                  <button
                    onClick={() => onMintAsset(asset)}
                    className="flex-1 bg-white hover:bg-slate-200 text-black py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Mint</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </motion.div>
  );
};
