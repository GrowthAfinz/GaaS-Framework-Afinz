# Prompt para o Codex — Release 8: diagnóstico e motor de gatilhos (fatias 0 e 1)

Leia este arquivo inteiro antes de qualquer ação. A spec normativa é `RELEASE_8_GATILHOS_POR_FRENTE_SPEC_3.md`, que acompanha este prompt. Na fatia 0, apenas leia os anexos. Depois do OK da fatia 0, copie as versões revisadas para `docs/plans/learning-loop/` no checkout verificado, preservando os originais. A revisão v3 e sua §14 regem os contratos; divergências não são autorização para improvisar.

## Contexto em quatro linhas

- O loop (Releases 1–7B) está publicado, mas nunca fechou um ciclo. As 48 candidatas em `report_action_candidates` são 3 códigos de higiene que renascem a cada run; não há nenhum sinal de performance. `report_action_outcomes` tem 0 linhas e `growth_bets` tem 1.
- O Report Live não roda build desde 15/09. O deck vivo é agosto (`9bb55892`). Setembro já fechou e a base de `activities` avançou até 26/10.
- A Release 8 cria a camada de gatilhos por frente. A detecção é determinística; a IA vem depois e só redige.
- O renderer PPTX/PDF fica com o Claude Cowork, como decidido em 25/09. Você cuida de dados, pipeline e pacote.

---

## Fatia 0 — diagnóstico (bloqueante, sem nenhuma escrita)

Responda com procedência (`arquivo:linha`, SQL ou ID). Marque cada resposta como `[observado]`, `[inferido]` ou `[não verificável]`.

1. **Base atual.** Qual checkout e qual commit representam a `main` de `GrowthAfinz/GaaS-Framework-Afinz` hoje? Liste os worktrees em `.codex-worktrees/` que estão à frente da `main` e o que cada um tem de não mergeado em Report Live e no loop. Em especial: `codex/report-live-monthly-full` foi mergeado ou deployado?
2. **Run `c543aaa3-0bd9-440a-ba3d-6404cc112d97`** (renderer `2.2-editorial-profiles-outcomes`, 15/09). O que ele é? De qual branch saiu? Ele é superado pela decisão de 25/09 (`monthly_full`, cardinalidade dinâmica)?
3. **Publicação dele parada em `publishing` desde 15/09.** Em qual etapa parou? O que existe no Google por causa dela (abas, slides, gráficos)? Qual é o caminho seguro para encerrá-la sem afetar o ponteiro vivo `9bb55892` / `54649269`? **Não execute.** Só descreva o caminho.
4. **Certificação.** O gate em `report-live-versioning.ts` ainda exige exatamente 12 ou 31 páginas? Um pacote `monthly_full` de cardinalidade dinâmica certifica hoje?
5. **Publicação assíncrona.** `report_render_jobs` e `report_artifacts` não existem no banco. Verifique o que foi ou não implementado do `SUPABASE_ASYNC_PUBLISHING_PLAN.md` e diga o que existe de `report-live-render-package.ts` e dos scripts de fixture na base atual.
6. **Classificação de frente da mídia.** Onde está e como funciona a derivação de frente de campanha (`report-live-engine.ts:139-149` no estudo de setembro)? Ela distingue aquisição de rentabilização, Copa e seguros?
7. **Inventário de operações.** Onde está o CSV ou JSON que gerou as 164 notas `Assunto-*` em 03/10 (`outputs/wiki-resultados-historico-2026-10-03/`, `GROWTH_RESULTS_DOSSIERS.md`)? Qual script gera as notas? Ele é idempotente por `inventory_id`?

**Pare aqui e reporte.** Se alguma premissa deste prompt ou da spec estiver errada, diga antes de qualquer outra coisa. Até hoje, este passo pegou quatro erros grandes.

---

## Fatia 1 — motor de gatilhos em modo observação

Comece só depois do OK sobre a fatia 0.

A fatia 1 prepara arquivos de migrations/seed e executa consultas somente leitura. Não aplicar DDL, seed, staging ou qualquer escrita em produção. Aplicação depende de aceite do backtest e autorização explícita posterior (§14.10).

### 1.1 Registro de operações

- Migration aditiva: `growth_operations`, conforme a §3.2 da spec.
- Seed das 33 operações CRM com escopo idêntico ao do inventário de 03/10, todas como `lifecycle = candidata`.
- Entregar manifesto de destino de todas as entidades do inventário, incluindo UUIDs. MID/RENT/FUN/B2C só entram como operações com escopo comprovado; MAP/meta-name/COP são aliases quando comprovados; DOC é referência; ambiguidades ficam pendentes. Seguir §§3.2 e 14.4, sem transformar todos os prefixos em operações.
- **Não reescreva as notas do vault.** A recompilação é a fatia 8 e precisa de aprovação.

### 1.2 Configuração

- Migration aditiva: `growth_trigger_rules`, conforme a §4.4.
- Regras iniciais (versão 1, `mode = observacao`): `T1_crm_moderado`, `T2_crm_moderado`, `T5_frescor_<fonte>` e `T6_revisao_certificado`.
- Parâmetros da §4.3. Tolerâncias de T5 conforme a proposta da §11.2, marcadas como provisórias.

### 1.3 Motor

- Função SQL preparada como arquivo ou módulo puro: T1/T2 por operação e mês fechado; T5 por fonte/partição na data de avaliação; T6 no grão comprovadamente disponível no snapshot (§14.5). Não executar função com escrita em produção.
- Use **apenas** a definição de operação de `growth_operations`, não um agrupamento novo.
- Respeite as regras comuns da §4.2: janela de 6 meses fechados, regime Serasa, mês aberto sem disparo, ausência não é zero, amostra mínima, faixa e mediana.
- T6 compara o snapshot certificado do run `9bb55892` com a base atual. Fonte do snapshot: o artefato imutável `runs/9bb55892…/blueprints/report-build.json`, `content_hash 0033ccb3…`.
- Saída em **modo observação**: JSON e relatório locais com agregados e proveniência. Nenhuma tabela de staging em produção. **Nada em `report_action_candidates` ou `growth_feed_events` nesta fatia.**

### 1.4 Backtest — critério de aceite da fatia

Rode o motor de abril a setembro de 2026 e entregue `docs/plans/learning-loop/RELEASE_8_BACKTEST_2026-04_a_09.md` com:

- a tabela da §5.1 recalculada pelo seu motor, lado a lado com a da spec;
- a lista completa de gatilhos de setembro, comparada com os 9 da §5.2, linha a linha;
- os dois casos que **não podem** disparar (Dia · CRM e o CAC de Plurix · Aprovados não convertidos) e por que não dispararam;
- o T6 da Serasa de agosto (988 → 941);
- os T5 em seção separada, com `evaluation_as_of`, partição/plataforma e data observada. Comparar às referências reportadas (B2C 27/09, app 28/09, Serasa 12/07, Google sem linhas desde agosto), sem tratá-las como resultado obrigatório. Não simular conhecimento histórico sem logs de chegada.

**Falsificador:** divergência sem explicação linha a linha significa que a fatia não está pronta. Divergência explicada é achado; reporte e não ajuste o limiar para "bater".

### 1.5 Gates

- Testes do motor com fixtures sintéticas que cobrem:
  - mês aberto;
  - janela atravessando o regime da Serasa;
  - mês sem atividade;
  - amostra insuficiente;
  - fora da faixa sem passar na mediana: deve disparar com amostra/cobertura válidas;
  - dentro da faixa, passa no desvio da mediana sem materialidade: não dispara;
  - fronteiras exatas, mediana zero, execução com zero cartões versus ausência, custo zero/ausente, denominador zero, cobertura incompleta e idempotência;
  - usar os estados e saídas da §14.3.
- Testes Node e Vitest, `deno check`, build Vite, nenhum diagnóstico TypeScript novo e CI verde.
- Nenhum dado de produção em CI (POL002-00). O backtest roda por consultas somente leitura após conferir a POL002-00 vigente; registrar snapshot/data de leitura, hashes e versões. Só agregados permitidos entram no relatório e no commit; nenhuma linha individual é copiada para dev/CI.

---

## Guardrails

- Não altere `resolvePartner()`, a certificação, o contrato de imutabilidade nem a publicação vigente.
- Não encerre a publicação parada, não publique, não ative e não escreva no Google.
- Não escreva em `report_action_candidates`, `growth_feed_events` ou `growth_bets` nesta rodada.
- Migrations só aditivas.
- Ausência não é zero. Taxa é soma sobre soma. CPA de plataforma não é CAC.

## Ao terminar cada fatia

Reporte o que mediu, o que criou, onde está e o que divergiu da spec. Se decidir fazer diferente de algo aqui, diga o quê e por quê **antes** de fazer.


## Contratos de revisão v3 a verificar antes de encerrar

- Reportar quais premissas foram verificadas ao vivo, quais são inferidas e quais seguem sem evidência. Contagens, branches, datas e golden dos anexos não são confirmação atual.
- T1/T2 usam seis meses calendários anteriores, cortados pelo regime/vigência; mínimo de quatro meses elegíveis. Ausência, zero explícito e cobertura incompleta têm estados distintos. Fórmula e precisão seguem §14.3.
- Separar no backtest performance retrospectiva com base atual, frescor na data da consulta e revisão atual de certificado. Não usar dados conhecidos hoje como se estivessem disponíveis no passado.
- T6 valida hash, grão e contrato do snapshot antes da comparação. Se só houver grão parceiro, não distribuir valores pelas operações; reportar alteração necessária do aceite.
- Na fatia 1, não implementar migração de candidatas, IA, publicação ou fechamento de episódio. Preservar contratos futuros: ocorrência mensal (`signal_key`), série (`series_key`) e candidata persistente (`episode_id`) são diferentes.
- “Sem desvio detectado” exige métricas avaliáveis e cobertura declarada. Falta de dados/amostra não recomenda manter curso.
- Nenhuma escrita de produção é necessária para produzir o backtest: usar os arquivos propostos de configuração/registro como entrada local versionada. Operações candidatas são calculadas em observação; confirmação é gate de ativação.
- Apresentar divergências linha a linha. Golden explicado pode exigir revisão do aceite; explicação sozinha não autoriza ativação ou aplicação em produção.
