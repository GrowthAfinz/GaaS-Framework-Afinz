import { useLayoutEffect, useRef } from 'react';
import type React from 'react';
import { getLocalViewport, toLocalPx } from '../../../context/UIScaleContext';
import { BOARD_COL_W } from './structureModel';

const PILLAR_SPANS = [1, 1, 4, 1];
const LANE_SPANS = [1, 1, 1, 1, 2, 1];

function SkeletonCard() {
  return (
    <div className="cs-card" aria-hidden="true">
      <span className="cs-sk" style={{ width: '55%', height: 14 }} />
      <span className="cs-sk" style={{ width: '78%', height: 14 }} />
      <span className="cs-sk" style={{ width: '64%', height: 10 }} />
      <span className="cs-sk" style={{ width: '100%', height: 92, borderRadius: 9 }} />
      <span className="cs-sk" style={{ width: '100%', height: 30, borderRadius: 8 }} />
      <span className="cs-sk" style={{ width: '70%', height: 18, marginTop: 'auto', marginBottom: 0 }} />
    </div>
  );
}

/** Primeira carga da Estrutura CRM: o quadro aparece no formato final, com blocos cinza, até a configuração chegar. */
export function StructureSkeleton({ modeSwitch, background }: { modeSwitch?: React.ReactNode; background: string }) {
  const canvas = useRef<HTMLDivElement>(null);
  // Mesma altura do quadro real: vai até o pé da janela.
  useLayoutEffect(() => {
    const size = () => { const c = canvas.current; if (c) c.style.height = Math.max(380, Math.floor(getLocalViewport().height - toLocalPx(c.getBoundingClientRect().top) - 8)) + 'px'; };
    size(); window.addEventListener('resize', size); return () => window.removeEventListener('resize', size);
  }, []);
  let col = 1;
  const pillars = PILLAR_SPANS.map((span, i) => { const c = col; col += span; return <div key={i} className="cs-H" style={{ gridColumn: `${c} / span ${span}`, gridRow: 1 }}><span className="cs-sk" /><span className="cs-sk" /><span className="cs-sk" /></div>; });
  col = 1;
  const lanes = LANE_SPANS.map((span, i) => {
    const c = col; col += span;
    return [
      <div key={'h' + i} className="cs-S" style={{ gridColumn: `${c} / span ${span}`, gridRow: 2 }}><div className="cs-Si"><span className="cs-sk" /></div></div>,
      <div key={'l' + i} className={`cs-lane${span > 1 ? ' wide' : ''}`} style={{ gridColumn: `${c} / span ${span}`, gridRow: 3 }}>
        {Array.from({ length: span > 1 ? 4 : i % 2 ? 2 : 3 }, (_, k) => <SkeletonCard key={k} />)}
      </div>,
    ];
  });
  return (
    <div className="cs-root cs-skel" aria-busy="true">
      <div className="cs-bar">
        {modeSwitch || <h2>Estrutura CRM</h2>}
        <span className="cs-sep" />
        {Array.from({ length: 6 }, (_, i) => <span key={i} className="cs-stat"><span className="cs-sk" style={{ width: 70 }} /></span>)}
        <span className="cs-grow" />
      </div>
      <div ref={canvas} className="cs-canvas" style={{ backgroundColor: background }}>
        <div className="cs-skel-msg" role="status"><i aria-hidden="true" />Carregando a Estrutura CRM…</div>
        <div className="cs-stage legdock" style={{ transform: 'none' }}>
          <div className="cs-legend" style={{ left: 14, top: 14 }}>
            <h5><span>Status / Filtros</span></h5>
            {Array.from({ length: 7 }, (_, i) => <span key={i} className="cs-sk" style={{ width: `${86 - (i % 3) * 12}%`, height: 12, margin: '12px 8px' }} />)}
          </div>
          <div className="cs-board" style={{ gridTemplateColumns: `repeat(7, ${BOARD_COL_W}px)` }}>{pillars}{lanes}</div>
        </div>
      </div>
    </div>
  );
}
