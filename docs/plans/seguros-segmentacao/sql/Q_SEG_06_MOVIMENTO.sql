/* Q_SEG_06_MOVIMENTO
   Passo 7 da processos_seguros (depois do import da MAPA e da verificação).
   Compara a MAPA_SEGUROS de hoje com a MAPA_SEGUROS_ONTEM e grava cada mudança de posse.
   Destino: SEGUROS_MOVIMENTO_LOG   Ação: ATUALIZAR (PK CPF + PRODUTO + DT_DETECCAO; reexecução no mesmo dia não duplica)
   Ausência do CPF em um dos lados conta como 0.
   Para incluir um produto novo (ex.: Seguro Mulher), acrescentar uma linha no CROSS JOIN e um WHEN em cada CASE. */
SELECT
  x.CPF                                                         AS CPF,
  x.PRODUTO                                                     AS PRODUTO,
  CASE WHEN x.HOJE = 1 THEN 'ENTRADA' ELSE 'SAIDA' END          AS MOVIMENTO,
  CAST(GETDATE() AS DATE)                                       AS DT_DETECCAO
FROM (
  SELECT
    COALESCE(t.CPF, y.CPF) AS CPF,
    p.PRODUTO              AS PRODUTO,
    CASE p.PRODUTO
      WHEN 'RESIDENCIAL_24H' THEN CASE WHEN ISNULL(t.afinz_assit_residencial_24h,0) > 0 THEN 1 ELSE 0 END
      WHEN 'SOS_DENTAL'      THEN CASE WHEN ISNULL(t.afinz_sos_dental_dia_e_noite,0) > 0 THEN 1 ELSE 0 END
      WHEN 'AP_COMPLETO'     THEN CASE WHEN ISNULL(t.acidente_pessoal_completo,0) > 0 THEN 1 ELSE 0 END
      WHEN 'AP_ASSISTENCIAS' THEN CASE WHEN ISNULL(t.acidentes_pessoais_assistencias,0) > 0 THEN 1 ELSE 0 END
      WHEN 'PROTECAO_COMPLETA' THEN CASE WHEN ISNULL(t.seguro_combo_protecao_completa,0) > 0 THEN 1 ELSE 0 END
      WHEN 'VB_SUPER'        THEN CASE WHEN ISNULL(t.voce_bem_saude_super,0) > 0 THEN 1 ELSE 0 END
      WHEN 'VB_GRATIS_6M'    THEN CASE WHEN ISNULL(t.vbs_ate_6meses,0) > 0 THEN 1 ELSE 0 END
      WHEN 'DIH'             THEN CASE WHEN ISNULL(t.seguro_diaria_internacao_hospitalar,0) > 0 THEN 1 ELSE 0 END
    END AS HOJE,
    CASE p.PRODUTO
      WHEN 'RESIDENCIAL_24H' THEN CASE WHEN ISNULL(y.afinz_assit_residencial_24h,0) > 0 THEN 1 ELSE 0 END
      WHEN 'SOS_DENTAL'      THEN CASE WHEN ISNULL(y.afinz_sos_dental_dia_e_noite,0) > 0 THEN 1 ELSE 0 END
      WHEN 'AP_COMPLETO'     THEN CASE WHEN ISNULL(y.acidente_pessoal_completo,0) > 0 THEN 1 ELSE 0 END
      WHEN 'AP_ASSISTENCIAS' THEN CASE WHEN ISNULL(y.acidentes_pessoais_assistencias,0) > 0 THEN 1 ELSE 0 END
      WHEN 'PROTECAO_COMPLETA' THEN CASE WHEN ISNULL(y.seguro_combo_protecao_completa,0) > 0 THEN 1 ELSE 0 END
      WHEN 'VB_SUPER'        THEN CASE WHEN ISNULL(y.voce_bem_saude_super,0) > 0 THEN 1 ELSE 0 END
      WHEN 'VB_GRATIS_6M'    THEN CASE WHEN ISNULL(y.vbs_ate_6meses,0) > 0 THEN 1 ELSE 0 END
      WHEN 'DIH'             THEN CASE WHEN ISNULL(y.seguro_diaria_internacao_hospitalar,0) > 0 THEN 1 ELSE 0 END
    END AS ONTEM
  FROM (
    SELECT RIGHT('00000000000' + CPF, 11) AS CPF,
           afinz_assit_residencial_24h, afinz_sos_dental_dia_e_noite, acidente_pessoal_completo,
           acidentes_pessoais_assistencias, seguro_combo_protecao_completa, voce_bem_saude_super,
           vbs_ate_6meses, seguro_diaria_internacao_hospitalar
    FROM MAPA_SEGUROS
  ) t
  FULL OUTER JOIN MAPA_SEGUROS_ONTEM y ON y.CPF = t.CPF
  CROSS JOIN (
              SELECT 'RESIDENCIAL_24H' AS PRODUTO
    UNION ALL SELECT 'SOS_DENTAL' AS PRODUTO
    UNION ALL SELECT 'AP_COMPLETO' AS PRODUTO
    UNION ALL SELECT 'AP_ASSISTENCIAS' AS PRODUTO
    UNION ALL SELECT 'PROTECAO_COMPLETA' AS PRODUTO
    UNION ALL SELECT 'VB_SUPER' AS PRODUTO
    UNION ALL SELECT 'VB_GRATIS_6M' AS PRODUTO
    UNION ALL SELECT 'DIH' AS PRODUTO
  ) p
) x
WHERE x.HOJE <> x.ONTEM
