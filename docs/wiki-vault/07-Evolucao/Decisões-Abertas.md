---
tags: [evolucao,decisao]
tipo: evolucao
camada: evolucao
atualizado: 2026-11-09
status: a-validar
fonte: gaas-supabase
---

# Decisões Abertas

**Definição:** as escolhas pendentes que travam ou desviam a evolução. Manter vivo.

## Abertas
1. **[[campaign_context]] estender ou substituir?** Risco de duplicar com `orchestrator_campaigns` e o `campaign_templates` do doc Miro — unificar antes de criar.
2. **Acesso a dado individual (CPF/SFMC)?** Anti-overlap real e personalização dependem disso; hoje só há agregado. Decide o teto da [[Roadmap-Framework|Fase 3]].
3. **Recalibrar o score do [[Orientador]]** para a faixa de CAC real antes de persistir. Em 05/11/2026 virou a tarefa `CONF-ORIENTADOR-CALIBRAR` (calibração por faixa e limite por canal), em [[Backlog-Confiabilidade-Agentes-e-Vault-2026-11]].
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

> Itens 10-13 vieram de uma sessão de reconciliação vault ↔ Supabase ↔ `.claude/skills` em 12/08/2026 (Claude/Cowork), a pedido da operação. Registrados, não resolvidos — nenhuma nota de dimensão foi alterada nesta sessão além desta.

14. **Vai de Visa — atraso em qualquer conta exclui o CPF?** Regra aplicada em 03/11/2026, fora da spec da gestora; impacto pequeno (~50 CPFs). Confirmar com a gestora ([[DE-VDV_APTOS]]).
15. **Vai de Visa — 79 mil ativos com limite < R$ 200.** Ficam sem comunicação; avaliar mensagem sem oferta (lembrete de fatura, liberar limite) ([[Iniciativa-Pool-de-Ofertas-Vai-de-Visa]]).
16. ~~Vai de Visa — conteúdo genérico~~ → resolvido em 03/11/2026: Movida, Alura, Oceane no 1º teste ([[DE-BRIEFING_OFERTAS_VISA]]).
17. **Vai de Visa — WhatsApp entra na onda 1?** E qual o nome da jornada (`JOR_RENT_POOL_OFERTAS_VAIDEVISA` proposto).
18. **Vai de Visa — medição pela Visa.** Pedir dado de resgate por oferta/cupom no formato do `copa_visa_daily`, em vez de cruzar nome de estabelecimento ([[Teste-Afinidade-MCC-vs-Generico]]).
19. **MAPA_MCC na fonte (IN):** quantidade em 6 meses, regra de parcela/estorno e datas `yyyy-MM-dd` ([[DE-MAPA_MCC]]).
20. **Eixo cliente novo × maduro (`DATA_ABERTURA_CONTA`)** — adiado por decisão da operação em 03/11/2026; retomar depois da primeira onda.

21. **Vai de Visa — controle perene ou por safra?** Implementado com código fixo (permite perene); confirmar com a gestão antes da 2ª safra.
22. **Vai de Visa — compra em safras sobrepostas.** Proposta: última safra recebida + leitura mensal do programa contra o controle perene.
23. **Vai de Visa — import automático do arquivo da IN.** Passo `IMP_VDV_01` fora da automação; atualização no SFTP não é capturada até entrar ([[Automacao-VDV-Pool-de-Ofertas]]).
24. **Vai de Visa — FAMILIA_PRESENTES fica no teste?** Depende do tamanho medido na etapa APTOS do funil.

> Itens 14-20 vieram do planejamento do Pool de Ofertas - Vai de Visa em 03/11/2026 (Claude/Cowork, com o operação).

25. **Vai de Visa — divisão das posições da vitrine:** 2 do grupo + 1 descoberta (como no SQL, com template de 3 cards) ou 3 do grupo quando houver oferta suficiente? ([[Rotacao-de-Ofertas-Vai-de-Visa]])
26. **Vai de Visa — E-mail 1 e E-mail 2 alternam por disparo?** Define se são duas automações agendadas, uma por dia da semana ([[Automacao-VDV-Pool-de-Ofertas]]).
27. **Vai de Visa — coluna `DESTAQUE` para pedido comercial da Visa?** Poria a oferta na posição 1 de todos os grupos.
28. **Vai de Visa — novos aptos entram a cada disparo?** Proposto no SQL (Q5 só acrescenta CPF novo na safra).
29. **Vai de Visa — MID da BU do SFMC** onde o Pool opera (BU pai "Banco Afinz" por inferência) — registrar.

> Itens 25-29 vieram do desenho da rotação e da automação de disparo em 05/11/2026 (Claude, com o operação).

## Atualização das pendências do Pool Visa · 09/11/2026

O registro 28 (entrada de novos elegíveis) está consolidado: SAFRA acumula novos CPF+safra; APTOS permanece dinâmica. O item 25 é especificado no SQL atual: até duas próprias + descoberta, com complementação. Mudanças posteriores na composição exigem nova decisão. Não manter esses dois pontos como impedimento à montagem já definida.

O item 26 não exige mais duas automações imediatas: dias/horários e alternância de V1/V2 continuam abertos, com envio futuro. O item 23 segue pendente quanto à cadência/responsável do SFTP; não inserir import automático como se estivesse comprovado. O histórico anterior permanece datado acima.

Permanecem abertos: primeira execução dos seis passos e FUNIL final; adaptação do template/exportador às duas versões e POOL; seedlist V1/V2; origem do nome do cartão e prioridade comercial de múltiplos parceiros; imagens/links; supressões; relógio do tenant; proteção contra repetir o mesmo send; JobID↔rodada/toque; contrato de medição recorrente/controle; MID e cadência IN. Questão, impacto e evidência estão em [[Estrategia-Pool-de-Ofertas-Visa]]. Nenhum desses pontos recebe aprovação por esta proposta editorial.

## Relacionado
- [[Orquestrador]] · [[Governança-de-Dados]] · [[Roadmap-Framework]]


## 3. Canais e política de seleção

E-mail, WhatsApp e SMS são canais principais da estratégia. O piloto separa parcelas sem sobreposição: cada CPF recebe no máximo um canal do Pool na mesma rodada. SEG-C e GEN-C ficam sem comunicação nos três canais. A alocação de grupo/célula permanece congelada na SAFRA; GEN-A usa a vitrine genérica, mas não representa comparação causal direta com SEG-B de outra população.

| Canal | Aptidão própria | Destino | Teto por rodada de envio |
|---|---|---|---|
| E-mail | Endereço disponível, sem bloqueio de e-mail, supressões/publication list e status de assinante conferidos | Links de oferta; CTAs finais a conferir | Orçamento e capacidade a definir |
| WhatsApp | Contato móvel, bloqueios/supressões próprios liberados e uso do app nos últimos 60 dias | LP personalizada da rodada | Até 5.000 mensagens |
| SMS | Contato móvel, bloqueios/supressões próprios liberados e uso do app nos últimos 60 dias | LP personalizada da rodada | Até 100.000 SMS |

Os tetos valem por rodada, sujeitos à elegibilidade e ao orçamento. Não são metas nem limites semanais. No SMS, destinatários, tentativas, reenvios e unidades faturadas/segmentos podem divergir: registrar cada unidade separadamente.

ULTIMO_ACESSO da CLIENTES ATIVOS é a referência de uso do app para os dois canais móveis. Normalizar a data para America/Sao_Paulo e comparar de hoje menos 60 dias até hoje, inclusive. Data inválida, ausente ou futura impede apenas a seleção móvel. O participante permanece na SAFRA e pode receber e-mail se elegível. DEVICE, modelo de aparelho e data de cadastro/importação não entram nesta regra. Usar o app não comprova uso de WhatsApp.

Permissões de uso/consentimentos dos canais foram confirmadas na definição do piloto. A execução continua respeitando os bloqueios e as supressões próprios: bloqueio de e-mail não é bloqueio de celular, e a consulta _Subscribers não pode excluir toda a audiência móvel.

:::details Sorteio, perfis e parâmetros pendentes
Sortear dentro de perfis relevantes, com grupo/célula, B2C/B2B2C e recência quando a fonte permitir. Aplicar a mesma política e probabilidade a SEG-A e SEG-B. Não priorizar maiores compradores no WhatsApp e interpretar o SMS residual como efeito do canal.

Pesos, cotas por perfil, tamanho da amostra, poder estatístico e pressão por pessoa seguem em aberto. O contrato usa ID_POLITICA_CANAL e ID_RODADA para identificar a regra; sem parâmetros aprovados, a simulação retorna “parâmetros pendentes” e não produz audiência. O módulo de simulação do GaaS não executa seleção no SFMC.

Evitar redistribuir silenciosamente participantes inelegíveis para preencher teto. Guardar a política, elegibilidade e contagens de cada perfil para interpretar diferenças de cobertura. A seleção de um CPF em um canal exclui os outros naquela rodada; rodadas futuras precisam respeitar a política de pressão ainda a definir.
:::

### Delta multicanal · aplicação manual no SFMC pendente

As seis SQLs integrais nesta nota são referência da montagem orientada a e-mail. CRUZAMENTO filtra e-mail/bloqueio_email globalmente; APTOS consulta _Subscribers e não transporta ULTIMO_ACESSO. Elas não implementam a política multicanal aprovada.

Manter uma PREPARAÇÃO MAPA → CRUZAMENTO → SAFRA → POOL → APTOS → FUNIL e as mesmas entidades. APTOS continua única, com uma linha por CPF por rodada e seleção de canal identificável; sem DE extra de audiência ou histórico de rotação.

| Destino | Delta proposto | Efeito / conferência |
|---|---|---|
| CRUZAMENTO | + FL_BLOQ_EMAIL Number, ULTIMO_ACESSO Date, DT_REF_ELEGIBILIDADE Date; EMAIL passa a aceitar NULL | Aptidão comum sem veto global de e-mail. Transportar bloqueios separados e uso real do app. 32 → 35 campos de referência. |
| SAFRA | EMAIL deve aceitar NULL; preserva 18 campos e PK CPF+ID_SAFRA | Incluir participantes móveis sem e-mail e controles; manter grupo/célula/token. Canal não é re-sorteio experimental. |
| APTOS | + CANAL_ENVIO Text(20), ID_RODADA Text(60), ID_POLITICA_CANAL Text(60), ULTIMO_ACESSO Date, FL_BLOQ_EMAIL Number, FL_APTO_EMAIL/FL_APTO_WHATSAPP/FL_APTO_SMS Number, DT_REF_ELEGIBILIDADE Date; EMAIL anulável | 20 → 29 campos de referência. Uma escolha por CPF/rodada, supressão por canal, app 60 dias só nos móveis. Campos de política/rodada obrigatórios no contrato novo. |
| POOL / BRIEFING | Mantêm nove / 41 campos | Reutilizar seleção e conteúdo na LP; não criar entidades de hero/tema. |
| FUNIL | Mantém 11 campos; novas linhas de diagnóstico | Canal, sobreposição, controle excluído, data futura, app inválido, total por rodada e teto; proporções por célula continuam na SAFRA. |

Tipos/tamanhos são proposta de contrato a conferir antes de editar/recriar DE. Não sobrescrever dados existentes para trocar PK/nulidade. Conferir export/backup, impacto nos consumidores e teste em cópia. A SQL de referência e-mail fica preservada; o arquivo Q_VDV_03_CRUZAMENTO_MULTICANAL_PROPOSTA.sql prepara a aptidão comum, mas depende dos campos novos e não é a seleção final de canal.

Para a APTOS multicanal, faltam pesos/cotas/pressão aprovados e a ligação das supressões de WhatsApp/SMS à fonte real. O contrato executável de simulação está em poolChannels.ts: só aceita política explícita, exclui controles, separa bloqueios, aplica a janela de app e os tetos e atribui no máximo um canal. O sorteio da simulação não é declarado equivalente ao CHECKSUM do SFMC. Não substituir a query real por uma escolha arbitrária de pesos.
