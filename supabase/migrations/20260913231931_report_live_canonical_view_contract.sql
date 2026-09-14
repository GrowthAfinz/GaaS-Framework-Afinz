-- Align the historical-band aliases with the Phase 2 consumer contract.
-- This changes only view metadata; activities and its generated columns are untouched.

alter view public.v_aquisicao_mensal_canonico
  rename column tx_finalizacao_min_6m to tx_final_min_6m;

alter view public.v_aquisicao_mensal_canonico
  rename column tx_finalizacao_max_6m to tx_final_max_6m;
