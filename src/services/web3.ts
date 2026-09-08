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
    balanceEth: '0.00',
    balanceUsdc: '0.00',
    isDemo: false,
    holdings: {},
  };
  private subscribers: ((state: WalletState) => void)[] = [];

  private constructor() {
    // Check if wallet is already connected
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const eth = (window as any).ethereum;
      eth.on?.('accountsChanged', (accounts: string[]) => {
        if (!accounts || accounts.length === 0) {
          this.disconnect();
        } else {
          this.refreshBalances(accounts[0]);
        }
      });
      eth.on?.('chainChanged', () => {
        window.location.reload();
      });
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

  public async refreshBalances(accountAddress: string) {
    const eth = (window as any).ethereum;
    if (!eth) return;

    try {
      const provider = new ethers.BrowserProvider(eth);
      const balanceWei = await provider.getBalance(accountAddress);
      const ethVal = parseFloat(ethers.formatEther(balanceWei));
      const formattedEth = ethVal.toFixed(4);

      // Query genuine dBTC3L token balance on Robinhood Chain
      const holdings: Record<string, number> = {};
      try {
        const flagshipAddress = '0x5164E1dc1Be45a0Fbe4D6A25A4713225E9bb56F6';
        const tokenContract = new ethers.Contract(
          flagshipAddress,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        const tokenBalWei = await tokenContract.balanceOf(accountAddress);
        const tokenQty = parseFloat(ethers.formatUnits(tokenBalWei, 18));
        if (tokenQty > 0) {
          holdings['dBTC3L'] = tokenQty;
        }
      } catch (err) {
        // Token contract query silent fallback
      }

      this.state = {
        ...this.state,
        isConnected: true,
        address: `${accountAddress.slice(0, 6)}...${accountAddress.slice(-4)}`,
        balanceEth: formattedEth,
        holdings,
      };
      this.notify();
    } catch (err) {
      console.warn('Error querying on-chain balance:', err);
    }
  }

  public async connectInjected(type: 'robinhood' | 'metamask' | 'rabby' = 'robinhood') {
    const eth = (window as any).ethereum;
    if (!eth) {
      alert('No Web3 wallet detected. Please install MetaMask, Rabby, or Robinhood Wallet.');
      return;
    }

    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) return;

      // Switch or Add Robinhood Chain Mainnet (Chain ID 4663 / 0x1237)
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

      const provider = new ethers.BrowserProvider(eth);
      let balanceEthFormatted = '0.00';
      try {
        const balWei = await provider.getBalance(accounts[0]);
        balanceEthFormatted = parseFloat(ethers.formatEther(balWei)).toFixed(4);
      } catch (e) {
        console.warn('Could not read ETH balance:', e);
      }

      const holdings: Record<string, number> = {};
      try {
        const flagshipAddress = '0x5164E1dc1Be45a0Fbe4D6A25A4713225E9bb56F6';
        const tokenContract = new ethers.Contract(
          flagshipAddress,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        const tokenBalWei = await tokenContract.balanceOf(accounts[0]);
        const tokenQty = parseFloat(ethers.formatUnits(tokenBalWei, 18));
        if (tokenQty > 0) {
          holdings['dBTC3L'] = tokenQty;
        }
      } catch (err) {
        // ignore
      }

      this.state = {
        isConnected: true,
        address: `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        chainId: currentChainId,
        networkName: currentChainId === ROBINHOOD_CHAIN.chainId ? ROBINHOOD_CHAIN.name : 'Unknown Network',
        balanceEth: balanceEthFormatted,
        balanceUsdc: '0.00',
        isDemo: false,
        holdings,
      };
      this.notify();
    } catch (err: any) {
      console.error('Wallet connection rejected or failed:', err);
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
      holdings: {},
    };
    this.notify();
  }

  public recordMint(symbol: string, amount: number, _usdcCost: number) {
    const currentHolding = this.state.holdings[symbol] || 0;
    this.state.holdings[symbol] = currentHolding + amount;
    this.notify();

    // Re-query real on-chain balance
    const eth = (window as any).ethereum;
    if (eth && eth.selectedAddress) {
      this.refreshBalances(eth.selectedAddress);
    }
  }

  public recordRedeem(symbol: string, amount: number, _usdcProceeds: number) {
    const currentHolding = this.state.holdings[symbol] || 0;
    this.state.holdings[symbol] = Math.max(0, currentHolding - amount);
    this.notify();

    const eth = (window as any).ethereum;
    if (eth && eth.selectedAddress) {
      this.refreshBalances(eth.selectedAddress);
    }
  }
}

