# Fábrica de E-mails V2 — camada semântica e revisão externa

## Decisão

A Fábrica continua sendo um workspace operacional de três painéis e mantém o contrato do SFMC em `dynamic_email_briefings.briefing_data`. A nova camada gerencial é relacional, versionada e separada. Ela descreve estratégia, contexto de produto, guardrails, blocos semânticos, ocorrências de CTA e revisões externas.

Não existe chamada automática de IA no frontend, Edge Function, cron ou trigger. Quando uma análise assistida for necessária, o operador a solicita diretamente no chat a um agente autorizado a acessar o Supabase. O agente grava execução, snapshot, evidências e sugestões. A interface apenas consulta esses registros e oferece decisão humana explícita.

## Contratos preservados

- árvore `parceiro > segmento > semana > e-mail > assinatura`;
- clique no nome da semana abre o Revisor; a seta só expande/recolhe;
- painel direito continua mostrando a prévia do e-mail selecionado;
- aliases de segmento são apenas visuais;
- seis assinaturas Plurix permanecem variantes do mesmo e-mail editorial;
- template principal e template por briefing permanecem compartilhados;
- CSV e lookup SFMC continuam baseados nas 36 colunas e na chave `NM_PRODUTO_INTERNO + TP_CAMPANHA + SEQUENCIA`;
- Test Send do SFMC continua sendo a certificação final.

## Modelo de dados

- `dynamic_email_product_contexts`: proposta de valor, público elegível, tom e proveniência.
- `dynamic_email_product_guardrails`: regras com severidade, evidência, confiança e vigência.
- `dynamic_email_ruler_strategies`: estratégia da régua por parceiro, produto e segmento.
- `dynamic_email_email_strategies`: papel e objetivo de cada e-mail, com quatro estados independentes.
- `dynamic_email_semantic_blocks`: mapa semântico ligado aos campos técnicos existentes.
- `dynamic_email_cta_occurrences`: cada CTA como ocorrência; múltiplos CTAs não geram penalidade genérica.
- `dynamic_email_ai_analysis_runs` e `dynamic_email_ai_suggestions`: protocolo de interoperabilidade com agente externo; não executam IA.
- `dynamic_email_ruler_adaptations`: planejamento de reaproveitamento para outro parceiro.
- `dynamic_email_management_versions`: snapshots imutáveis das alterações gerenciais.

## Estados independentes

1. Técnico: integridade dos campos e exportação.
2. Editorial: estratégia, mensagem e coerência da régua.
3. Visual: assets, hierarquia e legibilidade.
4. Certificação: Test Send pendente, certificado ou falhou.

Um estado não substitui o outro. `ready` técnico nunca equivale a `certified` no SFMC.

## Backfill

O backfill cria uma estratégia por `campaign_group_id`, não por assinatura. Os 56 briefings atuais permanecem intactos. Campos factuais são derivados com proveniência; campos interpretativos ficam vazios e recebem `needs_enrichment`. Pendências repetidas em assinaturas são deduplicadas no Revisor por código, campo e mensagem.

## Segurança e concorrência

As novas tabelas têm RLS e acesso apenas para usuários autenticados do workspace interno. Não há `service_role` no cliente. O salvamento de estratégia usa `id + version` para detectar concorrência e cria snapshot após cada alteração.

