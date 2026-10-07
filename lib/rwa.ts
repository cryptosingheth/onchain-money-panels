/**
 * Recompute tokenized-asset shares with selected assets set aside.
 * Pure functions, no I/O. Works on per-asset rows (production) or on
 * published bucket totals (the static demo).
 */

/** CoinGecko id of Figure's HELOC token (symbol FIGR_HELOC). Looked up 6 Oct 2026. */
export const FIGURE_HELOC_ID = 'figure-heloc';

export type IssuerType = 'tradfi-issued' | 'crypto-wrapped' | 'crypto-native';

export type RwaCategory =
  | 'private-credit'
  | 'treasuries-mmf'
  | 'metals-commodities'
  | 'stocks'
  | 'etfs'
  | 'real-estate'
  | 'other';

export interface RwaRow {
  /** CoinGecko id for real assets, any unique string for buckets. */
  id: string;
  valueUsd: number;
  /**
   * With per-asset data, set both fields. A row without a field is ignored by that
   * breakdown, which lets the demo feed published per-dimension totals.
   */
  issuerType?: IssuerType;
  category?: RwaCategory;
}

export interface Share<K extends string> {
  key: K;
  valueUsd: number;
  /** 0..1 of the breakdown total. */
  share: number;
}

export interface Breakdown<K extends string> {
  totalUsd: number;
  shares: Array<Share<K>>;
}

export const ISSUER_TYPE_LABELS: Record<IssuerType, string> = {
  'tradfi-issued': 'TradFi-issued',
  'crypto-wrapped': 'Crypto-wrapped TradFi',
  'crypto-native': 'Crypto-native',
};

export const CATEGORY_LABELS: Record<RwaCategory, string> = {
  'private-credit': 'Private Credit',
  'treasuries-mmf': 'Treasuries & MMF',
  'metals-commodities': 'Metals & Commodities',
  stocks: 'Tokenized Stocks',
  etfs: 'Tokenized ETFs',
  'real-estate': 'Real Estate',
  other: 'Other',
};

const ISSUER_TYPES: IssuerType[] = ['tradfi-issued', 'crypto-wrapped', 'crypto-native'];

/** Rows whose id is not in `ids`. */
export function excludeAssets(rows: RwaRow[], ids: string[]): RwaRow[] {
  const drop = new Set(ids);
  return rows.filter((r) => !drop.has(r.id));
}

function breakdown<K extends string>(
  rows: RwaRow[],
  keyOf: (r: RwaRow) => K | undefined,
  order: K[],
): Breakdown<K> {
  const totals = new Map<K, number>();
  for (const row of rows) {
    const key = keyOf(row);
    if (key === undefined || !Number.isFinite(row.valueUsd)) continue;
    totals.set(key, (totals.get(key) ?? 0) + row.valueUsd);
  }
  const totalUsd = Array.from(totals.values()).reduce((acc, v) => acc + v, 0);
  const keys = [...order.filter((k) => totals.has(k)), ...Array.from(totals.keys()).filter((k) => !order.includes(k))];
  const shares = keys.map((key) => {
    const valueUsd = totals.get(key) ?? 0;
    return { key, valueUsd, share: totalUsd > 0 ? valueUsd / totalUsd : 0 };
  });
  return { totalUsd, shares };
}

/** TradFi-issued / crypto-wrapped / crypto-native, in that order. */
export function shareByIssuerType(rows: RwaRow[]): Breakdown<IssuerType> {
  return breakdown(rows, (r) => r.issuerType, ISSUER_TYPES);
}

/** Category shares, largest first. */
export function shareByCategory(rows: RwaRow[]): Breakdown<RwaCategory> {
  const result = breakdown(rows, (r) => r.category, []);
  result.shares.sort((a, b) => b.valueUsd - a.valueUsd);
  return result;
}
