import { useEffect, useState, useSyncExternalStore } from 'react';
import { getLocalViewport, toLocalRect } from '../../../context/UIScaleContext';

/**
 * Cor de fundo única dos boards (Board Campanhas, Consumo SFMC, Mapeamento SFMC e Visão Daily).
 * Escolher em um troca em todos. Fica no navegador de cada pessoa, não no Supabase.
 * A cor vira a variável CSS --board-bg, que o .cs-canvas e os canvas do Consumo leem.
 */
export const BOARD_BG_COLORS: [string, string][] = [['#f4f1ea', 'Papel'], ['#ece6d8', 'Areia'], ['#eef1f5', 'Névoa'], ['#e9efe6', 'Sálvia'], ['#efecf5', 'Lavanda'], ['#fafaf8', 'Gelo'], ['#e4e6ea', 'Concreto']];
export const DEFAULT_BOARD_BG = '#f4f1ea';
const KEY = 'gaas.board.bg';
// Antes a cor era só do Board Campanhas e ficava dentro das preferências dele.
const LEGACY_KEY = 'gaas.estrutura-crm.prefs';
const listeners = new Set<() => void>();

const isColor = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

function readStored(): string {
  try {
    const own = localStorage.getItem(KEY);
    if (isColor(own)) return own;
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || '{}')?.bg;
    if (isColor(legacy)) return legacy;
  } catch { /* preferência local */ }
  return DEFAULT_BOARD_BG;
}

let current = typeof window === 'undefined' ? DEFAULT_BOARD_BG : readStored();

function apply(color: string) {
  if (typeof document !== 'undefined') document.documentElement.style.setProperty('--board-bg', color);
}
apply(current);

if (typeof window !== 'undefined') {
  // Outra aba do navegador trocou a cor.
  window.addEventListener('storage', e => {
    if (e.key !== KEY || !isColor(e.newValue) || e.newValue === current) return;
    current = e.newValue; apply(current); listeners.forEach(l => l());
  });
}

export function setBoardBackground(color: string) {
  if (!isColor(color) || color === current) return;
  current = color; apply(color);
  try { localStorage.setItem(KEY, color); } catch { /* preferência local */ }
  listeners.forEach(l => l());
}

export function useBoardBackground(): string {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => current,
    () => DEFAULT_BOARD_BG,
  );
}

/** O quadradinho da barra: abre as cores prontas e um seletor livre. */
export function BoardColorButton({ className = 'cs-btn' }: { className?: string }) {
  const bg = useBoardBackground();
  const [rect, setRect] = useState<{ right: number; bottom: number } | null>(null);
  useEffect(() => {
    if (!rect) return;
    const close = () => setRect(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setRect(null); };
    window.addEventListener('pointerdown', close); window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('pointerdown', close); window.removeEventListener('keydown', onKey); };
  }, [rect]);
  return (
    <>
      <button type="button" className={className} title="Cor do fundo dos quadros" aria-label="Cor do fundo dos quadros" aria-expanded={Boolean(rect)}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { if (rect) { setRect(null); return; } const r = toLocalRect(e.currentTarget.getBoundingClientRect()); setRect({ right: r.right, bottom: r.bottom }); }}>
        <span className="cs-swatch" style={{ background: bg }} />
      </button>
      {rect && (
        <div className="cs-menu cs-bgmenu" style={{ left: Math.max(8, Math.min(rect.right - 240, getLocalViewport().width - 250)), top: rect.bottom + 4 }} onPointerDown={e => e.stopPropagation()}>
          <div className="sec">COR DO FUNDO DOS QUADROS</div>
          <div className="cs-colors">{BOARD_BG_COLORS.map(([c, n]) => <button key={c} type="button" className={bg === c ? 'on' : ''} onClick={() => setBoardBackground(c)}><span style={{ background: c }} />{n}</button>)}</div>
          <label className="row2">Outra cor<input type="color" value={bg} onChange={e => setBoardBackground(e.target.value)} /></label>
          <div className="row2" style={{ color: '#64748b', fontSize: 11.5 }}>Vale para todos os quadros, só neste navegador.</div>
        </div>
      )}
    </>
  );
}
