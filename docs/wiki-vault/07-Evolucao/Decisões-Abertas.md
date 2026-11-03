---
tags: [evolucao,decisao]
tipo: evolucao
camada: evolucao
atualizado: 2026-11-03
status: a-validar
fonte: gaas-supabase
---

# Decisões Abertas

**Definição:** as escolhas pendentes que travam ou desviam a evolução. Manter vivo.

## Abertas
1. **[[campaign_context]] estender ou substituir?** Risco de duplicar com `orchestrator_campaigns` e o `campaign_templates` do doc Miro — unificar antes de criar.
2. **Acesso a dado individual (CPF/SFMC)?** Anti-overlap real e personalização dependem disso; hoje só há agregado. Decide o teto da [[Roadmap-Framework|Fase 3]].
3. **Recalibrar o score do [[Orientador]]** para a faixa de CAC real antes de persistir.
4. **Persistir score/insights?** Só na Fase 2, espelhando [[paid_media_insights]].
5. **Owners e rito de governança** do framework — quem mantém a [[Ontologia-v2]].
6. **Deep link real no app** — SDK AppsFlyer + UDL implementados? Sem isso `deep_link_value=pedido_cartao` não roteia ([[AppsFlyer-Tracking-CRM]]). Depende do time de dev/app.
7. **OneLinks por canal restantes** (sms, email, push, meta_ads, google_ads) — criar no painel e colar na planilha geradora.
8. **Postback de eventos** `account_created`/`account_approved` para Meta/Google otimizarem — integração de eventos in-app/S2S no AppsFlyer.
9. **Tabela-mestre de links de atribuição** — virar entidade no Supabase (canal, campanha, segmento, template, link, owner, status) ou ficar na planilha?
10. **Dois catálogos de skill divergentes** — `09-Inteligencia-IA/Skills-do-Projeto.md` (parado em 08/06, não lista `gaas-insight-engine` nem várias skills do repositório) vs `08-Engenharia/Skills-e-Disponibilidade-por-IA.md` (08/07, inventário completo por onde cada skill roda — Claude Code/Cowork/Codex). Decidir: aposentar o primeiro com link para o segundo, ou manter os dois com escopos explicitamente diferentes?
11. **`AFINZ_GAAS_ONTOLOGY.md` pode ter cruzado o gatilho de 120k tokens.** 272.878 caracteres em 20/06 (≈75-90k tokens estimados); 409.281 caracteres em 12/08 (+~50%). Rodar `scripts/bundle_vault.py` e conferir a contagem real contra a tabela de [[Estrategia-de-Contexto]] (decisão D-2 do [[ADR-001]]) — se cruzou 120k, é hora de compilar sub-índices por camada.
12. **Contagem de RLS desabilitado desatualizada.** [[Governança-de-Dados]] registra 11 tabelas (snapshot 08/06); o advisor do Supabase contou 13 em 12/08 (prováveis novas: `crm_insights`, tabelas da Copa 2026). Atualizar a nota e decidir se a Fase 2 (escrita automatizada) já está próxima o suficiente pra tratar isso como bloqueador ativo, não só risco futuro.
13. **Notas de dimensão sem reidratar há ~2 meses.** `Parceiros`, `Segmentos`, `BUs`, `Canais`, `Ofertas` têm snapshot de 06-08/06-10 contra a cadência de 2x/semana definida em [[Reidratacao-Alerts-Vivo]]. Números já divergem visivelmente do Supabase ao vivo (ex.: `activities` foi de ~4.600 para 6.637 linhas no período). Rodar o [[Runbook-Vault-Vivo]] quando houver janela.

> Itens 10-13 vieram de uma sessão de reconciliação vault ↔ Supabase ↔ `.claude/skills` em 12/08/2026 (Claude/Cowork), a pedido do Pablo. Registrados, não resolvidos — nenhuma nota de dimensão foi alterada nesta sessão além desta.

14. **Vai de Visa — atraso em qualquer conta exclui o CPF?** Regra aplicada em 03/11/2026, fora da spec da gestora; impacto pequeno (~50 CPFs). Confirmar com a gestora ([[DE-VDV_APTOS]]).
15. **Vai de Visa — 79 mil ativos com limite < R$ 200.** Ficam sem comunicação; avaliar mensagem sem oferta (lembrete de fatura, liberar limite) ([[Iniciativa-Pool-de-Ofertas-Vai-de-Visa]]).
16. ~~Vai de Visa — conteúdo genérico~~ → resolvido em 03/11/2026: Movida, Alura, Oceane no 1º teste ([[DE-BRIEFING_OFERTAS_VISA]]).
17. **Vai de Visa — WhatsApp entra na onda 1?** E qual o nome da jornada (`JOR_RENT_POOL_OFERTAS_VAIDEVISA` proposto).
18. **Vai de Visa — medição pela Visa.** Pedir dado de resgate por oferta/cupom no formato do `copa_visa_daily`, em vez de cruzar nome de estabelecimento ([[Teste-Afinidade-MCC-vs-Generico]]).
19. **MAPA_MCC na fonte (IN):** quantidade em 6 meses, regra de parcela/estorno e datas `yyyy-MM-dd` ([[DE-MAPA_MCC]]).
20. **Eixo cliente novo × maduro (`DATA_ABERTURA_CONTA`)** — adiado por decisão do Pablo em 03/11/2026; retomar depois da primeira onda.

21. **Vai de Visa — controle perene ou por safra?** Implementado com código fixo (permite perene); confirmar com a gestão antes da 2ª safra.
22. **Vai de Visa — compra em safras sobrepostas.** Proposta: última safra recebida + leitura mensal do programa contra o controle perene.
23. **Vai de Visa — import automático do arquivo da IN.** Passo `IMP_VDV_01` fora da automação; atualização no SFTP não é capturada até entrar ([[Automacao-VDV-Pool-de-Ofertas]]).
24. **Vai de Visa — FAMILIA_PRESENTES fica no teste?** Depende do tamanho medido na etapa APTOS do funil.

> Itens 14-20 vieram do planejamento do Pool de Ofertas - Vai de Visa em 03/11/2026 (Claude/Cowork, com o Pablo).

## Relacionado
- [[Orquestrador]] · [[Governança-de-Dados]] · [[Roadmap-Framework]]
