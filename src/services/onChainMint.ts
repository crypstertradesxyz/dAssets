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

  const provider = new ethers.BrowserProvider(eth);
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();

  const factoryAddress = deployedConfig?.factory;
  if (!factoryAddress || factoryAddress === '0x0000000000000000000000000000000000000000') {
    // If factory is not yet deployed on this specific chain, we deploy the token directly from the user's wallet!
    console.log('Factory address not pre-configured. Deploying dAssetToken directly via user wallet...');
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
      userAddress, // user acts as factory/owner for direct mint
      userAddress,
      hyperevmId
    );

    const txReceipt = await token.deploymentTransaction()?.wait();
    const tokenAddress = await token.getAddress();

    // Now mint tokens to the user
    const amountWei = ethers.parseUnits(amount.toString(), 18);
    const mintTx = await (token as any).mint(userAddress, amountWei);
    await mintTx.wait();

    // Prompt user to add the token to their wallet
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

  // If Factory is deployed on-chain:
  const factory = new ethers.Contract(factoryAddress, artifacts.dAssetFactory.abi, signer);
  const hyperevmId = ethers.keccak256(ethers.toUtf8Bytes(hyperevmAddress));
  const amountWei = ethers.parseUnits(amount.toString(), 18);

  console.log(`Calling factory.deployAndMint for ${symbol}...`);
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
  
  // Get deployed token address
  const assetInfo = await factory.getAsset(symbol);
  const tokenAddress = assetInfo.tokenAddress;

  // Prompt user to track in MetaMask
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
