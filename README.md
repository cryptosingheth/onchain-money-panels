# On-chain Money Panels

Drop-in dashboard panels on Canadian-dollar stablecoins, real stablecoin use, AI-agent payments and tokenized
assets. Built as a proposed contribution to [State of Crypto](https://stateofcrypto.sanjeevarora.net/), and designed
to drop into it with minimal effort.

**Live preview:** https://cryptosingheth.github.io/onchain-money-panels/ (rebuilt daily, so the live data stays current)

The panels reuse State of Crypto's own class names (`kpi-row`, `panel`, `seg`, `ctable`, `delta`...), so
they inherit its styles. Only a few new rules ship, all prefixed `soc-add-`.

Next.js 14 App Router, TypeScript, Recharts. Free, keyless data sources only.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm run start
STATIC_EXPORT=1 npm run build   # static site in out/ (what the GitHub Pages preview serves)
```

## What each panel shows, and why

**1. Canadian-dollar stablecoins** (`components/CadStablecoinsPanel.tsx`, live)
Total CAD stablecoin supply, live issuers, chains, share of all stablecoins, an issuer table, 12 months of stacked
supply, and non-USD stablecoins by currency. Why: Canada now has three live issuers and a new Stablecoin Act, and
no dashboard shows the CAD market in Canadian dollars.

**2. Trading vs on-chain use** (`components/TradingVsPaymentsPanel.tsx`, curated)
Raw on-chain stablecoin volume vs adjusted transfer volume vs retail-sized volume (Visa Onchain Analytics), with a
linear/log toggle. Why: a "monthly trading volume" figure is exchange trading, not use; this panel puts the three
on-chain numbers side by side.

**3. Agent payments** (`components/AgentPaymentsPanel.tsx`, curated)
x402 + MPP agent payments: organic volume, transactions, median payment, buyer wallets, and three plain lines on
what the data says. Why: agent payments are a new stablecoin use case, and the honest picture is "real, small,
micro".

**4. RWA exclude utility** (`lib/rwa.ts` + `components/RwaExcludeDemo.tsx`)
`excludeAssets(rows, ids)`, `shareByIssuerType(rows)` and `shareByCategory(rows)` recompute the Tokenized Assets
shares with chosen assets set aside, plus a static Include/Exclude Figure HELOC demo. Why: Figure's HELOC token is
over half of on-chain tokenized AUM, so it decides most of the headline shares.

**5. What the tokenized-assets tracker misses** (`components/RwaGapsPanel.tsx`, live)
Tokenized real estate by platform (DeFiLlama TVL), stock tokens whose issuer is not named (CoinGecko categories:
Binance bStocks, Robinhood, Remora rStocks), and tokenized collectibles (DeFiLlama 30-day volume). Why: a
CoinGecko-only RWA tracker shows an empty Real Estate bucket, because property tokens are issued one per building
and are rarely listed.

## Data endpoints

| Panel | Endpoint | Key | Cache |
|---|---|---|---|
| CAD | `GET https://stablecoins.llama.fi/stablecoins?includePrices=true` | none | `revalidate: 3600` |
| CAD | `GET https://stablecoins.llama.fi/stablecoin/{id}` for each `pegType === "peggedCAD"` asset | none | `revalidate: 3600` |
| Trading vs payments | Curated: https://visaonchainanalytics.com/transactions | n/a | static |
| Agent payments | Curated: https://visaonchainanalytics.com/agentic-payments and https://www.visa.com/en-us/thought-leadership/innovation/agentic-payments-from-the-ground-up | n/a | static |
| RWA demo | Curated: published totals from https://stateofcrypto.sanjeevarora.net/rwa | n/a | static |
| Tracker gaps: real estate | `GET https://api.llama.fi/tvl/{slug}` for realt-tokens, lofty, estate-protocol, binaryx-platform, propbase, realtyx, landshare | none | `revalidate: 3600` |
| Tracker gaps: issuers | `GET https://api.coingecko.com/api/v3/coins/categories` (ids bstocks-ecosystem, robinhood-chain-stocks-ecosystem, remora-markets-tokenized-rstocks) | none | `revalidate: 3600` |
| Tracker gaps: collectibles | `GET https://api.llama.fi/overview/dexs` filtered to `category === "Physical TCG"`, `total30d` | none | `revalidate: 3600` |

Not used on purpose: CoinGecko's `real-estate` category (it holds platform and governance tokens, not property
value) and its `trading-card-rwa-platform` category (mostly one platform token, not card value).

If DeFiLlama is unreachable, the CAD panel renders "Data temporarily unavailable." in a `panel-note` and keeps
the regulation and takeaway notes. Nothing throws.

## How to drop into State of Crypto

1. Copy these folders into the repo root, next to `app/`:
   - `components/` (the four panels, `parts.tsx`, and `charts/`)
   - `lib/` (`defillama.ts`, `rwa.ts`, `format.ts`, `artemis.ts`)
   - `data/curated.ts`
   - `styles/additions.css`. **Do not copy `styles/tokens.css`**; it mirrors his existing CSS for the preview only.
2. Import the stylesheet once, in `app/layout.tsx`: `import '../styles/additions.css';`
3. Add the panels to `app/stablecoins/page.tsx`:

   ```tsx
   import { CadStablecoinsPanel } from '../../components/CadStablecoinsPanel';
   import { TradingVsPaymentsPanel } from '../../components/TradingVsPaymentsPanel';
   import { AgentPaymentsPanel } from '../../components/AgentPaymentsPanel';

   // inside the page's <div className="dash-section">, after the existing panels:
   <CadStablecoinsPanel />
   <TradingVsPaymentsPanel />
   <AgentPaymentsPanel />
   ```

   `AgentPaymentsPanel` could equally sit on `/web3-economics`. For the RWA page, use `excludeAssets` and
   `shareByIssuerType` from `lib/rwa.ts` with his live asset rows (see below); `RwaExcludeDemo` is optional.
4. Dependencies: only `recharts`, which the site already uses. Imports are relative, so no path alias is needed.
   The components should also work on Next 15/16 (server components with `fetch(..., { next: { revalidate } })`).

Notes for the merge:
- Panel titles inside each section are `h3` (each section heading is an `h2.sh-subtitle`).
- His log-scale control on the supply chart is the `.toggle` switch; these panels use his `seg`/`seg-btn` pattern
  (Linear / Log), as briefed. Swapping is a few lines in `components/charts/HBarCompare.tsx`.
- Charts use monochrome greys; his main charts use colour. Change `GREYS` in `CadSupplyChart.tsx` if he prefers.

### Using the RWA utility with live rows

```ts
import { excludeAssets, shareByIssuerType, shareByCategory, FIGURE_HELOC_ID, type RwaRow } from '../lib/rwa';

const rows: RwaRow[] = assets.map((a) => ({
  id: a.coingeckoId,           // e.g. 'figure-heloc'
  valueUsd: a.marketCapUsd,
  issuerType: a.issuerType,    // 'tradfi-issued' | 'crypto-wrapped' | 'crypto-native'
  category: a.category,        // 'private-credit' | 'treasuries-mmf' | 'metals-commodities' | 'stocks' | 'etfs' | ...
}));

const exFigure = excludeAssets(rows, [FIGURE_HELOC_ID]);
shareByIssuerType(exFigure); // { totalUsd, shares: [{ key, valueUsd, share }] }
shareByCategory(exFigure);   // largest first
```

Figure HELOC's CoinGecko id is **`figure-heloc`** (symbol `FIGR_HELOC`), from
`https://api.coingecko.com/api/v3/search?query=figure%20heloc` on 6 Oct 2026.

### Worked examples (published totals, 6 Oct 2026)

Inputs: total $43.3B; Figure HELOC $24.4B (private credit, crypto-native); TradFi-issued $2.6B; crypto-wrapped
$3.1B; crypto-native $37.6B; Treasuries & MMF $9.5B; Metals $6.1B; Stocks $2.6B; ETFs $0.668B.

| | Including Figure | Excluding Figure |
|---|---|---|
| Total (issuer-type basis) | $43.3B | **$18.9B** |
| TradFi-issued | 6.0% | **13.8%** (2.6 / 18.9) |
| Crypto-wrapped | 7.2% | **16.4%** (3.1 / 18.9) |
| Crypto-native | 86.8% | **69.8%** (13.2 / 18.9) |
| Largest category | Private Credit 56.4% | **Treasuries & MMF 50.3%** (9.5 / 18.87) |

```ts
const ex = excludeAssets(DEMO_ROWS, ['figure-heloc']);
shareByIssuerType(ex).totalUsd;           // 18.9e9
shareByIssuerType(ex).shares[0].share;    // ~0.138 (tradfi-issued)
shareByIssuerType(ex).shares[1].share;    // ~0.164 (crypto-wrapped)
shareByIssuerType(ex).shares[2].share;    // ~0.698 (crypto-native)
shareByCategory(ex).shares[0];            // { key: 'treasuries-mmf', share: ~0.503 }
```

Rounding: the published category totals sum to $43.27B, so the category basis ex-Figure is $18.87B. Shares from
rounded inputs can differ from the live page by 0.1 points. Figures move daily; refresh `data/curated.ts`.

## Data notes

### DeFiLlama CAD units: which field is CAD and which is USD

The list endpoint and the per-coin endpoint disagree at first sight (CADC: about 1.70M vs about 2.45M). They are
in different units:

| Field | Units | CADC on 6 Oct 2026 |
|---|---|---|
| List `circulating.peggedCAD` | **US dollars** (native supply x DeFiLlama's live price), despite the key name | 1,704,316 |
| Per-coin `currentChainBalances[*].peggedCAD` | **Canadian dollars** (native token units), live | 2,450,996 |
| Per-coin `tokens[].circulating.peggedCAD` | **Canadian dollars**, daily snapshot | 2,450,996 |

Evidence:
- List / per-coin = the list's `price` field for every coin: CADC 1,704,316 / 2,450,996 = 0.6954 (price 0.6954);
  QCAD 1,742,376 / 2,476,198 = 0.7036 (price 0.7036); CADD 869,180 / 1,236,558 = 0.7029 (price 0.7029).
- The list's `circulatingPrevDay` equals the last daily `tokens[]` value x price (QCAD: 2,126,198 x 0.7036 =
  1,496,099), so the list converts both live and historical values.
- The same holds for other pegs: EURC shows $478.9M in the list, which is the USD value, and the `chains[]` block
  of the list endpoint labels the same totals `totalCirculatingUSD`.
- Per-coin balances match on-chain `totalSupply()` exactly (read 6 Oct 2026 via public RPCs): CADC Ethereum
  852,314.74, CADC Base 1,515,011.41, QCAD Ethereum 2,474,172.34, CADD Ethereum 785,103.04, CADD Base 451,455.30.

What the panel uses:
- **CAD values**: per-coin `currentChainBalances` (live, native CAD), summed across chains.
- **History and 30-day change**: per-coin `tokens[]` (daily, native CAD). The chart's final day is set to the live
  balance, because the daily snapshot can lag (on 6 Oct, QCAD's snapshot was 2,126,198 while the live balance was
  2,476,198 after a 350,000 mint).
- **USD equivalents and share of all stablecoins**: list `circulating` values, which are already USD. Share =
  CAD USD total / sum of every asset's `circulating` in the same response. Non-USD-by-currency also sums the list.

CoinGecko differs for reasons that are not about units: QCAD (2.47M) matches DeFiLlama; CADD shows 1.32M vs
1.24M on-chain; CADC shows 1.38M vs 2.45M on-chain across four chains. CoinGecko's CADC supply appears not to
count all chains; the on-chain reads above support DeFiLlama's figure.

Other choices:
- "Issuers live" counts coins above `MIN_LIVE_SUPPLY_CAD` (C$50,000, in `lib/defillama.ts`). CADm (Mento, about
  C$1K) is shown in the table but not counted.
- Issuer names are not a DeFiLlama field; they are mapped by DeFiLlama id in `lib/defillama.ts`
  (424 Stablecorp, 145 Paytrie, 387 Tetra Trust, 360 Mento).
- "Non-USD stablecoins by currency" compares EUR, JPY, CHF, BRL (`peggedREAL`), GBP, AUD, SGD and CAD, as briefed.
  It leaves out the ruble peg (about $552M, larger than everything but EUR); edit `COMPARED_CURRENCIES` to add it.
- The headline "Canada's three CAD stablecoin issuers are live, but together hold less than one Singapore-dollar
  stablecoin" renders only when the live data supports it (three live issuers, CAD total below the largest
  SGD-pegged coin, XSGD). Otherwise a factual fallback is written from the numbers.

### Curated figures and as-of dates (`data/curated.ts`)

| Figure | Value | Window | As of | Source |
|---|---|---|---|---|
| Stablecoin transaction volume | $6.1T | last 30 days | viewed 2026-10-06 | Visa Onchain Analytics, Transactions |
| Adjusted transaction volume | $318.6B | last 30 days | viewed 2026-10-06 | same |
| Transaction count / adjusted | 1.7B / 166.3M | last 30 days | viewed 2026-10-06 | same |
| Retail-sized volume / count | $7.7B / 171.7M | last 30 days | viewed 2026-10-06 | same |
| Agentic volume, total / organic | $55.8M / $31.9M | all time | viewed 2026-10-06 | Visa Onchain Analytics, Agentic Payments (x402 + MPP) |
| Agentic transactions | 286.4M | all time | viewed 2026-10-06 | same |
| Median agentic transaction | $0.01 | all time | viewed 2026-10-06 | same |
| Buyer / merchant wallets | 1.0M / 360.0K | all time | viewed 2026-10-06 | same |
| x402 adjusted volume / transactions | about $15.0M / 109.6M | May 2025 to 21 Apr 2026 | published 2026-07-14 | Visa x Artemis, "Agentic payments from the ground up" |
| MPP volume / transactions | about $25,000 / about 115,000 | first weeks after mid-March 2026 | published 2026-07-14 | same |
| Main chains for agent payments | Base, Solana, Polygon | to 21 Apr 2026 | published 2026-07-14 | same |
| RWA published totals | see worked examples | current | 2026-10-06 | stateofcrypto.sanjeevarora.net/rwa |

Refresh steps:
1. Open https://visaonchainanalytics.com/transactions (30-day view) and /agentic-payments (all time).
2. Update the values and `asOf` in `data/curated.ts`. Every panel reads from there; no copy needs editing,
   except the hard-coded "one cent" median label in `AgentPaymentsPanel.tsx` if the median changes.
3. If the Visa x Artemis report is updated, change `X402_ANALYSIS` (values, `asOf`, `published`).
4. Regulatory status: update `REGULATION_NOTE` in `CadStablecoinsPanel.tsx` when the Stablecoin Act comes into
   force.

### Artemis (optional, stub)

`ARTEMIS_API_KEY` is read by `lib/artemis.ts`, but the function returns `null` and the panel keeps the Visa figures.
Reason: the briefed metric, `ARTEMIS_STABLECOIN_TRANSFER_VOLUME` (Artemis-filtered, i.e. adjusted), is being
sunset. Its API reference page now returns 404, and Artemis' "Stablecoin Metrics Methodology - July 2026"
(https://artemis.ai/docs/data-reference/stablecoin-methodology) says the `ARTEMIS_*` and `P2P_*` stablecoin flavours
are no longer supported, and that `STABLECOIN_TRANSFER_VOLUME` is now gross (only mints and burns excluded). The
documented base endpoint is `GET https://data-svc.artemisxyz.com/data/api/STABLECOIN_TRANSFER_VOLUME/` with an
`APIKey` query parameter, but gross volume is not comparable to the adjusted figure, so it is not wired in.

### Regulation note

"Canada's Stablecoin Act (Bill C-15) received Royal Assent on 26 Mar 2026. It is not yet in force; the Bank of
Canada will supervise issuers once regulations are finalised (expected 2027)." Supplied with the brief; check
against the Department of Finance or Bank of Canada before publishing.

## Preview app

`app/page.tsx` renders all four sections with his container/dash-section layout. `styles/tokens.css` holds his
tokens and a mirror of the existing rules the panels rely on (preview only). Light mode only, as on his site, and
responsive down to 375px with no horizontal scroll.

The preview pins Next 14.2.35, the latest 14.x. `npm audit` reports advisories against all Next 14 releases that
are fixed only in newer majors. That matters for this local preview only; in his repo the components run on his
Next version.

## Credit

Built by Opinder Preet Singh as a contribution to State of Crypto by Sanjeev Arora. Data: DeFiLlama; Visa Onchain
Analytics (Allium); Visa x Artemis. MIT licence.
