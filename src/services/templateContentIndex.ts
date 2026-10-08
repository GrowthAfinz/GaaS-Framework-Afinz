import { useEffect, useState } from 'react';
import type { TemplateContent } from '../modules/sfmc-package/types';
import { readContents } from './sfmcPackageService';
import { getSignedUrl } from './communicationService';

/**
 * Versões de conteúdo aprovadas (communication_template_contents), carregadas UMA vez e
 * indexadas por template_id (caixa preservada). Evita uma consulta por card nas prévias.
 * Invalida quando um pacote é aplicado (evento 'sfmc-package-changed').
 */
export type TemplateContentIndex = Map<string, TemplateContent[]>;

let pending: Promise<TemplateContentIndex> | null = null;

export function indexContents(rows: TemplateContent[]): TemplateContentIndex {
  const index: TemplateContentIndex = new Map();
  for (const row of rows) {
    const list = index.get(row.template_id) ?? [];
    list.push(row);
    index.set(row.template_id, list);
  }
  for (const list of index.values()) list.sort((a, b) => a.first_seen_at.localeCompare(b.first_seen_at));
  return index;
}

export function loadTemplateContentIndex(force = false): Promise<TemplateContentIndex> {
  if (force || !pending) {
    pending = readContents().then(indexContents).catch((err) => { pending = null; throw err; });
  }
  return pending;
}

if (typeof window !== 'undefined') window.addEventListener('sfmc-package-changed', () => { pending = null; });

export function useTemplateContentIndex(revision = 0) {
  const [index, setIndex] = useState<TemplateContentIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const load = (force: boolean) => {
      loadTemplateContentIndex(force)
        .then((value) => { if (alive) { setIndex(value); setError(null); } })
        .catch((err) => { if (alive) setError(err instanceof Error ? err.message : 'Falha ao carregar versões de conteúdo.'); });
    };
    load(revision > 0);
    const changed = () => load(true);
    window.addEventListener('sfmc-package-changed', changed);
    return () => { alive = false; window.removeEventListener('sfmc-package-changed', changed); };
  }, [revision]);
  return { index, error, loading: !index && !error };
}

// URLs assinadas reaproveitadas entre cards/thumbs/modal do mesmo path (validade 1h; renovamos com folga).
const signed = new Map<string, { url: Promise<string>; at: number }>();
const SIGNED_TTL_MS = 45 * 60 * 1000;
export function cachedSignedUrl(path: string): Promise<string> {
  const hit = signed.get(path);
  if (hit && Date.now() - hit.at < SIGNED_TTL_MS) return hit.url;
  const url = getSignedUrl(path).catch((err) => { signed.delete(path); throw err; });
  signed.set(path, { url, at: Date.now() });
  return url;
}
