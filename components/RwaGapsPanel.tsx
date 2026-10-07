import { getRwaGapsData, REAL_ESTATE_EXCLUDED_NOTE } from '../lib/rwaGaps';
import { autoDigits, formatUsd } from '../lib/format';
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

const COINGECKO = (
  <a className="soc-add-link" href="https://www.coingecko.com/en/categories" target="_blank" rel="noreferrer">
    CoinGecko categories
  </a>
);

/**
 * Tokenized assets the CoinGecko-based RWA tracker misses or leaves unlabelled:
 * real estate (empty in the tracker today), stock issuers with no "Managed by" name, and collectibles.
 */
export async function RwaGapsPanel() {
  const data = await getRwaGapsData();
  const issuers = data.categories ?? [];
  const unlabelledTotal = issuers.reduce((acc, c) => acc + c.marketCapUsd, 0);
  const collectibles = data.collectibles;

  return (
    <section className="soc-add-section" aria-labelledby="rwa-gaps-title">
      <SectionHead
        id="rwa-gaps-title"
        title="What the Tokenized Assets Tracker Misses"
        description="The Real Estate filter is empty, some stock tokens have no issuer name, and collectibles are not tracked yet."
      />

      {data.realEstate || data.categories ? (
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
            label="Stocks without an issuer name"
            value={unlabelledTotal > 0 ? formatUsd(unlabelledTotal) : '—'}
            source="CoinGecko categories · market cap"
            period={issuers.length ? `${issuers.length} issuers` : undefined}
          />
          <Kpi
            label="Collectibles traded, 30d"
            value={collectibles ? formatUsd(collectibles.volume30dUsd) : '—'}
            source="DeFiLlama · Physical TCG volume"
            period={collectibles ? `${collectibles.platforms.length} platforms` : undefined}
          />
        </div>
      ) : null}

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
                <span className="soc-add-g-name ct-name">
                  {r.name}
                  <span className="lb-ticker mono">{r.chain}</span>
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
        title="Stock Issuers Without a Name"
        caption="CURRENT · MARKET CAP (USD) · COINGECKO CATEGORIES"
        notes={
          <p className="panel-note">
            Many of these tokens appear in the tracker&apos;s table with a blank &quot;Managed by&quot;. CoinGecko groups them by
            issuer, so the name can be filled from the category id. Market cap covers each issuer&apos;s whole category,
            stocks and ETFs. Source: {COINGECKO}.
          </p>
        }
      >
        {data.categories ? (
          <div className="ctable soc-add-ctable-gaps">
            <div className="ctable-head">
              <span className="soc-add-g-rank">#</span>
              <span className="soc-add-g-name">Issuer</span>
              <span className="soc-add-g-what">Why it matters</span>
              <span className="soc-add-g-value num">Market cap</span>
            </div>
            {issuers.map((c, i) => (
              <div className="ctable-row" key={c.id}>
                <span className="soc-add-g-rank lb-rank mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="soc-add-g-name ct-name">{c.label}</span>
                <span className="soc-add-g-what soc-add-chains">
                  {c.note} <span className="mono soc-add-sub">CoinGecko id: {c.id}</span>
                </span>
                <span className="soc-add-g-value num ct-tvl mono">
                  {formatUsd(c.marketCapUsd, autoDigits(c.marketCapUsd))}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Unavailable />
        )}
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
                <span className="soc-add-g-name ct-name">{p.name}</span>
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
