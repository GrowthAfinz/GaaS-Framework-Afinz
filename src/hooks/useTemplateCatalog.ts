import { useCallback, useEffect, useMemo, useState } from 'react';
import { listTemplates } from '../services/communicationService';
import type { CommunicationTemplate } from '../types/communication';
import { useBU } from '../contexts/BUContext';
import { useAppStore } from '../store/useAppStore';

export interface CatalogTemplate extends CommunicationTemplate {
  hasAsset: boolean;
  app: string;
  campanha: string;
  semana: string;
  segmento_af_sub1: string;
  activityNamesPlanejados: string[];
  searchableText: string;
}

export function decorateTemplate(t: CommunicationTemplate): CatalogTemplate {
  return decorate(t);
}

function decorate(t: CommunicationTemplate): CatalogTemplate {
  const m = (t.metadata ?? {}) as Record<string, unknown>;
  const planned = Array.isArray(m.activity_names_planejados) ? (m.activity_names_planejados as string[]) : [];
  const metadataValues = Object.values(m).flatMap((value) => Array.isArray(value) ? value : [value]);
  const searchableText = normalizeText([
    t.template_id,
    t.title,
    t.channel,
    t.family,
    ...metadataValues,
    ...planned,
  ].join(' '));
  return {
    ...t,
    hasAsset: !!t.original_path,
    app: typeof m.app === 'string' ? m.app : '',
    campanha: typeof m.campanha === 'string' ? m.campanha : '',
    semana: typeof m.semana === 'string' ? m.semana : '',
    segmento_af_sub1: typeof m.segmento_af_sub1 === 'string' ? m.segmento_af_sub1 : '',
    activityNamesPlanejados: planned,
    searchableText,
  };
}

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function channelMatches(template: CatalogTemplate, channels: string[]): boolean {
  if (channels.length === 0) return true;
  const channel = normalizeText(template.channel);
  return channels.some((raw) => {
    const expected = normalizeText(raw);
    return channel === expected
      || channel.includes(expected)
      || expected.includes(channel);
  });
}

function textMatchesAny(text: string, values: string[]): boolean {
  if (values.length === 0) return true;
  return values.some((value) => {
    const normalized = normalizeText(value);
    return normalized && text.includes(normalized);
  });
}

function templateMatchesBU(template: CatalogTemplate, selectedBUs: string[]): boolean {
  if (selectedBUs.length === 0) return true;
  const text = template.searchableText;
  return selectedBUs.some((bu) => {
    const normalized = normalizeText(bu);
    if (normalized === 'b2c') {
      return text.includes('b2c') || text.includes('base proprietaria');
    }
    if (normalized === 'b2b2c') {
      return text.includes('b2b2c')
        || text.includes('dia')
        || text.includes('bem barato')
        || text.includes('bb ');
    }
    if (normalized === 'plurix') {
      return text.includes('plurix') || text.includes('plu ');
    }
    if (normalized === 'seguros') {
      return text.includes('seguro') || text.includes('seguros');
    }
    return text.includes(normalized);
  });
}

export interface GlobalTemplateFilters {
  canais?: string[];
  jornadas?: string[];
  segmentos?: string[];
  parceiros?: string[];
  subgrupos?: string[];
  ofertas?: string[];
}

/** Predicado único de filtro global para um template (reusado em Catálogo e Reconciliação). */
export function matchesGlobalFilters(template: CatalogTemplate, selectedBUs: string[], filters: GlobalTemplateFilters): boolean {
  const text = template.searchableText;
  return templateMatchesBU(template, selectedBUs)
    && channelMatches(template, filters.canais ?? [])
    && textMatchesAny(text, filters.segmentos ?? [])
    && textMatchesAny(text, filters.jornadas ?? [])
    && textMatchesAny(text, filters.parceiros ?? [])
    && textMatchesAny(text, filters.subgrupos ?? [])
    && textMatchesAny(text, filters.ofertas ?? []);
}

/** Catálogo de templates com os DRAFTS (sem asset) priorizados no topo. */
export function useTemplateCatalog() {
  const [all, setAll] = useState<CatalogTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedBUs } = useBU();
  const filters = useAppStore((s) => s.viewSettings.filtrosGlobais);

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

  const filtered = useMemo(() => all.filter((template) => matchesGlobalFilters(template, selectedBUs, filters)), [
    all,
    selectedBUs,
    filters.canais,
    filters.jornadas,
    filters.segmentos,
    filters.parceiros,
    filters.subgrupos,
    filters.ofertas,
  ]);

  const drafts = useMemo(() => filtered.filter((t) => !t.hasAsset), [filtered]);
  const comAsset = useMemo(() => filtered.filter((t) => t.hasAsset), [filtered]);

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    if (selectedBUs.length > 0 && selectedBUs.length < 4) labels.push(`BU: ${selectedBUs.join(', ')}`);
    if (filters.canais?.length) labels.push(`Canal: ${filters.canais.join(', ')}`);
    if (filters.segmentos?.length) labels.push(`Segmento: ${filters.segmentos.join(', ')}`);
    if (filters.jornadas?.length) labels.push(`Jornada: ${filters.jornadas.join(', ')}`);
    if (filters.parceiros?.length) labels.push(`Parceiro: ${filters.parceiros.join(', ')}`);
    if (filters.subgrupos?.length) labels.push(`Subgrupo: ${filters.subgrupos.join(', ')}`);
    if (filters.ofertas?.length) labels.push(`Oferta: ${filters.ofertas.join(', ')}`);
    return labels;
  }, [filters.canais, filters.jornadas, filters.ofertas, filters.parceiros, filters.segmentos, filters.subgrupos, selectedBUs]);

  return {
    drafts,
    comAsset,
    total: all.length,
    filteredTotal: filtered.length,
    activeFilterLabels,
    loading,
    error,
    refetch: fetchCatalog,
  };
}
