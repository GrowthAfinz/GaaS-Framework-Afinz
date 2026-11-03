---
tags: [conceito,chave,governanca]
tipo: conceito
camada: negocio
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Taxonomia (Activity Name)

**Definição:** o padrão de nomenclatura que identifica unicamente cada [[Disparo]] e codifica seus atributos no próprio nome.

## Contexto
Dois níveis:
- **Activity Name:** `BU_CAMP_JORNADA_ORD_SAFRA` (ex.: `afz_aqs_boa_reg_cart_email_rfvchurn1_diario`).
- **Jornada:** `JOR_ETAPA_BU_PARCEIRO_SEGMENTO_ETAPA_OFERTA_PROMO_SAFRA`.

É o **ativo escondido mais valioso** da operação: por ser parseável, permite derivar [[Campanha]], [[Jornada]] e [[Safra]] sem campos extras. É a espinha que conecta tudo. Erros de grafia aqui quebram análise — ver [[Inconsistências-a-Corrigir]].

## Relacionado
- [[Disparo]] · [[Jornada]] · [[Campanha]] · [[Ontologia-v2]]
