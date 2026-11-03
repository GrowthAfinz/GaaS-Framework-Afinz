---
tags: [dados, gaas, activities, taxonomia, parceiro, armadilha, report-live]
tipo: entidade
camada: dados
tipo_diataxis: reference
criado: 2026-09-13
atualizado: 2026-09-13
status: confirmado
fonte: codigo-gaas
aliases: [Chave Canônica de Parceiro, Parceiro N/A, resolvePartner]
---

# Dimensão canônica de parceiro

**Definição:** a regra com que o Report Live deriva a dimensão "Parceiro" a partir de [[activities]] — implementada em `resolvePartner()`, aplicada em tempo de leitura e **nunca persistida**, razão pela qual a coluna `Parceiro` sozinha não reproduz os números publicados no deck.

## Contexto

O engine deriva o parceiro canônico em TypeScript durante o build e descarta o resultado. Não existe coluna nem view: `VIEW_PARTNER_RESOLUTION`, citada no comentário do código, é uma aba do Sheets — **não uma view do Postgres** (verificado em `information_schema`). Consequência: quem consulta `activities` direto chega a número diferente do deck, e a procedência da resolução não é auditável em SQL.

## A regra real

Fonte: `calendar-estrategico/supabase/functions/report-sync/report-live-engine.ts`, função `resolvePartner()` (≈linha 184), aplicada em `buildReport()` (≈893–897), antes de qualquer agrupamento.

Precedência, do sinal mais forte ao mais fraco:

| # | Condição | Resultado | Motivo | Confiança |
|---|---|---|---|---|
| 1 | Parceiro preenchido e ≠ `N/A` | **o valor bruto, literal** | `EXPLICIT_PARTNER` | alta |
| 2 | `BU='Plurix'` **e** token `(^\|_)(plu\|plx\|plurix)` no Activity Name **ou** `plurix` na jornada | `Plurix` | `BU_PLURIX_SELF_ATTRIBUTION` | alta |
| 3 | `BU='B2C'` | `Proprietaria` | `B2C_INSTITUTIONAL_OWN_BASE` se o Activity casa `institucional\|inst(?![a-z])`, senão `B2C_CAMPAIGN_TWIN_MATCH` | alta |
| 4 | resto | `N/A` | `UNRESOLVED` | **baixa** |

Equivalente SQL validado contra a base:

```sql
case
  when coalesce(btrim("Parceiro"),'') <> '' and upper(btrim("Parceiro")) <> 'N/A'
    then btrim("Parceiro")
  when btrim(coalesce("BU",'')) = 'Plurix'
   and (coalesce("Activity name / Taxonomia",'') ~* '(^|_)(plu|plx|plurix)'
     or coalesce(jornada,'') ~* 'plurix')
    then 'Plurix'
  when btrim(coalesce("BU",'')) = 'B2C' then 'Proprietaria'
  else 'N/A'
end
```

### Três armadilhas da regra

- **Não existe lista fechada de parceiros.** Qualquer valor explícito é preservado. Uma regra com `when "Parceiro"='Serasa' ... else 'Outros'` parece funcionar e está errada.
- **`BU='Plurix'` sozinho não basta.** Sem evidência no Activity Name ou na jornada, a linha não vira Plurix. O fallback pela jornada existe para cobrir o carrinho assistido, cujo activity é o genérico `afz_..._grl_`.
- **A jornada não é fonte confiável de parceiro** — advertência explícita no código. `_NA_` aparece tanto em jornadas da Proprietária quanto em `N/A` real, e em Serasa a 4ª posição é cadência (`CARRINHO`/`21D`/`SAB`). O sinal confiável é BU + prefixo do Activity Name.

## Saúde da regra

> 📊 Snapshot 2026-09-13 — mar a ago/2026, 4.331 disparos

| Motivo | Linhas | Cartões |
|---|---:|---:|
| `EXPLICIT_PARTNER` | 2.424 | 9.982 |
| `BU_PLURIX_SELF_ATTRIBUTION` | 1.439 | 4.876 |
| `B2C_CAMPAIGN_TWIN_MATCH` | 225 | 998 |
| `B2C_INSTITUTIONAL_OWN_BASE` | 242 | 58 |
| `UNRESOLVED` | **1** | **0** |

Resolve 99,98% das linhas.

## Validação contra o run certificado

> 📊 Snapshot 2026-09-13 — reconciliação com o run `9bb55892`

| Parceiro | Agosto (deck) | Agosto (query) | Julho equiv. (deck) | Julho (query) |
|---|---:|---:|---:|---:|
| Serasa | 988 | 988 | 939 | 939 |
| Proprietária | 912 | 912 | 473 | 473 |
| Plurix | 698 | 698 | 625 | 625 |
| Bem Barato | 158 | 158 | 217 | 217 |
| Dia | 93 | 93 | 36 | 36 |

Total: 809 disparos · 2.849 cartões · R$ 45.391,04 · CAC R$ 15,93.

## O risco que motiva materializar

A composição da dimensão **virou entre julho e agosto**:

- Julho: 373 registros com `Parceiro='Proprietaria'` literal + 100 resolvidos por BU = 473.
- Agosto: **0** literais + 912 resolvidos por BU = 912.

Em agosto, parceiro bruto `N/A` carrega **56% de todos os cartões** (1.610 de 2.849) — contra 32% em julho e 38% em junho. Essa regressão é o resultado não acompanhado de uma recomendação de junho ("reduzir parceiro N/A a <10%") que nunca teve outcome — ver [[Report-Live-Loop-de-Outcome]].

## Armadilha irmã: semântica de funil da Serasa

> 📊 Snapshot 2026-09-13 — agosto: Propostas 25.608 **maiores** que Base Acionável 21.721 (taxa de 118%; 186% em março). Aprovação entre 99,1% e 99,9% nos seis meses; finalização estável em 3,7–5,3%.

É lead externo pré-qualificado. O arquétipo de funil aplicado à Serasa desenha um funil que **cresce**, sem sinalizar nada. Ou a base tem outro denominador, ou o arquétipo não se aplica a esse parceiro.

## Encaminhamento

Materializar a resolução em três colunas geradas (`parceiro_canonico`, `_motivo`, `_confianca`), replicando a regra sem alterá-la, **com teste de equivalência SQL ↔ TypeScript no CI** — a regra passa a viver em duas linguagens e a divergência silenciosa seria o mesmo problema de volta. Spec em `docs/plans/ADR-004-dimensao-canonica-e-faixa-historica.md`.

Evolução futura registrada: fazer o engine persistir o que já calcula, aposentando a duplicação.

## Lição de método

A regra publicada na primeira versão da ADR-004 foi **inferida por reconciliação numérica** e reproduzia 10 de 10 números em dois meses independentes — e ainda assim não era a regra. Coincidia porque no recorte não havia parceiro explícito fora da lista, nem `BU=Plurix` sem evidência, nem parceiro nulo. **Reconciliação numérica valida resultado, não regra.** Quando uma regra vai ser materializada — passando a valer para dados futuros — a fonte tem que ser o código.

## Relacionado

- [[activities]] · [[Supabase-Schema]] · [[Parceiros]] · [[BUs]]
- [[Serie-Historica-Aquisicao-Mar-Ago-2026]] · [[Report-Live-Loop-de-Outcome]] · [[Report-Live-Arquitetura-Editorial]]
- [[Report-Live-Enciclopedia]] · [[Inconsistências-a-Corrigir]] · [[Governança-de-Dados]]
