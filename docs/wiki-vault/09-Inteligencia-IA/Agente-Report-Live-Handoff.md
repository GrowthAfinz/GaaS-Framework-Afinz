---
tags: [ia, gaas, report-live, handoff, runbook, agente]
tipo: inteligencia-ia
camada: operacao
tipo_diataxis: how-to
atualizado: 2026-07-08
status: confirmado
fonte: construcao-claude-cowork
---

# Agente Report Live — Handoff para qualquer IA

Definição precisa: este é o **runbook de operação do Report Live para uma IA** (Claude, Gemini, GPT ou outra). A IA assume o papel de **LLM do report**: analista + redatora + crítica. Os números NUNCA são calculados pela IA — vêm do Supabase por SQL; a IA escreve prosa e dispara a publicação. Arquitetura completa em [[Report-Live-Sheets-Slides]].

## O papel da IA (decisão de 08/07/2026)

O Gemini embutido está desativado por decisão do Pablo. O modo padrão é `skip_llm`: a IA da sessão gera os textos e envia prontos. Vantagens: qualidade superior, custo zero de API, e a IA da sessão tem acesso ao Supabase (MCP) e ao contexto do vault.

## Procedimento mensal (passo a passo)

1. **Ler o briefing** — aba `BRIEFING` da planilha-mestre (ID em [[Report-Live-Sheets-Slides]]). Ele é LEI: persona (gerentes/diretores internos), vocabulário canônico, janelas temporais, exemplos-ouro, anti-exemplos, guardrails. Nunca escrever sem lê-lo.
2. **Calcular agregados via SQL** no projeto Supabase `mipiwxadnpwtcgfcedym` (MCP `execute_sql`). Consultas de referência: frente×plataforma MoM em `paid_media_metrics` (classificação de frente = regex do nome da campanha: COPA/RENTABILIZA/LP_Visa/[Demand]/[Youtube]→Copa · [SEGUROS]→Seguros · [PLURIX]/mais_amigo→Plurix · resto→B2C); CRM por BU/Parceiro/Segmento/funil em `activities` (colunas com aspas: "Data de Disparo", "Base Acionável", "Cartões Gerados", "Custo Total Campanha").
3. **Ler a memória** — `select * from report_memory order by ciclo desc limit 3`. Obrigatório: a `prestacao_contas` do novo ciclo compara cada recomendação anterior (valor_esperado) com o realizado.
4. **Escrever os 20 textos** (chaves em [[Report-Live-Sheets-Slides]]) seguindo o briefing: Contexto→Mudança→Causa→Ação; comentário de view interpreta o gráfico (nunca descreve); máx. 3 insights; toda ação com número.
5. **Disparar a run** via SQL (`pg_net`):
```sql
select net.http_post(
  url := 'https://mipiwxadnpwtcgfcedym.supabase.co/functions/v1/report-sync',
  headers := '{"Authorization": "Bearer <ANON_KEY>", "Content-Type": "application/json"}'::jsonb,
  body := '{"period_start":"AAAA-MM-01","period_end":"AAAA-MM-DD","skip_llm":true,
            "texts":{...20 chaves...},
            "recomendacoes":[{"acao":"...","metrica":"...","valor_esperado":0,"unidade":"..."}]}'::jsonb,
  timeout_milliseconds := 30000);
```
(ANON_KEY via MCP `get_publishable_keys`; resposta assíncrona em `net._http_response`; status final em `report_runs`.)
6. **Verificar**: `select status, rows_inserted, error_detail from report_runs order by created_at desc limit 1` → esperado `done`. Entregar os 2 links fixos ao Pablo.
7. **Registrar recomendações auditáveis** — cada uma com métrica e valor esperado; é o que alimenta a prestação de contas do ciclo seguinte.

## Guardrails invioláveis (resumo do briefing)

Nenhum número fora dos dados · nenhuma promessa de resultado · tendência exige ≥3 pontos · YoY proibido até jan/2027 · D-3 = "em consolidação" · CPA de plataforma ≠ CAC · conversão zero é válida, zeramento abrupto é alerta de tracking · PT-BR, sem emojis.

## Manutenção da infraestrutura

- Reparar views/slides: `POST {mode:"setup_views"}` (idempotente).
- Diagnóstico: `GET /report-sync` (health) e MCP `get_logs` (service edge-function).
- Nunca hardcodar a chave da service account em código; ela vive só nos secrets.
- Antes de reescrever a Edge Function, ler a versão atual via MCP `get_edge_function` — não recriar do zero.

## Backlog V4 (não iniciado)

Metas por frente (`paid_media_targets` vazia) + slide de atingimento · scorecard Escalar/Corrigir/Monitorar/Investigar por campanha (lógica já existe em `utils/aquisicaoCrmExcelExport.ts`) · outcomes automáticos na `report_memory` · agendamento mensal automático · cópia de arquivamento do deck no Drive · RLS nas 14 tabelas expostas.

## Contrato de publicação versionada — atualização 23/07/2026

Antes de operar ou alterar o Report Live, ler [[Report-Live-Versionamento-e-Publicacao]]. O deck continua único, mas uma execução agora deve separar `build`, `certify` e `publish`. `done` técnico não autoriza publicação quando houver bloqueio de qualidade. Rollback reaplica blueprint certificado anterior; não recalcula dados.

Estado de promoção: implementação e QA local concluídos; migration e Edge Functions ainda não promovidas. Produção permanece em `report-sync` v23 / `report-sync-v4-setup` v11 e último run confirmado `d6d1a08b`. Não fazer deploy direto: executar red team, migration rastreada, `mode=build`, `mode=certify` e canários antes de `publish`.

Ver também: [[Report-Live-Versionamento-e-Publicacao]] · [[Report-Live-Sheets-Slides]] · [[Skills-do-Projeto]] (growth-brain + storytellingfiltergaas, cujas regras o briefing absorveu) · [[Agentes-e-Workflows]].
