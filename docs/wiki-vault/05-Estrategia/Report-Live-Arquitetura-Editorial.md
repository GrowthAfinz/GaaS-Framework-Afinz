---
tags: [estrategia, report-live, gaas, deck, apresentacao, curadoria]
tipo: estrategia
camada: estrategia
tipo_diataxis: explanation
criado: 2026-09-13
atualizado: 2026-09-15
status: a-validar
fonte: auditoria-pdf-agosto-2026
aliases: [Arquitetura Editorial do Report Live, Arquétipos do Report Live]
---

# Report Live — Arquitetura Editorial

**Definição:** a camada de apresentação do Report Live — os 10 arquétipos de slide que compõem o deck, a régua de comparação padrão, os dois perfis de output e o critério determinístico que decide o que permanece no deck. Não altera motor, certificação nem contrato de imutabilidade.

## Contexto

A homologação de agosto/2026 (run `9bb55892`) entregou um PDF de 57 páginas confiável e auditável — mas otimizado para auditoria, não para leitura. A auditoria página a página encontrou três falhas que se repetem em quase todo bloco:

1. **Zero evolução temporal.** O slide rotulado `time series pacing` é renderizado como tabela de datas. Nenhum gráfico de linha mês a mês existe nas 57 páginas.
2. **Taxonomia crua vazando.** `activity_name` truncado no eixo de gráfico, ilegível.
3. **Escala linear esmagando o funil.** Base acionável de 562.890 e 912 cartões na mesma escala — as três últimas barras desaparecem.

O volume de conteúdo de negócio não é o problema (o anexo técnico é só 7 das 57 páginas). O problema é que esse conteúdo **não vira insight** por falta de memória e de tradução.

## A régua padrão

Toda métrica material passa a ser exibida com quatro elementos: **valor atual · variação contra o período equivalente · série de 6 meses · faixa do próprio histórico**. O veredito só é emitido quando a faixa autoriza.

Três regras que vêm junto:

- Taxa varia em **pontos percentuais**, nunca em %. De 53,8% para 58,6% é +4,8 p.p.
- Antes de falar de taxa, **decompor volume × taxa** — o resultado veio de mais base ou de melhor conversão?
- **Amostra mínima antes de vereditar.** Variação de taxa sobre 93 cartões (Dia) é ruído; a série aparece, o veredito é retido.

> 📊 Por que isso não é enfeite — o CAC da Serasa em agosto caiu 18% contra julho (boa notícia isolada), mas subiu de R$ 2,93 (março) para R$ 7,21, **+146% no semestre**. O delta mensal isolado inverteu o sinal da história. Ver [[Serie-Historica-Aquisicao-Mar-Ago-2026]].

## Os 10 arquétipos

As 57 páginas são dez padrões repetidos. Corrigir o padrão corrige todas as instâncias.

| # | Arquétipo | Alcance | Muda para |
|---|---|---|---|
| 01 | Capa & contrato do snapshot | 1 | Manchete do período; manifesto vira rodapé de uma linha |
| 02 | Leitura executiva | 1 | 1 KPI-âncora com régua + 3 movimentos materiais por delta absoluto |
| 03 | Quality gate / cobertura | 4 | Faixa de chips no rodapé; slide próprio só quando houver bloqueio |
| 04 | Scorecard | 6 | Moeda e percentual formatados, série de 6 meses, máx. 3 métricas |
| 05 | Série temporal / pacing | 3 | Linha acumulada com o período equivalente sobreposto |
| 06 | Breakdown por dimensão | 8 | `group by` canal com share e variação em p.p. (hoje tem bug de grão) |
| 07 | Funil | 6 | Taxa por etapa com série e faixa; absolutos vão para a linha de apoio |
| 08 | Router / ranking | 4 | Tabela de decisão: volume, variação, posição na faixa, profundidade |
| 09 | Tabela analítica de campanhas | 6 | Top-5 decodificado em canal · segmento · oferta |
| 10 | Fila de ação | 8 | 1 slide consolidado com anomalias por regra quando não houver candidata |

Residuais: a dispersão de CAC (eixos sem nome, 26 pontos sem rótulo) sai do perfil executivo; os 7 slides de anexo técnico migram inteiros para o deep dive.

## Compactação: 57 → 31

| Bloco | Hoje | Proposto |
|---|---:|---:|
| CORE | 9 | 5 |
| Parceiro | 27 | 11 |
| Mídia | 7 | 5 |
| B2C | 3 | 1 |
| Condicional | 4 | 2 |
| Anexo | 7 | 7 |
| **Deep dive** | **57** | **31** |
| **Executivo mensal** | — | **12** |

O ganho não vem de cortar governança — o anexo técnico continua inteiro e nunca foi o problema. Vem de trocar **densidade por profundidade**: hoje cada slide de resultado carrega 1 recorte × 1 período; depois, 1 recorte × 6 períodos com faixa.

Contagem do bloco de parceiro: 27 slides (Serasa, Proprietária, Plurix e Bem Barato com 6 cada; Dia com 3 — a regra de materialidade já existe, o limiar é que está frouxo).

## Critério de permanência

Um slide fica no deck se atender pelo menos um de três testes:

1. **Materialidade** — passa o limiar de volume da frente.
2. **Mudança** — o valor saiu da própria faixa histórica.
3. **Ação aberta** — existe recomendação com prazo vigente e dono.

Nada entra por ser uma view que existe. Corolário: **um sinal que se repete por dois ciclos sem outcome sai do deck e vira backlog** — caso real, `TEMPLATE_COVERAGE_LT_80` emitido em julho (23,1%) e agosto (7,5%), piorando, ocupando espaço em dois slides de cada deck. Isso só é possível com [[Report-Live-Loop-de-Outcome]] rodando.

## Precedente interno

A regra de tom já foi validada em [[Deck-Relatorio-Resultados-Arquitetura]]: para público de diretoria, o corpo do slide é fato financeiro; incerteza e diagnóstico vivem no rodapé, nunca competindo com o número principal. A hierarquia de curadoria (capa → sumário → insights em Contexto→Mudança→Causa→Ação → visualizações → recomendações) já está desenhada na skill `storytellingfiltergaas` e nunca foi plugada no Report Live.

## Fonte externa

Regra dos 5 segundos, hierarquia sobre densidade, série temporal como linha e curadoria dirigida por decisão — [5of10 Executive Dashboard Examples](https://5of10.com/articles/executive-dashboard-examples/), [ThoughtSpot Data Storytelling](https://www.thoughtspot.com/data-trends/best-practices/data-storytelling), [Sigma Data Fatigue](https://www.sigmacomputing.com/blog/data-fatigue).

Catálogo visual com print de cada arquétipo e o elemento proposto: https://claude.ai/code/artifact/09c6f6df-e289-4455-9eaf-c9f8f5f180cc

## Relacionado

- [[Report-Live-Enciclopedia]] · [[Report-Live-Sheets-Slides]] · [[Report-Live-Versionamento-e-Publicacao]]
- [[Report-Live-Loop-de-Outcome]] · [[Serie-Historica-Aquisicao-Mar-Ago-2026]] · [[Dimensao-Canonica-de-Parceiro]]
- [[Deck-Relatorio-Resultados-Arquitetura]] · [[Dossie-Mestre-Operacao-CRM-Midia]]
- [[Ficha-Tecnica-Growth-e-Auditoria-Report-Live-2026-09]]

## Implementação candidata — 15/09/2026

- `monthly_report` passa a ser alias de `executivo_mensal`, com 12 slides: 5 core, 4 parceiro, 2 mídia e 1 B2C.
- `deep_dive` seleciona 31 slides: 5 core, 11 parceiro, 5 mídia, 1 B2C, 2 condicionais e 7 anexos. Condicionais ausentes são substituídas pelo próximo slide elegível; slide `omitir_bloqueado` nunca é promovido para completar contagem.
- A geometria deixa de ser coordenada solta no renderer: `layoutGeometryFor()` é o contrato puro compartilhado pelo blueprint e pelo Google Slides, em canvas 720 × 405 pt.
- O contrato de cada gráfico editorial passa a declarar range, séries, eixo, cor e formato numérico. Percentual é `0.0%`, moeda é `R$ #,##0.00` e volume é `#,##0`; o Sheets formata a fonte antes de o gráfico vinculado ser criado.
- `K-VISA`/Copa opt-in sai de novos runs por contrato inativo e não tem mais view nem configuração de gráfico no engine. Histórico e artefatos antigos permanecem preservados.

Estado: código e testes locais concluídos; ainda não equivale a publicação no deck vivo.
