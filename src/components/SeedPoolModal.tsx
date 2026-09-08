import React, { useState } from 'react';
import { 
  X, 
  Droplets, 
  CheckCircle2, 
  Loader2, 
  Info, 
  Layers, 
  ArrowRight,
  TrendingUp 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LeveragedAsset, WalletState, LiquidityPool } from '../types';
import { BridgeService } from '../services/bridge';
import { OracleService } from '../services/oracle';

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
  // Compute matching USDC needed based on current Oracle NAV
  const usdcRequired = Number((amountNumber * asset.currentNav).toFixed(2));
  const estimatedApr = 26.4;

  const handleDeployPool = async () => {
    if (!wallet.isConnected) {
      onOpenWalletModal();
      return;
    }

    setIsDeploying(true);

    try {
      await new Promise(r => setTimeout(r, 1500));
      const bridge = BridgeService.getInstance();
      const creator = wallet.address || '0x71C...89A4';
      
      const pool = bridge.seedPool(
        asset.symbol,
        amountNumber,
        usdcRequired,
        asset.currentNav,
        creator
      );

      // Register pool with Oracle Service
      const initialTvl = usdcRequired * 2;
      OracleService.getInstance().updateAssetMintStatus(
        asset.symbol,
        asset.tokenAddress || '0x' + pool.poolAddress.slice(2, 42),
        pool.poolAddress,
        initialTvl
      );

      setCreatedPool(pool);
      confetti({
        particleCount: 70,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#38BDF8', '#00C805', '#FFFFFF']
      });
    } catch (err) {
      console.error('Failed to seed pool:', err);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0D1217] border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm shadow">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Seed Liquidity Pool</h3>
              <p className="text-xs text-zinc-400">Pair {asset.symbol} with USDC on Robinhood AMM</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {createdPool ? (
            /* Success View */
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-blue-500/20 border border-blue-500/40 text-blue-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Liquidity Pool Deployed!</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Pool pair <span className="text-white font-mono font-bold">{asset.symbol} / USDC</span> is now live on Robinhood Chain DEX.
                </p>
              </div>

              {/* Pool Details Card */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 text-left text-xs font-mono space-y-2">
                <div className="flex justify-between text-zinc-400">
                  <span>Pool Address:</span>
                  <span className="text-zinc-200 truncate max-w-[200px]">{createdPool.poolAddress}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Initial Res:</span>
                  <span className="text-white">{amountNumber} {asset.symbol} + ${usdcRequired} USDC</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>AMM Starting Price:</span>
                  <span className="text-rh-green font-bold">${asset.currentNav.toFixed(2)} (Oracle Aligned)</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Estimated APR:</span>
                  <span className="text-amber-400 font-bold">{createdPool.apr}%</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-rh-green hover:bg-rh-greenHover text-black font-bold rounded-xl transition shadow-lg"
              >
                Done
              </button>
            </div>
          ) : (
            /* Seeding Inputs */
            <>
              {/* Informational Alert on NAV Alignment */}
              <div className="bg-blue-950/40 border border-blue-800/60 rounded-xl p-3 text-xs text-blue-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Oracle Price Alignment:</strong> Pool ratio is automatically locked to the live Bounce Oracle NAV (${asset.currentNav.toFixed(2)}) to prevent instant arbitrage extraction upon creation.
                </span>
              </div>

              {/* Input: dAsset Amount */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-zinc-400">
                  <label className="font-medium">Supply {asset.symbol}</label>
                  <span>Oracle NAV: <strong className="font-mono text-zinc-200">${asset.currentNav.toFixed(2)}</strong></span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={assetAmount}
                    onChange={(e) => setAssetAmount(e.target.value)}
                    disabled={isDeploying}
                    placeholder="25"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-base font-mono text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-zinc-400">
                    {asset.symbol}
                  </span>
                </div>
              </div>

              {/* Matching USDC Calculation */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-zinc-400">
                  <label className="font-medium">Paired Collateral (USDC)</label>
                  <span className="text-zinc-400 font-mono">1 {asset.symbol} = ${asset.currentNav.toFixed(2)} USDC</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={`$${usdcRequired.toLocaleString()}`}
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-base font-mono text-zinc-300 focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-zinc-400">
                    USDC
                  </span>
                </div>
              </div>

              {/* Pool Metrics Card */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Initial Pool Share:</span>
                  <span className="font-mono text-white">100.00% (First LP)</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Swap Fee Tier:</span>
                  <span className="font-mono text-white">0.30% (Standard AMM)</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Estimated LP APR:</span>
                  <span className="font-mono text-amber-400 font-bold">~{estimatedApr}%</span>
                </div>
              </div>

              {/* Deploy Button */}
              <button
                onClick={handleDeployPool}
                disabled={isDeploying || amountNumber <= 0}
                className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all transform active:scale-98"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deploying AMM Pool Contract...</span>
                  </>
                ) : !wallet.isConnected ? (
                  <span>Connect Wallet to Seed Pool</span>
                ) : (
                  <>
                    <Droplets className="w-4 h-4 fill-current" />
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
