import { WalletState } from '../types';
import { ethers } from 'ethers';

export const ROBINHOOD_CHAIN = {
  chainId: 4663,
  chainHex: '0x1237',
  name: 'Robinhood Chain',
  rpcUrl: 'https://rpc.mainnet.chain.robinhood.com',
  symbol: 'ETH',
  blockExplorer: 'https://robinhoodchain.blockscout.com',
};

export const HYPERLANE_CONFIG = {
  hyperevm: {
    domainId: 999,
    name: 'HyperEVM',
    mailbox: '0x3a464f746D23Ab22155710f44dB16dcA53e0775E',
    explorer: 'https://hyperevmscan.io',
  },
  robinhood: {
    domainId: 4663,
    name: 'Robinhood Chain',
    mailbox: '0x3a867fCfFeC2B790970eeBDC9023E75B0a172aa7',
    explorer: 'https://robinhoodchain.blockscout.com',
  }
};

export class Web3Service {
  private static instance: Web3Service;
  private state: WalletState = {
    isConnected: false,
    address: null,
    chainId: ROBINHOOD_CHAIN.chainId,
    networkName: ROBINHOOD_CHAIN.name,
    balanceEth: '10.50',
    balanceUsdc: '50,000.00',
    isDemo: false,
    holdings: {},
  };
  private subscribers: ((state: WalletState) => void)[] = [];

  private constructor() {
    const savedDemo = localStorage.getItem('dassets_demo_mode');
    const savedHoldings = localStorage.getItem('dassets_holdings');
    if (savedHoldings) {
      try {
        this.state.holdings = JSON.parse(savedHoldings);
      } catch (e) {
        this.state.holdings = {};
      }
    }
    if (savedDemo === 'true') {
      this.enableDemoMode();
    }
  }

  public static getInstance(): Web3Service {
    if (!Web3Service.instance) {
      Web3Service.instance = new Web3Service();
    }
    return Web3Service.instance;
  }

  public subscribe(callback: (state: WalletState) => void) {
    this.subscribers.push(callback);
    callback({ ...this.state });
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notify() {
    localStorage.setItem('dassets_holdings', JSON.stringify(this.state.holdings));
    this.subscribers.forEach(cb => cb({ ...this.state }));
  }

  public enableDemoMode() {
    const savedHoldings = localStorage.getItem('dassets_holdings');
    let loadedHoldings = this.state.holdings || {};
    if (savedHoldings) {
      try {
        loadedHoldings = JSON.parse(savedHoldings);
      } catch (e) {}
    }

    this.state = {
      isConnected: true,
      address: '0x71C...89A4',
      chainId: ROBINHOOD_CHAIN.chainId,
      networkName: ROBINHOOD_CHAIN.name,
      balanceEth: '14.85',
      balanceUsdc: '50,000.00',
      isDemo: true,
      holdings: loadedHoldings,
    };
    localStorage.setItem('dassets_demo_mode', 'true');
    this.notify();
  }

  public async connectInjected(type: 'robinhood' | 'metamask' | 'rabby' = 'robinhood') {
    const eth = (window as any).ethereum;
    if (!eth) {
      this.enableDemoMode();
      return;
    }

    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      
      try {
        await eth.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ROBINHOOD_CHAIN.chainHex }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: ROBINHOOD_CHAIN.chainHex,
              chainName: ROBINHOOD_CHAIN.name,
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [ROBINHOOD_CHAIN.rpcUrl],
              blockExplorerUrls: [ROBINHOOD_CHAIN.blockExplorer],
            }],
          });
        }
      }

      const chainIdHex = await eth.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainIdHex, 16);

      const savedHoldings = localStorage.getItem('dassets_holdings');
      let loadedHoldings = this.state.holdings || {};
      if (savedHoldings) {
        try {
          loadedHoldings = JSON.parse(savedHoldings);
        } catch (e) {}
      }

      this.state = {
        isConnected: true,
        address: accounts[0] ? `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}` : '0xUnknown',
        chainId: currentChainId,
        networkName: currentChainId === ROBINHOOD_CHAIN.chainId ? ROBINHOOD_CHAIN.name : 'Unknown Network',
        balanceEth: '4.20',
        balanceUsdc: '12,450.00',
        isDemo: false,
        holdings: loadedHoldings,
      };
      localStorage.removeItem('dassets_demo_mode');
      this.notify();
    } catch (err) {
      console.error('Connection failed, falling back to Demo Mode:', err);
      this.enableDemoMode();
    }
  }

  public disconnect() {
    this.state = {
      isConnected: false,
      address: null,
      chainId: ROBINHOOD_CHAIN.chainId,
      networkName: ROBINHOOD_CHAIN.name,
      balanceEth: '0.00',
      balanceUsdc: '0.00',
      isDemo: false,
      holdings: this.state.holdings || {},
    };
    localStorage.removeItem('dassets_demo_mode');
    this.subscribers.forEach(cb => cb({ ...this.state }));
  }

  public recordMint(symbol: string, amount: number, usdcCost: number) {
    const currentUsdc = parseFloat(this.state.balanceUsdc.replace(/,/g, ''));
    const nextUsdc = Math.max(0, currentUsdc - usdcCost);
    this.state.balanceUsdc = nextUsdc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const currentHolding = this.state.holdings[symbol] || 0;
    this.state.holdings[symbol] = currentHolding + amount;
    this.notify();
  }

  public recordRedeem(symbol: string, amount: number, usdcProceeds: number) {
    const currentHolding = this.state.holdings[symbol] || 0;
    this.state.holdings[symbol] = Math.max(0, currentHolding - amount);

    const currentUsdc = parseFloat(this.state.balanceUsdc.replace(/,/g, ''));
    const nextUsdc = currentUsdc + usdcProceeds;
    this.state.balanceUsdc = nextUsdc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    this.notify();
  }

  public deductUsdc(amount: number) {
    const current = parseFloat(this.state.balanceUsdc.replace(/,/g, ''));
    const next = Math.max(0, current - amount);
    this.state.balanceUsdc = next.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    this.notify();
  }
}
