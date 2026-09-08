import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  LogOut, 
  ChevronRight, 
  Check, 
  Loader2, 
  AlertCircle, 
  ExternalLink,
  RefreshCw,
  ArrowRight,
  PieChart
} from 'lucide-react';
import { WalletState, AppView, LeveragedAsset, LiquidityPool } from '../types';
import { Web3Service, ROBINHOOD_CHAIN } from '../services/web3';
import { BridgeService } from '../services/bridge';
import { CopyButton } from './CopyButton';

interface WalletModalProps {
  wallet: WalletState;
  onClose: () => void;
  onNavigate?: (view: AppView) => void;
  assets?: LeveragedAsset[];
}

export const WalletModal: React.FC<WalletModalProps> = ({ wallet, onClose, onNavigate, assets }) => {
  const web3 = Web3Service.getInstance();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingType, setConnectingType] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);

  const userLpPools = React.useMemo(() => {
    if (!wallet.isConnected || !wallet.address) return [];
    const allPools: LiquidityPool[] = BridgeService.getInstance().getPools();
    const userAddr = wallet.address.toLowerCase();
    return allPools.filter((p: LiquidityPool) => Boolean(p.creator && p.creator.toLowerCase() === userAddr));
  }, [wallet.address, wallet.isConnected]);

  const activeHoldings = React.useMemo(() => {
    return Object.entries(wallet.holdings || {})
      .filter(([_, qty]) => qty > 0)
      .map(([symbol, qty]) => {
        const asset = assets?.find(a => a.symbol === symbol);
        const nav = asset?.currentNav || 1.0;
        const usd = qty * nav;
        return { symbol, qty, nav, usd };
      });
  }, [wallet.holdings, assets]);

  const totalPositionsUsd = React.useMemo(() => {
    const tokensUsd = activeHoldings.reduce((sum: number, h) => sum + h.usd, 0);
    const poolsUsd = userLpPools.reduce((sum: number, p: LiquidityPool) => sum + (p.tvlUsd || p.usdcAmount * 2), 0);
    return tokensUsd + poolsUsd;
  }, [activeHoldings, userLpPools]);

  const handleConnectInjected = async (type: 'robinhood' | 'metamask' | 'rabby' | 'injected') => {
    setIsConnecting(true);
    setConnectingType(type);
    setErrorMsg(null);

    try {
      const res = await web3.connectInjected(type);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Connection failed.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Unexpected connection error.');
    } finally {
      setIsConnecting(false);
      setConnectingType(null);
    }
  };

  const handleSwitchToRobinhood = async () => {
    setIsSwitchingChain(true);
    setErrorMsg(null);
    try {
      const switched = await web3.switchNetwork();
      if (!switched) {
        setErrorMsg('Could not switch to Robinhood Chain automatically. Please approve the network switch request in your wallet extension.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to switch network.');
    } finally {
      setIsSwitchingChain(false);
    }
  };

  const handleDisconnect = () => {
    web3.disconnect();
    onClose();
  };

  const isWrongNetwork = wallet.isConnected && wallet.chainId !== ROBINHOOD_CHAIN.chainId;
  const hasInjected = typeof window !== 'undefined' && Boolean(
    (window as any).ethereum || 
    (window as any).robinhood || 
    (window as any).rabby || 
    web3.getDiscoveredWallets().length > 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-panel rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative text-slate-100 glow-border-green border border-white/[0.12] bg-[#0A0D14]/95">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-[#080B10]/90 backdrop-blur-md">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-white/[0.06] border border-white/[0.10] text-slate-300 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white font-display">
                {wallet.isConnected ? 'Connected Account' : 'Connect Web3 Wallet'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">Robinhood Chain (4663)</p>
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
        <div className="p-5 space-y-4">
          
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 space-y-1.5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-red-200">Connection Notice</div>
                <div className="text-[11px] text-red-300/90 leading-relaxed">{errorMsg}</div>
              </div>
            </div>
          )}

          {wallet.isConnected ? (
            /* Connected State */
            <div className="space-y-4 font-mono text-xs">
              
              {/* Network Warning if on wrong chain */}
              {isWrongNetwork && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Wrong Network Detected</span>
                  </div>
                  <p className="text-[11px] text-amber-200/80 font-sans leading-relaxed">
                    Your wallet is connected to <strong>{wallet.networkName}</strong>. Robinhood Chain Mainnet (Chain ID 4663) is required to trade or mint.
                  </p>
                  <button
                    onClick={handleSwitchToRobinhood}
                    disabled={isSwitchingChain}
                    className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 px-3 rounded-lg text-xs transition shadow-sm active:scale-98"
                  >
                    {isSwitchingChain ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>Switch to Robinhood Chain (4663)</span>
                  </button>

                  <details className="text-[10px] text-slate-400 font-sans cursor-pointer pt-1 border-t border-amber-500/20">
                    <summary className="hover:text-amber-300 transition">Manual RPC Settings</summary>
                    <div className="mt-2 p-2 rounded bg-black/50 border border-white/[0.08] font-mono space-y-1 text-slate-300 text-[10px]">
                      <div><strong>Network Name:</strong> Robinhood Chain</div>
                      <div><strong>RPC URL:</strong> https://rpc.mainnet.chain.robinhood.com</div>
                      <div><strong>Chain ID:</strong> 4663</div>
                      <div><strong>Currency Symbol:</strong> ETH</div>
                      <div><strong>Block Explorer:</strong> https://robinhoodchain.blockscout.com</div>
                    </div>
                  </details>
                </div>
              )}

              <div className="bg-[#090C10] border border-white/[0.06] rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Address:</span>
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <span>{wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : '0x'}</span>
                    {wallet.address && <CopyButton text={wallet.address} label="" />}
                  </div>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Network:</span>
                  <span className={`font-bold flex items-center gap-1.5 ${isWrongNetwork ? 'text-amber-400' : 'text-rh-green'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isWrongNetwork ? 'bg-amber-400' : 'bg-rh-green'}`}></span>
                    {wallet.networkName}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Robinhood ETH:</span>
                  <span className="text-white font-bold">{wallet.balanceEth} ETH</span>
                </div>
                {totalPositionsUsd > 0 && (
                  <div className="flex justify-between text-slate-400 pt-2 border-t border-white/[0.04]">
                    <span>Total Capital Placed:</span>
                    <span className="text-rh-green font-bold font-mono">${totalPositionsUsd.toFixed(2)} USD</span>
                  </div>
                )}
              </div>

              {/* Active Portfolio Positions */}
              {activeHoldings.length > 0 || userLpPools.length > 0 ? (
                <div className="bg-[#090C10] border border-white/[0.06] rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-sans font-semibold text-slate-400 uppercase tracking-wider">
                      Active Positions & Pools
                    </span>
                    <span className="text-[10px] text-rh-green font-mono">Verified On-Chain</span>
                  </div>
                  <div className="space-y-2 pt-1 border-t border-white/[0.04]">
                    {activeHoldings.map((h) => (
                      <div key={h.symbol} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white font-mono">{h.symbol}</span>
                          <span className="text-slate-400 text-[10px]">({h.qty.toFixed(2)})</span>
                        </div>
                        <span className="text-rh-green font-mono font-bold">${h.usd.toFixed(2)}</span>
                      </div>
                    ))}
                    {userLpPools.map((p: LiquidityPool) => (
                      <div key={p.poolAddress} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-pink-400 font-mono">{p.assetSymbol}/USDC LP</span>
                        </div>
                        <span className="text-pink-400 font-mono font-bold">${(p.tvlUsd || p.usdcAmount * 2).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-[#090C10] border border-white/[0.06] rounded-xl p-3 text-center text-slate-500 text-[11px] font-sans">
                  No active leveraged tokens held on Robinhood Chain.
                </div>
              )}

              {/* View Full Portfolio & Allocation Link */}
              {onNavigate && (
                <button
                  onClick={() => {
                    onNavigate('portfolio');
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-200 text-black py-2.5 px-4 rounded-xl font-bold transition text-xs shadow-sm"
                >
                  <PieChart className="w-3.5 h-3.5 text-rh-green" />
                  <span>View Full Capital Allocation</span>
                </button>
              )}

              <button
                onClick={handleDisconnect}
                className="w-full flex items-center justify-center gap-2 bg-[#090C10] hover:bg-red-500/10 hover:text-red-400 text-slate-300 py-2.5 px-4 rounded-xl border border-white/[0.08] transition text-xs font-sans font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          ) : (
            /* Wallet Selection Options */
            <div className="space-y-2.5">
              
              {/* Option 1: Browser Extension / MetaMask */}
              <button
                onClick={() => handleConnectInjected('metamask')}
                disabled={isConnecting}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#090C10] hover:bg-[#121620] border border-white/[0.08] hover:border-white/[0.2] transition text-left group disabled:opacity-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-lg">
                    🦊
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">MetaMask / Browser Wallet</div>
                    <div className="text-[11px] text-slate-400">
                      {isConnecting && connectingType === 'metamask' ? 'Connecting... check popup' : 'Direct on-chain connection'}
                    </div>
                  </div>
                </div>
                {isConnecting && connectingType === 'metamask' ? (
                  <Loader2 className="w-4 h-4 text-rh-green animate-spin" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                )}
              </button>

              {/* Option 2: Robinhood Wallet */}
              <button
                onClick={() => handleConnectInjected('robinhood')}
                disabled={isConnecting}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#090C10] hover:bg-[#121620] border border-white/[0.08] hover:border-white/[0.2] transition text-left group disabled:opacity-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-rh-green/10 text-rh-green flex items-center justify-center text-xs font-bold font-mono">
                    RH
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Robinhood Wallet</div>
                    <div className="text-[11px] text-slate-400">
                      {isConnecting && connectingType === 'robinhood' ? 'Connecting... check popup' : 'Robinhood Web3 or Extension'}
                    </div>
                  </div>
                </div>
                {isConnecting && connectingType === 'robinhood' ? (
                  <Loader2 className="w-4 h-4 text-rh-green animate-spin" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                )}
              </button>

              {/* Option 3: Rabby Wallet */}
              <button
                onClick={() => handleConnectInjected('rabby')}
                disabled={isConnecting}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#090C10] hover:bg-[#121620] border border-white/[0.08] hover:border-white/[0.2] transition text-left group disabled:opacity-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold font-mono">
                    RB
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Rabby Wallet</div>
                    <div className="text-[11px] text-slate-400">
                      {isConnecting && connectingType === 'rabby' ? 'Connecting... check popup' : 'EVM Web3 wallet'}
                    </div>
                  </div>
                </div>
                {isConnecting && connectingType === 'rabby' ? (
                  <Loader2 className="w-4 h-4 text-rh-green animate-spin" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                )}
              </button>

              {/* Helpful network prompt guide */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-slate-400 leading-relaxed font-sans">
                <span className="text-slate-200 font-semibold">Robinhood Chain Mainnet (Chain 4663)</span>: Compatible with all EVM wallets. When connecting, your wallet will prompt you to add or switch to the Robinhood network in 1 click.
              </div>

              {/* In case user is on mobile or doesn't have an extension */}
              {!hasInjected && (
                <div className="pt-2 border-t border-white/[0.06] space-y-2">
                  <div className="text-[11px] text-slate-400">Don't have a wallet extension installed?</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <a
                      href="https://metamask.app.link/dapp/www.dassetsrh.xyz"
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-center text-slate-200 flex items-center justify-center gap-1.5 transition"
                    >
                      <span>MetaMask Mobile</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-center text-slate-200 flex items-center justify-center gap-1.5 transition"
                    >
                      <span>Get MetaMask</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
