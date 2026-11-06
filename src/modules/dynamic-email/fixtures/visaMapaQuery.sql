-- Fonte: VDV_Automacao_Preparacao.pdf, página 5, 03/11/2026.
-- Referência documental, não executada pelo GaaS.
SELECT
  r.nr_conta,
  r.nr_cpf,
  r.ds_parceiro,
  TRY_CONVERT(DECIMAL(18,2), REPLACE(REPLACE(NULLIF(LTRIM(RTRIM(r.vlr_moda)),''),'.',''),',','.')) AS
vlr_moda,
  TRY_CONVERT(INT, TRY_CONVERT(DECIMAL(18,2),
REPLACE(REPLACE(NULLIF(LTRIM(RTRIM(r.qtd_moda)),''),'.',''),',','.'))) AS qtd_moda,
  TRY_CONVERT(DATE, NULLIF(LEFT(LTRIM(r.dt_ultima_compra_moda),10),''), 103) AS dt_ultima_compra_moda,
  TRY_CONVERT(DECIMAL(18,2), REPLACE(REPLACE(NULLIF(LTRIM(RTRIM(r.vlr_saude_beleza)),''),'.',''),',','.')) AS
vlr_saude_beleza,
  TRY_CONVERT(INT, TRY_CONVERT(DECIMAL(18,2),
REPLACE(REPLACE(NULLIF(LTRIM(RTRIM(r.qtd_saude_beleza)),''),'.',''),',','.'))) AS qtd_saude_beleza,
  TRY_CONVERT(DATE, NULLIF(LEFT(LTRIM(r.dt_ultima_compra_saude_beleza),10),''), 103) AS
dt_ultima_compra_saude_beleza,
  TRY_CONVERT(DECIMAL(18,2), REPLACE(REPLACE(NULLIF(LTRIM(RTRIM(r.vlr_eletrodomesticos)),''),'.',''),',','.'))
AS vlr_eletrodomesticos,
  TRY_CONVERT(INT, TRY_CONVERT(DECIMAL(18,2),
REPLACE(REPLACE(NULLIF(LTRIM(RTRIM(r.qtd_eletrodomesticos)),''),'.',''),',','.'))) AS qtd_eletrodomesticos,
  TRY_CONVERT(DATE, NULLIF(LEFT(LTRIM(r.dt_ultima_compra_eletrodomesticos),10),''), 103) AS
dt_ultima_compra_eletrodomesticos,
  TRY_CONVERT(DECIMAL(18,2), REPLACE(REPLACE(NULLIF(LTRIM(RTRIM(r.vlr_eletronicos)),''),'.',''),',','.')) AS
vlr_eletronicos,
  TRY_CONVERT(INT, TRY_CONVERT(DECIMAL(18,2),
REPLACE(REPLACE(NULLIF(LTRIM(RTRIM(r.qtd_eletronicos)),''),'.',''),',','.'))) AS qtd_eletronicos,
  TRY_CONVERT(DATE, NULLIF(LEFT(LTRIM(r.dt_ultima_compra_eletronicos),10),''), 103) AS
dt_ultima_compra_eletronicos,
  TRY_CONVERT(DECIMAL(18,2), REPLACE(REPLACE(NULLIF(LTRIM(RTRIM(r.vlr_brinquedos)),''),'.',''),',','.')) AS
vlr_brinquedos,
  TRY_CONVERT(INT, TRY_CONVERT(DECIMAL(18,2),
REPLACE(REPLACE(NULLIF(LTRIM(RTRIM(r.qtd_brinquedos)),''),'.',''),',','.'))) AS qtd_brinquedos,
  TRY_CONVERT(DATE, NULLIF(LEFT(LTRIM(r.dt_ultima_compra_brinquedos),10),''), 103) AS
dt_ultima_compra_brinquedos,
  TRY_CONVERT(DECIMAL(18,2), REPLACE(REPLACE(NULLIF(LTRIM(RTRIM(r.vlr_viagem)),''),'.',''),',','.')) AS
vlr_viagem,
  TRY_CONVERT(INT, TRY_CONVERT(DECIMAL(18,2),
REPLACE(REPLACE(NULLIF(LTRIM(RTRIM(r.qtd_viagem)),''),'.',''),',','.'))) AS qtd_viagem,
  TRY_CONVERT(DATE, NULLIF(LEFT(LTRIM(r.dt_ultima_compra_viagem),10),''), 103) AS dt_ultima_compra_viagem,
  TRY_CONVERT(DECIMAL(18,2), REPLACE(REPLACE(NULLIF(LTRIM(RTRIM(r.vlr_pet)),''),'.',''),',','.')) AS vlr_pet,
  TRY_CONVERT(INT, TRY_CONVERT(DECIMAL(18,2),
REPLACE(REPLACE(NULLIF(LTRIM(RTRIM(r.qtd_pet)),''),'.',''),',','.'))) AS qtd_pet,
  TRY_CONVERT(DATE, NULLIF(LEFT(LTRIM(r.dt_ultima_compra_pet),10),''), 103) AS dt_ultima_compra_pet,
  TRY_CONVERT(DECIMAL(18,2), REPLACE(REPLACE(NULLIF(LTRIM(RTRIM(r.vlr_fora_mvp)),''),'.',''),',','.')) AS
vlr_fora_mvp,
  TRY_CONVERT(INT, TRY_CONVERT(DECIMAL(18,2),
REPLACE(REPLACE(NULLIF(LTRIM(RTRIM(r.qtd_fora_mvp)),''),'.',''),',','.'))) AS qtd_fora_mvp,
  TRY_CONVERT(DATE, NULLIF(LEFT(LTRIM(r.dt_ultima_compra_fora_mvp),10),''), 103) AS dt_ultima_compra_fora_mvp,
  TRY_CONVERT(DECIMAL(18,2), REPLACE(REPLACE(NULLIF(LTRIM(RTRIM(r.vlr_nao_mapeado)),''),'.',''),',','.')) AS
vlr_nao_mapeado,
  TRY_CONVERT(INT, TRY_CONVERT(DECIMAL(18,2),
REPLACE(REPLACE(NULLIF(LTRIM(RTRIM(r.qtd_nao_mapeado)),''),'.',''),',','.'))) AS qtd_nao_mapeado,
  TRY_CONVERT(DATE, NULLIF(LEFT(LTRIM(r.dt_ultima_compra_nao_mapeado),10),''), 103) AS
dt_ultima_compra_nao_mapeado,
  DATEADD(HOUR, 3, GETDATE()) AS DT_CARGA
FROM MAPA_MCC_ENTRADA r
