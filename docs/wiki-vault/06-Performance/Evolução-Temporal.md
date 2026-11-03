---
tags: [performance,temporal,aprendizado]
tipo: evidencia
camada: performance
atualizado: 2026-06-10
status: confirmado
fonte: gaas-supabase
---

# Evolução Temporal (escala com CAC controlado)

**Definição:** a trajetória de volume e [[CAC]] dos principais segmentos ao longo das safras — prova de aprendizado em escala.

> 📊 Snapshot 2026-06-08 — segmentos CRM + Abandonados + Base_Proprietaria, set/25–mai/26.

| Safra | Disparos | Cartões | CAC |
|---|---|---|---|
| set/25 | 123 | 87 | R$ 3,44 |
| dez/25 | 257 | 1.511 | R$ 16,09 |
| mar/26 | 505 | 2.647 | R$ 8,37 |
| abr/26 | 619 | 2.470 | R$ 5,62 |
| mai/26 | 546 | 1.930 | R$ 6,67 |

## Leitura
Volume mensal cresceu **~4,4x** (123 → 546 disparos) e, mesmo assim, o CAC **caiu** de R$16 (dez/25) para ~R$6 (abr-mai/26). Escalar sem perder eficiência é a assinatura de uma operação que aprende. Também evidencia **recorrência** — jornadas repetem por [[Safra]], o que torna a operação previsível e orquestrável.

## Leitura granular (cohort por safra — via [[Views-Performance]])
> 📊 Snapshot 2026-06-10 — `vw_performance_bu_segmento_safra`, segmento Abandonados.

| Safra | Abandonados B2C (CAC / conv) | Abandonados Plurix (CAC / conv) |
|---|---|---|
| 2026-02 | R$ 9,32 / 2,7% | R$ 27,70 / 1,5% |
| 2026-03 | **R$ 2,79 / 9,7%** | R$ 6,60 / 6,4% |
| 2026-04 | R$ 3,74 / 8,2% | R$ 7,41 / 5,7% |
| 2026-05 | R$ 5,34 / 6,1% | R$ 6,67 / 6,2% |

A virada de **fev→mar/26** (CAC ÷3, conversão ×3,6 nos dois BUs simultaneamente) é o maior salto de eficiência da série — candidata a causa estrutural (oferta/régua/qualidade de base), não sazonal. Vale investigar o que mudou na operação em março e replicar.

## Relacionado
- [[Safra]] · [[CAC-Ótimo]] · [[Orquestrador]] · [[Views-Performance]]
