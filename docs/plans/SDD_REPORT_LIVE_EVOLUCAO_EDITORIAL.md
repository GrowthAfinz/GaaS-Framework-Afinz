# SDD — Evolução editorial do Report Live

**Status:** proposto em 2026-09-13. Decisão de contexto em `ADR-004-dimensao-canonica-e-faixa-historica.md`.
**Escopo geral:** dar memória e curadoria ao Report Live sem tocar no motor determinístico. Três fases sequenciais, com contrato de fronteira explícito entre elas.
**Executor previsto:** Codex, via `CODEX_PROMPT_*` por fase.

---

## 0. Princípio que organiza as três fases

Tudo depende de a **faixa histórica existir como dado**. Sem ela:

- a régua de comparação não tem o que desenhar (Fase 2),
- o veredito de anomalia não tem contra o que comparar (Fase 2),
- o critério de permanência de slide não tem como decidir o que mudou (Fase 2),
- a verificação de outcome de recomendação não tem métrica confiável para consultar (Fase 3).

Por isso a Fase 1 é fundação de dados, e as Fases 2 e 3 declaram aqui o que precisam dela — para que a Fase 1 nasça com contrato completo e não precise ser reaberta.

---

## FASE 1 — Fundação de dados

### 1.0 Regra canônica — CONFIRMADA no código (13/09/2026)

O passo bloqueante da v1 foi executado pelo Codex e **reprovou a regra inferida**. A regra real é `resolvePartner()` em `supabase/functions/report-sync/report-live-engine.ts` (≈184), aplicada em `buildReport()` (≈893–897). Detalhe completo e registro do episódio na ADR-004 v2, seções 1.3 e 7.

Precedência, do sinal mais forte ao mais fraco:

1. Parceiro explícito e ≠ `N/A` → **preservado literalmente** (`EXPLICIT_PARTNER`, alta).
2. `BU='Plurix'` **com evidência contextual** — token `(^|_)(plu|plx|plurix)` no Activity Name ou `plurix` na jornada → `Plurix` (`BU_PLURIX_SELF_ATTRIBUTION`, alta).
3. `BU='B2C'` sem parceiro externo → `Proprietaria` (`B2C_INSTITUTIONAL_OWN_BASE` se o Activity casa `institucional|inst(?![a-z])`, senão `B2C_CAMPAIGN_TWIN_MATCH`; alta).
4. Resto → `N/A` (`UNRESOLVED`, **baixa**).

Advertência do próprio código, que precisa sobreviver a qualquer reimplementação: **a jornada não é fonte confiável de parceiro** — `_NA_` aparece em jornadas da Proprietária e em `N/A` real, e em Serasa a 4ª posição é cadência. O teste sobre jornada existe só como confirmação no caso Plurix.

### 1.1 Colunas geradas replicando `resolvePartner()`

Três colunas, não uma: materializar só o parceiro perderia a procedência, que é o que distingue resolvido de não mapeado. Migration rastreada em `calendar-estrategico/supabase/migrations/`, padrão `AAAAMMDDHHMMSS_activities_parceiro_canonico.sql`. SQL completo no `CODEX_PROMPT_fundacao_dados_report_live.md`, passo 1.

Resumo: `parceiro_canonico`, `parceiro_canonico_motivo` e `parceiro_canonico_confianca`, todas `GENERATED ALWAYS AS ... STORED`, mais índice `(parceiro_canonico, "Data de Disparo")`. O valor bruto de `"Parceiro"` e `"BU"` permanece intocado.

Não-resolvido é `'N/A'` com motivo `UNRESOLVED` e confiança baixa — **nunca `'Outros'`**. Não-resolvido é estado com procedência, não categoria de descarte.

**Antes de escolher o timestamp da migration:** o repo está atrás do banco. Última versionada é `20260912031223_report_live_publication_steps.sql`; a Enciclopédia cita aplicadas até `20260913174500_report_live_team_access.sql`. Consultar o estado real antes de nomear.

### 1.1-bis Teste de equivalência SQL ↔ TypeScript (OBRIGATÓRIO)

Condição de segurança do 1.1, não item opcional. A regra passa a viver em duas linguagens; sem verificação automática, uma mudança futura em `resolvePartner()` faz a coluna divergir em silêncio — reproduzindo exatamente o problema que esta fase elimina.

Especificação corrigida em 13/09 após verificação do Codex: o CI não tem secret e `activities` está sob RLS, então comparar "o dataset completo" era inviável — e também era o teste errado. O risco é mudança de código, não de dados, e produção cobre mal os ramos perigosos (`UNRESOLVED` = 1 linha em 4.331; parceiro explícito fora da lista = zero ocorrências).

**Camada 1 — no CI, sem banco de produção.** Postgres em container (mesma major do Supabase), tabela mínima com o DDL real das colunas geradas, matriz de casos sintéticos por ramo e fronteira, comparação com `resolvePartner()` nos três campos. Matriz completa no prompt do Codex, passo 2. Divergência quebra o build.

**Camada 2 — no build, em dados reais.** O build já carrega as linhas e já roda `resolvePartner()`: comparar ali com a coluna gerada e emitir bloqueio de qualidade em caso de divergência. Custo zero, cobre o dataset evolutivo.

**Rejeitado:** credencial de leitura de produção como secret do CI — conflita com POL002-00 e cobre menos ramos que a matriz sintética.

**Se as duas camadas forem inviáveis, o 1.1 não deve ser implementado** — coluna duplicando regra sem verificação é pior que o problema original.

Tradução JS → SQL: `String(x ?? "").trim()` → `coalesce(btrim(x),'')`; `/(^|_)(plu|plx|plurix)/i` → `~* '(^|_)(plu|plx|plurix)'`; `/institucional|inst(?![a-z])/i` → `~* 'institucional|inst(?![a-z])'` (negative lookahead suportado pelo Postgres, verificado contra a base). O token institucional afeta **só o motivo**, nunca o parceiro — diferença de dialeto fica contida.

### 1.2 View `v_aquisicao_mensal_canonico`

Grão: mês × parceiro canônico. Inclui a faixa móvel dos 6 meses anteriores (excluindo o mês corrente, para que o ponto atual possa sair da banda).

```sql
create or replace view public.v_aquisicao_mensal_canonico as
with base as (
  select
    date_trunc('month', a."Data de Disparo")::date as mes,
    a.parceiro_canonico                            as parceiro,
    count(*)                                       as disparos,
    sum(a."Base Acionável")                        as base_acionavel,
    sum(a."Propostas")                             as propostas,
    sum(a."Aprovados")                             as aprovados,
    sum(a."Cartões Gerados")                       as cartoes,
    sum(a."Custo Total Campanha")                  as custo
  from public.activities a
  where a."Data de Disparo" is not null
  group by 1, 2
),
calc as (
  select
    b.*,
    case when b.cartoes        > 0 then b.custo / b.cartoes                      end as cac,
    case when b.aprovados      > 0 then b.cartoes::numeric   / b.aprovados       end as tx_finalizacao,
    case when b.propostas      > 0 then b.aprovados::numeric / b.propostas       end as tx_aprovacao,
    case when b.base_acionavel > 0 then b.propostas::numeric / b.base_acionavel  end as tx_proposta
  from base b
)
select
  c.*,
  min(c.cartoes)        over w as cartoes_min_6m,
  max(c.cartoes)        over w as cartoes_max_6m,
  min(c.cac)            over w as cac_min_6m,
  max(c.cac)            over w as cac_max_6m,
  min(c.tx_finalizacao) over w as tx_final_min_6m,
  max(c.tx_finalizacao) over w as tx_final_max_6m,
  count(*)              over w as meses_observados
from calc c
window w as (
  partition by c.parceiro
  order by c.mes
  range between interval '6 months' preceding and interval '1 month' preceding
);
```

**Por que `range` e não `rows`:** `rows` conta linhas existentes e pula meses sem disparo, produzindo faixa formada por períodos não adjacentes. `range` com intervalo respeita o calendário. `meses_observados` expõe quantos meses realmente compõem a faixa — obrigatório para a regra de amostra mínima.

**Taxas sempre calculadas da soma.** Nunca usar `activities."CAC"`, `"Taxa de Conversão"` ou congêneres gravados: a auditoria de 09/09 achou 774 CACs divergentes de custo/cartões e 440 custos nulos.

### 1.3 Corrigir o grão de canais

`VP_<parceiro>_CHANNELS` hoje devolve grão de jornada. Corrigir para uma linha por canal, com `share` do parceiro no mês e variação em pontos percentuais contra o mês equivalente.

Critério de verificação: a Proprietária em agosto tem 4 canais reais; a view deve devolver 4 linhas, não 10.

### 1.4 Marcador de semântica de funil

Expor, por parceiro canônico, um campo `funil_semantica` com pelo menos dois valores: `padrao` e `lead_pre_qualificado`.

Regra de detecção (determinística, não configuração manual): marcar `lead_pre_qualificado` quando `propostas > base_acionavel` **ou** `tx_aprovacao > 0.95` de forma persistente na janela. A Serasa dispara os dois critérios em todos os seis meses.

Consumo previsto: o arquétipo de funil da Fase 2 escolhe o desenho a partir desse campo, em vez de aplicar o mesmo funil a todos.

### 1.5 Alerta de resolução não mapeada

Linha com `parceiro_canonico_motivo = 'UNRESOLVED'` e `cartoes > 0` gera aviso no build. Hoje é 1 linha em 4.331 no semestre, com 0 cartões — o alerta existe para o dia em que deixar de ser.

### 1.6 Correção de contrato da view — aberta em 13/09 após verificação da entrega

A Fase 1 foi entregue e reconcilia. Ao inspecionar a **saída real** da view, apareceram três lacunas que a spec não previu e que inviabilizam a régua da Fase 2 como está. São conserto da Fase 1, não escopo novo.

**(a) O mês corrente entra na série sem marcação.** A view devolve setembro/2026 com 46 disparos e 103 cartões — mês em curso, último disparo em 11/09. Sem um campo que distinga mês fechado de mês parcial, a régua vai comparar período incompleto com períodos fechados, violando o guardrail de janelas do Dossiê Mestre. **Adicionar `mes_fechado` (boolean)** e, de preferência, `dias_cobertos`.

**(b) A faixa está contaminada por meses de volume irrisório.** Exemplos reais na saída atual:

- Bem Barato, fev/2026: 3 disparos, **4 aprovados, 4 cartões** → 100% de finalização, que vira o teto da faixa do parceiro.
- Serasa, jan/2026: 38 aprovados, 19 cartões → 50%, contra uma operação que hoje roda entre 3,7% e 5,3%.

O resultado é uma faixa de 2,4% a 50% para a Serasa, que aceita qualquer valor e torna o veredito inútil. **Exigir denominador mínimo para um mês contribuir com a faixa de taxa** (sugestão: `aprovados >= 30`, a calibrar) e expor quantos meses efetivamente entraram, separado de `meses_observados`.

**(c) Mudança de regime não sinalizada — o caso Serasa.** A série de finalização da Serasa mostra dois patamares distintos:

| período | finalização | aprovados/mês |
|---|---|---|
| mai/2025 – jan/2026 | 22,5% – 71,8% | 3 – 900 |
| fev/2026 em diante | 2,4% – 5,3% | 11.031 – 25.556 |

Isso não é variação: é troca de definição de "aprovado" — o parceiro passou a operar como lead pré-qualificado em massa, o que é coerente com o marcador `lead_pre_qualificado` que a própria Fase 1 derivou. **Uma faixa que atravessa fev/2026 compara duas semânticas diferentes.** Registrar o corte de série como limitação de medição e impedir que a faixa o atravesse — é exatamente o tipo "Limitação de medição" previsto na nota V2 de memória do vault, e o primeiro caso concreto dela.

**Decisão implementada em 13/09/2026.** O denominador mínimo foi calibrado em **30** e aplicado de acordo com a taxa: `cartoes >= 30` para CAC, `aprovados >= 30` para finalização, `propostas >= 30` para aprovação e base acionável `>= 30` para proposta. O corte remove o mês artificial de Bem Barato sem apagar o mês real de Dia com 31 aprovados. A view expõe `denominador_minimo_faixa_taxa`, os quatro contadores `*_meses_validos_6m`, `mes_fechado`, `dias_cobertos`, `regime_serie`, `corte_regime` e `limitacao_medicao`. Para Serasa, as janelas são particionadas no corte de 01/02/2026 e nunca atravessam os dois regimes.

### Critério de aceite da Fase 1

1. Teste de equivalência SQL ↔ TS implementado, no CI, verde. A distribuição de motivos no semestre mar–ago precisa bater com a da ADR: `EXPLICIT_PARTNER` 2.424 linhas / 9.982 cartões · `BU_PLURIX_SELF_ATTRIBUTION` 1.439 / 4.876 · `B2C_CAMPAIGN_TWIN_MATCH` 225 / 998 · `B2C_INSTITUTIONAL_OWN_BASE` 242 / 58 · `UNRESOLVED` 1 / 0.
2. `v_aquisicao_mensal_canonico` reproduz o run `9bb55892` em agosto: Serasa 988 · Proprietária 912 · Plurix 698 · Bem Barato 158 · Dia 93; total 2.849 cartões, R$ 45.391,04, CAC R$ 15,93.
3. Reproduz também o mês equivalente de julho: 939 · 473 · 625 · 217 · 36.
4. Devolve 6 pontos mensais por parceiro para mar–ago/2026, com `meses_observados` coerente.
5. `VP_<parceiro>_CHANNELS` devolve uma linha por canal.
6. `funil_semantica` marca Serasa como `lead_pre_qualificado` e os demais como `padrao`.
7. Teste SQL transacional cobrindo os itens 2, 3 e 5.
8. Gate de release: nenhum diagnóstico TypeScript novo além dos **57 preexistentes** na baseline v44, recontados em 13/09/2026 após reconciliar o checkout com `origin/main`; `npm run build` verde.
9. Nenhuma escrita em `activities` além do `ADD COLUMN`. Nenhum recálculo, deduplicação ou correção de custo.
10. Mês corrente marcado com `mes_fechado = false` e `dias_cobertos` coerente com a última data observada; meses anteriores marcados como fechados.
11. Faixas de taxa usam denominador mínimo 30, expõem meses válidos por métrica e, para Serasa, não atravessam o corte de regime de 01/02/2026.

---

## FASE 2 — Camada editorial

Escopo: os 10 arquétipos de slide, a régua de comparação, os dois perfis de output e a compactação de 57 para 31 slides. Detalhe editorial completo em `Afinz-CRM-Midia-Vault/05-Estrategia/Report-Live-Arquitetura-Editorial.md`.

### Contrato de fronteira com a Fase 1

A Fase 2 consome exclusivamente `v_aquisicao_mensal_canonico` e espera, por linha: `mes`, `parceiro`, as seis métricas absolutas, as quatro taxas, os pares `*_min_6m` / `*_max_6m` e `meses_observados`. Se a Fase 1 entregar sem algum desses campos, a Fase 2 é bloqueada.

### Entregáveis

- **Régua** — componente de renderer com valor atual, delta contra período equivalente, série de 6 meses e faixa como fundo. Veredito calculado, não escrito: `dentro_da_faixa`, `acima_da_faixa`, `abaixo_da_faixa`, `amostra_insuficiente` (quando `meses_observados < 4`).
- **Arquétipos 01 a 10** — conforme a nota do vault. Prioridade dentro da fase: 05 (série temporal, hoje renderizada como tabela), 07 (funil por taxa), 04 (scorecard formatado), 09 (campanhas decodificadas), 02 (leitura executiva).
- **Formatação** — moeda, percentual e casas decimais; `activity_name` nunca truncado em eixo (rótulo composto por `Canal`, `Segmento`, `Oferta`, `Ordem de disparo`, que já existem em `activities`).
- **Dois perfis** — `executivo_mensal` (12 slides) e `deep_dive` (31), ambos derivados do mesmo artefato certificado.
- **Transição** — usar a publicação por geração isolada que já existe desde 13/09. A candidata nova só fica visível na ativação; o deck atual permanece apresentável até lá. Não repetir o episódio dos slides `v4_*` com placeholder cru visível no deck fixo.

### Aceite (esboço, a detalhar quando a fase abrir)

Golden run comparando o deck novo com o artefato certificado; QA visual das 31 páginas; nenhuma geração misturada; PDF e deck correspondendo à mesma versão.

---

## FASE 3 — Loop de outcome

Escopo: fechar o ciclo recomendação → resultado. Detalhe em `Afinz-CRM-Midia-Vault/09-Inteligencia-IA/Report-Live-Loop-de-Outcome.md`.

Estado atual que justifica: `report_action_candidates` tem 43 linhas, `report_action_outcomes` tem 0, e `report_memory.outcomes` e `.licoes` estão vazios nos três ciclos gravados.

### Contrato de fronteira com a Fase 1

Cada recomendação passa a declarar `consulta_verificacao` — o nome da view que responde pela métrica. Essa view precisa existir e ser estável. `v_aquisicao_mensal_canonico` é a fonte para métricas de CRM; as de mídia precisam de equivalente. **A Fase 1 deve deixar registrado quais métricas são verificáveis por view e quais não são** — uma recomendação cuja métrica não tem view não pode declarar prazo, e isso precisa ser explícito em vez de virar outcome silenciosamente impossível.

### Entregáveis

- Campos `direcao`, `janela_outcome` e `consulta_verificacao` no JSON de recomendação que a `report-sync` já aceita.
- Etapa de fechamento no build do mês seguinte: lê recomendações com janela vencida, consulta a métrica declarada no snapshot, grava em `report_action_outcomes`. Veredito determinístico: `confirmado`, `nao_confirmado`, `premissa_invalida` (métrica inexistente — o caso Plurix, que nenhuma comparação numérica captaria).
- Slide C7 ("Resultado das ações anteriores"), que já existe vazio no deck, passa a mostrar o placar do ciclo anterior e a taxa de acerto acumulada por `signal_code`.
- Regra de curadoria derivada: sinal repetido por dois ciclos sem outcome sai do deck e vira backlog com dono.

### Fora de escopo, explicitamente

Banco vetorial, múltiplos agentes, aprendizado autônomo, contexto encapsulado por frente com vigência e substituição, promoção automática de hipótese a aprendizado, metadados de storytelling por slide, e qualquer tabela nova. A nota V2 do vault já exclui a maior parte disso; esta spec vai um passo além e adia também as três camadas de contexto até haver track record que justifique o que vale guardar.

---

## Guardrails válidos nas três fases

Herdados de `Report-Live-Enciclopedia` e da ADR-004:

- Não alterar motor determinístico, máquina de estados, certificação ou contrato de imutabilidade.
- Ausência não é zero; indisponibilidade é registrada com motivo.
- CPA de plataforma ≠ CAC de CRM.
- Taxa calculada da soma, nunca média de taxas armazenadas.
- Não deduplicar, recalcular em massa nem corrigir custo sem diagnóstico próprio.
- Valor bruto preservado ao lado da dimensão canônica.
- Variação de taxa em pontos percentuais.
- Veredito retido quando a amostra não sustenta.
- RLS ativo desde 13/09 nas três tabelas centrais — não afrouxar para facilitar consulta.
- Gate de release compara a assinatura dos 57 diagnósticos TypeScript preexistentes da baseline v44, reconfirmados em 13/09/2026, e bloqueia qualquer novo.

---

## Sequenciamento

| Fase | Depende de | Libera |
|---|---|---|
| 1 — Fundação de dados | Confirmação da regra no engine | Faixa histórica como dado |
| 2 — Camada editorial | Fase 1 completa e aceita | Deck de 31 / 12 slides com régua |
| 3 — Loop de outcome | Fase 1 (views verificáveis) | Prestação de contas e curadoria por track record |

A Fase 3 não depende da Fase 2 — pode correr em paralelo depois que a 1 fechar, se houver capacidade. O que não pode é qualquer uma delas começar antes da 1.
