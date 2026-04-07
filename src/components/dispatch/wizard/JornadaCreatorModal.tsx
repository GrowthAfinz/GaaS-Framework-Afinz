import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, ChevronLeft, ClipboardCopy, Check } from 'lucide-react';
import { CANAIS, CUSTO_UNITARIO_CANAL } from '../../../constants/frameworkFields';
import type { Canal } from '../../../constants/frameworkFields';
import { INITIAL_WIZARD_STATE } from './types';
import type { WizardState, WizardBU, DispatchRow } from './types';
import { Step1BU } from './steps/Step1BU';
import { Step2Campaign } from './steps/Step2Campaign';
import { Step3SharedData } from './steps/Step3SharedData';
import { Step4Dispatches } from './steps/Step4Dispatches';
import { generateTSV } from './tsvGenerator';

interface JornadaCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AnimState = 'entering' | 'active' | 'exiting';

const STEP_LABELS = ['BU', 'Campanha', 'Dados', 'Disparos'];

/**
 * Sincroniza state.dispatches quando nDisparos ou ordemInicial mudam.
 * Preserva dados existentes; adiciona/remove linhas conforme necessário.
 */
function syncDispatches(state: WizardState): DispatchRow[] {
  const { nDisparos, ordemInicial, dispatches } = state;
  const defaultCanal: Canal = 'E-mail';
  const result: DispatchRow[] = [];

  for (let i = 0; i < nDisparos; i++) {
    const existing = dispatches[i];
    result.push({
      ordem: ordemInicial + i,
      activityName: existing?.activityName ?? '',
      canal: existing?.canal ?? defaultCanal,
      dataInicio: existing?.dataInicio ?? '',
      dataFim: existing?.dataFim ?? '',
    });
  }
  return result;
}

export const JornadaCreatorModal: React.FC<JornadaCreatorModalProps> = ({ isOpen, onClose }) => {
  const [state, setState] = useState<WizardState>(INITIAL_WIZARD_STATE);
  const [animState, setAnimState] = useState<AnimState>('active');
  const [copied, setCopied] = useState(false);
  const prevStepRef = useRef(state.step);

  // Reset ao fechar
  useEffect(() => {
    if (!isOpen) {
      setState(INITIAL_WIZARD_STATE);
      setCopied(false);
    }
  }, [isOpen]);

  const patch = useCallback((updates: Partial<WizardState>) => {
    setState((prev) => {
      const next = { ...prev, ...updates };

      // Resync dispatches quando campos relevantes mudam
      if (
        'nDisparos' in updates ||
        'ordemInicial' in updates
      ) {
        next.dispatches = syncDispatches(next);
      }

      return next;
    });
  }, []);

  const goTo = useCallback((targetStep: 1 | 2 | 3 | 4, direction: 'forward' | 'back') => {
    setAnimState('exiting');
    setTimeout(() => {
      setState((prev) => ({ ...prev, step: targetStep, direction }));
      setAnimState('entering');
      setTimeout(() => setAnimState('active'), 20);
    }, 200);
  }, []);

  const handleSelectBU = useCallback((bu: WizardBU) => {
    patch({ bu, segmento: '', jornada: '' });
    goTo(2, 'forward');
  }, [patch, goTo]);

  const allDispatchesReady = state.dispatches.every(
    (d) => d.activityName.trim() !== '' && d.canal !== '' && d.dataInicio !== '' && d.dataFim !== ''
  );

  const handleCopyTSV = async () => {
    const tsv = generateTSV(state);
    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: criar textarea temporária
      const el = document.createElement('textarea');
      el.value = tsv;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canAdvanceStep2 = state.segmento.trim() !== '' && state.jornada.trim() !== '' && state.canalPadrao !== '';


  const getTransformStyle = (): React.CSSProperties => {
    if (animState === 'active') return { transform: 'translateX(0)', opacity: 1 };
    if (animState === 'entering') {
      return state.direction === 'forward'
        ? { transform: 'translateX(60px)', opacity: 0 }
        : { transform: 'translateX(-60px)', opacity: 0 };
    }
    // exiting
    return state.direction === 'forward'
      ? { transform: 'translateX(-60px)', opacity: 0 }
      : { transform: 'translateX(60px)', opacity: 0 };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col"
        style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-800">Nova Jornada</h2>

            {/* Step pills */}
            <div className="flex items-center gap-1">
              {STEP_LABELS.map((label, i) => {
                const stepNum = (i + 1) as 1 | 2 | 3 | 4;
                const isActive = state.step === stepNum;
                const isDone = state.step > stepNum;
                return (
                  <React.Fragment key={stepNum}>
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${
                        isActive
                          ? 'bg-cyan-600 text-white'
                          : isDone
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <span>{stepNum}</span>
                      <span className="hidden sm:inline">{label}</span>
                    </div>
                    {i < 3 && <div className="w-3 h-px bg-slate-200" />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-hidden relative px-5 py-4" style={{ minHeight: '400px' }}>
          <div
            style={{
              ...getTransformStyle(),
              transition: animState === 'active' ? 'transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease' : 'none',
              position: 'absolute',
              inset: '0',
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {state.step === 1 && (
              <Step1BU onSelect={handleSelectBU} />
            )}
            {state.step === 2 && (
              <Step2Campaign state={state} onChange={patch} />
            )}
            {state.step === 3 && (
              <Step3SharedData state={state} onChange={patch} />
            )}
            {state.step === 4 && (
              <Step4Dispatches state={state} onChange={patch} />
            )}
          </div>
        </div>

        {/* Footer */}
        {state.step > 1 && (
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            <div className="text-[11px] text-slate-500 flex-1" />

            <div className="flex items-center gap-2">
              <button
                onClick={() => goTo((state.step - 1) as 1 | 2 | 3 | 4, 'back')}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft size={14} />
                Voltar
              </button>

              {state.step < 4 && (
                <button
                  disabled={state.step === 2 && !canAdvanceStep2}
                  onClick={() => goTo((state.step + 1) as 2 | 3 | 4, 'forward')}
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Avançar
                </button>
              )}

              {state.step === 4 && (
                <button
                  disabled={!allDispatchesReady}
                  onClick={handleCopyTSV}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors"
                >
                  {copied ? (
                    <>
                      <Check size={14} />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <ClipboardCopy size={14} />
                      Copiar TSV
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
