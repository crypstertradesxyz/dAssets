import React, { useState, useMemo } from 'react';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Droplets, 
  CheckCircle2, 
  Filter,
  ArrowUpDown
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Markets</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            270+ Bounce.tech leveraged assets deployable to Robinhood Chain.
          </p>
        </div>

        {/* Clean Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search asset, e.g. BTC, ETH, SOL..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center space-x-1 border-b border-zinc-900 pb-3 overflow-x-auto text-xs">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
              selectedCategory === cat.key
                ? 'bg-zinc-850 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Clean Table Container */}
      <div className="border border-zinc-850 rounded-xl overflow-hidden bg-zinc-950/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-850 text-[11px] font-medium text-zinc-400">
                <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    <span>Asset</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                  </div>
                </th>
                <th className="py-3 px-3">Leverage</th>
                <th className="py-3 px-4 text-right cursor-pointer" onClick={() => handleSort('nav')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Oracle NAV</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right cursor-pointer" onClick={() => handleSort('change')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>24h Change</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-600" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center hidden md:table-cell">Robinhood Chain Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-mono">
              {filteredAssets.slice(0, 100).map((asset) => {
                const isPositive = asset.change24h >= 0;
                return (
                  <tr
                    key={asset.id}
                    className="hover:bg-zinc-900/40 transition cursor-pointer"
                    onClick={() => onSelectAsset(asset)}
                  >
                    {/* Name */}
                    <td className="py-3 px-4 font-sans">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px]"
                          style={{
                            backgroundColor: `${asset.iconColor}15`,
                            color: asset.iconColor,
                            border: `1px solid ${asset.iconColor}30`,
                          }}
                        >
                          {asset.underlying.slice(0, 3)}
                        </div>
                        <div>
                          <span className="font-semibold text-zinc-100">{asset.symbol}</span>
                          <span className="text-[11px] text-zinc-500 ml-1.5">({asset.underlyingName})</span>
                        </div>
                      </div>
                    </td>

                    {/* Leverage */}
                    <td className="py-3 px-3">
                      <span className="text-[11px] text-zinc-400">
                        {Math.abs(asset.leverage)}x {asset.isShort ? 'Short' : 'Long'}
                      </span>
                    </td>

                    {/* NAV */}
                    <td className="py-3 px-4 text-right text-zinc-100 font-semibold">
                      ${asset.currentNav.toFixed(2)}
                    </td>

                    {/* 24h Change */}
                    <td className="py-3 px-4 text-right">
                      <span className={`text-[11px] ${isPositive ? 'text-rh-green' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{asset.change24h}%
                      </span>
                    </td>

                    {/* Status / CA */}
                    <td className="py-3 px-4 text-center font-sans hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                      {asset.tokenAddress ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-[11px] font-mono text-zinc-300">
                            {asset.tokenAddress.slice(0, 6)}...{asset.tokenAddress.slice(-4)}
                          </span>
                          <CopyButton text={asset.tokenAddress} />
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-500">
                          Available to Mint
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2 font-sans">
                        <button
                          onClick={() => onMintAsset(asset)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-medium transition"
                        >
                          Mint
                        </button>
                        <button
                          onClick={() => onSeedPool(asset)}
                          className="px-2.5 py-1 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs transition"
                        >
                          Seed LP
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
          <div className="py-3 px-4 text-center text-xs text-zinc-500 border-t border-zinc-900 font-mono">
            Showing top 100 of {filteredAssets.length} markets. Use search for all pairs.
          </div>
        )}
      </div>

    </div>
  );
};
