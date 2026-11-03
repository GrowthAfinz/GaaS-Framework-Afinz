---
tags: [dados, comunicacoes, templates, vibe, llm-extraction, regua]
tipo: dados-brutos
camada: dados
atualizado: 2026-08-17
status: confirmado
fonte: analise-manual-llm
---

# Templates Vibe — Revisão 2026 (dataset extraído por LLM vision + planilha de governança)

**Definição:** dataset de 61 templates reais de aquisição (WhatsApp, SMS, Push) da virada para o tema [[Vibe]], extraído da planilha de governança `REVISÃO VIBE.xlsx` (upload direto do Pablo, 2026-08-17). Diferente de [[Amostras-Comunicacoes-Reais]] (prints soltos de pastas pessoais, sem `template_id`), este dataset vem **direto da planilha oficial de revisão**, então cada registro já carrega o nome real do template no Salesforce Marketing Cloud, a jornada e o segmento — os mesmos identificadores usados em [[activities]] e [[communication_slots]].

## Arquivos

- `dataset_vibe_completo.json` — os 61 registros, um por imagem, com metadados de planilha + extração de conteúdo por LLM.
- `afinz_vibe_dataset.csv` — mesmo dataset em formato tabular.
- `estrutura_bau_regua.json` — a matriz de régua planejada (SEGMENTO × ETAPA FUNIL × CANAL × PARCEIRO → nº de disparos), extraída da aba `Estrutura BAU CRM - OFERTA VIBE` da mesma planilha.

## Como foi extraído (problema técnico resolvido)

A planilha usa o recurso moderno do Excel "imagem na célula" (rich value / `xl/richData`), não o mecanismo antigo de `xl/drawings` que o `openpyxl` lê por padrão — por isso `ws._images` retornava vazio para todas as abas. Foi necessário parsear diretamente `xl/richData/rdrichvalue.xml`, `richValueRel.xml` (+ `.rels`) e `xl/metadata.xml` (cadeia `vm` da célula → `valueMetadata` → `futureMetadata` → rich value → relação → `xl/media/imageN.png`) para religar cada imagem à sua linha/coluna de origem. Script de referência: mapeamento feito via zipfile + ElementTree, sem dependências externas.

Isso confirmou **106 referências de imagem em 61 arquivos físicos** — ou seja, **27 imagens são reaproveitadas em mais de uma linha/aba** (mesmo criativo usado em disparos diferentes, ou repetido entre a aba "atual" e a aba "old"/histórica). Isso é exatamente o problema de "reuso de criativo invisível" apontado em [[Galeria-de-Templates]] — agora ele está rastreável campo a campo (`reuso_criativo` / `qtd_ocorrencias_planilha` em cada registro).

8 subagentes rodaram em paralelo (um por lote de ~8 imagens), cada um recebendo o contexto de planilha já resolvido (nome do template, jornada, segmento, canal — fatos, não inferência) e devolvendo apenas a leitura visual pura do conteúdo (texto, oferta, CTA, tom, elementos visuais, indício de teste/QA).

## Campos por registro

`arquivo_imagem` · `nome_template_salesforce` (nome real do template, candidato a `template_id`) · `jornada` · `segmento` · `canal` · `parceiro` · `tema` · `texto_completo` · `oferta` · `oferta_planilha` · `promocional` · `cta_principal` · `cta_secundario` · `elementos_visuais` · `tom` · `campos_personalizacao_visiveis` · `indicio_teste_qa` · `reuso_criativo` · `qtd_ocorrencias_planilha` · `link_appsflyer` · `confianca_extracao` · `planilha_ocorrencias` (lista completa de onde a imagem aparece — sheet + linha + campos).

## Achados principais

- **Confirma a taxonomia de variantes por origem de lead**, direto nos nomes reais de template: `institucional`, `ecred`, `srsa` (Serasa), `ac` (Consumidor Positivo/outro parceiro), `bpc`/`bsp` (Bom pra Crédito), `neg`/`ngd` (Negados), `nov`/`upo` (Upgrade), `car` (Carrinho). Isso é exatamente o que Pablo descreveu como já sabido pela régua de Carrinho Abandonado (Institucional vs Ecred).
- **Confirma 3 sub-jornadas distintas de Carrinho Abandonado** com cadência própria: `diário`, `21D` (via matriz BAU) e `sábado` (`afz_car_vis_pon_wpp_car_aqssabados_...`) — cada uma com seu próprio conjunto de disparos, não apenas uma variação de tom.
- **Qualidade muito mais alta que o dataset de screenshots pessoais**: só 6/61 (10%) com indício de teste/QA, contra 53/73 (73%) no [[Amostras-Comunicacoes-Reais]] — esperado, já que esta é a planilha oficial de governança, não capturas manuais.
- **Todos os 61 registros têm `nome_template_salesforce` real** — ao contrário do dataset de screenshots, que não tinha nenhum `template_id` candidato. Isso não substitui a validação humana da planilha de governança (`gaas-governanca-comunicacoes`), mas dá um candidato forte para revisão manual antes de popular `communication_templates.template_id` — ver [[communication_slots]] (113/115 slots ainda `unmapped`).

## Cobertura e limites — ler antes de usar

- Cobre as 61 imagens que existiam na planilha `REVISÃO VIBE.xlsx` em 2026-08-17 (upload do Pablo). Não sincroniza automaticamente com a planilha viva.
- `nome_template_salesforce` é o nome como aparece na planilha de auditoria — **não foi confirmado 1:1 contra o `template_id` normalizado em `communication_templates`**. Antes de popular a tabela, validar manualmente (regra não-negociável da skill `gaas-governanca-comunicacoes`: nunca inventar `template_id`/`activity_name`).
- A aba `Estrutura BAU CRM - OFERTA VIBE` está marcada `à validar` em todas as linhas — é o planejamento-alvo da régua, não confirmação de que já rodou.
- Ver arquitetura de "réguas inteligentes" proposta a partir deste dado em [[Reguas-Inteligentes-Arquitetura]].

## Relacionado

- [[Amostras-Comunicacoes-Reais]] · [[communication_templates]] · [[communication_slots]] · [[activities]] · [[Galeria-de-Templates]] · [[Vibe]] · [[Reguas-Inteligentes-Arquitetura]] · skill `afinz-copy-aquisicao`
