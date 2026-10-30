# Visualization

## 1. Escolher o componente pela pergunta

Usar KPI card quando a pergunta for:

- qual e o estado agora?
- qual foi o delta?
- estou acima ou abaixo da meta?

Usar linha quando a pergunta for tendencia ao longo do tempo.
Usar barra quando a pergunta for comparacao entre categorias.
Usar stacked bar quando a composicao importa e o numero de categorias e controlado.
Usar scatter quando a pergunta for relacao entre duas variaveis.
Usar heatmap quando a leitura depender de padrao em matriz temporal ou dimensional.
Usar tabela quando o usuario precisa comparar, ordenar, exportar, buscar ou agir por linha.

Evitar pie em cenarios com muitas categorias ou comparacao precisa.

## 2. Regras praticas de graficos

- Limitar series simultaneas; acima de quatro, simplificar ou separar.
- Usar reference line para meta, threshold ou evento.
- Destacar serie principal e neutralizar contexto.
- Formatar eixos de acordo com unidade real: %, moeda, volume, tempo.
- Mostrar zero quando zero e semanticamente importante; omitir quando atrapalha escala sem perda de interpretacao.

## 3. Regras praticas de tabelas

- Definir colunas com prioridade explicita.
- Fixar cabeçalho e, se necessario, primeira coluna.
- Permitir ordenacao previsivel.
- Usar zebra sutil apenas se ajudar tracking visual.
- Colocar acoes proximas do dado, sem poluir a linha inteira.
- Expor selecao, bulk actions e exportacao apenas quando agregam fluxo real.

## 4. Formatação

- Percentual com criterio consistente de casas e sufixo.
- Valores grandes com abreviacao apenas quando a audiencia aceita.
- Datas e janelas com linguagem nao ambigua.
- Mostrar unidade sempre que houver risco de confusao.

## 5. Acessibilidade

- Nao depender so de cor para diferenciar series.
- Garantir contraste suficiente em eixos, labels e marcas.
- Preferir patterns ou decals quando o grafico exigir mais de cor.
- Permitir leitura por teclado e foco em tabelas.
- Pensar em descricao acessivel para charts relevantes.

## 6. Performance e renderizacao

- Lazy-load de charts fora da viewport.
- Usar agregacao antes de despejar granularidade maxima.
- Escolher SVG ou Canvas conforme densidade da visualizacao.
- Cuidar com tooltip HTML e entradas nao confiaveis.

## 7. Bibliotecas e implicacoes

Recharts:

- rapido para dashboards React convencionais
- bom para linhas, barras, composed e cartoes exploratorios
- menos confortavel para visualizacoes mais densas ou muito customizadas

ECharts:

- melhor quando houver heatmaps, grafos, coordenadas paralelas, custom series ou volume alto
- oferece recursos explicitos de ARIA e escolha entre Canvas e SVG

Data grid maduro:

- importante quando a tabela for produto, nao apendice
- keyboard navigation, densidade, sorting e filtros deixam de ser detalhe

## 8. Fontes externas consultadas

- Atlassian data visualization color: https://atlassian.design/foundations/color/data-visualization-color/
- Atlassian accessibility foundations: https://atlassian.design/foundations/accessibility
- MUI Data Grid accessibility and density: https://mui.com/x/react-data-grid/accessibility/
- Apache ECharts features: https://echarts.apache.org/en/feature.html
- Apache ECharts ARIA best practices: https://echarts.apache.org/handbook/en/best-practices/aria/
- Apache ECharts Canvas vs SVG: https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/

