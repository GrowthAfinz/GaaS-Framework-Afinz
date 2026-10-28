# Release 8 — fatia 1 em observação

Data de referência: 27/10/2026, America/Sao_Paulo.
Base: `73ccd4bdbca48d45b717742c61c021aad838b8e8` (`origin/main`).

## Escopo entregue

- Motor puro em `supabase/functions/_shared/growth-trigger-engine.ts`: T1/T2 por operação, T5 por fonte/partição e T6 por escopo certificado comprovado.
- Comparações racionais exatas com BigInt, sem arredondamento para decidir limiares. Frações exatas acompanham a apresentação numérica.
- Estados separados para mês aberto, ausência, zero observado, cobertura incompleta, denominador inválido e amostra insuficiente.
- Migration aditiva `20261028022014_growth_trigger_observation_release_8.sql`, gerada pela CLI: operações, histórico imutável do registro e regras versionadas. RLS habilitada; sem acesso de anon/authenticated; acesso de manutenção restrito ao serviço.
- Seed revisável separado em `release8/seed.sql`, gerado por `scripts/build-growth-trigger-registry.py` a partir do inventário de 03/10. Nenhum upsert silencioso sobre um registro já existente.
- 103 operações candidatas: 33 CRM, 18 MID com frente classificável, 43 RENT, 6 FUN e 3 B2C. Seguros só por família explícita; BU Seguros com nome de teste não basta.
- Destino explícito das 164 entidades: 103 operações, 12 recortes Copa fora de escopo, 10 entradas documentais e 39 pendências. MAP/meta-name não recebem alias por semelhança; MID sem frente comprovada permanece pendente.
- Nove regras v1 em observação: T1, T2, seis partições T5 e T6. T3/T4 não implementados/ativados nesta fatia.
- Backtest reprodutível em `RELEASE_8_BACKTEST_2026-04_a_09.md`, acompanhado de consultas e agregados auditáveis.

## Achados que impedem ativação

A implementação explica a divergência com o golden sem mudar limiar. Setembro tem cinco sinais T1 avaliáveis, em vez dos nove reportados na spec: os quatro restantes têm cartões ausentes no alvo ou no histórico. O diagnóstico que ignora os contadores de ausência reproduz todos os totais mensais da §5.1; permanece explicitamente inválido para aceite.

T6 reproduz Serasa agosto 988→941 no grão de parceiro. As abas congeladas não expõem BU; os chunks de fonte são referenciados, mas não foram hidratados nesta fatia. Não há distribuição dessa diferença por operação. A versão revisada permite reportar essa limitação; ativação que exija grão de operação continua bloqueada.

As vigências iniciais do registro significam primeiro mês observado no inventário, não confirmação do início comercial. Confirmação humana das operações é pendente. Cobertura de campos não certifica completude de ingestão da população inteira.

## Reprodução

1. Gerar registro/seed com `python scripts/build-growth-trigger-registry.py --inventory <registro.json original> --output docs/plans/learning-loop/release8`.
2. A consulta `release8/read-aggregates.sql` é somente leitura. Uma nova leitura produz outro snapshot e deve ser identificada como nova revisão; não sobrescrever evidência histórica sem registrar a mudança.
3. Rodar `node scripts/build-growth-trigger-backtest.mjs --golden <artefato local imutável>` para verificar hashes e extrair somente evidência agregada. A opção sem golden reutiliza a extração verificada `certified-evidence.json` para reproduzir o relatório; não recertifica o objeto remoto.
4. Testes sintéticos: `npm run test:growth-triggers`, `npm test`, `npm run check:edge`, `npm run typecheck:release`, `npm run build`.

As regras de versões sobrepostas falham fechadas. A ativação/substituição de versões futuras exige um contrato de seleção temporal revisado; não atualizar uma definição imutável para fazer a troca. O catálogo é preparado para observação, não uma API de ativação.

## Fronteira de produção

Nenhuma migration, seed, deploy, publicação, encerramento do job antigo, mudança de ponteiro, confirmação ou ativação foi aplicada. O motor não é importado pelo produtor do feed ou pelo dispatcher. `feed_eligible` permanece falso nesta fatia, mesmo se for fornecida uma regra ativa.

Não foram alterados `resolvePartner()`, a certificação, o contrato de imutabilidade, o vault ou tabelas de candidatas/apostas. A integração do PR #33 é uma branch/PR separados, sem dependência necessária para rodar o motor em observação.

## Validação

Os testes Node da fatia cobrem 29 casos de negócio sintéticos e um teste de schema com PostgreSQL embarcado (30/30), incluindo privilégios, RLS, confirmação explícita, unicidade e histórico imutável. A mesma matriz de negócio roda em Vitest. CI não lê os agregados observados nem usa credenciais de produção.

O primeiro teste frontend local encontrou ENOSPC em exportação Python; a validação foi transferida para D: com TEMP/TMP próprios e dependências de lockfile idêntico. A remoção do diretório temporário de dependências em C: foi rejeitada pela revisão automática e não foi executada. Resultados finais de CI devem ser consultados no SHA do PR.
