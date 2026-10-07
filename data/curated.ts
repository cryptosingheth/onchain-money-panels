/**
 * Hand-maintained figures. Neither source has a public API, so every number carries
 * its window, the date it was read, and a source URL. Refresh steps: README "Data notes".
 */

export interface CuratedFigure {
  value: number;
  unit: 'usd' | 'count';
  /** Time window the figure covers, as the source states it. */
  window: string;
  /** ISO date the figure was read, or the source's own data cut-off. */
  asOf: string;
  /** Publication date, when it differs from the data cut-off. */
  published?: string;
  source: string;
  sourceUrl: string;
}

// ---------------------------------------------------------------------------
// Visa Onchain Analytics (powered by Allium) - Transactions tab, last 30 days
// ---------------------------------------------------------------------------

const VISA_TX = {
  window: 'Last 30 days',
  asOf: '2026-10-06',
  source: 'Visa Onchain Analytics (Allium)',
  sourceUrl: 'https://visaonchainanalytics.com/transactions',
} as const;

export const STABLECOIN_PAYMENTS = {
  totalVolume: { ...VISA_TX, value: 6.1e12, unit: 'usd' },
  adjustedVolume: { ...VISA_TX, value: 318.6e9, unit: 'usd' },
  totalCount: { ...VISA_TX, value: 1.7e9, unit: 'count' },
  adjustedCount: { ...VISA_TX, value: 166.3e6, unit: 'count' },
  retailVolume: { ...VISA_TX, value: 7.7e9, unit: 'usd' },
  retailCount: { ...VISA_TX, value: 171.7e6, unit: 'count' },
} satisfies Record<string, CuratedFigure>;

// ---------------------------------------------------------------------------
// Visa Onchain Analytics - Agentic Payments tab (x402 + MPP), all time
// ---------------------------------------------------------------------------

const VISA_AGENTIC = {
  window: 'All time',
  asOf: '2026-10-06',
  source: 'Visa Onchain Analytics (Allium)',
  sourceUrl: 'https://visaonchainanalytics.com/agentic-payments',
} as const;

export const AGENT_PAYMENTS = {
  totalVolume: { ...VISA_AGENTIC, value: 55.8e6, unit: 'usd' },
  organicVolume: { ...VISA_AGENTIC, value: 31.9e6, unit: 'usd' },
  totalTransactions: { ...VISA_AGENTIC, value: 286.4e6, unit: 'count' },
  medianTransaction: { ...VISA_AGENTIC, value: 0.01, unit: 'usd' },
  buyerWallets: { ...VISA_AGENTIC, value: 1.0e6, unit: 'count' },
  merchantWallets: { ...VISA_AGENTIC, value: 360.0e3, unit: 'count' },
} satisfies Record<string, CuratedFigure>;

// ---------------------------------------------------------------------------
// Visa x Artemis, "Agentic payments from the ground up" (primary source)
// Published 14 Jul 2026, data cut-off 21 Apr 2026.
// ---------------------------------------------------------------------------

const VISA_ARTEMIS = {
  asOf: '2026-04-21',
  published: '2026-07-14',
  source: 'Visa x Artemis, "Agentic payments from the ground up"',
  sourceUrl: 'https://www.visa.com/en-us/thought-leadership/innovation/agentic-payments-from-the-ground-up',
} as const;

export const X402_ANALYSIS = {
  /** Excludes identified wash and test activity. */
  x402AdjustedVolume: { ...VISA_ARTEMIS, window: 'May 2025 to 21 Apr 2026', value: 15.0e6, unit: 'usd' },
  x402AdjustedTransactions: { ...VISA_ARTEMIS, window: 'May 2025 to 21 Apr 2026', value: 109.6e6, unit: 'count' },
  mppVolume: { ...VISA_ARTEMIS, window: 'First weeks after mid-March 2026', value: 25_000, unit: 'usd' },
  mppTransactions: { ...VISA_ARTEMIS, window: 'First weeks after mid-March 2026', value: 115_000, unit: 'count' },
  /** Chains where activity is concentrated, as the report names them. */
  mainChains: ['Base', 'Solana', 'Polygon'],
  /** The report gives no exact figure, only "a fraction of a cent". */
  averagePayment: 'a fraction of a cent',
} satisfies Record<string, CuratedFigure | readonly string[] | string>;

// ---------------------------------------------------------------------------
// State of Crypto /rwa - published totals used by the static RWA demo
// ---------------------------------------------------------------------------

export const RWA_PUBLISHED = {
  asOf: '2026-10-06',
  source: 'State of Crypto, Tokenized Assets (Uniblock - CoinGecko)',
  sourceUrl: 'https://stateofcrypto.sanjeevarora.net/rwa',
  totalUsd: 43.3e9,
  figureHelocUsd: 24.4e9,
  issuerType: {
    tradfiIssued: 2.6e9,
    cryptoWrapped: 3.1e9,
    cryptoNative: 37.6e9,
  },
  category: {
    privateCredit: 24.4e9,
    treasuriesMmf: 9.5e9,
    metalsCommodities: 6.1e9,
    stocks: 2.6e9,
    etfs: 0.668e9,
  },
} as const;

// ---------------------------------------------------------------------------
// State of Crypto /rwa - tokens listed with a blank "Managed by", grouped by issuer.
// Read from the page's own token table (784 tokens) on 7 Oct 2026. The issuer can be filled
// from each token's CoinGecko id, which carries the issuer (e.g. "nvidia-bstocks").
// ---------------------------------------------------------------------------

export const TRACKER_UNNAMED = {
  asOf: '2026-10-07',
  source: 'State of Crypto, Tokenized Assets table',
  sourceUrl: 'https://stateofcrypto.sanjeevarora.net/rwa',
  totalTokens: 784,
  unnamedTokens: 350,
  unnamedValueUsd: 1253.7e6,
  issuers: [
    {
      label: 'Binance bStocks',
      chain: 'BNB Chain',
      tokens: 76,
      valueUsd: 641.7e6,
      examples: 'SPCXB, MSTRB, MUB, NVDAB',
      idHint: 'id ends in "-bstocks" · category bstocks-ecosystem',
    },
    {
      label: 'Robinhood stock tokens',
      chain: 'Robinhood Chain',
      tokens: 72,
      valueUsd: 142.5e6,
      examples: 'SPY, NVDA, SPCX, GLD',
      idHint: 'id contains "robinhood" · category robinhood-chain-stocks-ecosystem',
    },
    {
      label: 'Remora / Reality rStocks',
      chain: 'Arbitrum',
      tokens: 138,
      valueUsd: 123.9e6,
      examples: 'RMSTR, RSPCX, RINTC, RMU',
      idHint: 'id ends in "-rstock" · category remora-markets-tokenized-rstocks',
    },
    {
      label: 'Coinbase tokenized stocks',
      chain: 'Base',
      tokens: 13,
      valueUsd: 29.0e6,
      examples: 'NVDAC, METAC, GOOGLC, AAPLC',
      idHint: 'id ends in "-coinbase-tokenized-stock"',
    },
    {
      label: 'Backpack Securities',
      chain: 'Solana',
      tokens: 23,
      valueUsd: 19.1e6,
      examples: 'SPCX, SKHY, SNDK, BOT',
      idHint: 'id ends in "-backpack-securities" · category backpack-securities-ecosystem',
    },
    {
      label: 'Anchored and ST0x',
      chain: 'various',
      tokens: 4,
      valueUsd: 1.2e6,
      examples: 'ABIL, WTSPYM, WTIAU',
      idHint: 'id contains "anchored" or "st0x"',
    },
    {
      label: 'Single-token issuers',
      chain: 'various',
      tokens: 24,
      valueUsd: 296.3e6,
      examples: 'Goldfish Gold, Pleasing Gold, Securitize, Streamex',
      idHint: 'issuer is in the token name',
    },
  ],
} as const;
