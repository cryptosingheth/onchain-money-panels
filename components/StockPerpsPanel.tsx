import { getStockPerpsData } from '../lib/hyperliquid';
import { getGeckoCategoryMarketCap } from '../lib/rwaGaps';
import { autoDigits, formatUsd } from '../lib/format';
import { HBarCompare } from './charts/HBarCompare';
import { Kpi, Panel, SectionHead, Unavailable } from './parts';

/** Human names for Hyperliquid HIP-3 deployers seen in the data. */
const VENUE: Record<string, string> = { xyz: 'trade.xyz', io: 'EntropyIO', para: 'Paragon', mkts: 'Kinetiq', km: 'Kinetiq' };

const HL = (
  <a className="soc-add-link" href="https://app.hyperliquid.xyz/trade" target="_blank" rel="noreferrer">
    Hyperliquid info API
  </a>
);

const CG = (
  <a className="soc-add-link" href="https://www.coingecko.com/en/categories/tokenized-stock" target="_blank" rel="noreferrer">
    CoinGecko
  </a>
);

/**
 * On-chain stock exposure two ways: tokenized stocks (tokens that exist) vs stock perps (contracts).
 * Perps are not tokenized assets, so they sit beside the tracker rather than inside it.
 */
export async function StockPerpsPanel() {
  const [perps, tokenizedStocksUsd] = await Promise.all([
    getStockPerpsData(),
    getGeckoCategoryMarketCap('tokenized-stock'),
  ]);

  const stockOi = perps?.oiByBucket.stocks ?? 0;
  const top = perps?.markets.filter((m) => m.bucket === 'stocks').slice(0, 10) ?? [];

  return (
    <section className="soc-add-section" aria-labelledby="stock-perps-title">
      <SectionHead
        id="stock-perps-title"
        title="Stock Exposure: Tokens vs Perps"
        description={
          perps && tokenizedStocksUsd && stockOi > tokenizedStocksUsd
            ? 'Tokenized stocks are real tokens. Stock perps are contracts that track a share price, and on Hyperliquid alone they now hold more open interest than every tokenized stock is worth.'
            : 'Tokenized stocks are real tokens. Stock perps are contracts that track a share price. Both give on-chain exposure to listed companies.'
        }
      />

      <div className="kpi-row">
        <Kpi
          label="Tokenized stocks"
          value={tokenizedStocksUsd ? formatUsd(tokenizedStocksUsd) : '—'}
          source="CoinGecko · market cap"
          period="all issuers"
        />
        <Kpi
          label="Stock perps open interest"
          value={perps ? formatUsd(stockOi) : '—'}
          source="Hyperliquid HIP-3 · notional"
          period={perps ? `${perps.stockMarketCount} markets` : undefined}
        />
        <Kpi
          label="Stock perps traded, 24h"
          value={perps ? formatUsd(perps.stockVolume24hUsd) : '—'}
          source="Hyperliquid HIP-3 · notional"
          period="rolling 24h"
        />
        <Kpi
          label="Commodity perps open interest"
          value={perps ? formatUsd(perps.oiByBucket.commodities) : '—'}
          source="Hyperliquid HIP-3 · notional"
          period="gold, silver, oil, gas…"
        />
      </div>

      <Panel
        id="stock-perps-compare"
        title="Tokens vs Contracts"
        caption="CURRENT · USD · LIVE"
        notes={
          <>
            <p className="panel-note">
              A perp is a contract settled in USDC that tracks a share price. No share or token sits behind it, so it is
              exposure, not a tokenized asset, and it stays out of tokenized AUM. Spot tokenized stocks (xStocks, bStocks,
              Backpack, Ondo) are already in the market cap. Sources: {CG}, {HL}.
            </p>
            <p className="panel-note">
              Open interest is one side of the book, at the mark price. Markets are sorted into stocks, commodities and FX
              by symbol; stocks include equity indices, equity ETFs and pre-IPO names. Other perp venues are not counted.
            </p>
          </>
        }
      >
        {perps && tokenizedStocksUsd ? (
          <HBarCompare
            ariaLabel="Tokenized stock market cap vs stock perp open interest, in US dollars"
            labelWidth="18ch"
            items={[
              { key: 'tokens', label: 'Tokenized stocks', value: tokenizedStocksUsd, display: formatUsd(tokenizedStocksUsd), tone: 'slate' },
              { key: 'perps', label: 'Stock perps OI', value: stockOi, display: formatUsd(stockOi), tone: 'ink' },
            ]}
          />
        ) : (
          <Unavailable />
        )}
      </Panel>

      <Panel
        id="stock-perps-markets"
        title="Largest Stock Perp Markets"
        caption="RANKED BY OPEN INTEREST · USD · LIVE"
        notes={<p className="panel-note">Hyperliquid builder-deployed markets (HIP-3). Source: {HL}.</p>}
      >
        {top.length ? (
          <div className="ctable soc-add-ctable-gaps">
            <div className="ctable-head">
              <span className="soc-add-g-rank">#</span>
              <span className="soc-add-g-name">Market</span>
              <span className="soc-add-g-what">24h traded</span>
              <span className="soc-add-g-value num">Open interest</span>
            </div>
            {top.map((m, i) => (
              <div className="ctable-row" key={`${m.dex}:${m.symbol}`}>
                <span className="soc-add-g-rank lb-rank mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="soc-add-g-name soc-add-wrap">
                  <span className="soc-add-strong">{m.symbol}</span>
                  <span className="soc-add-sub mono">{VENUE[m.dex] ?? m.dex}</span>
                </span>
                <span className="soc-add-g-what soc-add-chains mono">{formatUsd(m.volume24hUsd, autoDigits(m.volume24hUsd))}</span>
                <span className="soc-add-g-value num ct-tvl mono">
                  {formatUsd(m.openInterestUsd, autoDigits(m.openInterestUsd))}
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
