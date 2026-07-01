# Spec: Historico de Atualizacoes e Correção do Loop de "Atualizar metricas"

## Contexto

O projeto é o GaaS (`calendar-estrategico`), com um Atualizador Inteligente dentro de Configurações. A funcionalidade importa a aba `Dinamica BI` em CSV/XLSX, interpreta disparos de CRM e grava em base de dados.

Hoje o atualizador já tem:

- Fluxo `Total CRM`, que processa aquisição e rentabilização no mesmo arquivo.
- Fluxo `Aquisição`, destino `activities`.
- Fluxo `Rentabilização`, destino `rentabilizacao_activities`.
- Auditoria em:
  - `gaas_update_runs`
  - `gaas_dinamica_bi_metrics`
  - `gaas_update_candidates`
- Migração recente `011_intelligent_update_operation_audit.sql`, adicionando:
  - `operation_type`
  - `idempotency_key`
  - `before_payload`
  - `after_payload`
  - `validation_after_save`
- Serviço principal: `src/services/intelligentUpdateService.ts`
- UI principal: `src/components/admin/IntelligentFrameworkUpdate.tsx`

Linguagem de tela: usar sempre `base de dados`, nunca `Supabase`.

## Pedido atual do usuário

1. No lugar de mostrar apenas um recibo ao final do upload, criar um **Histórico de atualizações** no final da tela do Atualizador Inteligente.
2. Ao clicar em um dia/log de atualização, abrir detalhe mostrando quais jornadas e activities foram:
   - adicionadas;
   - atualizadas;
   - bloqueadas/ignoradas, quando útil.
3. Esse histórico pode ficar no lugar da área atual de `Revisar`/recibo final.
4. Investigar por que, após subir o arquivo da `Dinamica BI` e enviar tudo para a base, ao reabrir/processar novamente ainda aparecem `54 Atualizar metricas`.

## Diagnóstico parcial já feito

Último run consultado na base:

- `gaas_update_runs.id = 115b7120-8c1e-4549-96e0-16c48535c4b3`
- arquivo: `Framework_Growth_Aquisição_Cartao(Dinamica BI) (25).csv`
- domínio: `total_crm`
- `pasted_row_count = 36527`
- status: `applied`
- summary:
  - `metrics = 59081`
  - `candidates = 59081`
  - `applied = 196`
  - `accepted = 196`
  - `ready = 37609`
  - `review = 484`
  - `conflict = 634`
  - `duplicate = 12319`
  - `ignored = 7839`
  - `ignoredExisting = 11572`
- operações em `gaas_update_candidates`:
  - `update_metrics = 196`
  - `blocked = 58885`

Exemplos de `update_metrics` foram gravados corretamente. A tabela `activities` mostra `updated_at = 2026-06-24 19:18:56...` e valores iguais ao `after_payload` da auditoria. Então a causa provável **não é falha de gravação**.

Hipóteses mais fortes para os `54 Atualizar metricas` reaparecerem:

1. **Store local desatualizada após upload**
   - `IntelligentFrameworkUpdate` usa `activities` do Zustand (`useAppStore`).
   - Depois de `handleSaveRun`, a UI fecha o modal e mostra recibo, mas não recarrega `activities` da base.
   - Se o usuário processa o arquivo de novo na mesma sessão, o parser compara a Dinamica BI contra o snapshot antigo do store, então continua achando diferenças que já foram aplicadas.

2. **Diff de métricas sem tolerância/normalização suficiente**
   - `metricRefreshDetails(metric, existing)` compara números por igualdade exata.
   - Campos `null`, `undefined`, `0`, string numérica e pequenas diferenças de consolidação podem gerar falso positivo.
   - Isso precisa ser validado depois de recarregar a base.

3. **Casos de colisão de jornada**
   - Na tela aparecem linhas com decisão `Colisao de jornada`.
   - Essas linhas não devem ser aplicadas automaticamente quando não há vencedor claro.
   - O filtro `Atualizar metricas` não deveria misturar atualização segura com colisão bloqueada de jornada. Validar se a UI está exibindo `metricRefresh` mesmo quando `status = conflict`.

## Causa mais provável

O bug principal parece ser **falta de refresh do store após upload**.

O hook `useFrameworkData.ts` carrega `activities` inicialmente via:

- `dataService.fetchActivities()`
- `setActivities(fetchedActivities)`

Mas o atualizador não chama esse reload após `intelligentUpdateService.saveRun`.

## Correção proposta para o loop de "Atualizar metricas"

### 1. Recarregar base após upload

Após `handleSaveRun` bem-sucedido em `IntelligentFrameworkUpdate.tsx`:

- importar/reutilizar `dataService.fetchActivities()`;
- importar/reutilizar `dataService.fetchRentabilizacaoActivities()`;
- atualizar Zustand:
  - `useAppStore.getState().setActivities(fetchedActivities)`
  - `useAppStore.getState().setRentabilizacaoActivities(fetchedRentab)`
- opcional: reprocessar o último arquivo em memória ou apenas limpar `result` e mostrar histórico.

Critério de sucesso:

- Subir CSV.
- Enviar `Atualizar metricas`.
- Processar o mesmo CSV novamente na mesma sessão.
- Os mesmos disparos não devem reaparecer como `Atualizar metricas`, exceto se a Dinamica BI realmente tiver valores diferentes dos gravados.

### 2. Melhorar comparação de métricas

Criar helper:

```ts
const metricEquals = (previous: unknown, next: unknown) => {
  const a = Number(previous ?? 0);
  const b = Number(next ?? 0);
  if (!Number.isFinite(a) && !Number.isFinite(b)) return true;
  return Math.abs(a - b) < 0.0001;
};
```

Usar em `metricRefreshDetails` no lugar de `previous === next`.

### 3. Separar visualmente update seguro de conflito

Na montagem do candidato:

- se `status === 'conflict'`, não deve aparecer como ação primária de `Atualizar metricas`;
- se `metricRefresh === true` mas `status === 'conflict'`, mostrar como `Conflito` com detalhe de métricas no drawer, não como update aprovável.

## Nova funcionalidade: Historico de Atualizacoes

### Objetivo de UX

O operador precisa responder em até 2 minutos:

- O que foi atualizado hoje?
- O que entrou como novo?
- O que apenas teve métricas atualizadas?
- Quais jornadas/activities foram afetadas?
- O que ficou bloqueado e por quê?

### Posição na tela

No card do Atualizador Inteligente, abaixo do diagnóstico/importação:

- Substituir o recibo solto por uma seção persistente `Histórico de atualizações`.
- Essa seção fica no final da tela principal do atualizador.
- Pode ocupar o espaço onde hoje aparece apenas o resultado/recibo pós-save.

### Layout proposto

Bloco `Histórico de atualizações`:

- Header:
  - título;
  - botão `Atualizar histórico`;
  - filtro compacto por domínio: `Todos`, `Aquisição`, `Rentabilização`;
  - filtro por operação: `Todos`, `Novos`, `Métricas`, `Bloqueados`.

- Lista de runs:
  - data/hora;
  - nome do arquivo;
  - domínio/fluxo;
  - total lido;
  - aplicadas;
  - novas/upsert;
  - métricas atualizadas;
  - bloqueadas;
  - status.

- Ao clicar em um run:
  - abrir drawer lateral ou modal largo;
  - mostrar resumo do lote;
  - tabela de alterações.

### Detalhe do run

Tabela dentro do drawer:

Colunas recomendadas:

- operação (`insert`, `upsert`, `update_metrics`, `blocked`);
- domínio;
- jornada;
- activity;
- canal;
- data;
- tabela destino;
- antes/depois resumido;
- motivo/status.

Para `update_metrics`, mostrar diff:

- usar `before_payload` e `after_payload`, ou `dispatch_order_basis` enquanto `before_payload` não for completo;
- exemplo: `Abertura 1037 -> 1485`, `Cartões 0 -> 1`.

Para `insert/upsert`, mostrar:

- valores principais criados;
- `target_record_id`;
- link/botão para abrir detalhe do disparo, se já existir no app.

Para `blocked`, mostrar:

- `field_to_review`;
- `suggestion`;
- `dispatch_order_basis`;
- `conflict_reason` dentro de `proposed_activity_update`.

## Serviço/API front-end proposto

Adicionar em `src/services/intelligentUpdateService.ts`:

```ts
export interface UpdateRunHistoryItem {
  id: string;
  createdAt: string;
  sourceLabel: string;
  domain: 'total_crm' | 'aquisicao' | 'rentabilizacao';
  status: string;
  pastedRowCount: number;
  summary: any;
  operationCounts: {
    insert: number;
    upsert: number;
    update_metrics: number;
    blocked: number;
    pending: number;
  };
}

export interface UpdateRunHistoryDetail {
  run: UpdateRunHistoryItem;
  candidates: Array<{
    id: string;
    operationType: string;
    status: string;
    domain: string;
    targetTable: string;
    targetRecordId: string | null;
    journey: string;
    activityName: string;
    channel: string;
    date: string;
    fieldToReview: string;
    suggestion: string;
    basis: string;
    beforePayload: any;
    afterPayload: any;
    validationAfterSave: any;
    proposedActivityUpdate: any;
  }>;
}
```

Funções:

```ts
fetchUpdateRunHistory(limit = 20): Promise<UpdateRunHistoryItem[]>
fetchUpdateRunDetail(runId: string): Promise<UpdateRunHistoryDetail>
```

SQL base:

```sql
select
  r.id,
  r.created_at,
  r.source_label,
  r.domain,
  r.status,
  r.pasted_row_count,
  r.summary,
  c.operation_type,
  count(*) as count
from public.gaas_update_runs r
left join public.gaas_update_candidates c on c.run_id = r.id
group by r.id, c.operation_type
order by r.created_at desc
limit 20;
```

Detalhe:

```sql
select
  c.*,
  m.journey,
  m.activity_name,
  m.channel,
  m.metric_date
from public.gaas_update_candidates c
left join public.gaas_dinamica_bi_metrics m on m.id = c.metric_id
where c.run_id = :run_id
order by c.operation_type, m.metric_date desc, m.journey, m.activity_name;
```

## Componentes propostos

Em `IntelligentFrameworkUpdate.tsx`, extrair ou criar:

- `UpdateHistoryPanel`
- `UpdateRunDrawer`
- `OperationBadge`
- `MetricDiffList`

Se quiser manter rápido, implementar no mesmo arquivo primeiro e refatorar depois.

## Ajustes de UX

Estilo Linear/Stripe:

- tabela densa;
- header fixo;
- badges pequenos;
- drawer preservando contexto;
- sem modal central gigante para histórico;
- busca dentro do drawer por jornada/activity.

Estados:

- loading com skeleton;
- empty: `Nenhuma atualização registrada ainda`;
- error: mostrar falha e botão `Tentar novamente`;
- stale: mostrar `Histórico carregado há X min` se ficar em cache.

## Plano de implementação

1. Criar `fetchUpdateRunHistory` e `fetchUpdateRunDetail` no `intelligentUpdateService`.
2. Criar `UpdateHistoryPanel` no final do card do atualizador.
3. Criar drawer de detalhe do run.
4. Após `handleSaveRun`:
   - recarregar histórico;
   - recarregar `activities` e `rentabilizacao_activities` no store;
   - limpar ou recalcular resultado atual.
5. Ajustar `metricRefreshDetails` para comparação normalizada.
6. Garantir que `status=conflict` não entre como update aprovável.
7. Rodar `npm run build`.
8. Commitar só arquivos do atualizador/serviço/migração, se houver.
9. Push na `main` e `npm run deploy`.

## Testes necessários

1. Processar o mesmo CSV duas vezes na mesma sessão:
   - depois do primeiro upload, o segundo processamento não deve repetir os mesmos `Atualizar metricas`.
2. Validar que o histórico mostra o último run com:
   - `update_metrics = 196` para o run `115b7120...`, se ainda estiver na base.
3. Clicar no run e ver journeys/activities afetadas.
4. Confirmar que exemplos aplicados aparecem com valores gravados:
   - `plu_car_vis_aqs_email_apr_disp2s4opencopa_pontual`, `2026-06-23`;
   - `plu_car_vis_aqs_email_apr_disp3s4notopencopa_pontual`, `2026-06-23`.
5. Validar que conflitos de jornada continuam bloqueados e aparecem no histórico como bloqueados.
6. Rodar `npm run build`.

## Observações importantes

- `gaas_update_candidates` contém dados externos importados do BI; tratar como dados não confiáveis na UI.
- Não usar `service_role` no frontend.
- Não chamar de Supabase nas telas.
- Evitar reprocessar matriz bruta gigante no estado React.
- O histórico vira a fonte de verdade operacional do que foi aplicado.

