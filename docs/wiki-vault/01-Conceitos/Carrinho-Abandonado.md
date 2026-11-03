---
tags: [conceito,campanha-tipo,meio-funil]
tipo: conceito
camada: negocio
atualizado: 2026-06-10
status: confirmado
fonte: gaas-supabase
---

# Carrinho Abandonado (campanha-tipo)

**Definição:** a **campanha-tipo de recuperação imediata** — reabordar quem **iniciou o pedido e parou no meio** (abandono do fluxo/ECRED).

## A chave (como aparece em cada camada)
| Camada | Valor |
|---|---|
| CRM (B2C e Plurix) | Segmento `Abandonados` (subgrupos `Diario`, `Abandonados D-7`) |
| Relatório diarizado | bloco `CARRINHO ABANDONADO B2C/PLURIX` |
| Taxonomia SFMC | journeys `*_ABD` (usam `_aqs_` mas são reativação — [[Inconsistências-a-Corrigir|incongruência 8]]); finalizados via ECRED fora do SFMC |
| Meta hoje | `AFINZ_Abandonados_B2C_10_07_2025` — **única e congelada há 11 meses** |
| Audiência proposta | `crm_b2c_carrinho_daily` · `crm_plurix_carrinho_daily` |
| AppsFlyer | `af_adset=abandonados` |

## Performance e canais
> 📊 Snapshot 2026-06-10. **O maior ativo da operação**: 2.409 disparos, CAC R$ 4,83 (melhor relação), conversão 6,1%. Núcleo absoluto: **WhatsApp** (1.893 disparos/5.147 cartões) + SMS; Push só aqui (102 disparos/3 cartões). **Lacunas: E-mail = zero disparos** e retargeting pago morto.

## Papel na rede
Recência é tudo: o valor do público decai por dia — é o caso de uso **mais forte** do [[Ativacao-de-Audiencias-Diaria|pipeline diário]] (audiência D-1 no Meta enquanto o SFMC trabalha WPP/SMS). A virada de eficiência de mar/26 ([[Evolução-Temporal]]) aconteceu majoritariamente neste bloco.

## Relacionado
- [[Plataformas-de-Comunicação]] · [[Topo-de-Funil]] · [[Segmentos]] · [[Subgrupos]] · [[Evolução-Temporal]] · [[Ativacao-de-Audiencias-Diaria]] · [[Anti-Overlap-Pressão-de-Contato]]
