---
tags: [ia, vault-vivo, alertas, operacao]
tipo: referencia
camada: inteligencia
status: ativo
frequencia: 2x por semana
atualizado: 2026-08-03
---

# Reidratação Alerts — Vault Vivo

**Definição:** registro contínuo de alertas críticos detectados pela reidratação automática. Atualiza 2x por semana (seg + qui). Informação crua para decisão rápida.

> 📊 Snapshot 2026-08-03 — 3 achados críticos, 1 oportunidade.

## 🚨 CRÍTICO #1: Taxa de Conversão — Possível Bug

**Dados defasados:** Negados 84,2% (era 16,7%), Leads_Parceiros 95,3% (era 8,9%), Base_Proprietaria 60,1% (era 2,6%).

**Diagnóstico:** Fórmula pode estar calculando `cartões/cartões` ao invés de `cartões/base_acionavel`.

**Impacto:** Prioridades de segmento estão erradas. Recomendações do [[Orientador]] podem estar enviesadas.

**Query de validação:**
```sql
SELECT "Segmento", "Taxa de Conversão", "Cartões Gerados", "Base_acionavel", count(*)
FROM activities 
WHERE "Segmento" IN ('Negados', 'Leads_Parceiros', 'Base_Proprietaria')
GROUP BY "Segmento", "Taxa de Conversão", "Cartões Gerados", "Base_acionavel"
LIMIT 20;
```

**Status:** A-INVESTIGAR · Bloqueador de decisão

---

## 🚨 CRÍTICO #2: CAC/Conversão por Canal — Salto Estrutural

**Mudanças detectadas:**

| Canal | Jun | Ago | Delta Conversão | Delta CAC |
|---|---|---|---|---|
| E-mail | 3,4% | 6,5% | +92% | +12,6% |
| WhatsApp | 7,3% | 1,4% | **-81%** | **+169%** |
| SMS | 6,5% | 0,5% | **-92%** | **+107%** |

**Diagnóstico:** Não é gradual = provável mudança de base/filtro. Possibilidades:
1. Filtro `Etapa de aquisição` está capturando dataset novo
2. Re-ingestão com critério diferente
3. Mix de segmentos mudou (mais meio-de-funil, menos aquisição fria)

**Impacto:** Recomendações de canal estão erradas. CAC-Ótimo não é comparável com baseline.

**Query de validação:**
```sql
SELECT "Etapa de aquisição", count(*) disparos, round(avg("Taxa de Conversão"),3) conv, round(avg("CAC"),2) cac
FROM activities 
WHERE "Data de Disparo" >= '2026-06-10' 
GROUP BY "Etapa de aquisição" 
ORDER BY disparos DESC;
```

**Status:** A-INVESTIGAR · Bloqueador de otimização de canal

---

## ⚠️ ATENÇÃO: Meta Eficiência em Queda

**Dados:** Meta spend +19,4% (R$ 132k → R$ 157k) mas conversões +9,2% apenas (88k → 96k).

**Interpretação:** Spend cresceu 2x mais rápido que retorno = ROI piorando.

**Oportunidade:** Google mantém flat mas é 3,6x mais barato em CPC (R$ 0,20 vs R$ 0,73).

**Ação:** Considerar rebalancear — frear Meta, aumentar Google.

**Status:** AÇÃO-RECOMENDADA · Otimizar allocation

---

## ✅ BOM: Volume +35%, Abandonados é Ouro

**Crescimento:** Disparos 4.606 → 6.216 (+35%). Base de aprendizado ampliou.

**Oportunidade:** Abandonados agora é maior segmento (3.589 disparos) com CAC R$ 6,95 (mais barato que CRM R$ 10,76).

**Ação:** Priorizar Abandonados na próxima safra.

**Status:** PRONTO · Planejamento de orçamento

---

## 📋 Status de Ações

| # | Item | Status | Prazo | Responsável |
|---|---|---|---|---|
| 1 | Taxa de Conversão | A-INVESTIGAR | HOJE | Pablo |
| 2 | CAC/Conversão por Canal | A-INVESTIGAR | HOJE | Pablo |
| 3 | Meta vs Google Allocation | AÇÃO-RECOMENDADA | Esta semana | Optim Team |
| 4 | Abandonados Strategy | PRONTO | Próx safra | Pablo |

---

## 🔄 Cadência

**Frequência:** 2x por semana (segunda + quinta)
**Última execução:** 2026-08-03
**Próxima:** 2026-08-06 (quinta)
**Delta crítico:** >15% em CAC ou conversão = notificação imediata

---

## Relacionado

- [[Runbook-Vault-Vivo]] · [[CAC-por-Canal]] · [[Performance-por-Segmento]] · [[CPA-por-Plataforma]] · [[Orientador]] · [[Função-Objetivo]]

