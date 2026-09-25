# Decisões de produto — relatório mensal completo

**Data:** 2026-09-25  
**Status:** aprovado para implementação  
**Origem:** revisão de cobertura das 57 páginas e aceite do product owner

## Objetivo

O output operacional oficial passa a ser o perfil `monthly_full`, exposto também pelo alias histórico `monthly_report`. A quantidade de páginas é consequência das decisões e dos dados do período; não é uma meta fixa.

`executivo_mensal` (12) e `deep_dive` (31) continuam disponíveis como derivados opcionais. Eles não substituem o relatório mensal completo e não definem o gate de certificação do output oficial.

## Regras de composição

1. C0–C8 permanecem obrigatórios no relatório mensal completo.
2. P7 não ocupa uma página mensal própria. As ações de parceiro ficam consolidadas em C8; P1 declara quando não há ação e aponta para C8 quando houver. O slide P7 pode existir em `partner_deep_dive`.
3. M7 não ocupa uma página mensal própria. As ações `domain=media` ficam em C8; M6 declara quando não há ação de mídia. O slide M7 pode existir em um deep dive de mídia.
4. B3 é incorporado a C2 enquanto ambos lerem `VIEW_COVERAGE_COMPARABILITY`. B3 volta somente quando existir uma view de detalhamento própria.
5. P2 só existe quando o parceiro possui dois ou mais segmentos observados. Com um segmento, o contexto é incorporado a P1.
6. B2 é incorporado a B1 enquanto a fonte diária B2C estiver indisponível. B1 deve mostrar cutoff, indisponibilidade e ação de recuperação; B2 volta quando houver série observada no período.
7. K-TPL não ocupa página mensal própria. Cobertura e backlog aparecem em C2; uma ação material, quando produzida, aparece em C8 e no Aprendizado Growth.
8. K-QLT continua condicional e só considera incidentes dentro da janela do relatório.
9. K-VISA permanece aposentado para novos runs; seu histórico não é apagado.

## Certificação

O gate deixa de exigir exatamente 12 ou 31 páginas. Ele passa a bloquear:

- perda de qualquer slide obrigatório do core;
- ausência total dos blocos parceiro, mídia, B2C ou anexo no `monthly_full`;
- IDs duplicados;
- reaparecimento de K-VISA;
- P2 com menos de dois segmentos;
- reaparecimento mensal das páginas incorporadas acima.

O `ReportRenderPackage` adiciona um segundo gate: toda uma das 57 páginas históricas precisa estar contabilizada como `preserve`, `merge`, `omit_no_data`, `retire_closed_scope` ou `retain_as_quality_status`, com destino e justificativa quando houver preservação ou fusão.

## Conteúdo completo e overflow

P5 e M5 exibem no slide as oito linhas prioritárias e declaram o total observado e o volume omitido. O conjunto completo deve ser entregue como artefato tabular companheiro no mesmo run do Storage. Notas do apresentador guardam procedência; não substituem dado navegável.

## Contrato do renderer

O renderer não escolhe séries, eixos, formato numérico, narrativa ou cardinalidade. Em pacote de produção:

- `time_series_pacing`, `router_ranking`, `driver_scatter`, `funnel` e `heatmap` exigem `chart_contract` completo;
- todo slide exige `takeaway`, `evidence[]` e `limitation` estruturados;
- cores semânticas de BU são preservadas; a aplicação de marca não pode remapeá-las;
- Calibri é a fonte gravada; capa escura e páginas analíticas claras formam o tema institucional.

## Golden de agosto

O artefato imutável certificado do run `9bb55892-4b17-4f76-825a-0ac97c92b525` foi exportado pelo dispatcher interno em 2026-09-25, sem alterar publicação. A cópia local fica em `artifacts/report-live-async/golden/9bb55892-report-build.json`, ignorada pelo Git por conter dado real.

Identidade confirmada no banco:

- `artifact_path`: `runs/9bb55892-4b17-4f76-825a-0ac97c92b525/blueprints/report-build.json`;
- `content_hash`: `0033ccb3d907a383e47e725c2a1b8f0e263e40f4b9279a451450f29edf5f213a`;
- 62 slide runs e blueprints;
- 57 slides elegíveis na publicação histórica.

A cópia local é lastro para o adaptador e para QA; não deve ser commitada nem tratada como fonte concorrente do objeto imutável no Storage.

