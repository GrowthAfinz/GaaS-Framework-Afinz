# Prompt para Codex — Fundação de dados do Report Live (Fase 1, v2)

Cole este arquivo inteiro. **Esta é a v2.** A v1 pedia um passo 0 de verificação da regra de parceiro contra o código; você executou, a regra proposta não era equivalente à real, e parou como mandado. Isso estava certo e evitou propagar uma regra errada. A ADR-004 foi revisada com a regra fiel e este prompt foi reescrito em cima dela.

Se qualquer coisa abaixo estiver errada ou for mais arriscada do que parece, pare e me diga antes de codar.

## Onde você está

**Raiz de trabalho:** `calendar-estrategico/` (dentro de `ACALENDARIO APP/`). Todos os caminhos abaixo são relativos a ela.

**Atenção — existem duas pastas `supabase` no projeto.** A real, com as Edge Functions e as migrations do Report Live, é `calendar-estrategico/supabase/`. A que fica na raiz do `ACALENDARIO APP/` tem uma migration solta de outro tema e **não é a sua**.

**O pacote está em `docs/plans/`:**

| Arquivo | O que é |
|---|---|
| `SDD_REPORT_LIVE_EVOLUCAO_INDEX.md` | Índice e ordem de leitura |
| `ADR-004-dimensao-canonica-e-faixa-historica.md` | **v2** — a decisão, a regra fiel e o registro do episódio de verificação |
| `SDD_REPORT_LIVE_EVOLUCAO_EDITORIAL.md` | A spec das três fases |
| `CODEX_PROMPT_fundacao_dados_report_live.md` | Este arquivo |

**São três fases sequenciais. Você está executando a 1 e só a 1.**

| Fase | Escopo | Quem executa |
|---|---|---|
| **1 — Fundação de dados** | Colunas canônicas de parceiro, view de série mensal com faixa de 6 meses, teste de equivalência, correção do grão de canais, marcador de semântica de funil | **Você, agora** |
| 2 — Camada editorial | 10 arquétipos, régua de comparação, dois perfis (12 / 31 slides) | Prompt próprio, após aceite da Fase 1 |
| 3 — Loop de outcome | Janela de verificação de recomendação, fechamento no build, slide C7 | Prompt próprio, pode correr em paralelo à 2 |

Saber das Fases 2 e 3 serve para você **não fechar portas** — o SDD declara quais campos elas esperam da view. Não é convite para adiantar trabalho delas. Nenhuma linha de Fase 2 ou 3 nesta rodada.

## Leia antes de começar

1. `docs/plans/ADR-004-dimensao-canonica-e-faixa-historica.md` — **seções 1.3, 4 e 7 são as que mudaram**.
2. `docs/plans/SDD_REPORT_LIVE_EVOLUCAO_EDITORIAL.md` — Fase 1 completa.
3. `../Afinz-CRM-Midia-Vault/08-Engenharia/Report-Live-Enciclopedia.md` — contratos de dados que não se negociam. O vault fica **fora** do `calendar-estrategico/`, um nível acima.

## Passo 1 — Colunas geradas replicando `resolvePartner()`

Migration rastreada em `calendar-estrategico/supabase/migrations/`, padrão `AAAAMMDDHHMMSS_activities_parceiro_canonico.sql`.

**Antes de escolher o timestamp, confirme o estado real do banco.** A última migration versionada no repo é `20260912031223_report_live_publication_steps.sql`, mas a Enciclopédia cita migrations aplicadas até `20260913174500_report_live_team_access.sql` — **o repo está atrás do banco** em pelo menos sete migrations de 13/09. Consulte as migrations aplicadas no Supabase antes de nomear a sua. Se a divergência for maior que a descrita, pare e me diga.

Três colunas, replicando fielmente `resolvePartner()` de `supabase/functions/report-sync/report-live-engine.ts`:

```sql
alter table public.activities
  add column parceiro_canonico text generated always as (
    case
      when coalesce(btrim("Parceiro"), '') <> ''
       and upper(btrim("Parceiro")) <> 'N/A'                      then btrim("Parceiro")
      when btrim(coalesce("BU", '')) = 'Plurix'
       and (coalesce("Activity name / Taxonomia", '') ~* '(^|_)(plu|plx|plurix)'
         or coalesce(jornada, '') ~* 'plurix')                    then 'Plurix'
      when btrim(coalesce("BU", '')) = 'B2C'                      then 'Proprietaria'
      else 'N/A'
    end
  ) stored,
  add column parceiro_canonico_motivo text generated always as (
    case
      when coalesce(btrim("Parceiro"), '') <> ''
       and upper(btrim("Parceiro")) <> 'N/A'                      then 'EXPLICIT_PARTNER'
      when btrim(coalesce("BU", '')) = 'Plurix'
       and (coalesce("Activity name / Taxonomia", '') ~* '(^|_)(plu|plx|plurix)'
         or coalesce(jornada, '') ~* 'plurix')                    then 'BU_PLURIX_SELF_ATTRIBUTION'
      when btrim(coalesce("BU", '')) = 'B2C'
       and coalesce("Activity name / Taxonomia", '') ~* 'institucional|inst(?![a-z])'
                                                                  then 'B2C_INSTITUTIONAL_OWN_BASE'
      when btrim(coalesce("BU", '')) = 'B2C'                      then 'B2C_CAMPAIGN_TWIN_MATCH'
      else 'UNRESOLVED'
    end
  ) stored,
  add column parceiro_canonico_confianca text generated always as (
    case
      when coalesce(btrim("Parceiro"), '') <> ''
       and upper(btrim("Parceiro")) <> 'N/A'                      then 'alta'
      when btrim(coalesce("BU", '')) = 'Plurix'
       and (coalesce("Activity name / Taxonomia", '') ~* '(^|_)(plu|plx|plurix)'
         or coalesce(jornada, '') ~* 'plurix')                    then 'alta'
      when btrim(coalesce("BU", '')) = 'B2C'                      then 'alta'
      else 'baixa'
    end
  ) stored;

create index if not exists idx_activities_parceiro_canonico
  on public.activities (parceiro_canonico, "Data de Disparo");
```

Pontos que não podem mudar:

- **Parceiro explícito é preservado literalmente**, qualquer que seja o valor — não existe lista fechada de parceiros aceitos. Foi o erro da v1.
- **`BU = 'Plurix'` exige evidência contextual.** Sem o token no Activity Name nem `plurix` na jornada, a linha **não** vira Plurix — cai para o próximo teste. O fallback pela jornada cobre a jornada de carrinho assistido, cujo activity é o genérico `afz_..._grl_`.
- **`BU = 'B2C'` sem parceiro externo sempre vira `Proprietaria`** — independentemente de o bruto ser `N/A`, vazio ou nulo.
- **Não resolvido é `'N/A'` com motivo `UNRESOLVED` e confiança baixa** — nunca `'Outros'`, nunca nulo silencioso. Ausência não é zero, e não-resolvido não é categoria de descarte.
- **Não toque no valor bruto** de `"Parceiro"` nem de `"BU"`.
- `ADD COLUMN ... GENERATED ... STORED` reescreve a tabela. Volume é pequeno, mas confirme antes de rodar.

## Passo 2 — Teste de equivalência SQL ↔ TypeScript, em duas camadas (OBRIGATÓRIO)

**Condição de segurança do passo 1, não opcional.** A regra passa a viver em duas linguagens; sem verificação automática, uma mudança futura em `resolvePartner()` faz a coluna divergir em silêncio.

A v2 deste prompt pedia comparação contra o dataset completo no CI. Você reprovou isso e estava certo: o CI não tem secret, `activities` está sob RLS, e um fixture versionado não cobriria o dataset evolutivo. Mas a conclusão correta não é provisionar credencial de produção — é que **a especificação estava errada**. O risco a neutralizar é mudança de código, não mudança de dados, e o dataset de produção cobre mal os ramos perigosos (`UNRESOLVED` = 1 linha em 4.331; parceiro explícito fora da lista = **zero** ocorrências). Validar contra produção repetiria o erro que derrubou a v1 da ADR.

### Camada 1 — equivalência de regra, no CI, sem banco de produção

Job novo (ou job adicional no `deploy.yml`) com **serviço Postgres em container**, na mesma major do Supabase. Sem secret, sem dado de produção:

1. Sobe o Postgres do `services:`.
2. Cria uma tabela mínima com as colunas `"Parceiro"`, `"BU"`, `"Activity name / Taxonomia"`, `jornada` e o **DDL real das três colunas geradas** (o mesmo da migration — importe de um arquivo único, não duplique o SQL no teste).
3. Insere a matriz de casos sintéticos abaixo.
4. Roda `resolvePartner()` em TS sobre os mesmos casos.
5. Compara os três campos linha a linha. Divergência quebra o build.

**Matriz mínima de casos — cada linha existe para cobrir um ramo ou uma fronteira:**

| Parceiro | BU | Activity | Jornada | Esperado |
|---|---|---|---|---|
| `Serasa` | B2C | qualquer | qualquer | `Serasa` · EXPLICIT · alta |
| `Avenida` | Plurix | `plu_...` | qualquer | `Avenida` · EXPLICIT · alta — **valor nunca visto tem precedência sobre a BU** |
| `N/A` | B2C | comum | qualquer | `Proprietaria` · B2C_CAMPAIGN_TWIN · alta |
| `n/a` | B2C | comum | qualquer | idem — comparação é case-insensitive |
| `  N/A  ` | B2C | comum | qualquer | idem — há `trim` antes |
| `` (vazio) | B2C | comum | qualquer | idem |
| nulo | B2C | comum | qualquer | idem |
| nulo | Plurix | `plu_abc` | — | `Plurix` · BU_PLURIX_SELF · alta |
| nulo | Plurix | `afz_x_grl_y` | `PLURIX_CARRINHO` | `Plurix` — via jornada |
| nulo | Plurix | `afz_x_grl_y` | `NAO_TEM` | **`N/A` · UNRESOLVED · baixa** — BU sozinha não basta |
| nulo | Plurix | `xplu_abc` | — | **`N/A`** — `(^\|_)` não aceita token no meio |
| nulo | B2C | `..._institucional_...` | — | `Proprietaria` · **B2C_INSTITUTIONAL** |
| nulo | B2C | `..._inst_...` | — | `Proprietaria` · **B2C_INSTITUTIONAL** |
| nulo | B2C | `..._instalacao_...` | — | `Proprietaria` · **B2C_CAMPAIGN_TWIN** — fronteira do negative lookahead |
| nulo | `` (vazia) | comum | — | `N/A` · UNRESOLVED · baixa |
| nulo | `Seguros` | comum | — | `N/A` · UNRESOLVED · baixa |

O caso `instalacao` é o mais sutil da matriz: `inst(?![a-z])` **não** deve casar, porque há letra depois de `inst`. Se a tradução do regex para o Postgres estiver errada, é esse caso que denuncia.

### Camada 2 — reconciliação em dados reais, dentro do build

O build já carrega as linhas do período e já executa `resolvePartner()`. Adicione ali a comparação entre o resultado da função e o valor da coluna gerada, nas linhas do snapshot, emitindo **bloqueio de qualidade** em caso de divergência — no mesmo mecanismo que os demais gates já usam.

Custo marginal zero, acontece onde o acesso ao dado já é legítimo e auditado, e cobre o dataset evolutivo — que era a sua preocupação correta.

### Não fazer

**Não provisionar credencial de leitura de produção como secret do GitHub Actions.** Conflita com POL002-00 (dado de produção fora de dev/CI), amplia a superfície de um CI que hoje não tem nenhum secret, e entrega menos cobertura de ramo que a matriz sintética. Se depois da Camada 1 e da Camada 2 você ainda enxergar um risco descoberto, descreva o risco — não peça a credencial.

## Passo 3 — View `v_aquisicao_mensal_canonico`

SQL completo na seção 1.2 do SDD, agora agrupando por `parceiro_canonico`. Três coisas que não podem mudar:

1. **`range between interval '6 months' preceding and interval '1 month' preceding`** — não troque por `rows`. `rows` pula meses sem disparo e forma faixa com períodos não adjacentes.
2. **A faixa exclui o mês corrente.** É de propósito: o ponto atual precisa poder sair da banda, senão o veredito nunca dispara.
3. **Taxas calculadas da soma**, nunca das colunas gravadas `"CAC"` / `"Taxa de Conversão"` / `"Taxa de Finalização"`. A auditoria de 09/09 achou 774 CACs gravados divergentes de custo/cartões e 440 custos nulos.

Exponha `meses_observados` — a Fase 2 usa para reter veredito quando a amostra é fina.

## Passo 4 — Corrigir o grão de `VP_<parceiro>_CHANNELS`

A view devolve grão de jornada, não de canal: o slide de canais da Proprietária em agosto mostra WhatsApp 3×, SMS 3× e E-mail 2× — dez barras para quatro canais. Corrija o `group by` e acrescente `share` do parceiro no mês e variação em pontos percentuais contra o mês equivalente.

Verificação: Proprietária em agosto deve devolver 4 linhas.

## Passo 5 — Marcador `funil_semantica`

Por parceiro canônico, derive `padrao` ou `lead_pre_qualificado`. Detecção determinística: `propostas > base_acionavel` **ou** `tx_aprovacao > 0.95` de forma persistente na janela.

A Serasa dispara os dois em todos os seis meses (agosto: 25.608 propostas contra 21.721 de base acionável, aprovação 99,8%). Não é erro de dado — é lead externo pré-qualificado, e o arquétipo de funil da Fase 2 escolherá o desenho a partir desse campo.

## Passo 6 — Alerta de resolução não mapeada

Linha com `parceiro_canonico_motivo = 'UNRESOLVED'` e cartões > 0 gera aviso no build. Hoje isso é 1 linha em 4.331 no semestre, com 0 cartões — o alerta existe para o dia em que deixar de ser.

## Critério de aceite

- Camada 1 do teste de equivalência implementada com Postgres em container, matriz completa da tabela acima, verde no CI. Camada 2 implementada como gate de qualidade no build.
- `v_aquisicao_mensal_canonico` reproduz agosto do run `9bb55892`: Serasa 988 · Proprietária 912 · Plurix 698 · Bem Barato 158 · Dia 93; total 2.849 cartões, R$ 45.391,04, CAC R$ 15,93.
- Reproduz julho equivalente: 939 · 473 · 625 · 217 · 36.
- Distribuição de motivos no semestre mar–ago bate com a ADR: `EXPLICIT_PARTNER` 2.424 linhas / 9.982 cartões · `BU_PLURIX_SELF_ATTRIBUTION` 1.439 / 4.876 · `B2C_CAMPAIGN_TWIN_MATCH` 225 / 998 · `B2C_INSTITUTIONAL_OWN_BASE` 242 / 58 · `UNRESOLVED` 1 / 0.
- Seis pontos mensais por parceiro para mar–ago/2026, com `meses_observados` coerente.
- `VP_<parceiro>_CHANNELS` com uma linha por canal.
- `funil_semantica` marcando Serasa como `lead_pre_qualificado`.
- Teste SQL transacional cobrindo reconciliação de agosto, de julho e o grão de canais.
- `npm run build` verde e **nenhum diagnóstico TypeScript novo** além dos 57 preexistentes.

## Guardrails (não negociável)

**Não alterar a regra de `resolvePartner()`.** Esta fase replica a regra existente; mudá-la exigiria autorização separada e alteraria o motor determinístico. Se você achar que a regra tem um defeito, registre e me diga — não corrija.

Não alterar motor determinístico, máquina de estados, certificação, publicação por geração ou contrato de imutabilidade.

Nenhuma escrita em `activities` além do `ADD COLUMN`. **Não deduplicar, não recalcular CAC em massa, não corrigir custo nulo** — há 375 grupos de chave candidata repetida, 330 com valores diferentes, e a auditoria decidiu explicitamente investigar antes de corrigir. Se sentir vontade de arrumar, não arrume: registre e me diga.

Ausência não é zero. CPA de plataforma ≠ CAC de CRM. Não afrouxar RLS (ativo desde 13/09 nas três tabelas centrais).

Não iniciar a Fase 2 nem a Fase 3 nesta rodada.

## Ao terminar

Me diga exatamente: como implementou o teste de equivalência e o resultado dele, quais arquivos mudou, a reconciliação de agosto e de julho lado a lado com os números esperados, a distribuição de motivos comparada com a da ADR, quantas linhas `VP_*_CHANNELS` devolve agora para a Proprietária, e se o build continuou verde sem diagnóstico novo. Se decidir fazer diferente de algo especificado aqui, diga o quê e por quê antes de eu revisar.
