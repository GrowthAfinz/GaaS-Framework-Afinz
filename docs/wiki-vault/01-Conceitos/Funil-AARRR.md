---
tags: [conceito,funil,framework]
tipo: conceito
camada: negocio
atualizado: 2026-06-08
status: inferência
fonte: gaas-supabase
---

# Funil AARRR (Estratégia de Ativação)

**Definição:** o ciclo de vida do lead na aquisição, herdado do [[Framework-v1-Diretor|v1 do diretor]]: **Aquisição → Carrinho Abandonado → Reativação → Quarentena**.

## Contexto
Cada etapa tem objetivo, trigger, público, requisitos e canais próprios:
- **Aquisição:** primeira oferta a leads elegíveis (públicos: CRM, Leads_Parceiros, Base_Proprietaria).
- **Carrinho Abandonado:** acelerar oportunidade (públicos: Abandonados, Aprovados_nao_convertidos).
- **Reativação:** reaquecer leads sem resposta em 15 dias (Negados, Recência de Compra).
- **Quarentena:** descanso forçado após N ações sem resposta (Instabilidade).

> ⚠️ O mapeamento etapa→segmento acima é parcialmente **inferência** a partir dos nomes — a validar com o time.

## Relacionado
- [[Etapa-de-Aquisição]] · [[Segmentos]] · [[Framework-v1-Diretor]] · [[Lead]]
