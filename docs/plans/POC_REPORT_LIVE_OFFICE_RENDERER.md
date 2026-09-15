# POC — renderer Office do Report Live

Data da prova: 15/09/2026. Estado: **piloto mensal de 12 slides viável; troca do renderer vivo ainda não aprovada**.

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

Para o perfil mensal completo, use `--slides all` e caminhos próprios para o plano e os outputs. A validação reproduzível está exposta como `npm run validate:report-live-office-monthly` depois da instalação das dependências Python.

## Piloto mensal completo

O segundo gate usou o artefato imutável certificado do run `c543aaa3-0bd9-440a-ba3d-6404cc112d97`, `content_hash` `a082adf24b3bd1d1a37aa14d3f3158e0b4b45221548435e9882a58214ec8fe9e`, período agosto/2026 e perfil `monthly_report`.

Foram renderizados os 12 slides do perfil, na ordem declarada pelo próprio artefato:

1. `c0`, capa;
2. `c1`, leitura executiva;
3. `c4`, pacing CRM;
4. `c7`, outcomes;
5. `c8`, fila de decisão;
6. `m1`, pacing de mídia;
7. `m2`, mix de mídia;
8. `b1`, funis paralelos;
9. `p1_serasa`;
10. `p1_proprietaria`;
11. `p1_plurix`;
12. `p1_bem_barato`.

O PPTX contém três gráficos nativos e editáveis: uma série temporal no `c4` e rankings de barras no `m1` e `m2`. O validador não se limita a contar os objetos: confronta os 31 pontos de cada série do `c4` e os cinco valores de cada ranking com o render plan canônico.

Estados ausentes permanecem explícitos. `c7` informa zero janelas de outcome encerradas, `c8` preserva a fila vazia, `b1` mantém o funil B2C indisponível e `m1` avisa que orçamento está ausente em 5/5 linhas, portanto pacing não pode ser calculado.

## Evidência

- O PPTX abre no Microsoft PowerPoint, tem 3 slides e 1 gráfico nativo/editável.
- O próprio PowerPoint exportou os três slides para PNG em 1920×1080; a inspeção visual não encontrou corte, sobreposição ou glifo quebrado.
- O PDF tem 3 páginas, canvas 960×540 pt (16:9), texto extraível e os mesmos três títulos.
- O PDF foi rasterizado com Poppler e as três páginas foram inspecionadas. O defeito de dimensionamento do logo encontrado na primeira passagem foi corrigido antes desta evidência.
- O validator confirma o slice `c0,c4,p1_serasa`, 3 slides, 1 gráfico nativo, 3 páginas e os textos-chave nos dois formatos.
- Os testes puros confirmam que conteúdo e geometria vêm do artefato e que slide ausente ou spec incompatível falham fechados.
- PPTX final: 11.059.903 bytes; SHA-256 `605020fdd0df2221fd962a5d088550f6bb4be62960824970d442c99eed439b8c`.
- PDF final: 16.041 bytes; SHA-256 `e2e653dfe35f6070a3ed2822fbe7e4734ca580606661cb591f17811d24b79b73`.

Evidência adicional do piloto mensal:

- O Microsoft PowerPoint abriu e rasterizou os 12 slides em 1920×1080; todos foram inspecionados individualmente sem corte, sobreposição ou glifo quebrado.
- O PDF foi rasterizado com Poppler; as 12 páginas foram inspecionadas individualmente e mantêm o canvas 960×540 pt.
- O pacote PPTX passou no validador estrutural com 12 slides, 44 partes de relacionamento, 3 gráficos e zero achados.
- A geometria passou com canvas 13,3333×7,5 pol., razão 16:9, 12 slides, fólio não preenchido e uma única família observada no PPTX: Calibri em 163 usos.
- O validador funcional confirmou 12 slides, 3 gráficos nativos, os dados internos dos gráficos, 12 páginas, títulos e canvas.
- Os quatro testes unitários do renderer, os 57 testes do Report Live, os 124 testes Vitest, `deno check`, o gate TypeScript com dívida-base de 57 e o build Vite passaram.
- PPTX mensal: 11.090.826 bytes; SHA-256 `c86a671185848a5f0f95c40be7a5671b7cbc414b41b971a70d3eed582c7450a8`.
- PDF mensal: 27.539 bytes; SHA-256 `94e215955668e2c7836117e3c0d8672111294a8eaf6c79f758629061c210189b`.

## Diferenças conhecidas e custo real

1. **O PDF é uma segunda tradução do mesmo render plan, não conversão do PPTX.** Isso elimina a dependência de LibreOffice/PowerPoint no worker, mas cria uma superfície visual a testar. Nesta prova, os números, os eixos, as cores, a geometria e o conteúdo coincidem; marcadores e gradação de ticks variam entre os motores.
2. **Fonte do PDF.** O PPTX usa Calibri; o PDF usa Helvetica nativa do ReportLab. A troca integral exige decidir e empacotar uma fonte redistribuível única para os dois formatos.
3. **Template.** A prova usa o template institucional e logo da skill local `afinz-pptx`. Esses assets ainda não estão versionados nesta branch; precisam virar dependência rastreada antes de CI/produção. O template completo também deixa o PPTX com cerca de 11 MB, apesar de haver apenas três slides.
4. **Cobertura.** O perfil mensal de 12 slides está coberto. O perfil `deep_dive` de 31 slides, tabela/heatmap, links e seleção por frente ainda não estão implementados.
5. **Operação.** Ainda não há job, cache, upload privado, UI de download nem rollback do renderer Office. A rota criada cobre somente aquisição segura do artefato.

## Incidente Google observado durante a prova

O job `d763d844-98ff-4b24-a762-f151561b21a7` permanece `paused=true`, fase `narrative`. A última falha observada foi Google API 400 em `refreshSheetsChart`: o gráfico declarado não foi encontrado na planilha. Nenhuma ativação ocorreu e o deck vivo de 57 slides permaneceu intacto.

Esse incidente reforça o valor operacional de remover o vínculo Sheets→Slides, mas não basta sozinho para aprovar uma troca de renderer.

## Recomendação

A prova e o piloto mensal demonstram ganho concreto: é possível gerar o perfil de 12 slides em PPTX editável e PDF legível, offline, a partir do artefato certificado, sem o ciclo Google e sem recalcular o negócio. A arquitetura está aprovada para evoluir como **exportação mensal alternativa**, não para substituição imediata do renderer vivo.

Antes de produção ainda é obrigatório versionar ou empacotar template, logo e uma fonte redistribuível comum aos dois formatos; resolver a diferença estrutural entre PDF direto e PPTX; criar worker/cache/upload privado/UI; e decidir se o perfil de 31 slides deve ser suportado. Até esses gates, Google continua sendo o renderer vivo, o job pausado não deve ser retomado e o Office renderer permanece isolado.
