---
tags: [conceito,midia,atribuicao]
tipo: conceito
camada: negocio
atualizado: 2026-06-08
status: inferência
fonte: gaas-supabase
---

# Spend-to-Card (investimento → cartão)

**Definição:** a metodologia que liga **reais investidos em [[Mídia-Paga]]** ao **cartão emitido** — a única leitura que torna mídia comparável ao [[CAC]] do CRM.

## Como funciona
1. [[paid_media_metrics]] dá spend por campanha/dia.
2. [[paid_media_campaign_mappings]] classifica cada campanha por **objetivo de negócio** (marca, b2c, plurix, seguros, aquisicao, rentabilizacao).
3. A originação atribuível vem de [[b2c_daily_metrics]] (emissões diárias) e do canal Serasa.
4. A correlação spend↔emissão é exibida na [[Mídia-Analytics]] e gera [[paid_media_insights]].

> ⚠️ A atribuição é **correlacional**, não determinística (não há tracking 1:1 anúncio→CPF). Tratar como sinal direcional, não verdade contábil. `status: inferência` até validação de modelo de atribuição.

## Por que importa
Sem essa ponte, mídia e CRM são silos: a mídia otimiza CPA de plataforma (R$ ~1) e o CRM otimiza CAC de cartão (R$ ~18), sem linguagem comum. O spend-to-card é o que permite alocar budget por **rentabilidade de aquisição**, não por CPA isolado — conecta-se à [[Função-Objetivo]].

## Relacionado
- [[Mídia-Paga]] · [[paid_media_campaign_mappings]] · [[b2c_daily_metrics]] · [[Mídia-Analytics]] · [[CAC-Ótimo]]
