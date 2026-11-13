import { useEffect, useState } from 'react';
import { Gauge, LayoutDashboard, Route } from 'lucide-react';
import { StructureWorkspace } from './StructureWorkspace';
import { ConsumoWorkspace } from './ConsumoWorkspace';
import './consumo.css';

type Mode = 'board' | 'sfmc' | 'map';
const KEY = 'gaas.estrutura-crm.mode';
// Até 13/11/2026 o Mapeamento era uma sub-aba do Consumo SFMC, lembrada nesta chave.
const LEGACY_SUB_KEY = 'gaas.consumo-sfmc.sub';
const readMode = (): Mode => {
  try {
    const mode = localStorage.getItem(KEY);
    if (mode === 'map') return 'map';
    if (mode === 'sfmc') return localStorage.getItem(LEGACY_SUB_KEY) === 'mapa' ? 'map' : 'sfmc';
  } catch { /* preferência local */ }
  return 'board';
};

const MODES: [Mode, string, typeof Gauge][] = [['board', 'Board campanhas', LayoutDashboard], ['sfmc', 'Consumo SFMC', Gauge], ['map', 'Mapeamento SFMC', Route]];

/** Aba Estrutura CRM: o título vira a troca entre o quadro de campanhas, o consumo do SFMC e o mapeamento das jornadas. */
export function EstruturaCrm() {
  const [mode, setMode] = useState<Mode>(readMode);
  useEffect(() => { try { localStorage.setItem(KEY, mode); localStorage.removeItem(LEGACY_SUB_KEY); } catch { /* preferência local */ } }, [mode]);
  const modeSwitch = (
    <div className="cz-mode" role="tablist" aria-label="Visão da Estrutura CRM">
      {MODES.map(([id, label, Icon]) => (
        <button key={id} role="tab" aria-selected={mode === id} className={mode === id ? 'on' : ''} onClick={() => setMode(id)}><Icon />{label}</button>
      ))}
    </div>
  );
  if (mode === 'board') return <StructureWorkspace modeSwitch={modeSwitch} />;
  // key separa o estado: Consumo e Mapeamento não dividem filtros de frente e período.
  return <ConsumoWorkspace key={mode} sub={mode === 'map' ? 'mapa' : 'consumo'} modeSwitch={modeSwitch} />;
}
