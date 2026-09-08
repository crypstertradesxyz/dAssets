import React from 'react';
import { ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-900 bg-[#07090C] text-xs text-zinc-500 py-10 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 rounded-md overflow-hidden border border-white/[0.15] bg-[#050608] flex items-center justify-center">
            <img src="/logo.png" alt="dAssets" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-white tracking-tight font-display">dAssets</span>
          <span className="text-zinc-600">•</span>
          <span>Robinhood Chain Mainnet (4663)</span>
        </div>

        <div className="flex items-center space-x-6 text-xs text-zinc-400">
          <a
            href="https://robinhoodchain.blockscout.com/address/0x31390C104d777c03B00E95967E3F2905993f947b"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white flex items-center gap-1 transition"
          >
            <span>Factory Contract</span>
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
    </footer>
  );
};
