---
tags: [estrategia,experimentacao,pesquisa,aprendizados]
tipo: estrategia
camada: estrategia
atualizado: 2026-06-10
status: confirmado
fonte: pesquisa-externa
---

# Sistema de Experimentação — Referências e Modelo

**Definição:** o insumo de pesquisa e a validação retroativa que fundamentam a spec SDD do novo **gestor de experimentos** (kanban warehouse-native sobre `activities`), berço da camada de [[Diário-de-Bordo|aprendizados validados]].

## Benchmarks (pesquisa 2026-06-10)
| Referência | Lição central |
|---|---|
| **Booking.com** (~25k testes/ano) | o ativo é o **repositório pesquisável de todos os experimentos — inclusive fracassados** — com hipótese, iterações e decisão; nada se apaga; memória institucional é o produto |
| **iFood** (plataforma interna "Faster") | experimentação só escala **conectada a audiência + dados + execução** no mesmo lugar — não é quadro ao lado do sistema, é o sistema |
| **Processo GrowthHackers/Sean Ellis** (escola Méliuz) | backlog de ideias → priorização **ICE** (Impact×Confidence×Ease) → cadência semanal → aprendizado documentado. *Caso Méliuz específico não documentado publicamente.* |
| **Eppo / GrowthBook** | padrão **warehouse-native**: experimento definido sobre o warehouse, métricas em SQL reutilizável, zero número digitado. UX: progresso de amostra até significância, badges de decisão, métricas guardrail |

## Os 6 princípios do nosso sistema
1. **Warehouse-native à nossa moda** — warehouse = Supabase; métricas = [[Views-Performance|views ponderadas]]; experimento aponta para dados, nunca digita.
2. **Activity_name é a unidade de randomização** — `experiment_activities (experiment_id, activity_name, grupo)` + regra de auto-attach.
3. **Repositório Booking-style** — refutado é cidadão de 1ª classe; busca por campanha-tipo/segmento/canal/oferta; gera as notas de aprendizado.
4. **Kanban simples, card rico** — 3 colunas (`Backlog → Rodando → Concluído`), decisão como badge; ICE ordena o backlog; sparkline, progresso de significância e guardrails no card.
5. **Owner por login** — `profiles` (7 usuários); aprendizado assinado.
6. **IA nas costuras** — sugere hipóteses (Orientador/anomalias), detecta candidatos pela taxonomia, redige o aprendizado; nunca inventa número.

## Validação retroativa do modelo (dados reais)
**Caso 1 — Vibe como oferta (desde 2025-03):** em fev/2026, Carrinho B2C WhatsApp rodou **Vibe 8,42% × Padrao 0,49%** de conversão lado a lado — um A/B natural já presente nos dados, representável como `grupo=variante (Oferta+Promocional=Vibe+Padrao)` × `grupo=controle (Oferta+Promocional=Padrao+Padrao)`. **⚠️ Regra crítica: a chave de intenção de oferta é sempre o par composto (Oferta, Promocional) — nunca Oferta isolada.** No [[Upgrade]], Vibe foi caro (CAC R$ 885 em 2025-05 → R$ 155 em 2025-06) — exatamente o tipo de aprendizado que hoje está invisível.

**Caso 2 — a virada de mar/26 no [[Carrinho-Abandonado]] (provável causa encontrada):** mesma oferta (Vibe+Padrao), mesmo subgrupo núcleo (Diario), mas em março (a) surgem os **subgrupos de recência** `Abandonados D-7` e `D-21 A D>7` separados do Diario, e (b) WhatsApp Diario salta 8,42%→**24,05%** e SMS 0,71%→6,75%, com base ~2x. Leitura: a **estratificação por recência** isolou o público fresco (alta conversão) do envelhecido (D-21 converte 0,04%) e a operação escalou no núcleo. Era um "experimento natural" sem registro — o sistema deve suportar **experimentos retroativos** criados a partir de quebras detectadas.

> 📊 Snapshot 2026-06-10. Conclusão: o modelo representa os dois casos. ✅

## Requisitos derivados da validação
1. Auto-attach por **regra multi-dimensão** (segmento+safra+canal+oferta), não só pattern de activity_name — a taxonomia nem sempre codifica a oferta.
2. Atribuição de **grupo por atributo** (ex.: `Oferta=Vibe`→variante) além de seleção manual.
3. **Estratificar comparações por canal** (WhatsApp 8,4% vs SMS 0,7% no mesmo grupo — misturar canais destrói a leitura).
4. Suporte a **experimento retroativo** (importar quebras históricas com data de início/fim).
5. Guardrails padrão dependem da [[Metas-e-CAC|economia do negócio]] — lacuna a resolver.

## Decisões de UX confirmadas (2026-06-10)
| Pergunta | Resposta |
|----------|----------|
| Onde nasce a hipótese? | Dentro da própria tela de Experimentos |
| Cadência de revisão | Semanal |
| Card em 3 segundos | Delta de conv. + progresso de amostra + ICE badge + owner |
| Critério de "Validado" | Z-test bicaudal α=0,05, poder=80%; badge automático, confirmação manual do operador |
| Quem usa | Pablo (owner criador) + analistas (leitura e consulta) |

**Spec completa:** `calendar-estrategico/docs/SDD_EXPERIMENTOS_KANBAN.md`

## Relacionado
- [[Diário-de-Bordo]] · [[Views-Performance]] · [[Evolução-Temporal]] · [[Carrinho-Abandonado]] · [[Upgrade]] · [[Vibe]] · [[Orientador]] · [[Experimento]] · [[Decisões-Abertas]]
