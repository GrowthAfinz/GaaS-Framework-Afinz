import { useEffect, useMemo, useState } from 'react';
import { searchWiki } from './vaultService';
import type { VaultNoteSummary } from './vaultTypes';
import { groupWikiSearchResults, type WikiSearchGroup } from './wikiSearch';

export interface WikiSearchState {
  groups: WikiSearchGroup[];
  total: number;
  loading: boolean;
  error: string | null;
}

/**
 * Debounced Wiki search for quick result lists (global header, strategy bar).
 * Returns strategies first, then subjects and notes, each newest first.
 */
export function useWikiSearch(query: string, { limit = 20, minLength = 2, enabled = true, delay = 250 } = {}): WikiSearchState {
  const [items, setItems] = useState<VaultNoteSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = query.trim();
  const active = enabled && trimmed.length >= minLength;

  useEffect(() => {
    if (!active) { setItems([]); setTotal(0); setLoading(false); setError(null); return; }
    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      searchWiki(trimmed, null, 0, limit)
        .then(result => { if (!cancelled) { setItems(result.items); setTotal(result.total); setError(null); } })
        .catch(failure => { if (!cancelled) { setItems([]); setTotal(0); setError(failure instanceof Error ? failure.message : 'Não foi possível buscar na Wiki.'); } })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, delay);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [active, trimmed, limit, delay]);

  const groups = useMemo(() => groupWikiSearchResults(items), [items]);
  return { groups, total, loading, error };
}
