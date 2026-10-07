/**
 * Number and date formatting, matching State of Crypto's style:
 * "$284.9B", "64.6%", one decimal by default, tabular mono digits in the markup.
 */

const UNITS: Array<[number, string]> = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'K'],
];

/** 6_300_000_000_000 -> "6.3T", 172_200_000 -> "172.2M", 971 -> "971". */
export function formatCompact(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '-';
  const abs = Math.abs(value);
  for (const [size, suffix] of UNITS) {
    if (abs >= size) return `${(value / size).toFixed(digits)}${suffix}`;
  }
  return abs >= 1 ? Math.round(value).toString() : value.toFixed(2);
}

/** Two decimals when the compact mantissa is under 10 ("6.16M"), otherwise one ("824.5M"). */
export function autoDigits(value: number): number {
  const abs = Math.abs(value);
  const size = UNITS.find(([s]) => abs >= s)?.[0] ?? 1;
  return abs / size < 10 ? 2 : 1;
}

/** "$324.5B". Values under $1 keep two decimals ("$0.01"). */
export function formatUsd(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '-';
  if (Math.abs(value) < 1) return `$${value.toFixed(2)}`;
  return `$${formatCompact(value, digits)}`;
}

/** USD with an explicit "US$" prefix, for use next to Canadian-dollar figures. */
export function formatUsdExplicit(value: number, digits = 1): string {
  return `US${formatUsd(value, digits)}`;
}

/** Canadian dollars: "C$6.16M". */
export function formatCad(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '-';
  return `C$${formatCompact(value, digits)}`;
}

/** Fraction to percent: 0.6455 -> "64.6%". */
export function formatPct(fraction: number, digits = 1): string {
  if (!Number.isFinite(fraction)) return '-';
  return `${(fraction * 100).toFixed(digits)}%`;
}

/**
 * Percent for very small shares, keeping `significant` significant digits:
 * 0.00001367 -> "0.0014%". Falls back to formatPct for shares of 1% or more.
 */
export function formatSmallPct(fraction: number, significant = 2): string {
  if (!Number.isFinite(fraction) || fraction <= 0) return '0%';
  const pct = fraction * 100;
  if (pct >= 1) return formatPct(fraction, 1);
  const decimals = Math.max(1, significant - 1 - Math.floor(Math.log10(pct)));
  return `${pct.toFixed(decimals)}%`;
}

export type DeltaDirection = 'up' | 'down' | 'flat';

/** Fractional change to his delta parts: 0.031 -> { text: "3.1%", dir: "up" }. */
export function formatDelta(fraction: number, digits = 1): { text: string; dir: DeltaDirection } {
  const pct = fraction * 100;
  const text = `${Math.abs(pct).toFixed(digits)}%`;
  if (Number(Math.abs(pct).toFixed(digits)) === 0) return { text, dir: 'flat' };
  return { text, dir: pct > 0 ? 'up' : 'down' };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Unix seconds or ISO date string -> "6 Oct 2026" (UTC). */
export function formatDate(input: number | string): string {
  const d = typeof input === 'number' ? new Date(input * 1000) : new Date(`${input}T00:00:00Z`);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Unix seconds -> "Oct '26", for chart axis ticks. */
export function formatMonthTick(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return `${MONTHS[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(2)}`;
}
