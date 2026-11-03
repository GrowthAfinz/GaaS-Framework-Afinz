---
tags: [engenharia, report-live, supabase, pptx, pdf, publicacao]
tipo: arquitetura
camada: engenharia
tipo_diataxis: explanation
criado: 2026-09-24
atualizado: 2026-09-25
status: em-implementacao
---

# Report Live — publicação assíncrona no Supabase

## Decisão em especificação

O nome **Report Live** permanece na visualização editorial. O modo de atualização passa a ser declarado como programado, três vezes por semana. Google Sheets e Google Slides deixam de ser dependências do novo caminho de publicação.

O Supabase funciona como control plane e fonte dos artefatos:

- agenda e fila de runs;
- snapshot imutável;
- estado, leases e checkpoints;
- certificação;
- arquivos PPTX, PDF, previews e QA no Storage;
- ponteiro da publicação vigente;
- histórico e rollback.

O Claude Cowork atua como worker editorial e executa um renderer versionado. O renderer recebe um pacote normalizado e já projetado pelo engine. Ele não consulta fontes, escolhe slides, recalcula métricas nem decide publicação.

## Contrato de completude

Cada slide renderizado deve conter o que for aplicável entre: assunto/takeaway, contexto, valor, comparação, evidência visual, leitura da decisão, limite, confiança, fonte, cutoff e run. Placeholder, JSON cru, tabela sem hierarquia e omissão silenciosa não constituem output válido.

Os 57 slides publicados em agosto permanecem como baseline de cobertura funcional. A proposta de 12 slides em `executivo_mensal` e 31 em `deep_dive` existe no vault e no código, mas nunca foi homologada como substituta equivalente.

O renderer produz exatamente uma página para cada `slide_instance_id` recebido. Antes de reduzir a cardinalidade, cada slide da baseline precisa ser classificado como preservar, fundir com equivalência demonstrada, omitir por ausência de dado ou aposentar por encerramento de escopo. `K-VISA`, ligado à Copa/LP/opt-in já encerrada, é o caso registrado de aposentadoria; o histórico permanece imutável.

## Contrato executável do renderer

O contrato normalizado `ReportRenderPackage` está formalizado em três camadas no repositório:

- JSON Schema: `docs/plans/report-live-async/report-render-package.schema.json`;
- adaptador puro e validações: `supabase/functions/report-sync/report-live-render-package.ts`;
- fixtures determinísticas: `docs/plans/report-live-async/fixtures/`.

Pacotes de produção precisam contabilizar exatamente as 57 páginas históricas. Uma página preservada, fundida ou mantida como estado de qualidade aponta para ao menos um slide de destino. Omissão por ausência legítima e aposentadoria de escopo exigem justificativa explícita. O validador bloqueia cardinalidade divergente, destino inexistente, procedência ausente, reativação de `K-VISA` e conversão de missing em zero.

O adaptador não pede ao renderer para reconstruir contratos de gráfico. Ele transporta layout, réguas, séries, eixos, cores, formatos e o range materializados nas views `VIEW_EDITORIAL_LAYOUTS`, `VIEW_EDITORIAL_RULERS`, `VIEW_EDITORIAL_CHART_REGISTRY` e respectivas famílias de dados. `expected_chart=true` sem contrato de gráfico fecha o pacote com erro.

O golden de agosto é deliberadamente estrutural e não renderizável. Ele registra ordem, código, título, arquétipo, view e procedência, mas não contém as linhas do artefato imutável. Os três pacotes menores de arquétipo usam dados explicitamente sintéticos e cobrem os doze contratos visuais sem se passar por performance real.

### Reconciliação do run de agosto

Consulta read-only do run `9bb55892-4b17-4f76-825a-0ac97c92b525` confirmou 62 `slide_runs` e 62 blueprints construídos, contra 57 páginas publicadas na publicação `54649269-7cce-460a-a87d-b4cc5f310a62`. A diferença é composta por `K-EXP` e quatro instâncias `P6`, todos marcados `omitir_bloqueado`. Não são páginas silenciosamente perdidas pelo renderer.

`K-VISA` aparece na página 47 da publicação histórica e permanece no golden com `historical_only=true` e `retired_after_publication`. Novos pacotes de render não podem incluir esse código.

## Fronteira de responsabilidade

| Frente | Responsável |
|---|---|
| Layout, tema Afinz, PPTX, PDF, previews e QA visual | Claude Cowork + renderer versionado |
| Números, comparações, vereditos, elegibilidade e lista de slides | engine do Report Live |
| Fila, Storage, certificação, ativação e rollback | Supabase/GaaS |
| Visualizador, downloads, freshness e histórico | GaaS |

## Decisão após o mapa de cobertura

O passo 0 foi aceito em 25/09/2026. `monthly_full`/`monthly_report` passa a ser o output operacional de cardinalidade dinâmica; 12 e 31 páginas continuam como derivados. As fusões e regras de retorno estão registradas em `docs/plans/report-live-async/PRODUCT_DECISIONS_2026-09-25.md`.

O artefato real de agosto foi exportado do bucket privado pelo dispatcher interno, sem alterar publicação. Ele confirmou 62 blueprints, 57 páginas elegíveis e o `content_hash` já registrado no banco. A cópia local fica fora do Git.

## Estado

A arquitetura, o contrato executável e as decisões de composição estão documentados. O engine e os gates estão em implementação em branch; o renderer visual pode avançar contra as fixtures enquanto contratos de gráfico e narrativa dos slides restantes são materializados. Ainda não houve migration, deploy de Edge Function, agendamento, render em produção nem troca do ponteiro vigente.

## Relacionado

- [[Report-Live-Versionamento-e-Publicacao]]
- [[Report-Live-Enciclopedia]]
- [[Report-Live-Arquitetura-Editorial]]
- [[Loop-de-Aprendizado-Growth]]
