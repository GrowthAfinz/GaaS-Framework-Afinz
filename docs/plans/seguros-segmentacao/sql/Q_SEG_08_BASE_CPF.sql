/* Q_SEG_08_BASE_CPF
   Passo 9 da processos_seguros. Uma linha por CPF com ao menos um cartão NORMAL na CLIENTES ATIVOS.
   Junta posse de seguros (MAPA_SEGUROS), engajamento (CLIENTES ATIVOS), eletrônicos (MAPA_MCC) e leads de Celular (LP_SEGUROS_GERAL).
   Destino: SEG_BASE_CPF   Ação: SUBSTITUIR   Não sendable.
   Testar primeiro no Query Studio (sem WITH, todos os campos com alias).

   CD_CLUSTER_CELULAR (ordem de precedência):
     Y_ATRASO           alguma conta do CPF em BLOQUEADO ATRASO
     X_LEAD_RECENTE     preencheu a LP de Seguro Celular nos últimos 90 dias (vai para régua de carrinho, não de oferta)
     D_BOAS_VINDAS      primeira conta aberta há até 60 dias
     B_MOMENTO          engajado + última compra em eletrônicos há até 60 dias com ticket médio 12m >= R$ 500
     A_ENGAJADO         compra nos últimos 30 dias e acesso ao app nos últimos 30 dias
     Z_DEMAIS           o resto
   DS_GRUPO: CONTROLE (10%, semente própria de seguros, diferente da do Vai de Visa) ou TRATAMENTO. */
SELECT
  a.CPF                                                         AS CPF,
  a.CANAL                                                       AS CANAL,
  a.DT_ABERTURA                                                 AS DT_ABERTURA,
  DATEDIFF(DAY, a.DT_ABERTURA, GETDATE())                       AS DIAS_CONTA,
  a.DT_ULT_COMPRA                                               AS DT_ULT_COMPRA,
  a.DT_ULT_ACESSO                                               AS DT_ULT_ACESSO,
  a.LIMITE_DISP                                                 AS LIMITE_DISP,
  a.FL_BLOQ_EMAIL                                               AS FL_BLOQ_EMAIL,
  a.FL_BLOQ_CEL                                                 AS FL_BLOQ_CEL,
  a.FL_ATRASO                                                   AS FL_ATRASO,
  s.IDADE                                                       AS IDADE,
  ISNULL(s.SUPOSTO_GENERO, 'sem')                               AS GENERO,
  CASE WHEN ISNULL(s.afinz_assit_residencial_24h,0) > 0 THEN 1 ELSE 0 END      AS FL_RESID,
  CASE WHEN ISNULL(s.afinz_sos_dental_dia_e_noite,0) > 0 THEN 1 ELSE 0 END     AS FL_DENTAL,
  CASE WHEN ISNULL(s.acidente_pessoal_completo,0) + ISNULL(s.acidentes_pessoais_assistencias,0) > 0 THEN 1 ELSE 0 END AS FL_AP,
  CASE WHEN ISNULL(s.seguro_combo_protecao_completa,0) > 0 THEN 1 ELSE 0 END   AS FL_PROTECAO,
  CASE WHEN ISNULL(s.voce_bem_saude_super,0) > 0 THEN 1 ELSE 0 END             AS FL_VB_SUPER,
  CASE WHEN ISNULL(s.vbs_ate_6meses,0) > 0 THEN 1 ELSE 0 END                   AS FL_VB_GRATIS,
  CASE WHEN ISNULL(s.vbs_ate_6meses,0) > 0
        AND DATEDIFF(DAY, a.DT_ABERTURA, GETDATE()) BETWEEN 150 AND 240 THEN 1 ELSE 0 END AS FL_JANELA_COBRANCA_VB,
  ISNULL(c.QT_ELETRON, 0)                                       AS QT_ELETRON_12M,
  ISNULL(c.VL_ELETRON, 0)                                       AS VL_ELETRON_12M,
  c.DT_ULT_ELETRON                                              AS DT_ULT_ELETRON,
  CASE WHEN l.CPF IS NOT NULL THEN 1 ELSE 0 END                 AS FL_LEAD_CELULAR_90D,
  CASE
    WHEN a.FL_ATRASO = 1 THEN 'Y_ATRASO'
    WHEN l.CPF IS NOT NULL THEN 'X_LEAD_RECENTE'
    WHEN DATEDIFF(DAY, a.DT_ABERTURA, GETDATE()) <= 60 THEN 'D_BOAS_VINDAS'
    WHEN a.DT_ULT_COMPRA >= DATEADD(DAY,-30,GETDATE()) AND a.DT_ULT_ACESSO >= DATEADD(DAY,-30,GETDATE())
         AND c.DT_ULT_ELETRON >= DATEADD(DAY,-60,GETDATE())
         AND c.QT_ELETRON > 0 AND c.VL_ELETRON / c.QT_ELETRON >= 500 THEN 'B_MOMENTO'
    WHEN a.DT_ULT_COMPRA >= DATEADD(DAY,-30,GETDATE()) AND a.DT_ULT_ACESSO >= DATEADD(DAY,-30,GETDATE()) THEN 'A_ENGAJADO'
    ELSE 'Z_DEMAIS'
  END                                                           AS CD_CLUSTER_CELULAR,
  CASE WHEN ABS(CHECKSUM(a.CPF + 'SEG_CEL_CONTROLE') % 100) >= 90 THEN 'CONTROLE' ELSE 'TRATAMENTO' END AS DS_GRUPO,
  CAST(GETDATE() AS DATE)                                       AS DT_ATUALIZACAO
FROM (
  SELECT
    CPF                                                                  AS CPF,
    MAX(CASE WHEN STATUS = 'NORMAL' THEN 1 ELSE 0 END)                   AS FL_NORMAL,
    MAX(CASE WHEN STATUS = 'BLOQUEADO ATRASO' THEN 1 ELSE 0 END)         AS FL_ATRASO,
    MAX(CANAL)                                                           AS CANAL,
    MIN(DATA_ABERTURA_CONTA)                                             AS DT_ABERTURA,
    MAX(DATA_ULTIMA_COMPRA)                                              AS DT_ULT_COMPRA,
    MAX(ULTIMO_ACESSO)                                                   AS DT_ULT_ACESSO,
    MAX(CASE WHEN STATUS = 'NORMAL' THEN LIMITE_DISPONIVEL END)          AS LIMITE_DISP,
    MAX(CASE WHEN bloqueio_email = 1 THEN 1 ELSE 0 END)                  AS FL_BLOQ_EMAIL,
    MAX(CASE WHEN bloqueio_celular = 1 THEN 1 ELSE 0 END)                AS FL_BLOQ_CEL
  FROM [CLIENTES ATIVOS]
  GROUP BY CPF
) a
LEFT JOIN MAPA_SEGUROS s
  ON RIGHT('00000000000' + s.CPF, 11) = a.CPF
LEFT JOIN (
  SELECT k.CPF                                 AS CPF,
         SUM(ISNULL(m.qtd_eletronicos,0))      AS QT_ELETRON,
         SUM(ISNULL(m.vlr_eletronicos,0))      AS VL_ELETRON,
         MAX(m.dt_ultima_compra_eletronicos)   AS DT_ULT_ELETRON
  FROM (SELECT DISTINCT CPF, NR_CONTA FROM [CLIENTES ATIVOS]) k
  JOIN MAPA_MCC m ON m.nr_conta = k.NR_CONTA
  GROUP BY k.CPF
) c ON c.CPF = a.CPF
LEFT JOIN (
  SELECT DISTINCT RIGHT('00000000000' + CPF, 11) AS CPF
  FROM LP_SEGUROS_GERAL
  WHERE produto LIKE 'Seguro Celular%'
    AND data_preenchimento >= DATEADD(DAY, -90, GETDATE())
) l ON l.CPF = a.CPF
WHERE a.FL_NORMAL = 1
