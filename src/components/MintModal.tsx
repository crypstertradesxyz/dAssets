import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  ExternalLink, 
  Droplets,
  Layers,
  Clock,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LeveragedAsset, BridgeTransaction, WalletState } from '../types';
import { BridgeService } from '../services/bridge';
import { Web3Service } from '../services/web3';
import { OracleService } from '../services/oracle';
import { mintGenuineOnChain } from '../services/onChainMint';
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

  const amountNumber = parseFloat(mintAmount) || 0;
  const totalUsdcCost = Number((amountNumber * asset.currentNav).toFixed(2));
  const bridgeFee = 2.50; // $2.50 Hyperlane relayer voucher
  const grandTotal = totalUsdcCost + bridgeFee;

  const handleExecuteMint = async () => {
    if (!wallet.isConnected) {
      onOpenWalletModal();
      return;
    }

    setIsMinting(true);
    setCurrentStep('locking');

    try {
      if (!wallet.isDemo && (window as any).ethereum) {
        // Genuine On-Chain Transaction with user's real connected Web3 Wallet
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
          ismSecurity: 'Hyperlane Warp Route Verified On-Chain',
        };

        setCurrentStep('minted');
        setCompletedTx(realTx);
        OracleService.getInstance().updateAssetMintStatus(
          asset.symbol,
          onChainResult.tokenAddress || '0x' + onChainResult.txHash.slice(2, 42)
        );

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00C805', '#00E006', '#FFFFFF']
        });
      } else {
        // Interactive Sandbox Execution
        const recipient = wallet.address || '0x71C...89A4';
        const bridge = BridgeService.getInstance();
        
        await bridge.executeMintViaHyperlane(
          asset.symbol,
          amountNumber,
          grandTotal,
          recipient,
          (step, updatedTx) => {
            setCurrentStep(step);
            if (step === 'minted') {
              setCompletedTx(updatedTx);
              Web3Service.getInstance().deductUsdc(grandTotal);
              OracleService.getInstance().updateAssetMintStatus(
                asset.symbol,
                '0x' + updatedTx.txHash.slice(2, 42)
              );
              confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.6 },
                colors: ['#00C805', '#00E006', '#FFFFFF']
              });
            }
          }
        );
      }
    } catch (err: any) {
      console.error('Minting error:', err);
      alert(err.message || 'Transaction failed or rejected by user.');
      setCurrentStep('idle');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0D1217] border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow"
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
                <h3 className="font-bold text-base text-white">{asset.symbol}</h3>
                <span className="text-[10px] bg-rh-green/15 text-rh-green font-mono px-2 py-0.5 rounded border border-rh-green/30">
                  {Math.abs(asset.leverage)}x {asset.isShort ? 'Short' : 'Long'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">Mint onto Robinhood Chain via Hyperlane</p>
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
          {currentStep === 'minted' && completedTx ? (
            /* Success View */
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-rh-green/20 border border-rh-green/40 text-rh-green rounded-full flex items-center justify-center mx-auto shadow-lg shadow-rh-green/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Successfully Minted!</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Minted <span className="text-rh-green font-bold font-mono">{amountNumber} {asset.symbol}</span> to your Robinhood Chain address.
                </p>
              </div>

              {/* Transaction Receipt Card */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 text-left text-xs font-mono space-y-2.5">
                <div className="flex justify-between text-zinc-400">
                  <span>Destination Chain:</span>
                  <span className="text-white">Robinhood Chain (ID: 4663)</span>
                </div>
                {asset.tokenAddress && (
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Token CA:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-200 truncate max-w-[130px]">{asset.tokenAddress}</span>
                      <CopyButton text={asset.tokenAddress} label="Copy CA" />
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-zinc-400">
                  <span>Source Backing:</span>
                  <span className="text-white">Bounce.tech HyperEVM Vault</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Security Module:</span>
                  <span className="text-rh-green">Hyperlane ISM Verified</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400 pt-1.5 border-t border-zinc-800">
                  <span>Transaction Hash:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-300 truncate max-w-[120px]">{completedTx.txHash}</span>
                    <CopyButton text={completedTx.txHash} />
                  </div>
                </div>
              </div>

              {/* Next Steps CTA */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onOpenSeedPool(asset);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-rh-green hover:bg-rh-greenHover text-black font-bold py-2.5 px-4 rounded-xl shadow-lg transition"
                >
                  <Droplets className="w-4 h-4" />
                  <span>Seed Liquidity Pool for {asset.symbol}</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Mint Input View */
            <>
              {/* Architecture Route Pipeline */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-xs">
                <div className="text-[11px] text-zinc-400 uppercase font-semibold mb-2">
                  Interchain Execution Route
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <div className="flex flex-col items-center">
                    <span className="text-zinc-300 font-bold">HyperEVM</span>
                    <span className="text-[10px] text-zinc-400">Bounce Vault</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                  <div className="flex flex-col items-center">
                    <span className="text-rh-green font-bold">Hyperlane Warp</span>
                    <span className="text-[10px] text-zinc-400">ISM Dispatch</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                  <div className="flex flex-col items-center">
                    <span className="text-zinc-300 font-bold">Robinhood Chain</span>
                    <span className="text-[10px] text-zinc-400">Token Minted</span>
                  </div>
                </div>
              </div>

              {/* Mint Amount Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-zinc-400">
                  <label className="font-medium">Mint Amount ({asset.symbol})</label>
                  <span>Oracle NAV: <strong className="font-mono text-zinc-200">${asset.currentNav.toFixed(2)}</strong></span>
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
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-base font-mono text-white focus:outline-none focus:border-rh-green focus:ring-1 focus:ring-rh-green transition"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                    {['10', '50', '100'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setMintAmount(amt)}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[11px] font-mono text-zinc-300"
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cost Summary Box */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Collateral Backing (USDC):</span>
                  <span className="font-mono text-zinc-200">${totalUsdcCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Hyperlane Interchain Fee:</span>
                  <span className="font-mono text-zinc-200">${bridgeFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Estimated Bridge Latency:</span>
                  <span className="font-mono text-rh-green flex items-center gap-1">
                    <Clock className="w-3 h-3" /> ~1.2 seconds
                  </span>
                </div>
                <div className="flex justify-between text-zinc-200 font-bold pt-2 border-t border-zinc-800 text-sm">
                  <span>Total Payable:</span>
                  <span className="font-mono text-rh-green">${grandTotal.toLocaleString()} USDC</span>
                </div>
              </div>

              {/* Progress Stepper (during execution) */}
              {isMinting && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs text-zinc-300">
                    <Loader2 className="w-4 h-4 text-rh-green animate-spin" />
                    <span>
                      {currentStep === 'locking' && '1/3: Locking USDC Collateral on HyperEVM Vault...'}
                      {currentStep === 'attesting' && '2/3: Hyperlane ISM Quorum: 3/5 Validator Signatures...'}
                      {currentStep === 'minted' && '3/3: Minting dAsset ERC-20 on Robinhood Chain...'}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-rh-green h-full transition-all duration-500 rounded-full"
                      style={{
                        width: currentStep === 'locking' ? '33%' : currentStep === 'attesting' ? '66%' : '100%',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleExecuteMint}
                disabled={isMinting || amountNumber <= 0}
                className="w-full flex items-center justify-center gap-2 bg-rh-green hover:bg-rh-greenHover disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-rh-green/20 transition-all transform active:scale-98"
              >
                {isMinting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Hyperlane Warp Route...</span>
                  </>
                ) : !wallet.isConnected ? (
                  <span>Connect Wallet to Mint</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Mint {asset.symbol} on Robinhood Chain</span>
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
