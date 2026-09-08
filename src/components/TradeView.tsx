import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowDownUp, 
  Search, 
  ExternalLink, 
  Zap, 
  Wallet, 
  Info, 
  Check, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  PieChart,
  HelpCircle,
  ArrowDownLeft
} from 'lucide-react';
import { LeveragedAsset, WalletState, AppView } from '../types';
import { TokenLogo } from './TokenLogo';
import { getUniswapSwapUrl, getUniswapSellUrl } from '../utils/uniswap';

interface TradeViewProps {
  assets: LeveragedAsset[];
  wallet: WalletState;
  onOpenWalletModal: () => void;
  onMintAsset: (asset: LeveragedAsset, initialTab?: 'mint' | 'redeem') => void;
  onNavigate: (view: AppView, asset?: LeveragedAsset) => void;
  initialAsset?: LeveragedAsset;
}

export const TradeView: React.FC<TradeViewProps> = ({
  assets,
  wallet,
  onOpenWalletModal,
  onMintAsset,
  onNavigate,
  initialAsset,
}) => {
  // Trade direction: 'buy' (ETH -> dAsset) or 'sell' (dAsset -> ETH)
  const [tradeDirection, setTradeDirection] = useState<'buy' | 'sell'>('buy');
  
  // Selected dAsset (default to initialAsset, dBTC3L, or first asset)
  const [selectedAsset, setSelectedAsset] = useState<LeveragedAsset>(() => {
    return initialAsset || 
           assets.find(a => a.symbol === 'dBTC3L') || 
           assets[0];
  });

  const [inputAmount, setInputAmount] = useState<string>('0.05');
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState('');
  const [selectorFilter, setSelectorFilter] = useState<'all' | '3x' | '5x' | 'short' | 'majors'>('all');

  // Estimate ETH spot price from ETH assets or fallback $2,800
  const ethPrice = useMemo(() => {
    const ethAsset = assets.find(a => a.underlying.toUpperCase() === 'ETH');
    return ethAsset?.indexPrice || 2800;
  }, [assets]);

  // Wallet balances
  const userEthBalance = Number(wallet.balanceEth) || 0;
  const userAssetBalance = wallet.holdings?.[selectedAsset.symbol] || 0;

  const inputAmountNumber = parseFloat(inputAmount) || 0;

  // Output estimation
  const estimatedOutput = useMemo(() => {
    if (inputAmountNumber <= 0 || !selectedAsset.currentNav) return 0;

    if (tradeDirection === 'buy') {
      // Input is ETH: (ETH * ETH_PRICE) / NAV
      const totalUsd = inputAmountNumber * ethPrice;
      return totalUsd / selectedAsset.currentNav;
    } else {
      // Input is dAsset: (dAsset * NAV) / ETH_PRICE
      const totalUsd = inputAmountNumber * selectedAsset.currentNav;
      return totalUsd / ethPrice;
    }
  }, [inputAmountNumber, tradeDirection, selectedAsset.currentNav, ethPrice]);

  const totalUsdValue = useMemo(() => {
    if (tradeDirection === 'buy') {
      return (inputAmountNumber * ethPrice).toFixed(2);
    } else {
      return (inputAmountNumber * selectedAsset.currentNav).toFixed(2);
    }
  }, [inputAmountNumber, tradeDirection, ethPrice, selectedAsset.currentNav]);

  const handleToggleDirection = () => {
    if (tradeDirection === 'buy') {
      setTradeDirection('sell');
      setInputAmount(userAssetBalance > 0 ? String(userAssetBalance) : '10');
    } else {
      setTradeDirection('buy');
      setInputAmount('0.05');
    }
  };

  const handleSetMax = () => {
    if (tradeDirection === 'buy') {
      const maxEth = Math.max(0, userEthBalance - 0.005); // reserve 0.005 for gas
      setInputAmount(maxEth.toFixed(4));
    } else {
      setInputAmount(String(userAssetBalance));
    }
  };

  const handleSetPercent = (pct: number) => {
    if (tradeDirection === 'buy') {
      const maxEth = Math.max(0, userEthBalance - 0.005);
      setInputAmount((maxEth * (pct / 100)).toFixed(4));
    } else {
      setInputAmount((userAssetBalance * (pct / 100)).toFixed(2));
    }
  };

  // Filter assets in selector
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchesSearch = 
        a.symbol.toLowerCase().includes(selectorSearch.toLowerCase()) ||
        a.name.toLowerCase().includes(selectorSearch.toLowerCase()) ||
        a.underlying.toLowerCase().includes(selectorSearch.toLowerCase());
      
      if (!matchesSearch) return false;

      if (selectorFilter === '3x') return Math.abs(a.leverage) === 3 && !a.isShort;
      if (selectorFilter === '5x') return Math.abs(a.leverage) === 5 && !a.isShort;
      if (selectorFilter === 'short') return a.isShort;
      if (selectorFilter === 'majors') return ['BTC', 'ETH', 'SOL', 'AVAX'].includes(a.underlying);
      return true;
    });
  }, [assets, selectorSearch, selectorFilter]);

  // Uniswap preconfigured links
  const uniswapUrl = tradeDirection === 'buy'
    ? getUniswapSwapUrl(selectedAsset.tokenAddress)
    : getUniswapSellUrl(selectedAsset.tokenAddress);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-slate-100 selection:bg-rh-green selection:text-black">
      
      {/* Title & Network Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-slate-300 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rh-green animate-pulse"></span>
            <span>Uniswap v3 & Oracle NAV Trading • Robinhood Chain (4663)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
            Instant Swap & Convert
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Swap native Robinhood Chain ETH for constant 2x, 3x, or 5x leveraged tokens, or convert back to ETH anytime.
          </p>
        </div>

        {/* Quick Route to Portfolio */}
        {wallet.isConnected && (
          <button
            onClick={() => onNavigate('portfolio')}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.10] text-xs font-mono text-slate-300 transition"
          >
            <PieChart className="w-3.5 h-3.5 text-rh-green" />
            <span>View Holdings in Portfolio →</span>
          </button>
        )}
      </div>

      {/* Main Swap Box Container */}
      <div className="max-w-lg mx-auto">
        <div className="glass-panel rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 border border-white/[0.10] relative glow-border-green">
          
          {/* Header Controls: Buy / Sell Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#090C12] border border-white/[0.06] text-xs font-semibold font-mono">
            <button
              onClick={() => {
                setTradeDirection('buy');
                setInputAmount('0.05');
              }}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                tradeDirection === 'buy'
                  ? 'bg-white text-black font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Buy with ETH</span>
              <span className="text-[10px] opacity-70">▲ Long/Short</span>
            </button>
            <button
              onClick={() => {
                setTradeDirection('sell');
                setInputAmount(userAssetBalance > 0 ? String(userAssetBalance) : '10');
              }}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                tradeDirection === 'sell'
                  ? 'bg-white text-black font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-pink-500" />
              <span>Convert Back to ETH</span>
            </button>
          </div>

          {/* Card 1: Input "You Pay" */}
          <div className="bg-[#090C12] border border-white/[0.06] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider font-mono text-[11px]">
                {tradeDirection === 'buy' ? 'You Pay (Input)' : 'You Sell (Position)'}
              </span>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span>Balance:</span>
                <span className="text-white font-bold">
                  {tradeDirection === 'buy' ? `${userEthBalance.toFixed(4)} ETH` : `${userAssetBalance} ${selectedAsset.symbol}`}
                </span>
                {wallet.isConnected && (
                  <button
                    onClick={handleSetMax}
                    className="px-1.5 py-0.5 rounded bg-white/[0.08] hover:bg-white/[0.15] text-rh-green font-bold transition"
                  >
                    MAX
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <input
                type="number"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent text-2xl sm:text-3xl font-bold font-mono text-white placeholder-slate-600 focus:outline-none"
              />

              {tradeDirection === 'buy' ? (
                /* Static ETH selector */
                <div className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.10] px-3 py-2 rounded-xl shrink-0">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    Ξ
                  </div>
                  <span className="font-bold text-sm text-white font-mono">ETH</span>
                </div>
              ) : (
                /* Dynamic dAsset selector */
                <button
                  onClick={() => setIsAssetSelectorOpen(true)}
                  className="flex items-center gap-2 bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] px-3 py-2 rounded-xl transition shrink-0 cursor-pointer"
                >
                  <TokenLogo underlying={selectedAsset.underlying} iconColor={selectedAsset.iconColor} size="xs" />
                  <span className="font-bold text-sm text-white font-mono">{selectedAsset.symbol}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>≈ ${totalUsdValue} USD</span>
              <div className="flex items-center gap-1.5">
                {[25, 50, 75].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => handleSetPercent(pct)}
                    className="px-1.5 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.10] text-slate-400 hover:text-white transition"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Flip Direction Arrow Button */}
          <div className="flex justify-center -my-1 relative z-10">
            <button
              onClick={handleToggleDirection}
              className="p-2.5 rounded-full bg-[#0E131C] border border-white/[0.12] text-slate-300 hover:text-white hover:border-rh-green/50 transition shadow-xl active:scale-90 cursor-pointer"
              title="Switch buy / sell direction"
            >
              <ArrowDownUp className="w-4 h-4 text-rh-green" />
            </button>
          </div>

          {/* Card 2: Output "You Receive" */}
          <div className="bg-[#090C12] border border-white/[0.06] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider font-mono text-[11px]">
                {tradeDirection === 'buy' ? 'You Receive (Position)' : 'You Receive (Native Gas / Capital)'}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {tradeDirection === 'buy' ? `1 ${selectedAsset.symbol} = $${selectedAsset.currentNav.toFixed(2)}` : `1 ETH ≈ $${ethPrice.toFixed(2)}`}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight truncate">
                {estimatedOutput > 0 ? estimatedOutput.toFixed(4) : '0.0000'}
              </div>

              {tradeDirection === 'buy' ? (
                /* Dynamic dAsset selector */
                <button
                  onClick={() => setIsAssetSelectorOpen(true)}
                  className="flex items-center gap-2 bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] px-3 py-2 rounded-xl transition shrink-0 cursor-pointer"
                >
                  <TokenLogo underlying={selectedAsset.underlying} iconColor={selectedAsset.iconColor} size="xs" />
                  <span className="font-bold text-sm text-white font-mono">{selectedAsset.symbol}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ) : (
                /* Static ETH selector */
                <div className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.10] px-3 py-2 rounded-xl shrink-0">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    Ξ
                  </div>
                  <span className="font-bold text-sm text-white font-mono">ETH</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>≈ ${totalUsdValue} USD</span>
              <span className="text-rh-green font-semibold">0% Liquidation Margin Risk</span>
            </div>
          </div>

          {/* Live NAV & Asset Details Specs Box */}
          <div className="carbon-inlay rounded-xl p-3 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Selected Token:</span>
              <span className="text-white font-bold flex items-center gap-1.5">
                <span>{selectedAsset.name}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  selectedAsset.isShort 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                    : 'bg-rh-green/10 text-rh-green border border-rh-green/20'
                }`}>
                  {selectedAsset.isShort ? '▼' : '▲'} {Math.abs(selectedAsset.leverage)}x
                </span>
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Pyth Oracle NAV:</span>
              <span className="text-slate-200 font-bold">${selectedAsset.currentNav.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Uniswap Pool State:</span>
              <span className={`font-bold ${selectedAsset.poolAddress ? 'text-rh-green' : 'text-slate-400'}`}>
                {selectedAsset.poolAddress ? 'Active Pool on Robinhood' : 'Unseeded (Use Protocol NAV)'}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Network Gas:</span>
              <span className="text-slate-300">~$0.05 L2 ETH</span>
            </div>
          </div>

          {/* Action Buttons: Dual Route Execution */}
          <div className="space-y-2.5 pt-2">
            
            {/* 1. Direct Uniswap Swap Link */}
            <a
              href={uniswapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-400 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition shadow-lg cursor-pointer"
            >
              <img src="/logos/uni.png" alt="Uniswap" className="w-4 h-4 rounded-full" />
              <span>
                {tradeDirection === 'buy'
                  ? `Swap on Uniswap (Buy ${selectedAsset.symbol}) ↗`
                  : `Sell ${selectedAsset.symbol} for ETH on Uniswap ↗`
                }
              </span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            {/* 2. In-App Protocol Mint / Redeem at Oracle NAV */}
            <button
              onClick={() => onMintAsset(selectedAsset, tradeDirection === 'buy' ? 'mint' : 'redeem')}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-200 text-black font-semibold py-3 px-4 rounded-xl text-xs transition shadow-sm"
            >
              {tradeDirection === 'buy' ? (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Mint at Pyth Oracle NAV (Zero Slippage)</span>
                </>
              ) : (
                <>
                  <ArrowDownLeft className="w-3.5 h-3.5 text-rh-green" />
                  <span>Redeem at Pyth Oracle NAV (Zero Slippage)</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-500 font-sans pt-1">
              Uniswap executes instant market AMM swaps. Protocol Mint/Redeem executes direct on-chain minting or burning at exact Pyth oracle NAV.
            </p>
          </div>

        </div>
      </div>

      {/* Clear Guide: "How to Find Everything" Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        
        <div className="glass-panel rounded-xl p-4 space-y-2 border-white/[0.08]">
          <div className="w-8 h-8 rounded-lg bg-rh-green/10 text-rh-green flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h3 className="font-bold text-white text-xs font-sans">How to Buy / Enter</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Use this <strong>Trade</strong> page or click <strong>Trade 🦄</strong> on any token in <a href="/markets" onClick={(e) => { e.preventDefault(); onNavigate('markets'); }} className="text-white underline">Markets</a> to swap regular Robinhood ETH for 2x, 3x, or 5x tokens.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-4 space-y-2 border-white/[0.08]">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h3 className="font-bold text-white text-xs font-sans">How to Sell / Exit to ETH</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Select <strong>Convert Back to ETH</strong> above, or click <strong>Sell for ETH</strong> inside <a href="/portfolio" onClick={(e) => { e.preventDefault(); onNavigate('portfolio'); }} className="text-white underline">Portfolio</a> to receive native ETH in your wallet immediately.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-4 space-y-2 border-white/[0.08]">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h3 className="font-bold text-white text-xs font-sans">Where to See Your Money</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            Go to <a href="/portfolio" onClick={(e) => { e.preventDefault(); onNavigate('portfolio'); }} className="text-white underline">Portfolio</a> anytime. It tracks your exact total net worth, token balances, and Uniswap LP positions verified on-chain.
          </p>
        </div>

      </div>

      {/* Asset Selector Modal */}
      <AnimatePresence>
        {isAssetSelectorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="glass-panel rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-white/[0.12] bg-[#0A0D14]"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white font-display">Select Leveraged Token</h3>
                  <button
                    onClick={() => setIsAssetSelectorOpen(false)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search 270+ assets (BTC, ETH, SOL, DOGE)..."
                    value={selectorSearch}
                    onChange={(e) => setSelectorSearch(e.target.value)}
                    className="w-full bg-[#0E121A] border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rh-green/50"
                  />
                </div>

                {/* Quick Filters */}
                <div className="flex items-center gap-1.5 text-xs font-mono overflow-x-auto pb-1">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'majors', label: 'Majors' },
                    { id: '3x', label: '3x Long' },
                    { id: '5x', label: '5x Long' },
                    { id: 'short', label: 'Shorts' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectorFilter(f.id as any)}
                      className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
                        selectorFilter === f.id
                          ? 'bg-white text-black font-bold'
                          : 'bg-white/[0.04] text-slate-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Asset List */}
              <div className="overflow-y-auto divide-y divide-white/[0.04] p-2">
                {filteredAssets.map((asset) => {
                  const isSelected = asset.symbol === selectedAsset.symbol;
                  return (
                    <button
                      key={asset.symbol}
                      onClick={() => {
                        setSelectedAsset(asset);
                        setIsAssetSelectorOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition text-left ${
                        isSelected
                          ? 'bg-white/[0.08] border border-white/[0.12]'
                          : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <TokenLogo underlying={asset.underlying} iconColor={asset.iconColor} size="sm" />
                        <div>
                          <div className="font-bold text-xs text-white font-mono flex items-center gap-1.5">
                            <span>{asset.symbol}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              asset.isShort 
                                ? 'bg-red-500/10 text-red-400' 
                                : 'bg-rh-green/10 text-rh-green'
                            }`}>
                              {asset.isShort ? '▼' : '▲'} {Math.abs(asset.leverage)}x
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-sans">
                            {asset.name}
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-xs font-bold text-white">
                          ${asset.currentNav.toFixed(2)}
                        </div>
                        <div className={`text-[10px] ${asset.change24h >= 0 ? 'text-rh-green' : 'text-red-400'}`}>
                          {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
