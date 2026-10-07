/**
 * Tokenized assets a CoinGecko-only RWA tracker misses or leaves unlabelled.
 *
 * - Real estate: DeFiLlama TVL per protocol (free, no key)  GET https://api.llama.fi/tvl/{slug}
 * - Tokens with no "Managed by" name: curated snapshot of the tracker's own table (data/curated.ts)
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

export interface RealEstateRow {
  slug: string;
  name: string;
  what: string;
  chain: string;
  tvlUsd: number;
}

export interface CollectiblesData {
  volume30dUsd: number;
  platforms: Array<{ name: string; volume30dUsd: number; chains: string[] }>;
}

export interface RwaGapsData {
  collectibles: CollectiblesData | null;
  realEstate: RealEstateRow[] | null;
  realEstateTotalUsd: number | null;
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

/** Market cap of one CoinGecko category (free, no key). */
export async function getGeckoCategoryMarketCap(id: string): Promise<number | null> {
  const cats = await getCategories();
  const cap = cats?.find((c) => c.id === id)?.market_cap;
  return typeof cap === 'number' && cap > 0 ? cap : null;
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
  const [tvls, collectibles] = await Promise.all([
    Promise.all(REAL_ESTATE_PROTOCOLS.map((p) => getNumber(`https://api.llama.fi/tvl/${p.slug}`))),
    getCollectibles(),
  ]);

  const realEstate =
    tvls.filter((v) => v !== null).length >= 2
      ? REAL_ESTATE_PROTOCOLS.map((p, i) => ({ ...p, tvlUsd: tvls[i] ?? 0 }))
          .filter((r) => r.tvlUsd > 0)
          .sort((a, b) => b.tvlUsd - a.tvlUsd)
      : null;

  return {
    collectibles,
    realEstate,
    realEstateTotalUsd: realEstate ? realEstate.reduce((acc, r) => acc + r.tvlUsd, 0) : null,
    asOf: Date.now(),
  };
}
