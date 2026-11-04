# Inventário de dados para Seguros e Portfólio

Catálogo v0.1.0 · conferido em 04/11/2026 · Supabase `mipiwxadnpwtcgfcedym`.

**Este é o mapa de recepção e de saída.** A tabela existir não comprova que o importador bruto, a consulta rápida ou os bindings de exportação já estejam implementados. O estado canônico é `data-catalog.json`.

## Cobertura dos modelos de referência

- Performance Geral Seguros: sete abas; digital Mulher/Residencial, comunicações, LP, Lojinha, investimento e cenários.
- Radar: quatorze abas; portfólio, retenção, ativação, uso, engajamento, receitas, seguros, orçamento e reestruturação.
- Comitê de 30/10: 21 slides, incluindo Seguros, CP, Pool/Visa e próximos passos.
- Comitê de 16/10: 44 slides, incluindo capítulos de portfólio, mensuração CRM, CP, aquisição e ativação.
- As 21 abas e os 65 slides são cobertura documental; isso não significa 21 fontes independentes ou 65 tabelas de fatos. Fórmulas e slides que repetem uma medida são saídas/vínculos do mesmo dado.

## Famílias e destino

| Dataset | O que preservar | Destino | Estado físico |
|---|---|---|---|
| `insurance_dispatch` | Comunicações de Seguros | `growth_data.dispatch_facts` | Existe; contrato bruto pendente |
| `insurance_contract_event` | Confirmação e cancelamento individual de seguro | `growth_data.insurance_contract_events` | Proposto; não criado |
| `insurance_lp_event` | Eventos brutos de formulário LP | `growth_data.insurance_lp_events` | Proposto; não criado |
| `insurance_outcome` | Cadastros e contratações confirmadas | `growth_data.outcome_facts` | Existe; contrato bruto pendente |
| `insurance_traffic` | LP e Lojinha: tráfego e eventos | `growth_data.traffic_facts` | Existe; contrato bruto pendente |
| `media_aggregate` | Impressões, cliques registrados e investimento de mídia agregado | `growth_data.media_aggregate_facts` | Proposto; não criado |
| `insurance_investment` | Mensageria, mídia e custos digitais | `growth_data.investment_facts` | Existe; contrato bruto pendente |
| `insurance_stock` | Apólices: abertura, novas, canceladas e fechamento | `growth_data.portfolio_observations` | Existe; contrato bruto pendente |
| `portfolio_stock` | Portfólio: aptos, vivos, ativados, originação e cancelamentos | `growth_data.portfolio_observations` | Existe; contrato bruto pendente |
| `portfolio_retention` | Retenção realizada e metas | `growth_data.portfolio_observations` | Existe; contrato bruto pendente |
| `portfolio_usage` | Uso: faturamento, transações e denominadores | `growth_data.portfolio_observations` | Existe; contrato bruto pendente |
| `portfolio_cohort` | Safras e MOB de ativação/reativação | `growth_data.portfolio_cohort_facts` | Proposto; não criado |
| `portfolio_engagement` | Clusters e componentes de engajamento | `growth_data.portfolio_engagement_facts` | Proposto; não criado |
| `portfolio_revenue` | Receitas por rubrica, ramo e cenário | `growth_data.portfolio_revenue_facts` | Proposto; não criado |
| `insurance_budget` | Orçamento de Seguros, preço e premissas | `growth_data.scenario_assumptions` | Proposto; não criado |
| `portfolio_projection` | Reestruturação: premissas e projeções | `growth_data.scenario_assumptions` | Proposto; não criado |
| `credit_personal` | CP: elegibilidade, exposição e contratação | `growth_data.credit_outcome_facts` | Proposto; não criado |
| `crm_pressure` | Pressão de CRM e mensuração histórica | `growth_data.crm_pressure_observations` | Proposto; não criado |
| `offers_pool` | Pool/Visa: desempenho de ofertas | `growth_data.offer_performance_facts` | Proposto; não criado |
| `experiment_measurement` | Medições de experimentos e controles | `growth_data.experiment_measurements` | Proposto; não criado |
| `editorial_evidence` | Contexto, hipóteses, decisões documentadas e notas | `growth_data.editorial_evidence` | Proposto; não criado |

Cada dataset no JSON inclui chave de negócio, partição, data, grão, medidas, fontes de referência e consumidores. As chaves são contratos propostos de normalização e precisam ser confrontadas com o primeiro arquivo bruto real; não são prova de que esses campos já existem nele.

## Conteúdo que será salvo

- **Seguros:** IDs de evento de cadastro/contrato quando existirem, produto comercial e agrupamento, competência/data, população, origem/franquia, status de confirmação/cancelamento, volumes, tráfego por superfície, comunicação e custos. Não salvar CPF, telefone ou e-mail apenas para reproduzir agregados; preferir IDs técnicos necessários à conciliação. Os modelos atuais não fornecem os eventos individuais.
- **Carteira:** aptos, vivos, ativados, emitidos, novos, cancelamentos voluntários/involuntários e estoques; apólices iniciais/finais, novas e canceladas. Estoques usam corte, não soma entre meses.
- **Mídia/Lojinha:** investimento Meta, impressões, cliques registrados e definição de clique. Sessões por página principal, carrinho, pagamento, conclusão e compra ficam em códigos de superfície/etapa governados; não somar etapas nem tratar esse export agregado como funil sequencial. Compra no analytics não comprova contratação do seguro.
- **Uso:** faturamento e transações com seus denominadores de contas/clientes e ramo. Ticket, frequência e spending são saídas de definições versionadas.
- **Retenção e safras:** realizado/metas, ramo, safra de entrada, MOB, universo de elegíveis, ativados e reativados. Não somar linhas MOB como pessoas distintas.
- **Engajamento:** clusters, componentes de score, faixa, ramo, contagem e denominador; metodologia e janelas de recência/consistência/frequência/valor/rentabilidade versionadas.
- **Receitas:** rubrica de anuidade, seguros/assistências, ITC, antecipação B2B2C, MDR e operacional total; ramo, período, realizado/orçado, moeda e regime. Total e rubricas não são entradas somáveis do mesmo agregado.
- **Orçamento/cenários:** versões, preços, IPP previsto, contas e vendas esperadas, premissas de originação/churn, horizonte, base versus reestruturação e resultados calculados. Cenário não é receita realizada.
- **CP:** elegíveis, públicos novos/recorrentes, propensão, tempo de exposição, app, comunicações, contratos, originação e custo. Valores citados no PPTX são evidência histórica até reconciliar com a origem bruta.
- **Pool/Visa e experimentos:** desempenho de oferta/campanha quando houver fonte, identificadores do teste, braços e janelas, expostos/atribuídos/observados, compra, uso e gasto. Os slides atuais descrevem planos; não provam resultados incrementais.
- **Editorial e rastreabilidade:** hash/localizador da fonte, edição, data de corte, método, avisos, hipóteses, textos, decisões documentadas, proprietário e mapeamentos para objetos/células. Preservar como evidência da edição; não transformar texto em decisão aprovada ou número causal.

## O que será calculado, não carregado como fato duplicado

| Indicador | Cálculo/definição | Limite |
|---|---|---|
| `delivery_rate` | delivered / sent | mesma ocorrência/população; zero e ausente no denominador não são taxa zero |
| `cost_per_contract` | SUM(cost) / SUM(confirmed_contracts) | mesmo período, produto, universo e autoridade; não calcular média de CACs |
| `digital_share` | digital_new_contracts / company_new_sales | definições comerciais comparáveis e corte compatível |
| `ipp_insurance` | closing_policies / live_accounts | estoques no mesmo corte; não representa necessariamente pessoas únicas |
| `activation_rate_eligible` | activated_accounts / eligible_accounts | distinto de ativados/vivos; o material usa denominadores que precisam de contratos separados |
| `activation_rate_live` | activated_accounts / live_accounts | não usar como alias de ativados/aptos |
| `voluntary_churn` | voluntary_cancellations / live_accounts_previous_month | mesmo ramo e universo; falta do mês anterior bloqueia o cálculo |
| `frequency` | transactions / activated_accounts | razão mensal; denominador por definição aprovada |
| `spending` | purchase_amount / activated_accounts | razão mensal; YTD ponderado e média das razões mensais são definições distintas |
| `ticket` | purchase_amount / transactions | não confundir com spending por ativado |
| `revenue_per_live` | operating_revenue / live_accounts | regime contábil, período e tratamento do denominador definidos |
| `engagement_share` | cluster_accounts / eligible_accounts | mesma versão do modelo de cluster; percentual arredondado não vira contagem exata |
| `mom_yoy_rxo` | comparable_actual / comparable_baseline - 1 | baseline, parcialidade, janelas comparáveis e direção do indicador governadas; N/A preservado |

A referência contém spending YTD como média de razões mensais em um capítulo. Essa metodologia deve ser identificada separadamente do YTD ponderado. A escolha não pode ser silenciosa.

## Infraestrutura comum

Reutilizar contratos, lotes, registros, produtos, populações, definições de métricas, revisões de fatos, snapshots, vínculos, reconciliações e artefatos já existentes em `growth_data`. A auditoria do banco encontrou 24 tabelas da fundação e zero lotes/fatos/snapshots desse domínio em 04/11/2026. Reconsultar o banco em cada operação; este número não é estado permanente.

Extensões propostas: checkpoints e decisões de ingestão; versões, premissas e resultados de cenários; fatos com grão próprio para safras, engajamento, rubricas, CP, ofertas e eventos individuais. Criar somente na etapa de implementação do contrato correspondente, com RLS e índices adequados.

Tabelas operacionais relacionadas (`activities`, `rentabilizacao_activities`, `paid_media_metrics`, `dynamic_email_pool_offers`, `experiments`) são candidatas a fontes/vínculos existentes, não autorização para duplicá-las ou alterá-las. Nesta rodada a existência nominal foi consultada; a equivalência semântica de cada integração ainda deve ser validada.

## Inclusão incremental

A partição do checkpoint deve refletir o universo do dataset. Não usar a maior data de uma projeção para bloquear realizado, nem a data de um produto/canal para bloquear outro. `closed_through` é o último período encerrado validado, não a data de upload.

Prioridade: chave existente → ignorado; período encerrado → ignorado; duplicata idêntica dentro do arquivo → ignorado; duplicata conflitante nova → bloquear a chave; chave nova em período admissível → candidato. O checkpoint é congelado antes do lote e avançado apenas junto de uma transação concluída.

Uma diferença em valor já gravado fica no log de ignorados. Não preencher nulos antigos, reconciliar atrasos ou sobrescrever histórico automaticamente. Para orçamento, projeção e arquivo editorial, preservar a versão anterior e aceitar somente uma nova versão identificada, sem misturar cenários.

## Dados → relatórios → arquivos

O caminho de leitura deve ser fato normalizado → definição de métrica → agregado leve por período/dimensão → dataset congelado → binding de célula/shape/gráfico → arquivo. O app não deve carregar todas as células dos originais para desenhar o BI. Os templates Office são recuperados somente na exportação, com versões/hashes e QA.

Os bindings atuais de Seguros cobrem parte do XLSX/PPTX de referência; não há suporte completo comprovado para os demais slides, capítulos e cenários. O catálogo identifica esses destinos; mapear seus objetos e cálculos é uma entrega de implementação posterior.

## Planejador local

`plan_increment.py` recebe um array de registros já normalizados e um estado congelado com `existing` e `checkpoints`. Exemplo de checkpoint: `{"dataset_id":"insurance_dispatch","partition":{"source_system":"sfmc","source_account_code":"BU1","channel_code":"email"},"closed_through":"2026-10-31"}`. Campos de chave são definidos no catálogo; os valores deste exemplo são sintéticos.

A saída separa candidatos e motivos de ignorado/bloqueado. `can_apply` permanece falso nesta versão: faltam o adaptador de entrada bruta, o writer governado e a camada rápida de leitura. O planejador não executa SQL, não autentica e não atualiza relatórios.
