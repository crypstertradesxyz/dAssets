import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';

const ROBINHOOD_HYPERLANE_MAILBOX = '0x3a867fCfFeC2B790970eeBDC9023E75B0a172aa7';

async function main() {
  const artifactsPath = path.resolve('src/contracts/artifacts.json');
  if (!fs.existsSync(artifactsPath)) {
    console.error('Artifacts not found. Run "node scripts/compile.js" first.');
    process.exit(1);
  }

  const artifacts = JSON.parse(fs.readFileSync(artifactsPath, 'utf8'));

  const rpcUrl = process.env.RPC_URL || 'https://rpc.mainnet.chain.robinhood.com';
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    console.error('ERROR: PRIVATE_KEY environment variable is required.');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`========================================`);
  console.log(`Deploying to Robinhood Chain Mainnet`);
  console.log(`Deployer Address: ${wallet.address}`);
  
  const balance = await provider.getBalance(wallet.address);
  console.log(`Deployer Balance: ${ethers.formatEther(balance)} ETH`);
  
  const network = await provider.getNetwork();
  console.log(`Chain ID: ${Number(network.chainId)}`);
  console.log(`========================================\n`);

  if (balance === 0n) {
    console.error('ERROR: Deployer account has 0 gas balance.');
    process.exit(1);
  }

  // 1. Deploy MockRobinhoodOracle
  console.log('1. Deploying MockRobinhoodOracle...');
  const OracleFactory = new ethers.ContractFactory(
    artifacts.MockRobinhoodOracle.abi,
    artifacts.MockRobinhoodOracle.bytecode,
    wallet
  );
  const oracle = await OracleFactory.deploy();
  console.log(`   Transaction broadcast: ${oracle.deploymentTransaction().hash}`);
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log(`✓ Oracle Deployed at: ${oracleAddress}`);
  console.log(`   Explorer: https://robinhoodchain.blockscout.com/address/${oracleAddress}\n`);

  // 2. Deploy dAssetFactory
  console.log('2. Deploying dAssetFactory...');
  const FactoryFactory = new ethers.ContractFactory(
    artifacts.dAssetFactory.abi,
    artifacts.dAssetFactory.bytecode,
    wallet
  );
  const factory = await FactoryFactory.deploy(
    oracleAddress,
    ROBINHOOD_HYPERLANE_MAILBOX,
    ethers.ZeroAddress
  );
  console.log(`   Transaction broadcast: ${factory.deploymentTransaction().hash}`);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log(`✓ dAssetFactory Deployed at: ${factoryAddress}`);
  console.log(`   Explorer: https://robinhoodchain.blockscout.com/address/${factoryAddress}\n`);

  // 3. Pre-deploy Flagship dAsset: dBTC3L on-chain
  console.log('3. Pre-deploying Flagship Token: dBTC3L on-chain...');
  const hyperevmSourceId = ethers.keccak256(ethers.toUtf8Bytes('hyperevm-dbtc3l'));
  const deployTokenTx = await factory.deployAsset(
    'Bitcoin 3x Long',
    'dBTC3L',
    'BTC',
    3,
    false,
    hyperevmSourceId
  );
  await deployTokenTx.wait();
  const btcAssetInfo = await factory.getAsset('dBTC3L');
  console.log(`✓ dBTC3L Token Contract Deployed at: ${btcAssetInfo.tokenAddress}`);
  console.log(`   Explorer: https://robinhoodchain.blockscout.com/address/${btcAssetInfo.tokenAddress}\n`);

  // Save deployed addresses
  const deployed = {
    network: 'Robinhood Chain Mainnet',
    chainId: Number(network.chainId),
    oracle: oracleAddress,
    hyperlaneMailbox: ROBINHOOD_HYPERLANE_MAILBOX,
    factory: factoryAddress,
    flagshipToken: {
      symbol: 'dBTC3L',
      address: btcAssetInfo.tokenAddress
    },
    deployer: wallet.address,
    deployedAt: new Date().toISOString()
  };

  const outPath = path.resolve('src/contracts/deployedAddresses.json');
  fs.writeFileSync(outPath, JSON.stringify(deployed, null, 2));
  console.log(`Deployment summary saved to: ${outPath}`);
  console.log(`========================================`);
  console.log(`🎉 ALL CONTRACTS SUCCESSFULLY DEPLOYED TO ROBINHOOD CHAIN MAINNET!`);
  console.log(`========================================`);
}

main().catch((err) => {
  console.error('Deployment Failed:', err);
  process.exit(1);
});
