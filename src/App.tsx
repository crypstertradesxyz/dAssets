import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { AssetTable } from './components/AssetTable';
import { OracleTerminal } from './components/OracleTerminal';
import { BridgeExplorer } from './components/BridgeExplorer';
import { ContractsView } from './components/ContractsView';
import { MintModal } from './components/MintModal';
import { CreatePoolModal } from './components/CreatePoolModal';
import { WalletModal } from './components/WalletModal';
import { Footer } from './components/Footer';

import { LeveragedAsset, WalletState, AppView } from './types';
import { PoolsView } from './components/PoolsView';
import { PortfolioView } from './components/PortfolioView';
import { TradeView } from './components/TradeView';
import { InfoView } from './components/InfoView';
import { INITIAL_ASSETS } from './data/bounceAssets';
import { OracleService } from './services/oracle';
import { Web3Service } from './services/web3';
import { parseCurrentUrl, getUrlForView, updatePageMetadata } from './utils/navigation';

export const App: React.FC = () => {
  const [assets, setAssets] = useState<LeveragedAsset[]>(INITIAL_ASSETS);
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: 4663,
    networkName: 'Robinhood Chain',
    balanceEth: '0.00',
    balanceUsdc: '0.00',
    isDemo: false,
    holdings: {},
  });

  // Resolve initial route from browser URL
  const initialRoute = typeof window !== 'undefined'
    ? parseCurrentUrl(window.location.pathname, window.location.search, INITIAL_ASSETS)
    : { view: 'home' as AppView };

  const [activeView, setActiveView] = useState<AppView>(initialRoute.view);
  const [selectedAsset, setSelectedAsset] = useState<LeveragedAsset>(
    initialRoute.asset || INITIAL_ASSETS.find(a => a.symbol === 'dBTC3L') || INITIAL_ASSETS[0]
  );
  const [mintAsset, setMintAsset] = useState<LeveragedAsset | null>(null);
  const [mintModalTab, setMintModalTab] = useState<'mint' | 'redeem'>('mint');

  const handleOpenMint = (asset: LeveragedAsset, initialTab: 'mint' | 'redeem' = 'mint') => {
    setMintAsset(asset);
    setMintModalTab(initialTab);
  };
  const [seedPoolAsset, setSeedPoolAsset] = useState<LeveragedAsset | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Central client navigation function
  const navigateTo = useCallback((view: AppView, asset?: LeveragedAsset, replace = false) => {
    setActiveView(view);
    const targetAsset = asset || (view === 'terminal' ? selectedAsset : undefined);
    if (asset) {
      setSelectedAsset(asset);
    }
    const url = getUrlForView(view, targetAsset?.symbol);
    if (replace) {
      window.history.replaceState({ view, symbol: targetAsset?.symbol }, '', url);
    } else {
      window.history.pushState({ view, symbol: targetAsset?.symbol }, '', url);
    }
    updatePageMetadata(view, targetAsset || selectedAsset);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedAsset]);

  // Handle browser Back / Forward history events
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseCurrentUrl(window.location.pathname, window.location.search, assets);
      setActiveView(parsed.view);
      if (parsed.asset) {
        setSelectedAsset(parsed.asset);
      }
      updatePageMetadata(parsed.view, parsed.asset || selectedAsset);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [assets, selectedAsset]);

  // Sync initial metadata
  useEffect(() => {
    updatePageMetadata(activeView, selectedAsset);
  }, [activeView, selectedAsset]);

  // Oracle & Web3 initialization
  useEffect(() => {
    const oracle = OracleService.getInstance();
    oracle.init(INITIAL_ASSETS);
    const unsubOracle = oracle.subscribe((updated) => {
      setAssets(updated);
      setSelectedAsset(prev => updated.find(a => a.symbol === prev.symbol) || prev);
    });

    const web3 = Web3Service.getInstance();
    const unsubWeb3 = web3.subscribe(setWallet);

    return () => {
      unsubOracle();
      unsubWeb3();
    };
  }, []);

  const handleSelectAsset = (asset: LeveragedAsset) => {
    navigateTo('terminal', asset);
  };

  return (
    <div className="min-h-screen bg-forged-carbon text-zinc-100 flex flex-col justify-between selection:bg-rh-green selection:text-black relative">
      <div>
        {/* Clean Single Navbar with real links and routing */}
        <Navbar
          wallet={wallet}
          onOpenWalletModal={() => setIsWalletModalOpen(true)}
          activeView={activeView}
          onNavigate={navigateTo}
          setActiveView={(v) => navigateTo(v)}
        />

        {/* Global Network Switch Alert Bar */}
        {wallet.isConnected && wallet.chainId !== 4663 && (
          <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-amber-500/20 border-b border-amber-500/30 px-4 py-2 text-xs font-mono">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
                <span>
                  Connected to <strong className="text-white">{wallet.networkName}</strong>. Please switch to <strong className="text-white">Robinhood Chain (Chain ID 4663)</strong> to mint and trade.
                </span>
              </div>
              <button
                onClick={() => Web3Service.getInstance().switchNetwork()}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-md transition text-xs flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
              >
                <span>Switch to Robinhood Chain</span>
              </button>
            </div>
          </div>
        )}

        {/* View Routing */}
        {activeView === 'home' && (
          <main>
            <HomeView
              assets={assets}
              onExploreMarkets={() => navigateTo('markets')}
              onSelectAsset={handleSelectAsset}
              onMintAsset={handleOpenMint}
              onSeedPool={(asset) => setSeedPoolAsset(asset)}
              onOpenContracts={() => navigateTo('contracts')}
              onNavigate={navigateTo}
            />
          </main>
        )}

        {activeView === 'trade' && (
          <main>
            <TradeView
              assets={assets}
              wallet={wallet}
              onOpenWalletModal={() => setIsWalletModalOpen(true)}
              onMintAsset={handleOpenMint}
              onSeedPool={(asset) => setSeedPoolAsset(asset)}
              onNavigate={navigateTo}
              initialAsset={selectedAsset}
            />
          </main>
        )}

        {activeView === 'markets' && (
          <main>
            <AssetTable
              assets={assets}
              onSelectAsset={handleSelectAsset}
              onMintAsset={handleOpenMint}
              onSeedPool={(asset) => setSeedPoolAsset(asset)}
            />
          </main>
        )}

        {activeView === 'pools' && (
          <main>
            <PoolsView
              assets={assets}
              wallet={wallet}
              onOpenWalletModal={() => setIsWalletModalOpen(true)}
              onMintAsset={handleOpenMint}
            />
          </main>
        )}

        {activeView === 'portfolio' && (
          <main>
            <PortfolioView
              assets={assets}
              wallet={wallet}
              onOpenWalletModal={() => setIsWalletModalOpen(true)}
              onMintAsset={handleOpenMint}
              onSeedPool={(asset) => setSeedPoolAsset(asset)}
              onNavigate={navigateTo}
            />
          </main>
        )}

        {activeView === 'terminal' && (
          <main>
            <OracleTerminal
              asset={selectedAsset}
              wallet={wallet}
              onMintAsset={handleOpenMint}
              onSeedPool={(asset) => setSeedPoolAsset(asset)}
              allAssets={assets}
              onSelectAsset={handleSelectAsset}
            />
          </main>
        )}

        {activeView === 'info' && (
          <main>
            <InfoView initialTab="faq" onNavigate={navigateTo} />
          </main>
        )}

        {activeView === 'bridge' && (
          <main>
            <InfoView initialTab="bridge" onNavigate={navigateTo} />
          </main>
        )}

        {activeView === 'contracts' && (
          <main>
            <InfoView initialTab="contracts" onNavigate={navigateTo} />
          </main>
        )}
      </div>

      {/* Footer */}
      <Footer onNavigate={navigateTo} />

      {/* Modals */}
      {mintAsset && (
        <MintModal
          asset={mintAsset}
          wallet={wallet}
          onClose={() => setMintAsset(null)}
          onOpenSeedPool={(asset) => setSeedPoolAsset(asset)}
          onOpenWalletModal={() => setIsWalletModalOpen(true)}
          initialTab={mintModalTab}
        />
      )}

      {seedPoolAsset && (
        <CreatePoolModal
          assets={assets}
          initialAsset={seedPoolAsset}
          wallet={wallet}
          onClose={() => setSeedPoolAsset(null)}
          onOpenWalletModal={() => setIsWalletModalOpen(true)}
        />
      )}

      {isWalletModalOpen && (
        <WalletModal
          wallet={wallet}
          onClose={() => setIsWalletModalOpen(false)}
          onNavigate={navigateTo}
          assets={assets}
          onMintAsset={handleOpenMint}
        />
      )}
    </div>
  );
};
