import type { ReactNode } from 'react';
import { formatDelta } from '../lib/format';

/** His delta pill: "▲ 0.5%" in --up / --down. */
export function Delta({ fraction }: { fraction: number }) {
  const { text, dir } = formatDelta(fraction);
  return (
    <span className={`delta mono delta-${dir}`} style={{ fontSize: '0.8125rem' }}>
      {dir !== 'flat' && (
        <span className="delta-glyph" aria-hidden="true">
          {dir === 'up' ? '▲' : '▼'}
        </span>
      )}
      <span className="soc-add-sr">{dir === 'up' ? 'up ' : dir === 'down' ? 'down ' : ''}</span>
      {text}
    </span>
  );
}

interface KpiProps {
  label: string;
  value: string;
  source?: string;
  delta?: number | null;
  period?: ReactNode;
}

/** One cell of his .kpi-row. */
export function Kpi({ label, value, source, delta, period }: KpiProps) {
  return (
    <div className="kpi">
      <div className="kpi-label mono">{label}</div>
      <div className="kpi-value mono">{value}</div>
      {source && <div className="kpi-source">{source}</div>}
      <div className="kpi-meta">
        {typeof delta === 'number' && <Delta fraction={delta} />}
        {period && <span className="kpi-period mono">{period}</span>}
      </div>
    </div>
  );
}

interface PanelProps {
  id?: string;
  title: string;
  caption?: string;
  notes?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

/** His .panel with the standard head (title, mono caption, notes, optional actions). */
export function Panel({ id, title, caption, notes, actions, children }: PanelProps) {
  return (
    <div id={id} className="panel">
      <div className="panel-head">
        <div className="panel-headings">
          <h3 className="panel-title">{title}</h3>
          {caption && <p className="panel-caption mono">{caption}</p>}
          {notes}
        </div>
        {actions && <div className="panel-actions">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/** Section wrapper: his .section-subhead with a title and one-line description. */
export function SectionHead({ id, title, description }: { id: string; title: string; description?: string }) {
  return (
    <div className="section-subhead">
      <h2 className="sh-subtitle" id={id}>
        {title}
      </h2>
      {description && <p className="sh-desc">{description}</p>}
    </div>
  );
}

export function Unavailable() {
  return <p className="panel-note">Data temporarily unavailable.</p>;
}
