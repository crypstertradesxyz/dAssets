import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Layers, 
  Search,
  Clock
} from 'lucide-react';
import { BridgeTransaction } from '../types';
import { BridgeService } from '../services/bridge';

export const BridgeExplorer: React.FC = () => {
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);
  const [filter, setFilter] = useState('');

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-rh-green" />
            <span>Hyperlane Warp Route Explorer</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time interchain ledger of leveraged assets minted from HyperEVM to Robinhood Chain.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search tx hash, symbol, address..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rh-green transition"
          />
        </div>
      </div>

      {/* Network Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0C1116] border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Origin Chain</div>
          <div className="text-lg font-bold text-white mt-1 flex items-center gap-1.5">
            <span>HyperEVM (Bounce.tech)</span>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">Domain: 999</span>
          </div>
          <div className="text-[11px] text-rh-green mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Mailbox Outbox Active
          </div>
        </div>

        <div className="bg-[#0C1116] border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Transport Layer</div>
          <div className="text-lg font-bold text-white mt-1 flex items-center gap-1.5">
            <span>Hyperlane Warp Routes</span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Multisig ISM (5/7 Validator Quorum)
          </div>
        </div>

        <div className="bg-[#0C1116] border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Destination Chain</div>
          <div className="text-lg font-bold text-white mt-1 flex items-center gap-1.5">
            <span>Robinhood Chain</span>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">Chain ID: 4663</span>
          </div>
          <div className="text-[11px] text-rh-green mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Warp Route Factory Deployed
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#0C1116] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-800 font-bold text-sm text-zinc-200">
          Recent Warp Route Dispatches ({filtered.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-900/60 text-[11px] text-zinc-400 uppercase font-semibold">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Minted Asset</th>
                <th className="py-3 px-4 text-right">Collateral Backing</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Security Module</th>
                <th className="py-3 px-4 text-right">Transaction Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-zinc-800/30 transition">
                  <td className="py-3.5 px-4 text-zinc-400 text-[11px]">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 text-[11px] font-sans">
                      <span className="text-zinc-300">HyperEVM</span>
                      <ArrowRight className="w-3 h-3 text-rh-green" />
                      <span className="text-white font-bold">Robinhood</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-rh-green font-bold text-xs">{tx.amount} {tx.assetSymbol}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-zinc-300">
                    ${tx.usdcPaid.toLocaleString()} USDC
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400">
                    {tx.recipient}
                  </td>
                  <td className="py-3.5 px-4 font-sans text-[11px] text-zinc-300">
                    <span className="inline-flex items-center gap-1 text-rh-green">
                      <ShieldCheck className="w-3 h-3" /> Hyperlane ISM
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-zinc-500 hover:text-rh-green transition">
                    <span className="truncate max-w-[120px] inline-block">
                      {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-6)}
                    </span>
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
