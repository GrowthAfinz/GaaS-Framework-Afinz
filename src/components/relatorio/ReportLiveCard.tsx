import React, { useCallback, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { CloudUpload, ExternalLink, FileSpreadsheet, Presentation, RefreshCw, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

/**
 * Report Google Live — dispara a Edge Function `report-sync` e acompanha o
 * progresso real via polling na tabela `report_runs` (RLS: anon só lê).
 * Planilha e deck têm links FIXOS — o mesmo link é atualizado a cada geração.
 */

interface RunRow {
  id: string;
  status: 'queued' | 'writing_sheets' | 'generating_narrative' | 'refreshing_slides' | 'done' | 'error';
  sheet_url: string | null;
  slides_url: string | null;
  error_detail: string | null;
  rows_inserted: number | null;
}

const STAGES: Array<{ key: RunRow['status']; label: string }> = [
  { key: 'queued', label: 'Na fila' },
  { key: 'writing_sheets', label: 'Sincronizando dados novos na planilha' },
  { key: 'generating_narrative', label: 'Gerando narrativa — Analista → Redator → Crítico' },
  { key: 'refreshing_slides', label: 'Atualizando deck e gráficos linkados' },
  { key: 'done', label: 'Concluído' },
];

const stageIndex = (status: RunRow['status']): number =>
  Math.max(0, STAGES.findIndex(s => s.key === status));

interface ReportLiveCardProps {
  periodStart: Date;
  periodEnd: Date;
}

export const ReportLiveCard: React.FC<ReportLiveCardProps> = ({ periodStart, periodEnd }) => {
  const [run, setRun] = useState<RunRow | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Ao montar, recupera a última run (permite reabrir a aba e ver o resultado)
  useEffect(() => {
    supabase
      .from('report_runs')
      .select('id,status,sheet_url,slides_url,error_detail,rows_inserted')
      .eq('report_type', 'midia_paga_crm_mensal')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data[0]) setRun(data[0] as RunRow);
      });
    return stopPolling;
  }, [stopPolling]);

  // Polling enquanto a run estiver em andamento
  useEffect(() => {
    const active = run && run.status !== 'done' && run.status !== 'error';
    if (!active) {
      stopPolling();
      return;
    }
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('report_runs')
        .select('id,status,sheet_url,slides_url,error_detail,rows_inserted')
        .eq('id', run!.id)
        .single();
      if (data) setRun(data as RunRow);
    }, 2500);
    return stopPolling;
  }, [run, stopPolling]);

  const startSync = useCallback(async () => {
    setStarting(true);
    setStartError(null);
    try {
      const { data, error } = await supabase.functions.invoke('report-sync', {
        body: {
          period_start: format(periodStart, 'yyyy-MM-dd'),
          period_end: format(periodEnd, 'yyyy-MM-dd'),
        },
      });
      if (error) throw error;
      if (!data?.run_id) throw new Error(data?.error ?? 'Função não retornou run_id');
      setRun({ id: data.run_id, status: 'queued', sheet_url: null, slides_url: null, error_detail: null, rows_inserted: null });
    } catch (err) {
      console.error('Erro ao iniciar report-sync', err);
      setStartError(err instanceof Error ? err.message : 'Erro desconhecido ao iniciar a sincronização.');
    } finally {
      setStarting(false);
    }
  }, [periodEnd, periodStart]);

  const inProgress = run !== null && run.status !== 'done' && run.status !== 'error';
  const currentStage = run ? stageIndex(run.status) : -1;

  return (
    <div className="rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50/60 to-white overflow-hidden">
      {/* Header do card */}
      <div className="flex items-center gap-3 px-4 py-3">
        <CloudUpload size={18} className="shrink-0 text-cyan-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800">Report Google Live</p>
          <p className="text-xs text-slate-500">
            Planilha + deck com links fixos, dados sincronizados e narrativa gerada por IA (Analista → Redator → Crítico)
          </p>
        </div>
        <button
          onClick={startSync}
          disabled={starting || inProgress}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-cyan-700 disabled:cursor-wait disabled:opacity-60"
        >
          {starting || inProgress ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {inProgress ? 'Gerando...' : 'Gerar / Atualizar'}
        </button>
      </div>

      {startError && (
        <div className="mx-4 mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{startError}</span>
        </div>
      )}

      {/* Tela de processamento — estágios reais lidos de report_runs */}
      {inProgress && (
        <div className="border-t border-cyan-100 bg-white/70 px-4 py-3 space-y-1.5">
          {STAGES.slice(0, 4).map((stage, i) => (
            <div key={stage.key} className="flex items-center gap-2 text-xs">
              {i < currentStage ? (
                <Check size={13} className="shrink-0 text-emerald-500" />
              ) : i === currentStage ? (
                <Loader2 size={13} className="shrink-0 animate-spin text-cyan-600" />
              ) : (
                <span className="inline-block h-3 w-3 shrink-0 rounded-full border border-slate-300" />
              )}
              <span className={i <= currentStage ? 'font-semibold text-slate-700' : 'text-slate-400'}>
                {stage.label}
              </span>
              {stage.key === 'writing_sheets' && i === currentStage && run?.rows_inserted != null && run.rows_inserted > 0 && (
                <span className="text-slate-400">({run.rows_inserted} linhas novas)</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resultado — links fixos */}
      {run?.status === 'done' && (
        <div className="border-t border-cyan-100 bg-white/70 px-4 py-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <Check size={14} /> Report atualizado
            {run.rows_inserted != null && run.rows_inserted > 0 && (
              <span className="font-normal text-slate-400">· {run.rows_inserted} linhas novas sincronizadas</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {run.sheet_url && (
              <a
                href={run.sheet_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <FileSpreadsheet size={13} /> Planilha (dados) <ExternalLink size={11} />
              </a>
            )}
            {run.slides_url && (
              <a
                href={run.slides_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
              >
                <Presentation size={13} /> Apresentação (deck) <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>
      )}

      {run?.status === 'error' && (
        <div className="border-t border-red-100 bg-red-50/60 px-4 py-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-red-600">
            <AlertTriangle size={14} /> A geração falhou
          </p>
          <p className="text-xs text-red-500 break-words">{run.error_detail ?? 'Erro sem detalhe registrado.'}</p>
          <button
            onClick={startSync}
            disabled={starting}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
          >
            <RefreshCw size={12} /> Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
};
