import React from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  ExternalLink, 
  Layers, 
  Zap, 
  Coins 
} from 'lucide-react';
import { CopyButton } from './CopyButton';
import deployedConfig from '../contracts/deployedAddresses.json';

interface HomeViewProps {
  onExploreMarkets: () => void;
  onOpenMintdBTC3L: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ 
  onExploreMarkets, 
  onOpenMintdBTC3L 
}) => {
  const factoryAddress = deployedConfig?.factory || '0x31390C104d777c03B00E95967E3F2905993f947b';
  const flagshipAddress = deployedConfig?.flagshipToken?.address || '0x5164E1dc1Be45a0Fbe4D6A25A4713225E9bb56F6';
  const oracleAddress = deployedConfig?.oracle || '0x0c19e8DE99BA135aBdc059b34e0d3F9E5e021fd0';
  const mailboxAddress = deployedConfig?.hyperlaneMailbox || '0x3a867fCfFeC2B790970eeBDC9023E75B0a172aa7';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-24">
      
      {/* Hero Section */}
      <section className="text-center space-y-8 max-w-3xl mx-auto">
        
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-rh-green animate-pulse"></span>
          <span className="text-zinc-200 font-medium">Robinhood Chain Mainnet</span>
          <span className="text-zinc-600">•</span>
          <span>Chain ID 4663</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Leveraged liquidity, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-500">
            native to Robinhood Chain.
          </span>
        </h1>

        {/* Smart Brief Description */}
        <p className="text-base sm:text-lg text-zinc-400 leading-relaxed font-normal max-w-2xl mx-auto">
          dAssets enables permissionless minting and AMM liquidity for tokenized leveraged positions backed by Bounce.tech on HyperEVM. Bridged natively through Hyperlane with zero direct liquidation risk.
        </p>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            onClick={onExploreMarkets}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black font-semibold px-6 py-3 rounded-xl transition text-sm shadow-sm"
          >
            <span>Explore 270+ Markets</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenMintdBTC3L}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-medium px-5 py-3 rounded-xl transition text-sm"
          >
            <Zap className="w-4 h-4 text-rh-green fill-current" />
            <span>Mint Flagship (dBTC3L)</span>
          </button>
        </div>

        {/* Clean Metrics Row */}
        <div className="pt-10 grid grid-cols-3 gap-6 max-w-xl mx-auto border-t border-zinc-900 text-left">
          <div>
            <div className="text-2xl font-semibold font-mono text-white tracking-tight">270+</div>
            <div className="text-xs text-zinc-400 mt-0.5">Bounce.tech Pairs</div>
          </div>
          <div>
            <div className="text-2xl font-semibold font-mono text-white tracking-tight">100%</div>
            <div className="text-xs text-zinc-400 mt-0.5">Perpetual Backing</div>
          </div>
          <div>
            <div className="text-2xl font-semibold font-mono text-white tracking-tight">~100ms</div>
            <div className="text-xs text-zinc-400 mt-0.5">Robinhood Block Time</div>
          </div>
        </div>

      </section>

      {/* How it Works: 3 Simple Steps */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-500">How It Works</h2>
          <p className="text-2xl font-bold text-white mt-1">Simple leverage without the stress.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-3">
            <div className="text-xs font-mono text-zinc-500 font-bold">01</div>
            <h3 className="font-semibold text-base text-white">Pick Your Market</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Choose from 270+ pairs (like 3x Long Bitcoin or 2x Short Solana). Pick whether you want 2x, 3x, or 5x exposure.
            </p>
          </div>

          <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-3">
            <div className="text-xs font-mono text-zinc-500 font-bold">02</div>
            <h3 className="font-semibold text-base text-white">Mint in One Click</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Confirm the transaction from your wallet. The real token drops straight into your address on Robinhood Chain.
            </p>
          </div>

          <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-3">
            <div className="text-xs font-mono text-zinc-500 font-bold">03</div>
            <h3 className="font-semibold text-base text-white">Trade or Earn Fees</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Hold the token in your wallet for leveraged upside, or seed an AMM pool to earn swap fees from other traders.
            </p>
          </div>
        </div>
      </section>

      {/* Why dAssets is Different */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Why It Matters</h2>
          <p className="text-2xl font-bold text-white mt-1">Built to protect your capital.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200">
              <ShieldCheck className="w-5 h-5 text-rh-green" />
            </div>
            <h3 className="font-semibold text-base text-white">Never Get Liquidated</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Standard margin trading wipes you out when the market drops. dAssets automatically rebalances behind the scenes, so you hold an actual token rather than an open debt position.
            </p>
          </div>

          <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200">
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-semibold text-base text-white">Hyperlane Cross-Chain Speed</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Powered by official Hyperlane contracts, connecting deep perpetual backing directly to Robinhood Chain in under 2 seconds.
            </p>
          </div>

          <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 space-y-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200">
              <Coins className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="font-semibold text-base text-white">100% Real ERC-20 Tokens</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every asset is a standard ERC-20 token you own in your wallet. Freely transferable, tradeable on DEXes, and usable across DeFi.
            </p>
          </div>

        </div>
      </section>

      {/* Verified Mainnet Deployments with Copyable CAs */}
      <section className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">Verified Mainnet Deployments</h3>
              <span className="text-[10px] bg-rh-green/10 text-rh-green border border-rh-green/20 px-2 py-0.5 rounded font-mono font-medium">
                Live on Chain 4663
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Smart contracts deployed on Robinhood Chain. Click to copy contract addresses (CA) or inspect on Blockscout.
            </p>
          </div>
          <a
            href="https://robinhoodchain.blockscout.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition"
          >
            <span>Blockscout Explorer</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          
          {/* Factory CA */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-[11px]">dAsset Factory Contract</span>
              <CopyButton text={factoryAddress} label="Copy CA" />
            </div>
            <div className="text-zinc-200 font-semibold truncate">
              {factoryAddress}
            </div>
            <div className="pt-1">
              <a
                href={`https://robinhoodchain.blockscout.com/address/${factoryAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-rh-green hover:underline text-[11px] inline-flex items-center gap-1"
              >
                <span>View on Blockscout</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Flagship Token CA */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-[11px]">Flagship Token (dBTC3L)</span>
              <CopyButton text={flagshipAddress} label="Copy CA" />
            </div>
            <div className="text-zinc-200 font-semibold truncate">
              {flagshipAddress}
            </div>
            <div className="pt-1">
              <a
                href={`https://robinhoodchain.blockscout.com/address/${flagshipAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-rh-green hover:underline text-[11px] inline-flex items-center gap-1"
              >
                <span>View on Blockscout</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Oracle CA */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-[11px]">Oracle Feed Contract</span>
              <CopyButton text={oracleAddress} label="Copy CA" />
            </div>
            <div className="text-zinc-200 font-semibold truncate">
              {oracleAddress}
            </div>
            <div className="pt-1">
              <a
                href={`https://robinhoodchain.blockscout.com/address/${oracleAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-rh-green hover:underline text-[11px] inline-flex items-center gap-1"
              >
                <span>View on Blockscout</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Hyperlane Mailbox */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-[11px]">Hyperlane Mailbox (Domain 4663)</span>
              <CopyButton text={mailboxAddress} label="Copy CA" />
            </div>
            <div className="text-zinc-200 font-semibold truncate">
              {mailboxAddress}
            </div>
            <div className="pt-1">
              <a
                href={`https://robinhoodchain.blockscout.com/address/${mailboxAddress}`}
                target="_blank"
                rel="noreferrer"
                className="text-rh-green hover:underline text-[11px] inline-flex items-center gap-1"
              >
                <span>Official Hyperlane Contract</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
