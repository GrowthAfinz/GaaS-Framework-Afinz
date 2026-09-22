# Release 2 — feed sistêmico read-only

**Data:** 2026-09-22
**Branch:** `codex/growth-learning-release-2`
**Base:** `aadbae0` — merge do PR #13, Release 1

## Resultado

A Fila de `Aprendizado Growth` deixou de ser um estado de fundação e passou a ler eventos reais, imutáveis e rastreáveis. O corte continua read-only para usuários: não cria aposta, outcome ou memória.

## Persistência publicada

A migration `20260922160601_growth_feed_release_2.sql` adicionou:

- `growth_feed_events`, append-only;
- `growth_feed_v`, view `security_invoker` para leitura autenticada;
- produtores transacionais em `report_action_candidates`, `report_runs` e `report_publications`;
- backfill idempotente das estruturas existentes;
- deduplicação por objeto e transição material;
- snapshot de texto, confiança, período, fonte, referências de evidência e ação principal;
- bloqueio de `UPDATE` e `DELETE` nos eventos.

O acesso pelo Data API exige sessão autenticada. `anon` não possui leitura e `authenticated` não possui escrita. As tabelas internas do Report Live não foram abertas ao frontend.

## Estado inicial materializado

Após a publicação, o banco registrou `82` eventos em `15` grupos lógicos:

| Tipo | Eventos |
|---|---:|
| recomendação criada | 31 |
| qualidade bloqueada | 17 |
| candidata certificada | 9 |
| Report Live bloqueado | 24 |
| Report Live publicado | 1 |

Por frente: `31` CRM Aquisição, `17` Mídia Paga e `34` Report Live.

Originação B2C não possui produtor governado nas tabelas atuais. A interface exibe a frente e explica o vazio; não gera evento sintético.

## Interface

- ordenação por prioridade, recentes e relevância determinística;
- filtros por frente, confiança e estado, persistidos na URL;
- agrupamento de ocorrências repetidas do mesmo sinal;
- registry explícito para as cinco variantes de card desta release;
- motivo do score visível;
- drawer com impacto, causa provável, limite de leitura, ação, fontes, campos, IDs e dedupe key;
- deep-link por evento e comportamento de back que fecha o drawer sem limpar filtros;
- estados de loading, erro e vazio explicativo;
- ação de Report Live navega para a operação existente, sem iniciar build ou publicação.

## Decisões de implementação

1. O feed materializa snapshots no momento do evento; a UI não recompõe texto a partir de tabelas mutáveis.
2. Candidatos são idempotentes por UUID e agrupados por `domínio + entidade + signal_code`.
3. Runs podem gerar dois eventos distintos — candidata certificada e bloqueio posterior — porque representam transições materiais diferentes.
4. Publicação só aparece quando `status=published`, `google_state=active` e `qa_status=passed`.
5. Checkpoints normais do pipeline permanecem silenciosos.
6. Números apresentados na prosa vêm de colunas/snapshots determinísticos; o feed não calcula KPI.

## Verificação

Antes da publicação, a migration completa rodou contra o schema real dentro de transação encerrada com `ROLLBACK`. O ensaio produziu os mesmos `82` eventos e validou dedupe, rotas, RLS e `security_invoker`.

Depois da publicação foram confirmados:

- RLS ativa;
- leitura por `authenticated`;
- ausência de `INSERT` para `authenticated`;
- ausência de leitura para `anon`;
- trigger append-only presente;
- rotas de candidatos apontando para o próprio evento;
- nenhuma ocorrência nova nos advisors de segurança para objetos `growth_feed_*`.

Gates locais:

- frontend: 19 arquivos, 135 testes;
- Report Live: 57 testes;
- renderer Office: 3 testes;
- TypeScript: 57 diagnósticos históricos, zero novos;
- quatro entrypoints de Edge Functions aprovados;
- build Vite aprovado.

O workflow `validate.yml` também passa a executar o contrato SQL em PostgreSQL 17 com fixtures adversariais. O resultado do Actions será registrado no PR antes do merge.

## Fora desta release

- criar, aceitar, rejeitar ou mesclar aposta;
- checklist, comentário ou owner;
- registrar execução;
- calcular ou revisar outcome;
- materializar memória;
- produtor de Originação B2C sem fonte governada;
- notificações externas;
- mudança no renderer ou no pipeline do Report Live.
