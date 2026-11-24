# Gestão de Dados V1 · Fase 0: diagnóstico do Importador Inteligente

Tela: Configurações > Importador Inteligente (`src/components/admin/IntelligentFrameworkUpdate.tsx`).
Fase 0 não muda comportamento. Entrega: fixture sintética, teste golden, baseline medido, gargalos e plano.

## O que entrou neste PR

| Arquivo | Para quê |
|---|---|
| `src/utils/importer-fixtures/syntheticDinamicaBI.ts` | Gerador determinístico (seed fixa) de export da Dinâmica BI e de histórico. 100% sintético. |
| `src/utils/intelligentUpdateEngine.golden.test.ts` | Trava a saída atual (candidatos, status, sugestões, confiança, avisos, TSV) nos 3 fluxos. |
| `src/utils/__golden__/intelligent-importer.golden.json` | Snapshot gravado do código de hoje. |
| `src/utils/intelligentUpdateEngine.baseline.test.ts` | Medição de performance. Só roda com `GAAS_BENCH=1`. |
| `docs/gestao-dados/baseline-fase0.json` | Números medidos. |

O golden foi validado com mutação: subir o limite de aprovação em massa de 90 para 99 derruba o teste
(`ready 2980 / review 389` vira `ready 671 / review 2698`).

## Como o fluxo funciona hoje

1. Usuário solta o arquivo. `parseFileToMatrix` lê com `FileReader` e Papa/XLSX **na thread principal**.
2. Para Total CRM e Rentabilização, `fetchDomainHistory` baixa `rentabilizacao_activities` inteira com
   `select *`, em páginas de 1.000 **em sequência** (cerca de 40 chamadas, uma depois da outra).
3. `safeProcessDinamicaBI` roda tudo de uma vez, síncrono: índice do histórico de Aquisição
   (`buildHistoryIndex` sobre todas as `activities` já carregadas no store), índice de Rentabilização,
   leitura dos 5 blocos, consolidação, e um `buildCandidate` por linha com `suggestAllFields`.
4. Entre as etapas há esperas artificiais para o loading pintar: 2 frames + 80 ms, 3 vezes frame + 40 ms,
   e um mínimo de 900 ms de loading visível (`keepLoadingVisible`).
5. A revisão filtra e ordena **todos** os candidatos em `useMemo` dentro de um componente de ~5.200 linhas
   com ~40 `useState`, e pagina de 100 em 100 sem virtualização.
6. Ao gravar: lotes de 100 (insert e RPC `bulk_update_activities_from_json`), depois recarrega
   `activities` e `rentabilizacao_activities` **inteiras** de novo para atualizar o store.
7. Histórico: últimas 20 execuções (`gaas_update_runs`); o detalhe vem cortado.

## Escala real (ordem de grandeza, nov/26)

- Arquivos colados: de 35 a 55 mil linhas.
- Histórico de Aquisição: ~12 mil disparos. Histórico de Rentabilização: ~40 mil.
- O baseline usa esses tamanhos de histórico com arquivos sintéticos de 2 a 50 mil linhas.

## Baseline medido (Node 24, máquina local)

Cada etapa abaixo é síncrona. No navegador, cada uma é uma tarefa longa: a tela inteira congela pelo tempo todo.

| Linhas do arquivo | Leitura CSV | Índice Rentab. | Aquisição | Rentabilização | **Total CRM (padrão)** | Candidatos | Candidatos em JSON |
|---|---|---|---|---|---|---|---|
| 2.000 | 12 ms | 2,4 s | 4,6 s | 0,5 s | **8,1 s** | 3.417 | 14,7 MB |
| 5.000 | 23 ms | 2,9 s | 8,7 s | 0,9 s | **12,4 s** | 7.560 | 32,6 MB |
| 10.000 | 23 ms | 2,0 s | 14,7 s | 1,7 s | **19,2 s** | 12.686 | 54,4 MB |
| 20.000 | 108 ms | 2,7 s | 28,6 s | 3,4 s | **36,9 s** | 18.978 | 81,2 MB |
| 50.000 | 220 ms | 3,0 s | 61,5 s | 2,6 s | **49,6 s** | 26.287 | 112,3 MB |

Leitura simples: num arquivo do tamanho real, a tela fica **congelada perto de 1 minuto** só no processamento,
fora o download do histórico. Com 10 mil linhas já são ~19 s.

Ressalvas: a fixture tem variedade limitada de assinaturas, então acima de ~20 mil linhas o número de candidatos
satura (26 mil candidatos a 50 mil linhas) e o tempo real em arquivos de 35 a 55 mil linhas tende a ser **maior**.
O total CRM a 50 mil saiu abaixo da Aquisição sozinha por aquecimento do JIT (a Aquisição roda primeiro).
Números brutos em `baseline-fase0.json`.

## Onde o tempo vai (perfil de CPU, arquivo de 5 mil linhas)

| Função | Tempo | Leitura |
|---|---|---|
| `buildCandidate` (por linha) | 7,4 s de 9,9 s | Quase todo o custo é por candidato |
| `suggestAllFields` | 6,2 s | Recalcula e ordena as sugestões dos 9 campos para cada linha, mesmo quando várias linhas têm o mesmo contexto (jornada, canal) |
| `normalize` + `normalizeKey` | 3,9 s | `NFD` + regex + minúsculas nas mesmas strings milhares de vezes, sem cache |
| `buildRentHistoryIndex` | 3,1 s | Índice dos ~40 mil registros refeito a cada arquivo |
| `inferDeterministicDimensions` | 2,4 s | Tokeniza e infere a taxonomia de novo por linha |
| `topSuggestionsFromBucket` | 1,3 s | Ordena buckets inteiros para pegar os 3 primeiros |
| `buildHistoryIndex` | 1,2 s | Índice das ~12 mil activities refeito a cada arquivo |

## Gargalos em ordem de impacto

1. **Processamento síncrono na thread principal.** A tela congela do soltar o arquivo até a revisão.
   É o que faz o app parecer travado ou o navegador oferecer "Aguardar / Fechar página".
2. **Sugestões recalculadas por linha.** `suggestAllFields` responde pela maior parte do tempo e repete o mesmo
   trabalho para linhas com o mesmo contexto. Cache por chave de contexto deve cortar a maior parte.
3. **Normalização sem cache.** ~40% do tempo de CPU em `normalize`. Um cache de string normalizada resolve
   sem mudar regra.
4. **Memória dos candidatos.** Cada candidato carrega listas de sugestões de 9 campos e a activity inteira
   casada. Já passa de 30 MB de JSON a 5 mil linhas; em arquivo real (35 a 55 mil) o risco de estourar a
   memória da aba é real.
5. **Histórico baixado inteiro a cada arquivo** (~40 chamadas em sequência, `select *`) e **de novo depois de
   gravar** (as duas tabelas). Rede e memória à toa.
6. **Esperas artificiais**: mais de 1 s de espera fixa somada ao processamento.
7. **Revisão e histórico no mesmo componente gigante.** Qualquer clique re-renderiza e refiltra tudo.
   Histórico limitado a 20 execuções.

O que **não** é gargalo: a leitura do CSV em si (Papa) é rápida, dezenas de ms mesmo em 50 mil linhas.

## Relação com o PR #150 (executor de CSV do Codex)

O PR GrowthAfinz/GaaS-Framework-Afinz#150, aberto em paralelo, move o motor do importador para
`src/utils/intelligentUpdateEngine.ts` (mesmas funções e nomes) para o modal e o executor de linha de comando
usarem o mesmo parser. Isso é exatamente o passo 1 do plano abaixo.

O golden foi gravado no código de antes do #150 e **passou sem nenhuma diferença rodando contra o código do
#150**: a extração preserva o comportamento. Este PR entra depois do #150 e testa direto
`src/utils/intelligentUpdateEngine.ts`, sem tocar no componente.

O cache incremental do #150 vive no executor de linha de comando (`scripts/crm-import/`), não na tela.
A tela continua baixando o histórico inteiro, então os passos 2 a 7 seguem valendo.

## Plano de arquitetura (Fase 1, sem mudar a cara)

Ordem pensada para cada passo ser pequeno, medido e protegido pelo golden.

1. **Domínio puro.** Já feito pelo #150 em `src/utils/intelligentUpdateEngine.ts`. A Fase 1 parte dele.
2. **Ganhos sem mudar regra, dentro do domínio:**
   - cache de `normalize` / `normalizeKey` por string;
   - cache de `suggestAllFields` por chave de contexto (as entradas que ele realmente lê);
   - `topSuggestionsFromBucket` com seleção dos N maiores em vez de ordenar tudo;
   - candidato guarda o id da activity casada, não o objeto.
3. **Web Worker.** `src/modules/data-import/worker/` recebe o `ArrayBuffer` do arquivo e o índice do histórico,
   devolve progresso por etapa e o resultado; aceita cancelar. Sai a espera artificial.
4. **Índice enxuto do histórico.** Selecionar só as colunas que a inferência usa, em paralelo, guardado em
   IndexedDB com versão e atualização incremental por `updated_at`. Depois de gravar, atualizar o índice com o
   que foi gravado, em vez de baixar as duas tabelas inteiras.
5. **Store da tela.** Slice Zustand no lugar dos ~40 `useState`, com seletores para cada parte.
6. **Virtualização** da revisão (proposta: `@tanstack/react-virtual`, dependência nova). Os 3 modos
   (Métricas, Dimensões, Operação) continuam sobre o mesmo conjunto, trocando colunas.
7. **Histórico paginado no servidor** com filtros, preparado para a tela nova da Fase 3.

Meta da Fase 1, medida com o mesmo baseline: nenhuma etapa síncrona acima de 50 ms na thread principal,
processamento de 50 mil linhas no worker em poucos segundos, memória estável em 5 arquivos seguidos.

## Como rodar

```powershell
npx vitest run src/utils/intelligentUpdateEngine.golden.test.ts
```

```powershell
$env:GAAS_BENCH='1'; npx vitest run src/utils/intelligentUpdateEngine.baseline.test.ts
```

## O que a Fase 0 não mediu

- Tempo de render da revisão no navegador e tarefas longas reais do React: entra na Fase 1, com o harness de
  Supabase mockado e `PerformanceObserver`.
- Latência real de rede do Supabase: o número de chamadas e o volume vêm da leitura do código e do tamanho das
  tabelas, não de medição no navegador.
