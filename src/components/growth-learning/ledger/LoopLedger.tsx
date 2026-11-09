import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Menu, Search, X } from 'lucide-react';
import '../../vault/wikiModeBar.css';
import './loopLedger.css';

export type LedgerTone = 'ok' | 'warn' | 'alert' | 'neutral';

export interface LedgerIndexItem {
  id: string;
  label: string;
  count: number;
  tone?: LedgerTone;
}

export interface LedgerIndexGroup {
  label: string;
  items: LedgerIndexItem[];
  value: string;
  onSelect: (id: string) => void;
}

export interface LedgerSegment {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  ariaLabel: string;
}

export interface LedgerFact {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: LedgerTone;
}

interface LoopLedgerProps {
  section: string;
  title: string;
  meta?: ReactNode;
  summary?: ReactNode;
  search: { value: string; onChange: (value: string) => void; placeholder: string; ariaLabel: string };
  segment?: LedgerSegment;
  index: LedgerIndexGroup[];
  indexNote?: ReactNode;
  onFeedback: () => void;
  footer?: ReactNode;
  children: ReactNode;
}

/** Barra única da Wiki + índice lateral + cabeçalho editorial das Estratégias. */
export function LoopLedger({ section, title, meta, summary, search, segment, index, indexNote, onFeedback, footer, children }: LoopLedgerProps) {
  const [indexOpen, setIndexOpen] = useState(true);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="!mt-0">
      <div role="toolbar" aria-label={`Navegação de ${section}`} className="wiki-bar wiki-bar--fixed">
        <button type="button" className="wiki-bar__btn" aria-expanded={indexOpen} aria-controls="loop-ledger-index" onClick={() => setIndexOpen((open) => !open)}>
          <Menu size={15} /> <span className="wiki-bar__lbl">Índice</span>
        </button>
        <div className="wiki-bar__search">
          <Search size={14} className="wiki-bar__search-ico" />
          <input ref={input} type="search" value={search.value} onChange={(event) => search.onChange(event.target.value)} placeholder={search.placeholder} aria-label={search.ariaLabel} />
          {search.value ? (
            <button type="button" className="wiki-bar__clear" onClick={() => search.onChange('')} aria-label="Limpar busca"><X size={13} /></button>
          ) : <kbd>Ctrl K</kbd>}
        </div>
        {segment && (
          <div className="wiki-bar__seg" role="group" aria-label={segment.ariaLabel}>
            {segment.options.map((option) => (
              <button key={option.value} type="button" aria-pressed={segment.value === option.value} onClick={() => segment.onChange(option.value)}>{option.label}</button>
            ))}
          </div>
        )}
        <button type="button" className="wiki-bar__btn wiki-bar__ai" onClick={onFeedback}>Correção para IA</button>
      </div>

      <div className={`loop-ledger ${indexOpen ? '' : 'loop-ledger--no-index'}`}>
        {indexOpen && (
          <aside id="loop-ledger-index" className="ledger-index" aria-label={`Índice de ${section}`}>
            {index.map((group) => (
              <div key={group.label} className="ledger-index-group">
                <p>{group.label}</p>
                <nav aria-label={group.label}>
                  {group.items.map((item) => (
                    <button key={item.id} type="button" aria-pressed={group.value === item.id} data-tone={item.count ? item.tone : undefined} data-empty={item.count === 0 ? 'true' : undefined} onClick={() => group.onSelect(item.id)}>
                      <span>{item.label}</span><span>{item.count}</span>
                    </button>
                  ))}
                </nav>
              </div>
            ))}
            {indexNote && <p className="ledger-index-note">{indexNote}</p>}
          </aside>
        )}
        <section className="ledger-main" aria-label={section}>
          <header className="ledger-header">
            <div className="ledger-crumb"><span>Loop</span><span aria-hidden>›</span><span>{section}</span></div>
            <h1 className="ledger-title">{title}</h1>
            {meta && <div className="ledger-meta">{meta}</div>}
            {summary && <p className="ledger-summary">{summary}</p>}
          </header>
          {children}
          {footer && <p className="ledger-footer">{footer}</p>}
        </section>
      </div>
    </div>
  );
}

export function LedgerChip({ tone = 'neutral', children }: { tone?: LedgerTone; children: ReactNode }) {
  return <span className="ledger-chip" data-tone={tone === 'neutral' ? undefined : tone}>{children}</span>;
}

interface LedgerEntryProps {
  kicker: ReactNode;
  title: string;
  text?: ReactNode;
  facts: LedgerFact[];
  selected: boolean;
  onOpen: () => void;
}

export function LedgerEntry({ kicker, title, text, facts, selected, onOpen }: LedgerEntryProps) {
  return (
    <li className="ledger-entry" data-selected={selected ? 'true' : undefined}>
      <button type="button" onClick={onOpen} aria-current={selected ? 'true' : undefined}>
        <div className="ledger-entry-kicker">{kicker}</div>
        <h2>{title}</h2>
        {text && <p className="ledger-entry-text">{text}</p>}
        <dl className="ledger-facts">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd data-tone={fact.tone === 'neutral' ? undefined : fact.tone}>{fact.value}{fact.hint && <small>{fact.hint}</small>}</dd>
            </div>
          ))}
        </dl>
        <span className="ledger-entry-open">Abrir detalhes</span>
      </button>
    </li>
  );
}

export function LedgerState({ title, children, tone, action }: { title: string; children: ReactNode; tone?: 'alert'; action?: { label: string; onClick: () => void } }) {
  return (
    <section className="ledger-state" data-tone={tone} role={tone === 'alert' ? 'alert' : 'status'}>
      <h2>{title}</h2>
      <p>{children}</p>
      {action && <button type="button" onClick={action.onClick}>{action.label}</button>}
    </section>
  );
}

export function LedgerLoading({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} style={{ padding: '24px 0' }}>
      {[72, 54, 88, 40, 66].map((width, i) => <div key={i} className="ledger-skeleton" style={{ width: `${width}%` }} />)}
    </div>
  );
}

