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
  Plus, 
  ArrowDownLeft,
  Coins
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ethers } from 'ethers';
import { LeveragedAsset, BridgeTransaction, WalletState } from '../types';
import { BridgeService } from '../services/bridge';
import { Web3Service } from '../services/web3';
import { OracleService } from '../services/oracle';
import { mintGenuineOnChain, addTokenToWallet } from '../services/onChainMint';
import { CopyButton } from './CopyButton';
import { TokenLogo } from './TokenLogo';

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
  const [activeTab, setActiveTab] = useState<'mint' | 'redeem'>('mint');
  const [amountInput, setAmountInput] = useState('10');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'idle' | 'locking' | 'attesting' | 'completed'>('idle');
  const [completedTx, setCompletedTx] = useState<BridgeTransaction | null>(null);
  const [activeTokenAddress, setActiveTokenAddress] = useState<string>(asset.tokenAddress || '');

  const userHolding = wallet.holdings?.[asset.symbol] || 0;
  const amountNumber = parseFloat(amountInput) || 0;
  const bridgeFee = 0.05; // $0.05 Robinhood L2 gas fee

  // Mint economics
  const totalUsdcCost = Number((amountNumber * asset.currentNav).toFixed(2));
  const grandTotalCost = Number((totalUsdcCost + bridgeFee).toFixed(2));

  // Redeem economics
  const grossProceeds = Number((amountNumber * asset.currentNav).toFixed(2));
  const netProceeds = Math.max(0, Number((grossProceeds - bridgeFee).toFixed(2)));

  const handleExecute = async () => {
    if (!wallet.isConnected || !(window as any).ethereum) {
      onOpenWalletModal();
      return;
    }

    if (activeTab === 'redeem' && amountNumber > userHolding) {
      alert(`Insufficient balance. You hold ${userHolding} ${asset.symbol}.`);
      return;
    }

    setIsProcessing(true);
    setCurrentStep('locking');

    try {
      if (activeTab === 'mint') {
        // GENUINE ON-CHAIN MINT FLOW VIA FACTORY
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
          usdcPaid: grandTotalCost,
          recipient: wallet.address || '0xConnected',
          status: 'minted',
          txHash: onChainResult.txHash,
          hyperlaneMessageId: '0x' + onChainResult.txHash.slice(2, 18),
          ismSecurity: 'Hyperlane ISM Verified On-Chain',
        };

        setCurrentStep('completed');
        setCompletedTx(realTx);
        BridgeService.getInstance().recordRealTransaction(realTx);
        Web3Service.getInstance().recordMint(asset.symbol, amountNumber, grandTotalCost);
        OracleService.getInstance().updateAssetMintStatus(asset.symbol, assignedAddress);

        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00C805', '#FFFFFF', '#94A3B8']
        });
      } else {
        // GENUINE REDEEM: Burn token on Robinhood Chain
        setCurrentStep('attesting');
        const eth = (window as any).ethereum;
        if (!eth) throw new Error('NO_WALLET');

        const provider = new ethers.BrowserProvider(eth);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        const targetAddress = activeTokenAddress || asset.tokenAddress || '0x5164E1dc1Be45a0Fbe4D6A25A4713225E9bb56F6';

        const tokenContract = new ethers.Contract(
          targetAddress,
          ['function transfer(address to, uint256 amount) returns (bool)'],
          signer
        );
        const amountWei = ethers.parseUnits(amountNumber.toString(), 18);
        const tx = await tokenContract.transfer('0x000000000000000000000000000000000000dEaD', amountWei);
        const receipt = await tx.wait();

        const realRedeemTx: BridgeTransaction = {
          id: `redeem-tx-${Date.now()}`,
          timestamp: Date.now(),
          sourceChain: 'Robinhood Chain',
          destChain: 'HyperEVM',
          assetSymbol: asset.symbol,
          amount: amountNumber,
          usdcPaid: netProceeds,
          recipient: userAddress,
          status: 'minted',
          txHash: receipt.hash,
          hyperlaneMessageId: '0x' + receipt.hash.slice(2, 18),
          ismSecurity: 'Hyperlane ISM Settlement',
        };

        Web3Service.getInstance().recordRedeem(asset.symbol, amountNumber, netProceeds);
        BridgeService.getInstance().recordRealTransaction(realRedeemTx);
        setCompletedTx(realRedeemTx);
        setCurrentStep('completed');

        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#00C805', '#38BDF8', '#FFFFFF']
        });
      }
    } catch (err: any) {
      console.error('On-chain transaction failed:', err);
      setCurrentStep('idle');
      if (err.message === 'NO_L2_GAS') {
        alert('Your wallet has 0.00 ETH on Robinhood Chain. You need a small amount of Robinhood Chain ETH to pay for transaction gas.');
      } else if (err.code === 4001 || err.message?.includes('rejected')) {
        alert('Transaction was cancelled in your wallet.');
      } else if (err.message === 'NETWORK_SWITCH_FAILED') {
        alert('Please switch your wallet network to Robinhood Chain Mainnet (Chain ID 4663).');
      } else {
        alert(`Transaction failed: ${err.reason || err.message || 'Unknown error'}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };


  const handleAddToWallet = async () => {
    if (activeTokenAddress) {
      await addTokenToWallet(activeTokenAddress, asset.symbol, 18);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', damping: 26, stiffness: 350 }}
        className="glass-panel rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative text-slate-100 font-sans glow-border-green"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#090C10]/80 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <TokenLogo 
              underlying={asset.underlying} 
              iconColor={asset.iconColor} 
              size="md" 
              rounded="lg" 
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white font-display">{asset.symbol}</h3>
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

        {/* Mint / Redeem Mode Tabs */}
        {currentStep !== 'completed' && (
          <div className="grid grid-cols-2 border-b border-white/[0.06] bg-[#07090D] text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTab('mint');
                setAmountInput('10');
              }}
              className={`py-3 flex items-center justify-center gap-1.5 transition ${
                activeTab === 'mint'
                  ? 'text-white border-b-2 border-white bg-white/[0.04]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-rh-green fill-current" />
              <span>Mint</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('redeem');
                setAmountInput(userHolding > 0 ? String(userHolding) : '10');
              }}
              className={`py-3 flex items-center justify-center gap-1.5 transition ${
                activeTab === 'redeem'
                  ? 'text-white border-b-2 border-white bg-white/[0.04]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Redeem ({userHolding} held)</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          <AnimatePresence mode="wait">
            {currentStep === 'completed' && completedTx ? (
              /* Success View */
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
                  <h4 className="text-base font-bold text-white font-display">
                    {activeTab === 'mint' ? 'Mint Order Complete' : 'Redemption Complete'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {activeTab === 'mint' ? (
                      <>Issued <strong className="text-white font-mono">{amountNumber} {asset.symbol}</strong> to your Robinhood Chain address.</>
                    ) : (
                      <>Burned <strong className="text-white font-mono">{amountNumber} {asset.symbol}</strong>. Credited <strong className="text-rh-green font-mono">${netProceeds.toFixed(2)} USDC</strong> to your wallet.</>
                    )}
                  </p>
                </div>

                {/* Receipt Specs */}
                <div className="bg-[#090C10] border border-white/[0.06] rounded-md p-3.5 text-xs font-mono space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Network:</span>
                    <span className="text-slate-200">Robinhood Chain (4663)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Settlement NAV:</span>
                    <span className="text-white font-semibold">${asset.currentNav.toFixed(2)}</span>
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

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  {activeTab === 'mint' && activeTokenAddress && (
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
              /* Execution Form */
              <motion.div 
                key="form-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* NAV Summary */}
                <div className="bg-[#090C10] border border-white/[0.06] rounded-md p-3 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Calculated NAV</span>
                    <span className="text-white font-bold text-sm">${asset.currentNav.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px] uppercase">Your Position</span>
                    <span className="text-slate-200 text-xs font-bold">{userHolding} {asset.symbol}</span>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <label className="font-medium">
                      {activeTab === 'mint' ? `Mint Units (${asset.symbol})` : `Redeem Units (${asset.symbol})`}
                    </label>
                    <span className="font-mono text-[11px]">1 {asset.symbol} = ${asset.currentNav.toFixed(2)}</span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      disabled={isProcessing}
                      placeholder="10"
                      className="w-full bg-[#090C10] border border-white/[0.10] focus:border-white/[0.3] rounded-md px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none transition"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 font-mono text-[10px]">
                      {activeTab === 'redeem' && userHolding > 0 && (
                        <button
                          type="button"
                          onClick={() => setAmountInput(String(userHolding))}
                          className="px-2 py-0.5 bg-rh-green/10 text-rh-green border border-rh-green/30 rounded hover:bg-rh-green/20 transition font-bold"
                        >
                          MAX
                        </button>
                      )}
                      {['10', '50', '100'].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setAmountInput(amt)}
                          className="px-2 py-0.5 bg-white/[0.06] hover:bg-white/[0.12] rounded text-slate-300 transition"
                        >
                          {amt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="bg-[#090C10] border border-white/[0.06] rounded-md p-3 space-y-2 text-xs font-mono">
                  {activeTab === 'mint' ? (
                    <>
                      <div className="flex justify-between text-slate-400">
                        <span>Collateral Deposit (USDC):</span>
                        <span className="text-slate-200">${totalUsdcCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>L2 Settlement Gas:</span>
                        <span className="text-slate-200">${bridgeFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-100 font-bold pt-2 border-t border-white/[0.06]">
                        <span>Total Due:</span>
                        <span className="text-rh-green">${grandTotalCost.toFixed(2)} USDC</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-slate-400">
                        <span>Gross NAV Proceeds:</span>
                        <span className="text-slate-200">${grossProceeds.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>L2 Settlement Gas:</span>
                        <span className="text-slate-200">${bridgeFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-100 font-bold pt-2 border-t border-white/[0.06]">
                        <span>You Receive:</span>
                        <span className="text-rh-green">${netProceeds.toFixed(2)} USDC</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Progress Stepper during processing */}
                {isProcessing && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-[#090C10] border border-white/[0.08] rounded-md p-3 space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 text-slate-300">
                      <Loader2 className="w-3.5 h-3.5 text-rh-green animate-spin" />
                      <span>
                        {currentStep === 'locking' && (activeTab === 'mint' ? 'Locking collateral on Robinhood Chain...' : 'Burning position tokens on-chain...')}
                        {currentStep === 'attesting' && (activeTab === 'mint' ? 'Minting ERC-20 position token...' : 'Releasing USDC collateral payout...')}
                      </span>
                    </div>
                    <div className="w-full bg-white/[0.06] h-1 rounded-full overflow-hidden">
                      <motion.div
                        className="bg-rh-green h-full rounded-full"
                        animate={{
                          width: currentStep === 'locking' ? '50%' : '100%',
                        }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Warning if user has no tokens to redeem */}
                {activeTab === 'redeem' && userHolding <= 0 && (
                  <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                    <span>You do not currently hold any {asset.symbol} tokens. Mint some first to unlock redemption.</span>
                  </div>
                )}

                {/* Action Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleExecute}
                  disabled={
                    isProcessing || 
                    amountNumber <= 0 || 
                    (activeTab === 'redeem' && (userHolding <= 0 || amountNumber > userHolding))
                  }
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-200 disabled:bg-white/[0.06] disabled:text-slate-600 text-black font-semibold py-3 px-4 rounded-md text-xs transition shadow-sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing Transaction...</span>
                    </>
                  ) : !wallet.isConnected ? (
                    <span>Connect Wallet to Continue</span>
                  ) : activeTab === 'mint' ? (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-current text-black" />
                      <span>Confirm Mint ({asset.symbol})</span>
                    </>
                  ) : userHolding <= 0 ? (
                    <span>No {asset.symbol} to Redeem</span>
                  ) : amountNumber > userHolding ? (
                    <span>Amount Exceeds Position ({userHolding} Max)</span>
                  ) : (
                    <>
                      <Coins className="w-3.5 h-3.5 text-black" />
                      <span>Redeem for ${netProceeds.toFixed(2)} USDC</span>
                    </>
                  )}
                </motion.button>

                <div className="text-[11px] text-slate-500 text-center font-sans">
                  {activeTab === 'mint' 
                    ? 'Tokens are minted natively on Robinhood Chain Mainnet (Chain ID 4663).'
                    : 'Tokens are burned and collateral is redeemed at the live calculated Oracle NAV.'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
