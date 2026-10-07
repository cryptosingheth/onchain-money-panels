'use client';

import { useMemo, useState } from 'react';
import { RWA_PUBLISHED as R } from '../data/curated';
import { formatDate, formatPct, formatUsd } from '../lib/format';
import {
  CATEGORY_LABELS,
  FIGURE_HELOC_ID,
  ISSUER_TYPE_LABELS,
  excludeAssets,
  shareByCategory,
  shareByIssuerType,
  type RwaRow,
} from '../lib/rwa';
import { HBarCompare } from './charts/HBarCompare';
import { Kpi, Panel, SectionHead } from './parts';

/**
 * Static demo rows built from his published totals. Figure's HELOC token is one row with
 * both fields; everything else is a per-dimension remainder (one field set), so each
 * breakdown ties to the published totals. In production, pass real per-asset rows.
 */
const DEMO_ROWS: RwaRow[] = [
  { id: FIGURE_HELOC_ID, valueUsd: R.figureHelocUsd, issuerType: 'crypto-native', category: 'private-credit' },
  { id: 'rest:tradfi-issued', valueUsd: R.issuerType.tradfiIssued, issuerType: 'tradfi-issued' },
  { id: 'rest:crypto-wrapped', valueUsd: R.issuerType.cryptoWrapped, issuerType: 'crypto-wrapped' },
  { id: 'rest:crypto-native', valueUsd: R.issuerType.cryptoNative - R.figureHelocUsd, issuerType: 'crypto-native' },
  { id: 'rest:private-credit', valueUsd: R.category.privateCredit - R.figureHelocUsd, category: 'private-credit' },
  { id: 'rest:treasuries-mmf', valueUsd: R.category.treasuriesMmf, category: 'treasuries-mmf' },
  { id: 'rest:metals-commodities', valueUsd: R.category.metalsCommodities, category: 'metals-commodities' },
  { id: 'rest:stocks', valueUsd: R.category.stocks, category: 'stocks' },
  { id: 'rest:etfs', valueUsd: R.category.etfs, category: 'etfs' },
];

type Mode = 'include' | 'exclude';

export function RwaExcludeDemo() {
  const [mode, setMode] = useState<Mode>('exclude');
  const titleId = 'rwa-exclude-title';

  const { issuer, category } = useMemo(() => {
    const rows = mode === 'exclude' ? excludeAssets(DEMO_ROWS, [FIGURE_HELOC_ID]) : DEMO_ROWS;
    return { issuer: shareByIssuerType(rows), category: shareByCategory(rows) };
  }, [mode]);

  const shareOf = (key: string) => issuer.shares.find((s) => s.key === key)?.share ?? 0;
  const largestCategory = category.shares[0];

  return (
    <section className="soc-add-section" id="rwa-exclude" aria-labelledby={titleId}>
      <SectionHead
        id={titleId}
        title="Tokenized Assets Without Figure"
        description="Figure's HELOC token is over half of on-chain tokenized assets. Set it aside and the market looks very different."
      />

      <div className="chart-actions">
        <span className="seg-label">FIGURE HELOC</span>
        <div className="seg mono" role="group" aria-label="Figure HELOC token">
          {(['include', 'exclude'] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`seg-btn${mode === m ? ' is-active' : ''}`}
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
            >
              {m === 'include' ? 'Include' : 'Exclude'}
            </button>
          ))}
        </div>
      </div>

      <div className="kpi-row" aria-live="polite">
        <Kpi
          label="On-chain tokenized AUM"
          value={formatUsd(issuer.totalUsd)}
          source={mode === 'exclude' ? 'excl. Figure HELOC' : 'incl. Figure HELOC'}
        />
        <Kpi label="TradFi-issued share" value={formatPct(shareOf('tradfi-issued'))} source="TradFi-issued ÷ total" />
        <Kpi label="Crypto-wrapped share" value={formatPct(shareOf('crypto-wrapped'))} source="crypto-wrapped TradFi ÷ total" />
        <Kpi label="Crypto-native share" value={formatPct(shareOf('crypto-native'))} source="crypto-native ÷ total" />
      </div>

      <div className="grid-2">
        <Panel
          title="Who Issues It"
          caption="SHARE OF ON-CHAIN AUM · STATIC DEMO"
          notes={
            <p className="panel-note">
              TradFi-issued vs crypto-wrapped vs crypto-native, recomputed with{' '}
              <span className="mono">excludeAssets()</span> and <span className="mono">shareByIssuerType()</span>.
            </p>
          }
        >
          <HBarCompare
            ariaLabel="Share of on-chain tokenized AUM by issuer type"
            labelWidth="13ch"
            items={issuer.shares.map((s) => ({
              key: s.key,
              label: ISSUER_TYPE_LABELS[s.key].replace(' TradFi', ''),
              value: s.share,
              display: `${formatUsd(s.valueUsd)} · ${formatPct(s.share)}`,
              tone: s.key === 'tradfi-issued' ? 'ink' : 'mist',
            }))}
          />
        </Panel>

        <Panel
          title="AUM by Category"
          caption="SHARE OF ON-CHAIN AUM · STATIC DEMO"
          notes={
            <p className="panel-note">
              {largestCategory
                ? `Largest category: ${CATEGORY_LABELS[largestCategory.key]}, ${formatPct(largestCategory.share)}.`
                : ''}{' '}
              Private credit is almost entirely Figure&apos;s HELOC token.
            </p>
          }
        >
          <HBarCompare
            ariaLabel="Share of on-chain tokenized AUM by category"
            labelWidth="16ch"
            items={category.shares
              .filter((s) => s.valueUsd > 0)
              .map((s, i) => ({
                key: s.key,
                label: CATEGORY_LABELS[s.key].replace('Tokenized ', '').replace(' & Commodities', ''),
                value: s.share,
                display: `${formatUsd(s.valueUsd)} · ${formatPct(s.share)}`,
                tone: i === 0 ? 'ink' : 'mist',
              }))}
          />
        </Panel>
      </div>

      <p className="panel-note soc-add-foot">
        Static demo using State of Crypto&apos;s published totals for {formatDate(R.asOf)}: total {formatUsd(R.totalUsd)},
        of which Figure&apos;s HELOC token (CoinGecko id <span className="mono">{FIGURE_HELOC_ID}</span>) is{' '}
        {formatUsd(R.figureHelocUsd)}. Shares from rounded totals can differ from the live page by 0.1 points.
      </p>
    </section>
  );
}
