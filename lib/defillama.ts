/**
 * DeFiLlama stablecoin data (free, no API key).
 *
 * UNITS - read this before changing anything:
 * - List endpoint  GET /stablecoins?includePrices=true
 *   `circulating.peggedCAD` (and every other non-USD peg) is already converted to
 *   US DOLLARS at DeFiLlama's live price, even though the key says "peggedCAD".
 * - Per-coin endpoint  GET /stablecoin/{id}
 *   `tokens[].circulating.peggedCAD` and `currentChainBalances` are NATIVE token
 *   units, i.e. Canadian dollars. They match on-chain totalSupply() exactly.
 * So: CAD figures come from the per-coin endpoint, USD figures from the list.
 * Full reconciliation in README "Data notes".
 */

const BASE_URL = 'https://stablecoins.llama.fi';
const REVALIDATE_SECONDS = 3600;
const DAY = 86_400;

/** A coin counts as a live issuer above this circulating supply (CAD). */
export const MIN_LIVE_SUPPLY_CAD = 50_000;

export interface ExcludedCadCoin {
  symbol: string;
  issuer: string;
  chains: string[];
  supplyCad: number;
}

/** Fiat pegs compared in "Non-USD stablecoins by currency". DeFiLlama calls BRL "peggedREAL". */
export const COMPARED_CURRENCIES: Array<{ pegType: string; code: string }> = [
  { pegType: 'peggedEUR', code: 'EUR' },
  { pegType: 'peggedJPY', code: 'JPY' },
  { pegType: 'peggedCHF', code: 'CHF' },
  { pegType: 'peggedREAL', code: 'BRL' },
  { pegType: 'peggedGBP', code: 'GBP' },
  { pegType: 'peggedAUD', code: 'AUD' },
  { pegType: 'peggedSGD', code: 'SGD' },
  { pegType: 'peggedCAD', code: 'CAD' },
];

/** Issuer names are not a DeFiLlama field, so they are kept here (keyed by DeFiLlama id). */
const CAD_ISSUER_NAMES: Record<string, string> = {
  '424': 'Stablecorp',
  '145': 'Paytrie',
  '387': 'Tetra Trust',
  '360': 'Mento',
};

// ---------------------------------------------------------------------------
// Raw API shapes (only the fields we use)
// ---------------------------------------------------------------------------

type PegAmounts = Record<string, number | null | undefined>;

interface ListAsset {
  id: string;
  name: string;
  symbol: string;
  pegType: string;
  price: number | null;
  circulating: PegAmounts | null;
}

interface ListResponse {
  peggedAssets: ListAsset[];
}

interface CoinDetail {
  id: string;
  name: string;
  symbol: string;
  pegType: string;
  currentChainBalances: Record<string, PegAmounts>;
  tokens: Array<{ date: number | string; circulating: PegAmounts }>;
}

// ---------------------------------------------------------------------------
// Public shapes
// ---------------------------------------------------------------------------

export interface CadCoin {
  id: string;
  symbol: string;
  name: string;
  issuer: string;
  /** Chains with a non-zero balance, largest first. */
  chains: string[];
  supplyCad: number;
  /** From the list endpoint (already USD). */
  supplyUsd: number;
  /** Fractional 30-day change in CAD supply; null if the coin is younger than 30 days. */
  change30d: number | null;
  isLive: boolean;
}

export interface CadSeriesPoint {
  /** Unix seconds, 00:00 UTC. */
  t: number;
  [symbol: string]: number;
}

export interface CurrencyTotal {
  code: string;
  pegType: string;
  usd: number;
}

export interface CadStablecoinData {
  coins: CadCoin[];
  /** CAD tokens below MIN_LIVE_SUPPLY_CAD: not counted anywhere, only named in a note. */
  excluded: ExcludedCadCoin[];
  totalCad: number;
  totalUsd: number;
  totalCad30dAgo: number;
  liveIssuers: number;
  chainCount: number;
  largestChain: { name: string; share: number } | null;
  /** CAD USD value / all stablecoins USD value, same list snapshot. */
  shareOfAll: number;
  allStablecoinsUsd: number;
  byCurrency: CurrencyTotal[];
  largestSgdCoin: { symbol: string; usd: number } | null;
  /** Last 12 months, stacked by symbol, CAD. */
  series: CadSeriesPoint[];
  /** Symbols in stack order: oldest coin first, so newer issuers stack on top. */
  seriesKeys: string[];
  asOf: number;
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function sumPeg(amounts: PegAmounts | null | undefined): number {
  if (!amounts) return 0;
  return Object.values(amounts).reduce<number>((acc, v) => acc + (typeof v === 'number' ? v : 0), 0);
}

function toUnixDay(date: number | string): number {
  const n = typeof date === 'string' ? Number(date) : date;
  return Math.floor(n / DAY) * DAY;
}

/** Native-unit (CAD) history as a sorted [day, value] list. */
function nativeHistory(detail: CoinDetail): Array<[number, number]> {
  return detail.tokens
    .map((p): [number, number] => [toUnixDay(p.date), p.circulating?.peggedCAD ?? 0])
    .filter(([t, v]) => Number.isFinite(t) && Number.isFinite(v))
    .sort((a, b) => a[0] - b[0]);
}

/** Last known value on or before `day`; null if the coin did not exist yet. */
function valueAt(history: Array<[number, number]>, day: number): number | null {
  let found: number | null = null;
  for (const [t, v] of history) {
    if (t > day) break;
    found = v;
  }
  return found;
}

// ---------------------------------------------------------------------------
// Main loader
// ---------------------------------------------------------------------------

/**
 * Everything the CAD panel needs, or null if DeFiLlama is unreachable.
 * Never throws.
 */
export async function getCadStablecoinData(): Promise<CadStablecoinData | null> {
  try {
    const list = await getJson<ListResponse>('/stablecoins?includePrices=true');
    if (!list?.peggedAssets?.length) return null;

    const cadListed = list.peggedAssets.filter((a) => a.pegType === 'peggedCAD');
    if (cadListed.length === 0) return null;

    const details = await Promise.all(cadListed.map((a) => getJson<CoinDetail>(`/stablecoin/${a.id}`)));
    if (details.some((d) => d === null)) return null;

    const now = Math.floor(Date.now() / 1000);
    const today = toUnixDay(now);
    const day30 = today - 30 * DAY;

    const coins: CadCoin[] = [];
    const excluded: ExcludedCadCoin[] = [];
    const histories = new Map<string, Array<[number, number]>>();
    const chainTotals = new Map<string, number>();

    cadListed.forEach((asset, i) => {
      const detail = details[i] as CoinDetail;
      const balances = Object.entries(detail.currentChainBalances ?? {})
        .map(([chain, amounts]) => [chain, amounts?.peggedCAD ?? 0] as const)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1]);

      const supplyCad = balances.reduce((acc, [, v]) => acc + v, 0);

      // Tokens below the live threshold are left out of every count, total and chart, and only named in a note.
      if (supplyCad < MIN_LIVE_SUPPLY_CAD) {
        excluded.push({
          symbol: asset.symbol,
          issuer: CAD_ISSUER_NAMES[asset.id] ?? asset.name,
          chains: balances.map(([chain]) => chain),
          supplyCad,
        });
        return;
      }

      balances.forEach(([chain, v]) => chainTotals.set(chain, (chainTotals.get(chain) ?? 0) + v));
      const history = nativeHistory(detail);
      histories.set(asset.symbol, history);

      const prev = valueAt(history, day30);
      coins.push({
        id: asset.id,
        symbol: asset.symbol,
        name: asset.name,
        issuer: CAD_ISSUER_NAMES[asset.id] ?? asset.name,
        chains: balances.map(([chain]) => chain),
        supplyCad,
        supplyUsd: sumPeg(asset.circulating),
        change30d: prev && prev > 0 ? (supplyCad - prev) / prev : null,
        isLive: supplyCad >= MIN_LIVE_SUPPLY_CAD,
      });
    });

    coins.sort((a, b) => b.supplyCad - a.supplyCad);

    const totalCad = coins.reduce((acc, c) => acc + c.supplyCad, 0);
    const totalUsd = coins.reduce((acc, c) => acc + c.supplyUsd, 0);
    const totalCad30dAgo = coins.reduce((acc, c) => acc + (valueAt(histories.get(c.symbol) ?? [], day30) ?? 0), 0);

    const sortedChains = Array.from(chainTotals.entries()).sort((a, b) => b[1] - a[1]);
    const largestChain =
      sortedChains.length > 0 && totalCad > 0
        ? { name: sortedChains[0][0], share: sortedChains[0][1] / totalCad }
        : null;

    // Totals by peg, in USD (list values are already USD-converted).
    const usdByPeg = new Map<string, number>();
    for (const a of list.peggedAssets) {
      usdByPeg.set(a.pegType, (usdByPeg.get(a.pegType) ?? 0) + sumPeg(a.circulating));
    }
    const allStablecoinsUsd = Array.from(usdByPeg.values()).reduce((acc, v) => acc + v, 0);

    const byCurrency = COMPARED_CURRENCIES.map(({ pegType, code }) => ({
      code,
      pegType,
      usd: pegType === 'peggedCAD' ? totalUsd : usdByPeg.get(pegType) ?? 0,
    })).sort((a, b) => b.usd - a.usd);

    const sgd = list.peggedAssets
      .filter((a) => a.pegType === 'peggedSGD')
      .map((a) => ({ symbol: a.symbol, usd: sumPeg(a.circulating) }))
      .sort((a, b) => b.usd - a.usd)[0];

    const { series, seriesKeys } = buildSeries(coins, histories, today);

    return {
      coins,
      totalCad,
      totalUsd,
      totalCad30dAgo,
      liveIssuers: coins.filter((c) => c.isLive).length,
      chainCount: chainTotals.size,
      largestChain,
      shareOfAll: allStablecoinsUsd > 0 ? totalUsd / allStablecoinsUsd : 0,
      excluded,
      allStablecoinsUsd,
      byCurrency,
      largestSgdCoin: sgd ?? null,
      series,
      seriesKeys,
      asOf: now,
    };
  } catch {
    return null;
  }
}

/**
 * Daily stacked series for the last 12 months, in CAD. Gaps are forward-filled;
 * days before a coin launched are 0. The final day uses the live
 * currentChainBalances so the chart ends where the KPI and table do
 * (DeFiLlama's daily snapshot can lag the live balance by a few hours).
 */
function buildSeries(
  coins: CadCoin[],
  histories: Map<string, Array<[number, number]>>,
  today: number,
): { series: CadSeriesPoint[]; seriesKeys: string[] } {
  const start = today - 365 * DAY;
  const firstDay = (symbol: string) => histories.get(symbol)?.[0]?.[0] ?? Infinity;
  const seriesKeys = coins.map((c) => c.symbol).sort((a, b) => firstDay(a) - firstDay(b));
  const series: CadSeriesPoint[] = [];

  const cursors = new Map<string, { idx: number; last: number }>();
  seriesKeys.forEach((k) => cursors.set(k, { idx: 0, last: 0 }));

  for (let t = start; t <= today; t += DAY) {
    const point: CadSeriesPoint = { t };
    for (const key of seriesKeys) {
      const history = histories.get(key) ?? [];
      const cursor = cursors.get(key)!;
      while (cursor.idx < history.length && history[cursor.idx][0] <= t) {
        cursor.last = history[cursor.idx][1];
        cursor.idx += 1;
      }
      point[key] = cursor.last;
    }
    series.push(point);
  }

  const last = series[series.length - 1];
  if (last) coins.forEach((c) => (last[c.symbol] = c.supplyCad));

  return { series, seriesKeys };
}
