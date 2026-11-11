import { useEffect, useState } from 'react';
import { Gauge, LayoutDashboard } from 'lucide-react';
import { StructureWorkspace } from './StructureWorkspace';
import { ConsumoWorkspace } from './ConsumoWorkspace';
import './consumo.css';

type Mode = 'board' | 'sfmc';
const KEY = 'gaas.estrutura-crm.mode';
const readMode = (): Mode => { try { return localStorage.getItem(KEY) === 'sfmc' ? 'sfmc' : 'board'; } catch { return 'board'; } };

/** Aba Estrutura CRM: o título vira a troca entre o quadro de campanhas e o consumo do SFMC. */
export function EstruturaCrm() {
  const [mode, setMode] = useState<Mode>(readMode);
  useEffect(() => { try { localStorage.setItem(KEY, mode); } catch { /* preferência local */ } }, [mode]);
  const modeSwitch = (
    <div className="cz-mode" role="tablist" aria-label="Visão da Estrutura CRM">
      <button role="tab" aria-selected={mode === 'board'} className={mode === 'board' ? 'on' : ''} onClick={() => setMode('board')}><LayoutDashboard />Board campanhas</button>
      <button role="tab" aria-selected={mode === 'sfmc'} className={mode === 'sfmc' ? 'on' : ''} onClick={() => setMode('sfmc')}><Gauge />Consumo SFMC</button>
    </div>
  );
  return mode === 'sfmc' ? <ConsumoWorkspace modeSwitch={modeSwitch} /> : <StructureWorkspace modeSwitch={modeSwitch} />;
}
