import React from 'react';
import { ExternalLink } from 'lucide-react';
import { AppView } from '../types';

interface FooterProps {
  onNavigate?: (view: AppView) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleInternalNav = (view: AppView, e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    if (onNavigate) {
      onNavigate(view);
    }
  };

  return (
    <footer className="border-t border-white/[0.08] bg-[#05070A]/85 backdrop-blur-xl text-xs text-slate-400 py-10 mt-20 shadow-2xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Top Row: Brand & Internal Page Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
          <a
            href="/"
            onClick={(e) => handleInternalNav('home', e)}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-md overflow-hidden border border-white/[0.15] bg-[#050608] flex items-center justify-center group-hover:border-rh-green/50 transition">
              <img src="/logo.png" alt="dAssets" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-white tracking-tight font-display">dAssets</span>
            <span className="text-zinc-600">•</span>
            <span className="text-slate-400">Robinhood Chain Mainnet (4663)</span>
          </a>

          {/* Dedicated Internal Page URLs */}
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium">
            <a
              href="/"
              onClick={(e) => handleInternalNav('home', e)}
              className="text-slate-400 hover:text-white transition"
            >
              Overview
            </a>
            <a
              href="/trade"
              onClick={(e) => handleInternalNav('trade', e)}
              className="text-slate-400 hover:text-white transition"
            >
              Trade / Swap
            </a>
            <a
              href="/markets"
              onClick={(e) => handleInternalNav('markets', e)}
              className="text-slate-400 hover:text-white transition"
            >
              Markets
            </a>
            <a
              href="/portfolio"
              onClick={(e) => handleInternalNav('portfolio', e)}
              className="text-slate-400 hover:text-white transition"
            >
              Portfolio
            </a>
            <a
              href="/pools"
              onClick={(e) => handleInternalNav('pools', e)}
              className="text-slate-400 hover:text-white transition"
            >
              Pools
            </a>
            <a
              href="/info"
              onClick={(e) => handleInternalNav('info', e)}
              className="text-slate-400 hover:text-white transition"
            >
              Info & FAQ
            </a>
            <a
              href="/terminal"
              onClick={(e) => handleInternalNav('terminal', e)}
              className="text-slate-400 hover:text-white transition"
            >
              Terminal
            </a>
            <a
              href="/bridge"
              onClick={(e) => handleInternalNav('bridge', e)}
              className="text-slate-400 hover:text-white transition"
            >
              Hyperlane
            </a>
            <a
              href="/contracts"
              onClick={(e) => handleInternalNav('contracts', e)}
              className="text-slate-400 hover:text-white transition"
            >
              Contracts
            </a>
          </nav>
        </div>

        {/* Bottom Row: Social & External Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p className="text-slate-500">
            Autonomous on-chain tokenized leverage. Zero margin debt. Zero liquidation wicks.
          </p>

          <div className="flex flex-wrap items-center space-x-6">
            <a
              href="https://x.com/dAssetsRH"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white flex items-center gap-1.5 transition text-slate-200 font-semibold"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>@dAssetsRH</span>
            </a>
            <a
              href="https://robinhoodchain.blockscout.com/address/0x31390C104d777c03B00E95967E3F2905993f947b"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white flex items-center gap-1 transition"
            >
              <span>Blockscout</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://hyperlane.xyz"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white flex items-center gap-1 transition"
            >
              <span>Hyperlane</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://bounce.tech"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white flex items-center gap-1 transition"
            >
              <span>Bounce.tech</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
