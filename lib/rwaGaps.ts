/**
 * Tokenized assets a CoinGecko-only RWA tracker misses or leaves unlabelled.
 *
 * - Real estate: DeFiLlama TVL per protocol (free, no key)  GET https://api.llama.fi/tvl/{slug}
 * - Stock issuers with no "Managed by" name: CoinGecko category market caps (free, no key)
 *   GET https://api.coingecko.com/api/v3/coins/categories
 * - Collectibles: DeFiLlama 30-day trading volume for the "Physical TCG" category (free, no key)
 *   GET https://api.llama.fi/overview/dexs   (volume, not assets held: there is no vault-value feed yet)
 *
 * Every fetch revalidates hourly and fails soft (null), so a panel shows "unavailable" instead of crashing.
 */

const REVALIDATE_SECONDS = 3600;

/** Tokenized real-estate platforms on DeFiLlama. Each property is its own token, so CoinGecko lists few of them. */
export const REAL_ESTATE_PROTOCOLS = [
  { slug: 'realt-tokens', name: 'RealT', what: 'Fractional US rental homes', chain: 'Gnosis' },
  { slug: 'lofty', name: 'Lofty', what: 'Fractional US rental homes', chain: 'Algorand' },
  { slug: 'estate-protocol', name: 'Estate Protocol', what: 'Fractional property ownership', chain: 'Arbitrum' },
  { slug: 'binaryx-platform', name: 'Binaryx', what: 'Tokenized property (Bali, Europe)', chain: 'Polygon' },
  { slug: 'propbase', name: 'Propbase', what: 'Fractional property (Southeast Asia)', chain: 'Aptos' },
  { slug: 'realtyx', name: 'RealtyX', what: 'Tokenized property', chain: 'Base, Plume' },
  { slug: 'landshare', name: 'Landshare', what: 'Fractional US rental homes', chain: 'BNB Chain' },
] as const;

/** Left out of the real-estate total on purpose, and said so on the panel. */
export const REAL_ESTATE_EXCLUDED_NOTE =
  "Left out to avoid double counting or mislabelling: RealT's RMM lending market (loans against RealT tokens), Tangible (mixed real-world assets), Vesta Equity (not updated since Feb 2025) and Parcl (synthetic price exposure, not property). Figure's HELOC token is real-estate-secured credit and already sits under Private Credit.";

/** CoinGecko categories worth showing. */
export const GECKO_CATEGORIES = [
  {
    id: 'bstocks-ecosystem',
    label: 'bStocks (Binance)',
    kind: 'Unlabelled issuer',
    note: 'Tokenized stocks and ETFs issued through Binance on BNB Chain (NVDAB, MSTRB, SPCXB, TSLAB...).',
  },
  {
    id: 'robinhood-chain-stocks-ecosystem',
    label: 'Robinhood stock tokens',
    kind: 'Unlabelled issuer',
    note: 'Robinhood Chain stock and ETF tokens (SPY, NVDA "Robinhood Token").',
  },
  {
    id: 'remora-markets-tokenized-rstocks',
    label: 'rStocks (Remora / Reality)',
    kind: 'Unlabelled issuer',
    note: 'Tokenized stocks from Remora Markets (Reality) on Arbitrum (RMSTR, RSPCX...).',
  },
] as const;

export interface RealEstateRow {
  slug: string;
  name: string;
  what: string;
  chain: string;
  tvlUsd: number;
}

export interface CategoryRow {
  id: string;
  label: string;
  kind: string;
  note: string;
  marketCapUsd: number;
}

export interface CollectiblesData {
  volume30dUsd: number;
  platforms: Array<{ name: string; volume30dUsd: number; chains: string[] }>;
}

export interface RwaGapsData {
  collectibles: CollectiblesData | null;
  realEstate: RealEstateRow[] | null;
  realEstateTotalUsd: number | null;
  categories: CategoryRow[] | null;
  asOf: number;
}

async function getNumber(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return null;
    const n = Number(await res.text());
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

async function getCategories(): Promise<Array<{ id: string; market_cap: number | null }> | null> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/coins/categories', {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as Array<{ id: string; market_cap: number | null }>;
  } catch {
    return null;
  }
}

async function getCollectibles(): Promise<CollectiblesData | null> {
  try {
    const res = await fetch(
      'https://api.llama.fi/overview/dexs?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true',
      { next: { revalidate: REVALIDATE_SECONDS } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      protocols?: Array<{ name: string; category?: string; total30d?: number | null; chains?: string[] }>;
    };
    const rows = (json.protocols ?? [])
      .filter((p) => p.category === 'Physical TCG' && (p.total30d ?? 0) > 0)
      .map((p) => ({ name: p.name, volume30dUsd: p.total30d ?? 0, chains: p.chains ?? [] }))
      .sort((a, b) => b.volume30dUsd - a.volume30dUsd);
    if (rows.length === 0) return null;
    return { volume30dUsd: rows.reduce((acc, r) => acc + r.volume30dUsd, 0), platforms: rows };
  } catch {
    return null;
  }
}

export async function getRwaGapsData(): Promise<RwaGapsData> {
  const [tvls, cats, collectibles] = await Promise.all([
    Promise.all(REAL_ESTATE_PROTOCOLS.map((p) => getNumber(`https://api.llama.fi/tvl/${p.slug}`))),
    getCategories(),
    getCollectibles(),
  ]);

  const realEstate =
    tvls.filter((v) => v !== null).length >= 2
      ? REAL_ESTATE_PROTOCOLS.map((p, i) => ({ ...p, tvlUsd: tvls[i] ?? 0 }))
          .filter((r) => r.tvlUsd > 0)
          .sort((a, b) => b.tvlUsd - a.tvlUsd)
      : null;

  const categories = cats
    ? GECKO_CATEGORIES.map((c) => ({
        ...c,
        marketCapUsd: cats.find((x) => x.id === c.id)?.market_cap ?? 0,
      })).filter((c) => c.marketCapUsd > 0)
    : null;

  return {
    collectibles,
    realEstate,
    realEstateTotalUsd: realEstate ? realEstate.reduce((acc, r) => acc + r.tvlUsd, 0) : null,
    categories,
    asOf: Date.now(),
  };
}
