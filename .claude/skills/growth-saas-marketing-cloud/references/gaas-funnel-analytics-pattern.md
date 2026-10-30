# Padrão GaaS para Funis Analíticos

Usar este padrão ao criar ou evoluir telas de Funil de Aquisição, Funil B2C, Funil de Mídia Paga e a futura síntese Growth.

## Referência validada

- Produto: GaaS Afinz.
- Implementação-base: `calendar-estrategico/src/components/FunilAquisicaoView.tsx`.
- Página: Funil de Aquisição Serasa, validada em julho de 2026.
- Intenção visual: Excel/Power BI técnico, denso e operacional; evitar dashboard decorativo.

## Hierarquia da página

1. Contexto: título, escopo da fonte, freshness e período analisado.
2. Funil completo: cards compactos com volume, taxa, delta e status da etapa.
3. Evolução do funil: gráfico combinado de barras de volume e linhas de taxas.
4. Diagnóstico rápido: maior perda, melhor evolução, qualidade da fonte e último dia fechado.
5. Detalhe diário: tabela ordenável, exportável e com comparação D-1.

Manter essa ordem para permitir leitura `estado -> tendência -> detalhe`.

## Gráfico combinado

- Abrir em visão Diária; oferecer Diária, Semanal e Mensal dentro do módulo do gráfico.
- Não separar Volume e Taxas em modos distintos.
- Usar barras no eixo esquerdo para volumes absolutos e linhas no eixo direito para percentuais.
- Permitir selecionar volumes e taxas de forma independente.
- Se nenhum volume estiver selecionado, continuar exibindo as linhas e ocultar o eixo de volume.
- Limitar a quatro linhas simultâneas.
- Desativar animações para reforçar a leitura técnica e evitar ruído.
- Usar linhas de alto contraste e pontos vazados; não depender apenas de cor para legenda ou tooltip.
- Identificar semanas parciais pelo intervalo real, por exemplo `20/07–21/07`.

## Controles

- Usar barras retas, compactas e segmentadas, inspiradas em filtros do Excel.
- Evitar chips arredondados grandes, toggles ornamentais e espaço vertical excessivo.
- Separar semanticamente `Volumes` e `Taxas` em duas faixas consecutivas.
- Manter estado selecionado visível por cor, texto e fundo/borda.
- Oferecer `Todos` e `Limpar` para volumes; preservar o limite explícito nas taxas.

## Funil completo

Cada etapa deve mostrar:

- número e nome da etapa;
- volume do período;
- taxa compatível, quando certificada;
- delta contra janela anterior equivalente;
- classificação: confirmado, conversão, cobertura, cobertura parcial ou resultado.

Não forçar sequência causal onde existe apenas cobertura operacional. Dado ausente deve aparecer como qualidade da fonte, nunca ser convertido silenciosamente em zero.

## Detalhe diário

- Ordenar por data crescente por padrão.
- Permitir ordenação em todas as colunas.
- Exibir data e dia da semana.
- Mostrar volume e variação contra D-1 com seta, cor e valor.
- Destacar mudanças fortes sem transformar toda a tabela em heatmap.
- No hover, mostrar microtendência dos últimos 15 dias fechados da métrica, com mínimo, média, máximo e fórmula.
- Preservar exportação CSV/XLSX conforme o módulo.

## Contrato de métricas

Definir antes da UI:

- evento ou entidade de cada etapa;
- numerador, denominador e unidade de cada taxa;
- janela temporal e regra de dia fechado;
- fonte, freshness e classificação de confiança;
- compatibilidade entre etapas e limites de atribuição.

Para cada novo funil, mapear `StageKey`, `RateKey`, fórmula, cor, status e regra de nulidade. Não reutilizar uma taxa apenas porque o nome parece equivalente.

## Variações futuras

### Funil B2C

Reusar a estrutura visual, substituindo etapas e taxas somente após certificar a granularidade diária e a identidade das etapas. Manter Serasa e APP separados enquanto não houver correlação validada.

### Funil de Mídia Paga

Adaptar barras para investimento, impressões, cliques, leads e conversões; linhas para CTR, CPC, CVR e taxas certificadas. Nunca tratar CPA de plataforma como CAC de cartão.

### Síntese Growth

Não somar funis incompatíveis. Construir uma camada de síntese com poucos sinais comparáveis:

- entrada qualificada;
- avanço/conversão certificada;
- resultado final;
- eficiência;
- maior gap;
- confiança e freshness.

Permitir drill-down para cada funil de origem e manter explícito o que é confirmado, direcional, suspeito ou bloqueado.

## Gate de validação

Antes de publicar:

1. validar fórmulas e períodos;
2. testar seleção apenas de taxas;
3. testar Diária, Semanal e Mensal;
4. verificar ordenação e hover da tabela;
5. comparar visualmente com a referência técnica;
6. rodar build e checar console;
7. publicar somente após QA aprovado.
