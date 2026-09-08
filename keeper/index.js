import http from 'http';
import { ethers } from 'ethers';

// Configuration from environment variables
const RPC_URL = process.env.RPC_URL || 'https://rpc.mainnet.chain.robinhood.com';
const CHAIN_ID = 4663;
const ORACLE_ADDRESS = process.env.ORACLE_ADDRESS || '0x0c19e8DE99BA135aBdc059b34e0d3F9E5e021fd0';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PORT = process.env.PORT || 8080;

// Update thresholds
const DEVIATION_THRESHOLD_PCT = parseFloat(process.env.DEVIATION_THRESHOLD_PCT || '0.25'); // 0.25% move triggers update
const HEARTBEAT_INTERVAL_MS = parseInt(process.env.HEARTBEAT_INTERVAL_MS || '300000', 10); // 5 mins max between updates
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '20000', 10); // Check market every 20s

// Oracle ABI
const ORACLE_ABI = [
  'function admin() view returns (address)',
  'function authorizedFeeders(address) view returns (bool)',
  'function prices(string) view returns (uint256 navPrice, uint256 indexPrice, int256 fundingRate24h, uint256 lastRebalance, uint256 updatedAt)',
  'function setPrice(string calldata symbol, uint256 navPrice, uint256 indexPrice, int256 fundingRate24h) external',
  'function getPrice(string calldata symbol) external view returns (uint256, uint256, uint256)',
  'event PriceUpdated(string indexed symbol, uint256 navPrice, uint256 indexPrice, uint256 timestamp)',
  'event RebalanceReported(string indexed symbol, uint256 newNav, uint256 timestamp)',
];

// Supported Asset Specifications
const ASSETS_CONFIG = [
  {
    symbol: 'dBTC3L',
    name: 'Bitcoin 3x Long',
    underlying: 'BTC',
    leverage: 3,
    isShort: false,
    baseNav: 1.00,
  },
  {
    symbol: 'dBTC3S',
    name: 'Bitcoin 3x Short',
    underlying: 'BTC',
    leverage: -3,
    isShort: true,
    baseNav: 1.00,
  },
  {
    symbol: 'dETH3L',
    name: 'Ethereum 3x Long',
    underlying: 'ETH',
    leverage: 3,
    isShort: false,
    baseNav: 1.00,
  },
  {
    symbol: 'dSOL3L',
    name: 'Solana 3x Long',
    underlying: 'SOL',
    leverage: 3,
    isShort: false,
    baseNav: 1.00,
  }
];

// In-memory tracker state
const state = {
  startedAt: Date.now(),
  lastPollAt: null,
  totalUpdates: 0,
  lastTxHash: null,
  walletAddress: null,
  ethBalance: '0.00',
  assetStates: {},
  recentLogs: [],
};

function addLog(type, message, extra = {}) {
  const time = new Date();
  const entry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: time.toISOString(),
    timeFormatted: time.toLocaleTimeString('en-US', { hour12: false }),
    type, // 'CONFIRMED' | 'BROADCAST' | 'STABLE' | 'REBALANCE' | 'INFO' | 'ERROR'
    message,
    ...extra,
  };
  state.recentLogs.unshift(entry);
  if (state.recentLogs.length > 50) state.recentLogs.pop();
  return entry;
}

// Initialize asset state tracking
for (const config of ASSETS_CONFIG) {
  state.assetStates[config.symbol] = {
    ...config,
    referencePrice: null, // P_0 set at 00:00 UTC rebalance
    currentSpotPrice: null,
    currentNav: config.baseNav,
    lastOnChainNav: null,
    lastOnChainSpot: null,
    lastOnChainUpdate: null,
    lastRebalanceTimestamp: null,
    effectiveLeverage: config.leverage,
  };
}

/**
 * Fetch genuine market spot prices from public crypto exchange feeds
 */
async function fetchSpotPrice(underlying) {
  const pair = `${underlying}USDT`;
  
  // 1. Primary: Binance API
  try {
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`);
    if (res.ok) {
      const data = await res.json();
      const price = parseFloat(data.price);
      if (!isNaN(price) && price > 0) return price;
    }
  } catch (e) {
    // Fallback to Coinbase
  }

  // 2. Secondary Fallback: Coinbase API
  try {
    const res = await fetch(`https://api.coinbase.com/v2/prices/${underlying}-USD/spot`);
    if (res.ok) {
      const data = await res.json();
      const price = parseFloat(data.data?.amount);
      if (!isNaN(price) && price > 0) return price;
    }
  } catch (e) {
    // Fallback to Pyth Hermes
  }

  // 3. Tertiary Fallback: Pyth Network Hermes
  try {
    const pythIds = {
      BTC: 'e62df6e071018274a706e9389e13b41d45903b92484b39678129214b3017a55f',
      ETH: 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
      SOL: 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
    };
    const feedId = pythIds[underlying];
    if (feedId) {
      const res = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}`);
      if (res.ok) {
        const data = await res.json();
        const parsed = data.parsed?.[0]?.price;
        if (parsed) {
          const price = parseFloat(parsed.price) * Math.pow(10, parsed.expo);
          if (!isNaN(price) && price > 0) return price;
        }
      }
    }
  } catch (e) {
    console.error(`Failed to fetch price for ${underlying} from all sources:`, e.message);
  }

  return null;
}

/**
 * Calculate dynamic Leveraged NAV based on target leverage
 */
function calculateLeveragedNav(assetState, currentSpot) {
  if (!assetState.referencePrice || assetState.referencePrice <= 0) {
    assetState.referencePrice = currentSpot;
  }

  const priceDeltaRatio = (currentSpot - assetState.referencePrice) / assetState.referencePrice;
  const leveragedReturn = assetState.leverage * priceDeltaRatio;

  // Base NAV scaled by continuous leveraged return
  const calculatedNav = Math.max(0.01, assetState.baseNav * (1 + leveragedReturn));
  
  // Calculate current effective leverage drift:
  // As asset price increases, long position effective leverage decreases unless rebalanced
  const effectiveLev = assetState.leverage * (currentSpot / assetState.referencePrice) / (calculatedNav / assetState.baseNav);

  return {
    nav: Number(calculatedNav.toFixed(4)),
    effectiveLeverage: Number(effectiveLev.toFixed(2)),
  };
}

/**
 * Check if daily 00:00 UTC rebalance or intraday circuit breaker should trigger
 */
function checkRebalanceCondition(assetState, currentSpot) {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();

  // Daily rebalance window: 00:00 - 00:05 UTC once per day
  const isMidnightUtc = currentHour === 0 && currentMinute < 5;
  const alreadyRebalancedToday = assetState.lastRebalanceTimestamp && 
    (Date.now() - assetState.lastRebalanceTimestamp < 3600000 * 20);

  if (isMidnightUtc && !alreadyRebalancedToday) {
    return { shouldRebalance: true, reason: 'Daily Scheduled 00:00 UTC Reset' };
  }

  // Intraday Circuit Breaker: If price moved > 15% from reference price
  const priceMovePct = Math.abs((currentSpot - assetState.referencePrice) / assetState.referencePrice) * 100;
  if (priceMovePct >= 15.0) {
    return { shouldRebalance: true, reason: `Intraday Volatility Circuit Breaker (${priceMovePct.toFixed(1)}% move)` };
  }

  return { shouldRebalance: false };
}

/**
 * Core Keeper Update Loop
 */
async function runKeeperIteration(oracleContract, signer) {
  state.lastPollAt = Date.now();

  // Update wallet gas balance
  try {
    const bal = await signer.provider.getBalance(signer.address);
    state.ethBalance = ethers.formatEther(bal);
  } catch (e) {}

  for (const symbol of Object.keys(state.assetStates)) {
    const assetState = state.assetStates[symbol];
    const spot = await fetchSpotPrice(assetState.underlying);
    if (!spot) continue;

    assetState.currentSpotPrice = spot;

    // First run initialization: read on-chain contract state
    if (assetState.lastOnChainNav === null) {
      try {
        const onChainData = await oracleContract.prices(symbol);
        const onChainNav = parseFloat(ethers.formatUnits(onChainData.navPrice, 18));
        const onChainSpot = parseFloat(ethers.formatUnits(onChainData.indexPrice, 18));
        const onChainUpdated = Number(onChainData.updatedAt) * 1000;

        if (onChainNav > 0) {
          assetState.lastOnChainNav = onChainNav;
          assetState.lastOnChainSpot = onChainSpot;
          assetState.lastOnChainUpdate = onChainUpdated;
          assetState.baseNav = onChainNav;
          assetState.referencePrice = onChainSpot > 0 ? onChainSpot : spot;
          console.log(`[INIT] ${symbol} loaded from Robinhood Chain: NAV=$${onChainNav.toFixed(4)}, Spot=$${onChainSpot.toLocaleString()}`);
        } else {
          assetState.referencePrice = spot;
        }
      } catch (err) {
        console.warn(`[WARN] Could not read on-chain price for ${symbol}:`, err.message);
        assetState.referencePrice = spot;
      }
    }

    // Check rebalance
    const rebalCheck = checkRebalanceCondition(assetState, spot);
    if (rebalCheck.shouldRebalance) {
      console.log(`[REBALANCE] Triggering ${symbol} rebalance: ${rebalCheck.reason}`);
      addLog('REBALANCE', `Triggered ${symbol} rebalance: ${rebalCheck.reason}`, { symbol, nav, spot });
      assetState.baseNav = assetState.currentNav;
      assetState.referencePrice = spot;
      assetState.lastRebalanceTimestamp = Date.now();
    }

    // Compute dynamic NAV
    const { nav, effectiveLeverage } = calculateLeveragedNav(assetState, spot);
    assetState.currentNav = nav;
    assetState.effectiveLeverage = effectiveLeverage;

    // Check whether to broadcast on-chain
    const lastNav = assetState.lastOnChainNav || 0;
    const navDiffPct = lastNav > 0 ? Math.abs((nav - lastNav) / lastNav) * 100 : 100;
    const timeSinceLastUpdate = assetState.lastOnChainUpdate ? (Date.now() - assetState.lastOnChainUpdate) : Infinity;

    const shouldBroadcast = navDiffPct >= DEVIATION_THRESHOLD_PCT || timeSinceLastUpdate >= HEARTBEAT_INTERVAL_MS;

    if (shouldBroadcast) {
      console.log(`[KEEPER] Pushing ${symbol} to Robinhood Chain: NAV=$${nav.toFixed(4)} (diff ${navDiffPct.toFixed(2)}%), Spot=$${spot.toLocaleString()}...`);
      addLog('BROADCAST', `Pushing ${symbol} on-chain: NAV=$${nav.toFixed(4)}, Spot=$${spot.toLocaleString()}`, { symbol, nav, spot, diffPct: navDiffPct.toFixed(2) });

      try {
        const navWei = ethers.parseUnits(nav.toFixed(4), 18);
        const spotWei = ethers.parseUnits(spot.toFixed(2), 18);
        const fundingRateBasisPoints = 12n; // 0.012% funding rate

        const tx = await oracleContract.setPrice(symbol, navWei, spotWei, fundingRateBasisPoints);
        console.log(`  Tx broadcast: ${tx.hash}`);
        const receipt = await tx.wait();

        assetState.lastOnChainNav = nav;
        assetState.lastOnChainSpot = spot;
        assetState.lastOnChainUpdate = Date.now();
        state.totalUpdates++;
        state.lastTxHash = receipt.hash;

        console.log(`✓ ${symbol} Confirmed in Block #${receipt.blockNumber}! Gas used: ${receipt.gasUsed.toString()}`);
        console.log(`  Explorer: https://robinhoodchain.blockscout.com/tx/${receipt.hash}\n`);

        addLog('CONFIRMED', `Confirmed ${symbol} in Block #${receipt.blockNumber}`, {
          symbol,
          nav,
          spot,
          blockNumber: Number(receipt.blockNumber),
          txHash: receipt.hash,
          gasUsed: receipt.gasUsed.toString(),
        });
      } catch (txErr) {
        console.error(`[ERROR] Failed to update ${symbol} on-chain:`, txErr.message);
        addLog('ERROR', `Failed to update ${symbol}: ${txErr.message}`, { symbol });
      }
    } else {
      console.log(`[STABLE] ${symbol}: NAV=$${nav.toFixed(4)}, Spot=$${spot.toLocaleString()} (diff: ${navDiffPct.toFixed(3)}%, heartbeat in ${Math.round((HEARTBEAT_INTERVAL_MS - timeSinceLastUpdate) / 1000)}s)`);
      if (Math.random() < 0.1) {
        addLog('STABLE', `${symbol}: NAV=$${nav.toFixed(4)}, Spot=$${spot.toLocaleString()}`, { symbol, nav, spot });
      }
    }
  }
}

/**
 * Start Server & Keeper Process
 */
async function main() {
  console.log(`=======================================================`);
  console.log(`🚀 dAssets Autonomous Keeper & Rebalancer Service`);
  console.log(`   Network: Robinhood Chain Mainnet (Chain ID: ${CHAIN_ID})`);
  console.log(`   RPC: ${RPC_URL}`);
  console.log(`   Oracle: ${ORACLE_ADDRESS}`);
  console.log(`=======================================================`);

  // Setup Provider & Signer
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  if (!PRIVATE_KEY) {
    console.warn(`[WARNING] No PRIVATE_KEY environment variable provided.`);
    console.warn(`Keeper running in MONITOR / READ-ONLY mode. Provide PRIVATE_KEY on Railway to enable on-chain writes.\n`);
  }

  const wallet = PRIVATE_KEY ? new ethers.Wallet(PRIVATE_KEY, provider) : ethers.Wallet.createRandom().connect(provider);
  state.walletAddress = wallet.address;

  try {
    const bal = await provider.getBalance(wallet.address);
    state.ethBalance = ethers.formatEther(bal);
    console.log(`Feeder Address: ${wallet.address}`);
    console.log(`Gas Balance:    ${state.ethBalance} ETH`);
  } catch (err) {
    console.warn('Could not query wallet balance:', err.message);
  }

  const oracleContract = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, wallet);

  // Check if feeder is authorized on the oracle contract
  try {
    const isAuthorized = await oracleContract.authorizedFeeders(wallet.address);
    const admin = await oracleContract.admin();
    console.log(`Oracle Admin:   ${admin}`);
    console.log(`Feeder Authorized: ${isAuthorized}`);
    if (!isAuthorized && wallet.address.toLowerCase() !== admin.toLowerCase()) {
      console.warn(`[ATTENTION] Feeder wallet ${wallet.address} is not yet authorized on Oracle! Updates may revert.`);
    }
  } catch (e) {
    console.warn('Could not verify authorized feeder status:', e.message);
  }

  // Start HTTP Health-Check Server (Essential for Railway deployment)
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === '/health' || req.url === '/' || req.url === '/logs') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'ok',
        service: 'dAssets-Autonomous-Keeper',
        network: 'Robinhood Chain Mainnet',
        chainId: CHAIN_ID,
        feeder: state.walletAddress,
        ethBalance: state.ethBalance,
        totalUpdates: state.totalUpdates,
        lastTxHash: state.lastTxHash,
        uptimeSeconds: Math.floor((Date.now() - state.startedAt) / 1000),
        assets: state.assetStates,
        recentLogs: state.recentLogs,
      }, null, 2));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  });

  server.listen(PORT, () => {
    console.log(`✓ Health-check server listening on port ${PORT}`);
    console.log(`Starting autonomous rebalance & price feed loop (interval: ${POLL_INTERVAL_MS / 1000}s)...\n`);
  });

  // Initial run
  if (PRIVATE_KEY) {
    await runKeeperIteration(oracleContract, wallet);
  }

  // Continuous polling loop
  setInterval(async () => {
    if (PRIVATE_KEY) {
      await runKeeperIteration(oracleContract, wallet);
    }
  }, POLL_INTERVAL_MS);
}

main().catch(err => {
  console.error('Fatal Keeper Error:', err);
  process.exit(1);
});
