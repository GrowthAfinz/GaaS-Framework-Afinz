/* Conferência no Query Studio depois de popular a SEG_BASE_CPF:
   tamanho de cada cluster, controle e taxa de posse de Residencial (o análogo do Celular). */
SELECT
  b.CD_CLUSTER_CELULAR                                   AS CLUSTER,
  b.DS_GRUPO                                             AS GRUPO,
  COUNT(*)                                               AS CPFS,
  SUM(CASE WHEN b.FL_BLOQ_EMAIL = 0 THEN 1 ELSE 0 END)   AS COM_EMAIL,
  SUM(CASE WHEN b.FL_BLOQ_CEL = 0 THEN 1 ELSE 0 END)     AS COM_CELULAR,
  SUM(b.FL_RESID)                                        AS RESID,
  SUM(b.FL_JANELA_COBRANCA_VB)                           AS JANELA_VB
FROM SEG_BASE_CPF b
GROUP BY b.CD_CLUSTER_CELULAR, b.DS_GRUPO
