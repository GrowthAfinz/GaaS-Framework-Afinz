---
tags: [gaas,aba,analise,funil]
tipo: operacao
camada: operacao
atualizado: 2026-06-08
status: legado
fonte: gaas-supabase
status_original: confirmado
legado_desde: 2026-10-29
---

# Aba: Jornada & Disparos

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver o app atual e o [[00-Indice/MOC-Operacao|MOC de operação]].

**Definição:** a aba de **análise de funil e detecção de anomalias** — lê o fato diário ([[gaas_dinamica_bi_metrics]]) e monta o funil ponta a ponta por jornada, com tendência de gargalos.

## O que entrega
- Funil entrega→abertura→clique→proposta→aprovação→conversão (ver [[Funil-de-Aquisição]]).
- Detecção de gargalo e sua tendência ao longo do tempo (`useConversionFunnel`, `useBottleneckTrend`).
- Drill-down por dia/jornada (componente `JornadaDisparosView`, modo `diario`/`semanal`).

## Por que importa
É onde a operação enxerga **onde o funil quebra** — capacidade que planilha não dava. O gargalo da aquisição fria está no topo (abertura ~9%) e na proposta; aprovação é alta (~58%). Ver [[Funil-de-Aquisição]].

## Relacionado
- [[WhatsApp-Respostas-de-Opt-out]] — significado da resposta ao botão “Não tenho interesse agora” e melhorias propostas para acompanhamento.
- [[gaas_dinamica_bi_metrics]] · [[Funil-de-Aquisição]] · [[Etapa-de-Aquisição]] · [[GaaS-9-Áreas]] · [[Resultados]]
