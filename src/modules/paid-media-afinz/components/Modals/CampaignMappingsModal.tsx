/**
 * CampaignMappingsModal
 *
 * Gerencia o mapeamento Campanha ↔ Objetivo de mídia.
 * Esta tabela é a fonte de verdade para:
 *  - Filtros de objetivo no filter bar (Branding, B2C, Plurix, Seguros...)
 *  - Cálculo de realized spend por objetivo no módulo de Orçamentos
 *
 * Ações disponíveis:
 *  - Ver campanhas agrupadas por objetivo
 *  - Adicionar campanha (existente no DB ou nome livre) a um objetivo
 *  - Remover campanha de um objetivo
 *  - Criar novo objetivo (basta adicionar uma campanha com objetivo novo)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Loader2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { dataService } from '../../../../services/dataService';
import { getObjectiveLabel, KNOWN_OBJECTIVES } from '../../types/budget';

interface CampaignMapping {
  campaign_name: string;
  objective: string;
}

interface CampaignMappingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMappingsChanged?: () => void;
}

export const CampaignMappingsModal: React.FC<CampaignMappingsModalProps> = ({
  isOpen,
  onClose,
  onMappingsChanged,
}) => {
  const [mappings, setMappings] = useState<CampaignMapping[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedObjective, setExpandedObjective] = useState<string | null>(null);

  // Estado do formulário de adição
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [customCampaign, setCustomCampaign] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  // Estado de novo objetivo
  const [showNewObjective, setShowNewObjective] = useState(false);
  const [newObjectiveName, setNewObjectiveName] = useState('');
  const [newObjectiveKnown, setNewObjectiveKnown] = useState('__custom__');
  const [newObjectiveCampaign, setNewObjectiveCampaign] = useState('');
  const [newObjectiveCampaignCustom, setNewObjectiveCampaignCustom] = useState('');
  const [useCustomCampaignForNew, setUseCustomCampaignForNew] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [mappingsData, campaignsData] = await Promise.all([
        dataService.fetchCampaignMappings(),
        dataService.fetchDistinctCampaigns(),
      ]);
      setMappings(mappingsData as CampaignMapping[]);
      setAllCampaigns(campaignsData);
    } catch (err) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen]);

  // Agrupar mappings por objetivo
  const grouped = useMemo(() => {
    const map: Record<string, string[]> = {};
    mappings.forEach((m) => {
      if (!map[m.objective]) map[m.objective] = [];
      map[m.objective].push(m.campaign_name);
    });
    return map;
  }, [mappings]);

  // Campanhas já mapeadas
  const mappedCampaigns = useMemo(
    () => new Set(mappings.map((m) => m.campaign_name)),
    [mappings]
  );

  // Campanhas disponíveis para adicionar (ainda não mapeadas)
  const availableCampaigns = useMemo(
    () => allCampaigns.filter((c) => !mappedCampaigns.has(c)),
    [allCampaigns, mappedCampaigns]
  );

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleRemoveMapping = async (campaignName: string) => {
    setSaving(true);
    try {
      await dataService.deleteCampaignMapping(campaignName);
      setMappings((prev) => prev.filter((m) => m.campaign_name !== campaignName));
      onMappingsChanged?.();
    } catch {
      setError('Erro ao remover mapeamento');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCampaignToObjective = async (objective: string) => {
    const campaign = useCustom ? customCampaign.trim() : selectedCampaign;
    if (!campaign) return;

    setSaving(true);
    setError('');
    try {
      await dataService.upsertCampaignMapping({ campaign_name: campaign, objective });
      setMappings((prev) => [...prev, { campaign_name: campaign, objective }]);
      setSelectedCampaign('');
      setCustomCampaign('');
      setUseCustom(false);
      setAddingTo(null);
      onMappingsChanged?.();
    } catch {
      setError('Erro ao adicionar mapeamento');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewObjective = async () => {
    const objectiveName =
      newObjectiveKnown === '__custom__' ? newObjectiveName.trim() : newObjectiveKnown;
    const campaignName = useCustomCampaignForNew
      ? newObjectiveCampaignCustom.trim()
      : newObjectiveCampaign;

    if (!objectiveName) { setError('Informe o nome do objetivo'); return; }
    if (!campaignName) { setError('Selecione ou informe ao menos uma campanha'); return; }
    if (grouped[objectiveName]) {
      setError(`Objetivo "${objectiveName}" já existe. Adicione campanhas diretamente nele.`);
      return;
    }

    setSaving(true);
    setError('');
    try {
      await dataService.upsertCampaignMapping({ campaign_name: campaignName, objective: objectiveName });
      setMappings((prev) => [...prev, { campaign_name: campaignName, objective: objectiveName }]);
      setShowNewObjective(false);
      setNewObjectiveName('');
      setNewObjectiveKnown('__custom__');
      setNewObjectiveCampaign('');
      setNewObjectiveCampaignCustom('');
      setUseCustomCampaignForNew(false);
      setExpandedObjective(objectiveName);
      onMappingsChanged?.();
    } catch {
      setError('Erro ao criar objetivo');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Gerenciar Objetivos de Mídia</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Mapeia campanhas aos objetivos — define filtros e cálculo de spend realizado
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={28} className="text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 text-sm">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              {/* Lista de objetivos existentes */}
              {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([objective, campaigns]) => (
                <div key={objective} className="border border-slate-200 rounded-xl overflow-hidden">
                  {/* Objective header */}
                  <button
                    onClick={() => setExpandedObjective(expandedObjective === objective ? null : objective)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-800">
                        {getObjectiveLabel(objective)}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {campaigns.length} campanha{campaigns.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {expandedObjective === objective
                      ? <ChevronUp size={16} className="text-slate-400" />
                      : <ChevronDown size={16} className="text-slate-400" />
                    }
                  </button>

                  {/* Expanded campaigns */}
                  {expandedObjective === objective && (
                    <div className="border-t border-slate-100 px-4 py-3 space-y-2">
                      {campaigns.map((campaign) => (
                        <div key={campaign} className="flex items-center justify-between gap-2 py-1.5">
                          <span className="text-sm text-slate-700 truncate flex-1">{campaign}</span>
                          <button
                            onClick={() => handleRemoveMapping(campaign)}
                            disabled={saving}
                            className="shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                            title="Remover mapeamento"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}

                      {/* Add campaign form */}
                      {addingTo === objective ? (
                        <div className="mt-2 pt-2 border-t border-slate-100 space-y-2">
                          {!useCustom ? (
                            <select
                              value={selectedCampaign}
                              onChange={(e) => {
                                if (e.target.value === '__custom__') { setUseCustom(true); return; }
                                setSelectedCampaign(e.target.value);
                              }}
                              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="">Selecionar campanha...</option>
                              {availableCampaigns.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                              <option value="__custom__">✏️ Nome personalizado...</option>
                            </select>
                          ) : (
                            <input
                              autoFocus
                              type="text"
                              placeholder="Nome exato da campanha"
                              value={customCampaign}
                              onChange={(e) => setCustomCampaign(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAddCampaignToObjective(objective)}
                              disabled={saving || (!selectedCampaign && !customCampaign.trim())}
                              className="flex-1 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors font-medium"
                            >
                              {saving ? 'Salvando...' : 'Confirmar'}
                            </button>
                            <button
                              onClick={() => { setAddingTo(null); setSelectedCampaign(''); setCustomCampaign(''); setUseCustom(false); }}
                              className="px-3 py-1.5 text-slate-600 text-sm bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAddingTo(objective); setExpandedObjective(objective); }}
                          className="mt-1 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium py-1"
                        >
                          <Plus size={14} /> Adicionar Campanha
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {Object.keys(grouped).length === 0 && !loading && (
                <p className="text-center text-slate-400 py-6 text-sm">
                  Nenhum mapeamento configurado ainda
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer — Criar Novo Objetivo */}
        <div className="px-6 py-4 border-t border-slate-200 flex-shrink-0">
          {!showNewObjective ? (
            <button
              onClick={() => setShowNewObjective(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              <Plus size={15} /> Criar Novo Objetivo
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">Novo Objetivo</p>

              {/* Objective name */}
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newObjectiveKnown}
                  onChange={(e) => setNewObjectiveKnown(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {Object.entries(KNOWN_OBJECTIVES).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                  <option value="__custom__">✏️ Personalizado...</option>
                </select>
                {newObjectiveKnown === '__custom__' && (
                  <input
                    autoFocus
                    type="text"
                    placeholder="ex: rentabilizacao"
                    value={newObjectiveName}
                    onChange={(e) => setNewObjectiveName(e.target.value)}
                    className="px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                )}
              </div>

              {/* Campaign to start with */}
              {!useCustomCampaignForNew ? (
                <select
                  value={newObjectiveCampaign}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') { setUseCustomCampaignForNew(true); return; }
                    setNewObjectiveCampaign(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Selecionar primeira campanha...</option>
                  {availableCampaigns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__custom__">✏️ Nome personalizado...</option>
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Nome exato da campanha"
                  value={newObjectiveCampaignCustom}
                  onChange={(e) => setNewObjectiveCampaignCustom(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleCreateNewObjective}
                  disabled={saving}
                  className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40 font-medium transition-colors"
                >
                  {saving ? 'Criando...' : 'Criar Objetivo'}
                </button>
                <button
                  onClick={() => { setShowNewObjective(false); setNewObjectiveName(''); setError(''); }}
                  className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
