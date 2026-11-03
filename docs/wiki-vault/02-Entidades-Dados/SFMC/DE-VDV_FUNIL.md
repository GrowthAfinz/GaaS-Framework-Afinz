---
tags: [entidade, sfmc, data-extension, vai-de-visa, funil, monitoramento]
tipo: entidade
camada: entidades
aliases: [VDV_FUNIL, funil Vai de Visa]
atualizado: 2026-11-03
status: confirmado
fonte: DE criada no SFMC em 03/11/2026, operador
---

# DE `VDV_FUNIL` (SFMC)

**Definição e propósito:** painel de conferência das automações do [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa|Vai de Visa]]. Cada execução grava a contagem de cada etapa, a proporção das células por grupo e um status OK/ALERTA, **acumulando histórico**. Substitui rodar queries soltas no Query Studio a cada carga.

## Grão e campos

- **PK composta:** `ID_SAFRA` + `DT_EXECUCAO` + `ETAPA` + `CD_GRUPO` + `DS_CELULA_TESTE`. Não sendable. Ação da query: **Atualizar** (Overwrite apagaria o histórico).
- **Campos (11):** `ID_SAFRA` · `DT_EXECUCAO` (Brasília) · `NR_ORDEM` · `ETAPA` · `CD_GRUPO` (`TOTAL` ou grupo) · `DS_CELULA_TESTE` (`TODAS` ou célula) · `QTD` · `PCT_ETAPA_ANTERIOR` Decimal(7,4) · `VL_CONTROLE` Decimal(18,2) · `DS_STATUS` · `DS_OBS`.

## Etapas e alertas

| Ordem | Etapa | ALERTA quando |
|---:|---|---|
| 1 | `MAPA_ENTRADA` | import vazio |
| 2 | `MAPA_TRATADA` (`VL_CONTROLE` = máx. `vlr_moda`) | nenhum valor com centavos ou máximo > 500 mil (o erro de 03/11) |
| 3 | `CRUZAMENTO` | vazio |
| 4 | `APTOS` por grupo × célula (`PCT` = proporção no grupo) | célula fora de ±3 p.p. de 45/45/10 ou 90/10 |
| 5 | `ENVIO` por grupo × célula | — (vazio na preparação) |
| 6 | `ELEGIVEL_SMS` | — |

## Query `Q_VDV_06_FUNIL`

```sql
SELECT
  'VDV_2026_11_BF' AS ID_SAFRA,
  DATEADD(HOUR, 3, GETDATE()) AS DT_EXECUCAO,
  f.NR_ORDEM, f.ETAPA, f.CD_GRUPO, f.DS_CELULA_TESTE, f.QTD,
  f.PCT_ETAPA_ANTERIOR, f.VL_CONTROLE, f.DS_STATUS, f.DS_OBS
FROM (
  SELECT 1 AS NR_ORDEM, 'MAPA_ENTRADA' AS ETAPA, 'TOTAL' AS CD_GRUPO, 'TODAS' AS DS_CELULA_TESTE,
    COUNT(*) AS QTD, CAST(NULL AS DECIMAL(7,4)) AS PCT_ETAPA_ANTERIOR, CAST(NULL AS DECIMAL(18,2)) AS VL_CONTROLE,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ALERTA' END AS DS_STATUS,
    CAST(CASE WHEN COUNT(*) = 0 THEN 'arquivo vazio ou import falhou' END AS VARCHAR(200)) AS DS_OBS
  FROM MAPA_MCC_ENTRADA

  UNION ALL
  SELECT 2, 'MAPA_TRATADA', 'TOTAL', 'TODAS', COUNT(*), NULL, MAX(vlr_moda),
    CASE WHEN SUM(CASE WHEN vlr_moda - FLOOR(vlr_moda) > 0 THEN 1 ELSE 0 END) = 0 OR MAX(vlr_moda) > 500000 THEN 'ALERTA' ELSE 'OK' END,
    CASE WHEN SUM(CASE WHEN vlr_moda - FLOOR(vlr_moda) > 0 THEN 1 ELSE 0 END) = 0 THEN 'valores sem centavos: conferir separador decimal'
         WHEN MAX(vlr_moda) > 500000 THEN 'valor maximo acima do esperado' END
  FROM MAPA_MCC

  UNION ALL
  SELECT 3, 'CRUZAMENTO', 'TOTAL', 'TODAS', COUNT(*), NULL, NULL,
    CASE WHEN COUNT(*) > 0 THEN 'OK' ELSE 'ALERTA' END, NULL
  FROM VDV_CRUZAMENTO

  UNION ALL
  SELECT 4, 'APTOS', a.CD_GRUPO, a.DS_CELULA_TESTE, COUNT(*),
    CAST(COUNT(*) AS DECIMAL(18,4)) / t.QTD_GRUPO, NULL,
    CASE WHEN ABS(CAST(COUNT(*) AS DECIMAL(18,4)) / t.QTD_GRUPO
         - CASE a.DS_CELULA_TESTE WHEN 'SEG-A' THEN 0.45 WHEN 'SEG-B' THEN 0.45 WHEN 'GEN-A' THEN 0.90 ELSE 0.10 END) > 0.03
         THEN 'ALERTA' ELSE 'OK' END,
    'proporcao da celula dentro do grupo'
  FROM VDV_APTOS a
  INNER JOIN (SELECT CD_GRUPO, COUNT(*) AS QTD_GRUPO FROM VDV_APTOS GROUP BY CD_GRUPO) t ON a.CD_GRUPO = t.CD_GRUPO
  GROUP BY a.CD_GRUPO, a.DS_CELULA_TESTE, t.QTD_GRUPO

  UNION ALL
  SELECT 5, 'ENVIO', CD_GRUPO, DS_CELULA_TESTE, COUNT(*), NULL, NULL, 'OK', NULL
  FROM VDV_ENVIO
  WHERE ID_SAFRA = 'VDV_2026_11_BF'
  GROUP BY CD_GRUPO, DS_CELULA_TESTE

  UNION ALL
  SELECT 6, 'ELEGIVEL_SMS', 'TOTAL', 'TODAS', COUNT(*), NULL, NULL, 'OK', NULL
  FROM VDV_ENVIO
  WHERE ID_SAFRA = 'VDV_2026_11_BF' AND FL_BLOQ_CELULAR = 0 AND NR_CELULAR IS NOT NULL
    AND DS_CELULA_TESTE IN ('SEG-A', 'SEG-B', 'GEN-A')
) f
```

## Relacionado

[[Automacao-VDV-Pool-de-Ofertas]] · [[DE-VDV_APTOS]] · [[DE-VDV_ENVIO]] · [[DE-MAPA_MCC]]
