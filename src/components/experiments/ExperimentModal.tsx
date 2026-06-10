import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Label, Input, Select, Combobox } from '../dispatch/blocks/shared';
import type { ExperimentDefinition, ExperimentRule } from '../../types/experiments';

interface Props {
  onClose: () => void;
  onCreate: (data: {
    titulo: string;
    hipotese: string;
    status: 'backlog';
    definicao: ExperimentDefinition;
  }) => Promise<void>;
}

export function ExperimentModal({ onClose, onCreate }: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [titulo, setTitulo] = useState('');
  const [hipotese, setHipotese] = useState('');
  const [bu, setBu] = useState<'B2C' | 'B2B2C' | 'Plurix' | 'Seguros'>('B2C');
  const [segmento, setSegmento] = useState('');
  const [canal, setCanal] = useState('');
  const [safra, setSafra] = useState('');
  const [campo, setCampo] = useState<ExperimentRule['campo']>('Promocional');
  const [controleValor, setControleValor] = useState('');
  const [varianteValor, setVarianteValor] = useState('');

  // Read activities from store for auto-suggestions
  const activities = useAppStore((state) => state.activities);

  // Extract unique values from history for suggestions
  const suggestedSegmentos = useMemo(() => {
    const unique = Array.from(new Set(activities.map(a => a.segmento).filter(Boolean)));
    return unique.map(val => ({ value: val }));
  }, [activities]);

  const suggestedCanais = useMemo(() => {
    const unique = Array.from(new Set(activities.map(a => a.canal).filter(Boolean)));
    return unique.map(val => ({ value: val }));
  }, [activities]);

  const suggestedSafras = useMemo(() => {
    const unique = Array.from(new Set(activities.map(a => a.safraKey).filter(Boolean))).sort().reverse();
    return unique.map(val => ({ value: val }));
  }, [activities]);

  const suggestedRuleValues = useMemo(() => {
    let rawValues: string[] = [];
    if (campo === 'Promocional') {
      rawValues = activities.map(a => a.raw?.['Promocional'] || a.raw?.['promocional']).filter(Boolean);
    } else if (campo === 'Oferta') {
      rawValues = activities.map(a => a.raw?.['Oferta'] || a.raw?.['oferta']).filter(Boolean);
    } else if (campo === 'Subgrupos') {
      rawValues = activities.map(a => a.raw?.['Subgrupos'] || a.raw?.['subgrupos']).filter(Boolean);
    } else if (campo === 'Activity name / Taxonomia') {
      rawValues = activities.map(a => a.id).filter(Boolean);
    }
    
    // Calculate counts for frequency sorting
    const counts: Record<string, number> = {};
    rawValues.forEach(val => {
      counts[val] = (counts[val] || 0) + 1;
    });

    return Object.keys(counts).map(val => ({
      value: val,
      count: counts[val]
    })).sort((a, b) => b.count - a.count);
  }, [activities, campo]);

  const validateStep = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!titulo.trim()) {
        setErrorMsg('O título é obrigatório.');
        return false;
      }
      if (!hipotese.trim()) {
        setErrorMsg('A hipótese do teste é obrigatória.');
        return false;
      }
    } else if (step === 2) {
      if (!segmento) {
        setErrorMsg('Selecione o segmento de público.');
        return false;
      }
      if (!canal) {
        setErrorMsg('Selecione o canal de envio.');
        return false;
      }
      if (!safra) {
        setErrorMsg('Selecione a safra de início.');
        return false;
      }
    } else if (step === 3) {
      if (!controleValor.trim()) {
        setErrorMsg('O valor identificador do Grupo Controle é obrigatório.');
        return false;
      }
      if (!varianteValor.trim()) {
        setErrorMsg('O valor identificador do Grupo Variante é obrigatório.');
        return false;
      }
      if (controleValor.trim() === varianteValor.trim()) {
        setErrorMsg('Os valores de Controle e Variante devem ser diferentes.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      await onCreate({
        titulo: titulo.trim(),
        hipotese: hipotese.trim(),
        status: 'backlog',
        definicao: {
          bu,
          segmento,
          canal,
          safra_inicio: safra,
          variante_regra: {
            campo,
            controle_valor: controleValor.trim(),
            variante_valor: varianteValor.trim()
          }
        }
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar o experimento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Nova Hipótese (Teste A/B)</h3>
            <p className="text-[10px] text-slate-400 font-medium">Etapa {step} de 3</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1">✕</button>
        </div>

        {/* Step Indicator Bar */}
        <div className="flex h-1 w-full bg-slate-100">
          <div className={`h-full bg-blue-500 transition-all duration-300 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`} />
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 min-h-[280px]">
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-100 text-red-700 text-[10px] font-semibold rounded-lg flex items-center gap-1.5 leading-snug">
              <span className="text-red-500 text-xs">✗</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div>
                <Label label="Título do Experimento" required />
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Teste de copy com apelo de escassez"
                />
              </div>

              <div>
                <Label label="Hipótese do Teste" required />
                <textarea
                  value={hipotese}
                  onChange={(e) => setHipotese(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-2 text-[11px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 focus:border-cyan-400 min-h-[70px] resize-none"
                  placeholder="Se enviarmos mensagem X, esperamos que a taxa de finalização suba Y% porque o usuário..."
                />
              </div>

              <div>
                <Label label="BU (Unidade de Negócio)" required />
                <Select value={bu} onChange={(e: any) => setBu(e.target.value)}>
                  <option value="B2C">B2C</option>
                  <option value="Plurix">Plurix</option>
                  <option value="B2B2C">B2B2C</option>
                  <option value="Seguros">Seguros</option>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="relative">
                <Label label="Segmento de Público" required />
                <Combobox
                  value={segmento}
                  onChange={setSegmento}
                  options={suggestedSegmentos}
                  placeholder="Selecione o segmento..."
                />
              </div>

              <div>
                <Label label="Canal de Envio" required />
                <Combobox
                  value={canal}
                  onChange={setCanal}
                  options={suggestedCanais}
                  placeholder="Selecione o canal..."
                />
              </div>

              <div>
                <Label label="Safra de Início" required />
                <Combobox
                  value={safra}
                  onChange={setSafra}
                  options={suggestedSafras}
                  placeholder="Selecione a safra..."
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div>
                <Label label="Campo de Separação A/B" required />
                <Select value={campo} onChange={(e: any) => setCampo(e.target.value)}>
                  <option value="Promocional">Promocional (Cupom/Sufixo)</option>
                  <option value="Oferta">Oferta (Tipo de Oferta)</option>
                  <option value="Subgrupos">Subgrupos (Split de Público)</option>
                  <option value="Activity name / Taxonomia">Activity Name (ID Único)</option>
                </Select>
                <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                  Selecione qual coluna do histórico separa o grupo controle da variante.
                </p>
              </div>

              <div>
                <Label label="Identificador: Grupo Controle" required />
                <Combobox
                  value={controleValor}
                  onChange={setControleValor}
                  options={suggestedRuleValues}
                  placeholder="Ex: controle"
                />
              </div>

              <div>
                <Label label="Identificador: Grupo Variante" required />
                <Combobox
                  value={varianteValor}
                  onChange={setVarianteValor}
                  options={suggestedRuleValues}
                  placeholder="Ex: variante"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between gap-2">
          {step > 1 ? (
            <button
              onClick={handleBack}
              disabled={loading}
              className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Voltar
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-500 bg-transparent rounded-lg hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="px-5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
            >
              Avançar
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-1.5 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 disabled:bg-slate-200 disabled:text-slate-400 rounded-lg transition-colors shadow-sm"
            >
              {loading ? 'Criando...' : 'Criar Hipótese'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
