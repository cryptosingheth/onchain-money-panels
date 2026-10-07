import { AgentPaymentsPanel } from '../components/AgentPaymentsPanel';
import { CadStablecoinsPanel } from '../components/CadStablecoinsPanel';
import { RwaExcludeDemo } from '../components/RwaExcludeDemo';
import { RwaGapsPanel } from '../components/RwaGapsPanel';
import { TradingVsPaymentsPanel } from '../components/TradingVsPaymentsPanel';

/** Matches the DeFiLlama fetch revalidation in lib/defillama.ts. */
export const revalidate = 3600;

export default function PreviewPage() {
  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-left">
          <span className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-name">On-chain Money Panels</span>
          </span>
        </div>
        <div className="topbar-right mono">
          <span className="live live--mock">
            <span className="live-dot" aria-hidden="true" />
            PREVIEW
          </span>
        </div>
      </header>

      <main className="container">
        <div className="dash-section">
          <p className="soc-preview-note">Drop-in panels on Canadian-dollar stablecoins, real stablecoin use, AI-agent payments and tokenized assets. Proposed as a contribution to State of Crypto by Opinder Preet Singh.</p>
          <CadStablecoinsPanel />
          <TradingVsPaymentsPanel />
          <AgentPaymentsPanel />
          <RwaExcludeDemo />
          <RwaGapsPanel />
        </div>
      </main>
    </div>
  );
}
