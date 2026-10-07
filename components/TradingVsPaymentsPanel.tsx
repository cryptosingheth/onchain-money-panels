import { STABLECOIN_PAYMENTS as P } from '../data/curated';
import { fetchArtemisAdjustedVolume30d } from '../lib/artemis';
import { formatCompact, formatDate, formatPct, formatUsd } from '../lib/format';
import { HBarCompare } from './charts/HBarCompare';
import { Kpi, Panel, SectionHead } from './parts';

/**
 * Trading vs payments: separates exchange trading volume from on-chain payment
 * volume. Curated from Visa Onchain Analytics (no public API); see data/curated.ts.
 */
export async function TradingVsPaymentsPanel() {
  const titleId = 'trading-vs-payments-title';
  const live = await fetchArtemisAdjustedVolume30d().catch(() => null);

  const adjustedVolume = live ?? P.adjustedVolume.value;
  const adjustedSource = live !== null ? 'Artemis API · last 30 days' : 'Visa Onchain Analytics · last 30 days';
  const asOf = `as of ${formatDate(P.adjustedVolume.asOf)}`;
  const adjustedShareOfRaw = adjustedVolume / P.totalVolume.value;

  return (
    <section className="soc-add-section" id="trading-vs-payments" aria-labelledby={titleId}>
      <SectionHead
        id={titleId}
        title="Trading vs On-Chain Use"
        description="Exchange trading, on-chain transfers and real payments are three different numbers."
      />

      <div className="kpi-row">
        <Kpi label="Adjusted transfer volume" value={formatUsd(adjustedVolume)} source={adjustedSource} period={asOf} />
        <Kpi
          label="Raw on-chain volume"
          value={formatUsd(P.totalVolume.value)}
          source="Visa Onchain Analytics · last 30 days"
          period={`${formatCompact(P.totalCount.value)} transactions`}
        />
        <Kpi
          label="Adjusted transactions"
          value={formatCompact(P.adjustedCount.value)}
          source="Visa Onchain Analytics · last 30 days"
          period={`of ${formatCompact(P.totalCount.value)} raw`}
        />
        <Kpi
          label="Retail-sized volume"
          value={formatUsd(P.retailVolume.value)}
          source="Visa Onchain Analytics · last 30 days"
          period={`${formatCompact(P.retailCount.value)} transactions`}
        />
      </div>

      <Panel
        id="raw-vs-adjusted"
        title="Raw vs Adjusted Stablecoin Volume"
        caption="LAST 30 DAYS · TRANSACTION VOLUME (USD) · CURATED"
        notes={
          <>
            <p className="panel-note">
              <strong>Raw on-chain volume</strong> counts every stablecoin transfer. Most of it is bots, exchanges and
              smart-contract plumbing moving the same dollars between their own wallets. <strong>Adjusted</strong> strips
              those out to estimate real economic activity, leaving about {formatPct(adjustedShareOfRaw, 0)} of the raw
              figure. <strong>Retail-sized</strong> counts only small, everyday-sized transfers.
            </p>
            <p className="panel-note">
              <strong>Exchange trading volume</strong>, the monthly trading figure on this page, is a different thing
              again: stablecoins bought and sold on trading venues, not payments.
            </p>
          </>
        }
      >
        <HBarCompare
          ariaLabel="Stablecoin transaction volume, last 30 days, in US dollars"
          allowLog
          labelWidth="12ch"
          items={[
            { key: 'raw', label: 'Raw on-chain', value: P.totalVolume.value, display: formatUsd(P.totalVolume.value), tone: 'mist' },
            { key: 'adjusted', label: 'Adjusted', value: adjustedVolume, display: formatUsd(adjustedVolume), tone: 'ink' },
            { key: 'retail', label: 'Retail-sized', value: P.retailVolume.value, display: formatUsd(P.retailVolume.value), tone: 'slate' },
          ]}
        />
        <div className="soc-add-notes">
          <p className="panel-note">
            Programmatic option: the Artemis API (key required). Its adjusted series,
            ARTEMIS_STABLECOIN_TRANSFER_VOLUME, is being retired; the remaining STABLECOIN_TRANSFER_VOLUME is gross
            volume.
          </p>
          <p className="panel-note">
            Source:{' '}
            <a className="soc-add-link" href={P.totalVolume.sourceUrl} target="_blank" rel="noreferrer">
              Visa Onchain Analytics
            </a>{' '}
            (Allium), viewed {formatDate(P.totalVolume.asOf)}. Hand-maintained.
          </p>
        </div>
      </Panel>
    </section>
  );
}
