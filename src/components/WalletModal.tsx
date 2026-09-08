import React from 'react';
import { X, Wallet, Shield, Check, ExternalLink, Sparkles, LogOut, ChevronRight } from 'lucide-react';
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

  const handleEnableDemo = () => {
    web3.enableDemoMode();
    onClose();
  };

  const handleDisconnect = () => {
    web3.disconnect();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0D1217] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rh-green/10 border border-rh-green/30 text-rh-green flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {wallet.isConnected ? 'Connected Wallet' : 'Connect Wallet'}
              </h3>
              <p className="text-[11px] text-zinc-400">Robinhood Chain (ID: 4663)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {wallet.isConnected ? (
            /* Connected State */
            <div className="space-y-4">
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 text-xs font-mono space-y-2.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Address:</span>
                  <span className="text-white font-bold">{wallet.address}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Network:</span>
                  <span className="text-rh-green font-bold">{wallet.networkName}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>USDC Balance:</span>
                  <span className="text-white font-bold">${wallet.balanceUsdc}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>ETH Balance:</span>
                  <span className="text-white font-bold">{wallet.balanceEth} ETH</span>
                </div>
                {wallet.isDemo && (
                  <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-400 font-sans">
                    Connected with <strong className="text-white font-semibold">Quick Start Account</strong>. Pre-loaded with test funds so you can mint and test pools instantly.
                  </div>
                )}
              </div>

              <button
                onClick={handleDisconnect}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 text-zinc-300 font-semibold py-2.5 px-4 rounded-xl border border-zinc-750 transition text-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect</span>
              </button>
            </div>
          ) : (
            /* Connect Options */
            <div className="space-y-2.5">
              {/* Option 1: Quick Start */}
              <button
                onClick={handleEnableDemo}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-850 border border-zinc-700 hover:border-zinc-500 transition text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-white/10 text-white flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Quick Start Access</span>
                      <span className="bg-white text-black font-bold text-[9px] px-1.5 py-0.2 rounded">
                        1-Click
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Instantly test minting & pools on Robinhood Chain
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-rh-green transition" />
              </button>

              {/* Option 2: Robinhood Wallet */}
              <button
                onClick={() => handleConnectInjected('robinhood')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-[#00C805]/10 text-rh-green flex items-center justify-center font-bold text-sm">
                    RH
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Robinhood Wallet</div>
                    <div className="text-[11px] text-zinc-400">Connect via Robinhood mobile or extension</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition" />
              </button>

              {/* Option 3: MetaMask / Injected */}
              <button
                onClick={() => handleConnectInjected('metamask')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
                    🦊
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">MetaMask / Injected</div>
                    <div className="text-[11px] text-zinc-400">Standard browser EVM wallet</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition" />
              </button>

              {/* Option 4: Rabby */}
              <button
                onClick={() => handleConnectInjected('rabby')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm">
                    🐰
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Rabby Wallet</div>
                    <div className="text-[11px] text-zinc-400">Multi-chain DeFi wallet</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
