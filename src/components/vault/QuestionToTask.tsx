/**
 * "Virar Tarefa" nas tabelas de Perguntas em aberto da Wiki (regra das três caixas, 17/11/2026):
 * a pergunta continua na nota; quando alguém vai atrás, nasce uma Tarefa de investigação com link de volta.
 * Se já existe Tarefa para a mesma pergunta da mesma nota, abre a existente em vez de duplicar.
 */
import { createContext, useContext, useState } from 'react';
import type React from 'react';
import { ListPlus } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { taskError } from '../growth-learning/development/developmentService';
import { TaskModal } from '../growth-learning/development/TaskModal';
import { initiativeOfNote } from './wikiPilotService';

interface HastNode { type?: string; tagName?: string; value?: string; children?: HastNode[] }
const textOf = (n?: HastNode): string => (!n ? '' : n.type === 'text' ? n.value || '' : (n.children || []).map(textOf).join(''));
const cellsOf = (row?: HastNode) => (row?.children || []).filter(c => c.tagName === 'td' || c.tagName === 'th').map(c => textOf(c).trim());

/** A tabela é de perguntas em aberto quando a primeira coluna do cabeçalho é "Questão". */
export function isQuestionTable(table?: HastNode): boolean {
  const head = (table?.children || []).find(c => c.tagName === 'thead');
  const firstRow = (head?.children || []).find(c => c.tagName === 'tr');
  return cellsOf(firstRow)[0]?.toLowerCase() === 'questão';
}

export const QuestionTableContext = createContext<{ notePath: string; domain?: string } | null>(null);

const FRONT_OF_DOMAIN: Record<string, string> = { 'crm-aquisicao': 'aq', aquisicao: 'aq', rentabilizacao: 're', seguros: 'se', 'midia-paga': 'aq', 'originacao-b2c': 'aq', b2c: 'aq', midia: 'aq', crm: 'aq', renta: 're' };

/** Frente da pergunta: pelo domínio da nota; sem domínio, pela pasta (nota de engenharia e IA vai para GaaS, o resto é negócio). */
export function frontOfNote(path: string, domain?: string): string {
  const d = (domain || '').toLowerCase();
  if (FRONT_OF_DOMAIN[d]) return FRONT_OF_DOMAIN[d];
  const p = path.toLowerCase();
  if (/^(08-engenharia|09-inteligencia-ia)\//.test(p)) return 'gaas';
  if (p.includes('seguro')) return 'se';
  if (p.includes('rentabiliza') || p.includes('cartonista')) return 're';
  return 'aq';
}

/** Linha da tabela: no cabeçalho acrescenta a coluna; nas linhas, o botão "Virar Tarefa". */
export function QuestionRow({ node, children }: { node?: HastNode; children?: React.ReactNode }) {
  const ctx = useContext(QuestionTableContext);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState('');
  if (!ctx) return <tr>{children}</tr>;
  const header = (node?.children || []).some(c => c.tagName === 'th');
  if (header) return <tr>{children}<th className="border border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold">Tarefa</th></tr>;
  const [question, impact, evidence, owner] = cellsOf(node);
  const create = async () => {
    if (!question) return;
    setBusy(true); setError('');
    try {
      const existing = await supabase.from('growth_development_tasks').select('id').contains('details', { question, origin_note: ctx.notePath }).limit(1);
      if (existing.data?.length) { setOpen(existing.data[0].id as string); return; }
      if (!window.confirm(`Criar Tarefa de investigação para:\n\n"${question}"\n\nA pergunta continua na nota.`)) return;
      const initiative = await initiativeOfNote(ctx.notePath);
      const title = question.length > 175 ? question.slice(0, 172).trimEnd() + '…' : question.length < 5 ? `Investigar: ${question}` : question;
      const { data, error: e } = await supabase.rpc('growth_save_development_task', { p_id: null, p_revision: null, p_body: {
        title, work_type: 'investigation', status: 'backlog', priority: 'P2', source_note: ctx.notePath,
        ...(initiative ? { initiative_id: initiative } : {}), front_key: frontOfNote(ctx.notePath, ctx.domain),
        description: [`Pergunta em aberto da nota ${ctx.notePath}.`, impact && `Impacto: ${impact}`, evidence && `Evidência necessária: ${evidence}`, owner && `Dono na nota: ${owner}`].filter(Boolean).join('\n\n'),
        details: { question, origin_note: ctx.notePath, ...(evidence ? { scope: evidence } : {}) },
      } });
      if (e) throw e;
      setOpen((data as { id: string }).id);
    } catch (err) { setError(taskError(err)); } finally { setBusy(false); }
  };
  return (
    <tr>
      {children}
      <td className="border border-slate-200 px-3 py-2 align-top">
        <button type="button" disabled={busy} onClick={() => void create()} className="inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium text-cyan-700 hover:bg-cyan-50 disabled:opacity-50" title="Cria (ou abre) a Tarefa de investigação desta pergunta">
          <ListPlus size={13} />{busy ? 'Criando…' : 'Virar Tarefa'}
        </button>
        {error && <span role="alert" className="block text-[11px] text-red-700">{error}</span>}
        {open && <TaskModal taskId={open} onClose={() => setOpen(null)} />}
      </td>
    </tr>
  );
}
