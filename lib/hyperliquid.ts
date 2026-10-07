/**
 * Stock perpetuals on Hyperliquid's builder-deployed markets (HIP-3), from the public info API (free, no key).
 *
 *   POST https://api.hyperliquid.xyz/info  {"type":"perpDexs"}                      -> list of HIP-3 DEXs
 *   POST https://api.hyperliquid.xyz/info  {"type":"metaAndAssetCtxs","dex":"xyz"}  -> markets + openInterest, markPx
 *
 * Open interest is reported in contracts; notional = openInterest x markPx (one side of the book).
 * Perps are synthetic contracts settled in USDC: no shares or tokens back them, so they are shown as
 * exposure next to tokenized stocks, never added to tokenized AUM.
 */

const INFO_URL = 'https://api.hyperliquid.xyz/info';
const REVALIDATE_SECONDS = 3600;

/** Classified by symbol. Anything not listed here is treated as a stock, equity index or equity ETF. */
const COMMODITIES = new Set([
  'GOLD', 'SILVER', 'PLATINUM', 'PALLADIUM', 'COPPER', 'ALUMINIUM', 'ALUMINUM', 'CL', 'WTI', 'BRENTOIL', 'OIL',
  'NATGAS', 'HO', 'RB', 'CORN', 'WHEAT', 'SOY', 'COFFEE', 'SUGAR', 'COCOA', 'URANIUM', 'LITHIUM',
]);
const FX_AND_RATES = new Set([
  'EUR', 'JPY', 'GBP', 'CHF', 'CAD', 'AUD', 'CNH', 'DXY', 'USBOND', '2Y', '5Y', '10Y', '30Y', 'TLT',
]);
/** Crypto-native or unclear indices, kept out of the stock bucket. */
const OTHER = new Set(['PURRDAT', 'ANSEM']);

export type PerpBucket = 'stocks' | 'commodities' | 'fxRates' | 'other';

export interface PerpMarket {
  dex: string;
  symbol: string;
  bucket: PerpBucket;
  openInterestUsd: number;
  volume24hUsd: number;
}

export interface StockPerpsData {
  markets: PerpMarket[];
  totalOiUsd: number;
  oiByBucket: Record<PerpBucket, number>;
  stockVolume24hUsd: number;
  stockMarketCount: number;
  dexCount: number;
  asOf: number;
}

async function post<T>(body: unknown): Promise<T | null> {
  try {
    const res = await fetch(INFO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function bucketOf(symbol: string): PerpBucket {
  if (COMMODITIES.has(symbol)) return 'commodities';
  if (FX_AND_RATES.has(symbol)) return 'fxRates';
  if (OTHER.has(symbol)) return 'other';
  return 'stocks';
}

type Meta = { universe: Array<{ name: string }> };
type Ctx = { markPx?: string | null; openInterest?: string | null; dayNtlVlm?: string | null };

export async function getStockPerpsData(): Promise<StockPerpsData | null> {
  const dexList = await post<Array<{ name: string } | null>>({ type: 'perpDexs' });
  const dexes = (dexList ?? []).filter((d): d is { name: string } => !!d && !!d.name).map((d) => d.name);
  if (dexes.length === 0) return null;

  const results = await Promise.all(dexes.map((dex) => post<[Meta, Ctx[]]>({ type: 'metaAndAssetCtxs', dex })));

  const markets: PerpMarket[] = [];
  results.forEach((r, i) => {
    if (!r) return;
    const [meta, ctxs] = r;
    meta.universe.forEach((asset, j) => {
      const c = ctxs[j] ?? {};
      const px = Number(c.markPx ?? 0);
      const oi = Number(c.openInterest ?? 0) * px;
      const vol = Number(c.dayNtlVlm ?? 0);
      if (!Number.isFinite(oi) || oi <= 0) return;
      const symbol = asset.name.includes(':') ? asset.name.split(':')[1] : asset.name;
      markets.push({ dex: dexes[i], symbol, bucket: bucketOf(symbol), openInterestUsd: oi, volume24hUsd: vol });
    });
  });
  if (markets.length === 0) return null;

  markets.sort((a, b) => b.openInterestUsd - a.openInterestUsd);
  const oiByBucket: Record<PerpBucket, number> = { stocks: 0, commodities: 0, fxRates: 0, other: 0 };
  markets.forEach((m) => (oiByBucket[m.bucket] += m.openInterestUsd));
  const stocks = markets.filter((m) => m.bucket === 'stocks');

  return {
    markets,
    totalOiUsd: markets.reduce((acc, m) => acc + m.openInterestUsd, 0),
    oiByBucket,
    stockVolume24hUsd: stocks.reduce((acc, m) => acc + m.volume24hUsd, 0),
    stockMarketCount: stocks.length,
    dexCount: new Set(markets.map((m) => m.dex)).size,
    asOf: Date.now(),
  };
}
