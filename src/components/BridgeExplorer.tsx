import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink, 
  Search
} from 'lucide-react';
import { BridgeTransaction } from '../types';
import { BridgeService } from '../services/bridge';
import { CopyButton } from './CopyButton';
import deployedConfig from '../contracts/deployedAddresses.json';

export const BridgeExplorer: React.FC = () => {
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);
  const [filter, setFilter] = useState('');

  const mailboxAddress = deployedConfig?.hyperlaneMailbox || '0x3a867fCfFeC2B790970eeBDC9023E75B0a172aa7';

  useEffect(() => {
    const unsub = BridgeService.getInstance().subscribeTransactions(setTransactions);
    return unsub;
  }, []);

  const filtered = transactions.filter(t => 
    t.assetSymbol.toLowerCase().includes(filter.toLowerCase()) ||
    t.txHash.toLowerCase().includes(filter.toLowerCase()) ||
    t.recipient.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-slate-100 selection:bg-rh-green selection:text-black">
      
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-slate-300 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-rh-green animate-pulse"></span>
              <span>Hyperlane Warp Route Ledger • Domain 4663</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">
              Hyperlane Warp Routes
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed font-sans">
              Interchain settlement ledger routing perpetual collateral from Bounce.tech HyperEVM to Robinhood Chain Mainnet.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80 self-start sm:self-center">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search tx hash, symbol, address..."
              className="w-full bg-[#090C10] border border-white/[0.08] focus:border-white/[0.25] rounded-md pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition font-mono"
            />
          </div>
        </div>

        {/* Network Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs pt-2">
          <div className="bg-[#090C10] border border-white/[0.08] rounded-xl p-5 space-y-2 shadow-xl">
            <div className="text-[11px] text-slate-500 uppercase font-sans font-medium">Origin Network</div>
            <div className="text-base font-bold text-white font-display">
              HyperEVM (Domain 999)
            </div>
            <div className="text-[11px] text-rh-green flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Bounce.tech Perp Vaults</span>
            </div>
          </div>

          <div className="bg-[#090C10] border border-white/[0.08] rounded-xl p-5 space-y-2 shadow-xl">
            <div className="text-[11px] text-slate-500 uppercase font-sans font-medium">Transport Protocol</div>
            <div className="text-base font-bold text-white font-display">
              Hyperlane Mailbox
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span>{mailboxAddress.slice(0, 8)}...{mailboxAddress.slice(-4)}</span>
              <CopyButton text={mailboxAddress} label="Copy" />
            </div>
          </div>

          <div className="bg-[#090C10] border border-white/[0.08] rounded-xl p-5 space-y-2 shadow-xl">
            <div className="text-[11px] text-slate-500 uppercase font-sans font-medium">Destination Network</div>
            <div className="text-base font-bold text-white font-display">
              Robinhood Chain (4663)
            </div>
            <div className="text-[11px] text-rh-green flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>ERC-20 Factory Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#090C10] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/[0.06] font-bold text-xs text-white font-display flex items-center justify-between">
          <span>Warp Route Execution Ledger</span>
          <span className="text-[11px] font-mono text-slate-500">{filtered.length} Dispatched</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#07090D] text-[11px] font-mono text-slate-500 uppercase">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Minted Token</th>
                <th className="py-3 px-4 text-right">Collateral</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4 text-right">Tx Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-sans">
                      <span className="text-slate-300">HyperEVM</span>
                      <ArrowRight className="w-3 h-3 text-rh-green" />
                      <span className="text-white font-medium">Robinhood</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-white font-bold text-xs">{tx.amount} {tx.assetSymbol}</span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300">
                    ${tx.usdcPaid.toFixed(2)} USDC
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {tx.recipient.length > 14 ? `${tx.recipient.slice(0, 6)}...${tx.recipient.slice(-4)}` : tx.recipient}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={`https://robinhoodchain.blockscout.com/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-rh-green hover:underline flex items-center gap-1"
                      >
                        <span>{tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <CopyButton text={tx.txHash} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
