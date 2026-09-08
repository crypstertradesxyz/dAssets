import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  ExternalLink, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  Shield,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { CopyButton } from './CopyButton';
import deployedConfig from '../contracts/deployedAddresses.json';
import { LeveragedAsset } from '../types';

interface HomeViewProps {
  assets: LeveragedAsset[];
  onExploreMarkets: () => void;
  onSelectAsset: (asset: LeveragedAsset) => void;
  onMintAsset: (asset: LeveragedAsset) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ 
  assets,
  onExploreMarkets, 
  onSelectAsset,
  onMintAsset,
}) => {
  const factoryAddress = deployedConfig?.factory || '0x31390C104d777c03B00E95967E3F2905993f947b';
  const flagshipAddress = deployedConfig?.flagshipToken?.address || '0x5164E1dc1Be45a0Fbe4D6A25A4713225E9bb56F6';
  const oracleAddress = deployedConfig?.oracle || '0x0c19e8DE99BA135aBdc059b34e0d3F9E5e021fd0';
  const mailboxAddress = deployedConfig?.hyperlaneMailbox || '0x3a867fCfFeC2B790970eeBDC9023E75B0a172aa7';

  const [activeTabSymbol, setActiveTabSymbol] = useState('dBTC3L');
  const activeAsset = assets.find(a => a.symbol === activeTabSymbol) || assets[0];

  const quickSymbols = ['dBTC3L', 'dETH3L', 'dSOL5L', 'dHYPE3L'];
  const marqueeAssets = assets.slice(0, 16);

  return (
    <div className="relative min-h-screen text-slate-100 selection:bg-rh-green selection:text-black">
      
      {/* Live Market Marquee Ticker */}
      <div className="border-b border-white/[0.06] bg-[#060709] py-2 overflow-hidden select-none">
        <div className="animate-marquee items-center gap-8 text-xs font-mono">
          {[...marqueeAssets, ...marqueeAssets].map((item, idx) => {
            const isPos = item.change24h >= 0;
            return (
              <div
                key={`${item.id}-${idx}`}
                onClick={() => onSelectAsset(item)}
                className="flex items-center space-x-2.5 cursor-pointer hover:text-white transition px-2 py-0.5 rounded"
              >
                <span className="font-semibold text-slate-200">{item.symbol}</span>
                <span className="text-white">${item.currentNav.toFixed(2)}</span>
                <span className={`text-[11px] font-medium flex items-center gap-0.5 ${isPos ? 'text-rh-green' : 'text-red-400'}`}>
                  {isPos ? '+' : ''}{item.change24h}%
                </span>
                <span className="text-slate-800 ml-4">•</span>
              </div>
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

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl font-normal">
              Hold constant 3x and 5x exposure to 270+ crypto assets without managing margin, borrowing collateral, or facing liquidation risk. Backed by Bounce perpetual vaults and settled on-chain.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onExploreMarkets}
                className="flex items-center gap-2 bg-white hover:bg-slate-100 text-black font-semibold text-xs px-5 py-3 rounded-lg transition shadow-sm"
              >
                <span>Browse 270+ Markets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onMintAsset(activeAsset)}
                className="flex items-center gap-2 bg-[#0E1218] hover:bg-[#141A22] text-slate-200 border border-white/[0.12] text-xs font-medium px-4 py-3 rounded-lg transition"
              >
                <Zap className="w-3.5 h-3.5 text-rh-green fill-current" />
                <span>Mint {activeAsset.symbol}</span>
              </motion.button>

              <a
                href={`https://robinhoodchain.blockscout.com/address/${factoryAddress}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs px-3 py-3 transition font-mono"
              >
                <span>Factory</span>
                <ExternalLink className="w-3 h-3" />
              </a>
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
            <div className="bg-[#090C10] border border-white/[0.10] rounded-xl p-5 shadow-2xl space-y-4">
              
              {/* Quick Pair Selector Tabs */}
              <div className="flex items-center space-x-1 border-b border-white/[0.06] pb-3">
                {quickSymbols.map((sym) => {
                  const isSelected = activeTabSymbol === sym;
                  return (
                    <button
                      key={sym}
                      onClick={() => setActiveTabSymbol(sym)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                        isSelected 
                          ? 'bg-white/[0.08] text-white font-semibold' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sym}
                    </button>
                  );
                })}
              </div>

              {/* Price & NAV Display */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-xs text-slate-500">Oracle NAV Price</div>
                  <div className="text-3xl font-bold text-white font-display mt-0.5">
                    ${activeAsset.currentNav.toFixed(2)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">24h Change</div>
                  <div className={`text-sm font-semibold flex items-center justify-end gap-1 mt-0.5 ${
                    activeAsset.change24h >= 0 ? 'text-rh-green' : 'text-red-400'
                  }`}>
                    {activeAsset.change24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{activeAsset.change24h >= 0 ? '+' : ''}{activeAsset.change24h}%</span>
                  </div>
                </div>
              </div>

              {/* Asset Details */}
              <div className="bg-[#0D1016] border border-white/[0.06] rounded-lg p-3 space-y-2 text-xs">
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
                {activeAsset.tokenAddress && (
                  <div className="flex items-center justify-between text-slate-400 pt-1.5 border-t border-white/[0.04]">
                    <span>Contract CA:</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-slate-300">{activeAsset.tokenAddress.slice(0, 6)}...{activeAsset.tokenAddress.slice(-4)}</span>
                      <CopyButton text={activeAsset.tokenAddress} label="Copy" />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onMintAsset(activeAsset)}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-black font-semibold py-3 px-4 rounded-lg text-xs transition shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Mint {activeAsset.symbol} on Robinhood Chain</span>
              </motion.button>

            </div>
          </motion.div>

        </section>


        {/* HOW IT WORKS: Human, Direct, Clear */}
        <section className="space-y-6">
          <div className="border-b border-white/[0.06] pb-3">
            <h2 className="text-base font-bold text-white font-display">
              How dAssets Works
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Leveraged tokens give you multiplier returns without borrowing or liquidation risk.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-7 h-7 rounded-md bg-white/[0.06] text-white flex items-center justify-center font-bold text-xs font-mono">
                1
              </div>
              <h3 className="text-sm font-bold text-white">Choose Your Position</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pick from 270+ assets across Bitcoin, Ethereum, Solana, Layer 1s, and DeFi tokens in 3x or 5x long or short multipliers.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-7 h-7 rounded-md bg-white/[0.06] text-white flex items-center justify-center font-bold text-xs font-mono">
                2
              </div>
              <h3 className="text-sm font-bold text-white">Mint Straight to Wallet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deposit USDC on Robinhood Chain. Hyperlane routes collateral to Bounce vaults on HyperEVM, minting standard ERC-20s to your address.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-7 h-7 rounded-md bg-white/[0.06] text-white flex items-center justify-center font-bold text-xs font-mono">
                3
              </div>
              <h3 className="text-sm font-bold text-white">Hold Without Stress</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tokens automatically rebalance every 8 hours so your position never gets liquidated. Trade on AMMs or redeem anytime at Oracle NAV.
              </p>
            </div>
          </div>
        </section>


        {/* VERIFIED CONTRACTS: Authoritative & 1-Click Copyable */}
        <section className="bg-[#080B0F] border border-white/[0.08] rounded-xl p-6 sm:p-8 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-display">Robinhood Chain Mainnet Registry</h2>
                <span className="text-[10px] bg-rh-green/10 text-rh-green border border-rh-green/20 px-2 py-0.5 rounded font-mono font-semibold">
                  CHAIN 4663
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Verified smart contracts deployed on Robinhood Chain.
              </p>
            </div>

            <a
              href="https://robinhoodchain.blockscout.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-mono"
            >
              <span>Blockscout Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            
            {/* Factory */}
            <div className="bg-[#0D1016] border border-white/[0.06] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-sans font-medium">dAsset Factory</span>
                <CopyButton text={factoryAddress} label="Copy" />
              </div>
              <div className="text-slate-200 font-medium truncate text-xs">
                {factoryAddress}
              </div>
              <a
                href={`https://robinhoodchain.blockscout.com/address/${factoryAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-rh-green hover:underline text-[11px] inline-flex items-center gap-1 font-sans"
              >
                <span>View on Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Flagship Token */}
            <div className="bg-[#0D1016] border border-white/[0.06] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-sans font-medium">Flagship dBTC3L (3x Long)</span>
                <CopyButton text={flagshipAddress} label="Copy" />
              </div>
              <div className="text-slate-200 font-medium truncate text-xs">
                {flagshipAddress}
              </div>
              <a
                href={`https://robinhoodchain.blockscout.com/address/${flagshipAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-rh-green hover:underline text-[11px] inline-flex items-center gap-1 font-sans"
              >
                <span>View on Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Oracle Feed */}
            <div className="bg-[#0D1016] border border-white/[0.06] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-sans font-medium">Robinhood NAV Oracle</span>
                <CopyButton text={oracleAddress} label="Copy" />
              </div>
              <div className="text-slate-200 font-medium truncate text-xs">
                {oracleAddress}
              </div>
              <a
                href={`https://robinhoodchain.blockscout.com/address/${oracleAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-rh-green hover:underline text-[11px] inline-flex items-center gap-1 font-sans"
              >
                <span>View on Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Hyperlane Mailbox */}
            <div className="bg-[#0D1016] border border-white/[0.06] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-sans font-medium">Hyperlane Mailbox (Domain 4663)</span>
                <CopyButton text={mailboxAddress} label="Copy" />
              </div>
              <div className="text-slate-200 font-medium truncate text-xs">
                {mailboxAddress}
              </div>
              <a
                href={`https://robinhoodchain.blockscout.com/address/${mailboxAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-rh-green hover:underline text-[11px] inline-flex items-center gap-1 font-sans"
              >
                <span>Official Mailbox Deployment</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

          </div>

        </section>

      </div>
    </div>
  );
};
