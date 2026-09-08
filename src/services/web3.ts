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

export interface EIP6963ProviderDetail {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: any;
}

export class Web3Service {
  private static instance: Web3Service;
  private state: WalletState = {
    isConnected: false,
    address: null,
    chainId: ROBINHOOD_CHAIN.chainId,
    networkName: ROBINHOOD_CHAIN.name,
    balanceEth: '0.00',
    balanceUsdc: '0.00',
    isDemo: false,
    holdings: {},
  };
  private subscribers: ((state: WalletState) => void)[] = [];
  private activeProvider: any = null;
  private eip6963Providers: Map<string, EIP6963ProviderDetail> = new Map();

  private constructor() {
    if (typeof window !== 'undefined') {
      // 1. Listen for EIP-6963 announced providers
      window.addEventListener('eip6963:announceProvider', (event: any) => {
        if (event.detail && event.detail.info) {
          this.eip6963Providers.set(event.detail.info.uuid || event.detail.info.rdns, event.detail);
        }
      });
      window.dispatchEvent(new Event('eip6963:requestProvider'));

      // 2. Silent reconnect check if previously authorized
      this.checkSilentReconnect();
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
    this.subscribers.forEach(cb => cb({ ...this.state }));
  }

  public getDiscoveredWallets(): EIP6963ProviderDetail[] {
    return Array.from(this.eip6963Providers.values());
  }

  /**
   * Get currently active provider or fallback to detected provider
   */
  public getActiveProvider(): any {
    if (this.activeProvider) return this.activeProvider;
    const provider = this.getProvider();
    if (provider) {
      this.activeProvider = provider;
    }
    return provider;
  }

  /**
   * Resolve appropriate injected provider based on user selection
   */
  public getProvider(type?: 'robinhood' | 'metamask' | 'rabby' | 'injected'): any {
    const w = typeof window !== 'undefined' ? (window as any) : {};

    // 1. Check EIP-6963 discovered providers
    const discovered = this.getDiscoveredWallets();
    if (type && discovered.length > 0) {
      const match = discovered.find(d => d.info.name.toLowerCase().includes(type.toLowerCase()));
      if (match) return match.provider;
    }

    // 2. Specific wallet checks
    if (type === 'robinhood') {
      if (w.robinhood?.ethereum) return w.robinhood.ethereum;
      if (w.robinhood?.request) return w.robinhood;
      if (w.ethereum?.isRobinhood) return w.ethereum;
      if (w.ethereum?.providers && Array.isArray(w.ethereum.providers)) {
        const rh = w.ethereum.providers.find((p: any) => p.isRobinhood);
        if (rh) return rh;
      }
      // Robinhood mobile browser or in-app web3 fallback
      if (w.ethereum && !w.ethereum.isMetaMask && !w.ethereum.isRabby) {
        return w.ethereum;
      }
    }

    if (type === 'rabby') {
      if (w.rabby) return w.rabby;
      if (w.ethereum?.isRabby) return w.ethereum;
      if (w.ethereum?.providers && Array.isArray(w.ethereum.providers)) {
        const rb = w.ethereum.providers.find((p: any) => p.isRabby);
        if (rb) return rb;
      }
    }

    if (type === 'metamask') {
      if (w.ethereum?.providers && Array.isArray(w.ethereum.providers)) {
        const mm = w.ethereum.providers.find((p: any) => p.isMetaMask && !p.isRabby && !p.isPhantom && !p.isBraveWallet);
        if (mm) return mm;
      }
      if (w.ethereum?.isMetaMask) return w.ethereum;
    }

    // 3. Multi-injected array check (window.ethereum.providers)
    if (w.ethereum?.providers && Array.isArray(w.ethereum.providers) && w.ethereum.providers.length > 0) {
      return w.ethereum.providers[0];
    }

    // 4. Standard window.ethereum fallback
    if (w.ethereum) {
      return w.ethereum;
    }

    // 5. Fallback to any discovered EIP-6963 provider
    if (discovered.length > 0) {
      return discovered[0].provider;
    }

    // 6. Direct window-level objects
    if (w.robinhood?.ethereum || w.robinhood) return w.robinhood.ethereum || w.robinhood;
    if (w.rabby) return w.rabby;

    return null;
  }

  /**
   * Check if account is already authorized on page load (without prompting popup)
   */
  private async checkSilentReconnect() {
    try {
      const provider = this.getProvider();
      if (!provider) return;

      const accounts = await provider.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        this.activeProvider = provider;
        this.setupProviderListeners(provider);
        await this.syncAccountState(provider, accounts[0]);
      }
    } catch (e) {
      console.debug('Silent reconnect did not find pre-authorized accounts:', e);
    }
  }

  private setupProviderListeners(provider: any) {
    if (!provider || !provider.on) return;

    provider.on('accountsChanged', (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        this.disconnect();
      } else {
        this.syncAccountState(provider, accounts[0]);
      }
    });

    provider.on('chainChanged', (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      this.state = {
        ...this.state,
        chainId,
        networkName: chainId === ROBINHOOD_CHAIN.chainId ? ROBINHOOD_CHAIN.name : `Chain ${chainId}`,
      };
      if (this.state.address) {
        this.syncAccountState(provider, this.state.address);
      } else {
        this.notify();
      }
    });
  }

  /**
   * Attempt to switch to or add Robinhood Chain Mainnet (4663)
   */
  public async switchNetwork(customProvider?: any): Promise<boolean> {
    const provider = customProvider || this.getActiveProvider();
    if (!provider) {
      console.warn('Cannot switch network: no Web3 provider found');
      return false;
    }

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ROBINHOOD_CHAIN.chainHex }],
      });
    } catch (switchError: any) {
      // User explicitly rejected the switch prompt
      if (
        switchError?.code === 4001 ||
        switchError?.message?.toLowerCase().includes('reject') ||
        switchError?.message?.toLowerCase().includes('user denied')
      ) {
        console.warn('User rejected switching network:', switchError);
        return false;
      }

      // If switch failed (chain not configured or unrecognized), attempt to add Robinhood Chain
      try {
        await provider.request({
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

        // Some wallets require an explicit switch after adding
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ROBINHOOD_CHAIN.chainHex }],
          });
        } catch (_) {
          // Already on chain or wallet auto-switched
        }
      } catch (addError: any) {
        console.warn('Failed to add Robinhood Chain:', addError);
        return false;
      }
    }

    // Explicitly verify resulting chainId and update state
    try {
      const chainIdHex = await provider.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainIdHex, 16);
      this.state = {
        ...this.state,
        chainId: currentChainId,
        networkName: currentChainId === ROBINHOOD_CHAIN.chainId ? ROBINHOOD_CHAIN.name : `Chain ${currentChainId}`,
      };
      if (this.state.address) {
        await this.syncAccountState(provider, this.state.address);
      } else {
        this.notify();
      }
      return currentChainId === ROBINHOOD_CHAIN.chainId;
    } catch (e) {
      console.warn('Error verifying chainId after switch:', e);
      return false;
    }
  }

  /**
   * Synchronize account address, balances, and holdings
   */
  private async syncAccountState(provider: any, accountAddress: string) {
    try {
      let currentChainId = ROBINHOOD_CHAIN.chainId;
      try {
        const chainIdHex = await provider.request({ method: 'eth_chainId' });
        currentChainId = parseInt(chainIdHex, 16);
      } catch (e) {
        // ignore
      }

      // Query balance using ethers BrowserProvider
      let formattedEth = '0.00';
      const holdings: Record<string, number> = {};

      try {
        const ethersProvider = new ethers.BrowserProvider(provider);
        const balanceWei = await ethersProvider.getBalance(accountAddress);
        formattedEth = parseFloat(ethers.formatEther(balanceWei)).toFixed(4);

        // Query genuine dBTC3L token balance on Robinhood Chain
        if (currentChainId === ROBINHOOD_CHAIN.chainId) {
          try {
            const flagshipAddress = '0x5164E1dc1Be45a0Fbe4D6A25A4713225E9bb56F6';
            const tokenContract = new ethers.Contract(
              flagshipAddress,
              ['function balanceOf(address) view returns (uint256)'],
              ethersProvider
            );
            const tokenBalWei = await tokenContract.balanceOf(accountAddress);
            const tokenQty = parseFloat(ethers.formatUnits(tokenBalWei, 18));
            if (tokenQty > 0) {
              holdings['dBTC3L'] = tokenQty;
            }
          } catch (err) {
            // silent token balance fallback
          }
        }
      } catch (err) {
        console.warn('Balance query warning:', err);
      }

      this.state = {
        isConnected: true,
        address: accountAddress,
        chainId: currentChainId,
        networkName: currentChainId === ROBINHOOD_CHAIN.chainId ? ROBINHOOD_CHAIN.name : `Chain ${currentChainId}`,
        balanceEth: formattedEth,
        balanceUsdc: '0.00',
        isDemo: false,
        holdings,
      };
      this.notify();
    } catch (err) {
      console.warn('Error syncing account state:', err);
    }
  }

  /**
   * Main connection entrypoint called from WalletModal
   */
  public async connectInjected(type: 'robinhood' | 'metamask' | 'rabby' | 'injected' = 'injected'): Promise<{ success: boolean; error?: string }> {
    const provider = this.getProvider(type);
    if (!provider) {
      return {
        success: false,
        error: `No Web3 wallet extension detected for ${type === 'injected' ? 'this browser' : type}. Please install or open MetaMask, Rabby, or Robinhood Wallet.`
      };
    }

    try {
      this.activeProvider = provider;
      this.setupProviderListeners(provider);

      // Request user account authorization
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        return {
          success: false,
          error: 'No accounts selected. Please select an account in your wallet.'
        };
      }

      // Attempt to ensure on Robinhood Chain Mainnet (Chain 4663)
      try {
        await this.switchNetwork(provider);
      } catch (switchErr) {
        console.debug('Network switch deferred during initial connect:', switchErr);
      }

      // Sync account state
      await this.syncAccountState(provider, accounts[0]);

      return { success: true };
    } catch (err: any) {
      console.error('Wallet connection rejected or failed:', err);

      if (err.code === 4001) {
        return {
          success: false,
          error: 'Connection request was cancelled or rejected in your wallet.'
        };
      }

      if (err.code === -32002) {
        return {
          success: false,
          error: 'A connection request is already pending in your wallet extension. Please open your wallet extension to approve it.'
        };
      }

      return {
        success: false,
        error: err.message || 'Failed to connect to wallet. Please try again.'
      };
    }
  }

  public async refreshBalances(accountAddress: string) {
    if (this.activeProvider) {
      await this.syncAccountState(this.activeProvider, accountAddress);
    }
  }

  public disconnect() {
    this.activeProvider = null;
    this.state = {
      isConnected: false,
      address: null,
      chainId: ROBINHOOD_CHAIN.chainId,
      networkName: ROBINHOOD_CHAIN.name,
      balanceEth: '0.00',
      balanceUsdc: '0.00',
      isDemo: false,
      holdings: {},
    };
    this.notify();
  }

  public recordMint(symbol: string, amount: number, _usdcCost: number) {
    const currentHolding = this.state.holdings[symbol] || 0;
    this.state.holdings[symbol] = currentHolding + amount;
    this.notify();

    if (this.state.address) {
      this.refreshBalances(this.state.address);
    }
  }

  public recordRedeem(symbol: string, amount: number, _usdcProceeds: number) {
    const currentHolding = this.state.holdings[symbol] || 0;
    this.state.holdings[symbol] = Math.max(0, currentHolding - amount);
    this.notify();

    if (this.state.address) {
      this.refreshBalances(this.state.address);
    }
  }
}
