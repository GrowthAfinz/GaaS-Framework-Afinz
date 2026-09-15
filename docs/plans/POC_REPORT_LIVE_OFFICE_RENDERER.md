# POC — renderer Office do Report Live

Data da prova: 15/09/2026. Estado: **viável como renderer alternativo; troca integral ainda não aprovada**.

## Objetivo e limite

Validar se o Report Live consegue produzir PPTX editável e PDF sem Google Sheets/Slides, consumindo o mesmo artefato imutável certificado que já é a fonte de verdade do produto. A prova não recalcula métrica, não roda o engine, não publica, não ativa geração Google e não altera o deck vivo.

O recorte implementado tem três slides do run certificado `ac206b6a-5f82-4188-a184-186b425b7f5f`, período agosto/2026, perfil `deep_dive`:

1. `c0`: capa e manifesto;
2. `c4`: pacing com duas séries e gráfico de linha nativo/editável no PowerPoint;
3. `p1_serasa`: scorecard com cartões, CAC, deltas, faixas e vereditos.

`c3` foi substituído por `p1_serasa`: ele não existe nos perfis certificados e sua fonte `VIEW_SCORECARD_INTEGRATED` é somente cabeçalho. O substituto testa o componente de régua com dados reais sem inventar conteúdo.

## Arquitetura provada

```text
report_runs certificado
        |
        v
artefato JSON imutável no Storage
        |
        v
render plan canônico (conteúdo + geometria)
        |                         |
        v                         v
python-pptx                  ReportLab
PPTX editável                PDF direto
```

O endpoint interno `export_artifact` devolve uma URL assinada de sete dias somente para um `run_id` certificado. Ele não expõe a service role e não aceita artefato candidato ou sem caminho imutável. O renderer local recebe esse JSON e fecha se a versão não for `artifact_version=1` e `spec=3.0`.

O endpoint está ACTIVE no `report-sync` v51, `verify_jwt=false` com autenticação própria, bundle `bb45648f1915f413dfee18d6597f56c4c691cd12840fcad698a8476759384cbf`.

A geometria não é reimplementada a partir do layout Google: o render plan lê `blueprint.visual.geometry`. Conteúdo e procedência vêm de `VIEW_REGISTRY`, `VIEW_RUN_MANIFEST`, `VIEW_PACING_ISODAYS`, `VIEW_EDITORIAL_LAYOUTS` e `VIEW_EDITORIAL_RULERS`, todos dentro do mesmo artefato.

## Execução reproduzível

Dependências Python estão fixadas em `scripts/requirements-report-live-office.txt`.

```powershell
python -m pip install -r scripts/requirements-report-live-office.txt

python scripts/report_live_office_renderer.py `
  --artifact <report-build.json> `
  --expected-run-id <run_id da resposta export_artifact> `
  --expected-content-hash <content_hash da resposta export_artifact> `
  --template <afinz_template_institucional.pptx> `
  --logo <afinz_logo.png> `
  --plan tmp/report-live-pptx-poc/render-plan.json `
  --pptx output/pptx/report-live-office-poc-aug-2026.pptx `
  --pdf output/pdf/report-live-office-poc-aug-2026.pdf

python scripts/validate_report_live_office_output.py `
  --plan tmp/report-live-pptx-poc/render-plan.json `
  --pptx output/pptx/report-live-office-poc-aug-2026.pptx `
  --pdf output/pdf/report-live-office-poc-aug-2026.pdf
```

Após a geração, o PPTX recebe a aplicação determinística da marca pelo `apply_afinz_brand.py` da skill `afinz-pptx`.

O `run_id` e o `content_hash` retornados pelo endpoint são obrigatórios na CLI e precisam coincidir com o arquivo baixado. Isso impede renderizar silenciosamente o artefato de outro run ou um conteúdo que não corresponda ao registro certificado.

## Evidência

- O PPTX abre no Microsoft PowerPoint, tem 3 slides e 1 gráfico nativo/editável.
- O próprio PowerPoint exportou os três slides para PNG em 1920×1080; a inspeção visual não encontrou corte, sobreposição ou glifo quebrado.
- O PDF tem 3 páginas, canvas 960×540 pt (16:9), texto extraível e os mesmos três títulos.
- O PDF foi rasterizado com Poppler e as três páginas foram inspecionadas. O defeito de dimensionamento do logo encontrado na primeira passagem foi corrigido antes desta evidência.
- O validator confirma o slice `c0,c4,p1_serasa`, 3 slides, 1 gráfico nativo, 3 páginas e os textos-chave nos dois formatos.
- Os testes puros confirmam que conteúdo e geometria vêm do artefato e que slide ausente ou spec incompatível falham fechados.
- PPTX final: 11.059.903 bytes; SHA-256 `605020fdd0df2221fd962a5d088550f6bb4be62960824970d442c99eed439b8c`.
- PDF final: 16.041 bytes; SHA-256 `e2e653dfe35f6070a3ed2822fbe7e4734ca580606661cb591f17811d24b79b73`.

## Diferenças conhecidas e custo real

1. **O PDF é uma segunda tradução do mesmo render plan, não conversão do PPTX.** Isso elimina a dependência de LibreOffice/PowerPoint no worker, mas cria uma superfície visual a testar. Nesta prova, os números, os eixos, as cores, a geometria e o conteúdo coincidem; marcadores e gradação de ticks variam entre os motores.
2. **Fonte do PDF.** O PPTX usa Calibri; o PDF usa Helvetica nativa do ReportLab. A troca integral exige decidir e empacotar uma fonte redistribuível única para os dois formatos.
3. **Template.** A prova usa o template institucional e logo da skill local `afinz-pptx`. Esses assets ainda não estão versionados nesta branch; precisam virar dependência rastreada antes de CI/produção. O template completo também deixa o PPTX com cerca de 11 MB, apesar de haver apenas três slides.
4. **Cobertura.** Três slides provam capa, série temporal e scorecard. Não provam os demais arquétipos, tabela/heatmap, ícones, links, seleção por frente nem 12/31 slides.
5. **Operação.** Ainda não há job, cache, upload privado, UI de download nem rollback do renderer Office. A rota criada cobre somente aquisição segura do artefato.

## Incidente Google observado durante a prova

O job `d763d844-98ff-4b24-a762-f151561b21a7` permanece `paused=true`, fase `narrative`. A última falha observada foi Google API 400 em `refreshSheetsChart`: o gráfico declarado não foi encontrado na planilha. Nenhuma ativação ocorreu e o deck vivo de 57 slides permaneceu intacto.

Esse incidente reforça o valor operacional de remover o vínculo Sheets→Slides, mas não basta sozinho para aprovar uma troca de renderer.

## Recomendação

A prova demonstra ganho concreto: é possível gerar PPTX editável e PDF legível, offline, a partir do artefato certificado, sem o ciclo Google e sem recalcular o negócio. Portanto, a alternativa Python deve avançar para um **piloto completo de 12 slides**, não para substituição imediata.

O próximo gate deve medir números, não preferência: implementar os arquétipos que faltam, empacotar fonte/assets, comparar tempo e tamanho, renderizar as 12 páginas no PowerPoint e no PDF, e exigir zero divergência de conteúdo/contrato. A troca só deve ser aprovada depois desse gate; até lá, Google continua sendo o renderer vivo e o Office renderer permanece isolado.
