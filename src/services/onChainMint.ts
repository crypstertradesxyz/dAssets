import { ethers } from 'ethers';
import artifacts from '../contracts/artifacts.json';
import deployedConfig from '../contracts/deployedAddresses.json';

export async function mintGenuineOnChain(
  symbol: string,
  name: string,
  underlying: string,
  leverage: number,
  isShort: boolean,
  hyperevmAddress: string,
  amount: number
): Promise<{ txHash: string; tokenAddress?: string }> {
  const eth = (window as any).ethereum;
  if (!eth) {
    throw new Error('No Web3 wallet injected (MetaMask/Rabby/Robinhood Wallet required).');
  }

  // 1. Ensure wallet is switched to Robinhood Chain Mainnet (Chain ID: 4663 / 0x1237)
  try {
    const chainIdHex = await eth.request({ method: 'eth_chainId' });
    if (parseInt(chainIdHex, 16) !== 4663) {
      try {
        await eth.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x1237' }],
        });
      } catch (switchError: any) {
        const isMissing =
          switchError?.code === 4902 ||
          switchError?.code === -32603 ||
          switchError?.data?.originalError?.code === 4902 ||
          switchError?.data?.code === 4902 ||
          (switchError?.message && (
            switchError.message.includes('Unrecognized') ||
            switchError.message.includes('4902') ||
            switchError.message.includes('not added') ||
            switchError.message.includes('unknown')
          ));

        if (isMissing) {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x1237',
              chainName: 'Robinhood Chain',
              nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://rpc.mainnet.chain.robinhood.com'],
              blockExplorerUrls: ['https://robinhoodchain.blockscout.com'],
            }],
          });
        } else {
          throw switchError;
        }
      }
    }
  } catch (err: any) {
    console.warn('Network switch to Robinhood Chain was not completed:', err);
    throw new Error('NETWORK_SWITCH_FAILED');
  }

  const provider = new ethers.BrowserProvider(eth);
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();

  // 2. Check if the user has ETH on Robinhood Chain to pay for gas
  const balance = await provider.getBalance(userAddress);
  if (balance === 0n) {
    throw new Error('NO_L2_GAS');
  }

  const factoryAddress = deployedConfig?.factory;
  if (!factoryAddress || factoryAddress === '0x0000000000000000000000000000000000000000') {
    // If factory address is not configured, deploy token contract directly
    const TokenFactory = new ethers.ContractFactory(
      artifacts.dAssetToken.abi,
      artifacts.dAssetToken.bytecode,
      signer
    );

    const hyperevmId = ethers.keccak256(ethers.toUtf8Bytes(hyperevmAddress));
    const token = await TokenFactory.deploy(
      name,
      symbol,
      underlying,
      Math.abs(leverage),
      isShort,
      userAddress,
      userAddress,
      hyperevmId
    );

    const txReceipt = await token.deploymentTransaction()?.wait();
    const tokenAddress = await token.getAddress();

    const amountWei = ethers.parseUnits(amount.toString(), 18);
    const mintTx = await (token as any).mint(userAddress, amountWei);
    await mintTx.wait();

    try {
      await eth.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: symbol,
            decimals: 18,
          },
        },
      });
    } catch (e) {
      console.warn('User dismissed wallet_watchAsset prompt');
    }

    return {
      txHash: txReceipt?.hash || mintTx.hash,
      tokenAddress
    };
  }

  // 3. Genuine execution on dAssetFactory on Robinhood Chain Mainnet (Chain 4663)
  const factory = new ethers.Contract(factoryAddress, artifacts.dAssetFactory.abi, signer);
  const hyperevmId = ethers.keccak256(ethers.toUtf8Bytes(hyperevmAddress));
  const amountWei = ethers.parseUnits(amount.toString(), 18);

  console.log(`Executing factory.deployAndMint on Robinhood Chain for ${symbol}...`);
  const tx = await factory.deployAndMint(
    name,
    symbol,
    underlying,
    Math.abs(leverage),
    isShort,
    hyperevmId,
    amountWei
  );

  const receipt = await tx.wait();
  
  // Retrieve token address from factory registry
  const assetInfo = await factory.getAsset(symbol);
  const tokenAddress = assetInfo.tokenAddress;

  if (tokenAddress) {
    try {
      await eth.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: symbol,
            decimals: 18,
          },
        },
      });
    } catch (e) {
      console.warn('User dismissed wallet_watchAsset prompt');
    }
  }

  return {
    txHash: receipt.hash,
    tokenAddress
  };
}

export async function addTokenToWallet(
  tokenAddress: string,
  symbol: string,
  decimals: number = 18
): Promise<boolean> {
  const eth = (window as any).ethereum;
  if (!eth) return false;
  try {
    return await eth.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: tokenAddress,
          symbol,
          decimals,
        },
      },
    });
  } catch (err) {
    console.warn('Error adding token to wallet:', err);
    return false;
  }
}
