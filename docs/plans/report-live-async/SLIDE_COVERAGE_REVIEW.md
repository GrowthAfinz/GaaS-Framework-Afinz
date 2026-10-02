# Revisão de cobertura — baseline de 57 páginas (agosto/2026)

**Status:** passo 0 aceito em 2026-09-25. Decisões normativas em [`PRODUCT_DECISIONS_2026-09-25.md`](./PRODUCT_DECISIONS_2026-09-25.md).
**Mapa:** [`SLIDE_COVERAGE_MAP.csv`](./SLIDE_COVERAGE_MAP.csv), com 57 linhas, uma por página publicada.
**Baseline:** run `9bb55892-4b17-4f76-825a-0ac97c92b525`, publicação `54649269-7cce-460a-a87d-b4cc5f310a62`.
**Fontes:** `august-2026-baseline-57.coverage.json` (estrutura), `inventario_slides.csv`, `ESTUDO_RECONHECIMENTO_REPORT_LIVE.md`, `MASTER_DECK_SPEC.md`, contratos em `supabase/migrations/20260723170000_report_live_v1_foundation.sql` (+ updates de K-VISA e 7C), `report-live-engine.ts` e o texto extraído das 57 páginas do PDF candidato 2a (`archives/.../phase-2a/report-live-2a-candidate-aug-2026.pdf`).

> O PDF candidato é o run `5137402b` (renderer 2.1-editorial-2a). Ele tem a mesma ordem e os mesmos 57 códigos da publicação, então serviu para confirmar a contagem de linhas e o que cada página tinha de conteúdo. Não foi usado como prova de publicação nem como layout. Nenhum número do mapa veio do golden estrutural.

## Contagem por disposição

| Disposição | Páginas | Quais |
|---|---:|---|
| `preserve` | 47 | C0–C8, P1×5, P2×3, P3×4, P4×5, P5×4, M1–M6, B1, K-SEG, K-TPL, K-QLT, A1–A7 |
| `merge` | 8 | P7×5 → C8 · M7 → C8 · B3 → C2 · P2 Serasa → P1 Serasa |
| `retain_as_quality_status` | 1 | B2 |
| `retire_closed_scope` | 1 | K-VISA |
| `omit_no_data` | 0 | — |
| **Total** | **57** | |

## As sete perguntas

### 1. Quantos slides permanecem integrais?

**47.** Todos têm dado material em agosto, ou são obrigatórios do core com ausência legítima (C7). Nenhum foi mantido "por existir view": cada um tem pergunta e decisão próprias que nenhum outro slide responde (coluna `rationale`).

Muitos dos 47 estão **ruins na forma**, mas completos no conteúdo: dump JSON em C1, números crus em C3, preview textual em C4, `activity_name` truncado em P5/M3/M4, escala linear que esmaga P4. Esses problemas são do renderer ou da view. Nenhum justifica retirar o slide.

### 2. Quantos podem ser fundidos sem perda, e por quê?

**8**, em quatro grupos. Em todos, o slide de destino já lê a mesma fonte ou o mesmo subconjunto dela:

| Origem | Destino | Por que não se perde nada |
|---|---|---|
| P7 × 5 (Serasa, Proprietária, Plurix, Bem Barato, Dia) | `c8` | P7 é C8 filtrado por parceiro (`VIEW_ACTION_QUEUE`, `slice(0,1)` por parceiro). Em agosto as 5 abas tinham só cabeçalho: 5 páginas com a mesma frase "Nenhuma ação candidata". A pergunta volta como linha de C8 com `partner`. Decisão, evidência e limite ficam na própria linha. Sem candidata, o P1 do parceiro ganha uma linha "sem ação; manter curso". |
| M7 | `c8` | Mesma view de C8, sem filtro de domínio. A única candidata era de CRM (template) e saiu rotulada "Ação de mídia", o que é um erro semântico. A pergunta volta em C8 como `domain=media`. Sem candidata de mídia, o M6 ganha a linha de status. |
| B3 | `c2` | Mesmo `source_view` (`VIEW_COVERAGE_COMPARABILITY`) e as mesmas 3 linhas de C2. O MASTER pede que B3 detalhe C2 sem duplicar, mas não existe view própria para isso. As regras de comparabilidade vão para o limite e as notas de C2. |
| P2 Serasa | `p1_serasa` | `VP_SERASA_SEGMENTS` tem 1 linha. Agrupar um único segmento reproduz o total de P1, então não há o que priorizar. O segmento entra como linha de contexto em P1. |

**Importante:** as quatro fusões foram propostas como **regras**, não como exceção de agosto. Em outro run pode haver candidata de parceiro, ação de mídia ou um segundo segmento Serasa, e aí o slide volta:

- P7 renderiza só com candidata do parceiro;
- M7 só com candidata `domain=media`;
- P2 só com ≥ 2 segmentos;
- B3 só quando tiver view própria.

### 3. Quantos estão vazios por ausência legítima?

**7 páginas não tinham linha de corpo** em agosto: C7, B2 e P7 × 5.

- **C7** é ausência legítima: nenhuma janela de outcome tinha encerrado. Como é obrigatório do core (CT-10), fica em `preserve`. A Release 7C já troca a fonte para `VIEW_GROWTH_LEARNING_RETROSPECTIVE`, com memória curada rotulada.
- **P7 × 5** também é ausência legítima (nenhuma candidata por parceiro). Foi para `merge` e não para `omit_no_data`, porque o contrato marca P7 como `conditional=false` e o handoff reserva `omit_no_data` para módulo condicional.
- **Nenhum módulo condicional estava vazio** entre as 57 páginas. K-EXP e as 4 instâncias de P6 já tinham sido excluídos no build como `omitir_bloqueado` e não fazem parte da baseline.

### 4. Quantos estão vazios por falha de dados e precisam continuar visíveis?

**1: B2.** A fonte `b2c_daily_metrics` estava congelada em 20/07, então agosto veio vazio por falha de fonte, não por zero. B2 fica como status: última data observada, cutoff nulo e ação de recuperação. Volta a ser série quando a fonte for reabastecida.

Parciais por falha, que continuam em `preserve` com limite:

- B1: trilha B2C nula;
- M1: budget ausente em 5/5 objetivos;
- C2/C3: cutoff integrado nulo.

### 5. Quais dependem de fonte ou contrato ainda inexistente?

| Slide | Dependência ausente | Efeito hoje |
|---|---|---|
| C2, C3 | `data_reading_integrated` nulo; equivalência B2C `tipo=CRM` × cartões CRM não certificada | C3 cai no fallback nativo; C2 sem gap numérico |
| C4, M1 | Meta CRM e budget de mídia certificados | Sem linha de meta; sem pacing |
| C6 | `cac_max` fora de `VIEW_CAC_DRIVERS` | Sem linha de referência |
| C7, C8, P7, M7 | Produtor de ações e outcomes (Release 7C em curso) | Fila e outcomes vazios ou mínimos |
| P2 | Segmento sem propostas/aprovados e sem período equivalente | Tabela sem comparação (CT-4) |
| P3 | Grão canal×segmento (contrato exige `segment`; a view agrupa só por canal) | "Heatmap" sem segunda dimensão |
| P5 | Oferta/ordem na view (hoje há canal/segmento, mas não oferta); destino do excedente além do top 8 | Não dá para decodificar o `activity_name` completo sem o renderer fazer parse |
| M2, M4, M5 | Frequência, evento nomeado e installs/trials no snapshot (`bloqueado_snapshot`) | Leitura Indisponível/Baixa |
| M3, A6 | Aliases certificados (10 de 11 pendentes) | Ranking provisório |
| B1, B2, B3 | Fonte B2C atualizada; view própria para B3 | Ver itens 2 e 4 |
| P6, K-EXP (fora dos 57) | Exposição por usuário/unsubscribe; experimentos registrados | Continuam omitidos |

### 6. Qual cardinalidade resulta da análise?

**48 slides** = 47 `preserve` + 1 `retain_as_quality_status`. Esse número saiu da análise, sem meta prévia.

A cardinalidade é **dinâmica**. Com as fusões aplicadas como regra, um run com candidatas por parceiro volta a ter P7, e um run sem incidente perde K-QLT. O manifesto deve contabilizar os 57 a cada run, não fixar 48.

Isso é muito diferente dos perfis candidatos. `deep_dive` (31) e `executivo_mensal` (12) cortariam, entre outros, C2, C3, C5, C6, M5, B2 e K-QLT (ver divergência 1).

### 7. Decisões do product owner

As decisões 1–6 foram aceitas em 2026-09-25 e estão consolidadas em
[`PRODUCT_DECISIONS_2026-09-25.md`](./PRODUCT_DECISIONS_2026-09-25.md):

1. P7 e M7 são incorporados a C8 no relatório mensal; P2 só reaparece com dois ou mais segmentos; B3 só reaparece com view própria.
2. K-TPL é incorporado a C2; ação material segue para C8 e Aprendizado Growth.
3. B2 é incorporado a B1 enquanto não houver série diária observada e reaparece automaticamente quando houver.
4. `monthly_full`/`monthly_report` é o relatório oficial de cardinalidade dinâmica; 12/31 são derivados opcionais.
5. P5 e M5 exibem top 8 e entregam o excedente em artefato tabular companheiro; notas preservam procedência.
6. Cores semânticas de BU devem ser preservadas pelo modo de marca.

Permanece uma dependência de dados, não uma decisão de renderer: certificar se B2C `tipo=CRM` equivale a cartões CRM e definir os owners de metas e budgets.

## Lacunas do pacote de dados que impediriam slides completos

A spec (§1) exige título, contexto, valor, comparação, evidência visual, narrativa, limite, confiança, rodapé e notas em cada slide. Hoje o pacote não entrega isso para a maior parte dos 48:

1. **`chart_contract` só existe para C4, P1 e P4** (`buildEditorialTabs` só itera P1/P4 com partner, e o pacing de C4). C5, C6, P2, P3, P5, M1–M5, B1 e A1 não têm séries, eixo nem formato declarados. Sem isso, o renderer teria que escolher o gráfico por convenção, o que a spec proíbe. **Este é o maior bloqueio.**
2. **Narrativa estruturada ausente.** Cerca de 35 páginas têm só a frase genérica "N linha(s) observada(s) … Leitura direcional". Não há `takeaway`, `evidence[]` nem `limitation` por slide, e ninguém produz essa narrativa hoje.
3. **C1:** `VIEW_EXECUTIVE_READING` guarda objetos JSON dentro de células. O KPI âncora, o delta e a baseline precisam vir achatados.
4. **P5:** falta `oferta` e `ordem` para decodificar o `activity_name` sem parse no renderer.
5. **K-QLT:** `VIEW_QUALITY_INCIDENTS` não filtra pelo período, então incidentes de julho aparecem no relatório de agosto.
6. **M6:** `named_event_coverage` é global e se repete em cada linha, em vez de vir por canal.
7. **M7/P7:** `VIEW_ACTION_QUEUE` não tem filtro de domínio/parceiro materializado para o destino C8 (a coluna existe; o recorte não).
8. **Golden run:** o JSON de agosto é estrutural. Renderizar o golden exige que o Codex exporte o artefato imutável de `9bb55892` (`export_artifact`) como pacote `production` com `coverage_accounting` vindo deste CSV.

## Divergências entre vault, código e PDF

1. **Perfis × MASTER.** `DEEP_DIVE_PRIORITY` (`report-live-engine.ts:1474`) não inclui C2, C3, C5, C6, M5, M7, B2, B3 nem K-QLT. Com a cota de 5 slides de core, C2 sai. O MASTER §0.3 diz que C2 é "sempre presente".
2. **Quality gate:** o vault (Arquitetura Editorial) propõe "slide próprio só quando houver bloqueio"; o MASTER exige C2 sempre.
3. **K-TPL:** o MASTER o lista entre os condicionais, mas o contrato tem `conditional=false` e o engine força disponibilidade `true` (`:1425`). Na prática é obrigatório.
4. **K-TPL:** regra de backlog do vault × "não esconder" do MASTER (decisão 2 acima).
5. **C3:** o contrato aponta `VIEW_SCORECARD_INTEGRATED`, mas a publicação usou `VIEW_SCORECARD_NATIVE` por fallback (cutoff integrado nulo). O fixture registra a nativa. Os chips também divergem: na publicação sai `render`/Baixa; na candidata 2a sai "COM LIMITES".
6. **M7:** o slide é rotulado "Ação de mídia", mas a view não filtra domínio e publicou ação de CRM.
7. **B3:** o MASTER manda "detalhar C2 sem duplicar", mas contrato e engine dão a B3 a mesma view de C2.
8. **P3:** o contrato exige `segment`; `VP_*_CHANNELS` agrupa só por canal. O "heatmap" saiu como barra (ESTUDO E6).
9. **Marca:**
   - fonte: a skill diz "nunca Arial"; o vault (design system) cita Arial/Roboto como fonte segura; o renderer 2.0 usou Arial;
   - vermelho: `#E74742` na marca, `#DC2626` em `AFINZ_LIGHT`;
   - fundo: o MASTER CT-9 pede slate-950, o vault pede tema claro, e a spec do renderer faz a síntese (capa escura, analíticos claros);
   - script de marca: `apply_afinz_brand.py` remapeia as cores de BU (decisão 6).
10. **Cardinalidade.** A certificação exige exatamente 12/31 (`report-live-versioning.ts`) e a Release 7C tem como aceite "perfis continuam 12 e 31". O handoff atual diz para não tratar 12/31 como meta. Enquanto isso não for reconciliado, um pacote de 48 slides não certifica no pipeline atual.
11. **Contagens entre documentos:** A4 aparece com 247 pares no ESTUDO (run publicado) e 250 no PDF candidato (run 2a). Também 45 candidatas no banco, contra 43 na ficha anterior. São runs diferentes, não erro; registrado para não confundir o QA.

## O que não foi feito

- O renderer PPTX/PDF continua a cargo do Claude Cowork; esta entrega não o implementa.
- O golden real foi exportado apenas para evidência local ignorada pelo Git; nenhuma publicação, ponteiro ou artefato remoto foi alterado.
- Nenhuma migration, escrita de dados, chamada ao Google ou implantação de Edge Function foi executada.
- O perfil mensal completo, os gates e os testes estão na branch `codex/report-live-monthly-full` e dependem de revisão e CI antes de qualquer merge ou deploy.
