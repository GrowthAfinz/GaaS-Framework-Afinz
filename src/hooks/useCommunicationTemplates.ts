import { useCallback, useEffect, useState } from 'react';
import type { CommunicationTemplate } from '../types/communication';
import { listTemplates } from '../services/communicationService';

/** Templates já cadastrados — fonte do dropdown "vincular existente". */
export function useCommunicationTemplates() {
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTemplates(await listTemplates());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar templates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return { templates, loading, error, refetch: fetchTemplates };
}
