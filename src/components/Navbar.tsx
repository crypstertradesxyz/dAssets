import React from 'react';
import { 
  Wallet, 
  ChevronDown
} from 'lucide-react';
import { WalletState } from '../types';

interface NavbarProps {
  wallet: WalletState;
  onOpenWalletModal: () => void;
  activeView: 'home' | 'markets' | 'terminal' | 'bridge';
  setActiveView: (view: 'home' | 'markets' | 'terminal' | 'bridge') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  wallet,
  onOpenWalletModal,
  activeView,
  setActiveView
}) => {
  return (
    <header className="border-b border-white/[0.06] bg-[#050608]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        
        {/* Brand & Main Links */}
        <div className="flex items-center space-x-8">
          <div 
            className="flex items-center space-x-2 cursor-pointer select-none" 
            onClick={() => setActiveView('home')}
          >
            <div className="w-7 h-7 rounded bg-white text-black flex items-center justify-center font-black text-xs font-display">
              dA
            </div>
            <span className="font-bold text-base tracking-tight text-white font-display">dAssets</span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden sm:flex items-center space-x-1">
            <button
              onClick={() => setActiveView('home')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeView === 'home'
                  ? 'text-white bg-white/[0.08]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveView('markets')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeView === 'markets'
                  ? 'text-white bg-white/[0.08]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Markets (270+)
            </button>
            <button
              onClick={() => setActiveView('terminal')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeView === 'terminal'
                  ? 'text-white bg-white/[0.08]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Terminal
            </button>
            <button
              onClick={() => setActiveView('bridge')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeView === 'bridge'
                  ? 'text-white bg-white/[0.08]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hyperlane
            </button>
          </nav>
        </div>

        {/* Right Controls: Network & Wallet */}
        <div className="flex items-center space-x-2.5">
          
          {/* Network Pill */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-rh-green"></span>
            <span>Robinhood (4663)</span>
          </div>

          {/* Wallet Button */}
          {wallet.isConnected ? (
            <button
              onClick={onOpenWalletModal}
              className="flex items-center gap-2 bg-[#0E1218] hover:bg-[#141A22] text-slate-200 border border-white/[0.10] px-3 py-1.5 rounded-md text-xs font-mono font-medium transition"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rh-green"></div>
              <span>{wallet.address}</span>
              {wallet.isDemo && (
                <span className="text-[9px] bg-white/[0.08] text-slate-400 px-1 py-0.5 rounded font-sans uppercase">
                  Preview
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>
          ) : (
            <button
              onClick={onOpenWalletModal}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-200 text-black px-3.5 py-1.5 rounded-md text-xs font-semibold transition active:scale-95 shadow-sm"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect Wallet</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
