---
tags: [engenharia, gaas, decisoes]
tipo: engenharia
camada: codigo
tipo_diataxis: explanation
atualizado: 2026-06-08
status: legado
fonte: codigo-gaas
status_original: confirmado
legado_desde: 2026-10-29
---

# Decisões Técnicas

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver a documentação do repositório (`calendar-estrategico/docs/`) e o [[08-Engenharia/MOC-Engenharia|MOC de engenharia]].

Decisões de engenharia não óbvias, com contexto, escolha e trade-off. Marcações `(inferência)` onde o código não comprova a intenção.

## 1. Supabase como único backend, sem servidor próprio
- **Contexto**: ferramenta interna de growth, sem time de backend.
- **Escolha**: BaaS (Supabase) acessado direto do browser; toda lógica no cliente.
- **Trade-off**: velocidade de desenvolvimento altíssima vs. **segurança via RLS** (que está desligado — ver #3) e ausência de camada de negócio server-side. Credenciais expostas no client (ver #2).

## 2. Credenciais Supabase hardcoded no código
- **Contexto**: CLAUDE.md instrui `.env` com `VITE_SUPABASE_URL/ANON_KEY`.
- **Realidade**: `src/services/supabaseClient.ts` tem URL + `anon key` **hardcoded** e versionados.
- **Trade-off**: a `anon key` é projetada para ser pública *desde que* RLS proteja as tabelas. Como RLS está off (#3), a exposição vira risco real. Ver [[Dívida-Técnica]].

## 3. RLS desligado / "modo dev"
- **Contexto**: pasta raiz com `disable_rls.sql`, `fix_rls.sql`, `fix_rls_dev.sql`, `fix_all_rls_for_upload.sql`.
- **Escolha (inferência)**: RLS foi desabilitado para destravar uploads e escrita durante o desenvolvimento acelerado.
- **Trade-off**: qualquer um com a anon key lê/escreve as tabelas. Aceitável para protótipo interno; **bloqueador para exposição pública**. Ver [[Dívida-Técnica]] e camada de dados ([[Supabase-Schema]]).

## 4. IndexedDB apenas para estado de UI (não para dados)
- **Contexto**: CLAUDE.md descreve "Storage: IndexedDB via idb-keyval" sugerindo cache de dados.
- **Realidade**: `useAppStore.partialize` persiste só `journal`, `viewSettings`, `alertConfig`. Activities/framework vêm do Supabase a cada mount.
- **Trade-off**: dados sempre frescos e fonte única (Supabase) vs. sem modo offline e re-fetch a cada load. Há `version`/`migrate`/`onRehydrateStorage` para evoluir o shape persistido.

## 5. Parsing de CSV em Web Worker
- **Contexto**: arquivos de framework grandes (500+ disparos × 45 colunas).
- **Escolha**: `src/workers/csvWorker.ts` (Papaparse + XLSX + validação Zod), com timeout de 180s e `FileReader` no hook `useFrameworkData`.
- **Trade-off**: UI não congela vs. complexidade de mensageria (`WorkerMessage`/`WorkerResponse`) e dificuldade de debug.

## 6. Encoding Latin-1 no CSV
- **Contexto**: dados de origem (Salesforce/BI brasileiro) frequentemente em Latin-1.
- **Escolha**: parsing tolera Latin-1/UTF-8; `dataService` tem normalizadores de número BR (`R$`, milhar `.`, decimal `,`) e de mês PT (`jan`…`dez`).
- **Trade-off**: robustez com dados sujos vs. heurísticas frágeis de coerção espalhadas.

## 7. Versionamento de framework no app
- **Escolha**: `versionService` (dentro de `activityService.ts`) + `storageService` + tabela `framework_versions` + `supabase_versions.sql` guardam versões de CSV no Storage.
- **Trade-off**: histórico/rollback de dados vs. duplicação de armazenamento.

## 8. ML client-side heurístico (sem modelos)
- **Escolha**: pipeline determinístico no browser (ver [[Pipeline-ML]]).
- **Trade-off**: zero infra de ML, explicável e instantâneo vs. precisão limitada e rótulos "causais"/"Shapley" que excedem o que o código faz.

## 9. Estado dividido Zustand + Context
- **Escolha**: dados/aba no Zustand; período/BU/auth em Context.
- **Trade-off (inferência)**: separação evoluiu organicamente; hoje exige fusão manual em `App.tsx`. Ver [[Modelo-de-Estado]].

## 10. Três alvos de deploy simultâneos
- GitHub Pages (`gh-pages`, base `/GaaS-Framework-Afinz/`), Vercel (`vercel.json`) e Docker (`Dockerfile`). Ver [[Como-Rodar-e-Deploy]].
- **Trade-off**: flexibilidade vs. três configs de `base`/host para manter coerentes.

## Relacionado
- [[Arquitetura-Geral]]
- [[Modelo-de-Estado]]
- [[Pipeline-ML]]
- [[Dívida-Técnica]]
- [[Como-Rodar-e-Deploy]]
- [[Supabase-Schema]]
- [[MOC-Engenharia]]
