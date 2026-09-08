import React from 'react';
import { 
  Zap, 
  Wallet, 
  ChevronDown,
  Globe,
  ExternalLink
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
    <header className="border-b border-zinc-800/80 bg-[#07090C]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Main Links */}
        <div className="flex items-center space-x-8">
          <div 
            className="flex items-center space-x-2.5 cursor-pointer" 
            onClick={() => setActiveView('home')}
          >
            <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-black text-sm">
              dA
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white">dAssets</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden sm:flex items-center space-x-1">
            <button
              onClick={() => setActiveView('home')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeView === 'home'
                  ? 'text-white bg-zinc-850'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveView('markets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeView === 'markets'
                  ? 'text-white bg-zinc-850'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Markets (270+)
            </button>
            <button
              onClick={() => setActiveView('terminal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeView === 'terminal'
                  ? 'text-white bg-zinc-850'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Terminal
            </button>
            <button
              onClick={() => setActiveView('bridge')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeView === 'bridge'
                  ? 'text-white bg-zinc-850'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Hyperlane
            </button>
          </nav>
        </div>

        {/* Right Controls: Network & Wallet */}
        <div className="flex items-center space-x-3">
          
          {/* Network Pill */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rh-green"></span>
            <span>Robinhood Chain</span>
          </div>

          {/* Wallet Button */}
          {wallet.isConnected ? (
            <button
              onClick={onOpenWalletModal}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rh-green"></div>
              <span>{wallet.address}</span>
              {wallet.isDemo && (
                <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1 py-0.5 rounded font-sans uppercase">
                  Preview
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            </button>
          ) : (
            <button
              onClick={onOpenWalletModal}
              className="flex items-center gap-1.5 bg-white hover:bg-zinc-200 text-black px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
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
