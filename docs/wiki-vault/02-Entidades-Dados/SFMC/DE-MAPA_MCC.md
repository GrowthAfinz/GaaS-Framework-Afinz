---
tags: [entidade, sfmc, data-extension, mcc, transacao, rentabilizacao, sftp]
tipo: entidade
camada: entidades
aliases: [MAPA_MCC, MAPA MCC, DE MAPA_MCC, Mapa de MCC]
atualizado: 2026-11-09
status: a-validar
fonte: arquivo MAPA_MCC (IN, recebido 03/11/2026) perfilado em Python; import e validação no SFMC 03/11/2026, operador
---

# DE `MAPA_MCC` (SFMC)

### `MAPA_MCC` e `MAPA_MCC_ENTRADA` · origem por conta

MAPA_MCC_ENTRADA guarda os 30 campos do arquivo como Text, PK nr_conta, não enviável. A importação por SFTP e sua cadência não foram comprovadas como automáticas. MAPA_MCC tem os 30 campos tratados mais DT_CARGA (31 campos), PK nr_conta, não enviável e carga Overwrite pela Q_VDV_02_MAPA. Não usar o CPF como PK da MAPA.

| Família / campo | Tipo de referência | Nulo | Uso |
|---|---|---|---|
| nr_conta | Text(20), PK | Não | Conta; join com NR_CONTA da CLIENTES ATIVOS |
| nr_cpf | Text(11) | Não | CPF informativo; preservar zeros |
| ds_parceiro | Text(50) | Sim | Parceiro da conta na origem; não substitui a regra NM_PARCEIRO |
| vlr_categoria (nove) | Decimal(18,2) | Sim | Valor em 12 meses, inclusive estornos negativos |
| qtd_categoria (nove) | Number | Sim | Quantidade conforme definição da IN ainda a confirmar |
| dt_ultima_compra_categoria (nove) | Date | Sim | Última compra da categoria |
| DT_CARGA | Date | Sim, conforme ficha anterior | Carimbo da conversão atual; não é referência do arquivo IN |

As nove categorias são moda, saude_beleza, eletrodomesticos, eletronicos, brinquedos, viagem, pet, fora_mvp e nao_mapeado. A SQL fornecida foi preservada integralmente. TRY_CONVERT inválido gera NULL e não deve ser interpretado como zero. Arquivo em vírgula decimal recebe remoção do ponto de milhar; mudar o padrão da origem exige revisar a conversão, não reaplicar cegamente. Duplicidade de nr_conta impede uma carga válida na PK.

Pasta de entrada documentada: Cartonistas; pasta/External Key de MAPA e retenção a conferir. Não sobrescrever a origem válida para testar um arquivo incompleto. O monitor de centavos/máximo em Moda é auxiliar e não certifica as nove categorias.

:::details Q_VDV_02_MAPA · SQL fornecido pela operação em 09/11
### Q_VDV_02_MAPA

**Finalidade:** Converter texto do arquivo para valores, quantidades e datas.

| Configuração | Valor |
|---|---|
| Tipo / automação | Query Activity · PREPARAÇÃO · passo 1 |
| Fonte | MAPA_MCC_ENTRADA |
| Destino / ação | MAPA_MCC · Overwrite |
| Pré-condições | Entrada completa, nr_conta única e formato brasileiro reconfirmado. |
| Conferência | Contagem tratada igual à entrada; amostras de nove categorias, datas e valores conferidos contra o arquivo. |
| Limitação / recuperação | TRY_CONVERT pode resultar NULL. DT_CARGA prova tratamento, não frescor da IN. Não dividir todos os valores por 100 para corrigir import antigo. |
| Arquivo de referência | 01_Q_VDV_02_MAPA.sql |
| Estado | Montagem informada; execução completa pendente de validação. |

SQL integral preservado, sem regenerar a partir do pacote intermediário de duas automações:

```sql
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
```
:::


:::details Histórico anterior a 09/11 · não executar como instrução vigente
### DE `MAPA_MCC` (SFMC)

**Definição e propósito:** mapa de consumo por categoria de [[MCC]] de cada conta de cartão, nos últimos 12 meses: quanto gastou, quantas compras fez e quando foi a última compra em cada categoria. Produzido pela IN (Inteligência), entregue por SFTP e importado no Marketing Cloud. Alimenta a afinidade do [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa|Vai de Visa]] e pode servir a qualquer segmentação por hábito de compra.

> Status: estrutura, import e perfil = `confirmado`; regra de contagem da fonte (parcelas, estornos) = `a-validar`.

### Grão, chave e origem

- **Grão:** uma linha por **conta** (`nr_conta`). 652.614 linhas, 652.614 contas.
- **Chave primária:** `nr_conta`. O CPF **não** é único: ~5,9 mil CPFs têm mais de uma conta (no arquivo de origem: 646.713 CPFs distintos).
- **Origem:** IN, arquivo `MAPA_MCC.csv` no SFTP. Primeiro arquivo recebido também em xlsx (aba `Consulta1`).
- **Janela:** 12 meses — datas de 23/10/2025 a 22/10/2026 no corte recebido. Não há campo de data de referência no arquivo; `DT_CARGA` foi acrescentado na DE.
- **Atualização:** sob demanda (a confirmar a cadência com a IN). Import em **Overwrite**: é uma foto, não histórico.
- **Sendable:** não.

### Campos (31)

| Campo | Tipo | Tam. | PK | Nulo | Conteúdo |
|---|---|---:|:-:|:-:|---|
| `nr_conta` | Text | 20 | ✓ | Não | 19 dígitos — chave de join com [[DE-CLIENTES_ATIVOS]] (`NR_CONTA`) |
| `nr_cpf` | Text | 11 | | Não | **Text**, senão perde o zero à esquerda |
| `ds_parceiro` | Text | 50 | | Sim | parceiro/emissor da conta (1.577 valores; ex.: `LE BISCUIT`, `AMIGAO SUP PLURIX`, `INSTITUCIONAL AFINZ VISA`); 351 nomes têm vírgula |
| `vlr_<cat>` × 9 | Decimal | 18,2 | | Sim | gasto na categoria em 12 meses; **aceita negativo** (estorno) |
| `qtd_<cat>` × 9 | Number | | | Sim | quantidade de compras em 12 meses |
| `dt_ultima_compra_<cat>` × 9 | Date | | | Sim | última compra na categoria |
| `DT_CARGA` | Date | | | Sim | padrão: data atual |

Categorias (`<cat>`): `moda`, `saude_beleza`, `eletrodomesticos`, `eletronicos`, `brinquedos`, `viagem`, `pet` (as 7 do MVP), mais `fora_mvp` (MCCs mistos: departamento, marketplace) e `nao_mapeado`.

### Perfil

> 📊 Arquivo recebido em 03/11/2026, 652.614 contas.

- **Sem nenhuma transação nos 12 meses:** 177.708 contas (27% das contas; 175.093 CPFs).
- **Sem compra em categoria MVP:** 47% dos CPFs — para eles não há personalização por MCC.
- **Quantas categorias MVP por conta:** 0 → 308.852 · 1 → 94.974 · 2 → 98.916 · 3 → 78.977 · 4 → 44.858 · 5+ → 26.037.
- **Recência da última compra (qualquer categoria):** ≤ 30 dias 307 mil · 31–90 dias 80 mil · 91–180 dias 49 mil · 181–365 dias 36 mil.
- **Valores negativos:** 12 a 64 linhas por categoria (estornos). Tratar como zero na afinidade.
- **Qualidade:** 1 CPF inválido (dígito verificador) no arquivo.
- Por categoria (compradores, mediana, p90): ver [[MCC]].

### Como importar (validado em 03/11/2026)

| Configuração | Valor | Por quê |
|---|---|---|
| Formato | CSV com `;` | o Import Activity **não lê .xlsx** |
| Separador decimal | **ponto** | vírgula é lida como milhar e multiplica valores com centavos por 100 |
| Respeitar aspas duplas | **marcado** | campos entre aspas e nomes de parceiro com vírgula |
| Formato de data | **dd/MM/aaaa** (pt-BR) | ver caso abaixo |
| Ação | **Overwrite** | foto do período; remove contas que saíram |

**Caso real — 404.819 erros "Data inválida":** o primeiro import inseriu 247.795 linhas e rejeitou 404.819. A conta fecha exatamente com "linhas cujas datas têm todas dia ≤ 12 (ou nenhuma data)" = 247.795: o wizard leu dd/MM como MM/dd. **As ~70 mil linhas inseridas com data entraram com dia e mês trocados, sem erro.** Correção: formato de data + Overwrite; segundo import com 652.614 inseridos e 0 erros. Regra geral em [[SFMC-Salesforce-Marketing-Cloud]] (importação).

**Caso real 2 — valores 100× maiores (03/11/2026):** depois do reimport, `MAX(vlr_moda)` = 8.548.054,00 e nenhum valor com centavos, contra R$ 85.480,54 no arquivo de origem. O separador decimal vírgula foi lido como separador de milhar: `425,38` virou `42538`, enquanto valores inteiros (`35`) passaram certos. **Não dá para corrigir dividindo por 100**, porque inteiros e decimais se misturam; é preciso reimportar com ponto decimal. Quantidades e datas não são afetadas. Esta validação de contagem não pegou o problema, por isso a checagem de máximo e centavos abaixo passou a ser obrigatória.

### Fluxo vigente: entrada em texto + conversão em SQL (desde 03/11/2026)

Como o arquivo no SFTP é fixo e usa vírgula decimal, a carga passou a ter duas DEs:

1. **`MAPA_MCC_ENTRADA`**: mesmos 30 campos do arquivo, **todos Text** (30; `nr_conta` PK). O import só copia texto; formato de data e decimal deixam de importar.
2. **`MAPA_MCC`**: preenchida pela `Q_VDV_02_MAPA` (ver [[Automacao-VDV-Pool-de-Ofertas]]): tira ponto de milhar, troca vírgula por ponto, `TRY_CONVERT` para Decimal/Int e data com estilo 103 (dd/mm/aaaa). `DT_CARGA = DATEADD(HOUR, 3, GETDATE())`.

Formato observado no arquivo (03/11/2026): valores `943,24`; quantidades inteiras; datas `02/10/2026`; `0` (não vazio) quando não há compra.

> 📊 Validação após a conversão (03/11/2026): 652.614 linhas · `max(vlr_moda)` = **85.480,54** · 189.884 valores com centavos · 233.554 compradores de Moda · datas de 23/10/2025 a 22/10/2026. Bate com o arquivo de origem.

### Validação pós-import

```sql
SELECT
  COUNT(*) AS linhas,
  MIN(dt_ultima_compra_moda) AS dt_min_moda,
  MAX(dt_ultima_compra_moda) AS dt_max_moda,
  SUM(CASE WHEN vlr_moda > 0 THEN 1 ELSE 0 END) AS compradores_moda,
  SUM(CASE WHEN vlr_saude_beleza > 0 THEN 1 ELSE 0 END) AS compradores_saude,
  SUM(CASE WHEN LEN(nr_cpf) = 11 THEN 1 ELSE 0 END) AS cpf_11dig
FROM MAPA_MCC
```

```sql
SELECT MAX(vlr_moda) AS max_moda,
  SUM(CASE WHEN vlr_moda - FLOOR(vlr_moda) > 0 THEN 1 ELSE 0 END) AS com_centavos
FROM MAPA_MCC
```

Esperado (valores): `max_moda` = 85480.54 e `com_centavos` muito acima de zero. Esperado no corte de 03/11/2026: 652.614 · 23/10/2025 · 22/10/2026 · 233.554 · 289.167 · 652.614 (resultado conferido no Query Studio). Não usar `COUNT(DISTINCT nr_cpf)` no Query Studio: devolveu 652.614 em vez de 646.713 (ver [[SFMC-Query-Studio-e-SQL]]).

### Joins

- **Com [[DE-CLIENTES_ATIVOS]] por `nr_conta = NR_CONTA`.** Match de 99,8% das contas elegíveis (129.955 de 130.228 CPFs, 03/11/2026).
- Para somar por cliente: `FROM (SELECT DISTINCT CPF, NR_CONTA FROM [CLIENTES ATIVOS]) c INNER JOIN MAPA_MCC m ON c.NR_CONTA = m.nr_conta GROUP BY c.CPF` — o `DISTINCT` impede somar a mesma conta uma vez por cartão.

### Lacunas e pendências

- Só há quantidade em 12 meses → regra de 6 meses para Moda/Saúde e Beleza/Pet fica aproximada → acrescentar `qtd_6m_<cat>` no arquivo → IN.
- Não se sabe se `qtd` conta parcela como compra e se exclui estorno → pode inflar o limiar "≥ 2 compras" → confirmar regra de cálculo → IN.
- Datas sem padrão ISO → risco de inversão em todo import → pedir `yyyy-MM-dd` → IN.
- Cadência e responsável pela atualização no SFTP → impede automatizar o import → combinar com a IN → operação.

### Relacionado

[[MCC]] · [[DE-CLIENTES_ATIVOS]] · [[DE-VDV_APTOS]] · [[MOC-SFMC-DEs-e-Automations]] · [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa]] · [[SFMC-Query-Studio-e-SQL]]
:::

