import { TRACKER_UNNAMED as U } from '../data/curated';
import { getRwaGapsData, REAL_ESTATE_EXCLUDED_NOTE } from '../lib/rwaGaps';
import { autoDigits, formatDate, formatUsd } from '../lib/format';
import { Kpi, Panel, SectionHead, Unavailable } from './parts';

const DEFILLAMA = (
  <a className="soc-add-link" href="https://defillama.com/rwa/category/real-estate" target="_blank" rel="noreferrer">
    DeFiLlama
  </a>
);

const DEFILLAMA_TCG = (
  <a className="soc-add-link" href="https://defillama.com/protocols/physical-tcg" target="_blank" rel="noreferrer">
    DeFiLlama
  </a>
);

const TRACKER = (
  <a className="soc-add-link" href={U.sourceUrl} target="_blank" rel="noreferrer">
    the tracker&apos;s own table
  </a>
);

/**
 * Tokenized assets the CoinGecko-based RWA tracker misses or leaves unlabelled:
 * real estate (empty in the tracker today), tokens with no "Managed by" name, and collectibles.
 */
export async function RwaGapsPanel() {
  const data = await getRwaGapsData();
  const collectibles = data.collectibles;

  return (
    <section className="soc-add-section" aria-labelledby="rwa-gaps-title">
      <SectionHead
        id="rwa-gaps-title"
        title="What the Tokenized Assets Tracker Misses"
        description={`The Real Estate filter is empty, ${U.unnamedTokens} tokens have no issuer name, and collectibles are not tracked yet.`}
      />

      <div className="kpi-row">
        <Kpi
          label="Tokenized real estate"
          value={data.realEstateTotalUsd ? formatUsd(data.realEstateTotalUsd) : '—'}
          source="DeFiLlama · TVL"
          period={data.realEstate ? `${data.realEstate.length} platforms` : undefined}
        />
        <Kpi
          label="Largest platform"
          value={data.realEstate?.[0] ? formatUsd(data.realEstate[0].tvlUsd) : '—'}
          source="DeFiLlama · TVL"
          period={data.realEstate?.[0]?.name}
        />
        <Kpi
          label="Tokens without an issuer"
          value={formatUsd(U.unnamedValueUsd)}
          source={`${U.unnamedTokens} of ${U.totalTokens} tokens · tracker table`}
          period={`as of ${formatDate(U.asOf)}`}
        />
        <Kpi
          label="Collectibles traded, 30d"
          value={collectibles ? formatUsd(collectibles.volume30dUsd) : '—'}
          source="DeFiLlama · Physical TCG volume"
          period={collectibles ? `${collectibles.platforms.length} platforms` : undefined}
        />
      </div>

      <Panel
        id="rwa-real-estate"
        title="Tokenized Real Estate"
        caption="RANKED BY TVL · USD · LIVE"
        notes={
          <>
            <p className="panel-note">
              Property tokens are issued one per home or building, so CoinGecko lists few of them and the tracker&apos;s
              Real Estate filter shows nothing. DeFiLlama tracks the platforms directly. Source: {DEFILLAMA}.
            </p>
            <p className="panel-note">{REAL_ESTATE_EXCLUDED_NOTE}</p>
          </>
        }
      >
        {data.realEstate ? (
          <div className="ctable soc-add-ctable-gaps">
            <div className="ctable-head">
              <span className="soc-add-g-rank">#</span>
              <span className="soc-add-g-name">Platform</span>
              <span className="soc-add-g-what">What is tokenized</span>
              <span className="soc-add-g-value num">TVL</span>
            </div>
            {data.realEstate.map((r, i) => (
              <div className="ctable-row" key={r.slug}>
                <span className="soc-add-g-rank lb-rank mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="soc-add-g-name soc-add-wrap">
                  <span className="soc-add-strong">{r.name}</span>
                  <span className="soc-add-sub mono">{r.chain}</span>
                </span>
                <span className="soc-add-g-what soc-add-chains">{r.what}</span>
                <span className="soc-add-g-value num ct-tvl mono">{formatUsd(r.tvlUsd, autoDigits(r.tvlUsd))}</span>
              </div>
            ))}
          </div>
        ) : (
          <Unavailable />
        )}
      </Panel>

      <Panel
        id="rwa-unlabelled"
        title="Tokens Without an Issuer Name"
        caption="TRACKER TABLE · GROUPED BY ISSUER · CURATED"
        notes={
          <p className="panel-note">
            {U.unnamedTokens} of the {U.totalTokens} tokens in {TRACKER} show a blank &quot;Managed by&quot;, worth{' '}
            {formatUsd(U.unnamedValueUsd, 2)}. Most come from a few stock-token issuers, and each token&apos;s CoinGecko id
            already names the issuer, so the column can be filled automatically. Read {formatDate(U.asOf)}.
          </p>
        }
      >
        <div className="ctable soc-add-ctable-issuers">
          <div className="ctable-head">
            <span className="soc-add-i-rank">#</span>
            <span className="soc-add-i-name">Issuer</span>
            <span className="soc-add-i-how">How to label it</span>
            <span className="soc-add-i-count num">Tokens</span>
            <span className="soc-add-i-value num">Value</span>
          </div>
          {U.issuers.map((r, i) => (
            <div className="ctable-row" key={r.label}>
              <span className="soc-add-i-rank lb-rank mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="soc-add-i-name soc-add-wrap">
                <span className="soc-add-strong">{r.label}</span>
                <span className="soc-add-sub mono">
                  {r.chain} · {r.examples}
                </span>
              </span>
              <span className="soc-add-i-how soc-add-chains mono">{r.idHint}</span>
              <span className="soc-add-i-count num mono">{r.tokens}</span>
              <span className="soc-add-i-value num ct-tvl mono">{formatUsd(r.valueUsd, autoDigits(r.valueUsd))}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        id="rwa-collectibles"
        title="Tokenized Collectibles"
        caption="LAST 30 DAYS · TRADING VOLUME (USD) · LIVE"
        notes={
          <p className="panel-note">
            Graded trading cards held in vaults and traded as tokens. This is trading volume, not the value of cards held,
            and pack-opening and buyback loops inflate it. No feed reports vault value yet. Source: {DEFILLAMA_TCG}.
          </p>
        }
      >
        {collectibles ? (
          <div className="ctable soc-add-ctable-gaps">
            <div className="ctable-head">
              <span className="soc-add-g-rank">#</span>
              <span className="soc-add-g-name">Platform</span>
              <span className="soc-add-g-what">Chains</span>
              <span className="soc-add-g-value num">30d volume</span>
            </div>
            {collectibles.platforms.slice(0, 5).map((p, i) => (
              <div className="ctable-row" key={p.name}>
                <span className="soc-add-g-rank lb-rank mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="soc-add-g-name soc-add-wrap">
                  <span className="soc-add-strong">{p.name}</span>
                </span>
                <span className="soc-add-g-what soc-add-chains mono">{p.chains.slice(0, 3).join(' · ')}</span>
                <span className="soc-add-g-value num ct-tvl mono">
                  {formatUsd(p.volume30dUsd, autoDigits(p.volume30dUsd))}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Unavailable />
        )}
      </Panel>
    </section>
  );
}
