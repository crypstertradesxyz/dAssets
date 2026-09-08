import React from 'react';
import { X, Wallet, LogOut, ChevronRight, Check } from 'lucide-react';
import { WalletState } from '../types';
import { Web3Service } from '../services/web3';

interface WalletModalProps {
  wallet: WalletState;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ wallet, onClose }) => {
  const web3 = Web3Service.getInstance();

  const handleConnectInjected = async (type: 'robinhood' | 'metamask' | 'rabby') => {
    await web3.connectInjected(type);
    onClose();
  };

  const handleDisconnect = () => {
    web3.disconnect();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0D1016] border border-white/[0.12] rounded-lg w-full max-w-sm overflow-hidden shadow-2xl relative text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#0A0D12]">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-white/[0.06] border border-white/[0.10] text-slate-300 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {wallet.isConnected ? 'Connected Account' : 'Connect Wallet'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">Robinhood Chain (4663)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {wallet.isConnected ? (
            <div className="space-y-4 font-mono text-xs">
              <div className="bg-[#090C10] border border-white/[0.06] rounded-md p-3.5 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Address:</span>
                  <span className="text-white font-bold">{wallet.address}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Network:</span>
                  <span className="text-rh-green font-bold">{wallet.networkName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Robinhood ETH:</span>
                  <span className="text-white font-bold">{wallet.balanceEth} ETH</span>
                </div>
              </div>

              {/* Active Portfolio Positions */}
              {Object.entries(wallet.holdings || {}).filter(([_, qty]) => qty > 0).length > 0 ? (
                <div className="bg-[#090C10] border border-white/[0.06] rounded-md p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-sans font-semibold text-slate-400 uppercase tracking-wider">
                      Active Positions
                    </span>
                    <span className="text-[10px] text-rh-green font-mono">Verified On-Chain</span>
                  </div>
                  <div className="space-y-2 pt-1 border-t border-white/[0.04]">
                    {Object.entries(wallet.holdings || {})
                      .filter(([_, qty]) => qty > 0)
                      .map(([symbol, qty]) => (
                        <div key={symbol} className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white font-mono">{symbol}</span>
                          <span className="text-slate-200 font-mono font-medium">{qty.toFixed(4)} tokens</span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="bg-[#090C10] border border-white/[0.06] rounded-md p-3 text-center text-slate-500 text-[11px] font-sans">
                  No active leveraged tokens held on Robinhood Chain.
                </div>
              )}

              <button
                onClick={handleDisconnect}
                className="w-full flex items-center justify-center gap-2 bg-[#090C10] hover:bg-red-500/10 hover:text-red-400 text-slate-300 py-2.5 px-4 rounded-md border border-white/[0.08] transition text-xs font-sans font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Option 1: Browser Extension / MetaMask */}
              <button
                onClick={() => handleConnectInjected('metamask')}
                className="w-full flex items-center justify-between p-3 rounded-md bg-[#090C10] hover:bg-[#121620] border border-white/[0.08] hover:border-white/[0.2] transition text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center text-sm font-bold">
                    🦊
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">MetaMask / Browser Wallet</div>
                    <div className="text-[11px] text-slate-400">Direct on-chain connection</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              </button>

              {/* Option 2: Robinhood Wallet */}
              <button
                onClick={() => handleConnectInjected('robinhood')}
                className="w-full flex items-center justify-between p-3 rounded-md bg-[#090C10] hover:bg-[#121620] border border-white/[0.08] hover:border-white/[0.2] transition text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-rh-green/10 text-rh-green flex items-center justify-center text-xs font-bold font-mono">
                    RH
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Robinhood Wallet</div>
                    <div className="text-[11px] text-slate-400">Mobile or extension wallet</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              </button>

              {/* Option 3: Rabby Wallet */}
              <button
                onClick={() => handleConnectInjected('rabby')}
                className="w-full flex items-center justify-between p-3 rounded-md bg-[#090C10] hover:bg-[#121620] border border-white/[0.08] hover:border-white/[0.2] transition text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold font-mono">
                    RB
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Rabby Wallet</div>
                    <div className="text-[11px] text-slate-400">EVM Web3 wallet</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
