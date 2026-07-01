# Spec — Comunicações: Performance do Conteúdo V2

## 1. Objetivo

Transformar a tela `Comunicações > Performance do Conteúdo` de uma galeria de templates com KPIs em um cockpit operacional de análise de CRM.

A decisão principal que a tela deve destravar é:

> Quais conteúdos devem ser escalados, revisados, pausados, comparados ou reaproveitados nas réguas CRM?

O diferencial do GaaS frente a ferramentas genéricas de CRM/Marketing Cloud é cruzar:

- preview visual do conteúdo;
- `template_id` como identidade estável da peça;
- `activity_names` como execuções SFMC;
- funil de aquisição até cartões/CAC;
- governança de cobertura e asset;
- análise por parceiro, segmento, canal, campanha e régua.

## 2. Usuários e frequência

### Usuários principais

- Operador CRM/Growth: precisa auditar peças, vínculo e resultado.
- Analista de performance: precisa identificar padrões, outliers e oportunidades.
- Liderança Growth: precisa entender quais conteúdos geram cartões, CAC e aprendizado.

### Frequência de uso

- Diário: checar novos resultados, peças problemáticas e inconsistências.
- Semanal: comparar criativos, consolidar aprendizados e alimentar relatório.
- Mensal: revisar campanhas/famílias, melhores conteúdos e histórico de performance.

## 3. Unidades de análise

Primária:

- `template_id`

Secundárias:

- `activity_name`
- data de disparo
- canal
- parceiro
- segmento
- campanha/família
- semana/disparo, ex.: `S1D01`
- status de asset/cobertura

## 4. Métricas mínimas

### Volume

- Base enviada
- Aberturas
- Cliques
- Execuções

### Resultado

- Propostas
- Aprovados, se disponível
- Cartões gerados
- Conversão da base

### Eficiência

- CTR
- Taxa de abertura
- CAC real ou estimado
- Gasto real ou estimado

### Qualidade operacional

- Tem asset?
- Tem activity vinculada?
- Activity está vinculada a template compatível?
- Existe divergência de parceiro/segmento/canal?
- Existem execuções sem resultado?

## 5. Estrutura proposta da tela

```text
Performance do Conteúdo

[Cockpit executivo]
Templates analisados | Base | Cartões | CAC | Melhor conteúdo | Alertas

[Filtros rápidos]
Canal | Parceiro | Segmento | Campanha | Status | Métrica principal

[Modo de visualização]
Cards | Ranking | Matriz | Comparação

[Conteúdo principal]
- Cards com preview e diagnóstico
- ou ranking acionável
- ou matriz campanha x disparo
- ou comparação lado a lado

[Modal do template]
Preview | KPIs | Timeline | Activity drilldown | Comparação | Aprendizados
```

## 6. Cockpit executivo

Adicionar uma faixa no topo da tela antes da grade.

### Cards do cockpit

1. Templates com resultado
2. Base enviada total
3. Cartões total
4. CAC médio/estimado
5. Melhor conteúdo
6. Alertas operacionais

### Regras

- O melhor conteúdo deve considerar volume mínimo para evitar falso positivo.
- CAC deve ser explicitamente marcado como real ou estimado.
- Alertas devem contar problemas reais de ação:
  - sem asset;
  - sem activity vinculada;
  - alto volume e baixo resultado;
  - CTR alto e conversão baixa;
  - abertura baixa;
  - divergência de vínculo.

## 7. Filtros e ordenação

### Filtros rápidos

- Canal
- Parceiro
- Segmento
- Campanha/família
- Status analítico
- Tem asset
- Tem activity vinculada
- Período

### Ordenação

- Cartões
- Conversão
- CTR
- Taxa de abertura
- CAC
- Base enviada
- Gasto
- Recência

### Busca

Buscar por:

- `template_id`
- `activity_name`
- título do template
- jornada
- parceiro
- segmento

## 8. Cards V2

Cada card deve continuar com preview visual, mas precisa virar uma unidade de decisão.

### Conteúdo do card

- Preview
- `template_id`
- Canal
- Parceiro/campanha inferidos, quando disponíveis
- Activity_names vinculadas
- Execuções
- Base
- Aberturas
- Cliques
- Cartões
- Conversão
- CAC
- Badge de diagnóstico

### Badges sugeridos

- `Escalar`
- `Revisar copy`
- `Revisar oferta`
- `Baixa abertura`
- `Bom clique, baixa conversão`
- `CAC alto`
- `Volume insuficiente`
- `Sem asset`
- `Sem vínculo`
- `Vínculo suspeito`

## 9. Regras de diagnóstico

As regras iniciais devem ser determinísticas e auditáveis.

### Escalar

Critérios sugeridos:

- cartões acima da mediana;
- CAC abaixo da mediana;
- volume mínimo atingido.

### Revisar copy/conteúdo

Critérios:

- abertura boa;
- CTR abaixo da mediana;
- base relevante.

Interpretação:

> O assunto/público trouxe abertura, mas o conteúdo/CTA não converteu clique.

### Revisar oferta/público

Critérios:

- CTR acima da mediana;
- conversão da base abaixo da mediana;
- cartões baixos.

Interpretação:

> O conteúdo gera interesse, mas a oferta, público ou destino não converte.

### Baixa abertura

Critérios:

- taxa de abertura abaixo da mediana;
- base relevante.

Interpretação:

> Revisar assunto, pré-cabeçalho, timing, entregabilidade ou segmentação.

### CAC alto

Critérios:

- CAC efetivo acima do threshold ou acima da mediana;
- cartões > 0.

### Volume insuficiente

Critérios:

- base abaixo de um mínimo configurável.

### Vínculo suspeito

Critérios:

- `template_id` indica parceiro/canal/segmento diferente da activity vinculada;
- activity já está vinculada a outro template;
- activity sem dados ou com data fora do período esperado.

## 10. Ranking acionável

Criar uma visualização alternativa em tabela/lista.

### Colunas

- Diagnóstico
- Template
- Preview mini
- Canal
- Parceiro
- Segmento
- Activity_names
- Base
- Aberturas
- CTR
- Cartões
- Conversão
- CAC
- Próxima ação

### Ações por linha

- Ver detalhe
- Comparar
- Marcar para revisar
- Exportar para relatório
- Abrir activity
- Copiar `template_id`

## 11. Matriz de campanha

Criar uma visão para campanhas estruturadas, especialmente Copa.

### Exemplo

Linhas:

- Dia
- Bem Barato
- B2C
- Plurix

Colunas:

- S1D01
- S1D02
- S2D01
- S2D02
- S3D01
- S3D02

Célula:

- cor por performance;
- ícone de asset;
- ícone de vínculo;
- métrica selecionada.

### Uso

Responder:

- Qual parceiro está coberto?
- Qual disparo está faltando?
- Onde há asset sem resultado?
- Onde há resultado ruim em uma família específica?

## 12. Comparação de conteúdos

Permitir selecionar 2 a 4 templates e comparar lado a lado.

### Comparação mínima

- Preview
- Template ID
- Canal
- Parceiro
- Segmento
- Base
- Aberturas
- CTR
- Cartões
- Conversão
- CAC
- Timeline mini

### Casos de uso

- E-mail vs WhatsApp da mesma campanha.
- S1D01 vs S2D01.
- Dia vs Bem Barato.
- Versão A vs versão B.
- Template com assunto diferente.

## 13. Modal do template V2

O modal atual já tem:

- preview grande;
- KPIs;
- timeline;
- activity drilldown;
- gestão de vínculo;
- substituir/excluir asset.

### Melhorias sugeridas

Adicionar:

1. Diagnóstico automático no topo.
2. Comparação com similares.
3. Lista de activity_names com status de vínculo/resultado.
4. Bloco de aprendizado.
5. Histórico de asset/versão.

### Bloco de aprendizado

Campos:

- Hipótese
- Aprendizado
- Próximo teste
- Observação
- Responsável, opcional
- Data da análise

Pode começar como metadata no template e evoluir para tabela própria depois.

## 14. Modelo de dados

### MVP sem nova tabela

Usar:

- `communication_templates`
- `activities.template_id`
- `activities`
- `communication_templates.metadata`

Adicionar apenas campos calculados no front/hook:

- `diagnostic_status`
- `diagnostic_reason`
- `benchmark_context`
- `timeline`
- `quality_flags`

### Evolução opcional

Criar tabela:

```sql
communication_template_notes
```

Campos sugeridos:

- `id`
- `template_id`
- `note_type`
- `hypothesis`
- `learning`
- `next_action`
- `created_by`
- `created_at`
- `updated_at`

Criar tabela opcional para feedback de diagnóstico:

```sql
communication_diagnostic_feedback
```

Campos:

- `id`
- `template_id`
- `diagnostic_key`
- `feedback`
- `created_by`
- `created_at`

## 15. Hooks e componentes prováveis

### Hooks

- `useTemplatePerformance`
  - agregar KPIs;
  - calcular timeline;
  - calcular benchmarks;
  - gerar flags diagnósticas.

- Novo `useCommunicationPerformanceInsights`
  - receber lista de `TemplatePerformance`;
  - devolver cockpit, rankings, alertas e diagnósticos.

### Componentes

- `TemplatePerformanceGrid`
- Novo `CommunicationPerformanceCockpit`
- Novo `CommunicationPerformanceToolbar`
- Novo `CommunicationPerformanceRanking`
- Novo `CommunicationPerformanceMatrix`
- Novo `TemplateCompareDrawer` ou `TemplateCompareModal`
- Evoluir `CommunicationDetailModal`

## 16. Fases de implementação

### Fase 1 — Eficiência imediata

Objetivo: tornar a tela acionável sem mexer em schema.

Entregas:

- cockpit no topo;
- ordenação por métrica;
- filtros rápidos;
- badges diagnósticos nos cards;
- ranking “ações sugeridas”.

Critério de aceite:

- usuário consegue identificar em menos de 2 minutos:
  - melhor conteúdo;
  - pior conteúdo relevante;
  - conteúdos que precisam revisão;
  - conteúdos sem cobertura/asset.

### Fase 2 — Comparação

Objetivo: permitir análise de variações.

Entregas:

- seleção de cards;
- modal/drawer de comparação;
- comparação por métrica e preview;
- sugestão de similares por `template_id`, campanha, parceiro e segmento.

Critério de aceite:

- usuário consegue comparar 2 a 4 templates sem sair da tela.

### Fase 3 — Matriz de campanha

Objetivo: gestão macro de famílias de comunicação.

Entregas:

- matriz por parceiro x semana/disparo;
- célula com status de asset/vínculo/performance;
- filtro por campanha/família.

Critério de aceite:

- usuário consegue ver lacunas de cobertura e performance da campanha em uma visão.

### Fase 4 — Aprendizado e histórico

Objetivo: transformar resultado em memória operacional.

Entregas:

- notas de aprendizado por template;
- histórico de decisões;
- exportação para relatório;
- trilha de versão/asset.

Critério de aceite:

- usuário consegue registrar o aprendizado de uma peça e reaproveitar em relatório/revisão futura.

## 17. Estados vazios e erros

### Sem dados de performance

Mostrar:

> Nenhum template com resultado no período. Verifique vínculos de activity_name ou amplie o período.

Ações:

- Ir para Cadastro e Templates.
- Ver templates sem vínculo.
- Limpar filtros.

### Sem asset

Mostrar card compacto:

> Template com resultado, mas sem preview cadastrado.

Ação:

- Adicionar asset.

### Sem vínculo

Mostrar em cadastro, não em performance principal, exceto como alerta agregado.

## 18. Riscos e cuidados

- Não misturar CAC real com CAC estimado sem label.
- Não transformar score em verdade absoluta; sempre mostrar motivo.
- Não esconder dados por filtros implícitos.
- Evitar comparação injusta com baixo volume.
- Separar problemas de conteúdo dos problemas de tracking/cobertura.
- Manter `template_id` como identidade do conteúdo, e `activity_name` como execução.

## 19. Próximo corte recomendado

Implementar Fase 1.

Ordem sugerida:

1. Criar `useCommunicationPerformanceInsights`.
2. Adicionar cockpit no topo de `TemplatePerformanceGrid`.
3. Adicionar ordenação e filtro de status.
4. Calcular badges diagnósticos.
5. Criar bloco “Ações sugeridas”.

Esse corte já muda a percepção da tela de “galeria” para “painel de decisão”.
