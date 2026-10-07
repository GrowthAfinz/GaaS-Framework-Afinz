import { useEffect, useState } from 'react';
import type { TemplateContent } from '../../../modules/sfmc-package/types';
import { readContents } from '../../../services/sfmcPackageService';
import { MessagePreview } from './MessagePreview';
export function TemplateTextPreview({ templateId, compact = false }: { templateId: string; compact?: boolean }) {
  const [content, setContent] = useState<TemplateContent | null>(null);
  const [state, setState] = useState('Carregando texto do pacote...');
  useEffect(() => {
    let alive = true;
    const load = () => {
      setContent(null); setState('Carregando texto do pacote...');
      readContents(templateId).then(rows => {
        if (!alive) return;
        setContent(rows.find(r => r.is_current) || null);
        setState(rows.length ? 'Versões importadas disponíveis. Escolha uma versão atual na revisão do pacote.' : 'Sem texto importado para este template.');
      }).catch(() => { if (alive) { setContent(null); setState('Não foi possível carregar o texto importado.'); } });
    };
    load(); window.addEventListener('sfmc-package-changed', load);
    return () => { alive = false; window.removeEventListener('sfmc-package-changed', load); };
  }, [templateId]);
  return content ? <MessagePreview key={content.id} content={content.payload} compact={compact} /> : <p className="rounded-lg bg-slate-50 p-4 text-xs text-slate-500">{state}</p>;
}

