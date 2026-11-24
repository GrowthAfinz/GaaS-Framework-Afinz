# Atualização direta do CRM por CSV

Executor: `scripts/activities-csv.mjs`. Skill: `.claude/skills/gaas-activities-csv-ingest/SKILL.md`.
Projeto fixo: **GaaS Framework Afinz**, `mipiwxadnpwtcgfcedym`.

## Operação

```powershell
npm run crm:csv -- --csv 'C:/caminho/arquivo.csv' --out 'outputs/crm-import/lote-001'
# Aplicação somente quando o pedido autorizar atualizar o banco:
npm run crm:csv -- --csv 'C:/caminho/arquivo.csv' --out 'outputs/crm-import/lote-002' --apply
```

Sem `--apply`, o processo emite exclusivamente consultas SELECT. O transporte padrão é
uma ponte com o conector Supabase do agente; o terminal sozinho aguarda essa ponte.
Não pede chave de serviço, PAT, token ou alteração de RLS. Confira `--help`.

O perfil padrão usa a data de São Paulo: Aquisição desde a segunda-feira da semana anterior
até hoje; demais frentes no período completo do arquivo. `--today`, `--acquisition-from` e
`--acquisition-to` tornam o recorte explícito e reproduzível. O perfil fica no plano e no recibo.
Atualizações aplicam apenas métricas observadas, preservando dimensões, notas, templates e
componentes financeiros históricos. Novos disparos usam os builders do app. ANC novo recebe
Meio_de_Funil / N/A pelo contrato confirmado em 26/10/2026.

Ficam em `pending.json`: conflitos do parser, múltiplos alvos, aliases repetidos do mesmo
envio, redução de qualquer métrica conhecida e subgrupo de carrinho em público incompatível.
Não escolha arbitrariamente um UUID ou um nome de jornada para ultrapassar um bloqueio.
O mesmo Activity Name de opt-out em jornadas/safras diferentes não é agregado.

## Contrato compartilhado

- `src/utils/intelligentUpdateEngine.ts`: parser e classificação usados também pelo modal.
- `src/utils/activitySqlMapper.ts`: conversão da linha SQL usada também pelo dataService.
- `src/utils/intelligentUpdatePayload.ts`: patches e inserts usados também pelo serviço do app.
- `src/utils/crmCsvRuntime.ts`: entrada sem React, browser ou cliente Supabase.
- `scripts/crm-import/plan.mjs`: política conservadora de aplicação direta e integridade do plano.
- `scripts/crm-import/sql.mjs`: SQL gerado, aplicação transacional e verificação.

Não há segundo parser nem reescrita de regras por regex sobre o código da interface.
O runtime é compilado com a dependência esbuild fixada no lockfile; seu hash integra o plano.
O identificador da implementação inclui também os módulos do executor. Mudança na política
invalida planos e atalhos anteriores, mesmo quando o parser de origem não mudou.

## Ponte com o conector do agente

1. Confirme o projeto pelo conector e inicie o comando com `exec_command`.
2. Use `nextRequest(out)` de `scripts/crm-import/mcp-bridge.mjs` para ler a requisição pendente.
3. Encaminhe **sem modificar** `sql` e `projectId` para `supabase_execute_sql`.
4. Salve o resultado bruto do conector, como JSON, em `responsePath`. `apply_patch` permite
   salvar respostas grandes sem expor o conteúdo no chat ou exceder o limite de código do REPL.
5. Continue até `status.json` indicar `complete` ou `failed`; confira o processo e `receipt.json`.

Exemplo de orquestração em `functions.exec`, depois de inicializar o REPL com
`fs = await import('node:fs/promises')`, `bridge = await import(fileURLDaPonte)` e `out` absoluto:

```javascript
const poll = await tools.mcp__node_repl__js({
  code: "nodeRepl.write(JSON.stringify({request:await bridge.nextRequest(out),status:JSON.parse(await fs.readFile(out+'/status.json','utf8'))}));",
  title: 'Conferindo etapa da ingestão'
});
const state = JSON.parse(poll.content.find(c => c.type === 'text').text);
if (state.request) {
  const req = state.request;
  if (req.projectId !== 'mipiwxadnpwtcgfcedym') throw new Error('Projeto inesperado');
  // Se o usuário pediu somente simulação, exija /^select\b/i.test(req.sql).
  const result = await tools.mcp__codex_apps__supabase_execute_sql({
    project_id: req.projectId, query: req.sql
  });
  await tools.apply_patch('*** Begin Patch\n*** Add File: '+req.responsePath+
    '\n+'+JSON.stringify(result)+'\n*** End Patch');
}
```

Repita o passo enquanto `running`, com pausas curtas quando não houver requisição (o parser
está calculando localmente). Em outras IAs, implemente o mesmo contrato de mailbox usando
o conector disponível. Cada processo tem diretório próprio; uma resposta antiga não é reutilizada.
Os nomes de ferramentas do host podem mudar: descubra-os em vez de copiar um nome inexistente.

## Cache e eficiência

Padrão: `outputs/crm-import/cache` no checkout. O cache contém dados de negócio e é ignorado
pelo Git; não publicar em Pages, skill ZIP, vault ou Storage.

A primeira leitura pagina o histórico necessário ao parser. Depois, o executor compara a
contagem e o fingerprint de **todas as linhas**, calculado no banco. Sem mudança, não baixa o
histórico. Com watermark novo, busca apenas linhas alteradas. Hash, contagem e leitura final
precisam fechar; exclusão, edição sem updated_at ou cache corrompido causam leitura completa
da tabela afetada. Não usa timestamps como prova única de consistência.

`downloads` no recibo informa quantas linhas foram transferidas. A classificação continua
usando o histórico local completo, mantendo a mesma evidência do parser. O cache evita
transferência; não elimina o custo de parsing/classificação local ou da consulta de hash.
Há lock por cache para impedir duas cargas simultâneas. Se sobrar `executor.lock`, confirme
que o PID não está ativo e confira a persistência do run antes de remover apenas esse lock.

Após uma aplicação verificada, o cache só é atualizado com o after da auditoria se o hash
reconstruído fechar com toda a tabela viva. Arquivo idêntico, mesmo perfil e mesma implementação
recebem um atalho: uma consulta confirma que dados e contrato continuam iguais aos da carga
concluída; nesse caso o recibo retorna `already_processed`, zero gravações e referência às
pendências originais. Alteração dos dados, do vínculo exato dos cards ou do contrato
invalida o atalho e faz nova conciliação.

## Aplicação e recuperação

O plano recebe hash do CSV original, runtime, recorte, contrato vivo e alterações propostas.
Para aplicar um plano revisado sem recalcular:

```powershell
npm run crm:csv -- --apply-plan 'outputs/crm-import/lote-001/plan.json' --expect-plan-id HASH --out 'outputs/crm-import/aplicacao-001'
npm run crm:csv -- --verify-run UUID --out 'outputs/crm-import/verificacao-001'
```

A primeira etapa registra o run e os candidatos em `reviewing` / `ready`. São apenas o plano;
ainda não alteram os disparos. O SQL final verifica schema, RPC financeiro, triggers e staging;
trava as tabelas de destino; verifica o hash da linha anterior; aplica tudo na mesma transação;
captura before/after completos e marca o run como aplicado. Um erro desfaz **todos** os disparos
do lote; o plano continua disponível para diagnóstico. Não remover guardas para forçar a carga.

IDs de inserts e auditoria são determinísticos. Repetir a transação confere o after salvo e não
reescreve os registros; se alguém alterou o destino posteriormente, a repetição é bloqueada.
Depois do commit, outra consulta confere existência, campos importados e igualdade com a
auditoria. Custos e CAC derivados continuam governados pelo RPC/trigger e pelos testes do app.

Se houver timeout durante aplicação, **não suponha rollback**: consulte o run com `--verify-run`.
Um processo encerrado pode ter perdido apenas o recibo. Nunca faça rollback cego; use o before
auditado para preparar uma correção inversa, protegida pelo after atual e autorizada pelo usuário.

## Saídas

`source.csv` preservado; `source-audit.json`; `plan.json`; `summary.json`; `pending.json`;
`excluded.json`; SQLs de staging/aplicação quando utilizados; `receipt.json`; `status.json`.
Before/after completos ficam também em `gaas_update_candidates`, associados ao run do recibo.
Um pedido de atualizar CRM não ativa jornadas SFMC nem carrega a tabela de consumo SFMC.

## Verificação do executor

```powershell
npm run test:crm-csv
npm test -- src/components/admin/IntelligentFrameworkUpdate.test.ts src/services/intelligentUpdateService.test.ts src/components/admin/importSelection.test.ts
npm run typecheck:release
npm run build
```

Os testes PostgreSQL isolados cobrem aplicação, concorrência, rollback, idempotência, auditoria,
patch parcial, cache, período, aliases e reduções. A certificação com CSV real deve ser executada
somente no projeto confirmado, inicialmente em simulação; fixtures não certificam integrações
de templates e observação do crescimento dos triggers de produção.
