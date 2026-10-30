# Higiene BU × Parceiro × Segmento × Jornada — checklist reaproveitável

A árvore da aba Comunicações/Explorador Avançado agrupa **estritamente pelas colunas
estruturadas** `activities.BU` → `activities.Segmento` → `activities.jornada`
(ver `calendar-estrategico/src/hooks/explorer/useTreeData.ts:151-224` — não faz
parsing do nome, confia 100% no dado gravado). Qualquer erro de digitação/import na
coluna aparece na árvore como se fosse estrutural. Rode estas queries (projeto Supabase
`mipiwxadnpwtcgfcedym`) antes de confiar num recorte, e sempre que o usuário reportar
"essa jornada está na pasta errada":

## 1. BU divergente do token explícito no nome da jornada

```sql
select "BU", jornada, count(*) n, min("Data de Disparo"), max("Data de Disparo")
from activities
where (jornada ilike '%b2b2c%' and "BU" is distinct from 'B2B2C')
   or (jornada ilike '%plurix%' and "BU" is distinct from 'Plurix')
group by 1,2 order by n desc;
```

**Achado real (2026-07-06):**
- `JOR_AQUISICAO_B2B2C_BB_CRM_AQUISICAO_COPA_PAD_SEM1` — 7 disparos com `BU='B2C'`,
  deveria ser `BU='B2B2C'` (disparos de 01–05/07/2026).
- 2 disparos com `Activity name` prefixo `plu_` (Plurix inequívoco) mas `BU='B2C'`:
  `JOR_AQUISICAO_PLURIX_NA_NGD_MEIO_DE_FUNIL_PADRAO_COPA_ABRI26` (21/04/2026) e
  `JOR_AQUISICAO_PLURIX_NA_ANC_MEIO_DE_FUNIL_PADRAO_COPA_JUN26` (28/05/2026).

Nenhum desses foi corrigido — correção exige aprovação humana (ver seção "Como propor
a correção" abaixo).

## 2. Grafia duplicada de Parceiro (mesmo parceiro, duas strings)

```sql
select "BU","Parceiro", count(*) n
from activities
where "Parceiro" in ('Bem Barato','Bem_Barato')
group by 1,2;
```

**Achado real:** `Bem Barato` (29 linhas, espaço) vs `Bem_Barato` (11 linhas,
underscore) sob `BU='B2B2C'` — mesmo parceiro, dois valores. Quebra dropdowns/filtros
que comparam string exata (ex.: `SmartSelect` de Parceiro no modal de disparo).

## 3. Segmento fora do padrão de nomenclatura (espaço vs. underscore)

Todo `Segmento` canônico usa underscore (`Base_Proprietaria`,
`Aprovados_nao_convertidos`, `Leads_Parceiros`) — exceto:

```sql
select "Segmento", count(*) n from activities where "Segmento" = 'Recencia de Compra' group by 1;
```

**Achado real:** `Recencia de Compra` (30 linhas, B2B2C+Plurix) com espaços.
Cosmético, mas quebra a convenção e pode duplicar filtros no futuro se alguém
digitar `Recencia_de_Compra` em paralelo.

## 4. Nomes de jornada com lixo de digitação (espaço/duplicata manual)

```sql
select jornada, length(jornada) len, count(*) n
from activities
where jornada <> trim(jornada) or jornada ~ '  '
group by 1,2;
```

**Achado real:**
- `JOR_AQUISICAO_B2B2C_DIA_TOPO_FUNIL_OUTUBRO_NIVER_II ` (espaço à direita) — cria nó
  duplicado do que deveria ser a mesma jornada de `NIVER_II` / `NIVER_II _2`.
- `JOR_AQUISICAO_B2C_Novo_Limite_ABRIL_Semana1  (Copiar)` — sobra de duplicação manual
  ("(Copiar)"), duplo espaço.

## 5. Jornadas com "ERRO" no nome — não é bug, é rótulo operacional

10 disparos (mai/2025–abr/2026, `status='Realizado'`) têm `ERRO` no nome da jornada ou
do activity (ex.: `JOR_AQUISICAO_B2C_ERRO_DIA_19_3005`,
`JOR_AQUISICAO_B2C_SERASA_ERRO_AGOSTO`). **Confirmado pelo usuário (2026-07-06):** são
disparos legítimos de **mensagem de instabilidade chamando o cliente de volta** (ex.:
sistema fora do ar, "voltamos, retome sua proposta"), não erro de classificação. Ficam
como estão (`Segmento='Instabilidade'` na maioria) — nenhuma ação necessária.

## Status desta auditoria

Todos os itens 1–4 foram corrigidos em produção em 2026-07-06 (ver
`.claude/skills/gaas-momento-disparo/outputs/correcoes_propostas_2026-07-06.sql`,
aplicado e revalidado com 0 divergências restantes). Esta lista de queries continua
valendo como checklist para futuras auditorias — os achados específicos acima já
foram resolvidos, mas os *padrões* de erro (BU vs. token de jornada, grafia duplicada
de parceiro, segmento com espaço, jornada com lixo de digitação) podem se repetir a
cada novo import.

## Como propor a correção (nunca aplicar sozinho)

1. Monte o `UPDATE` explícito por jornada/activity_name (não por `id` solto — mais
   auditável) e mostre ao usuário antes de rodar:
   ```sql
   update activities set "BU" = 'B2B2C'
   where jornada = 'JOR_AQUISICAO_B2B2C_BB_CRM_AQUISICAO_COPA_PAD_SEM1' and "BU" = 'B2C';
   ```
2. Rode via `apply_migration` (não `execute_sql`) se a mudança for de dado
   estruturado relevante para o schema/histórico, e só após o usuário confirmar
   explicitamente cada bloco (BU, Parceiro, Segmento são decisões separadas — o
   usuário pode aprovar uma e não as outras).
3. Depois de aplicar, rode a query da seção correspondente de novo para confirmar
   `n=0` linhas divergentes.

## Causa raiz (para não repetir)

O importador (`IntelligentFrameworkUpdate.tsx`) só herda BU/Segmento do histórico por
jornada no fluxo de **rentabilização** (`activeFlow === 'rentabilizacao'`, ver
`rentHistory`/`buildRentHistoryIndex`, linha ~3054-3064). O fluxo de **aquisição**
aceita o `BU` cru da planilha de origem sem checar contra os tokens do nome da
jornada — é assim que uma linha `B2B2C_...` na planilha entra com `BU=B2C` se o
operador digitou/colou errado a coluna BU na fonte. Ver proposta de correção em
`.claude/skills/gaas-governanca-comunicacoes/references/taxonomia_marcas.md` (seção
de validação sugerida) antes de mexer no importador.
