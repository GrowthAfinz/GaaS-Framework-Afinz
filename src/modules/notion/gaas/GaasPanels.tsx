/** Painéis do GaaS no lugar da "Notion AI" (que era texto fixo) e dos ajustes de membros (locais) do notion-clone. */
import React, { useEffect } from 'react';
import { Moon, Sun, X } from 'lucide-react';
import type { NotionUser } from '../types/notion';

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
