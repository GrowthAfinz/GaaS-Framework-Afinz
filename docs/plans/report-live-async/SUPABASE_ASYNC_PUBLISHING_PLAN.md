# Plano de implementação — publicação assíncrona no Supabase

**Responsável principal:** Codex/GaaS  
**Dependência externa:** renderer entregue pelo Claude Cowork  
**Cadência proposta:** segunda, quarta e sexta, 09:00, `America/Sao_Paulo`

## 1. Objetivo

Substituir Google Sheets/Slides como destino de publicação por artefatos PPTX/PDF imutáveis no Supabase Storage. O Report Live continua sendo a visualização editorial, mas passa a declarar atualização programada e data de corte.

## 2. O que permanece

- engine determinístico;
- `report_runs`;
- inputs congelados;
- hashes e blueprints;
- build, certificação e publicação como etapas distintas;
- perfis de output governados, sem assumir que a hipótese 12/31 já substitui a baseline publicada de 57 slides;
- ponteiro de publicação vigente;
- histórico e rollback;
- contratos de missing, cutoff, comparação e confiança;
- Release 7C em C7/C8.

## 3. O que muda

- sai a escrita em Sheet/Slides;
- entra um pacote normalizado de renderização;
- entra um worker externo com lease;
- PPTX, PDF, previews e QA tornam-se artefatos de primeira classe;
- publicação significa mover um ponteiro do banco para um conjunto imutável de objetos;
- o GaaS incorpora o PDF e oferece download do PPTX;
- o rótulo visual informa "atualização programada, 3x por semana".

## 4. Fluxo

```text
cron
  -> cria report_run idempotente
  -> congela inputs
  -> build determinístico
  -> certifica contrato analítico
  -> cria report_render_job
  -> worker reivindica lease
  -> baixa render package
  -> gera PPTX/PDF/previews/QA
  -> envia para paths imutáveis
  -> finaliza com hashes
  -> certifica artefatos
  -> ativa publication pointer
  -> GaaS mostra a nova versão
```

Falha em qualquer etapa preserva a publicação anterior.

## 5. Modelo de dados proposto

### `report_render_jobs`

```text
run_id uuid pk
status text
scheduled_for timestamptz
claimed_by text null
lease_token uuid null
lease_until timestamptz null
attempt_count integer
checkpoint jsonb
package_path text
last_error text null
created_at timestamptz
updated_at timestamptz
finished_at timestamptz null
```

Estados:

```text
queued | claimed | rendering | uploading | validating | done | blocked | error
```

### `report_artifacts`

```text
id uuid pk
run_id uuid fk
artifact_type text
storage_path text unique
content_type text
checksum_sha256 text
byte_size bigint
page_count integer null
renderer_version text
metadata jsonb
created_at timestamptz
```

Tipos:

```text
render_package | pptx | pdf | preview | qa_report | render_manifest
```

### `report_publications`

Evoluir de forma aditiva:

```text
publication_channel = google_legacy | supabase_storage
pptx_path
pdf_path
preview_prefix
artifact_manifest_path
data_through
renderer_version
```

Campos legados de Google permanecem para histórico e rollback durante a transição.

## 6. Storage

Bucket privado existente: `report-live`.

```text
runs/<run_id>/
├── inputs/report-frozen-inputs.json
├── render/report-render-package.json
├── outputs/report-live.pptx
├── outputs/report-live.pdf
├── previews/page-001.png
├── qa/qa-report.json
└── manifest.json
```

Regras:

- `upsert=false`;
- um path por `run_id`;
- download autenticado ou URL assinada emitida sob demanda;
- checksums gravados no banco e manifesto;
- o ponteiro vigente vive no banco, não em um arquivo `latest.pdf` sobrescrito.

## 7. API do worker

Fronteira mínima:

```text
POST /report-live/render/claim
GET  /report-live/render/:run_id/package
POST /report-live/render/:run_id/upload-urls
POST /report-live/render/:run_id/checkpoint
POST /report-live/render/:run_id/finalize
POST /report-live/render/:run_id/fail
```

`finalize` recebe paths, checksums, tamanhos, contagem de páginas, versão do renderer e resumo do QA. A API rebaixa arquivos e verifica metadados antes de marcar o job como `done`.

## 8. Scheduler

O Cron apenas cria o run/job. Não executa renderização pesada.

Chave idempotente:

```text
profile + period_start + period_end + scheduled_for + source_hash + spec_version
```

Política proposta:

- segunda, quarta e sexta às 09:00;
- dados até o último dia fechado;
- os outputs aprovados compartilham o mesmo snapshot;
- a primeira implementação reconstrói a cobertura do output publicado de 57 slides;
- um perfil compacto só entra na cadência depois que a auditoria baseline→destino provar que nenhuma decisão, evidência ou limite útil desapareceu;
- falha de freshness gera run bloqueado e evento no feed, sem substituir o output vigente.

## 9. Certificação

### Antes do renderer

- snapshot congelado;
- fontes e cutoffs presentes;
- slides projetados;
- cardinalidade coerente com o manifesto e com o mapa de cobertura da baseline;
- nenhum `omitir_bloqueado` no pacote;
- hashes e versões definidos.

### Depois do renderer

- PPTX e PDF presentes;
- checksums conferidos;
- contagem PPTX = contagem PDF = contagem do pacote;
- previews completos;
- QA sem erro bloqueante;
- `run_id`, profile e spec coerentes em todos os manifests;
- leitura de prova dos objetos recém enviados.

### Ativação

- transação atualiza a publicação anterior para `superseded`;
- nova publicação vira `active`;
- ponteiro do profile é atualizado;
- evento material entra no feed;
- nenhuma ativação ocorre se o PDF ainda não estiver validado.

## 10. GaaS

### `Relatórios > Report Live`

- visualizador PDF;
- publicado em;
- dados até;
- próxima atualização;
- status da última tentativa;
- baixar PDF;
- baixar PowerPoint;
- abrir histórico;
- mensagem explícita quando a última atualização estiver bloqueada.

### `Aprendizado Growth > Report Live`

- agenda e fila;
- progresso por checkpoint;
- candidata atual;
- thumbnails para QA;
- resultado da certificação;
- reprocessar;
- ativar/rejeitar quando houver modo manual;
- histórico, diff e rollback;
- erros de renderização e bloqueios de dados.

## 11. Transição

1. consolidar a spec;
2. Claude entrega renderer e fixtures locais;
3. Codex implementa pacote normalizado e contratos de banco;
4. integrar worker sem ativar publicação automática;
5. reconstruir o golden run real de 57 páginas;
6. classificar cada slide como preservar, fundir, omitir sem dado ou aposentar;
7. comparar PPTX/PDF e cobertura funcional com a publicação vigente;
8. homologar a cardinalidade resultante, sem meta prévia de 12 ou 31;
9. executar três ciclos em shadow mode;
10. habilitar canal `supabase_storage` no GaaS;
11. manter a última publicação Google como histórico;
12. aposentar Google somente após aceite registrado.

## 12. Entregas do Codex

- ADR de substituição do destino Google;
- migration aditiva;
- adapter `BuiltReport -> ReportRenderPackage`;
- fila/leases/checkpoints;
- endpoints do worker;
- uploads imutáveis e verificação;
- certificação de PPTX/PDF;
- scheduler 3x por semana;
- interface de consumo;
- workspace operacional;
- histórico e rollback;
- testes unitários, SQL, integração e UI;
- atualização do vault e ontologia no cutover.

## 13. Gates para iniciar código de produção

- spec do renderer aceita;
- horário da cadência confirmado;
- golden package de 57 slides e mapa de cobertura baseline→destino disponíveis;
- renderer gera PPTX e PDF sem intervenção manual;
- estratégia de execução do worker definida para o modo desassistido.

Nenhuma migration, deploy ou mudança de publicação faz parte desta spec inicial.
