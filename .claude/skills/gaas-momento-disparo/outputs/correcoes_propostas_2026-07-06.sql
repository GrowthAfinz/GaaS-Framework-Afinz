-- Correções para activities — AUDITORIA 2026-07-06
-- APLICADAS em 2026-07-06 (aprovação do usuário, todos os 5 blocos). Revalidado
-- após aplicar: bu_mismatch=0, parceiro_bem_barato_underscore=0,
-- segmento_com_espaco=0, jornada_com_espaco_extra=0.
-- Projeto Supabase: mipiwxadnpwtcgfcedym (GaaS Framework Afinz)
-- Nota: journeys com "ERRO" no nome (ver higiene_taxonomia.md item 5) foram
-- confirmadas pelo usuário como legítimas — mensagens de instabilidade chamando
-- o cliente de volta. Não são erro de classificação, não precisam correção.

BEGIN;

-- 1) BU errado: jornada é B2B2C mas BU='B2C' (7 disparos, Copa jul/2026)
--    Confiança: ALTA (token B2B2C explícito no nome da jornada)
update activities
set "BU" = 'B2B2C'
where jornada = 'JOR_AQUISICAO_B2B2C_BB_CRM_AQUISICAO_COPA_PAD_SEM1'
  and "BU" = 'B2C';
-- esperado: 7 linhas afetadas

-- 2) BU errado: jornada/activity é Plurix mas BU='B2C' (2 disparos)
--    Confiança: ALTA (Activity name prefixo 'plu_' + jornada 'PLURIX')
update activities
set "BU" = 'Plurix'
where jornada in (
  'JOR_AQUISICAO_PLURIX_NA_NGD_MEIO_DE_FUNIL_PADRAO_COPA_ABRI26',
  'JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PADRAO_COPA_JUN26'
)
and "BU" = 'B2C';
-- esperado: 2 linhas afetadas

-- 3) Grafia duplicada de Parceiro (B2B2C): unificar em 'Bem Barato' (com espaço,
--    forma majoritária: 29 vs 11 linhas) — CONFIRME a grafia canônica antes de rodar.
-- update activities
-- set "Parceiro" = 'Bem Barato'
-- where "Parceiro" = 'Bem_Barato';
-- esperado: 11 linhas afetadas

-- 4) Segmento 'Recencia de Compra' -> padronizar para underscore, alinhado ao
--    resto da taxonomia (Base_Proprietaria, Aprovados_nao_convertidos...) —
--    CONFIRME se quer esse padrão antes de rodar.
-- update activities
-- set "Segmento" = 'Recencia_de_Compra'
-- where "Segmento" = 'Recencia de Compra';
-- esperado: 30 linhas afetadas

-- 5) Lixo de digitação no nome da jornada (espaço à direita / "(Copiar)") —
--    CONFIRME se são de fato duplicatas da mesma jornada antes de rodar (podem ter
--    sido criadas para representar algo diferente, ver histórico da 2ª variante).
-- update activities
-- set jornada = trim(jornada)
-- where jornada = 'JOR_AQUISICAO_B2B2C_DIA_TOPO_FUNIL_OUTUBRO_NIVER_II ';
--
-- update activities
-- set jornada = 'JOR_AQUISICAO_B2C_Novo_Limite_ABRIL_Semana1'
-- where jornada = 'JOR_AQUISICAO_B2C_Novo_Limite_ABRIL_Semana1  (Copiar)';

COMMIT;

-- Após aplicar os blocos aprovados, revalidar com:
-- select "BU", jornada, count(*) from activities
-- where (jornada ilike '%b2b2c%' and "BU" is distinct from 'B2B2C')
--    or (jornada ilike '%plurix%' and "BU" is distinct from 'Plurix')
-- group by 1,2;
-- (deve retornar 0 linhas)
