---
tags: [gaas,ia,recomendacao]
tipo: operacao
camada: operacao
atualizado: 2026-06-08
status: legado
fonte: gaas-supabase
status_original: confirmado
legado_desde: 2026-10-29
---

# Orientador (Motor de Recomendação)

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver o app atual e o [[00-Indice/MOC-Operacao|MOC de operação]].

**Definição:** o motor que pontua e ranqueia combinações de campanha por histórico, recomendando o que tende a performar.

## Como funciona
Agrupa [[activities]] por **combo** (`BU+Canal+Oferta+Segmento+Promo...`) e calcula um score 0-100 = 40% CAC + 40% conversão + 20% volume (confiança). Roda no front-end, em memória (recalculado a cada render) — o score **não** é persistido hoje.

## ⚠️ Ponto crítico
A fórmula de CAC do score usa baseline antiga (faixa R$60-150), mas o [[CAC]] real da operação é ~R$10-18 → o score quase não discrimina na faixa atual. **Recalibrar antes de persistir.** Ver [[Decisões-Abertas]].

## Duas chaves, dois propósitos
- **Combo** (Orientador) → *qual combinação converte melhor*.
- **Campanha-safra** ([[Campanha]]) → *quais campanhas existem e como performaram*.
São complementares — ver [[Roadmap-Framework|Fase 0]].

## Relacionado
- [[paid_media_insights]] · [[Orquestrador]] · [[Roadmap-Framework]] · [[CAC]]
