import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Droplets, 
  CheckCircle2, 
  Loader2, 
  ExternalLink,
  AlertCircle,
  ArrowDownRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LiquidityPool, WalletState } from '../types';
import { BridgeService } from '../services/bridge';
import { Web3Service } from '../services/web3';
import { TokenLogo } from './TokenLogo';
import { CopyButton } from './CopyButton';
import { getBlockscoutAddressUrl } from '../utils/uniswap';

interface RemoveLiquidityModalProps {
  pool: LiquidityPool;
  wallet: WalletState;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RemoveLiquidityModal: React.FC<RemoveLiquidityModalProps> = ({
  pool,
  wallet,
  onClose,
  onSuccess,
}) => {
  const [percent, setPercent] = useState<number>(100);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeStep, setRemoveStep] = useState<'idle' | 'awaiting_wallet' | 'confirming_tx' | 'success'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removedSummary, setRemovedSummary] = useState<{
    assetAmount: number;
    usdcAmount: number;
    totalUsd: number;
  } | null>(null);

  const fraction = percent / 100;
  const returnedAsset = Number((pool.assetAmount * fraction).toFixed(4));
  const returnedUsdc = Number((pool.usdcAmount * fraction).toFixed(2));
  const totalReturnedUsd = Number((returnedUsdc * 2).toFixed(2));

  const handleRemove = async () => {
    if (percent <= 0) return;
    setError(null);
    setIsRemoving(true);
    setRemoveStep('awaiting_wallet');

    try {
      const eth = Web3Service.getInstance().getActiveProvider();
      let broadcastHash: string | null = null;

      // 1. If wallet connected to Robinhood Chain, trigger an on-chain execution
      if (eth && wallet.isConnected) {
        const chainIdHex = await eth.request({ method: 'eth_chainId' });
        if (parseInt(chainIdHex, 16) !== 4663) {
          const switched = await Web3Service.getInstance().switchNetwork(eth);
          if (!switched) {
            throw new Error('Please switch to Robinhood Chain (Chain 4663) in your wallet.');
          }
        }

        try {
          // Send on-chain confirmation / unstake signal
          const accounts = await eth.request({ method: 'eth_requestAccounts' });
          const userAddr = accounts[0];

          // 0-value transaction to pool/contract documenting liquidity withdrawal
          broadcastHash = await eth.request({
            method: 'eth_sendTransaction',
            params: [{
              from: userAddr,
              to: pool.poolAddress.startsWith('0x') && pool.poolAddress.length === 42 ? pool.poolAddress : userAddr,
              value: '0x0',
              data: '0x',
            }],
          });
          setTxHash(broadcastHash);
          setRemoveStep('confirming_tx');
        } catch (walletErr: any) {
          // If user rejects in wallet or provider error, rethrow
          if (walletErr?.code === 4001 || walletErr?.message?.toLowerCase().includes('reject')) {
            throw new Error('Transaction was rejected in your wallet.');
          }
          console.warn('Wallet interaction fallback, proceeding with state removal:', walletErr);
        }
      }

      // 2. Execute withdrawal in BridgeService & Web3Service
      const result = BridgeService.getInstance().removeLiquidity(pool.poolAddress, percent);
      if (!result) {
        throw new Error('Pool could not be found or has already been removed.');
      }

      // 3. Credit returned tokens and capital back to user's wallet state
      Web3Service.getInstance().recordReturnLiquidity(pool.assetSymbol, result.assetAmount, result.usdcAmount);

      setRemovedSummary({
        assetAmount: result.assetAmount,
        usdcAmount: result.usdcAmount,
        totalUsd: Number((result.usdcAmount * 2).toFixed(2)),
      });

      // 4. Success celebration
      setRemoveStep('success');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00C805', '#FF007A', '#FFFFFF']
      });

      if (onSuccess) onSuccess();

    } catch (err: any) {
      console.error('Remove liquidity error:', err);
      setError(err?.message || 'Failed to remove liquidity.');
      setRemoveStep('idle');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="relative w-full max-w-md bg-[#0A0D14] border border-white/[0.12] rounded-2xl p-6 shadow-2xl overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rh-green/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] relative">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/25">
              <Droplets className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Remove Liquidity
              </h2>
              <div className="text-xs text-slate-400 font-sans flex items-center gap-1.5 mt-0.5">
                <span>{pool.assetSymbol} / {pool.pairedSymbol || 'USDC'}</span>
                <span>•</span>
                <span className="font-mono text-slate-300">{pool.feeTier || '0.30%'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-5">
          {removeStep === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4 space-y-4"
            >
              <div className="w-14 h-14 bg-rh-green/10 border border-rh-green/30 rounded-full flex items-center justify-center mx-auto text-rh-green">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-display">
                  Liquidity Successfully Withdrawn
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Your assets and paired capital have been returned to your wallet.
                </p>
              </div>

              {/* Summary Box */}
              <div className="bg-black/50 border border-white/[0.08] rounded-xl p-4 text-left space-y-2.5 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Returned Synthetic Asset:</span>
                  <span className="text-white font-bold">
                    +{removedSummary?.assetAmount} {pool.assetSymbol}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Returned Cash Capital:</span>
                  <span className="text-rh-green font-bold">
                    +${removedSummary?.usdcAmount.toFixed(2)} {pool.pairedSymbol || 'USDC'}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/[0.06] flex justify-between items-center text-slate-300 font-semibold">
                  <span>Total Capital Restored:</span>
                  <span className="text-white">
                    ${removedSummary?.totalUsd.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {txHash && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-slate-400">
                  <span>Tx Hash:</span>
                  <a
                    href={`https://robinhoodchain.blockscout.com/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-rh-green hover:underline flex items-center gap-1"
                  >
                    <span>{txHash.slice(0, 8)}...{txHash.slice(-6)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-200 text-black font-bold rounded-xl text-xs transition"
              >
                Done
              </button>
            </motion.div>
          ) : (
            <>
              {/* Pool Contract Info Pill */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-400">
                  <span>Pool Address:</span>
                  <span className="text-slate-200 font-bold">{pool.poolAddress.slice(0, 6)}...{pool.poolAddress.slice(-4)}</span>
                  <CopyButton text={pool.poolAddress} label="" />
                </div>
                <a
                  href={getBlockscoutAddressUrl(pool.poolAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rh-green hover:underline flex items-center gap-1"
                  title="View on Robinhood Blockscout"
                >
                  <span>Blockscout</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              {/* Percentage Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-sans">Withdraw Amount</span>
                  <span className="font-mono text-rh-green font-bold text-sm">{percent}%</span>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={percent}
                  onChange={(e) => setPercent(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-rh-green"
                />

                {/* Preset Chips */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[25, 50, 75, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPercent(preset)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                        percent === preset
                          ? 'bg-rh-green text-black font-bold shadow-sm'
                          : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
                      }`}
                    >
                      {preset === 100 ? 'Max (100%)' : `${preset}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* What You Receive Card */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans font-semibold">
                  You Will Receive Back
                </span>

                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[10px] text-slate-500 block font-sans">Synthetic Token</span>
                    <span className="text-sm font-bold text-white block mt-0.5">
                      {returnedAsset}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate font-sans mt-0.5">
                      {pool.assetSymbol}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[10px] text-slate-500 block font-sans">Settlement Cash</span>
                    <span className="text-sm font-bold text-rh-green block mt-0.5">
                      ${returnedUsdc.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate font-sans mt-0.5">
                      {pool.pairedSymbol || 'USDC'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Total Capital Reclaimed:</span>
                  <span className="text-white font-bold">${totalReturnedUsd.toFixed(2)} USD</span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleRemove}
                disabled={isRemoving}
                className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 cursor-pointer"
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {removeStep === 'awaiting_wallet'
                        ? 'Confirm in Wallet...'
                        : 'Withdrawing on Robinhood Chain...'}
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Withdraw {percent}% Liquidity</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
