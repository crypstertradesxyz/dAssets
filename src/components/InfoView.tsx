import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  FileCode, 
  Globe, 
  ChevronDown, 
  ExternalLink, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Wallet, 
  PieChart, 
  Droplets, 
  ArrowDownLeft,
  Coins,
  Cpu,
  Layers,
  Radio,
  Network,
  RefreshCw,
  Clock,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { ContractsView } from './ContractsView';
import { BridgeExplorer } from './BridgeExplorer';
import { AppView } from '../types';
import { Web3Service, ROBINHOOD_CHAIN } from '../services/web3';
import { CopyButton } from './CopyButton';

interface InfoViewProps {
  initialTab?: 'faq' | 'contracts' | 'bridge' | 'rpc';
  onNavigate?: (view: AppView) => void;
}

export const InfoView: React.FC<InfoViewProps> = ({ 
  initialTab = 'faq',
  onNavigate 
}) => {
  const [activeTab, setActiveTab] = useState<'faq' | 'contracts' | 'bridge' | 'rpc'>(initialTab);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);

  const toggleFaq = (index: number) => {
    setExpandedFaqIndex(expandedFaqIndex === index ? null : index);
  };

  const handleSwitchNetwork = async () => {
    setIsSwitchingChain(true);
    try {
      await Web3Service.getInstance().switchNetwork();
    } finally {
      setIsSwitchingChain(false);
    }
  };

  const faqItems = [
    {
      q: 'What is dAssets and how does it work on Robinhood Chain?',
      a: 'dAssets is a decentralized leveraged synthetic token protocol built natively for Robinhood Chain Mainnet (Chain ID 4663). It allows users to hold constant 2x, 3x, and 5x Long or Inverse Short exposure to top crypto assets (Bitcoin, Ethereum, Solana, and 270+ others) without borrowing capital, paying perpetual funding rates, or managing margin collateral.'
    },
    {
      q: 'Why is there 0% liquidation risk? How do leveraged tokens avoid margin calls?',
      a: 'Traditional perpetual futures and margin platforms liquidate your position when the benchmark asset moves against you, because you have borrowed debt that must be protected. With dAssets, you never borrow debt. Instead, each token represents a fractional share of a dynamically managed vault governed by on-chain Pyth oracles. The token price directly reflects its Net Asset Value (NAV). If the market drops, the NAV drops proportionally without triggering an automated forced sale or liquidator penalty.'
    },
    {
      q: 'How does the automated 8-hour rebalancing work?',
      a: 'Every 8 hours (at 00:00, 08:00, and 16:00 UTC), autonomous keeper contracts compute the target leverage multiplier (e.g. exactly 3.00x). As the underlying market trends, the effective leverage naturally drifts; the automated rebalancer recalibrates vault exposure back to the target constant ratio. This locks in gains during trending bull moves and de-risks positions during declines.'
    },
    {
      q: 'How do I buy or enter a leveraged position using native ETH?',
      a: 'There are two ways to enter:\n1. Instant Uniswap Swap (Recommended): Go to the "Trade" tab, select "Buy with ETH", enter how much regular Robinhood ETH you want to spend, and click "Swap on Uniswap 🦄". You will receive genuine on-chain ERC20 tokens in your wallet.\n2. Protocol Vault Mint: Go to the "Markets" tab, find any asset, and click "Mint" to issue tokens directly at the live Pyth Oracle NAV.'
    },
    {
      q: 'How do I convert my leveraged tokens back to regular ETH?',
      a: 'You can convert back to native ETH anytime:\n1. Uniswap Swap (Instant): In the "Trade" tab, select "Convert Back to ETH", or in the "Portfolio" tab click "Sell for ETH 🦄" next to your holding. Uniswap will immediately sell your tokens and credit native ETH to your wallet.\n2. Protocol NAV Redemption: Click "Redeem" on any holding in your Portfolio, Terminal, or Wallet modal to burn the synthetic tokens on-chain and settle proceeds at exact Pyth Oracle NAV with zero AMM slippage.'
    },
    {
      q: 'Where do I see my money, balances, and active positions?',
      a: 'Click "Portfolio" in the top navigation bar. The Portfolio view provides a complete capital allocation breakdown: your total net worth ($ USD), individual leveraged token holdings with live NAV valuation, active Uniswap LP positions, and network gas reserves.'
    },
    {
      q: 'What is a Uniswap v3 Liquidity Pool (LP) and how do I earn fees?',
      a: 'Liquidity Pools allow users to pair a synthetic token with capital (like ETH or USDC) so other traders can swap. In return, liquidity providers earn a share of trading volume fees (typically 0.30%). You can create or seed pools in the "Pools" tab, and withdraw/remove your capital anytime using the "Remove LP" button.'
    },
    {
      q: 'What are the transaction fees on Robinhood Chain?',
      a: 'Robinhood Chain is an ultra-low-latency Layer 2 rollup settled by Arbitrum Nitro technology. Standard swaps, transfers, mints, and redemptions cost approximately $0.05 in native L2 ETH gas, making active rebalancing and micro-trades practically free compared to Ethereum mainnet.'
    },
    {
      q: 'What is Volatility Drag / Decay?',
      a: 'All constant leveraged products (both in TradFi ETFs and DeFi) experience compounding effects. In strongly trending markets (consecutive up days), daily compounding amplifies gains beyond simple multiplication. In choppy, sideways markets, daily rebalancing causes slight performance drag. For this reason, leveraged tokens are best suited for high-conviction directional swings and momentum breakouts rather than multi-year passive holding.'
    },
    {
      q: 'How does Hyperlane Warp Route bridge interchain settlement?',
      a: 'dAssets utilizes Hyperlane interchain messaging to synchronize liquidity and settlement between perpetual benchmark vaults on Bounce.tech / HyperEVM and Robinhood Chain Mainnet. Smart contract mailboxes verify state transitions cryptographically using Hyperlane Interchain Security Modules (ISM).'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-slate-100 selection:bg-rh-green selection:text-black">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/[0.08] pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-slate-300 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-rh-green animate-pulse"></span>
            <span>Protocol Knowledge Base & Technical Registry</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">
            Protocol Info, Guide & Registry
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl font-sans leading-relaxed">
            Everything you need to know about trading leveraged synthetic tokens, converting back to regular ETH, smart contracts, and Hyperlane bridge architecture.
          </p>
        </div>

        {/* Quick Action Navigation Buttons */}
        {onNavigate && (
          <div className="flex items-center gap-2 font-sans shrink-0">
            <button
              onClick={() => onNavigate('trade')}
              className="flex items-center gap-1.5 bg-pink-500 hover:bg-pink-400 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-sm"
            >
              <span>Trade / Swap 🦄</span>
            </button>
            <button
              onClick={() => onNavigate('portfolio')}
              className="flex items-center gap-1.5 bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold transition border border-white/[0.10]"
            >
              <PieChart className="w-3.5 h-3.5 text-rh-green" />
              <span>Portfolio</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-[#090C12] border border-white/[0.08] text-xs font-mono overflow-x-auto">
        <button
          onClick={() => setActiveTab('faq')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shrink-0 ${
            activeTab === 'faq'
              ? 'bg-white text-black font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Guide & FAQ</span>
        </button>

        <button
          onClick={() => setActiveTab('contracts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shrink-0 ${
            activeTab === 'contracts'
              ? 'bg-white text-black font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Verified Contracts</span>
        </button>

        <button
          onClick={() => setActiveTab('bridge')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shrink-0 ${
            activeTab === 'bridge'
              ? 'bg-white text-black font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Hyperlane Warp Routes</span>
        </button>

        <button
          onClick={() => setActiveTab('rpc')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shrink-0 ${
            activeTab === 'rpc'
              ? 'bg-white text-black font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Network & RPC (4663)</span>
        </button>
      </div>

      {/* TAB 1: GUIDE & FAQ */}
      {activeTab === 'faq' && (
        <div className="space-y-10">
          
          {/* Visual 4-Step Architecture Workflow */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6 border-white/[0.10]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-rh-green font-bold block">
                  SYSTEM OVERVIEW
                </span>
                <h2 className="text-xl font-bold text-white font-display mt-0.5">
                  How dAssets Works on Robinhood Chain
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-500">4-Step Lifecycle</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Step 1 */}
              <div className="bg-[#090C12] border border-white/[0.06] rounded-xl p-4 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center font-bold font-mono text-xs">
                  01
                </div>
                <h3 className="text-xs font-bold text-white font-sans">Buy with Native ETH</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Spend regular Robinhood Chain ETH on Uniswap or Mint directly via the protocol vault at live Pyth Oracle NAV.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-[#090C12] border border-white/[0.06] rounded-xl p-4 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-rh-green/10 text-rh-green flex items-center justify-center font-bold font-mono text-xs">
                  02
                </div>
                <h3 className="text-xs font-bold text-white font-sans">Hold Leveraged Exposure</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Enjoy constant 2x, 3x, or 5x Long or Inverse Short tracking. Never worry about margin debt, interest rates, or liquidations.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-[#090C12] border border-white/[0.06] rounded-xl p-4 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold font-mono text-xs">
                  03
                </div>
                <h3 className="text-xs font-bold text-white font-sans">Automated Rebalancing</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Autonomous keepers recalibrate token exposure every 8 hours, locking in upward compounding gains and reducing risk in drops.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-[#090C12] border border-white/[0.06] rounded-xl p-4 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold font-mono text-xs">
                  04
                </div>
                <h3 className="text-xs font-bold text-white font-sans">Convert Back to ETH</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  Exit anytime: click "Sell for ETH" to swap on Uniswap, or "Redeem" to settle proceeds at live Pyth Oracle NAV.
                </p>
              </div>

            </div>
          </div>

          {/* Detailed Step-by-Step Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Action Guide: How to Enter */}
            <div className="glass-panel rounded-2xl p-6 space-y-4 border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-rh-green" />
                <h3 className="font-bold text-sm text-white font-display">How to Enter / Buy a Position</h3>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 font-sans">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-rh-green font-bold">1.</span>
                  <span>Connect your Web3 wallet (Rabby, MetaMask, Robinhood Wallet) to <strong>Robinhood Chain (Chain ID 4663)</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-rh-green font-bold">2.</span>
                  <span>Navigate to <strong>Trade</strong> or <strong>Markets</strong> in the top navigation bar.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-rh-green font-bold">3.</span>
                  <span>Choose your token (e.g. <strong>dBTC3L</strong> for 3x Long Bitcoin, or <strong>dETH3S</strong> for 3x Short Ethereum).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-rh-green font-bold">4.</span>
                  <span>Click <strong>Swap on Uniswap 🦄</strong> to market buy with ETH, or <strong>Mint</strong> to issue tokens at Oracle NAV.</span>
                </li>
              </ul>
            </div>

            {/* Action Guide: How to Exit */}
            <div className="glass-panel rounded-2xl p-6 space-y-4 border-white/[0.08]">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-pink-400" />
                <h3 className="font-bold text-sm text-white font-display">How to Exit / Convert Back to Regular ETH</h3>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 font-sans">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-pink-400 font-bold">Route A:</span>
                  <span><strong>Sell on Uniswap</strong>: Go to <strong>Portfolio</strong> or <strong>Trade</strong>, click <strong>"Sell for ETH"</strong>. Uniswap will pre-load your token as the input and native ETH as the output.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-pink-400 font-bold">Route B:</span>
                  <span><strong>Protocol Redeem</strong>: Click <strong>"Redeem"</strong> on any token row in Portfolio. Enter your token quantity to burn the tokens on-chain and receive settled capital at exact Pyth NAV.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-pink-400 font-bold">Where:</span>
                  <span>Exit buttons are accessible from <strong>Portfolio</strong>, <strong>Trade</strong>, <strong>Oracle Feed</strong>, and inside your <strong>Wallet popup</strong>.</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Interactive Expandable FAQ Accordion */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-4 border-white/[0.10]">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div>
                <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-rh-green" />
                  <span>Frequently Asked Questions</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Answers to common questions about leveraged synthetic mechanics, custody, and liquidation freedom.
                </p>
              </div>
            </div>

            <div className="divide-y divide-white/[0.04] pt-2">
              {faqItems.map((item, idx) => {
                const isOpen = expandedFaqIndex === idx;
                return (
                  <div key={idx} className="py-3.5">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-white hover:text-rh-green transition gap-4 py-1"
                    >
                      <span>{item.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-rh-green' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="text-xs text-slate-300 mt-2.5 leading-relaxed font-sans pr-6 whitespace-pre-line bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: VERIFIED CONTRACTS */}
      {activeTab === 'contracts' && (
        <div>
          <ContractsView />
        </div>
      )}

      {/* TAB 3: HYPERLANE WARP ROUTES */}
      {activeTab === 'bridge' && (
        <div>
          <BridgeExplorer />
        </div>
      )}

      {/* TAB 4: NETWORK & RPC SETTINGS */}
      {activeTab === 'rpc' && (
        <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6 border-white/[0.10]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
            <div>
              <h2 className="text-xl font-bold text-white font-display">
                Robinhood Chain Network Details
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure MetaMask, Rabby, or Robinhood Wallet to interact with Chain ID 4663.
              </p>
            </div>

            <button
              onClick={handleSwitchNetwork}
              disabled={isSwitchingChain}
              className="flex items-center gap-2 bg-rh-green hover:bg-rh-green/90 text-black font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSwitchingChain ? 'animate-spin' : ''}`} />
              <span>1-Click Switch / Add to Wallet</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            
            <div className="bg-[#090C12] border border-white/[0.06] rounded-xl p-4 space-y-1.5">
              <span className="text-[11px] text-slate-500 font-sans uppercase">Network Name</span>
              <div className="text-white font-bold text-sm">Robinhood Chain</div>
            </div>

            <div className="bg-[#090C12] border border-white/[0.06] rounded-xl p-4 space-y-1.5">
              <span className="text-[11px] text-slate-500 font-sans uppercase">Chain ID</span>
              <div className="text-white font-bold text-sm flex items-center justify-between">
                <span>4663</span>
                <CopyButton text="4663" label="Copy" />
              </div>
            </div>

            <div className="bg-[#090C12] border border-white/[0.06] rounded-xl p-4 space-y-1.5">
              <span className="text-[11px] text-slate-500 font-sans uppercase">Currency Symbol</span>
              <div className="text-white font-bold text-sm">ETH</div>
            </div>

            <div className="bg-[#090C12] border border-white/[0.06] rounded-xl p-4 space-y-1.5">
              <span className="text-[11px] text-slate-500 font-sans uppercase">RPC URL</span>
              <div className="text-white font-bold text-xs truncate flex items-center justify-between">
                <span className="truncate mr-2">https://rpc.mainnet.chain.robinhood.com</span>
                <CopyButton text="https://rpc.mainnet.chain.robinhood.com" label="Copy" />
              </div>
            </div>

            <div className="sm:col-span-2 bg-[#090C12] border border-white/[0.06] rounded-xl p-4 space-y-1.5">
              <span className="text-[11px] text-slate-500 font-sans uppercase">Block Explorer URL</span>
              <div className="text-white font-bold text-xs flex items-center justify-between">
                <a 
                  href="https://robinhoodchain.blockscout.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-rh-green hover:underline flex items-center gap-1"
                >
                  <span>https://robinhoodchain.blockscout.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <CopyButton text="https://robinhoodchain.blockscout.com" label="Copy" />
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
