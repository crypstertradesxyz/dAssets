import React from 'react';
import { 
  ArrowRight, 
  ExternalLink, 
  Zap, 
  ShieldCheck, 
  Layers, 
  TrendingUp, 
  TrendingDown
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

  // Highlighted market pairs
  const featuredSymbols = ['dBTC3L', 'dETH3L', 'dSOL5L', 'dHYPE3L'];
  const featuredAssets = featuredSymbols
    .map(sym => assets.find(a => a.symbol === sym))
    .filter((a): a is LeveragedAsset => Boolean(a));

  const flagshipAsset = assets.find(a => a.symbol === 'dBTC3L') || assets[0];

  return (
    <div className="relative min-h-screen text-slate-100">
      
      {/* Network Status Sub-header */}
      <div className="border-b border-white/[0.06] bg-[#090C10]/60 backdrop-blur px-4 sm:px-8 py-2 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-rh-green"></span>
            <span className="text-slate-200 font-medium">Robinhood Chain Mainnet</span>
            <span className="text-slate-500">[Chain ID: 4663]</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">Hyperlane Warp Routes Active</span>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono">
          <span className="text-slate-400">270+ Leveraged Pairs</span>
          <span className="text-slate-700">•</span>
          <a
            href={`https://robinhoodchain.blockscout.com/address/${factoryAddress}`}
            target="_blank"
            rel="noreferrer"
            className="text-rh-green hover:underline flex items-center gap-1"
          >
            <span>Factory Verified</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-24">
        
        {/* HERO SECTION: Simple, Smart, Professional */}
        <section className="space-y-8">
          
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-slate-300 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-rh-green"></span>
              <span>Robinhood Chain Native</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
              Tokenized leveraged perps on Robinhood Chain.
            </h1>

            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl font-normal">
              dAssets packages leveraged crypto positions into standard tokens. Hold 3x and 5x exposure directly in your wallet with automated rebalancing, zero personal margin calls, and instant AMM liquidity.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onExploreMarkets}
              className="flex items-center gap-2 bg-white hover:bg-slate-200 text-black font-semibold text-xs px-5 py-3 rounded-md transition active:scale-95 shadow-sm"
            >
              <span>Explore 270+ Markets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {flagshipAsset && (
              <button
                onClick={() => onMintAsset(flagshipAsset)}
                className="flex items-center gap-2 bg-[#12161F] hover:bg-[#181E2A] text-slate-200 border border-white/[0.12] text-xs font-medium px-4 py-3 rounded-md transition"
              >
                <Zap className="w-3.5 h-3.5 text-rh-green fill-current" />
                <span>Mint dBTC3L (3x Long)</span>
              </button>
            )}

            <a
              href={`https://robinhoodchain.blockscout.com/address/${factoryAddress}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs px-3 py-3 transition font-mono"
            >
              <span>Contract Factory</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/[0.06] font-mono">
            <div className="bg-[#0C0F14] border border-white/[0.06] rounded-lg p-4">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider">Available Assets</div>
              <div className="text-2xl font-bold text-white mt-1">270+</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Majors, L1s, DeFi, Memes</div>
            </div>

            <div className="bg-[#0C0F14] border border-white/[0.06] rounded-lg p-4">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider">Target Chain</div>
              <div className="text-2xl font-bold text-rh-green mt-1">Chain 4663</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Robinhood Arbitrum Orbit</div>
            </div>

            <div className="bg-[#0C0F14] border border-white/[0.06] rounded-lg p-4">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider">Liquidation Risk</div>
              <div className="text-2xl font-bold text-white mt-1">0%</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Automated 8h Rebalance</div>
            </div>

            <div className="bg-[#0C0F14] border border-white/[0.06] rounded-lg p-4">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider">Warp Route Fee</div>
              <div className="text-2xl font-bold text-white mt-1">~$0.05</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Hyperlane Interchain Gas</div>
            </div>
          </div>

        </section>


        {/* FEATURED MARKETS: Live Market Highlights */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Featured Markets
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time Oracle NAV feeds synchronized with Robinhood Chain.
              </p>
            </div>
            <button
              onClick={onExploreMarkets}
              className="text-xs text-rh-green hover:underline flex items-center gap-1 font-mono"
            >
              <span>View All 270+</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {featuredAssets.map((asset) => {
              const isPositive = asset.change24h >= 0;
              return (
                <div
                  key={asset.id}
                  onClick={() => onSelectAsset(asset)}
                  className="bg-[#0C0F14] hover:bg-[#11151D] border border-white/[0.06] hover:border-white/[0.14] rounded-lg p-4 transition cursor-pointer flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{asset.symbol}</span>
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300">
                          {Math.abs(asset.leverage)}x {asset.isShort ? 'S' : 'L'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">{asset.underlyingName}</span>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-sm font-bold text-white">
                        ${asset.currentNav.toFixed(2)}
                      </div>
                      <div className={`text-[11px] font-medium flex items-center justify-end gap-0.5 ${isPositive ? 'text-rh-green' : 'text-red-400'}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{isPositive ? '+' : ''}{asset.change24h}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Spot: ${asset.indexPrice.toLocaleString()}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMintAsset(asset);
                      }}
                      className="px-2.5 py-1 bg-white/[0.06] hover:bg-white text-slate-200 hover:text-black rounded font-sans text-xs font-medium transition"
                    >
                      Mint
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>


        {/* HOW IT WORKS: Clear, Simple, Intuitive for Normal People */}
        <section className="space-y-6">
          <div className="border-b border-white/[0.06] pb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              How dAssets Works
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              No collateral management. No liquidation alarms. Just pure, composable exposure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Step 1 */}
            <div className="bg-[#0C0F14] border border-white/[0.06] rounded-lg p-6 space-y-3">
              <div className="text-xs font-mono text-slate-500 font-bold">01</div>
              <h3 className="text-base font-bold text-white">Choose Your Market</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Select from 270+ assets across BTC, ETH, SOL, Layer 1s, and DeFi tokens. Pick 3x or 5x long or short exposure depending on your market outlook.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#0C0F14] border border-white/[0.06] rounded-lg p-6 space-y-3">
              <div className="text-xs font-mono text-slate-500 font-bold">02</div>
              <h3 className="text-base font-bold text-white">Mint On Robinhood Chain</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deposit USDC to mint the token directly to your wallet. Collateral is routed cross-chain via Hyperlane to Bounce.tech perpetual vaults on HyperEVM.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#0C0F14] border border-white/[0.06] rounded-lg p-6 space-y-3">
              <div className="text-xs font-mono text-slate-500 font-bold">03</div>
              <h3 className="text-base font-bold text-white">Hold, Trade, or Seed Liquidity</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tokens automatically rebalance every 8 hours to maintain their target multiplier without liquidating you. Trade on AMMs, transfer to any wallet, or redeem anytime.
              </p>
            </div>

          </div>
        </section>


        {/* VERIFIED ON-CHAIN CONTRACT REGISTRY: Institutional, Authoritative, 1-Click Copyable */}
        <section className="bg-[#0A0D12] border border-white/[0.08] rounded-lg p-6 sm:p-8 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Robinhood Chain Mainnet Registry</h2>
                <span className="text-[10px] bg-rh-green/10 text-rh-green border border-rh-green/30 px-2 py-0.5 rounded font-mono font-semibold">
                  CHAIN ID 4663
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Official verified smart contracts deployed and broadcast on Robinhood Chain.
              </p>
            </div>

            <a
              href="https://robinhoodchain.blockscout.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-mono"
            >
              <span>Blockscout Explorer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            
            {/* Factory */}
            <div className="bg-[#0E1218] border border-white/[0.06] rounded-md p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-sans font-medium">dAsset Factory</span>
                <CopyButton text={factoryAddress} label="Copy CA" />
              </div>
              <div className="text-slate-200 font-bold truncate text-xs">
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
            <div className="bg-[#0E1218] border border-white/[0.06] rounded-md p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-sans font-medium">Flagship dBTC3L (3x Long)</span>
                <CopyButton text={flagshipAddress} label="Copy CA" />
              </div>
              <div className="text-slate-200 font-bold truncate text-xs">
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
            <div className="bg-[#0E1218] border border-white/[0.06] rounded-md p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-sans font-medium">Robinhood NAV Oracle</span>
                <CopyButton text={oracleAddress} label="Copy CA" />
              </div>
              <div className="text-slate-200 font-bold truncate text-xs">
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
            <div className="bg-[#0E1218] border border-white/[0.06] rounded-md p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-sans font-medium">Hyperlane Mailbox (Domain 4663)</span>
                <CopyButton text={mailboxAddress} label="Copy CA" />
              </div>
              <div className="text-slate-200 font-bold truncate text-xs">
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
