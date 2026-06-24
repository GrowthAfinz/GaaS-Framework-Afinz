import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import type { CommunicationSlot } from '../types/communication';

/**
 * Fila de pendências de cobertura: slots SEM template
 * (coverage_status 'unmapped' ou 'partial'), mais recentes primeiro.
 */
export function useCommunicationSlots() {
  const [slots, setSlots] = useState<CommunicationSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: qError } = await supabase
        .from('communication_slots')
        .select('*')
        .in('coverage_status', ['unmapped', 'partial'])
        .order('last_seen_on', { ascending: false, nullsFirst: false });
      if (qError) throw qError;
      setSlots((data ?? []) as CommunicationSlot[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar a fila de cobertura.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  return { slots, loading, error, refetch: fetchSlots };
}
