---
tags: [entidade, sfmc, data-extension, vai-de-visa, grupo, celula-teste]
tipo: entidade
camada: entidades
aliases: [VDV_APTOS, DE_VDV_BASE_ELEGIVEL, Base elegível Vai de Visa]
atualizado: 2026-11-03
status: confirmado
fonte: spec Vai de Visa (out/2026) adaptada; DE e query criadas no SFMC em 03/11/2026, operador
---

# DE `VDV_APTOS` (SFMC)

**Definição e propósito:** a "foto de hoje" do [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa|Vai de Visa]]: cada CPF apto com seu **grupo de afinidade** e sua **célula do teste**. É recalculada a cada execução. Quem efetivamente entra numa safra é gravado em [[DE-VDV_ENVIO]].

> Nome anterior no planejamento: `DE_VDV_BASE_ELEGIVEL` (spec da gestão). Renomeada em 03/11/2026 para seguir o padrão `ENTRADA → CRUZAMENTO → APTOS → FUNIL` da Recência Plurix.

## Grão, chave e origem

- **Grão:** CPF. **PK:** `CPF`. **Não sendable** (contém o controle; enviar por engano invalida o teste).
- **Origem:** Query `Q_VDV_04_APTOS` sobre [[DE-VDV_CRUZAMENTO]]. Ação **Overwrite**.

## Campos (15)

`CPF` Text(50) · `FIRST_NAME` Text(50) · `EMAIL` EmailAddress · `NR_CELULAR` Phone · `FL_BLOQ_CELULAR` Number · `CANAL` Text(50) · `VL_LIMITE_DISPONIVEL` Decimal(18,2) · `DT_ULTIMA_COMPRA` Date · `VL_GASTO_12M` Decimal(18,2) · `CD_GRUPO` Text · `CD_GRUPO_SECUNDARIO` Text · `CD_REGRA_GRUPO` Text · `DS_CELULA_TESTE` Text · `ID_SAFRA` Text · `DT_ATUALIZACAO` Date.

`FIRST_NAME` (e não `PRI_NOME`) para padronizar com a `VDV_ENVIO`; o alias está na query.

## Grupos do 1º teste (safra VDV_2026_11_BF)

| `CD_GRUPO` | Regra de entrada | Afinidade usada |
|---|---|---|
| `MODA` | ≥ 2 compras em 12 meses **e** última ≤ 6 meses | MCC Moda |
| `SAUDE_BELEZA` | ≥ 2 compras em 12 meses **e** última ≤ 6 meses | MCC Saúde e Beleza (inclui farmácia) |
| `FAMILIA_PRESENTES` | ≥ 2 compras em 12 meses | MCC Brinquedos (inclui vestuário infantil) |
| `GENERICO` | não entrou em nenhum | — |

Desempate: mais compras → maior gasto → MODA, SAUDE_BELEZA, FAMILIA_PRESENTES. O segundo colocado vira `CD_GRUPO_SECUNDARIO`. Regra registrada como `CD_REGRA_GRUPO = 'V1_12M_REC6M'` (ver [[Teste-Afinidade-MCC-vs-Generico]]). Viagem, Pet, Eletro e Eletrônicos ficaram fora do 1º teste: quem tem só essas afinidades cai no Genérico.

## Sorteio da célula (duas camadas)

| Camada | Cálculo | Resultado |
|---|---|---|
| Controle 10% | `ABS(CHECKSUM(CPF + 'VDV_CONTROLE') % 100) >= 90` — **código fixo** | `SEG-C` / `GEN-C`; serve tanto para controle perene quanto por safra |
| A × B | `ABS(CHECKSUM(CPF + 'VDV_2026_11_BF') % 2)` — **código da safra** | `SEG-A` / `SEG-B` 50/50 entre os não-controle |

Esperado: grupos 45/45/10; Genérico 90/10. Conferência automática na etapa `APTOS` da [[DE-VDV_FUNIL]].

## Query `Q_VDV_04_APTOS`

O SFMC **não aceita `CROSS APPLY (VALUES …)`**; a versão final usa `UNION ALL` (ver [[SFMC-Query-Studio-e-SQL]]).

```sql
SELECT
  b.CPF, b.PRI_NOME AS FIRST_NAME, b.EMAIL, b.NR_CELULAR, b.FL_BLOQ_CELULAR, b.CANAL,
  b.VL_LIMITE_DISPONIVEL, b.DT_ULTIMA_COMPRA, b.VL_GASTO_12M,
  ISNULL(g.G1, 'GENERICO') AS CD_GRUPO,
  g.G2 AS CD_GRUPO_SECUNDARIO,
  'V1_12M_REC6M' AS CD_REGRA_GRUPO,
  CASE
    WHEN ABS(CHECKSUM(b.CPF + 'VDV_CONTROLE') % 100) >= 90
      THEN CASE WHEN g.G1 IS NULL THEN 'GEN-C' ELSE 'SEG-C' END
    WHEN g.G1 IS NULL THEN 'GEN-A'
    WHEN ABS(CHECKSUM(b.CPF + 'VDV_2026_11_BF') % 2) = 0 THEN 'SEG-A'
    ELSE 'SEG-B'
  END AS DS_CELULA_TESTE,
  'VDV_2026_11_BF' AS ID_SAFRA,
  DATEADD(HOUR, 3, GETDATE()) AS DT_ATUALIZACAO
FROM VDV_CRUZAMENTO b
LEFT JOIN (
  SELECT r.CPF,
    MAX(CASE WHEN r.RN = 1 THEN r.GRUPO END) AS G1,
    MAX(CASE WHEN r.RN = 2 THEN r.GRUPO END) AS G2
  FROM (
    SELECT u.CPF, u.GRUPO,
      ROW_NUMBER() OVER (PARTITION BY u.CPF ORDER BY u.QT DESC, u.VL DESC, u.PRIORIDADE ASC) AS RN
    FROM (
      SELECT c.CPF, 'MODA' AS GRUPO, c.QT_MODA AS QT, c.VL_MODA AS VL, 1 AS PRIORIDADE
      FROM VDV_CRUZAMENTO c
      WHERE c.QT_MODA >= 2 AND c.DT_ULT_MODA >= DATEADD(MONTH, -6, CAST(GETDATE() AS DATE))
      UNION ALL
      SELECT c.CPF, 'SAUDE_BELEZA', c.QT_SAUDE_BELEZA, c.VL_SAUDE_BELEZA, 2
      FROM VDV_CRUZAMENTO c
      WHERE c.QT_SAUDE_BELEZA >= 2 AND c.DT_ULT_SAUDE_BELEZA >= DATEADD(MONTH, -6, CAST(GETDATE() AS DATE))
      UNION ALL
      SELECT c.CPF, 'FAMILIA_PRESENTES', c.QT_BRINQUEDOS, c.VL_BRINQUEDOS, 3
      FROM VDV_CRUZAMENTO c
      WHERE c.QT_BRINQUEDOS >= 2
    ) u
  ) r
  GROUP BY r.CPF
) g ON b.CPF = g.CPF
```

## Lacunas e pendências

- Tamanho de FAMILIA_PRESENTES ainda não medido → define se o grupo fica no teste → ler a etapa APTOS do funil → Pablo.
- Controle perene × por safra → hoje fixo (`VDV_CONTROLE`), trocar o código se a decisão for sortear por safra → gestão ([[Decisões-Abertas]]).

## Relacionado

[[DE-VDV_CRUZAMENTO]] · [[DE-VDV_ENVIO]] · [[DE-VDV_FUNIL]] · [[Teste-Afinidade-MCC-vs-Generico]] · [[Automacao-VDV-Pool-de-Ofertas]]
