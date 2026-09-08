import React, { useState } from 'react';
import { 
  Wallet, 
  ChevronDown,
  Menu,
  X,
  PieChart
} from 'lucide-react';
import { WalletState, AppView } from '../types';
import { Web3Service } from '../services/web3';

interface NavbarProps {
  wallet: WalletState;
  onOpenWalletModal: () => void;
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  setActiveView?: (view: AppView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  wallet,
  onOpenWalletModal,
  activeView,
  onNavigate,
  setActiveView,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (view: AppView, e?: React.MouseEvent) => {
    if (e && (e.metaKey || e.ctrlKey)) {
      return; // allow opening in new tab natively
    }
    if (e) e.preventDefault();
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(view);
    } else if (setActiveView) {
      setActiveView(view);
    }
  };

  const navItems: { view: AppView; label: string; href: string; badge?: string; pulse?: boolean }[] = [
    { view: 'markets', label: 'Markets (270+)', href: '/markets' },
    { view: 'pools', label: 'Pools', href: '/pools', badge: 'Uniswap' },
    { view: 'portfolio', label: 'Portfolio', href: '/portfolio' },
    { view: 'terminal', label: 'Oracle Feed', href: '/terminal', pulse: true },
    { view: 'bridge', label: 'Hyperlane', href: '/bridge' },
    { view: 'contracts', label: 'Contracts', href: '/contracts' },
  ];

  return (
    <header className="border-b border-white/[0.08] bg-[#05070A]/80 backdrop-blur-xl sticky top-0 z-40 shadow-xl shadow-black/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        
        {/* Brand & Main Links */}
        <div className="flex items-center space-x-6 lg:space-x-8">
          <a 
            href="/"
            onClick={(e) => handleNav('home', e)}
            className="flex items-center space-x-2 cursor-pointer select-none group" 
          >
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-white/[0.15] bg-[#050608] flex items-center justify-center shadow-sm group-hover:border-rh-green/50 transition">
              <img src="/logo.png" alt="dAssets" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-base tracking-tight text-white font-display">dAssets</span>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden sm:flex items-center space-x-1">
            {navItems.map((item) => (
              <a
                key={item.view}
                href={item.href}
                onClick={(e) => handleNav(item.view, e)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                  activeView === item.view
                    ? 'text-white bg-white/[0.08]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.pulse && <span className="w-1.5 h-1.5 rounded-full bg-rh-green animate-pulse" />}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-pink-500/20 text-pink-400 font-mono font-bold">
                    {item.badge}
                  </span>
                )}
              </a>
            ))}
          </nav>
        </div>

        {/* Right Controls: Network & Wallet */}
        <div className="flex items-center space-x-2.5">
          
          {/* X / Twitter Link */}
          <a
            href="https://x.com/dAssetsRH"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition flex items-center justify-center border border-white/[0.06]"
            title="Follow @dAssetsRH on X"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          {/* Network Pill / Switch Button */}
          {wallet.isConnected && wallet.chainId !== 4663 ? (
            <button
              onClick={() => Web3Service.getInstance().switchNetwork()}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 font-mono hover:bg-amber-500/20 transition cursor-pointer active:scale-95 shadow-sm"
              title="Click to switch to Robinhood Chain Mainnet (4663)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Switch to 4663</span>
            </button>
          ) : (
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-rh-green"></span>
              <span>Robinhood (4663)</span>
            </div>
          )}

          {/* Portfolio Shortcut Button */}
          {wallet.isConnected && (
            <button
              onClick={(e) => handleNav('portfolio', e)}
              className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rh-green/10 hover:bg-rh-green/20 border border-rh-green/25 text-xs text-rh-green font-mono transition cursor-pointer active:scale-95 shadow-sm"
              title="View Capital Allocation & Holdings"
            >
              <PieChart className="w-3 h-3" />
              <span className="font-bold">Portfolio</span>
            </button>
          )}

          {/* Wallet Button */}
          {wallet.isConnected ? (
            <button
              onClick={onOpenWalletModal}
              className="flex items-center gap-2 bg-[#0E1218] hover:bg-[#141A22] text-slate-200 border border-white/[0.10] px-3 py-1.5 rounded-md text-xs font-mono font-medium transition"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${wallet.chainId !== 4663 ? 'bg-amber-400 animate-pulse' : 'bg-rh-green'}`}></div>
              <span>{wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'Connected'}</span>
              {wallet.isDemo && (
                <span className="text-[9px] bg-white/[0.08] text-slate-400 px-1 py-0.5 rounded font-sans uppercase">
                  Preview
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>
          ) : (
            <button
              onClick={onOpenWalletModal}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-200 text-black px-3.5 py-1.5 rounded-md text-xs font-semibold transition active:scale-95 shadow-sm"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect Wallet</span>
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition border border-white/[0.06]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-white/[0.08] bg-[#06080C]/95 backdrop-blur-2xl px-4 py-3 space-y-1 shadow-2xl">
          {navItems.map((item) => (
            <a
              key={item.view}
              href={item.href}
              onClick={(e) => handleNav(item.view, e)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-between ${
                activeView === item.view
                  ? 'text-white bg-white/[0.10]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2">
                {item.pulse && <span className="w-1.5 h-1.5 rounded-full bg-rh-green animate-pulse" />}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 font-mono font-bold">
                  {item.badge}
                </span>
              )}
            </a>
          ))}
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Network:</span>
            <span className="text-rh-green flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rh-green"></span>
              Robinhood Mainnet (4663)
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
