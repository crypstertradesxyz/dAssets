import React from 'react';
import { TrendingUp, TrendingDown, Flame } from 'lucide-react';
import { LeveragedAsset } from '../types';

interface TickerBarProps {
  assets: LeveragedAsset[];
  onSelectAsset: (asset: LeveragedAsset) => void;
}

export const TickerBar: React.FC<TickerBarProps> = ({ assets, onSelectAsset }) => {
  // Pick a highlight reel of notable leveraged assets
  const featured = assets.filter(a => 
    ['dBTC3L', 'dETH3L', 'dSOL3L', 'dHYPE3L', 'dPEPE3L', 'dSUI3L', 'dTAO3L', 'dDOGE3L', 'dPENDLE3L'].includes(a.symbol)
  );

  return (
    <div className="bg-[#0A0E12] border-b border-zinc-800/80 overflow-hidden py-2 text-xs">
      <div className="flex animate-ticker whitespace-nowrap space-x-8">
        {[...featured, ...featured, ...featured].map((asset, idx) => (
          <div
            key={`${asset.symbol}-${idx}`}
            onClick={() => onSelectAsset(asset)}
            className="flex items-center space-x-2.5 cursor-pointer px-2 py-0.5 rounded hover:bg-zinc-800/70 transition"
          >
            <span className="font-mono font-bold text-zinc-200">{asset.symbol}</span>
            <span className="font-mono text-zinc-400">${asset.currentNav.toFixed(2)}</span>
            <span
              className={`flex items-center text-[11px] font-mono font-semibold ${
                asset.change24h >= 0 ? 'text-rh-green' : 'text-red-400'
              }`}
            >
              {asset.change24h >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-0.5 inline" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-0.5 inline" />
              )}
              {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
            </span>
            <span className="text-[10px] text-zinc-600 font-mono">
              [Lev: {asset.leverage}x]
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
