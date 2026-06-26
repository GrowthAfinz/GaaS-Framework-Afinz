import { useCallback, useEffect, useMemo, useState } from 'react';
import { listTemplates } from '../services/communicationService';
import type { CommunicationTemplate } from '../types/communication';

export interface CatalogTemplate extends CommunicationTemplate {
  hasAsset: boolean;
  app: string;
  campanha: string;
  semana: string;
  activityNamesPlanejados: string[];
}

function decorate(t: CommunicationTemplate): CatalogTemplate {
  const m = (t.metadata ?? {}) as Record<string, unknown>;
  const planned = Array.isArray(m.activity_names_planejados) ? (m.activity_names_planejados as string[]) : [];
  return {
    ...t,
    hasAsset: !!t.original_path,
    app: typeof m.app === 'string' ? m.app : '',
    campanha: typeof m.campanha === 'string' ? m.campanha : '',
    semana: typeof m.semana === 'string' ? m.semana : '',
    activityNamesPlanejados: planned,
  };
}

/** Catálogo de templates com os DRAFTS (sem asset) priorizados no topo. */
export function useTemplateCatalog() {
  const [all, setAll] = useState<CatalogTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const templates = await listTemplates();
      setAll(templates.map(decorate));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar o catálogo de templates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

  const drafts = useMemo(() => all.filter((t) => !t.hasAsset), [all]);
  const comAsset = useMemo(() => all.filter((t) => t.hasAsset), [all]);

  return { drafts, comAsset, total: all.length, loading, error, refetch: fetchCatalog };
}
