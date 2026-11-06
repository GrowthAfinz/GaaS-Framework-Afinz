---
tags: [operacao, sfmc, automation, seguros, athena, s3, cross-sell]
tipo: operacao
camada: operacao
aliases: [processos_seguros, Automação de seguros, automation seguros]
atualizado: 2026-11-04
status: proposto
status_detalhe: passos 1 a 5 em produção conforme ajuste de 23/10/2026 (confirmar); passos 6 a 9 propostos em 04/11/2026
fonte: prints da automação (operador, 23/10/2026); desenho de 04/11/2026
---

# Automação `processos_seguros` (SFMC)

**Definição e propósito:** ciclo diário de ida e volta entre o Marketing Cloud e o data lake. Manda as adesões das LPs de seguros para o S3/Athena e traz de volta a [[DE-MAPA_SEGUROS]] (posse de seguros por CPF). A proposta de 04/11/2026 acrescenta, depois do import, uma **verificação de contagem**, um **log diário de entradas e saídas** de cada seguro (a venda por CPF que hoje não existe) e a **base de segmentação** [[Segmentacao-Seguros-Celular|SEG_BASE_CPF]].

> Status: passos 1 a 5 = `a-validar` (estado combinado em 23/10/2026; confirmar se foi ao ar e se a automação voltou para Ativo). Passos 6 a 9 = `proposto`.

## Fluxo

| Passo | Atividade | Tipo | O que faz | Estado |
|---|---|---|---|---|
| 1 | `query_lp_seguros_athena` | Query | `LP_SEGUROS_GERAL` → `LP_SEGUROS_ATHENA` (Substituir), formato fixo para o Athena | 23/10 |
| 2 | `extracao_seguros_para_athena` | Extract | extrai a `LP_SEGUROS_ATHENA` (`\|`, cabeçalho, UTF-16) | 23/10 |
| 3 | `extracao_seguros_para_athena_utf8` | File Convert | UTF-16 → UTF-8 | existente |
| 4 | `transferencia_lp_seguros` | File Transfer | Safehouse → S3 `tbl_formulario_seguros_AAAA-MM-DD.csv` | existente |
| 5 | `Importação S3 Mapa Seguros` | Import | S3 `mapa_seguro.csv` → `MAPA_SEGUROS` (Sobrescrever) | existente |
| **6** | `VER_SEG_MAPA_CONTAGEM` | **Verification** | para a automação se a `MAPA_SEGUROS` tiver **menos de 600.000** linhas | proposto |
| **7** | `Q_SEG_06_MOVIMENTO` | Query | diff MAPA hoje × ontem → `SEGUROS_MOVIMENTO_LOG` (**Atualizar**) | proposto |
| **8** | `Q_SEG_07_SNAPSHOT` | Query | MAPA de hoje → `MAPA_SEGUROS_ONTEM` (Substituir) | proposto |
| **9** | `Q_SEG_08_BASE_CPF` | Query | base por CPF com clusters → `SEG_BASE_CPF` (Substituir) | proposto |
| **10** | *(a escrever)* | Query | régua rotativa: de-para CPF × seguro → `SEG_REGUA_CONTROLE` (Atualizar) | proposto 04/11 tarde |

**A ordem importa, e cada um precisa estar em um passo próprio.** Atividades do mesmo passo rodam em paralelo: se o snapshot (8) rodasse junto com o diff (7), o diff poderia comparar hoje com hoje.

**Por que a verificação (6) é obrigatória:** se o `mapa_seguro.csv` vier vazio ou truncado, o diff registraria centenas de milhares de saídas falsas, o snapshot gravaria a base vazia e o dia seguinte registraria tudo de novo como entrada. O log ficaria inutilizável. Com 644.666 linhas hoje, o limite de 600.000 dá margem para variação normal; revisar se a base crescer ou encolher.

## Primeira ativação (ordem)

1. Criar as três DEs abaixo.
2. Rodar **só** o `Q_SEG_07_SNAPSHOT` ("Executar uma vez"). Isso grava a foto inicial.
3. Só então incluir os passos 6 a 9 na automação e salvar. Sem o passo 2, o primeiro diff registra todos os detentores atuais como ENTRADA.
4. No dia seguinte, conferir o `SEGUROS_MOVIMENTO_LOG`: espera-se dezenas a poucas centenas de linhas, não milhares.

## DEs novas

**`MAPA_SEGUROS_ONTEM`** (não sendable, sem retenção). PK `CPF`.
`CPF` Text(11) PK · `afinz_assit_residencial_24h` Number · `afinz_sos_dental_dia_e_noite` Number · `acidente_pessoal_completo` Number · `acidentes_pessoais_assistencias` Number · `seguro_combo_protecao_completa` Number · `voce_bem_saude_super` Number · `vbs_ate_6meses` Number · `seguro_diaria_internacao_hospitalar` Number · `DT_FOTO` Date.

**`SEGUROS_MOVIMENTO_LOG`** (não sendable, **sem retenção**: é o histórico). PK composta `CPF` + `PRODUTO` + `DT_DETECCAO`.
`CPF` Text(11) PK · `PRODUTO` Text(30) PK · `MOVIMENTO` Text(10) (`ENTRADA` / `SAIDA`) · `DT_DETECCAO` Date PK.

**`SEG_BASE_CPF`** (não sendable: contém o grupo controle). PK `CPF`.
`CPF` Text(11) PK · `CANAL` Text(50) · `DT_ABERTURA` Date · `DIAS_CONTA` Number · `DT_ULT_COMPRA` Date · `DT_ULT_ACESSO` Date · `LIMITE_DISP` Decimal(18,2) · `FL_BLOQ_EMAIL` Number · `FL_BLOQ_CEL` Number · `FL_ATRASO` Number · `IDADE` Number · `GENERO` Text(20) · `FL_RESID` Number · `FL_DENTAL` Number · `FL_AP` Number · `FL_PROTECAO` Number · `FL_VB_SUPER` Number · `FL_VB_GRATIS` Number · `FL_JANELA_COBRANCA_VB` Number · `QT_ELETRON_12M` Number · `VL_ELETRON_12M` Decimal(18,2) · `DT_ULT_ELETRON` Date · `FL_LEAD_CELULAR_90D` Number · `CD_CLUSTER_CELULAR` Text(30) · `DS_GRUPO` Text(20) · `DT_ATUALIZACAO` Date.

## Queries

As três rodam na BU pai (Banco Afinz), onde estão a `MAPA_SEGUROS` e a `LP_SEGUROS_GERAL`: **sem** prefixo `ENT.`. Se `CLIENTES ATIVOS` ou `MAPA_MCC` estiverem em outra BU, acrescentar `ENT.` só nelas. Nenhuma usa `WITH`: o Query Studio não aceita (erro "Field name cannot be blank").

### `Q_SEG_06_MOVIMENTO` → `SEGUROS_MOVIMENTO_LOG` (Atualizar)

```sql
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
```

### `Q_SEG_07_SNAPSHOT` → `MAPA_SEGUROS_ONTEM` (Substituir)

```sql
/* Q_SEG_07_SNAPSHOT
   Passo 8 da processos_seguros, SEMPRE em passo separado e DEPOIS do Q_SEG_06_MOVIMENTO.
   Guarda a foto de hoje para o diff de amanhã.
   Destino: MAPA_SEGUROS_ONTEM   Ação: SUBSTITUIR
   Primeira vez: rodar SOZINHA (Executar uma vez) antes de ligar o passo 7. Sem isso, o primeiro diff
   registra todos os detentores atuais como ENTRADA. */
SELECT
  RIGHT('00000000000' + CPF, 11)          AS CPF,
  afinz_assit_residencial_24h             AS afinz_assit_residencial_24h,
  afinz_sos_dental_dia_e_noite            AS afinz_sos_dental_dia_e_noite,
  acidente_pessoal_completo               AS acidente_pessoal_completo,
  acidentes_pessoais_assistencias         AS acidentes_pessoais_assistencias,
  seguro_combo_protecao_completa          AS seguro_combo_protecao_completa,
  voce_bem_saude_super                    AS voce_bem_saude_super,
  vbs_ate_6meses                          AS vbs_ate_6meses,
  seguro_diaria_internacao_hospitalar     AS seguro_diaria_internacao_hospitalar,
  CAST(GETDATE() AS DATE)                 AS DT_FOTO
FROM MAPA_SEGUROS
```

### `Q_SEG_08_BASE_CPF` → `SEG_BASE_CPF` (Substituir)

```sql
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
```

### Conferência dos clusters (Query Studio)

```sql
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
```

### `SEG_REGUA_CONTROLE` (passo 10, proposto)

DE de-para que guarda em qual seguro cada CPF está na régua mensal. PK `CPF`. Campos: `CPF` Text(11) · `PRODUTO_ATUAL` Text(20) (`CELULAR` / `MULHER` / `RESIDENCIAL` / `PAUSA`) · `DT_ENTRADA` Date · `DT_SAIDA_PREVISTA` Date · `PRODUTOS_JA_RECEBIDOS` Text(100) · `MOTIVO_SAIDA` Text(20) · `DS_GRUPO` Text(20). Regras em [[Segmentacao-Seguros-Celular]] (seção de 04/11 tarde). A query fica para depois do alinhamento da ordem das etapas com o time de CRM.

## Usos do log de movimentos

- **Venda por CPF:** `MOVIMENTO = 'ENTRADA'` de `RESIDENCIAL_24H` na janela de 30 dias após o envio, comparando tratamento e controle da [[Segmentacao-Seguros-Celular|SEG_BASE_CPF]]. A mesma lógica vale para o Celular quando ele entrar na MAPA.
- **Cancelamento:** `SAIDA` por produto e por tempo desde a entrada. Responde se a queda por tempo de conta é cancelamento ou mudança de venda.
- **Você Bem:** passagem de `VB_GRATIS_6M` (saída) para `VB_SUPER` (entrada) mede quantos seguem pagando após o período grátis.
- **Alerta de arquivo parado:** vários dias seguidos sem nenhuma linha no log indicam que o `mapa_seguro.csv` deixou de ser atualizado.

## Lacunas e pendências

- Confirmar o estado dos passos 1 a 5 (ajuste de 23/10) e se a automação está Ativa → sem isso a numeração acima pode mudar → operador.
- Flags vigentes × canceladas → define se `SAIDA` é cancelamento → time de dados.
- Celular e Mulher fora da MAPA → o log não mede esses dois → `SEG-MAPA-MULHER`.

## Relacionado

[[DE-MAPA_SEGUROS]] · [[Segmentacao-Seguros-Celular]] · [[10-Resultados/Mecanicas/Seguros|Seguros]] · [[MOC-SFMC-DEs-e-Automations]] · [[SFMC-Query-Studio-e-SQL]]
