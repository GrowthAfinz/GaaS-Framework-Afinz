import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { statsEngine } from '../components/experiments/StatsEngine';
import type { Experiment, ExperimentStats } from '../types/experiments';

interface RawDbStats {
  experiment_id: string;
  n_controle: string | number;
  conv_controle: string | number;
  n_variante: string | number;
  conv_variante: string | number;
}

interface RawDailyDbStats {
  experiment_id: string;
  date: string;
  n_controle: string | number;
  conv_controle: string | number;
  n_variante: string | number;
  conv_variante: string | number;
}

export function useExperiments() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [metricsMap, setMetricsMap] = useState<Record<string, ExperimentStats>>({});
  const [dailyMetricsMap, setDailyMetricsMap] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExperiments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch experiments
      const { data: expData, error: expErr } = await supabase
        .from('experiments')
        .select('*')
        .order('created_at', { ascending: false });

      if (expErr) throw expErr;

      // 2. Fetch raw aggregate metrics from SQL view
      const { data: statsData, error: statsErr } = await supabase
        .from('vw_experiment_metrics')
        .select('*');

      // Note: If view doesn't return anything or throws, we handle it gracefully
      let rawStatsList: RawDbStats[] = [];
      if (!statsErr && statsData) {
        rawStatsList = statsData as RawDbStats[];
      } else if (statsErr) {
        console.warn('vw_experiment_metrics view not available or errored:', statsErr);
      }

      // 3. Fetch daily metrics from daily SQL view
      const { data: dailyData, error: dailyErr } = await supabase
        .from('vw_experiment_metrics_daily')
        .select('*')
        .order('date', { ascending: true });

      let rawDailyList: RawDailyDbStats[] = [];
      if (!dailyErr && dailyData) {
        rawDailyList = dailyData as RawDailyDbStats[];
      }

      // 4. Group daily metrics by experiment
      const dailyMap: Record<string, any[]> = {};
      rawDailyList.forEach((row) => {
        if (!dailyMap[row.experiment_id]) {
          dailyMap[row.experiment_id] = [];
        }
        
        const nControle = Number(row.n_controle);
        const nVariante = Number(row.n_variante);
        
        dailyMap[row.experiment_id].push({
          date: row.date,
          controle: nControle > 0 ? Number(row.conv_controle) / nControle : 0,
          variante: nVariante > 0 ? Number(row.conv_variante) / nVariante : 0,
        });
      });

      // 5. Compute statistics on the client side using StatsEngine
      const computedMetrics: Record<string, ExperimentStats> = {};
      rawStatsList.forEach((row) => {
        const n_controle = Number(row.n_controle);
        const conv_controle = Number(row.conv_controle);
        const n_variante = Number(row.n_variante);
        const conv_variante = Number(row.conv_variante);
        
        const stats = statsEngine.calculate({
          n_controle,
          conv_controle,
          n_variante,
          conv_variante
        });

        computedMetrics[row.experiment_id] = {
          n_controle,
          conv_controle,
          conv_rate_controle: n_controle > 0 ? conv_controle / n_controle : 0,
          n_variante,
          conv_variante,
          conv_rate_variante: n_variante > 0 ? conv_variante / n_variante : 0,
          ...stats
        };
      });

      // Inject computed daily trends directly into experiment entities for UI ease
      const enrichedExps = (expData as Experiment[] || []).map((exp) => {
        return {
          ...exp,
          sparklineData: dailyMap[exp.id] || []
        };
      });

      setExperiments(enrichedExps);
      setMetricsMap(computedMetrics);
      setDailyMetricsMap(dailyMap);
    } catch (err: any) {
      console.error('Error fetching experiments:', err);
      setError(err.message || 'Erro ao carregar experimentos.');
    } finally {
      setLoading(false);
    }
  }, []);

  const createExperiment = async (newExp: Omit<Experiment, 'id' | 'view_count' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: err } = await supabase
        .from('experiments')
        .insert([
          {
            ...newExp,
            view_count: 0
          }
        ])
        .select();

      if (err) throw err;
      await fetchExperiments(); // Refresh list
      return data?.[0] as Experiment;
    } catch (err: any) {
      console.error('Error creating experiment:', err);
      throw new Error(err.message || 'Erro ao criar experimento.');
    }
  };

  const updateExperimentStatus = async (id: string, status: Experiment['status']) => {
    try {
      const updates: Partial<Experiment> = { status };
      if (status === 'rodando') {
        updates.iniciado_em = new Date().toISOString().split('T')[0];
      }
      
      const { error: err } = await supabase
        .from('experiments')
        .update(updates)
        .eq('id', id);

      if (err) throw err;
      
      // Optimistic update in local state for fluid UI drag-and-drop
      setExperiments(prev => prev.map(exp => {
        if (exp.id === id) {
          return {
            ...exp,
            ...updates
          };
        }
        return exp;
      }));
    } catch (err: any) {
      console.error('Error updating experiment status:', err);
      throw new Error(err.message || 'Erro ao mover experimento.');
    }
  };

  const concludeExperiment = async (
    id: string, 
    decisao: Experiment['decisao'], 
    aprendizado: string
  ) => {
    try {
      const { error: err } = await supabase
        .from('experiments')
        .update({
          status: 'concluido',
          decisao,
          aprendizado,
          encerrado_em: new Date().toISOString().split('T')[0]
        })
        .eq('id', id);

      if (err) throw err;
      await fetchExperiments();
    } catch (err: any) {
      console.error('Error concluding experiment:', err);
      throw new Error(err.message || 'Erro ao salvar conclusão do experimento.');
    }
  };

  const incrementViewCount = async (id: string) => {
    try {
      // Find current view count
      const exp = experiments.find(e => e.id === id);
      if (!exp) return;

      const { error: err } = await supabase
        .from('experiments')
        .update({ view_count: exp.view_count + 1 })
        .eq('id', id);

      if (!err) {
        setExperiments(prev => prev.map(e => e.id === id ? { ...e, view_count: e.view_count + 1 } : e));
      }
    } catch (err) {
      console.error('Error incrementing view count:', err);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, [fetchExperiments]);

  return {
    experiments,
    metricsMap,
    dailyMetricsMap,
    loading,
    error,
    refetch: fetchExperiments,
    createExperiment,
    updateExperimentStatus,
    concludeExperiment,
    incrementViewCount
  };
}
