import { AGENT_PAYMENTS as A, STABLECOIN_PAYMENTS as P, X402_ANALYSIS as X } from '../data/curated';
import { formatCompact, formatDate, formatSmallPct, formatUsd } from '../lib/format';
import { Kpi, Panel, SectionHead } from './parts';

function roundSignificant(value: number, digits: number): number {
  if (!Number.isFinite(value) || value === 0) return 0;
  const factor = 10 ** (Math.floor(Math.log10(Math.abs(value))) - digits + 1);
  return Math.round(value / factor) * factor;
}

/** ["Base", "Solana", "Polygon"] -> "Base, Solana and Polygon". */
function listJoin(items: readonly string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * Agent payments (x402 + MPP): how big machine-to-machine stablecoin payments are.
 * Curated from Visa Onchain Analytics and the Visa x Artemis analysis; see data/curated.ts.
 */
export function AgentPaymentsPanel() {
  const titleId = 'agent-payments-title';
  const organicVsPayments = A.organicVolume.value / P.adjustedVolume.value;
  const oneIn = roundSignificant(1 / organicVsPayments, 2).toLocaleString('en-US');

  return (
    <section className="soc-add-section" id="agent-payments" aria-labelledby={titleId}>
      <SectionHead
        id={titleId}
        title="Agent Payments"
        description="AI agents paying each other for data, compute and APIs, mostly over the x402 protocol."
      />

      <div className="kpi-row">
        <Kpi
          label="Organic volume"
          value={formatUsd(A.organicVolume.value)}
          source="x402 + MPP · all time"
          period={`of ${formatUsd(A.totalVolume.value)} total`}
        />
        <Kpi
          label="Transactions"
          value={formatCompact(A.totalTransactions.value)}
          source="x402 + MPP · all time"
          period="total, not adjusted"
        />
        <Kpi label="Median payment" value={formatUsd(A.medianTransaction.value)} source="per transaction" period="one cent" />
        <Kpi
          label="Buyer wallets"
          value={formatCompact(A.buyerWallets.value)}
          source="x402 + MPP · all time"
          period={`${formatCompact(A.merchantWallets.value)} merchant wallets`}
        />
      </div>

      <Panel
        id="agent-payments-what"
        title="What the Data Says"
        caption="X402 + MPP · ALL TIME · CURATED"
        notes={
          <p className="panel-note">
            Organic volume is Visa&apos;s adjusted figure. Figures read {formatDate(A.organicVolume.asOf)}.
          </p>
        }
      >
        <ol className="soc-add-points">
          <li>
            <strong>Real but small.</strong> {formatUsd(A.organicVolume.value)} of organic agent payments, all time, equals{' '}
            {formatSmallPct(organicVsPayments, 2)} (about 1/{oneIn}) of the {formatUsd(P.adjustedVolume.value)} in
            adjusted stablecoin transfers in the last 30 days alone.
          </li>
          <li>
            <strong>Where it happens.</strong> Mostly on {listJoin(X.mainChains)}, according to the Visa x Artemis analysis
            (data to {formatDate(X.x402AdjustedVolume.asOf)}).
          </li>
          <li>
            <strong>Micro.</strong> The median payment is one cent. Visa x Artemis put the average at{' '}
            {X.averagePayment}.
          </li>
        </ol>
        <div className="soc-add-notes">
          <p className="panel-note">
            Visa x Artemis (published {formatDate(X.x402AdjustedVolume.published)}, data to{' '}
            {formatDate(X.x402AdjustedVolume.asOf)}) counted roughly {formatUsd(X.x402AdjustedVolume.value)} of adjusted
            x402 volume across {formatCompact(X.x402AdjustedTransactions.value)} transactions since May 2025, excluding
            identified wash and test activity. MPP added about ${X.mppVolume.value.toLocaleString('en-US')} across
            roughly {X.mppTransactions.value.toLocaleString('en-US')} transactions in its first weeks after mid-March
            2026.
          </p>
          <p className="panel-note">
            Source:{' '}
            <a className="soc-add-link" href={A.organicVolume.sourceUrl} target="_blank" rel="noreferrer">
              Visa Onchain Analytics
            </a>{' '}
            (Allium);{' '}
            <a className="soc-add-link" href={X.x402AdjustedVolume.sourceUrl} target="_blank" rel="noreferrer">
              Visa x Artemis
            </a>
            . Hand-maintained.
          </p>
        </div>
      </Panel>
    </section>
  );
}
