import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ArrowUpDown,
  ExternalLink
} from 'lucide-react';
import { LeveragedAsset, AssetCategory } from '../types';
import { CopyButton } from './CopyButton';

interface AssetTableProps {
  assets: LeveragedAsset[];
  onSelectAsset: (asset: LeveragedAsset) => void;
  onMintAsset: (asset: LeveragedAsset) => void;
  onSeedPool: (asset: LeveragedAsset) => void;
}

export const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  onSelectAsset,
  onMintAsset,
  onSeedPool,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('all');
  const [sortField, setSortField] = useState<'volume' | 'nav' | 'change' | 'name'>('volume');
  const [sortAsc, setSortAsc] = useState(false);

  const categories: { key: AssetCategory; label: string }[] = [
    { key: 'all', label: 'All Markets' },
    { key: 'majors', label: 'Majors' },
    { key: 'layer1', label: 'Layer 1 / 2' },
    { key: 'defi', label: 'DeFi' },
    { key: 'ai', label: 'AI & Compute' },
    { key: 'meme', label: 'Memes' },
  ];

  const filteredAssets = useMemo(() => {
    return assets
      .filter((a) => {
        if (selectedCategory !== 'all' && a.category !== selectedCategory) {
          return false;
        }
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
        if (sortField === 'volume') diff = b.volume24h - a.volume24h;
        else if (sortField === 'nav') diff = b.currentNav - a.currentNav;
        else if (sortField === 'change') diff = b.change24h - a.change24h;
        else if (sortField === 'name') diff = a.symbol.localeCompare(b.symbol);
        return sortAsc ? -diff : diff;
      });
  }, [assets, search, selectedCategory, sortField, sortAsc]);

  const handleSort = (field: 'volume' | 'nav' | 'change' | 'name') => {
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
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-slate-300 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-rh-green"></span>
              <span>270+ Leveraged Positions • Robinhood Chain (4663)</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">
              Markets Directory
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed font-sans">
              Permissionless leveraged tokens with continuous rebalancing, zero margin calls, and live Oracle NAV pricing.
            </p>
          </div>

          {/* Clean Search Input */}
          <div className="relative w-full sm:w-72 self-start sm:self-center">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbol (e.g. BTC, ETH, SOL)..."
              className="w-full bg-[#090C10] border border-white/[0.08] focus:border-white/[0.25] rounded-md pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition font-mono"
            />
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 font-mono">
          <div className="bg-[#090C10] border border-white/[0.08] rounded-lg p-4 space-y-1">
            <span className="text-[11px] text-slate-500 font-sans font-medium uppercase tracking-wider block">
              Active Catalog
            </span>
            <div className="text-xl sm:text-2xl font-bold text-white">
              {assets.length} Pairs
            </div>
            <span className="text-[10px] text-slate-400 font-sans">3x & 5x Long/Short</span>
          </div>

          <div className="bg-[#090C10] border border-white/[0.08] rounded-lg p-4 space-y-1">
            <span className="text-[11px] text-slate-500 font-sans font-medium uppercase tracking-wider block">
              Liquidation Risk
            </span>
            <div className="text-xl sm:text-2xl font-bold text-rh-green">
              0% Calls
            </div>
            <span className="text-[10px] text-slate-400 font-sans">No margin debt</span>
          </div>

          <div className="bg-[#090C10] border border-white/[0.08] rounded-lg p-4 space-y-1">
            <span className="text-[11px] text-slate-500 font-sans font-medium uppercase tracking-wider block">
              Automated Rebalance
            </span>
            <div className="text-xl sm:text-2xl font-bold text-white">
              Every 8h
            </div>
            <span className="text-[10px] text-slate-400 font-sans">Vault volatility peg</span>
          </div>

          <div className="bg-[#090C10] border border-white/[0.08] rounded-lg p-4 space-y-1">
            <span className="text-[11px] text-slate-500 font-sans font-medium uppercase tracking-wider block">
              Gas Settlement
            </span>
            <div className="text-xl sm:text-2xl font-bold text-rh-green">
              ~$0.05
            </div>
            <span className="text-[10px] text-slate-400 font-sans">Robinhood Chain L2</span>
          </div>
        </div>
      </div>

      {/* Category Tabs with Animated Indicator */}
      <div className="flex items-center space-x-1 border-b border-white/[0.06] pb-3 overflow-x-auto text-xs">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`relative px-3 py-1.5 rounded-md font-medium transition whitespace-nowrap ${
                isSelected
                  ? 'text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeCategoryTab"
                  className="absolute inset-0 bg-white/[0.08] rounded-md -z-10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* High-Craft Table */}
      <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-[#090C10] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#07090D] text-[11px] font-mono text-slate-500 uppercase">
                <th className="py-3 px-4 cursor-pointer select-none" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>Asset</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th className="py-3 px-3">Leverage</th>
                <th className="py-3 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('nav')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Oracle NAV</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('change')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>24h Change</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer select-none hidden sm:table-cell" onClick={() => handleSort('volume')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>24h Volume</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center hidden md:table-cell">On-Chain Contract</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono">
              {filteredAssets.slice(0, 100).map((asset) => {
                const isPositive = asset.change24h >= 0;
                return (
                  <tr
                    key={asset.id}
                    className="hover:bg-white/[0.025] transition-colors duration-150 cursor-pointer"
                    onClick={() => onSelectAsset(asset)}
                  >
                    {/* Asset Name */}
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center font-bold text-[10px]"
                          style={{
                            backgroundColor: `${asset.iconColor}15`,
                            color: asset.iconColor,
                            border: `1px solid ${asset.iconColor}30`,
                          }}
                        >
                          {asset.underlying.slice(0, 3)}
                        </div>
                        <div>
                          <span className="font-semibold text-white">{asset.symbol}</span>
                          <span className="text-[11px] text-slate-500 ml-1.5 font-mono">({asset.underlyingName})</span>
                        </div>
                      </div>
                    </td>

                    {/* Leverage */}
                    <td className="py-3.5 px-3">
                      <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${
                        asset.isShort 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : 'bg-white/[0.04] text-slate-300 border border-white/[0.08]'
                      }`}>
                        {Math.abs(asset.leverage)}x {asset.isShort ? 'Short' : 'Long'}
                      </span>
                    </td>

                    {/* NAV */}
                    <td className="py-3.5 px-4 text-right text-white font-semibold">
                      ${asset.currentNav.toFixed(2)}
                    </td>

                    {/* 24h Change */}
                    <td className="py-3.5 px-4 text-right">
                      <span className={`text-[11px] font-semibold flex items-center justify-end gap-0.5 ${isPositive ? 'text-rh-green' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{asset.change24h}%
                      </span>
                    </td>

                    {/* 24h Volume */}
                    <td className="py-3.5 px-4 text-right text-slate-400 hidden sm:table-cell">
                      ${(asset.volume24h / 1_000_000).toFixed(2)}M
                    </td>

                    {/* On-Chain Contract Address (Copyable) */}
                    <td className="py-3.5 px-4 text-center font-sans hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                      {asset.tokenAddress ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={`https://robinhoodchain.blockscout.com/address/${asset.tokenAddress}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-mono text-slate-300 hover:text-white hover:underline flex items-center gap-1"
                          >
                            <span>{asset.tokenAddress.slice(0, 6)}...{asset.tokenAddress.slice(-4)}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </a>
                          <CopyButton text={asset.tokenAddress} />
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">
                          Ready to Deploy
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
                          className="px-3 py-1 rounded bg-white hover:bg-slate-200 text-black text-xs font-semibold transition shadow-sm"
                        >
                          Mint
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onSeedPool(asset)}
                          className="px-2.5 py-1 rounded hover:bg-white/[0.06] text-slate-400 hover:text-white text-xs transition"
                        >
                          Seed LP
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
          <div className="py-3 px-4 text-center text-xs text-slate-500 border-t border-white/[0.06] font-mono">
            Displaying top 100 of {filteredAssets.length} markets. Use search to filter any specific pair.
          </div>
        )}
      </div>

    </motion.div>
  );
};
