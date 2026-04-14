import type { Canal } from '../../../constants/frameworkFields';

export type WizardBU = 'B2C' | 'B2B2C' | 'Plurix' | 'Seguros';

export interface DispatchRow {
  ordem: number;
  activityName: string;
  canal: Canal;
  dataInicio: string; // YYYY-MM-DD
  dataFim: string;    // YYYY-MM-DD
}

export interface WizardState {
  step: 1 | 2 | 3 | 4;
  direction: 'forward' | 'back';
  // Step 1
  bu: WizardBU | '';
  // Step 2
  segmento: string;
  jornada: string;
  nDisparos: number;
  // Step 3
  ordemInicial: number;
  parceiro: string;
  subgrupo: string;
  etapaAquisicao: string;
  perfilCredito: string;
  produto: string;
  oferta: string;
  promocional: string;
  oferta2: string;
  promo2: string;
  baseTotal: number;
  baseAcionavel: number;
  // Step 4
  dispatches: DispatchRow[];
}

export const INITIAL_WIZARD_STATE: WizardState = {
  step: 1,
  direction: 'forward',
  bu: '',
  segmento: '',
  jornada: '',
  nDisparos: 1,
  ordemInicial: 1,
  parceiro: '',
  subgrupo: '',
  etapaAquisicao: '',
  perfilCredito: '',
  produto: 'Classic',
  oferta: '',
  promocional: '',
  oferta2: '',
  promo2: '',
  baseTotal: 0,
  baseAcionavel: 0,
  dispatches: [{ ordem: 1, activityName: '', canal: 'E-mail', dataInicio: '', dataFim: '' }],
};
