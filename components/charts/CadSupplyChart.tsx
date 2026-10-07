'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCad, formatCompact, formatDate, formatMonthTick } from '../../lib/format';

export interface CadSeriesRow {
  t: number;
  [symbol: string]: number;
}

interface Props {
  data: CadSeriesRow[];
  /** Stack order, bottom first (oldest coin first). */
  keys: string[];
  /** Issuer name per symbol, for the legend and tooltip. */
  issuers: Record<string, string>;
}

/** Monochrome greys, darkest at the bottom of the stack. */
const GREYS = ['#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8', '#e4e4e7'];

const colorFor = (index: number) => GREYS[Math.min(index, GREYS.length - 1)];

/** First day of every third month inside the data range. */
function quarterTicks(data: CadSeriesRow[]): number[] {
  const ticks: number[] = [];
  for (const row of data) {
    const d = new Date(row.t * 1000);
    if (d.getUTCDate() === 1 && d.getUTCMonth() % 3 === 0) ticks.push(row.t);
  }
  return ticks;
}

interface TooltipEntry {
  dataKey?: string | number;
  value?: number | string;
  color?: string;
}

interface CadTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: number | string;
  issuers?: Record<string, string>;
}

function CadTooltip({ active, payload, label, issuers = {} }: CadTooltipProps) {
  if (!active || !payload?.length) return null;
  const rows = payload
    .map((p) => ({ key: String(p.dataKey), value: Number(p.value) || 0, color: p.color }))
    .filter((r) => r.value > 0)
    .reverse();
  const total = rows.reduce((acc, r) => acc + r.value, 0);
  return (
    <div className="tt">
      <div className="tt-label">{formatDate(Number(label))}</div>
      <div className="tt-row tt-total">
        <span className="tt-name">Total</span>
        <span className="tt-val">{formatCad(total, 2)}</span>
      </div>
      {rows.map((r) => (
        <div className="tt-row" key={r.key}>
          <span className="dot" style={{ background: r.color, width: 8, height: 8 }} aria-hidden="true" />
          <span className="tt-name">
            {r.key} <span className="tt-sub">{issuers[r.key]}</span>
          </span>
          <span className="tt-val">{formatCad(r.value, 2)}</span>
        </div>
      ))}
    </div>
  );
}

export function CadSupplyChart({ data, keys, issuers }: Props) {
  return (
    <>
      <div className="chart chart-hero soc-add-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 22, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="#e4e4e7" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              ticks={quarterTicks(data)}
              tickFormatter={formatMonthTick}
              tickLine={false}
              axisLine={{ stroke: '#e4e4e7' }}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={(v: number) => `C$${formatCompact(v, v > 0 && v < 1e7 ? 1 : 0)}`}
              tickLine={false}
              axisLine={false}
              width={58}
            />
            <Tooltip
              content={<CadTooltip issuers={issuers} />}
              cursor={{ stroke: '#a1a1aa', strokeWidth: 1 }}
              isAnimationActive={false}
            />
            {keys.map((key, i) => (
              <Area
                key={key}
                dataKey={key}
                name={key}
                stackId="cad"
                type="linear"
                stroke={colorFor(i)}
                strokeWidth={1}
                fill={colorFor(i)}
                fillOpacity={0.85}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ul className="keylegend">
        {keys.map((key, i) => (
          <li key={key}>
            <span className="dot" style={{ background: colorFor(i), width: 8, height: 8 }} aria-hidden="true" />
            {key}
            <span className="lb-ticker">{issuers[key]}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
