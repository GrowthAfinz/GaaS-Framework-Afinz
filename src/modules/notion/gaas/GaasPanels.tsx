/** Painéis do GaaS no lugar da "Notion AI" (que era texto fixo) e dos ajustes de membros (locais) do notion-clone. */
import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Moon, Sun, X } from 'lucide-react';
import type { Block, NotionPage, NotionUser, NotionWorkspace } from '../types/notion';
import { TASK_STATUS } from '../../../components/growth-learning/development/developmentService';
import { WORK_TYPES, workspaceLabel, type Initiative, type WorkItem } from '../../../components/growth-learning/development/workModel';
import { taskIdOfRow } from './tasksAdapter';

function Modal({ title, onClose, children, width = 640 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full rounded-xl bg-[var(--notion-modal-bg)] text-[var(--notion-text)] shadow-2xl border border-[var(--notion-border)]" style={{ maxWidth: width }}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--notion-border)]">
          <b className="text-sm">{title}</b>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--notion-hover)]" aria-label="Fechar"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const blockText = (ws: NotionWorkspace, ids: string[], depth = 0): string[] => ids.flatMap(id => {
  const b: Block | undefined = ws.blocks[id];
  if (!b || !b.content?.trim()) return b?.childrenIds ? blockText(ws, b.childrenIds, depth + 1) : [];
  const pad = '  '.repeat(depth);
  const line = b.type.startsWith('heading') ? `\n${pad}## ${b.content}` : b.type === 'to_do' ? `${pad}- [${b.checked ? 'x' : ' '}] ${b.content}` : b.type.endsWith('list_item') ? `${pad}- ${b.content}` : `${pad}${b.content}`;
  return [line, ...(b.childrenIds ? blockText(ws, b.childrenIds, depth + 1) : [])];
});

/** Briefing revisável para ativar a skill no Claude Code ou Codex. Não chama LLM sozinho. */
export function AgentBriefModal({ page, workspace, tasks, initiatives, onClose }: { page: NotionPage; workspace: NotionWorkspace; tasks: Map<string, WorkItem>; initiatives: Initiative[]; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const text = useMemo(() => {
    const taskId = taskIdOfRow(page.id), t = taskId ? tasks.get(taskId) : undefined;
    const head = t ? [
      'Use a skill gaas-wiki-agents do repositório para preparar o próximo passo deste trabalho, por comando explícito.',
      '', `Trabalho: ${t.title}`, `Tipo: ${WORK_TYPES[t.work_type]}`, `Status: ${TASK_STATUS[t.status]}`, `Frente: ${workspaceLabel(t.workspace)}`,
      `Iniciativa: ${initiatives.find(i => i.id === t.initiative_id)?.title || 'sem iniciativa'}`, `Próxima ação: ${t.next_action || 'a definir'}`,
      t.source_note ? `Nota de origem na Wiki: ${t.source_note}` : '',
    ] : ['Use a skill gaas-wiki-agents do repositório para preparar o próximo passo a partir desta página, por comando explícito.', '', `Página: ${page.title}`];
    const body = page.databaseId ? [] : blockText(workspace, page.blockIds);
    return [...head.filter(l => l !== ''), '', 'Conteúdo da página:', ...(body.length ? body : ['(vazio)']), '', 'Regras: conhecimento novo vai para a Wiki com revisão; não aprovar propostas sozinho; registrar fontes e limitações.'].join('\n');
  }, [page, workspace, tasks, initiatives]);
  return (
    <Modal title="Preparar briefing para os agentes" onClose={onClose}>
      <p className="text-xs text-[var(--notion-text-muted)] mb-3">Revise e copie o contexto para ativar a skill no Claude Code ou no Codex. O GaaS não aciona a IA sozinho.</p>
      <textarea readOnly value={text} className="w-full h-80 rounded-lg border border-[var(--notion-border)] bg-transparent p-3 text-xs font-mono" />
      <button className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
        onClick={() => void navigator.clipboard.writeText(text).then(() => setCopied(true)).catch(() => setCopied(false))}>
        <Copy size={13} />{copied ? 'Copiado' : 'Copiar briefing'}
      </button>
    </Modal>
  );
}

/** Ajustes: tema do módulo e a lista de membros, que vem dos acessos aprovados do GaaS (não se edita aqui). */
export function GaasSettingsModal({ theme, users, onSetTheme, onClose }: { theme: 'light' | 'dark'; users: NotionUser[]; onSetTheme: (t: 'light' | 'dark') => void; onClose: () => void }) {
  return (
    <Modal title="Ajustes" onClose={onClose} width={520}>
      <div className="text-xs font-semibold uppercase text-[var(--notion-text-muted)] mb-2">Aparência</div>
      <div className="flex gap-2 mb-5">
        {(['light', 'dark'] as const).map(t => (
          <button key={t} onClick={() => onSetTheme(t)} className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs ${theme === t ? 'border-blue-500 text-blue-600 bg-blue-500/10' : 'border-[var(--notion-border)]'}`}>
            {t === 'light' ? <Sun size={13} /> : <Moon size={13} />}{t === 'light' ? 'Claro' : 'Escuro'}
          </button>
        ))}
      </div>
      <div className="text-xs font-semibold uppercase text-[var(--notion-text-muted)] mb-2">Membros ({users.length})</div>
      <p className="text-xs text-[var(--notion-text-muted)] mb-2">São as pessoas com acesso aprovado ao GaaS. Novos acessos são liberados pelo administrador.</p>
      <div className="max-h-64 overflow-y-auto divide-y divide-[var(--notion-border)]">
        {users.map(u => <div key={u.id} className="flex items-center gap-2 py-2 text-sm"><span className="w-6 h-6 rounded-full bg-[var(--notion-active)] grid place-items-center text-[11px] font-bold">{u.name.trim()[0]?.toUpperCase()}</span>{u.name}</div>)}
      </div>
    </Modal>
  );
}
