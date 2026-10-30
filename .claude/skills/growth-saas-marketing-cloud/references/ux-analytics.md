# UX Analytics

## 1. UX orientada a decisao

Em software analitico, a pergunta central nao e "esta bonito?", mas:

- consigo entender o estado em segundos?
- consigo localizar o problema sem abrir cinco telas?
- consigo agir sem reconstruir contexto?
- consigo auditar por que o sistema recomendou aquilo?

Organizar a experiencia em quatro niveis:

- Glance: 2 segundos. Estado geral, principal alerta, melhor oportunidade.
- Scan: 10 segundos. Delta, segmento, canal, jornada, etapa do problema e comparativos.
- Drill: sob demanda. Template, activity_name, campanha, jornada, disparo, experimento ou evento.
- Action/Audit: aceitar, revisar, aplicar, desfazer, ver fonte, regra, amostra e confianca.

## 2. Padrao operator-owner

Para operacoes de growth, CRM e midia, toda tela analitica deve ajudar o operador a responder:

1. A operacao esta saudavel, em risco ou comprometida?
2. O desvio vem de dados, volume, funil, custo, mix, criativo ou execucao?
3. Qual dimensao explica a mudanca: BU, canal, segmento, parceiro, jornada, template ou activity_name?
4. Qual acao deve ser tomada hoje?
5. Qual e a confianca da leitura?

Usar a cadeia:

`Sinal -> Impacto -> Causa provavel -> Evidencia -> Acao -> Confianca`

Se a tela so descreve o passado, ela ainda nao e uma tela de decisao.

## 3. Narrativa antes de visualizacao

Cada secao deve abrir com uma frase humana curta. O grafico valida a frase; nao o contrario.

Boas estruturas:

- `Meta ameacada por queda de clique em CRM.`
- `Canal pago manteve volume, mas perdeu eficiencia em segmentos frios.`
- `Template S1D02 tem bom alcance, mas conversao abaixo dos pares da mesma semana.`
- `Sugestao de vinculo bloqueada: parceiro diverge do template selecionado.`

## 4. Filtros e navegacao

- Manter filtros em barra persistente, nao em modal escondido.
- Exibir filtros ativos como chips removiveis.
- Sincronizar filtros globais com abas especificas quando a semantica for igual.
- Preservar contexto em drill-down usando drawer, modal lateral ou painel sobreposto.
- Usar command palette e atalhos quando o usuario e recorrente.
- Tornar busca global uma forma de navegacao, nao um extra.
- Em listas longas, mostrar contagem filtrada e total: `15 de 49 templates`.

No GaaS, filtros de BU, canal, jornada, segmento, parceiro e subgrupo devem ser visiveis e auditaveis. Nao esconder por que um item apareceu ou sumiu.

## 5. Estados sistemicos obrigatorios

Cada modulo deve definir:

- loading: skeleton com forma real, nao spinner generico
- empty: explicar por que esta vazio e sugerir proxima acao
- error: dizer o que falhou, quando, e como recuperar
- stale: informar defasagem ou ultima sincronizacao
- partial: dado incompleto, mas ainda utilizavel com limite
- blocked: dado insuficiente para conclusao ou acao segura
- conflict: campos ou fontes discordam
- reviewed: humano confirmou

Para sugestoes inteligentes, `empty` nao deve dizer apenas "sem sugestoes"; deve explicar qual corte falhou: canal, parceiro, segmento, campanha, semana, ordem ou baixa amostra.

## 6. Densidade certa para cada publico

- Operador diario prefere tabela compacta, atalhos, bulk actions e persistencia de filtros.
- Analista precisa drill, regra de calculo, origem e exportacao.
- Lider funcional precisa scan rapido, diagnostico e acoes priorizadas.
- Executivo precisa resumo, contexto, risco e impacto, nao granularidade crua.

Permitir alternancia de densidade quando a ferramenta for usada por perfis mistos.

## 7. Semantica visual

- Verde, vermelho e amarelo devem carregar significado, nao decorar.
- Azul e neutros funcionam para contexto, navegacao e comparativos nao criticos.
- Consistencia de cor vale mais do que exuberancia.
- Texto e eixo devem continuar legiveis sem depender de tooltip.
- Score deve ter escala, legenda e metodo acessivel.

Para GaaS:

- verde = pronto, alta confianca, no ar ou bom desempenho
- amarelo/laranja = revisar, baixa amostra, semana diferente, risco moderado
- vermelho = bloqueio, conflito forte, dado insuficiente ou performance critica
- cinza = ausente, planejado, inativo ou sem dado

## 8. Interacoes que valem a pena

Usar motion apenas quando ajuda:

- transicao loading -> loaded
- entrada progressiva de cards ou linhas
- abertura de drawer e contextualizacao
- feedback imediato apos vincular, excluir, substituir ou salvar

Evitar animacao de vitrine.

Interacoes importantes para operacao:

- clicar em ponto de grafico abre detalhe do dia/disparo sem perder o template
- voltar retorna ao contexto anterior
- acao aplicada atualiza status imediatamente
- sugestao aceita move item de bucket e registra historico
- botao de "como chegou nisso?" abre explicacao, nao texto solto

## 9. Keyboard-first para usuario recorrente

Padroes uteis:

- `Cmd/Ctrl + K`: command palette
- `Cmd/Ctrl + F`: filtro ou busca no contexto
- `Esc`: fechar drawer, modal ou limpar foco
- `J/K`: navegar feed, insights ou linhas
- `Enter`: abrir item focado
- `A`: aceitar sugestao quando o foco estiver em um item revisavel

## 10. Copy de produto

Tooltips devem mostrar formula, origem ou regra, nao definicao obvia.

Preferir:

- `CAC = custo total / cartoes gerados. Fonte: activities.`
- `Score penalizado por semana diferente e parceiro divergente.`
- `Dado direcional: fonte atualizada, mas base final ainda incompleta.`

Evitar:

- `CAC significa custo de aquisicao`
- `A IA achou uma sugestao`
- `Erro ao carregar`

## 11. Padroes para sugestoes inteligentes

Sugestoes devem ser agrupadas em buckets:

- Alta confianca: pronto para vinculo manual.
- Revisar: plausivel, mas exige validacao humana.
- Conflitos: bate parcialmente, mas viola regra importante.
- Ja vinculados: existe relacao ativa ou historica.
- Planejados/ausentes: aparecem na governanca, mas ainda nao existem no historico.

Cada sugestao precisa mostrar:

- score
- dimensoes que bateram
- divergencias
- amostra ou fonte
- motivo principal
- acao disponivel

Nao usar texto solto como inteligencia. Usar objetos clicaveis, auditaveis e filtraveis.

## 12. Padroes para Performance do Conteudo

Separar modos por trabalho real:

- Visao Geral: saude do conteudo, peca campea, volume, base acionada, engajamento, ranking e acoes priorizadas.
- Galeria: comparacao visual de templates, qualidade criativa, reuso, canais e KPIs compactos.
- Tabela: auditoria, ordenacao, filtros, bulk review e exportacao.

Cartoes de conteudo devem mostrar:

- preview legivel
- template_id
- canal
- contexto: parceiro, segmento, campanha/jornada
- status
- score ou classificacao
- KPIs essenciais
- chips de activity_names/executions

Modal de detalhe deve preservar proporcao util:

- preview grande o suficiente para leitura
- painel lateral com funil, score, diagnostico, activity_names e acoes
- timeline de KPIs somente quando ajuda a explicar evolucao
- drill de dia/disparo retornando ao template original

## 13. Drilldowns que preservam contexto

Preferir drawer/modal sobre navegacao completa quando:

- o usuario compara varios templates
- precisa voltar para a grade/tabela
- a acao e local e reversivel
- o detalhe depende do filtro atual

Ao abrir detalhe:

- manter filtros globais
- mostrar de onde veio o item
- permitir voltar sem recarregar lista
- nao resetar scroll, busca ou ordenacao sem motivo

## 14. Benchmarks e fundamentos

- Stripe: produtividade operacional, busca, tabelas densas, atalhos.
- Linear: foco, hierarquia clara, velocidade, keyboard-first.
- Amplitude/Mixpanel: funis, coortes, segmentacao e drill.
- Sistemas de marketing cloud: separacao entre campanha, jornada, template, audiencia e execucao.
- GaaS Afinz: usar o vault como ontologia e o Supabase como fonte viva.

