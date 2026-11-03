---
tags: [gaas,ingestao,governanca]
tipo: operacao
camada: operacao
atualizado: 2026-06-08
status: legado
fonte: gaas-supabase
status_original: confirmado
legado_desde: 2026-10-29
---

# Ingestão de Dados (GaaS Updater)

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver o app atual e o [[00-Indice/MOC-Operacao|MOC de operação]].

**Definição:** o fluxo que traz resultados de campanha para o Supabase com **validação humana** — não importação cega.

## Como funciona
O usuário cola/sobe dados → o sistema detecta blocos, compara com histórico, gera **candidatos** com `confidence` e `suggestion` → humano revisa o que está abaixo do limiar → aplica. Tabelas: [[gaas_update_runs]] + gaas_update_candidates.

## Por que importa
Esse padrão (confiança + revisão) é **metade de um orquestrador já pronta**, mas apontada para trás. O [[Orquestrador]] reaproveita exatamente essa UX para propor disparos para frente. Mesma lógica do [[Template|template_id]] (inferência <80% → fila de revisão).

## Relacionado
- [[gaas_update_runs]] · [[Orquestrador]] · [[Template]]
