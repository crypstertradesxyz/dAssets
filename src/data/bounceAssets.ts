import { LeveragedAsset, AssetCategory } from '../types';

interface BaseAssetConfig {
  underlying: string;
  name: string;
  category: AssetCategory;
  spotPrice: number;
  iconColor: string;
  leverages: number[]; // e.g. [2, 3, -1, -2, -3]
}

const baseAssets: BaseAssetConfig[] = [
  // Majors
  { underlying: 'BTC', name: 'Bitcoin', category: 'majors', spotPrice: 94250.00, iconColor: '#F7931A', leverages: [2, 3, 5, -1, -2, -3] },
  { underlying: 'ETH', name: 'Ethereum', category: 'majors', spotPrice: 3420.50, iconColor: '#627EEA', leverages: [2, 3, 5, -1, -2, -3] },
  { underlying: 'SOL', name: 'Solana', category: 'majors', spotPrice: 215.80, iconColor: '#14F195', leverages: [2, 3, 5, -1, -2, -3] },
  { underlying: 'HYPE', name: 'Hyperliquid', category: 'majors', spotPrice: 28.60, iconColor: '#00F0FF', leverages: [2, 3, 5, -1, -2, -3] },

  // Layer 1 / Layer 2
  { underlying: 'SUI', name: 'Sui Network', category: 'layer1', spotPrice: 3.85, iconColor: '#4CA2FE', leverages: [2, 3, -1, -2] },
  { underlying: 'AVAX', name: 'Avalanche', category: 'layer1', spotPrice: 38.40, iconColor: '#E84142', leverages: [2, 3, -1, -2] },
  { underlying: 'NEAR', name: 'NEAR Protocol', category: 'layer1', spotPrice: 6.90, iconColor: '#00E599', leverages: [2, 3, -1, -2] },
  { underlying: 'TIA', name: 'Celestia', category: 'layer1', spotPrice: 8.40, iconColor: '#7B2BF9', leverages: [2, 3, -1, -2] },
  { underlying: 'INJ', name: 'Injective', category: 'layer1', spotPrice: 24.10, iconColor: '#00A3FF', leverages: [2, 3, -1, -2] },
  { underlying: 'SEI', name: 'Sei Network', category: 'layer1', spotPrice: 0.54, iconColor: '#9B1C2E', leverages: [2, 3, -1, -2] },
  { underlying: 'APT', name: 'Aptos', category: 'layer1', spotPrice: 11.20, iconColor: '#2DD8A7', leverages: [2, 3, -1, -2] },
  { underlying: 'ARB', name: 'Arbitrum', category: 'layer1', spotPrice: 0.98, iconColor: '#28A0F0', leverages: [2, 3, -1, -2] },
  { underlying: 'OP', name: 'Optimism', category: 'layer1', spotPrice: 2.15, iconColor: '#FF0420', leverages: [2, 3, -1, -2] },
  { underlying: 'TON', name: 'Toncoin', category: 'layer1', spotPrice: 6.45, iconColor: '#0098EA', leverages: [2, 3, -1, -2] },
  { underlying: 'FTM', name: 'Sonic (Fantom)', category: 'layer1', spotPrice: 0.88, iconColor: '#1969FF', leverages: [2, 3, -1, -2] },
  { underlying: 'ADA', name: 'Cardano', category: 'layer1', spotPrice: 0.82, iconColor: '#0033AD', leverages: [2, 3, -1, -2] },
  { underlying: 'DOT', name: 'Polkadot', category: 'layer1', spotPrice: 8.10, iconColor: '#E6007A', leverages: [2, 3, -1, -2] },
  { underlying: 'ATOM', name: 'Cosmos Hub', category: 'layer1', spotPrice: 7.20, iconColor: '#2E3148', leverages: [2, 3, -1, -2] },
  { underlying: 'KAS', name: 'Kaspa', category: 'layer1', spotPrice: 0.165, iconColor: '#70C7BA', leverages: [2, 3, -1, -2] },
  { underlying: 'RON', name: 'Ronin', category: 'layer1', spotPrice: 2.30, iconColor: '#1273EA', leverages: [2, 3, -1, -2] },
  { underlying: 'STRK', name: 'Starknet', category: 'layer1', spotPrice: 0.62, iconColor: '#EC796B', leverages: [2, 3, -1, -2] },
  { underlying: 'BLAST', name: 'Blast', category: 'layer1', spotPrice: 0.014, iconColor: '#FCFC03', leverages: [2, 3, -1, -2] },
  { underlying: 'TAIKO', name: 'Taiko', category: 'layer1', spotPrice: 2.10, iconColor: '#E81899', leverages: [2, 3, -1, -2] },

  // AI & Compute
  { underlying: 'TAO', name: 'Bittensor', category: 'ai', spotPrice: 540.00, iconColor: '#2D3748', leverages: [2, 3, 5, -1, -2, -3] },
  { underlying: 'RENDER', name: 'Render Network', category: 'ai', spotPrice: 8.90, iconColor: '#E53E3E', leverages: [2, 3, -1, -2] },
  { underlying: 'FET', name: 'Artificial Superintelligence', category: 'ai', spotPrice: 1.65, iconColor: '#1A365D', leverages: [2, 3, -1, -2] },
  { underlying: 'IO', name: 'io.net', category: 'ai', spotPrice: 3.20, iconColor: '#805AD5', leverages: [2, 3, -1, -2] },
  { underlying: 'WLD', name: 'Worldcoin', category: 'ai', spotPrice: 2.80, iconColor: '#10B981', leverages: [2, 3, -1, -2] },
  { underlying: 'AKT', name: 'Akash Network', category: 'ai', spotPrice: 4.10, iconColor: '#E53E3E', leverages: [2, 3, -1, -2] },
  { underlying: 'AR', name: 'Arweave', category: 'ai', spotPrice: 19.50, iconColor: '#2B6CB0', leverages: [2, 3, -1, -2] },
  { underlying: 'GRT', name: 'The Graph', category: 'ai', spotPrice: 0.28, iconColor: '#6B46C1', leverages: [2, 3, -1, -2] },
  { underlying: 'ATH', name: 'Aethir', category: 'ai', spotPrice: 0.075, iconColor: '#319795', leverages: [2, 3, -1, -2] },

  // DeFi
  { underlying: 'AAVE', name: 'Aave', category: 'defi', spotPrice: 210.40, iconColor: '#B6509E', leverages: [2, 3, -1, -2] },
  { underlying: 'UNI', name: 'Uniswap', category: 'defi', spotPrice: 12.80, iconColor: '#FF007A', leverages: [2, 3, -1, -2] },
  { underlying: 'MKR', name: 'Maker', category: 'defi', spotPrice: 1850.00, iconColor: '#1AAB9B', leverages: [2, 3, -1, -2] },
  { underlying: 'PENDLE', name: 'Pendle Finance', category: 'defi', spotPrice: 5.60, iconColor: '#2563EB', leverages: [2, 3, 5, -1, -2] },
  { underlying: 'ENA', name: 'Ethena', category: 'defi', spotPrice: 0.78, iconColor: '#4B5563', leverages: [2, 3, -1, -2] },
  { underlying: 'JUP', name: 'Jupiter', category: 'defi', spotPrice: 1.15, iconColor: '#38BDF8', leverages: [2, 3, -1, -2] },
  { underlying: 'RAY', name: 'Raydium', category: 'defi', spotPrice: 5.20, iconColor: '#22C55E', leverages: [2, 3, -1, -2] },
  { underlying: 'ONDO', name: 'Ondo Finance', category: 'defi', spotPrice: 1.35, iconColor: '#3B82F6', leverages: [2, 3, -1, -2] },
  { underlying: 'CRV', name: 'Curve DAO', category: 'defi', spotPrice: 0.45, iconColor: '#DC2626', leverages: [2, 3, -1, -2] },
  { underlying: 'LDO', name: 'Lido DAO', category: 'defi', spotPrice: 1.60, iconColor: '#00A3FF', leverages: [2, 3, -1, -2] },
  { underlying: 'DYDX', name: 'dYdX', category: 'defi', spotPrice: 1.45, iconColor: '#6966FF', leverages: [2, 3, -1, -2] },
  { underlying: 'GMX', name: 'GMX', category: 'defi', spotPrice: 32.00, iconColor: '#3052FF', leverages: [2, 3, -1, -2] },
  { underlying: 'DRIFT', name: 'Drift Protocol', category: 'defi', spotPrice: 1.85, iconColor: '#E11D48', leverages: [2, 3, -1, -2] },
  { underlying: 'LINK', name: 'Chainlink', category: 'defi', spotPrice: 18.50, iconColor: '#375BD2', leverages: [2, 3, 5, -1, -2, -3] },
  { underlying: 'PYTH', name: 'Pyth Network', category: 'defi', spotPrice: 0.48, iconColor: '#9333EA', leverages: [2, 3, -1, -2] },

  // Memes
  { underlying: 'DOGE', name: 'Dogecoin', category: 'meme', spotPrice: 0.38, iconColor: '#C2A633', leverages: [2, 3, 5, -1, -2, -3] },
  { underlying: 'SHIB', name: 'Shiba Inu', category: 'meme', spotPrice: 0.000028, iconColor: '#FFA409', leverages: [2, 3, -1, -2] },
  { underlying: 'PEPE', name: 'Pepe', category: 'meme', spotPrice: 0.000021, iconColor: '#439244', leverages: [2, 3, 5, -1, -2, -3] },
  { underlying: 'WIF', name: 'dogwifhat', category: 'meme', spotPrice: 3.40, iconColor: '#EAB308', leverages: [2, 3, 5, -1, -2, -3] },
  { underlying: 'BONK', name: 'Bonk', category: 'meme', spotPrice: 0.000042, iconColor: '#F97316', leverages: [2, 3, -1, -2] },
  { underlying: 'FLOKI', name: 'Floki', category: 'meme', spotPrice: 0.00024, iconColor: '#FBBF24', leverages: [2, 3, -1, -2] },
  { underlying: 'POPCAT', name: 'Popcat', category: 'meme', spotPrice: 1.55, iconColor: '#F43F5E', leverages: [2, 3, -1, -2] },
  { underlying: 'MEW', name: 'cat in a dogs world', category: 'meme', spotPrice: 0.011, iconColor: '#EC4899', leverages: [2, 3, -1, -2] },
  { underlying: 'BRETT', name: 'Brett (Base)', category: 'meme', spotPrice: 0.165, iconColor: '#3B82F6', leverages: [2, 3, -1, -2] },
  { underlying: 'PNUT', name: 'Peanut the Squirrel', category: 'meme', spotPrice: 1.28, iconColor: '#D97706', leverages: [2, 3, 5, -1, -2] },
  { underlying: 'MOODENG', name: 'Moo Deng', category: 'meme', spotPrice: 0.45, iconColor: '#8B5CF6', leverages: [2, 3, -1, -2] },
  { underlying: 'GOAT', name: 'Goatseus Maximus', category: 'meme', spotPrice: 0.85, iconColor: '#10B981', leverages: [2, 3, 5, -1, -2] },
  { underlying: 'SPX', name: 'SPX6900', category: 'meme', spotPrice: 0.72, iconColor: '#EF4444', leverages: [2, 3, -1, -2] },
  { underlying: 'FARTCOIN', name: 'Fartcoin', category: 'meme', spotPrice: 0.95, iconColor: '#A855F7', leverages: [2, 3, 5, -1, -2] },
];

function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x${hex}47d${hex}9c2b${hex}3e1a`.padEnd(42, '0');
}

export const INITIAL_ASSETS: LeveragedAsset[] = [];

baseAssets.forEach((asset) => {
  asset.leverages.forEach((lev) => {
    const isShort = lev < 0;
    const absLev = Math.abs(lev);
    const suffix = isShort ? `${absLev}S` : `${absLev}L`;
    const symbol = `d${asset.underlying}${suffix}`;
    const name = `${asset.name} ${absLev}x ${isShort ? 'Short' : 'Long'}`;

    // Standard base NAV for leveraged tokens on Bounce.tech is $1.00
    const baseNav = 1.00;
    // Generate deterministic pseudo-realistic 24h change & volume
    const seed = (asset.spotPrice * 13 + absLev * 7 + (isShort ? 31 : 17)) % 100;
    const change24h = ((seed - 48) / 10) * absLev;
    const volume24h = Math.round((120000 + (seed * 85000)) * (asset.category === 'majors' ? 6 : 1));
    const fundingRate = Number(((seed % 7) * 0.003 - 0.009).toFixed(4));
    const openInterest = Math.round(volume24h * 1.8);

    // Initial pre-minted status for key popular pairs so user sees active ecosystem immediately
    const isPreMinted = (asset.underlying === 'BTC' || asset.underlying === 'ETH' || asset.underlying === 'SOL' || asset.underlying === 'HYPE') && absLev === 3;
    let tokenAddress = isPreMinted ? generateHash(symbol) : undefined;
    if (symbol === 'dBTC3L') {
      tokenAddress = '0x5164E1dc1Be45a0Fbe4D6A25A4713225E9bb56F6';
    }
    const poolAddress = isPreMinted ? generateHash(`${symbol}-USDC-POOL`) : undefined;
    const poolLiquidity = isPreMinted ? Math.round(500000 + seed * 12000) : undefined;

    INITIAL_ASSETS.push({
      id: symbol.toLowerCase(),
      symbol,
      name,
      underlying: asset.underlying,
      underlyingName: asset.name,
      leverage: lev,
      isShort,
      category: asset.category,
      baseNav,
      currentNav: Number((baseNav * (1 + change24h / 100)).toFixed(2)),
      indexPrice: asset.spotPrice,
      change24h: Number(change24h.toFixed(2)),
      volume24h,
      fundingRate,
      openInterest,
      isMinted: isPreMinted,
      tokenAddress,
      poolAddress,
      poolLiquidity,
      hyperevmAddress: generateHash(`hyperevm-${symbol}`),
      iconColor: asset.iconColor,
    });
  });
});
