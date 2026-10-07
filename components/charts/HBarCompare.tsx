'use client';

import { useState } from 'react';

export interface HBarItem {
  key: string;
  label: string;
  value: number;
  /** Pre-formatted value shown at the end of the bar. */
  display: string;
  /** ink = highlighted, slate = secondary, mist = background. Default mist. */
  tone?: 'ink' | 'slate' | 'mist';
}

interface Props {
  items: HBarItem[];
  ariaLabel: string;
  /** Show his seg control with Linear / Log. */
  allowLog?: boolean;
  /** CSS width of the label column, e.g. "13ch". */
  labelWidth?: string;
}

type Scale = 'linear' | 'log';

/**
 * Horizontal comparison bars in plain HTML, so labels never clip at 375px.
 * Log mode starts the axis just under the smallest value so every bar stays readable.
 */
export function HBarCompare({ items, ariaLabel, allowLog = false, labelWidth = '6ch' }: Props) {
  const [scale, setScale] = useState<Scale>('linear');

  const positive = items.filter((i) => i.value > 0).map((i) => i.value);
  const max = positive.length ? Math.max(...positive) : 1;
  const min = positive.length ? Math.min(...positive) : 1;
  const logFloor = Math.floor(Math.log10(min) - 0.25);
  const logSpan = Math.max(Math.log10(max) - logFloor, 1e-9);

  const widthOf = (value: number): number => {
    if (value <= 0) return 0;
    const fraction = scale === 'log' ? (Math.log10(value) - logFloor) / logSpan : value / max;
    return Math.min(100, Math.max(0, fraction * 100));
  };

  return (
    <div>
      {allowLog && (
        <div className="chart-actions">
          <div className="seg mono" role="group" aria-label="Scale">
            {(['linear', 'log'] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={`seg-btn${scale === s ? ' is-active' : ''}`}
                aria-pressed={scale === s}
                onClick={() => setScale(s)}
              >
                {s === 'linear' ? 'Linear' : 'Log'}
              </button>
            ))}
          </div>
        </div>
      )}
      <ul className="soc-add-hbar" aria-label={ariaLabel} style={{ ['--soc-add-label-w' as string]: labelWidth }}>
        {items.map((item) => (
          <li key={item.key} className={`soc-add-hbar-row soc-add-tone-${item.tone ?? 'mist'}`}>
            <span className="soc-add-hbar-label mono">{item.label}</span>
            <span className="soc-add-hbar-track" aria-hidden="true">
              <span className="soc-add-hbar-fill" style={{ width: `${widthOf(item.value)}%` }} />
            </span>
            <span className="soc-add-hbar-val mono">{item.display}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
