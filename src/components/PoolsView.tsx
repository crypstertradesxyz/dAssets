import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Droplets, 
  Plus, 
  Search, 
  ExternalLink, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  ArrowUpRight,
  Zap,
  Sparkles
} from 'lucide-react';
import { LeveragedAsset, WalletState, LiquidityPool } from '../types';
import { BridgeService } from '../services/bridge';
import { CopyButton } from './CopyButton';
import { CreatePoolModal } from './CreatePoolModal';

interface PoolsViewProps {
  assets: LeveragedAsset[];
  wallet: WalletState;
  onOpenWalletModal: () => void;
  onMintAsset: (asset: LeveragedAsset) => void;
}

export const PoolsView: React.FC<PoolsViewProps> = ({
  assets,
  wallet,
  onOpenWalletModal,
  onMintAsset,
}) => {
  const [pools, setPools] = useState<LiquidityPool[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'majors' | 'high_apr' | 'shorts'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAssetForPool, setSelectedAssetForPool] = useState<LeveragedAsset | undefined>(undefined);

  useEffect(() => {
    const bridge = BridgeService.getInstance();
    const unsubscribe = bridge.subscribePools((updatedPools) => {
      setPools(updatedPools);
    });
    return () => unsubscribe();
  }, []);

  const totalTvl = pools.reduce((acc, p) => acc + (p.tvlUsd || p.usdcAmount * 2), 0);
  const totalVolume = pools.reduce((acc, p) => acc + (p.volume24h || 0), 0);
  const maxApr = pools.length > 0 ? Math.max(...pools.map(p => p.apr)) : 0;

  // Filter logic
  const filteredPools = pools.filter(pool => {
    const matchesSearch = 
      pool.assetSymbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pool.pairedSymbol || 'USDC').toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.poolAddress.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === 'majors') {
      return pool.assetSymbol.includes('BTC') || pool.assetSymbol.includes('ETH') || pool.assetSymbol.includes('SOL');
    }
    if (selectedCategory === 'high_apr') {
      return pool.apr >= 35.0;
    }
    if (selectedCategory === 'shorts') {
      const asset = assets.find(a => a.symbol === pool.assetSymbol);
      return asset?.isShort;
    }
    return true;
  });

  const handleOpenCreate = (asset?: LeveragedAsset) => {
    setSelectedAssetForPool(asset);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-slate-100 selection:bg-rh-green selection:text-black">
      
      {/* Top Banner / Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-xs font-semibold text-pink-400 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse"></span>
              <span>Uniswap v3 AMM • Robinhood Chain Mainnet (4663)</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">
              Liquidity Pools & Showcase
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Permissionless Uniswap v3 concentrated liquidity for leveraged dAssets. Provide liquidity to earn trading fees, seed new trading pairs, and explore live community pools.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOpenCreate()}
              className="flex items-center gap-2 bg-white hover:bg-slate-200 text-black font-semibold text-xs px-4 py-2.5 rounded-md transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Uniswap Pool</span>
            </motion.button>
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 font-mono">
          <div className="bg-[#090C10] border border-white/[0.08] rounded-lg p-4 space-y-1">
            <span className="text-[11px] text-slate-500 font-sans font-medium uppercase tracking-wider block">
              Total AMM TVL
            </span>
            <div className="text-xl sm:text-2xl font-bold text-white">
              ${totalTvl.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-slate-400 font-sans">Across {pools.length} active pools</span>
          </div>

          <div className="bg-[#090C10] border border-white/[0.08] rounded-lg p-4 space-y-1">
            <span className="text-[11px] text-slate-500 font-sans font-medium uppercase tracking-wider block">
              24h Pool Volume
            </span>
            <div className="text-xl sm:text-2xl font-bold text-white">
              ${totalVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-slate-400 font-sans">
              Robinhood Chain (4663)
            </span>
          </div>

          <div className="bg-[#090C10] border border-white/[0.08] rounded-lg p-4 space-y-1">
            <span className="text-[11px] text-slate-500 font-sans font-medium uppercase tracking-wider block">
              Top Yield APR
            </span>
            <div className="text-xl sm:text-2xl font-bold text-rh-green">
              {maxApr.toFixed(1)}% APR
            </div>
            <span className="text-[10px] text-slate-400 font-sans">Concentrated fee tiers</span>
          </div>

          <div className="bg-[#090C10] border border-white/[0.08] rounded-lg p-4 space-y-1">
            <span className="text-[11px] text-slate-500 font-sans font-medium uppercase tracking-wider block">
              AMM Settlement
            </span>
            <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-rh-green"></span>
              <span>Uniswap v3 Core</span>
            </div>
            <span className="text-[10px] text-slate-400 font-sans">Robinhood Chain Verified</span>
          </div>
        </div>
      </div>

      {pools.length === 0 ? (
        <div className="bg-[#090C10] border border-white/[0.08] rounded-2xl p-8 sm:p-14 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-rh-green">
            <Droplets className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-base sm:text-lg font-bold text-white font-display">
              No Active Liquidity Pools on Robinhood Chain
            </h2>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              No AMM pairs have been funded on Robinhood Chain Mainnet (4663) yet. Be the first liquidity provider to seed a pool and earn swap fees on leveraged dAssets.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => handleOpenCreate()}
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-black font-semibold text-xs px-5 py-2.5 rounded-lg transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Seed First AMM Pool</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Featured Pools Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 font-sans flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-rh-green" />
                <span>Featured Pools</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">Live On-Chain Pools</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pools.slice(0, 3).map((pool, idx) => {
                const asset = assets.find(a => a.symbol === pool.assetSymbol);
                return (
                  <motion.div
                    key={pool.poolAddress}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-[#090C10] border border-white/[0.08] hover:border-white/[0.18] rounded-xl p-5 space-y-4 transition group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div 
                          className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs"
                          style={{
                            backgroundColor: asset ? `${asset.iconColor}20` : '#38BDF820',
                            color: asset ? asset.iconColor : '#38BDF8',
                            border: `1px solid ${asset ? asset.iconColor : '#38BDF8'}40`,
                          }}
                        >
                          {pool.assetSymbol.replace('d', '').slice(0, 3)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm font-mono flex items-center gap-1.5">
                            <span>{pool.assetSymbol}</span>
                            <span className="text-slate-500">/</span>
                            <span className="text-slate-300">{pool.pairedSymbol || 'USDC'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans">
                            Uniswap v3 • {pool.feeTier || '0.30%'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase text-slate-500 font-mono block">Estimated APR</span>
                        <span className="text-base font-bold text-rh-green font-mono">{pool.apr}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-black/30 border border-white/[0.04] p-2.5 rounded-lg text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-sans">Liquidity (TVL)</span>
                        <span className="font-semibold text-white">
                          ${(pool.tvlUsd || pool.usdcAmount * 2).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-sans">24h Volume</span>
                        <span className="font-semibold text-slate-200">
                          ${(pool.volume24h || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleOpenCreate(asset)}
                        className="flex-1 bg-white/[0.06] hover:bg-white/[0.12] text-white py-2 px-3 rounded-md text-xs font-semibold transition flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-rh-green" />
                        <span>Add Liquidity</span>
                      </button>
                      <a
                        href={`https://robinhoodchain.blockscout.com/address/${pool.poolAddress}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-md text-slate-400 hover:text-white transition"
                        title="View Pool on Blockscout"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}


      {/* Directory Section with Search & Categories */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
          <div className="flex items-center space-x-1 overflow-x-auto text-xs font-medium">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-md transition ${selectedCategory === 'all' ? 'bg-white text-black font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              All Pools ({pools.length})
            </button>
            <button
              onClick={() => setSelectedCategory('majors')}
              className={`px-3 py-1.5 rounded-md transition ${selectedCategory === 'majors' ? 'bg-white text-black font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Majors (BTC / ETH / SOL)
            </button>
            <button
              onClick={() => setSelectedCategory('high_apr')}
              className={`px-3 py-1.5 rounded-md transition ${selectedCategory === 'high_apr' ? 'bg-white text-black font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              High APR (&gt;35%)
            </button>
            <button
              onClick={() => setSelectedCategory('shorts')}
              className={`px-3 py-1.5 rounded-md transition ${selectedCategory === 'shorts' ? 'bg-white text-black font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Shorts & Inverse
            </button>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search pool pair or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#090C10] border border-white/[0.08] focus:border-white/[0.25] rounded-md py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-slate-600 focus:outline-none transition font-mono"
            />
          </div>
        </div>

        {/* Pools Table */}
        <div className="bg-[#090C10] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#07090D] text-slate-500 font-mono text-[11px] uppercase">
                  <th className="py-3 px-4 font-semibold">Pool Pair</th>
                  <th className="py-3 px-4 font-semibold">Fee Tier</th>
                  <th className="py-3 px-4 font-semibold">TVL (Liquidity)</th>
                  <th className="py-3 px-4 font-semibold">24h Volume</th>
                  <th className="py-3 px-4 font-semibold">Yield (APR)</th>
                  <th className="py-3 px-4 font-semibold">Pool Contract</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-mono">
                {filteredPools.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-sans text-xs">
                      No liquidity pools match your search. Click "Create Uniswap Pool" to deploy the first one.
                    </td>
                  </tr>
                ) : (
                  filteredPools.map((pool) => {
                    const asset = assets.find(a => a.symbol === pool.assetSymbol);
                    return (
                      <tr 
                        key={pool.poolAddress}
                        className="hover:bg-white/[0.02] transition"
                      >
                        {/* Pair Name */}
                        <td className="py-3.5 px-4 font-sans">
                          <div className="flex items-center space-x-2.5">
                            <div 
                              className="w-7 h-7 rounded flex items-center justify-center font-bold text-[10px] font-mono"
                              style={{
                                backgroundColor: asset ? `${asset.iconColor}20` : '#38BDF820',
                                color: asset ? asset.iconColor : '#38BDF8',
                                border: `1px solid ${asset ? asset.iconColor : '#38BDF8'}40`,
                              }}
                            >
                              {pool.assetSymbol.replace('d', '').slice(0, 3)}
                            </div>
                            <div>
                              <div className="font-bold text-white font-mono flex items-center gap-1 text-xs">
                                <span>{pool.assetSymbol}</span>
                                <span className="text-slate-500">/</span>
                                <span>{pool.pairedSymbol || 'USDC'}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-sans">
                                {asset ? asset.name : 'Leveraged Token'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Fee Tier */}
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] bg-white/[0.06] text-slate-300 border border-white/[0.08] font-bold">
                            {pool.feeTier || '0.30%'}
                          </span>
                        </td>

                        {/* TVL */}
                        <td className="py-3.5 px-4">
                          <div className="text-white font-semibold">
                            ${(pool.tvlUsd || pool.usdcAmount * 2).toLocaleString()}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {pool.assetAmount.toLocaleString()} {pool.assetSymbol}
                          </span>
                        </td>

                        {/* Volume */}
                        <td className="py-3.5 px-4 text-slate-300">
                          ${(pool.volume24h || 0).toLocaleString()}
                        </td>

                        {/* APR */}
                        <td className="py-3.5 px-4">
                          <span className="text-rh-green font-bold text-sm">
                            {pool.apr}%
                          </span>
                        </td>

                        {/* Pool Contract */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-300 text-xs">
                              {pool.poolAddress.slice(0, 6)}...{pool.poolAddress.slice(-4)}
                            </span>
                            <CopyButton text={pool.poolAddress} label="Copy" />
                            <a
                              href={`https://robinhoodchain.blockscout.com/address/${pool.poolAddress}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-500 hover:text-slate-200 transition"
                              title="Blockscout"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2 font-sans">
                            <button
                              onClick={() => handleOpenCreate(asset)}
                              className="bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 px-3 py-1.5 rounded text-xs font-semibold transition"
                            >
                              Add LP
                            </button>
                            {asset && (
                              <button
                                onClick={() => onMintAsset(asset)}
                                className="bg-rh-green/10 hover:bg-rh-green/20 text-rh-green px-3 py-1.5 rounded text-xs font-semibold transition border border-rh-green/20"
                              >
                                Mint
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Protocol Architecture Banner */}
      <div className="bg-[#090C10] border border-white/[0.06] rounded-xl p-6 text-xs text-slate-400 space-y-3 font-sans">
        <div className="flex items-center gap-2 text-white font-bold text-sm font-display">
          <ShieldCheck className="w-4 h-4 text-rh-green" />
          <span>Uniswap v3 AMM Liquidity Mechanics on Robinhood Chain</span>
        </div>
        <p className="leading-relaxed">
          dAssets pools run directly on the standard <strong>Uniswap v3 Core</strong> architecture on <strong>Robinhood Chain Mainnet (`Chain ID: 4663`)</strong>. Liquidity providers earn swap fees on every rebalance and user trade. Because dAssets maintain an internal perpetual hedge without direct liquidation risk, AMM pools enjoy deep price stability centered around live Oracle NAV feeds.
        </p>
        <div className="flex flex-wrap items-center gap-4 text-slate-400 font-mono text-[11px] pt-1">
          <div>Uniswap Factory: <span className="text-slate-300">0x1F98431c8aD98523631AE4a59f267346ea31F984</span></div>
          <div>•</div>
          <div>Settlement Currency: <span className="text-slate-300">USDC / ETH</span></div>
          <div>•</div>
          <div>Concentrated Ticks: <span className="text-rh-green font-bold">Enabled</span></div>
        </div>
      </div>

      {/* Modal */}
      {isCreateModalOpen && (
        <CreatePoolModal
          assets={assets}
          initialAsset={selectedAssetForPool}
          wallet={wallet}
          onClose={() => setIsCreateModalOpen(false)}
          onOpenWalletModal={onOpenWalletModal}
          onPoolCreated={(newPool) => {
            setPools(prev => [newPool, ...prev]);
          }}
        />
      )}
    </div>
  );
};
