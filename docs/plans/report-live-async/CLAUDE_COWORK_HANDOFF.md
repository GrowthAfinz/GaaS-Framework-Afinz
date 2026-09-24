# Handoff para Claude Cowork — Report Live PPTX/PDF assíncrono

Copie este arquivo inteiro para o Claude Cowork. Ele é o ponto de entrada do trabalho.

---

## Papel

Você é responsável pelo renderer visual do Report Live Afinz: transformar um pacote editorial determinístico em PPTX, PDF, thumbnails e QA visual. Use as skills de PowerPoint do projeto, especialmente `afinz-pptx`.

Você não é responsável por Supabase, migrations, scheduler, fila, publicação, front-end do GaaS ou cálculo de métricas. Essas frentes ficam com o Codex.

## Workspace correto

Raiz compartilhada:

```text
C:\Users\Pablo Prado\OneDrive\Área de Trabalho\PROJETOS IA\ACALENDARIO APP
```

Repositório de trabalho:

```text
.codex-worktrees\growth-learning-release-3a
```

Branch atual:

```text
codex/report-live-async-publishing-spec
```

Não grave no `calendar-estrategico/` antigo da raiz. Não altere arquivos fora do worktree, exceto outputs locais de QA em diretório explicitamente criado para isso.

## Decisão de produto

- O nome exibido continua sendo **Report Live**.
- O output passa a ser PPTX/PDF armazenado no Supabase, sem Google Slides ou Google Sheets no caminho de publicação.
- A atualização será assíncrona, três vezes por semana.
- O renderer deve ser local, versionado e reproduzível.
- O layout e o tema devem seguir a identidade institucional Afinz.
- Slides precisam sair completos e bem formatados, nunca como preview de tabela ou placeholder.

## Correção importante sobre cardinalidade

Os 57 slides publicados em agosto são a baseline de cobertura funcional e de divisão narrativa.

Existem no vault e no código propostas de 12 slides (`executivo_mensal`) e 31 (`deep_dive`). A função de seleção tem teste unitário de contagem, mas os decks completos de 12/31 nunca foram renderizados, comparados visualmente nem homologados como substitutos equivalentes dos 57.

Portanto:

- não use 12 ou 31 como meta;
- não compacte para caber em uma quantidade arbitrária;
- preserve a utilidade das divisões existentes;
- retire apenas o que tiver motivo demonstrável;
- toda redução exige um mapa da página antiga para o destino novo.

`K-VISA` é o único caso já decidido: slide condicional da campanha Copa Visa / LP / opt-in, fonte `VIEW_VISA_OPTIN`. A campanha acabou e o contrato foi desativado para novos runs. Preserve o histórico, mas não o recoloque no novo relatório.

## Ordem obrigatória de leitura

Leia os arquivos completos, nesta ordem:

1. `docs/plans/report-live-async/CLAUDE_COWORK_RENDERER_SPEC.md`
2. `docs/plans/report-live-async/SUPABASE_ASYNC_PUBLISHING_PLAN.md` — apenas para entender a fronteira; não implemente esta parte.
3. `MASTER_DECK_SPEC.md` na raiz de `ACALENDARIO APP`.
4. `docs/plans/ESTUDO_RECONHECIMENTO_REPORT_LIVE.md`
5. `docs/plans/inventario_slides.csv`
6. `Afinz-CRM-Midia-Vault/05-Estrategia/Report-Live-Arquitetura-Editorial.md` na raiz compartilhada.
7. `Afinz-CRM-Midia-Vault/08-Engenharia/Report-Live-Versionamento-e-Publicacao.md` na raiz compartilhada.
8. `.claude/skills/afinz-pptx/SKILL.md` na raiz compartilhada.
9. `.claude/skills/afinz-pptx/brand_spec.md` na raiz compartilhada.
10. `supabase/functions/_shared/report-live-design.ts`
11. `supabase/functions/report-sync/report-live-engine.ts`, com foco em `SlideRun`, construção de views, elegibilidade e projeção de perfis.
12. `supabase/functions/report-sync/report-live-versioning.ts`, com foco em blueprints, hashes e certificação.
13. `docs/plans/learning-loop/RELEASE_7C_EDITORIAL_SPEC.md`

Referências visuais locais:

```text
archives\report-live-evidence-2026-09-13\phase-2a\report-live-2a-candidate-aug-2026.pdf
archives\report-live-evidence-2026-09-13\outputs\report-live-production-blueprint\report-live-production-blueprint.pptx
archives\report-live-evidence-2026-09-13\outputs\report-live-production-blueprint\report-live-production-blueprint-montage.webp
```

O PDF de 57 páginas acima é uma candidata preservada para reconhecimento visual. Use o inventário, o estudo e o artefato como fonte da estrutura; não trate o PDF candidato como prova de publicação ou como layout a copiar cegamente.

## Passo 0 bloqueante — mapa dos 57 slides

Antes de codar o renderer, produza:

```text
docs/plans/report-live-async/SLIDE_COVERAGE_MAP.csv
docs/plans/report-live-async/SLIDE_COVERAGE_REVIEW.md
```

O CSV deve ter exatamente 57 linhas, uma por página da baseline, com:

```text
baseline_page
slide_instance_id
slide_code
section
title
business_question
decision_supported
source_view
has_material_data
current_problem
proposed_disposition
target_slide_or_archetype
coverage_preserved
rationale
evidence
```

Valores permitidos para `proposed_disposition`:

```text
preserve
merge
omit_no_data
retire_closed_scope
retain_as_quality_status
```

Regras:

- `merge` exige mostrar onde pergunta, decisão, evidência e limite reaparecem;
- `omit_no_data` vale para módulo condicional sem ocorrência, não para falha de fonte;
- falha de coleta pode exigir `retain_as_quality_status`;
- `retire_closed_scope` exige decisão de produto registrada;
- `K-VISA` deve ser `retire_closed_scope`;
- nenhuma outra aposentadoria pode ser presumida;
- não tente chegar a 12, 31 ou qualquer total previamente escolhido.

Em `SLIDE_COVERAGE_REVIEW.md`, responda:

1. quantos slides permanecem integrais;
2. quantos podem ser fundidos sem perda e por quê;
3. quantos estão vazios por ausência legítima;
4. quantos estão vazios por falha de dados e precisam continuar visíveis;
5. quais dependem de fonte ou contrato ainda inexistente;
6. qual cardinalidade resulta da análise, sem meta prévia;
7. quais decisões precisam do product owner.

Pare ao concluir o passo 0 e apresente o mapa antes de implementar. A cardinalidade e as fusões são decisões de produto, não escolhas silenciosas do renderer.

## Depois do aceite do passo 0

Implemente o renderer conforme `CLAUDE_COWORK_RENDERER_SPEC.md`:

- parta do template institucional versionado;
- use a skill `afinz-pptx` e aplique a marca deterministicamente;
- gere PPTX, PDF, previews e `qa-report.json`;
- use um pacote local, sem Supabase e sem Google;
- renderize primeiro o golden run de agosto;
- preserve textos, tabelas e elementos exigidos como editáveis;
- inspecione visualmente todas as páginas;
- não publique nem envie arquivos ao Storage.

## Guardrails

- Ausência não é zero.
- Taxa é soma sobre soma.
- CPA de plataforma não é CAC de CRM.
- Narrativa não calcula número.
- Mês parcial precisa de marcação.
- Comparação usa período equivalente e mesma semântica.
- Memória curada não prova causalidade.
- Aposta não é outcome.
- O renderer não escolhe quais dados são verdadeiros.
- Nenhuma escrita em Supabase, Google, main ou Storage.

## Relatório esperado no passo 0

Entregue:

- caminhos dos dois arquivos criados;
- contagem por disposição;
- lista das fusões propostas;
- lista das omissões/aposentadorias;
- lacunas do pacote de dados que impediriam slides completos;
- divergências encontradas entre vault, código e PDF;
- nenhuma implementação de renderer ainda.

