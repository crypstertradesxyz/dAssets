import { ethers } from 'ethers';
import artifacts from '../contracts/artifacts.json';
import deployedConfig from '../contracts/deployedAddresses.json';
import { Web3Service } from './web3';
import { waitForReceiptFast } from '../utils/txUtils';

export async function mintGenuineOnChain(
  symbol: string,
  name: string,
  underlying: string,
  leverage: number,
  isShort: boolean,
  hyperevmAddress: string,
  amount: number
): Promise<{ txHash: string; tokenAddress?: string }> {
  const web3 = Web3Service.getInstance();
  const eth = web3.getActiveProvider();
  if (!eth) {
    throw new Error('NO_WALLET');
  }

  // 1. Ensure wallet is switched to Robinhood Chain Mainnet (Chain ID: 4663 / 0x1237)
  try {
    const chainIdHex = await eth.request({ method: 'eth_chainId' });
    if (parseInt(chainIdHex, 16) !== 4663) {
      const switched = await web3.switchNetwork(eth);
      if (!switched) {
        throw new Error('NETWORK_SWITCH_FAILED');
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
  const iface = new ethers.Interface(artifacts.dAssetFactory.abi);
  const hyperevmId = ethers.keccak256(ethers.toUtf8Bytes(hyperevmAddress));
  const amountWei = ethers.parseUnits(amount.toString(), 18);
  const data = iface.encodeFunctionData('deployAndMint', [
    name,
    symbol,
    underlying,
    Math.round(Math.abs(leverage)),
    Boolean(isShort),
    hyperevmId,
    amountWei
  ]);

  console.log(`Executing factory.deployAndMint on Robinhood Chain for ${symbol}...`);

  let txHash: string;
  try {
    // Send without enforcing a client-side nonce so Rabby / MetaMask manages their internal queue
    txHash = await eth.request({
      method: 'eth_sendTransaction',
      params: [{
        from: userAddress,
        to: factoryAddress,
        data,
        value: '0x0',
      }],
    });
  } catch (err: any) {
    if (err?.message?.toLowerCase().includes('nonce') || err?.data?.message?.toLowerCase().includes('nonce')) {
      throw new Error('INVALID_NONCE');
    }
    throw err;
  }

  const receipt = await waitForReceiptFast(txHash, provider);
  
  // Retrieve token address from factory registry
  let tokenAddress: string | undefined;
  try {
    const factory = new ethers.Contract(factoryAddress, artifacts.dAssetFactory.abi, provider);
    const assetInfo = await factory.getAsset(symbol);
    if (assetInfo && assetInfo.tokenAddress && assetInfo.tokenAddress !== ethers.ZeroAddress) {
      tokenAddress = assetInfo.tokenAddress;
    }
  } catch (readErr) {
    console.warn('Could not read asset token address from provider factory registry:', readErr);
  }

  // If not yet available on BrowserProvider, query public RPC provider
  if (!tokenAddress) {
    try {
      const publicRpc = new ethers.JsonRpcProvider('https://rpc.mainnet.chain.robinhood.com');
      const factory = new ethers.Contract(factoryAddress, artifacts.dAssetFactory.abi, publicRpc);
      const assetInfo = await factory.getAsset(symbol);
      if (assetInfo && assetInfo.tokenAddress && assetInfo.tokenAddress !== ethers.ZeroAddress) {
        tokenAddress = assetInfo.tokenAddress;
      }
    } catch (rpcErr) {
      console.warn('Could not read asset token address from public RPC factory registry:', rpcErr);
    }
  }

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
    txHash: receipt?.hash || txHash,
    tokenAddress
  };
}

export async function addTokenToWallet(
  tokenAddress: string,
  symbol: string,
  decimals: number = 18
): Promise<boolean> {
  const eth = Web3Service.getInstance().getActiveProvider();
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
