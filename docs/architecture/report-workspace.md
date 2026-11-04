# Template compartilhado de relatórios

Aquisição e Seguros usam as mesmas cinco visões primárias, na mesma ordem: Overview, Diário, Mensal, Evolução e anomalias e Relatórios. A frente define fontes, métricas, denominadores e ações; não mantém uma cópia do layout. As rotas continuam independentes.

## Componentes canônicos

| Componente | Responsabilidade | Consumidores |
|---|---|---|
| `ReportWorkspaceHeader` / `REPORT_VIEWS` | Cabeçalho teal, tipografia, ordem, nomes e estado ativo das cinco abas; slots de resumo, ação e KPIs | Aquisição e Seguros |
| `ReportKpiStrip` | Faixa branca de quatro indicadores, divisórias e comportamento responsivo | Aquisição e Seguros |
| `ReportDailyModeControl` | Diário / Acumulado | Diário de Aquisição e Seguros |
| `ReportMonthRangeControl` | Atalhos 3M / 6M / 12M | Mensal de Aquisição e Seguros |
| `ReportChartPanel` | Card, bordas, espaçamento e sombra dos gráficos | Gráficos diários de Aquisição e gráficos compartilhados |
| `ReportTimeSeriesChart` | Gráfico de barras, eixos, tooltip, legenda e slots de métricas/filtros | Mensal de Aquisição e visões temporais de Seguros |
| `ReportDataTable` | Cabeçalho escuro, primeira coluna fixa, zebra, formatação por coluna; seleção de colunas e CSV opcionais | Consolidado mensal de Aquisição e tabelas de Seguros |
| `ReportDeliveryLayout` | Grid de arquivos e publicação/estado da entrega | Relatórios de Aquisição e Seguros |

`RelatorioView`, `MonthlyReportView`, `DailyReportView` e seus adaptadores preservam as regras existentes de CRM. `InsuranceReportViews` e `insuranceReportModel` fornecem o modelo de Seguros. Nunca converter contratações em campos chamados emissões para satisfazer uma interface de Aquisição.

## Contrato de Seguros

- Overview: cadastros, contratações, investimento, custo/contratação, desempenho por produto e canais CRM em universos separados.
- Diário: registros da Base de disparos, por dia e canal; acumulado mantém ausências e não cria dias ou vendas. Não atribuir um disparo a um produto por semelhança do nome.
- Mensal: produto, contratações, cadastros e investimento; custo agregado é SUM/SUM. MoM somente entre meses consecutivos completos, sem base ausente ou zero. A parcialidade informada pela fonte bloqueia a comparação do último mês.
- Evolução e anomalias: alterna desempenho e ocorrências verificáveis de dados; candidatos a teste não são excluídos automaticamente. Os alertas não afirmam causalidade de negócio.
- Relatórios: arquivos, comitê, fontes/revisão, carteira, cenários e versões. A ingestão não aparece como seção operacional em todas as visões do BI.

O resultado final é contratação confirmada após formulário da LP. O XLSX atual informa contratações agregadas por mês, sem eventos individuais para auditá-las. A contratação diária permanece ausente, não zero e não proporcional ao volume de cadastros. Novos adaptadores devem declarar sua granularidade antes de habilitar métricas e agrupamentos.

## Comparação e verificação

A comparação visual inicial encontrou diferenças de hierarquia, altura do cabeçalho, navegação e exposição de controles administrativos. Aquisição tinha cinco abas dentro do cabeçalho e faixa de KPIs; Seguros tinha nove botões fora do cabeçalho e ingestão na leitura principal. O template compartilhado remove essa duplicação. Os gráficos e a tabela mensal agora usam o mesmo renderer, com definições de métricas próprias.

Capturas do produto publicado e do preview local com cópias dos arquivos reais ficam em `artifacts/insurance-local/visual-audit/`, fora do Git. Elas não são publicadas com dados da operação. A referência de Aquisição usa a sessão publicada; o preview de Seguros é sem autenticação e sem gravação. Diferenças de fonte, granularidade e estado de carga não devem ser interpretadas como diferenças de renderização. A igualdade dos componentes não certifica o conteúdo das fontes nem substitui validação autenticada de ingestão.

Validar com `npm test`, `npm run typecheck:release` e `npm run build`. Os testes de domínio verificam separação entre cadastro e contratação, ausências, zero, custo SUM/SUM, restrição de produto no diário, acumulado por canal e limites de comparação mensal.
