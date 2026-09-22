# Release 1 — workspace e relocação do Report Live

**Data:** 2026-09-22
**Branch:** `codex/growth-learning-release-1`
**Base:** `24720c2` — merge do contrato documental do PR #12

## Entrega

- novo destino global `aprendizado-growth`;
- entrada no menu Análise e no seletor interno de Relatórios;
- workspace `Fila | Apostas | Outcomes | Memória | Report Live`;
- query string compartilhável `?view=learning&section=<section>`;
- retorno por histórico do browser sem perder a seção;
- estados de fundação explícitos para as quatro áreas que ainda não possuem schema;
- operação existente do Report Live em `Aprendizado Growth > Report Live`;
- consumo da publicação ativa em `Relatórios`, sem controles de geração, certificação, publicação ou equipe;
- consulta separada da publicação válida e da candidata mais recente;
- preview local de desenvolvimento para o workspace e para o card de consumo.

## Contratos preservados

- nenhum endpoint ou payload do `report-sync` mudou;
- nenhuma migration foi criada;
- nenhuma navegação dispara build, certificação ou publicação;
- permissões existentes continuam decidindo quem gera, publica, baixa e administra membros;
- PDF continua vindo do artefato publicado;
- Sheet e Slides vivos permanecem destinos fixos;
- a candidata não aparece como output publicado.

## Evidência funcional

Na verificação read-only de 22/09/2026, os dois contextos exibiram a mesma publicação ativa:

- período `01/08/2026–31/08/2026`;
- versão `v8`;
- publicada em `13/09/2026 09:36`;
- `1.139` linhas sincronizadas.

O workspace operacional também exibiu, separadamente, a candidata certificada ainda não publicada. O card de consumo não a exibiu.

Screenshots de QA não versionados:

```text
ACALENDARIO APP/artifacts/learning-loop/release-1/feed.png
ACALENDARIO APP/artifacts/learning-loop/release-1/report-live.png
ACALENDARIO APP/artifacts/learning-loop/release-1/report-live-output.png
```

## Gates

- `npm test -- --run`: 18 arquivos, 129 testes;
- `npm run test:report-live`: 57 testes;
- `npm run test:report-live-office`: 3 testes;
- `npm run typecheck:release`: 57 diagnósticos históricos, zero novos;
- `npm run check:edge`: quatro entrypoints aprovados;
- `npm run build`: aprovado.

Warnings preexistentes e não ampliados:

- chunk principal acima de 500 kB;
- `dataService.ts` importado de forma estática e dinâmica;
- auditoria do `npm ci` reporta vulnerabilidades de dependências existentes.

## Fora desta release

- feed sistêmico com dados;
- apostas;
- outcome novo;
- memória;
- produtores de eventos;
- notificações externas;
- alteração de renderer, build ou publicação do Report Live.
