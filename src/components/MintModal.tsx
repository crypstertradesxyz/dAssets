import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Zap, 
  CheckCircle2, 
  Loader2, 
  ExternalLink, 
  Droplets,
  Clock,
  Plus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LeveragedAsset, BridgeTransaction, WalletState } from '../types';
import { BridgeService } from '../services/bridge';
import { Web3Service } from '../services/web3';
import { OracleService } from '../services/oracle';
import { mintGenuineOnChain, addTokenToWallet } from '../services/onChainMint';
import { CopyButton } from './CopyButton';

interface MintModalProps {
  asset: LeveragedAsset;
  wallet: WalletState;
  onClose: () => void;
  onOpenSeedPool: (asset: LeveragedAsset) => void;
  onOpenWalletModal: () => void;
}

export const MintModal: React.FC<MintModalProps> = ({
  asset,
  wallet,
  onClose,
  onOpenSeedPool,
  onOpenWalletModal,
}) => {
  const [mintAmount, setMintAmount] = useState('10');
  const [isMinting, setIsMinting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'idle' | 'locking' | 'attesting' | 'minted'>('idle');
  const [completedTx, setCompletedTx] = useState<BridgeTransaction | null>(null);
  const [activeTokenAddress, setActiveTokenAddress] = useState<string>(asset.tokenAddress || '');

  const amountNumber = parseFloat(mintAmount) || 0;
  const totalUsdcCost = Number((amountNumber * asset.currentNav).toFixed(2));
  const bridgeFee = 0.05; // $0.05 Robinhood L2 gas fee
  const grandTotal = Number((totalUsdcCost + bridgeFee).toFixed(2));

  const handleExecuteMint = async () => {
    if (!wallet.isConnected) {
      onOpenWalletModal();
      return;
    }

    setIsMinting(true);
    setCurrentStep('locking');

    try {
      if (!wallet.isDemo && (window as any).ethereum) {
        // Genuine On-Chain Transaction on Robinhood Chain Mainnet (Chain 4663)
        setCurrentStep('attesting');
        const onChainResult = await mintGenuineOnChain(
          asset.symbol,
          asset.name,
          asset.underlying,
          asset.leverage,
          asset.isShort,
          asset.hyperevmAddress,
          amountNumber
        );

        const assignedAddress = onChainResult.tokenAddress || asset.tokenAddress || '0x5164E1dc1Be45a0Fbe4D6A25A4713225E9bb56F6';
        setActiveTokenAddress(assignedAddress);

        const realTx: BridgeTransaction = {
          id: `onchain-tx-${Date.now()}`,
          timestamp: Date.now(),
          sourceChain: 'HyperEVM',
          destChain: 'Robinhood Chain',
          assetSymbol: asset.symbol,
          amount: amountNumber,
          usdcPaid: grandTotal,
          recipient: wallet.address || '0xConnected',
          status: 'minted',
          txHash: onChainResult.txHash,
          hyperlaneMessageId: '0x' + onChainResult.txHash.slice(2, 18),
          ismSecurity: 'Hyperlane ISM Verified On-Chain',
        };

        setCurrentStep('minted');
        setCompletedTx(realTx);
        OracleService.getInstance().updateAssetMintStatus(asset.symbol, assignedAddress);

        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00C805', '#FFFFFF', '#94A3B8']
        });
      } else {
        // Instant Sandbox Execution
        const recipient = wallet.address || '0x71C85...89A4';
        const bridge = BridgeService.getInstance();
        
        await bridge.executeMintViaHyperlane(
          asset.symbol,
          amountNumber,
          grandTotal,
          recipient,
          (step, updatedTx) => {
            setCurrentStep(step);
            if (step === 'minted') {
              const assignedAddress = asset.tokenAddress || '0x' + updatedTx.txHash.slice(2, 42);
              setActiveTokenAddress(assignedAddress);
              setCompletedTx(updatedTx);
              Web3Service.getInstance().deductUsdc(grandTotal);
              OracleService.getInstance().updateAssetMintStatus(asset.symbol, assignedAddress);
              confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.6 },
                colors: ['#00C805', '#FFFFFF', '#94A3B8']
              });
            }
          }
        );
      }
    } catch (err: any) {
      console.error('Minting error:', err);
      alert(err.message || 'Transaction could not be completed.');
      setCurrentStep('idle');
    } finally {
      setIsMinting(false);
    }
  };

  const handleAddToWallet = async () => {
    if (activeTokenAddress) {
      await addTokenToWallet(activeTokenAddress, asset.symbol, 18);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', damping: 26, stiffness: 350 }}
        className="bg-[#0D1016] border border-white/[0.12] rounded-lg w-full max-w-md overflow-hidden shadow-2xl relative text-slate-100"
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[#0A0D12]">
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-8 rounded flex items-center justify-center font-bold text-xs"
              style={{
                backgroundColor: `${asset.iconColor}20`,
                color: asset.iconColor,
                border: `1px solid ${asset.iconColor}40`,
              }}
            >
              {asset.underlying.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">{asset.symbol}</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300">
                  {Math.abs(asset.leverage)}x {asset.isShort ? 'Short' : 'Long'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Robinhood Chain (Chain 4663)</p>
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
          <AnimatePresence mode="wait">
            {currentStep === 'minted' && completedTx ? (
              /* Post-Mint Success Receipt */
              <motion.div 
                key="success-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="text-center py-2 space-y-2">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                    className="w-10 h-10 bg-rh-green/10 border border-rh-green/30 text-rh-green rounded-full flex items-center justify-center mx-auto"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </motion.div>
                  <h4 className="text-base font-bold text-white">Mint Order Complete</h4>
                  <p className="text-xs text-slate-400">
                    Issued <strong className="text-white font-mono">{amountNumber} {asset.symbol}</strong> to your Robinhood Chain address.
                  </p>
                </div>

                {/* Receipt Specs */}
                <div className="bg-[#090C10] border border-white/[0.06] rounded-md p-3.5 text-xs font-mono space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Network:</span>
                    <span className="text-slate-200">Robinhood Chain (4663)</span>
                  </div>
                  {activeTokenAddress && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Token CA:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-200">{activeTokenAddress.slice(0, 6)}...{activeTokenAddress.slice(-4)}</span>
                        <CopyButton text={activeTokenAddress} label="Copy" />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-white/[0.06]">
                    <span>Tx Hash:</span>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`https://robinhoodchain.blockscout.com/tx/${completedTx.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-rh-green hover:underline flex items-center gap-1"
                      >
                        <span>{completedTx.txHash.slice(0, 6)}...{completedTx.txHash.slice(-4)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <CopyButton text={completedTx.txHash} />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1 font-sans">
                  {activeTokenAddress && (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleAddToWallet}
                      className="w-full flex items-center justify-center gap-1.5 bg-[#12161F] hover:bg-[#181E2A] text-slate-200 border border-white/[0.12] py-2.5 px-3 rounded-md text-xs font-medium transition"
                    >
                      <Plus className="w-3.5 h-3.5 text-rh-green" />
                      <span>Add {asset.symbol} to MetaMask / Robinhood Wallet</span>
                    </motion.button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onClose();
                        onOpenSeedPool(asset);
                      }}
                      className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-200 text-black font-semibold py-2.5 px-3 rounded-md text-xs transition"
                    >
                      <Droplets className="w-3.5 h-3.5" />
                      <span>Seed AMM Pool</span>
                    </motion.button>

                    <button
                      onClick={onClose}
                      className="py-2.5 px-3 bg-white/[0.06] hover:bg-white/[0.10] text-slate-300 font-medium rounded-md text-xs transition"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Input Execution Form */
              <motion.div 
                key="form-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* Target & Price Summary */}
                <div className="bg-[#090C10] border border-white/[0.06] rounded-md p-3 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Calculated NAV</span>
                    <span className="text-white font-bold text-sm">${asset.currentNav.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px] uppercase">Underlying Index</span>
                    <span className="text-slate-300 text-xs">${asset.indexPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <label className="font-medium font-sans">Mint Units ({asset.symbol})</label>
                    <span className="font-mono text-[11px]">1 {asset.symbol} = ${asset.currentNav.toFixed(2)}</span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(e.target.value)}
                      disabled={isMinting}
                      placeholder="10"
                      className="w-full bg-[#090C10] border border-white/[0.10] focus:border-white/[0.3] rounded-md px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none transition"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                      {['10', '50', '100', '500'].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setMintAmount(amt)}
                          className="px-2 py-0.5 bg-white/[0.06] hover:bg-white/[0.12] rounded text-[10px] font-mono text-slate-300 transition"
                        >
                          {amt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cost & Fee Schedule */}
                <div className="bg-[#090C10] border border-white/[0.06] rounded-md p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Collateral (USDC):</span>
                    <span className="text-slate-200">${totalUsdcCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Hyperlane Gas Fee:</span>
                    <span className="text-slate-200">${bridgeFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Bridge Latency:</span>
                    <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" /> ~1.2s
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-100 font-bold pt-2 border-t border-white/[0.06] text-xs">
                    <span>Total Due:</span>
                    <span className="text-rh-green">${grandTotal.toFixed(2)} USDC</span>
                  </div>
                </div>

                {/* Stepper Loader */}
                {isMinting && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-[#090C10] border border-white/[0.08] rounded-md p-3 space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 text-slate-300">
                      <Loader2 className="w-3.5 h-3.5 text-rh-green animate-spin" />
                      <span>
                        {currentStep === 'locking' && 'Broadcasting transaction to Robinhood Chain...'}
                        {currentStep === 'attesting' && 'Awaiting validator quorum and Warp route dispatch...'}
                        {currentStep === 'minted' && 'Minting ERC-20 position...'}
                      </span>
                    </div>
                    <div className="w-full bg-white/[0.06] h-1 rounded-full overflow-hidden">
                      <motion.div
                        className="bg-rh-green h-full rounded-full"
                        animate={{
                          width: currentStep === 'locking' ? '33%' : currentStep === 'attesting' ? '66%' : '100%',
                        }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Action Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleExecuteMint}
                  disabled={isMinting || amountNumber <= 0}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-200 disabled:bg-white/[0.06] disabled:text-slate-600 text-black font-semibold py-3 px-4 rounded-md text-xs transition shadow-sm"
                >
                  {isMinting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing On-Chain...</span>
                    </>
                  ) : !wallet.isConnected ? (
                    <span>Connect Wallet to Mint</span>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-current text-black" />
                      <span>Confirm Mint ({asset.symbol})</span>
                    </>
                  )}
                </motion.button>

                <div className="text-[11px] text-slate-500 text-center font-sans">
                  Tokens are minted natively on Robinhood Chain Mainnet (Chain ID 4663).
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
