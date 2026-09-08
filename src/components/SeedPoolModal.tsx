import React, { useState } from 'react';
import { 
  X, 
  Droplets, 
  CheckCircle2, 
  Loader2, 
  Info, 
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LeveragedAsset, WalletState, LiquidityPool } from '../types';
import { BridgeService } from '../services/bridge';
import { OracleService } from '../services/oracle';
import { CopyButton } from './CopyButton';
import { getUniswapSwapUrl, getBlockscoutAddressUrl } from '../utils/uniswap';

interface SeedPoolModalProps {
  asset: LeveragedAsset;
  wallet: WalletState;
  onClose: () => void;
  onOpenWalletModal: () => void;
}

export const SeedPoolModal: React.FC<SeedPoolModalProps> = ({
  asset,
  wallet,
  onClose,
  onOpenWalletModal,
}) => {
  const [assetAmount, setAssetAmount] = useState('25');
  const [isDeploying, setIsDeploying] = useState(false);
  const [createdPool, setCreatedPool] = useState<LiquidityPool | null>(null);

  const amountNumber = parseFloat(assetAmount) || 0;
  const usdcRequired = Number((amountNumber * asset.currentNav).toFixed(2));
  const estimatedApr = 24.8;

  const handleDeployPool = async () => {
    if (!wallet.isConnected) {
      onOpenWalletModal();
      return;
    }

    setIsDeploying(true);

    try {
      await new Promise(r => setTimeout(r, 1400));
      const bridge = BridgeService.getInstance();
      const creator = wallet.address || '0x71C85...89A4';
      
      const pool = bridge.seedPool(
        asset.symbol,
        amountNumber,
        usdcRequired,
        asset.currentNav,
        creator
      );

      const initialTvl = usdcRequired * 2;
      OracleService.getInstance().updateAssetMintStatus(
        asset.symbol,
        asset.tokenAddress || '0x' + pool.poolAddress.slice(2, 42),
        pool.poolAddress,
        initialTvl
      );

      setCreatedPool(pool);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00C805', '#FFFFFF', '#94A3B8']
      });
    } catch (err) {
      console.error('Failed to seed pool:', err);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0D1016] border border-white/[0.12] rounded-lg w-full max-w-md overflow-hidden shadow-2xl relative text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#0A0D12]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-white/[0.06] border border-white/[0.12] text-white flex items-center justify-center font-bold text-xs">
              <Droplets className="w-4 h-4 text-rh-green" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Seed AMM Pool</h3>
              <p className="text-[11px] text-slate-400">Pair {asset.symbol} / USDC on Robinhood Chain</p>
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
        <div className="p-5 space-y-5">
          {createdPool ? (
            /* Success View */
            <div className="space-y-4">
              <div className="text-center py-2 space-y-2">
                <div className="w-10 h-10 bg-rh-green/10 border border-rh-green/30 text-rh-green rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-white">AMM Pool Seeded</h4>
                <p className="text-xs text-slate-400">
                  Pool pair <strong className="text-white font-mono">{asset.symbol} / USDC</strong> is now active on Robinhood Chain.
                </p>
              </div>

              {/* Pool Details Card */}
              <div className="bg-[#090C10] border border-white/[0.06] rounded-md p-3.5 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Pool Address:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-200">{createdPool.poolAddress.slice(0, 6)}...{createdPool.poolAddress.slice(-4)}</span>
                    <CopyButton text={createdPool.poolAddress} label="Copy" />
                  </div>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Initial Supply:</span>
                  <span className="text-slate-200">{amountNumber} {asset.symbol} + ${usdcRequired} USDC</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>AMM Starting NAV:</span>
                  <span className="text-rh-green font-bold">${asset.currentNav.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Projected APR:</span>
                  <span className="text-white font-bold">{createdPool.apr}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <a
                  href={getUniswapSwapUrl(asset.tokenAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-pink-500 hover:bg-pink-400 text-white font-semibold rounded-md text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 cursor-pointer"
                  title="Trade on Uniswap (Robinhood Chain)"
                >
                  <img src="/logos/uni.png" alt="Uniswap" className="w-4 h-4 rounded-full bg-white p-0.5" />
                  <span>Trade Pair on Uniswap</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href={getBlockscoutAddressUrl(createdPool.poolAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 font-semibold rounded-md text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  title="View Contract on Robinhood Blockscout"
                >
                  <span>Verify Pool on Blockscout</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={onClose}
                  className="w-full py-2 px-4 bg-transparent hover:bg-white/[0.04] text-slate-400 hover:text-white font-medium rounded-md text-xs transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Seeding Inputs */
            <>
              <div className="bg-[#090C10] border border-white/[0.06] rounded-md p-3 text-xs text-slate-300 flex items-start gap-2.5">
                <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-[11px] leading-relaxed">
                  Pool ratio is locked to the live Oracle NAV (${asset.currentNav.toFixed(2)}) to ensure initial parity and zero immediate arbitrage impact.
                </span>
              </div>

              {/* Supply Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <label className="font-medium font-sans">Supply {asset.symbol}</label>
                  <span className="font-mono text-[11px]">NAV: ${asset.currentNav.toFixed(2)}</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={assetAmount}
                    onChange={(e) => setAssetAmount(e.target.value)}
                    disabled={isDeploying}
                    placeholder="25"
                    className="w-full bg-[#090C10] border border-white/[0.10] focus:border-white/[0.3] rounded-md px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none transition"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500">
                    {asset.symbol}
                  </span>
                </div>
              </div>

              {/* Paired Collateral */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <label className="font-medium font-sans">Paired Collateral (USDC)</label>
                  <span className="font-mono text-[11px]">1 {asset.symbol} = ${asset.currentNav.toFixed(2)} USDC</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={`$${usdcRequired.toLocaleString()}`}
                    className="w-full bg-[#090C10]/60 border border-white/[0.06] rounded-md px-3.5 py-2.5 text-sm font-mono text-slate-300 focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-500">
                    USDC
                  </span>
                </div>
              </div>

              {/* Specs */}
              <div className="bg-[#090C10] border border-white/[0.06] rounded-md p-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Initial Pool Share:</span>
                  <span className="text-white">100.00%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Fee Tier:</span>
                  <span className="text-white">0.30%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Projected APR:</span>
                  <span className="text-rh-green font-bold">~{estimatedApr}%</span>
                </div>
              </div>

              {/* Deploy Button */}
              <button
                onClick={handleDeployPool}
                disabled={isDeploying || amountNumber <= 0}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-200 disabled:bg-white/[0.06] disabled:text-slate-600 text-black font-semibold py-3 px-4 rounded-md text-xs transition active:scale-98 shadow-sm"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deploying AMM Pool Contract...</span>
                  </>
                ) : !wallet.isConnected ? (
                  <span>Connect Wallet to Seed Pool</span>
                ) : (
                  <>
                    <Droplets className="w-3.5 h-3.5 fill-current" />
                    <span>Deploy & Seed {asset.symbol} / USDC Pool</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
