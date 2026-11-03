---
tags: [supabase,tabela,comunicacoes]
tipo: entidade
camada: dados
atualizado: 2026-08-12
status: confirmado
fonte: gaas-supabase
---

# Tabela: communication_slots

**Definição:** a posição governada de uma peça dentro de uma jornada (`journey_name` + `activity_name` + `channel`), com status de ciclo de vida e o `current_template_id` que a preenche — quando existe.

## Contexto

É a camada de cobertura: para cada slot (uma peça esperada numa jornada), marca se já existe template vinculado (`coverage_status`). A imensa maioria ainda não tem — ver snapshot abaixo. É alimentada pela `gaas-governanca-comunicacoes` a partir da planilha de governança de links/templates, cruzando `activity_name` (chave em [[activities]]) com `template_id` (chave em [[communication_templates]]).

`lifecycle_status` hoje é uniformemente `candidate` — nenhum slot chegou a outro estágio do ciclo de vida ainda nos dados vistos; os demais valores possíveis do enum não estão documentados nesta nota (conferir schema/código do módulo Comunicações se precisar deles).

> 📊 Snapshot 2026-08-12 — 115 slots, **113 `unmapped`** e apenas **2 `ready`** (~98% de lacuna de cobertura). Por canal: 56 E-mail, 47 WhatsApp, 7 Push, 5 SMS. Boa parte concentrada na jornada `JOR_AQUISICAO_B2C_CARRINHO_AQUISICAO_COPA_PAD_26` (Copa 2026).

## Relacionado

- [[communication_templates]] · [[Galeria-de-Templates]] · [[activities]] · [[Taxonomia-Activity-Name]] · [[Decisões-Abertas]]
