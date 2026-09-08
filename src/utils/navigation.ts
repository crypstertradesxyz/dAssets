import { AppView, LeveragedAsset } from '../types';

/**
 * Returns the canonical URL path for a given view and optional asset symbol.
 */
export function getUrlForView(view: AppView, assetSymbol?: string): string {
  switch (view) {
    case 'home':
      return '/';
    case 'trade':
      return assetSymbol ? `/trade/${assetSymbol}` : '/trade';
    case 'markets':
      return '/markets';
    case 'pools':
      return '/pools';
    case 'portfolio':
      return '/portfolio';
    case 'terminal':
      return assetSymbol ? `/terminal/${assetSymbol}` : '/terminal';
    case 'bridge':
      return '/bridge';
    case 'contracts':
      return '/contracts';
    default:
      return '/';
  }
}

/**
 * Parses the current browser pathname & search parameters to determine
 * the active view and optional selected asset.
 */
export function parseCurrentUrl(
  pathname: string,
  search: string,
  assets: LeveragedAsset[]
): { view: AppView; asset?: LeveragedAsset } {
  const cleanPath = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(search);
  const queryAsset = params.get('asset') || params.get('token') || params.get('symbol');

  // 0. Trade / Swap (e.g. /trade, /swap, /trade/dBTC3L)
  if (cleanPath.startsWith('/trade') || cleanPath.startsWith('/swap')) {
    const parts = cleanPath.split('/').filter(Boolean);
    const targetSymbolOrUnderlying = parts[1] || queryAsset;

    if (targetSymbolOrUnderlying && assets.length > 0) {
      const q = targetSymbolOrUnderlying.toLowerCase();
      let found = assets.find(a => a.symbol.toLowerCase() === q);
      if (!found) {
        found = assets.find(a => a.underlying.toLowerCase() === q && a.leverage === 3 && !a.isShort) ||
                assets.find(a => a.underlying.toLowerCase() === q);
      }
      if (found) {
        return { view: 'trade', asset: found };
      }
    }

    return { view: 'trade' };
  }

  // 1. Markets
  if (cleanPath === '/markets' || cleanPath === '/market') {
    return { view: 'markets' };
  }

  // 2. Pools
  if (cleanPath === '/pools' || cleanPath === '/pool' || cleanPath === '/liquidity') {
    return { view: 'pools' };
  }

  // 3. Portfolio
  if (cleanPath === '/portfolio' || cleanPath === '/holdings' || cleanPath === '/wallet' || cleanPath === '/positions') {
    return { view: 'portfolio' };
  }

  // 4. Bridge
  if (cleanPath === '/bridge' || cleanPath === '/hyperlane' || cleanPath === '/warp') {
    return { view: 'bridge' };
  }

  // 5. Contracts
  if (cleanPath === '/contracts' || cleanPath === '/contract' || cleanPath === '/addresses') {
    return { view: 'contracts' };
  }

  // 6. Terminal (e.g. /terminal, /terminal/dBTC3L, /terminal/btc, /terminal/sol5l)
  if (cleanPath.startsWith('/terminal') || cleanPath.startsWith('/oracle') || cleanPath.startsWith('/feed')) {
    const parts = cleanPath.split('/').filter(Boolean);
    // parts[0] is 'terminal', parts[1] might be 'dbtc3l' or 'btc'
    const targetSymbolOrUnderlying = parts[1] || queryAsset;

    if (targetSymbolOrUnderlying && assets.length > 0) {
      const q = targetSymbolOrUnderlying.toLowerCase();
      // Match by exact symbol (case-insensitive)
      let found = assets.find(a => a.symbol.toLowerCase() === q);
      // If not found, match by underlying (prefer 3x Long if available, else first token)
      if (!found) {
        found = assets.find(a => a.underlying.toLowerCase() === q && a.leverage === 3 && !a.isShort) ||
                assets.find(a => a.underlying.toLowerCase() === q);
      }
      if (found) {
        return { view: 'terminal', asset: found };
      }
    }

    return { view: 'terminal' };
  }

  // Fallback: Overview / Home
  return { view: 'home' };
}

/**
 * Updates document.title and meta properties for social share & browser tabs.
 */
export function updatePageMetadata(view: AppView, asset?: LeveragedAsset) {
  let title = 'dAssets — Decentralized Leveraged Tokens on Robinhood Chain';
  let desc = 'Non-liquidatable 2x, 3x, and 5x leveraged crypto positions natively engineered for Robinhood Chain Mainnet.';

  switch (view) {
    case 'trade':
      if (asset) {
        title = `Trade ${asset.symbol} — Swap ETH for Leveraged Tokens | dAssets`;
        desc = `Swap Robinhood Chain ETH for ${asset.name} or convert back to regular ETH on Uniswap and Oracle NAV.`;
      } else {
        title = 'Instant Swap & Trade | dAssets';
        desc = 'Swap Robinhood Chain ETH for constant 2x, 3x, and 5x leveraged tokens, or convert back to regular ETH anytime.';
      }
      break;
    case 'markets':
      title = 'Markets (270+ Leveraged Pairs) | dAssets';
      desc = 'Browse over 270+ tokenized crypto assets with automated on-chain rebalancing on Robinhood Chain.';
      break;
    case 'pools':
      title = 'Uniswap v3 Liquidity Pools | dAssets';
      desc = 'Seed liquidity, create AMM pools, and trade tokenized leveraged positions natively on Robinhood Chain.';
      break;
    case 'portfolio':
      title = 'Portfolio & Capital Allocation | dAssets';
      desc = 'Track your net worth, leveraged token holdings, Uniswap LP capital, and on-chain balances on Robinhood Chain.';
      break;
    case 'terminal':
      if (asset) {
        const levTag = `${Math.abs(asset.leverage)}x ${asset.isShort ? 'Short' : 'Long'}`;
        title = `${asset.symbol} ($${asset.currentNav.toFixed(2)}) — ${levTag} | dAssets Terminal`;
        desc = `Live continuous Oracle NAV pricing, benchmark comparison, and on-chain minting for ${asset.name} on Robinhood Chain.`;
      } else {
        title = 'Live Oracle NAV Terminal | dAssets';
      }
      break;
    case 'bridge':
      title = 'Hyperlane Warp Route Explorer | dAssets';
      desc = 'Interchain settlement and asset transfers between HyperEVM and Robinhood Chain Mainnet.';
      break;
    case 'contracts':
      title = 'Verified Smart Contracts (Chain 4663) | dAssets';
      desc = 'Factory registry, token addresses, and blockscout explorer links on Robinhood Chain Mainnet.';
      break;
    case 'home':
    default:
      title = 'dAssets — Tokenized Leverage on Robinhood Chain';
      break;
  }

  if (typeof document !== 'undefined') {
    document.title = title;

    // Update meta description if present
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', desc);
    }
  }
}
