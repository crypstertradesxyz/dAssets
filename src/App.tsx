import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { AssetTable } from './components/AssetTable';
import { OracleTerminal } from './components/OracleTerminal';
import { BridgeExplorer } from './components/BridgeExplorer';
import { MintModal } from './components/MintModal';
import { SeedPoolModal } from './components/SeedPoolModal';
import { WalletModal } from './components/WalletModal';
import { Footer } from './components/Footer';

import { LeveragedAsset, WalletState } from './types';
import { INITIAL_ASSETS } from './data/bounceAssets';
import { OracleService } from './services/oracle';
import { Web3Service } from './services/web3';

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
  });

  const [activeView, setActiveView] = useState<'home' | 'markets' | 'terminal' | 'bridge'>('home');
  const [selectedAsset, setSelectedAsset] = useState<LeveragedAsset>(
    INITIAL_ASSETS.find(a => a.symbol === 'dBTC3L') || INITIAL_ASSETS[0]
  );
  const [mintAsset, setMintAsset] = useState<LeveragedAsset | null>(null);
  const [seedPoolAsset, setSeedPoolAsset] = useState<LeveragedAsset | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

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
    setSelectedAsset(asset);
    setActiveView('terminal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenMintdBTC3L = () => {
    const btc = assets.find(a => a.symbol === 'dBTC3L') || assets[0];
    setMintAsset(btc);
  };

  return (
    <div className="min-h-screen bg-[#07090C] text-zinc-100 flex flex-col justify-between selection:bg-white selection:text-black">
      <div>
        {/* Clean Single Navbar */}
        <Navbar
          wallet={wallet}
          onOpenWalletModal={() => setIsWalletModalOpen(true)}
          activeView={activeView}
          setActiveView={setActiveView}
        />

        {/* View Routing */}
        {activeView === 'home' && (
          <main>
            <HomeView
              assets={assets}
              onExploreMarkets={() => setActiveView('markets')}
              onSelectAsset={handleSelectAsset}
              onMintAsset={(asset) => setMintAsset(asset)}
            />
          </main>
        )}

        {activeView === 'markets' && (
          <main>
            <AssetTable
              assets={assets}
              onSelectAsset={handleSelectAsset}
              onMintAsset={(asset) => setMintAsset(asset)}
              onSeedPool={(asset) => setSeedPoolAsset(asset)}
            />
          </main>
        )}

        {activeView === 'terminal' && (
          <main>
            <OracleTerminal
              asset={selectedAsset}
              wallet={wallet}
              onMintAsset={(asset) => setMintAsset(asset)}
              onSeedPool={(asset) => setSeedPoolAsset(asset)}
              allAssets={assets}
              onSelectAsset={handleSelectAsset}
            />
          </main>
        )}

        {activeView === 'bridge' && (
          <main>
            <BridgeExplorer />
          </main>
        )}
      </div>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      {mintAsset && (
        <MintModal
          asset={mintAsset}
          wallet={wallet}
          onClose={() => setMintAsset(null)}
          onOpenSeedPool={(asset) => setSeedPoolAsset(asset)}
          onOpenWalletModal={() => setIsWalletModalOpen(true)}
        />
      )}

      {seedPoolAsset && (
        <SeedPoolModal
          asset={seedPoolAsset}
          wallet={wallet}
          onClose={() => setSeedPoolAsset(null)}
          onOpenWalletModal={() => setIsWalletModalOpen(true)}
        />
      )}

      {isWalletModalOpen && (
        <WalletModal
          wallet={wallet}
          onClose={() => setIsWalletModalOpen(false)}
        />
      )}
    </div>
  );
};
