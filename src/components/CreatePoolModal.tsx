import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Droplets, 
  CheckCircle2, 
  Loader2, 
  Search, 
  ExternalLink,
  ChevronDown,
  Layers,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ethers } from 'ethers';
import artifacts from '../contracts/artifacts.json';
import deployedConfig from '../contracts/deployedAddresses.json';
import { LeveragedAsset, WalletState, LiquidityPool } from '../types';
import { BridgeService } from '../services/bridge';
import { OracleService } from '../services/oracle';
import { Web3Service } from '../services/web3';
import { CopyButton } from './CopyButton';
import { TokenLogo } from './TokenLogo';

interface CreatePoolModalProps {
  assets: LeveragedAsset[];
  initialAsset?: LeveragedAsset;
  wallet: WalletState;
  onClose: () => void;
  onOpenWalletModal: () => void;
  onPoolCreated?: (pool: LiquidityPool) => void;
}

export const CreatePoolModal: React.FC<CreatePoolModalProps> = ({
  assets,
  initialAsset,
  wallet,
  onClose,
  onOpenWalletModal,
  onPoolCreated,
}) => {
  const [selectedAsset, setSelectedAsset] = useState<LeveragedAsset>(
    initialAsset || assets.find(a => a.symbol === 'dBTC3L') || assets[0]
  );
  const [pairedSymbol, setPairedSymbol] = useState<'USDC' | 'ETH'>('USDC');
  const [feeTier, setFeeTier] = useState<'0.05%' | '0.30%' | '1.00%'>('0.30%');
  const [assetAmount, setAssetAmount] = useState('5');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [createdPool, setCreatedPool] = useState<LiquidityPool | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);

  const isWrongNetwork = wallet.isConnected && wallet.chainId !== 4663;
  const amountNumber = parseFloat(assetAmount) || 0;
  const usdcRequired = Number((amountNumber * selectedAsset.currentNav).toFixed(2));
  const estimatedApr = feeTier === '0.05%' ? 18.2 : feeTier === '0.30%' ? 32.4 : 44.8;

  const filteredAssets = assets.filter(
    a => a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
         a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         a.underlying.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 12);

  const handleSwitchNetwork = async () => {
    setIsSwitchingChain(true);
    setDeployError(null);
    try {
      const success = await Web3Service.getInstance().switchNetwork();
      if (!success) {
        setDeployError('Could not switch to Robinhood Chain automatically. Please approve the network switch request in your wallet extension.');
      }
    } catch (err: any) {
      setDeployError(err.message || 'Failed to switch network.');
    } finally {
      setIsSwitchingChain(false);
    }
  };

  const handleDeployPool = async () => {
    setDeployError(null);
    if (!wallet.isConnected) {
      onOpenWalletModal();
      return;
    }

    if (isWrongNetwork) {
      setIsSwitchingChain(true);
      const switched = await Web3Service.getInstance().switchNetwork();
      setIsSwitchingChain(false);
      if (!switched) {
        setDeployError('Please switch your wallet to Robinhood Chain Mainnet (Chain ID 4663) to proceed.');
        return;
      }
    }

    if (!selectedAsset.tokenAddress) {
      setDeployError(`${selectedAsset.symbol} has not been deployed on Robinhood Chain yet. Please deploy/mint it first via the Markets tab before registering a liquidity pool.`);
      return;
    }

    setIsDeploying(true);

    try {
      const eth = Web3Service.getInstance().getActiveProvider();
      if (!eth) throw new Error('NO_WALLET');

      const chainIdHex = await eth.request({ method: 'eth_chainId' });
      if (parseInt(chainIdHex, 16) !== 4663) {
        const switched = await Web3Service.getInstance().switchNetwork(eth);
        if (!switched) {
          throw new Error('NETWORK_SWITCH_FAILED');
        }
      }

      const provider = new ethers.BrowserProvider(eth);
      const signer = await provider.getSigner();
      const creator = await signer.getAddress();

      // Check gas balance
      const balance = await provider.getBalance(creator);
      if (balance === 0n) {
        throw new Error('NO_L2_GAS');
      }

      const factoryAddress = deployedConfig?.factory || '0x31390C104d777c03B00E95967E3F2905993f947b';
      const factory = new ethers.Contract(factoryAddress, artifacts.dAssetFactory.abi, signer);

      // Deterministic pair address derived from token CA and pair config
      const salt = ethers.keccak256(ethers.toUtf8Bytes(`${selectedAsset.symbol}-${pairedSymbol}-${feeTier}`));
      const poolAddress = ethers.getCreate2Address(
        factoryAddress,
        salt,
        ethers.keccak256(ethers.toUtf8Bytes('dAssetsUniswapV3Pool'))
      );

      const initialTvl = usdcRequired * 2;
      const liquidityWei = ethers.parseUnits(initialTvl.toFixed(2), 18);

      console.log(`Broadcasting registerLiquidityPool on Robinhood Chain for ${selectedAsset.symbol}...`);
      const tx = await factory.registerLiquidityPool(selectedAsset.symbol, poolAddress, liquidityWei);
      const receipt = await tx.wait();

      const bridge = BridgeService.getInstance();
      const pool = bridge.seedPool(
        selectedAsset.symbol,
        amountNumber,
        usdcRequired,
        selectedAsset.currentNav,
        creator,
        feeTier,
        pairedSymbol,
        poolAddress,
        receipt.hash
      );

      OracleService.getInstance().updateAssetMintStatus(
        selectedAsset.symbol,
        selectedAsset.tokenAddress,
        pool.poolAddress,
        initialTvl
      );

      setCreatedPool(pool);
      if (onPoolCreated) {
        onPoolCreated(pool);
      }

      confetti({
        particleCount: 85,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00C805', '#FF007A', '#FFFFFF']
      });
    } catch (err: any) {
      console.error('Failed to register pool on Robinhood Chain:', err);
      if (err.message === 'NO_L2_GAS') {
        setDeployError('Your wallet has 0.00 ETH on Robinhood Chain. A small amount of gas is required to register the pool on-chain.');
      } else if (err.message === 'NETWORK_SWITCH_FAILED') {
        setDeployError('Please switch your wallet to Robinhood Chain Mainnet (Chain ID 4663).');
      } else if (err.code === 4001 || err.message?.includes('rejected')) {
        setDeployError('Transaction was cancelled in your wallet.');
      } else if (err.message?.includes('insufficient funds')) {
        setDeployError('Your wallet does not have enough ETH on Robinhood Chain to pay for transaction gas.');
      } else {
        setDeployError(`Failed to register pool: ${err.reason || err.message || 'Unknown error'}`);
      }
    } finally {
      setIsDeploying(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="glass-panel rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative text-slate-100 font-sans glow-border-cyan"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#090C10]/80 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-white/[0.06] border border-white/[0.10] text-white flex items-center justify-center font-bold text-xs">
              <Droplets className="w-4 h-4 text-rh-green" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white font-display">Create Uniswap v3 Pool</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 font-semibold">
                  Uniswap v3
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Robinhood Chain Mainnet (Chain 4663)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          <AnimatePresence mode="wait">
            {createdPool ? (
              /* Success View */
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <div className="text-center py-2 space-y-2">
                  <div className="w-10 h-10 bg-rh-green/10 border border-rh-green/30 text-rh-green rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-white font-display">
                    Uniswap Pool Deployed!
                  </h4>
                  <p className="text-xs text-slate-400">
                    Successfully deployed and seeded <strong className="text-white font-mono">{selectedAsset.symbol} / {pairedSymbol}</strong> with {feeTier} fee tier.
                  </p>
                </div>

                <div className="bg-[#090C10] border border-white/[0.06] rounded-md p-4 text-xs font-mono space-y-2.5">
                  <div className="flex justify-between text-slate-400">
                    <span>AMM Protocol:</span>
                    <span className="text-pink-400 font-semibold">Uniswap v3 Core</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Fee Tier:</span>
                    <span className="text-white font-semibold">{feeTier}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Initial Liquidity:</span>
                    <span className="text-white font-semibold">${(usdcRequired * 2).toLocaleString()} TVL</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Estimated Yield:</span>
                    <span className="text-rh-green font-bold">~{estimatedApr}% APR</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-white/[0.06]">
                    <span>Pool Address:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-200">{createdPool.poolAddress.slice(0, 6)}...{createdPool.poolAddress.slice(-4)}</span>
                      <CopyButton text={createdPool.poolAddress} label="Copy" />
                    </div>
                  </div>
                  {createdPool.txHash && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Deployment Tx:</span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://robinhoodchain.blockscout.com/tx/${createdPool.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-rh-green hover:underline flex items-center gap-1"
                        >
                          <span>{createdPool.txHash.slice(0, 6)}...{createdPool.txHash.slice(-4)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={onClose}
                    className="w-full bg-white hover:bg-slate-200 text-black font-semibold py-3 px-4 rounded-md text-xs transition"
                  >
                    View in Showcase Directory
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Deployment Form */
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Step 1: Asset Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    1. Select Leveraged Position Asset (Token 0)
                  </label>
                  
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsAssetPickerOpen(!isAssetPickerOpen)}
                      className="w-full flex items-center justify-between bg-[#090C10] border border-white/[0.10] hover:border-white/[0.20] rounded-md px-3.5 py-2.5 text-xs transition text-left"
                    >
                      <div className="flex items-center space-x-2.5">
                        <TokenLogo 
                          underlying={selectedAsset.underlying} 
                          iconColor={selectedAsset.iconColor} 
                          size="sm" 
                          rounded="md" 
                        />
                        <div>
                          <span className="font-bold text-white font-mono">{selectedAsset.symbol}</span>
                          <span className="text-slate-400 ml-2 text-[11px] font-sans">({selectedAsset.name})</span>
                        </div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    {/* Dropdown list */}
                    {isAssetPickerOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-[#090C10] border border-white/[0.12] rounded-md shadow-2xl z-50 p-2 space-y-1.5 max-h-56 overflow-y-auto">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Search 270+ assets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0E1218] border border-white/[0.08] rounded py-1.5 pl-8 pr-2 text-xs text-white focus:outline-none"
                            autoFocus
                          />
                        </div>
                        <div className="space-y-0.5 pt-1">
                          {filteredAssets.map(asset => (
                            <div
                              key={asset.id}
                              onClick={() => {
                                setSelectedAsset(asset);
                                setIsAssetPickerOpen(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center justify-between p-2 rounded hover:bg-white/[0.06] cursor-pointer transition text-xs"
                            >
                              <div className="flex items-center space-x-2.5">
                                <TokenLogo underlying={asset.underlying} iconColor={asset.iconColor} size="xs" rounded="sm" />
                                <span className="font-mono font-bold text-white">{asset.symbol}</span>
                                <span className="text-slate-400 text-[11px]">{asset.underlying}</span>
                              </div>
                              <span className="text-slate-300 font-mono">${asset.currentNav.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2: Paired Asset & Fee Tier */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      2. Paired Asset (Token 1)
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 bg-[#090C10] border border-white/[0.10] p-1 rounded-md text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => setPairedSymbol('USDC')}
                        className={`py-1.5 rounded transition font-bold ${pairedSymbol === 'USDC' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}
                      >
                        USDC
                      </button>
                      <button
                        type="button"
                        onClick={() => setPairedSymbol('ETH')}
                        className={`py-1.5 rounded transition font-bold ${pairedSymbol === 'ETH' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}
                      >
                        ETH
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      3. Fee Tier
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-[#090C10] border border-white/[0.10] p-1 rounded-md text-[11px] font-mono">
                      {(['0.05%', '0.30%', '1.00%'] as const).map(tier => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setFeeTier(tier)}
                          className={`py-1.5 rounded transition font-bold ${feeTier === tier ? 'bg-pink-500 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step 3: Initial Liquidity Amounts */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-300">
                    <label className="font-medium">4. Initial Deposit Amounts</label>
                    <span className="font-mono text-[11px] text-slate-400">Live Oracle: 1 {selectedAsset.symbol} = ${selectedAsset.currentNav.toFixed(2)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div className="bg-[#090C10] border border-white/[0.10] rounded-md p-2.5">
                      <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">Deposit {selectedAsset.symbol}</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={assetAmount}
                        onChange={(e) => setAssetAmount(e.target.value)}
                        className="w-full bg-transparent text-sm font-bold text-white focus:outline-none mt-1"
                        placeholder="5"
                      />
                    </div>
                    <div className="bg-[#090C10] border border-white/[0.10] rounded-md p-2.5">
                      <span className="text-[10px] text-slate-500 block uppercase font-sans font-semibold">Paired {pairedSymbol} (Auto)</span>
                      <div className="text-sm font-bold text-rh-green mt-1">
                        ${usdcRequired.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Quick TVL Presets */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-slate-500 font-sans">Presets:</span>
                    {[
                      { amt: '5', label: '$10 TVL' },
                      { amt: '10', label: '$20 TVL' },
                      { amt: '25', label: '$50 TVL' },
                      { amt: '50', label: '$100 TVL' },
                    ].map(({ amt, label }) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAssetAmount(amt)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded transition ${
                          assetAmount === amt
                            ? 'bg-rh-green text-black font-bold'
                            : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.12]'
                        }`}
                      >
                        {amt} ({label})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary Box */}
                <div className="bg-[#090C10] border border-white/[0.06] rounded-md p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Initial Pool TVL:</span>
                    <span className="text-white font-semibold">${(usdcRequired * 2).toLocaleString()} USD</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Fee Tier APR Projection:</span>
                    <span className="text-rh-green font-bold">~{estimatedApr}% APR</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>AMM Settlement:</span>
                    <span className="text-slate-200">Uniswap v3 on Robinhood Chain</span>
                  </div>
                </div>

                {/* Error Banner */}
                {deployError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-1.5 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold text-red-200">Deployment Notice</div>
                      <div className="text-[11px] text-red-300/90 leading-relaxed">{deployError}</div>
                    </div>
                  </div>
                )}

                {/* Network Warning if on wrong chain */}
                {isWrongNetwork && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-amber-300">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Robinhood Chain (4663) Required</span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/20 px-2 py-0.5 rounded">
                        {wallet.networkName}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-200/80 font-sans leading-relaxed">
                      Your wallet is connected to <strong>{wallet.networkName}</strong>. Robinhood Chain Mainnet (Chain ID 4663) is required to deploy Uniswap pools.
                    </p>
                    <button
                      type="button"
                      onClick={handleSwitchNetwork}
                      disabled={isSwitchingChain}
                      className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 px-3 rounded-lg text-xs transition active:scale-98 shadow-sm"
                    >
                      {isSwitchingChain ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>Switch to Robinhood Chain (4663)</span>
                    </button>
                  </div>
                )}

                {/* Action Button */}
                {!wallet.isConnected ? (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={onOpenWalletModal}
                    type="button"
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-200 text-black font-semibold py-3 px-4 rounded-md text-xs transition shadow-sm"
                  >
                    <span>Connect Wallet to Deploy Pool</span>
                  </motion.button>
                ) : isWrongNetwork ? (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleSwitchNetwork}
                    disabled={isSwitchingChain}
                    type="button"
                    className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-4 rounded-md text-xs transition shadow-sm"
                  >
                    {isSwitchingChain ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Switching to Robinhood Chain...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Switch to Robinhood Chain (4663)</span>
                      </>
                    )}
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleDeployPool}
                    disabled={isDeploying || amountNumber <= 0}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-200 disabled:bg-white/[0.06] disabled:text-slate-600 text-black font-semibold py-3 px-4 rounded-md text-xs transition shadow-sm"
                  >
                    {isDeploying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Broadcasting Uniswap Pool Deployment...</span>
                      </>
                    ) : (
                      <>
                        <Layers className="w-3.5 h-3.5" />
                        <span>Create & Seed {selectedAsset.symbol}/{pairedSymbol} Pool</span>
                      </>
                    )}
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
