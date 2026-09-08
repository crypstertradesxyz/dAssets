import React from 'react';
import { motion } from 'framer-motion';
import { 
  ExternalLink, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  Radio, 
  CheckCircle2,
  Network
} from 'lucide-react';
import { CopyButton } from './CopyButton';
import deployedConfig from '../contracts/deployedAddresses.json';

export const ContractsView: React.FC = () => {
  const factoryAddress = deployedConfig?.factory || '0x31390C104d777c03B00E95967E3F2905993f947b';
  const flagshipAddress = deployedConfig?.flagshipToken?.address || '0x5164E1dc1Be45a0Fbe4D6A25A4713225E9bb56F6';
  const oracleAddress = deployedConfig?.oracle || '0x0c19e8DE99BA135aBdc059b34e0d3F9E5e021fd0';
  const mailboxAddress = deployedConfig?.hyperlaneMailbox || '0x3a867fCfFeC2B790970eeBDC9023E75B0a172aa7';
  const hyperevmMailbox = '0x3a464f746D23Ab22155710f44dB16dcA53e0775E';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-slate-100"
    >
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
              Robinhood Chain Mainnet Registry
            </h1>
            <span className="text-[10px] bg-rh-green/10 text-rh-green border border-rh-green/20 px-2 py-0.5 rounded font-mono font-semibold">
              CHAIN 4663
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Official immutable smart contract addresses broadcast on-chain.
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

      {/* Core Contracts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
        
        {/* dAsset Factory */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-[#090C10] border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-5 space-y-3 transition shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-white text-xs font-sans font-semibold block">dAsset Factory</span>
              <span className="text-[11px] text-slate-500 font-sans">Token deployment & minting engine</span>
            </div>
            <CopyButton text={factoryAddress} label="Copy" />
          </div>

          <div className="text-slate-200 font-medium truncate text-xs bg-[#0D1016] border border-white/[0.04] px-3 py-2 rounded-md">
            {factoryAddress}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-rh-green flex items-center gap-1 font-sans">
              <CheckCircle2 className="w-3 h-3" />
              <span>Verified On-Chain</span>
            </span>
            <a
              href={`https://robinhoodchain.blockscout.com/address/${factoryAddress}`}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white text-[11px] inline-flex items-center gap-1 font-sans hover:underline"
            >
              <span>View on Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>

        {/* Flagship Token */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-[#090C10] border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-5 space-y-3 transition shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-white text-xs font-sans font-semibold block">Flagship dBTC3L (3x Long)</span>
              <span className="text-[11px] text-slate-500 font-sans">Constant leverage ERC-20 position</span>
            </div>
            <CopyButton text={flagshipAddress} label="Copy" />
          </div>

          <div className="text-slate-200 font-medium truncate text-xs bg-[#0D1016] border border-white/[0.04] px-3 py-2 rounded-md">
            {flagshipAddress}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-rh-green flex items-center gap-1 font-sans">
              <CheckCircle2 className="w-3 h-3" />
              <span>Active Token</span>
            </span>
            <a
              href={`https://robinhoodchain.blockscout.com/address/${flagshipAddress}`}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white text-[11px] inline-flex items-center gap-1 font-sans hover:underline"
            >
              <span>View on Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>

        {/* Deployed Token dBTC5L */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-[#090C10] border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-5 space-y-3 transition shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-white text-xs font-sans font-semibold block">dBTC5L (5x Long)</span>
              <span className="text-[11px] text-slate-500 font-sans">High-leverage Bitcoin ERC-20 position</span>
            </div>
            <CopyButton text="0xE0Df63EDFDC180E256426db9E95E99F40B8B33bF" label="Copy" />
          </div>

          <div className="text-slate-200 font-medium truncate text-xs bg-[#0D1016] border border-white/[0.04] px-3 py-2 rounded-md">
            0xE0Df63EDFDC180E256426db9E95E99F40B8B33bF
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-rh-green flex items-center gap-1 font-sans">
              <CheckCircle2 className="w-3 h-3" />
              <span>Active Token</span>
            </span>
            <a
              href="https://robinhoodchain.blockscout.com/address/0xE0Df63EDFDC180E256426db9E95E99F40B8B33bF"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white text-[11px] inline-flex items-center gap-1 font-sans hover:underline"
            >
              <span>View on Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>

        {/* Oracle Feed */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-[#090C10] border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-5 space-y-3 transition shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-white text-xs font-sans font-semibold block">Robinhood NAV Oracle</span>
              <span className="text-[11px] text-slate-500 font-sans">HyperEVM perpetual price sync</span>
            </div>
            <CopyButton text={oracleAddress} label="Copy" />
          </div>

          <div className="text-slate-200 font-medium truncate text-xs bg-[#0D1016] border border-white/[0.04] px-3 py-2 rounded-md">
            {oracleAddress}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-rh-green flex items-center gap-1 font-sans">
              <CheckCircle2 className="w-3 h-3" />
              <span>Live Price Feed</span>
            </span>
            <a
              href={`https://robinhoodchain.blockscout.com/address/${oracleAddress}`}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white text-[11px] inline-flex items-center gap-1 font-sans hover:underline"
            >
              <span>View on Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>

        {/* Hyperlane Mailbox */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-[#090C10] border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-5 space-y-3 transition shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-white text-xs font-sans font-semibold block">Hyperlane Mailbox (Domain 4663)</span>
              <span className="text-[11px] text-slate-500 font-sans">Official cross-chain messaging inbox</span>
            </div>
            <CopyButton text={mailboxAddress} label="Copy" />
          </div>

          <div className="text-slate-200 font-medium truncate text-xs bg-[#0D1016] border border-white/[0.04] px-3 py-2 rounded-md">
            {mailboxAddress}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-rh-green flex items-center gap-1 font-sans">
              <CheckCircle2 className="w-3 h-3" />
              <span>Canonical Hyperlane</span>
            </span>
            <a
              href={`https://robinhoodchain.blockscout.com/address/${mailboxAddress}`}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white text-[11px] inline-flex items-center gap-1 font-sans hover:underline"
            >
              <span>Official Mailbox</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>

      </div>

      {/* Network Configuration Reference */}
      <div className="bg-[#090C10] border border-white/[0.08] rounded-xl p-6 space-y-4">
        <div className="border-b border-white/[0.06] pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-rh-green" />
            <h2 className="text-sm font-bold text-white font-display">
              Robinhood Chain Connection Parameters
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500">Arbitrum Orbit L2</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-[#0D1016] border border-white/[0.04] p-3 rounded-lg space-y-1">
            <div className="text-slate-500 text-[10px] uppercase font-sans">Network Name</div>
            <div className="text-white font-medium">Robinhood Chain</div>
          </div>

          <div className="bg-[#0D1016] border border-white/[0.04] p-3 rounded-lg space-y-1">
            <div className="text-slate-500 text-[10px] uppercase font-sans">Chain ID</div>
            <div className="text-rh-green font-medium">4663</div>
          </div>

          <div className="bg-[#0D1016] border border-white/[0.04] p-3 rounded-lg space-y-1">
            <div className="text-slate-500 text-[10px] uppercase font-sans">Currency Symbol</div>
            <div className="text-white font-medium">ETH</div>
          </div>

          <div className="bg-[#0D1016] border border-white/[0.04] p-3 rounded-lg space-y-1">
            <div className="text-slate-500 text-[10px] uppercase font-sans">RPC Endpoint</div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-slate-300 truncate text-[11px]">rpc.mainnet.chain.robinhood.com</span>
              <CopyButton text="https://rpc.mainnet.chain.robinhood.com" label="" />
            </div>
          </div>
        </div>
      </div>

    </motion.div>
  );
};
