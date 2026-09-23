# Release 7A — entrada contextual de apostas

**Data:** 2026-09-23  
**Estado:** contrato executável para implementação

## 1. Objetivo

Permitir que uma leitura feita em uma superfície analítica vire uma aposta governada sem exigir que antes exista uma recomendação na Fila.

O primeiro corte cobre:

- Relatórios → Overview;
- Relatórios → Diário;
- Relatórios → Mensal;
- Funis de onboarding → funil atualmente selecionado.

O comando é sempre explícito. Nenhuma leitura cria aposta automaticamente.

## 2. Decisão de arquitetura

A Release 7A adiciona uma segunda porta para o mesmo agregado `growth_bets`:

1. **Fila:** recomendção governada → `growth_accept_signal_as_bet_with_memory`;
2. **Contexto analítico:** tela + período + filtros → `growth_create_contextual_bet_with_memory`.

Não nasce uma segunda tabela de apostas. Evidência, contrato, timeline, outcome e memória continuam usando os contratos existentes.

O contexto viaja no deep-link e só é persistido na confirmação. Fechar ou cancelar o formulário não grava rascunho.

## 3. Contrato do contexto

O cliente transporta somente contexto observável:

| Campo | Regra |
|---|---|
| `front` | `crm_acquisition`, `paid_media` ou `b2c_origin` |
| `sourceSurface` | `reports_overview`, `reports_daily`, `reports_monthly` ou `acquisition_funnel` |
| `sourceRoute` | rota lógica estável da tela |
| `periodStart`, `periodEnd` | intervalo selecionado, em ISO date |
| `filters` | snapshot JSON dos filtros realmente aplicados |
| `entityKey` | entidade ou funil da leitura, quando houver |
| `metricName` | métrica, somente quando a origem aponta uma métrica inequívoca |
| `visualRef` | referência lógica do bloco visual |
| `title` | rótulo humano da origem |
| `verificationView` | superfície sugerida para verificar o outcome |

O deep-link não transporta baseline, meta ou conclusão. Esses campos continuam sendo uma decisão humana no contrato da aposta.

## 4. Evidência e imutabilidade

Na confirmação, o servidor cria `growth_evidence_snapshots` com:

- `source_run_id = null` e `artifact_path = null`;
- hash determinístico do contexto normalizado;
- período e filtros recebidos;
- métrica, baseline, expectativa e critério aprovados;
- qualidade identificada como captura contextual interativa;
- referência da superfície no `belief_snapshot.source_context`.

O snapshot permanece imutável. A origem da aposta também permanece protegida pelo trigger existente.

## 5. Memória aplicável

O matcher da Release 6 passa a ter um núcleo único baseado em `front + context_snapshot`.

- a porta da Fila monta esse contexto a partir de `report_action_candidates`;
- a porta contextual monta o mesmo shape a partir da tela, filtros, entidade e métrica informada;
- score, conflitos, elegibilidade e limite de cinco resultados permanecem idênticos;
- o cliente continua enviando apenas decisão e motivo;
- o servidor recalcula o match na transação.

`growth_learning_applications.action_candidate_id` passa a aceitar `null`, pois a procedência contextual está congelada no `context_snapshot` e no `belief_snapshot` da aposta.

## 6. UX

Cada superfície coberta mostra `Criar aposta` no seu cabeçalho. O comando:

1. abre Aprendizado Growth → Apostas;
2. apresenta a origem, período e filtros capturados;
3. pede hipótese, ação, responsabilidade e contrato de medição;
4. recalcula Memória aplicável quando a métrica muda;
5. exige decisão para toda memória elegível;
6. cria a aposta e abre o drawer do registro persistido.

Não há `Mesclar` nem `Rejeitar` porque ainda não existe um sinal sistêmico a decidir. Cancelar apenas encerra a intenção.

## 7. Frentes e entidades do primeiro corte

| Origem | Frente | Entidade |
|---|---|---|
| Relatórios de Aquisição | `crm_acquisition` | BU selecionada ou carteira CRM |
| Funil Mídia Paga | `paid_media` | `funnel:paid-media` |
| demais funis cobertos | `b2c_origin` | `funnel:<chave>` |

Relatórios de Rentabilização ficam fora porque ainda não pertencem às três frentes do Loop.

## 8. Aceite

1. o deep-link preserva contexto e filtros sem substituir outros parâmetros da URL;
2. contexto inválido não abre formulário nem chega ao banco;
3. cancelar não persiste registro;
4. criar gera aposta, evidência, timeline e evento de feed na mesma transação;
5. a aposta contextual possui `source_action_candidate_id = null`;
6. o snapshot identifica a tela, período, filtros e referência visual;
7. o matcher contextual e o matcher da Fila devolvem o mesmo resultado para contexto equivalente;
8. toda memória elegível recebe decisão e o snapshot aceita candidato nulo;
9. Overview, Diário, Mensal e todos os seletores de funil exibem a entrada;
10. testes SQL, unitários, build, gate TypeScript e pipeline passam antes da publicação.

## 9. Fora do corte

- apontar a aposta de volta dentro do gráfico ou tabela de origem (Release 7B);
- projetar apostas, outcomes e memórias no Report Live (Release 7C);
- captura automática de um ponto selecionado no gráfico;
- persistência de rascunhos abandonados;
- criação por LLM;
- novas frentes ou alteração do motor de outcomes.
