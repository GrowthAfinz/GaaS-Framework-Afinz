# Atualizador Inteligente GaaS

**Area:** Configuracoes > Atualizacao Inteligente  
**Componentes principais:** `src/components/admin/IntelligentFrameworkUpdate.tsx`, `src/services/intelligentUpdateService.ts`  
**Tabelas envolvidas:** `activities`, `gaas_update_runs`, `gaas_dinamica_bi_metrics`, `gaas_update_candidates`

---

## Objetivo

O Atualizador Inteligente existe para transformar a aba `Dinamica BI` do framework em linhas revisaveis e gravaveis na base de dados, sem depender do usuario colar o conteudo bruto no Excel manualmente.

Ele foi desenhado primeiro para campanhas de Aquisicao, mas a arquitetura ja separa parsing, classificacao, revisao humana e persistencia. Isso permite expandir o fluxo para Rentabilizacao, desde que as regras de taxonomia, campos humanos e saidas do framework sejam ajustadas.

---

## Entrada

O usuario pode arrastar ou selecionar arquivos:

- `.xlsx`
- `.xls`
- `.csv`
- `.tsv`
- `.txt`

A entrada esperada e a aba `Dinamica BI`, nao a aba final do framework. O conteudo bruto nao e renderizado em tela para evitar custo de front e travamentos com arquivos grandes.

O parser aceita blocos horizontais da Dinamica BI para:

- WhatsApp
- E-mail
- SMS
- Push
- Performance

O bloco de Performance nao cria campanha sozinho. Ele complementa candidatos ja acionaveis, principalmente com propostas, aprovados e emissoes.

---

## Chave de novidade

A chave operacional atual e:

```text
JourneyName + ActivityName + Canal + Data
```

Essa decisao foi tomada porque jornadas de carrinho podem ter varias activities no mesmo dia, no mesmo canal e na mesma jornada. A chave antiga `JourneyName + Canal + Data` agrupava demais e escondia disparos distintos.

Tambem existe uma assinatura anti-renomeacao:

```text
ActivityName + Canal + Data
```

Ela ajuda a detectar quando uma jornada foi renomeada no SFMC e passou a aparecer duplicada com outro `JourneyName`.

Excecao ja tratada:

- `JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO`
- `JOR_AQUISICAO_PLURIX_CARRINHO_ABANDONADO_INDEPENDENTE`

Essas duas jornadas sao tratadas como a mesma familia logica de carrinho abandonado Plurix, para evitar conflito falso.

---

## Regras de candidato

Um disparo so vira candidato quando possui:

- `Base Total > 0`
- `Base Acionavel > 0`

Linhas sem entrega/base acionavel sao ignoradas para evitar gravar dias sem disparo real.

As metricas D0, D1 e D2 podem ser consolidadas no disparo acionavel quando existe ancora compat vel por `ActivityName + Canal` dentro do periodo de atribuicao.

---

## Campos automaticos e humanos

Campos vindos diretamente da Dinamica BI:

- Jornada
- Activity name / Taxonomia
- Canal
- Data de Disparo
- Base Total
- Base Acionavel
- Abertura
- Cliques
- Propostas
- Aprovados
- Cartoes Gerados
- Emissoes Independentes
- Emissoes Assistidas

Campos inferidos por taxonomia/historico:

- BU
- Parceiro
- Segmento

Campo padrao:

- Produto = `Cartao`

Campos humanos com sugestao historica:

- Subgrupo
- Etapa de aquisicao
- Perfil de credito
- Oferta
- Promocional

Defaults aplicados antes de copiar/subir:

- campos dimensionais vazios viram `N/A`
- Oferta vazia vira `Padrao`
- Produto vazio vira `Cartao`
- canal `PUSH`/`push` e normalizado como `Push`

---

## Review Sheet

A experiencia de revisao fica em um modal com:

- header com nome do arquivo e totais;
- filtros por status;
- busca por JourneyName, Activity name, canal, data, BU, parceiro, segmento e subgrupo;
- tabela paginada de candidatos;
- campos automaticos em leitura;
- campos humanos editaveis;
- botoes para aceitar, ignorar e ver metrica;
- footer fixo para copiar linhas, baixar CSV e confirmar atualizacao.

Status principais:

- `ready`: sugestoes fortes, normalmente aprovaveis em lote;
- `review`: sugestoes existem, mas exigem revisao;
- `new`: faltam sugestoes humanas;
- `duplicate`: duplicado dentro do arquivo;
- `conflict`: possivel renomeacao de jornada;
- `error`: linha sem chave minima;
- `ignored`: descartada pelo usuario ou por regra.

---

## Copia para Excel

O botao `Copiar linhas` gera texto TSV sem cabecalho. Ao colar na primeira celula livre da aba do framework, o Excel distribui as colunas automaticamente.

Regras:

- se houver linhas selecionadas, copia as selecionadas;
- se nao houver selecao, copia as aceitas;
- valores vazios sao normalizados para manter compatibilidade com o modelo historico do Excel.

---

## Upload para base de dados

O botao `Confirmar Atualizacao` abre um modal compacto antes de gravar.

O modal mostra:

- arquivo de origem;
- quantidade de linhas que serao gravadas;
- pendencias que ficarao fora;
- duplicadas;
- erros;
- blocos detectados;
- defaults aplicados;
- auditoria que sera salva.

O envio efetivo so acontece no botao `Enviar para base de dados`.

Persistencia:

1. cria uma linha em `gaas_update_runs`;
2. salva apenas as metricas ligadas ao lote confirmado em `gaas_dinamica_bi_metrics`;
3. insere ou atualiza campanhas na tabela `activities`;
4. salva candidatos auditados do lote em `gaas_update_candidates`;
5. atualiza o status da run para `applied` quando houve gravacao.

Importante: o upload nao salva mais a Dinamica BI inteira. Ele salva apenas o lote aprovado/selecionado, em batches, seguindo a mesma logica de robustez do uploader do Gerenciador de Dados.

---

## Relacao com o uploader do Gerenciador de Dados

O uploader historico do Gerenciador de Dados parte de um CSV completo do Framework ja finalizado. Ele transforma linhas em registros de `activities` e envia em lotes.

Referencias:

- `src/components/admin/DataMigration.tsx`
- `src/services/activityService.ts`
- `src/workers/csvWorker.ts`

O Atualizador Inteligente nao substitui esse fluxo. Ele e um caminho incremental:

- entrada: Dinamica BI;
- saida: novas campanhas revisadas;
- persistencia: append/update de campanhas confirmadas;
- auditoria: run + metricas + candidatos.

---

## Como expandir para Rentabilizacao

Para incluir campanhas de Rentabilizacao, os pontos de decisao sao:

1. **Taxonomia**
   - Mapear como identificar Rentabilizacao por `JourneyName` e `ActivityName`.
   - Definir novos segmentos/subgrupos/produtos/ofertas se forem diferentes de Aquisicao.

2. **Escopo de Produto**
   - Hoje `Produto` assume `Cartao`.
   - Rentabilizacao pode exigir `Produto` diferente ou uma regra baseada em taxonomia.

3. **Campos humanos**
   - Revisar se `Subgrupo`, `Etapa`, `Perfil`, `Oferta` e `Promocional` continuam suficientes.
   - Se houver campos especificos de rentabilizacao, incluir no tipo `HumanField` e no Review Sheet.

4. **Chave de novidade**
   - Validar se `JourneyName + ActivityName + Canal + Data` continua suficiente.
   - Se rentabilizacao usar muitas activities reutilizadas entre jornadas, pode ser necessario adicionar outro identificador.

5. **Regras de candidato**
   - A regra atual exige `Base Total > 0` e `Base Acionavel > 0`.
   - Para rentabilizacao, confirmar se o mesmo criterio define disparo acionavel.

6. **Output Excel**
   - Atualizar `FRAMEWORK_HEADERS` ou criar headers especificos se a planilha de rentabilizacao tiver colunas diferentes.

7. **Relatorios XLSX**
   - Criar um exportador separado, por exemplo `src/utils/rentabilizacaoCrmExcelExport.ts`, reaproveitando o padrao do exportador de Aquisicao.

---

## Exportador de relatorios XLSX

Atualmente nao ha script Python versionado no repositorio para o relatorio de planilha. O exportador disponivel esta em TypeScript e roda no front:

```text
src/utils/aquisicaoCrmExcelExport.ts
```

Ele usa `exceljs` para montar um `.xlsx` com:

- aba `Aquisicao CRM`;
- aba `Auditoria`;
- secoes fixas por BU/parceiro/bloco;
- blocos como topo de funil, repescagem, upgrade, leads parceiros, carrinho abandonado e recencia;
- datas do periodo selecionado;
- metricas por dia/canal/bloco;
- cores e estilos por secao e canal;
- formulas de total no fim de cada secao;
- auditoria de linhas fora do mapeamento.

Fluxo do exportador:

1. `exportAquisicaoCrmXlsx(start, end)` e chamado pela interface.
2. `fetchSupabaseRows()` busca `activities` no periodo.
3. `fetchB2cDailyMetrics()` busca realizados B2C diarios.
4. `buildIndexes()` classifica linhas em blocos do relatorio.
5. `buildWorkbook()` cria workbook ExcelJS.
6. `writeSection()` escreve secoes e totais.
7. `writeAuditSheet()` escreve diagnostico de mapeamento.
8. `downloadBuffer()` baixa o arquivo no navegador.

Classificacao atual:

- `classify(row)` decide em qual secao/bloco a campanha entra.
- `auditReason(row)` explica por que uma linha ficou fora.
- `normalizeChannel(row.Canal)` transforma canais do framework para o formato do relatorio (`E-MAIL`, `WPP`, `SMS`).

Limitacoes atuais:

- `Push` ainda nao tem estilo dedicado no relatorio XLSX de aquisicao.
- `Seguros/Rentabilizacao` aparece como fora do escopo na auditoria.
- As regras sao especificas de Aquisicao CRM.
- O exportador roda no front; arquivos muito grandes podem aumentar consumo de memoria no navegador.

Para criar um exportador de Rentabilizacao:

1. copiar a estrutura de `aquisicaoCrmExcelExport.ts`;
2. criar novas `SECTIONS` e blocos de rentabilizacao;
3. reescrever `classify(row)`;
4. definir cores e ordem de canais;
5. manter aba `Auditoria` desde o primeiro corte;
6. criar funcao publica `exportRentabilizacaoCrmXlsx(start, end)`;
7. conectar a funcao na UI de relatorios.

---

## Arquivos principais

| Arquivo | Responsabilidade |
|---|---|
| `src/components/admin/IntelligentFrameworkUpdate.tsx` | UI, parser da Dinamica BI, Review Sheet, busca, selecao, copia e confirmacao |
| `src/services/intelligentUpdateService.ts` | Persistencia da run, metricas, candidatos e activities |
| `src/services/activityService.ts` | Sync do Framework CSV completo para `activities` |
| `src/services/dataService.ts` | Leitura de `activities` e normalizacao para o app |
| `src/components/admin/DataMigration.tsx` | Uploader antigo do Gerenciador de Dados |
| `src/utils/aquisicaoCrmExcelExport.ts` | Exportador XLSX atual de Aquisicao CRM |
| `supabase/migrations/007_create_intelligent_update_tables.sql` | Tabelas de auditoria do Atualizador Inteligente |

---

## Cuidados antes de alterar

- Nao mudar a chave de novidade sem validar carrinho abandonado e jornadas renomeadas.
- Nao voltar a salvar a Dinamica BI inteira no upload confirmado; isso deixa o front lento.
- Manter `Push` como grafia canonica de canal.
- Manter copia TSV sem cabecalho para compatibilidade com Excel.
- Validar com arquivo pequeno antes de enviar centenas de linhas.
- Ao expandir para Rentabilizacao, preferir novo conjunto de regras em vez de misturar regras dentro de `classify()` sem separacao clara.

