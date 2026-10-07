import { getCadStablecoinData, MIN_LIVE_SUPPLY_CAD, type CadStablecoinData } from '../lib/defillama';
import { autoDigits, formatCad, formatSmallPct, formatPct, formatUsd, formatUsdExplicit } from '../lib/format';
import { CadSupplyChart } from './charts/CadSupplyChart';
import { HBarCompare } from './charts/HBarCompare';
import { Delta, Kpi, Panel, SectionHead, Unavailable } from './parts';

// Editorial takeaway shown under the panel. Edit freely.
const TAKEAWAY =
  'Canada now has locally issued dollar tokens live on major chains, but the market is still small next to US-dollar stablecoins. Once the Stablecoin Act is in force, supply is the number to watch.';

const REGULATION_NOTE =
  "Canada's Stablecoin Act (Bill C-15) received Royal Assent on 26 Mar 2026. It is not yet in force; the Bank of Canada will supervise issuers once regulations are finalised (expected 2027).";

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

/** The headline sentence, written only as strongly as the live numbers allow. */
function headline(data: CadStablecoinData): string {
  const sgd = data.largestSgdCoin;
  if (sgd && data.totalUsd < sgd.usd) {
    if (data.liveIssuers === 3) {
      return "Canada's three CAD stablecoin issuers are live, but together hold less than one Singapore-dollar stablecoin.";
    }
    const n = NUMBER_WORDS[data.liveIssuers] ?? String(data.liveIssuers);
    return `Canada has ${n} live issuers, and together they hold less than one Singapore-dollar stablecoin (${sgd.symbol}).`;
  }
  if (sgd) {
    return `Canadian-dollar stablecoins total ${formatUsdExplicit(data.totalUsd, 2)}, more than the largest Singapore-dollar stablecoin (${sgd.symbol}).`;
  }
  return `Canadian-dollar stablecoins total ${formatCad(data.totalCad, 2)} across ${data.coins.length} tokens.`;
}

function RegulationAndTakeaway() {
  return (
    <div className="soc-add-notes">
      <p className="panel-note">
        <strong>Regulation.</strong> {REGULATION_NOTE}
      </p>
      <p className="panel-note">
        <strong>Takeaway.</strong> {TAKEAWAY}
      </p>
    </div>
  );
}

/**
 * Canadian-dollar stablecoins: KPIs, issuer table, 12-month stacked supply, and
 * non-USD stablecoins by currency. Server component; DeFiLlama, revalidated hourly.
 */
export async function CadStablecoinsPanel() {
  const data = await getCadStablecoinData();
  const titleId = 'cad-stablecoins-title';

  if (!data) {
    return (
      <section className="soc-add-section" id="cad-stablecoins" aria-labelledby={titleId}>
        <SectionHead id={titleId} title="Canadian-Dollar Stablecoins" description="Stablecoins pegged to the Canadian dollar, by issuer and chain." />
        <Panel title="CAD Stablecoin Issuers" notes={<Unavailable />}>
          <RegulationAndTakeaway />
        </Panel>
      </section>
    );
  }

  const change30d = data.totalCad30dAgo > 0 ? (data.totalCad - data.totalCad30dAgo) / data.totalCad30dAgo : null;
  const liveSymbols = data.coins.filter((c) => c.isLive).map((c) => c.symbol);
  const issuerNames = Object.fromEntries(data.coins.map((c) => [c.symbol, c.issuer]));
  const cad = data.byCurrency.find((c) => c.code === 'CAD');
  const sgd = data.largestSgdCoin;

  return (
    <section className="soc-add-section" id="cad-stablecoins" aria-labelledby={titleId}>
      <SectionHead id={titleId} title="Canadian-Dollar Stablecoins" description={headline(data)} />

      <div className="kpi-row">
        <Kpi
          label="Total CAD stablecoin supply"
          value={formatCad(data.totalCad, autoDigits(data.totalCad))}
          delta={change30d}
          period={`≈ ${formatUsdExplicit(data.totalUsd, autoDigits(data.totalUsd))} · 30d change`}
        />
        <Kpi
          label="Issuers live"
          value={String(data.liveIssuers)}
          source={`over ${formatCad(MIN_LIVE_SUPPLY_CAD, 0)} in circulation`}
          period={liveSymbols.join(' · ')}
        />
        <Kpi
          label="Chains"
          value={String(data.chainCount)}
          period={data.largestChain ? `${data.largestChain.name} · ${formatPct(data.largestChain.share, 0)} of supply` : undefined}
        />
        <Kpi
          label="Share of all stablecoins"
          value={formatSmallPct(data.shareOfAll, 2)}
          source="CAD ÷ all stablecoins, in USD"
          period={`of ${formatUsd(data.allStablecoinsUsd)} tracked`}
        />
      </div>

      <Panel
        id="cad-issuers"
        title="CAD Stablecoin Issuers"
        caption="RANKED BY CURRENT SUPPLY · 30D CHANGE · SUPPLY (CAD)"
        notes={
          <>
          <p className="panel-note">
            Circulating supply of each Canadian-dollar stablecoin, in Canadian dollars, summed across chains. US-dollar
            values use DeFiLlama&apos;s live CAD price. Source: <a className="soc-add-link" href="https://defillama.com/stablecoins" target="_blank" rel="noreferrer">DeFiLlama</a>.
          </p>
          {data.excluded.length > 0 ? (
            <p className="panel-note">
              Not counted: tokens under {formatCad(MIN_LIVE_SUPPLY_CAD, 0)} in circulation (
              {data.excluded.map((c) => `${c.symbol} by ${c.issuer} on ${c.chains.join(', ') || 'no chain'}, ${formatCad(c.supplyCad, 0)}`).join('; ')}).
            </p>
          ) : null}
          </>
        }
      >
        <div className="ctable soc-add-ctable-cad">
          <div className="ctable-head">
            <span className="soc-add-c-rank">#</span>
            <span className="soc-add-c-name">Stablecoin</span>
            <span className="soc-add-c-chains">Chains</span>
            <span className="soc-add-c-supply num">Supply</span>
            <span className="soc-add-c-delta num">30D</span>
          </div>
          {data.coins.map((coin, i) => (
            <div className="ctable-row" key={coin.id}>
              <span className="soc-add-c-rank lb-rank mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="soc-add-c-name ct-name">
                {coin.symbol}
                <span className="lb-ticker mono">{coin.issuer}</span>
              </span>
              <span className="soc-add-c-chains soc-add-chains mono">{coin.chains.join(' · ')}</span>
              <span className="soc-add-c-supply num soc-add-supply">
                <span className="ct-tvl mono">{formatCad(coin.supplyCad, autoDigits(coin.supplyCad))}</span>
                <span className="soc-add-sub mono">{formatUsdExplicit(coin.supplyUsd, autoDigits(coin.supplyUsd))}</span>
              </span>
              <span className="soc-add-c-delta num">
                {coin.change30d === null ? <span className="lb-tag">NEW</span> : <Delta fraction={coin.change30d} />}
              </span>
            </div>
          ))}
        </div>
        <RegulationAndTakeaway />
      </Panel>

      <div className="grid-2">
        <Panel
          id="cad-supply-over-time"
          title="CAD Supply Over Time"
          caption="LAST 12 MONTHS · DAILY · SUPPLY (CAD)"
          notes={<p className="panel-note">Daily circulating supply, stacked by issuer, oldest at the bottom. DeFiLlama began tracking CADD at its May 2026 launch and QCAD only in July 2026, so the steps show coverage starting, not sudden growth. Source: <a className="soc-add-link" href="https://defillama.com/stablecoins" target="_blank" rel="noreferrer">DeFiLlama</a>.</p>}
        >
          <CadSupplyChart data={data.series} keys={data.seriesKeys} issuers={issuerNames} />
        </Panel>

        <Panel
          id="non-usd-by-currency"
          title="Non-USD Stablecoins by Currency"
          caption="CURRENT · SUPPLY (USD) · SELECTED CURRENCIES"
          notes={
            <p className="panel-note">
              Stablecoins pegged to other major currencies, converted to US dollars. Canada in black.
              {cad && sgd ? ` All CAD stablecoins combined: ${formatUsd(cad.usd, 2)}. ${sgd.symbol} alone: ${formatUsd(sgd.usd, 2)}.` : ''}{' '}
              Source: <a className="soc-add-link" href="https://defillama.com/stablecoins" target="_blank" rel="noreferrer">DeFiLlama</a>.
            </p>
          }
        >
          <HBarCompare
            ariaLabel="Stablecoin supply by currency, in US dollars"
            allowLog
            labelWidth="4ch"
            items={data.byCurrency.map((c) => ({
              key: c.code,
              label: c.code,
              value: c.usd,
              display: formatUsd(c.usd, autoDigits(c.usd)),
              tone: c.code === 'CAD' ? 'ink' : 'mist',
            }))}
          />
        </Panel>
      </div>
    </section>
  );
}
