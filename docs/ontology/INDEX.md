# 🧭 Índice da ontologia por camada

<!-- gerado por scripts/bundle_vault.py: não editar à mão -->

> Compilado em 2026-11-03 a partir de `Afinz-CRM-Midia-Vault/` (502 notas). Gerado por `python scripts/bundle_vault.py`.

## Como usar (pessoas e IAs)

1. Leia este índice inteiro. Ele é pequeno de propósito.
2. Carregue `core.md`. É a camada que quase toda tarefa precisa.
3. Carregue só as outras camadas que a tarefa toca, pela coluna "Quando carregar".
4. Estes arquivos são derivados. A fonte canônica é a nota no vault: corrija lá e recompile.
5. Número com 📊 é snapshot datado. Antes de afirmar tendência, confira no Supabase.
6. Nenhum arquivo aqui passa de 120.000 tokens estimados (decisão D-2 do ADR-001). O arquivo único `docs/AFINZ_GAAS_ONTOLOGY.md` continua sendo gerado por compatibilidade, mas tem ~943.424 tokens: não carregue inteiro.

## Camadas

| Arquivo | Camada | Notas | Tokens (est.) | Quando carregar |
|---|---|---:|---:|---|
| [core.md](core.md) | Núcleo: conceitos, dimensões, estratégia e IA | 62 | 63.407 | Primeira camada de qualquer tarefa. Conceitos, dimensões, função-objetivo, regras de proveniência e de memória. |
| [dados.md](dados.md) | Dados: entidades do Supabase, produtos e performance | 60 | 55.651 | Tarefa que lê ou escreve tabela, cruza métrica, cita produto ou usa snapshot de performance. |
| [operacao.md](operacao.md) | Operação: SFMC, e-mails dinâmicos e abas do GaaS | 17 | 56.346 | Tarefa de jornada, DE, template, ingestão ou comportamento de uma aba. |
| [engenharia.md](engenharia.md) | Engenharia: código, arquitetura e Report Live | 15 | 58.884 | Tarefa que muda código, migration, deploy ou o Report Live. |
| [ia.md](ia.md) | IA e aprendizado: loop, Report Live, Dossiê Mestre e conectores | 55 | 80.949 | Tarefa sobre o loop de Aprendizado e Memória, Report Live, motor de insights ou conectores (GA4, MCP). |
| [evolucao.md](evolucao.md) | Evolução: decisões, governança, catálogos e changelog | 16 | 46.336 | Tarefa que precisa de decisão aberta ou tomada, inconsistência de dado, glossário ou histórico do vault. |
| [resultados-1.md](resultados-1.md) | Resultados: histórico, segmentos, parceiros e retrospectivas | 36 | 84.946 | Tarefa que lê resultado passado de CRM, B2C ou mídia, ou fala de um segmento ou parceiro. |
| [resultados-2.md](resultados-2.md) | Resultados: histórico, segmentos, parceiros e retrospectivas | 10 | 81.044 | Tarefa que lê resultado passado de CRM, B2C ou mídia, ou fala de um segmento ou parceiro. |
| [resultados-3.md](resultados-3.md) | Resultados: histórico, segmentos, parceiros e retrospectivas | 14 | 72.219 | Tarefa que lê resultado passado de CRM, B2C ou mídia, ou fala de um segmento ou parceiro. |
| [resultados-4.md](resultados-4.md) | Resultados: histórico, segmentos, parceiros e retrospectivas | 6 | 112.480 | Tarefa que lê resultado passado de CRM, B2C ou mídia, ou fala de um segmento ou parceiro. |
| [legado.md](legado.md) | Legado: notas fora da estrutura nova (foto de jun/2026) | 47 | 25.677 | Só para consultar histórico. Nada aqui é regra vigente: cada nota aponta para a página atual. |
| [assuntos-crm.md](assuntos-crm.md) | Assuntos gerados: CRM, Copa, B2C, funis e documentos | 64 | 96.810 | Só quando a tarefa é sobre uma operação específica de CRM. Inventário gerado em 03/10/2026. |
| [assuntos-midia.md](assuntos-midia.md) | Assuntos gerados: mídia paga e mapeamento de campanhas | 57 | 60.357 | Só quando a tarefa é sobre uma campanha de mídia específica. |
| [assuntos-rentabilizacao.md](assuntos-rentabilizacao.md) | Assuntos gerados: rentabilização | 43 | 62.463 | Só quando a tarefa é sobre uma operação específica de rentabilização. |

## Catálogo de notas

Notas geradas `Assunto-*` não são listadas uma a uma: abra o arquivo `assuntos-*` da tarefa.


### 00-Indice

- [Changelog-do-Vault](evolucao.md#changelog-do-vault) · moc · 2026-11-03 · confirmado
- [Enciclopedia-Servicos-Growth](core.md#enciclopedia-servicos-growth) · moc · 2026-10-02 · confirmado
- [MOC-Estrategia](core.md#moc-estrategia) · moc · 2026-10-02 · confirmado
- [MOC-Midia-Paga](core.md#moc-midia-paga) · moc · 2026-08-04 · confirmado
- [MOC-Operacao](core.md#moc-operacao) · moc · 2026-11-03 · confirmado
- [🏠 HOME](core.md#-home) · moc · 2026-10-02 · confirmado

### 01-Conceitos

- [Base-Acionável](core.md#base-acionável) · conceito · 2026-06-08 · confirmado
- [CAC-Ótimo](core.md#cac-ótimo) · conceito · 2026-06-08 · confirmado
- [CAC](core.md#cac) · conceito · 2026-06-08 · confirmado
- [Campanha](core.md#campanha) · conceito · 2026-06-08 · confirmado
- [Carrinho-Abandonado](core.md#carrinho-abandonado) · conceito · 2026-06-10 · confirmado
- [Disparo](core.md#disparo) · conceito · 2026-06-08 · confirmado
- [Etapa-de-Aquisição](core.md#etapa-de-aquisição) · conceito · 2026-06-08 · confirmado
- [Experimento](core.md#experimento) · conceito · 2026-06-08 · confirmado
- [Funil-AARRR](core.md#funil-aarrr) · conceito · 2026-06-08 · inferência
- [Hipótese](core.md#hipótese) · conceito · 2026-06-08 · confirmado
- [Jornada](core.md#jornada) · conceito · 2026-06-10 · confirmado
- [Lead](core.md#lead) · conceito · 2026-06-08 · confirmado
- [MCC](core.md#mcc) · conceito · 2026-11-03 · confirmado
- [Métricas-de-Mídia](core.md#métricas-de-mídia) · conceito · 2026-06-08 · confirmado
- [Mídia-Paga](core.md#mídia-paga) · conceito · 2026-06-08 · confirmado
- [Oportunidade](core.md#oportunidade) · conceito · 2026-06-08 · confirmado
- [Plataformas-de-Comunicação](core.md#plataformas-de-comunicação) · conceito · 2026-06-10 · confirmado
- [Repescagem](core.md#repescagem) · conceito · 2026-08-20 · confirmado
- [Régua](core.md#régua) · conceito · 2026-06-08 · inferência
- [Safra](core.md#safra) · conceito · 2026-06-08 · confirmado
- [Spend-to-Card](core.md#spend-to-card) · conceito · 2026-06-08 · inferência
- [Taxonomia-Activity-Name](core.md#taxonomia-activity-name) · conceito · 2026-06-08 · confirmado
- [Template](core.md#template) · conceito · 2026-06-08 · confirmado
- [Topo-de-Funil](core.md#topo-de-funil) · conceito · 2026-08-20 · confirmado
- [Upgrade](core.md#upgrade) · conceito · 2026-08-20 · confirmado

### 02-Entidades-Dados

- [Amostras-Comunicacoes-Reais](dados.md#amostras-comunicacoes-reais) · dados-brutos · 2026-08-17 · confirmado
- [02-Entidades-Dados/Amostras-Comunicacoes-Reais/README](dados.md#02-entidades-dadosamostras-comunicacoes-reaisreadme) · dados-brutos · 2026-08-17 · confirmado
- [Beneficios-e-Vigencia](dados.md#beneficios-e-vigencia) · entidade · 2026-10-02 · confirmado
- [Cartao-Afinz-Visa](dados.md#cartao-afinz-visa) · entidade · 2026-11-03 · confirmado
- [Cartao-Amigo-Afinz-Visa](dados.md#cartao-amigo-afinz-visa) · entidade · 2026-10-02 · confirmado
- [Cartao-Bem-Mais-Afinz-Visa](dados.md#cartao-bem-mais-afinz-visa) · entidade · 2026-10-02 · confirmado
- [Cartao-Dia-Afinz-Visa](dados.md#cartao-dia-afinz-visa) · entidade · 2026-10-02 · a-validar
- [Dicionario-de-Produtos](dados.md#dicionario-de-produtos) · moc · 2026-10-02 · confirmado
- [Pode-Dizer-Nao-Pode-Dizer](dados.md#pode-dizer-nao-pode-dizer) · entidade · 2026-10-02 · confirmado
- [Dimensao-Canonica-de-Parceiro](dados.md#dimensao-canonica-de-parceiro) · entidade · 2026-09-13 · confirmado
- [Falha-Sincronizacao-Meta-Supabase-4Dias-Ago26](dados.md#falha-sincronizacao-meta-supabase-4dias-ago26) · entidade-dados · 2026-08-21 · pendente
- [Quebra-de-Medicao-Aquisicao-B2C-Jun26](dados.md#quebra-de-medicao-aquisicao-b2c-jun26) · entidade-dados · 2026-08-20 · confirmado
- [DE-BRIEFING_OFERTAS_VISA](dados.md#de-briefing_ofertas_visa) · entidade · 2026-11-03 · confirmado
- [DE-CLIENTES_ATIVOS](dados.md#de-clientes_ativos) · entidade · 2026-11-03 · confirmado
- [DE-MAPA_MCC](dados.md#de-mapa_mcc) · entidade · 2026-11-03 · confirmado
- [DE-VDV_APTOS](dados.md#de-vdv_aptos) · entidade · 2026-11-03 · confirmado
- [DE-VDV_CRUZAMENTO](dados.md#de-vdv_cruzamento) · entidade · 2026-11-03 · confirmado
- [DE-VDV_ENVIO](dados.md#de-vdv_envio) · entidade · 2026-11-03 · confirmado
- [DE-VDV_FUNIL](dados.md#de-vdv_funil) · entidade · 2026-11-03 · confirmado
- [MOC-SFMC-DEs-e-Automations](dados.md#moc-sfmc-des-e-automations) · moc · 2026-11-03 · a-validar
- [Supabase-Schema](dados.md#supabase-schema) · entidade · 2026-06-10 · confirmado
- [Supabase-Visão-Geral](dados.md#supabase-visão-geral) · entidade · 2026-06-08 · confirmado
- [02-Entidades-Dados/Templates-Vibe-Revisao-2026/README](dados.md#02-entidades-dadostemplates-vibe-revisao-2026readme) · dados-brutos · 2026-08-17 · confirmado
- [Templates-Vibe-Revisao-2026](dados.md#templates-vibe-revisao-2026) · evidencia · 2026-10-02 · confirmado
- [Views-Performance](dados.md#views-performance) · entidade · 2026-06-10 · confirmado
- [activities](dados.md#activities) · entidade · 2026-06-08 · confirmado
- [ad_creatives](dados.md#ad_creatives) · entidade · 2026-06-08 · confirmado
- [appsflyer_template_daily](dados.md#appsflyer_template_daily) · entidade · 2026-07-28 · proposto
- [b2c_daily_metrics](dados.md#b2c_daily_metrics) · entidade · 2026-06-08 · confirmado
- [campaign_budgets](dados.md#campaign_budgets) · entidade · 2026-06-08 · confirmado
- [campaign_context](dados.md#campaign_context) · entidade · 2026-06-10 · confirmado
- [collection_execution_logs](dados.md#collection_execution_logs) · entidade · 2026-06-08 · confirmado
- [collection_queue](dados.md#collection_queue) · entidade · 2026-06-08 · confirmado
- [communication_slots](dados.md#communication_slots) · entidade · 2026-08-12 · confirmado
- [communication_templates](dados.md#communication_templates) · entidade · 2026-08-12 · confirmado
- [copa_lp_daily](dados.md#copa_lp_daily) · entidade · 2026-06-11 · confirmado
- [copa_visa_daily](dados.md#copa_visa_daily) · entidade · 2026-06-11 · confirmado
- [dispatch_descriptions](dados.md#dispatch_descriptions) · entidade · 2026-06-08 · confirmado
- [gaas_dinamica_bi_metrics](dados.md#gaas_dinamica_bi_metrics) · entidade · 2026-06-08 · confirmado
- [gaas_update_runs](dados.md#gaas_update_runs) · entidade · 2026-06-08 · confirmado
- [goals](dados.md#goals) · entidade · 2026-06-08 · confirmado
- [paid_media_budgets](dados.md#paid_media_budgets) · entidade · 2026-06-08 · confirmado
- [paid_media_campaign_mappings](dados.md#paid_media_campaign_mappings) · entidade · 2026-06-08 · confirmado
- [paid_media_insights](dados.md#paid_media_insights) · entidade · 2026-06-08 · confirmado
- [paid_media_metrics](dados.md#paid_media_metrics) · entidade · 2026-06-08 · confirmado
- [paid_media_objectives](dados.md#paid_media_objectives) · entidade · 2026-06-08 · confirmado
- [paid_media_targets](dados.md#paid_media_targets) · entidade · 2026-06-08 · a-validar
- [profiles](dados.md#profiles) · entidade · 2026-06-08 · confirmado
- [rentabilizacao_activities](dados.md#rentabilizacao_activities) · entidade · 2026-06-08 · confirmado

### 03-Dimensoes

- [Bandeiras-Plurix](core.md#bandeiras-plurix) · dimensao · 2026-10-02 · confirmado
- [Copa-2026](core.md#copa-2026) · dimensao · 2026-06-11 · confirmado
- [Vibe](core.md#vibe) · dimensao · 2026-08-20 · confirmado

### 04-Operacao

- [AppsFlyer-Tracking-CRM](operacao.md#appsflyer-tracking-crm) · operacao · 2026-07-28 · confirmado
- [Automacao-VDV-Pool-de-Ofertas](operacao.md#automacao-vdv-pool-de-ofertas) · operacao · 2026-11-03 · confirmado
- [Comunicacoes-Pacote-SFMC-Catalogo](operacao.md#comunicacoes-pacote-sfmc-catalogo) · operacao · 2026-10-07 · parcialmente-implementado
- [Emails-Dinamicos-Plurix-V11](operacao.md#emails-dinamicos-plurix-v11) · operacao · 2026-10-06 · confirmado
- [Emails-Dinamicos-Plurix](operacao.md#emails-dinamicos-plurix) · operacao · 2026-10-06 · confirmado
- [Emails-Dinamicos-SFMC](operacao.md#emails-dinamicos-sfmc) · operacao · 2026-11-03 · confirmado
- [Emails-Dinamicos-Vai-de-Visa](operacao.md#emails-dinamicos-vai-de-visa) · operacao · 2026-11-03 · a-validar
- [Fabrica-de-Emails-GaaS](operacao.md#fabrica-de-emails-gaas) · operacao · 2026-10-06 · confirmado
- [Ficha-de-Produto-Guia](operacao.md#ficha-de-produto-guia) · operacao · 2026-10-02 · confirmado
- [Formatacao-WhatsApp-Variaveis-e-Espacamento](operacao.md#formatacao-whatsapp-variaveis-e-espacamento) · operacao · 2026-08-19 · confirmado
- [Plurix-Recencia-Automation-e-Comunicacoes](operacao.md#plurix-recencia-automation-e-comunicacoes) · runbook · 2026-10-28 · documentado-com-pendencias
- [SFMC-Package-Manager-e-Pacotes](operacao.md#sfmc-package-manager-e-pacotes) · operacao · 2026-10-07 · confirmado
- [SFMC-Packs-Fluxos-Vinculos-e-Aprendizados](operacao.md#sfmc-packs-fluxos-vinculos-e-aprendizados) · operacao · 2026-10-09 · parcialmente-implementado
- [SFMC-Query-Studio-e-SQL](operacao.md#sfmc-query-studio-e-sql) · operacao · 2026-11-03 · confirmado
- [SFMC-Salesforce-Marketing-Cloud](operacao.md#sfmc-salesforce-marketing-cloud) · operacao · 2026-11-03 · confirmado
- [Servico-Emails-Dinamicos](operacao.md#servico-emails-dinamicos) · operacao · 2026-10-02 · confirmado
- [WhatsApp-Respostas-de-Opt-out](operacao.md#whatsapp-respostas-de-opt-out) · contrato · 2026-10-26 · confirmado

### 05-Estrategia

- [Anti-Overlap-Pressão-de-Contato](core.md#anti-overlap-pressão-de-contato) · estrategia · 2026-06-08 · a-validar
- [Ativacao-de-Audiencias-Diaria](core.md#ativacao-de-audiencias-diaria) · estrategia · 2026-08-04 · confirmado
- [Briefing-e-Regua-de-Aquisicao](core.md#briefing-e-regua-de-aquisicao) · estrategia · 2026-10-02 · confirmado
- [Deck-Plano-de-Midias-Arquitetura](core.md#deck-plano-de-midias-arquitetura) · estrategia · 2026-08-07 · confirmado
- [Deck-Relatorio-Resultados-Arquitetura](core.md#deck-relatorio-resultados-arquitetura) · estrategia · 2026-08-21 · confirmado
- [Estrategia-Bases-Segmentadas-Original-2026-01](core.md#estrategia-bases-segmentadas-original-2026-01) · estrategia · 2026-10-29 · referencia
- [Estrategia-Multicanal-Vibe-Mar-Fechado](core.md#estrategia-multicanal-vibe-mar-fechado) · estrategia · 2026-08-04 · confirmado
- [Fabrica-XLSX-TOPO-CRM-3](core.md#fabrica-xlsx-topo-crm-3) · especificacao · 2026-10-06 · planejado
- [Função-Objetivo](core.md#função-objetivo) · estrategia · 2026-06-08 · confirmado
- [Motor-de-Briefing-Automatico](core.md#motor-de-briefing-automatico) · estrategia · 2026-10-02 · inferência
- [Ontologia-v2](core.md#ontologia-v2) · estrategia · 2026-08-04 · confirmado
- [Orquestrador](core.md#orquestrador) · estrategia · 2026-06-08 · confirmado
- [Plano-de-Midias-Afinz-Vibe-Handoff](core.md#plano-de-midias-afinz-vibe-handoff) · handoff-estrategico · 2026-08-05 · confirmado-com-pendencias
- [Regua-Vibe-Ativacao](core.md#regua-vibe-ativacao) · estrategia · 2026-08-20 · confirmado
- [Reguas-Inteligentes-Arquitetura](core.md#reguas-inteligentes-arquitetura) · estrategia · 2026-08-17 · proposto
- [Report-Live-Arquitetura-Editorial](core.md#report-live-arquitetura-editorial) · estrategia · 2026-09-15 · a-validar
- [Roadmap-Framework](core.md#roadmap-framework) · estrategia · 2026-06-10 · confirmado
- [SFMC-Integracao-API-Roadmap](core.md#sfmc-integracao-api-roadmap) · estrategia · 2026-10-07 · inferência
- [Sistema-de-Experimentacao-Referencias](core.md#sistema-de-experimentacao-referencias) · estrategia · 2026-06-10 · confirmado
- [Teste-Afinidade-MCC-vs-Generico](core.md#teste-afinidade-mcc-vs-generico) · estrategia · 2026-11-03 · a-validar

### 06-Performance

- [CAC-por-Canal](dados.md#cac-por-canal) · evidencia · 2026-06-10 · confirmado
- [CPA-por-Plataforma](dados.md#cpa-por-plataforma) · evidencia · 2026-06-10 · confirmado
- [Eficiência-de-Criativo](dados.md#eficiência-de-criativo) · evidencia · 2026-06-08 · a-validar
- [Evolução-Temporal](dados.md#evolução-temporal) · evidencia · 2026-06-10 · confirmado
- [Funil-de-Aquisição](dados.md#funil-de-aquisição) · evidencia · 2026-06-08 · confirmado
- [KPIs-Núcleo](dados.md#kpis-núcleo) · evidencia · 2026-06-08 · confirmado
- [Mapa-de-Oportunidades](dados.md#mapa-de-oportunidades) · evidencia · 2026-06-08 · inferência
- [Metas-e-CAC](dados.md#metas-e-cac) · evidencia · 2026-06-08 · confirmado
- [Performance-por-Segmento](dados.md#performance-por-segmento) · evidencia · 2026-06-10 · confirmado
- [Serie-Historica-Aquisicao-Mar-Ago-2026](dados.md#serie-historica-aquisicao-mar-ago-2026) · evidencia · 2026-09-13 · confirmado
- [Spend-e-Tendência](dados.md#spend-e-tendência) · evidencia · 2026-06-08 · confirmado

### 07-Evolucao

- [Auditoria-Jornadas-SFMC-2026-10](evolucao.md#auditoria-jornadas-sfmc-2026-10) · evidência · 2026-10-07 · a-validar
- [Catalogo-Analitico-CRM](evolucao.md#catalogo-analitico-crm) · catalogo-analitico · 2026-10-03 · inferência
- [Catalogo-Analitico-Midia-B2C](evolucao.md#catalogo-analitico-midia-b2c) · catalogo-analitico · 2026-10-03 · inferência
- [Conflitos-de-Fonte-Produtos-2026-08](evolucao.md#conflitos-de-fonte-produtos-2026-08) · evolucao · 2026-08-20 · confirmado
- [Decisões-Abertas](evolucao.md#decisões-abertas) · evolucao · 2026-11-03 · a-validar
- [Decisões-Tomadas](evolucao.md#decisões-tomadas) · evolucao · 2026-11-03 · confirmado
- [Evolucao-Cronologica-GaaS-2026-10](evolucao.md#evolucao-cronologica-gaas-2026-10) · retrospectiva · 2026-10-31 · analise-documental-com-limites
- [Funis-de-Onboarding-GaaS](evolucao.md#funis-de-onboarding-gaas) · evolucao · 2026-07-22 · confirmado
- [Galeria-de-Templates](evolucao.md#galeria-de-templates) · evolucao · 2026-07-15 · implementado
- [Glossário-de-Siglas](evolucao.md#glossário-de-siglas) · evolucao · 2026-06-08 · confirmado
- [Governança-de-Dados](evolucao.md#governança-de-dados) · evolucao · 2026-06-08 · a-validar
- [Historico-Resultados-B2C](resultados-1.md#historico-resultados-b2c) · analise-historica · 2026-10-03 · inferência
- [Historico-Resultados-CRM](resultados-1.md#historico-resultados-crm) · analise-historica · 2026-10-03 · inferência
- [Historico-Resultados-Midia-Paga](resultados-1.md#historico-resultados-midia-paga) · analise-historica · 2026-10-03 · inferência
- [Inconsistências-a-Corrigir](evolucao.md#inconsistências-a-corrigir) · evolucao · 2026-11-03 · confirmado
- [Inventario-Operacoes-Growth](evolucao.md#inventario-operacoes-growth) · guia-operacional · 2026-10-03 · confirmado
- [Parceiro-Acordo-Certo](resultados-1.md#parceiro-acordo-certo) · mapa-conteudo · 2026-10-03 · confirmado
- [Parceiro-Alvorada](resultados-1.md#parceiro-alvorada) · mapa-conteudo · 2026-10-03 · confirmado
- [Parceiro-Bem-Barato](resultados-1.md#parceiro-bem-barato) · mapa-conteudo · 2026-10-03 · confirmado
- [Parceiro-Bom-Pra-Credito](resultados-1.md#parceiro-bom-pra-credito) · mapa-conteudo · 2026-10-03 · confirmado
- [Parceiro-Dia](resultados-1.md#parceiro-dia) · mapa-conteudo · 2026-10-03 · confirmado
- [Parceiro-Plurix](resultados-1.md#parceiro-plurix) · mapa-conteudo · 2026-10-03 · confirmado
- [Parceiro-Proprietaria](resultados-1.md#parceiro-proprietaria) · mapa-conteudo · 2026-10-03 · confirmado
- [Parceiro-Serasa](resultados-1.md#parceiro-serasa) · mapa-conteudo · 2026-10-03 · confirmado
- [Performance-Atividades-e-Fluxo-de-Jornadas](evolucao.md#performance-atividades-e-fluxo-de-jornadas) · implementacao · 2026-10-19 · confirmado
- [Performance-do-Conteudo-GaaS](evolucao.md#performance-do-conteudo-gaas) · evolucao · 2026-07-15 · implementado
- [Resultados-B2C](resultados-1.md#resultados-b2c) · guia-operacional · 2026-10-03 · confirmado
- [Resultados-CRM-Abandonados](resultados-1.md#resultados-crm-abandonados) · analise-historica · 2026-10-03 · inferência
- [Resultados-CRM-Aprovados_nao_convertidos](resultados-1.md#resultados-crm-aprovados_nao_convertidos) · analise-historica · 2026-10-03 · inferência
- [Resultados-CRM-Base_Proprietaria](resultados-1.md#resultados-crm-base_proprietaria) · analise-historica · 2026-10-03 · inferência
- [Resultados-CRM-CRM](resultados-1.md#resultados-crm-crm) · analise-historica · 2026-10-03 · inferência
- [Resultados-CRM-Cartonistas](resultados-1.md#resultados-crm-cartonistas) · analise-historica · 2026-10-03 · inferência
- [Resultados-CRM-Instabilidade](resultados-1.md#resultados-crm-instabilidade) · analise-historica · 2026-10-03 · inferência
- [Resultados-CRM-Leads_Parceiros](resultados-1.md#resultados-crm-leads_parceiros) · analise-historica · 2026-10-03 · inferência
- [Resultados-CRM-Negados](resultados-1.md#resultados-crm-negados) · analise-historica · 2026-10-03 · inferência
- [Resultados-CRM-Recencia_de_Compra](resultados-1.md#resultados-crm-recencia_de_compra) · analise-historica · 2026-10-03 · inferência
- [Resultados-CRM](resultados-1.md#resultados-crm) · guia-operacional · 2026-10-03 · confirmado
- [Resultados-Evolucao-e-Retrospectivas](resultados-1.md#resultados-evolucao-e-retrospectivas) · guia-operacional · 2026-10-03 · confirmado
- [Resultados-Midia-Paga](resultados-1.md#resultados-midia-paga) · guia-operacional · 2026-10-03 · confirmado
- [Resultados-Qualidade-e-Cobertura](resultados-1.md#resultados-qualidade-e-cobertura) · analise-historica · 2026-10-03 · inferência
- [Retrospectiva-Growth-2026-09](resultados-1.md#retrospectiva-growth-2026-09) · analise-historica · 2026-10-03 · inferência
- [Retrospectiva-Mensal-Growth](resultados-1.md#retrospectiva-mensal-growth) · guia-operacional · 2026-10-03 · confirmado
- [Segmento-Abandonados](resultados-1.md#segmento-abandonados) · mapa-conteudo · 2026-10-03 · confirmado
- [Segmento-Aprovados-nao-convertidos](resultados-1.md#segmento-aprovados-nao-convertidos) · mapa-conteudo · 2026-10-03 · confirmado
- [Segmento-Base-Proprietaria](resultados-1.md#segmento-base-proprietaria) · mapa-conteudo · 2026-10-03 · confirmado
- [Segmento-CRM](resultados-1.md#segmento-crm) · mapa-conteudo · 2026-10-03 · confirmado
- [Segmento-Cartonistas](resultados-1.md#segmento-cartonistas) · mapa-conteudo · 2026-10-03 · confirmado
- [Segmento-Instabilidade](resultados-1.md#segmento-instabilidade) · mapa-conteudo · 2026-10-03 · confirmado
- [Segmento-Leads-Parceiros](resultados-1.md#segmento-leads-parceiros) · mapa-conteudo · 2026-10-03 · confirmado
- [Segmento-Negados](resultados-1.md#segmento-negados) · mapa-conteudo · 2026-10-03 · confirmado
- [Segmento-Recencia-de-Compra](resultados-1.md#segmento-recencia-de-compra) · mapa-conteudo · 2026-10-03 · confirmado

### 08-Engenharia

- [ADR-001](engenharia.md#adr-001) · engenharia · 2026-10-02 · confirmado
- [AppsFlyer-Ingestao-Template-Arquitetura](engenharia.md#appsflyer-ingestao-template-arquitetura) · engenharia · 2026-07-28 · proposto
- [Backlog-Desenvolvimento-GaaS-Loop-2026-10](engenharia.md#backlog-desenvolvimento-gaas-loop-2026-10) · planejamento · 2026-10-31 · backlog-priorizado
- [Como-Trabalhar-SDD-no-GaaS](engenharia.md#como-trabalhar-sdd-no-gaas) · guia-proposto · 2026-10-31 · proposta-para-piloto
- [Export-XLSX-Renta-Copa](engenharia.md#export-xlsx-renta-copa) · referencia · 2026-06-19 · implementado
- [Funil-Onboarding-Arquitetura-e-Ingestao](engenharia.md#funil-onboarding-arquitetura-e-ingestao) · engenharia · 2026-07-22 · confirmado
- [GaaS-Vault-Library](engenharia.md#gaas-vault-library) · engenharia · 2026-10-02 · confirmado
- [Importador-Segmentacao-Aquisicao-2026-10](engenharia.md#importador-segmentacao-aquisicao-2026-10) · contrato · 2026-10-26 · implementado
- [MOC-Engenharia](engenharia.md#moc-engenharia) · engenharia · 2026-10-31 · confirmado
- [Report-Live-Enciclopedia](engenharia.md#report-live-enciclopedia) · engenharia · 2026-09-22 · producao-v1
- [Report-Live-Publicacao-Assincrona-Supabase](engenharia.md#report-live-publicacao-assincrona-supabase) · arquitetura · 2026-09-25 · em-implementacao
- [Report-Live-Sheets-Slides](engenharia.md#report-live-sheets-slides) · engenharia · 2026-07-08 · confirmado
- [Report-Live-Versionamento-e-Publicacao](engenharia.md#report-live-versionamento-e-publicacao) · engenharia · 2026-09-23 · producao-v1
- [Skills-e-Disponibilidade-por-IA](engenharia.md#skills-e-disponibilidade-por-ia) · engenharia · 2026-10-30 · confirmado
- [Testes-e-Tarefas-Quatro-Frentes](engenharia.md#testes-e-tarefas-quatro-frentes) · especificacao · 2026-11-03 · implementado-revisao-visual-pendente

### 09-Inteligencia-IA

- [Agente-Report-Live-Handoff](ia.md#agente-report-live-handoff) · inteligencia-ia · 2026-07-08 · confirmado
- [Agentes-e-Workflows](ia.md#agentes-e-workflows) · operacao · 2026-06-08 · inferência
- [Auditoria-Contexto-Vault-2026-10-02](ia.md#auditoria-contexto-vault-2026-10-02) · evidencia · 2026-10-02 · confirmado
- [Convenções-do-Vault](core.md#convenções-do-vault) · referencia · 2026-10-02 · confirmado
- [Dossie-Mestre-Operacao-CRM-Midia](ia.md#dossie-mestre-operacao-crm-midia) · referencia · 2026-06-11 · inferência
- [Estrategia-de-Contexto](core.md#estrategia-de-contexto) · referencia · 2026-06-20 · confirmado
- [Experimento-Agentes-Wiki-2026-10-31](ia.md#experimento-agentes-wiki-2026-10-31) · evolucao · 2026-10-31 · experimento-em-andamento
- [Ficha-Tecnica-Growth-e-Auditoria-Report-Live-2026-09](ia.md#ficha-tecnica-growth-e-auditoria-report-live-2026-09) · handoff · 2026-09-09 · diagnostico-com-limites
- [Fontes-e-Proveniencia-Growth](core.md#fontes-e-proveniencia-growth) · referencia · 2026-10-02 · confirmado
- [GA4-MCP-Google-Analytics](ia.md#ga4-mcp-google-analytics) · operacao · 2026-10-01 · confirmado
- [Inteligencia-Compartilhada-GaaS](core.md#inteligencia-compartilhada-gaas) · operacao · 2026-10-22 · confirmado
- [Loop-de-Aprendizado-Growth](ia.md#loop-de-aprendizado-growth) · inteligencia-ia · 2026-10-31 · release-7c-candidata
- [MCP-Visão-Geral](ia.md#mcp-visão-geral) · operacao · 2026-06-08 · confirmado
- [MOC-Inteligencia-IA](core.md#moc-inteligencia-ia) · moc · 2026-10-31 · confirmado
- [Motor-de-Agentes-Loop-de-Memoria-2026-10](ia.md#motor-de-agentes-loop-de-memoria-2026-10) · planejamento · 2026-10-31 · em-planejamento
- [Obsidian-MCP](ia.md#obsidian-mcp) · referencia · 2026-06-08 · confirmado
- [Operacao-Fila-Notificacoes-Notas-de-Resultado](ia.md#operacao-fila-notificacoes-notas-de-resultado) · guia-operacional · 2026-10-30 · confirmado
- [Padrao-Editorial-Enciclopedia](core.md#padrao-editorial-enciclopedia) · referencia · 2026-10-02 · confirmado
- [Reidratacao-Alerts-Vivo](ia.md#reidratacao-alerts-vivo) · referencia · 2026-08-03 · ativo
- [Report-Live-Loop-de-Outcome](ia.md#report-live-loop-de-outcome) · inteligencia-ia · 2026-09-15 · a-validar
- [Report-Live-V2-Loop-de-Aprendizado-e-Memoria](ia.md#report-live-v2-loop-de-aprendizado-e-memoria)
- [Report-Live-V4-Growth-Context-Handoff-Codex](ia.md#report-live-v4-growth-context-handoff-codex) · inteligencia-ia · 2026-07-08 · em-revisao
- [Revisao-Claude-Report-Live-V4](ia.md#revisao-claude-report-live-v4) · inteligencia-ia · 2026-07-08 · confirmado
- [Roteamento-de-Memoria](core.md#roteamento-de-memoria) · referencia · 2026-06-20 · confirmado
- [Runbook-Vault-Vivo](ia.md#runbook-vault-vivo) · referencia · 2026-06-10 · confirmado
- [Skills-do-Projeto](ia.md#skills-do-projeto) · operacao · 2026-10-30 · confirmado
- [Catalogo-de-Skills](ia.md#catalogo-de-skills) · moc · 2026-10-30 · confirmado
- [Skill-afinz-copy-aquisicao](ia.md#skill-afinz-copy-aquisicao) · skill · 2026-10-30 · confirmado
- [Skill-afinz-crm-diarizado](ia.md#skill-afinz-crm-diarizado) · skill · 2026-10-30 · confirmado
- [Skill-afinz-pptx-campanha](ia.md#skill-afinz-pptx-campanha) · skill · 2026-10-30 · confirmado
- [Skill-afinz-pptx](ia.md#skill-afinz-pptx) · skill · 2026-10-30 · confirmado
- [Skill-b2c-originacao-updater](ia.md#skill-b2c-originacao-updater) · skill · 2026-10-30 · confirmado
- [Skill-copa-crm-parser](ia.md#skill-copa-crm-parser) · skill · 2026-10-30 · confirmado
- [Skill-crm-communication-enricher](ia.md#skill-crm-communication-enricher) · skill · 2026-10-30 · confirmado
- [Skill-crm-dispatch-intelligence](ia.md#skill-crm-dispatch-intelligence) · skill · 2026-10-30 · confirmado
- [Skill-diarizado-pacing](ia.md#skill-diarizado-pacing) · skill · 2026-10-30 · confirmado
- [Skill-emails-dinamicos-sfmc](ia.md#skill-emails-dinamicos-sfmc) · skill · 2026-10-30 · confirmado
- [Skill-gaas-activities-csv-ingest](ia.md#skill-gaas-activities-csv-ingest) · skill · 2026-10-30 · confirmado
- [Skill-gaas-emails-plurix](ia.md#skill-gaas-emails-plurix) · skill · 2026-10-30 · confirmado
- [Skill-gaas-funil-aquisicao-ingest](ia.md#skill-gaas-funil-aquisicao-ingest) · skill · 2026-10-30 · confirmado
- [Skill-gaas-governanca-comunicacoes](ia.md#skill-gaas-governanca-comunicacoes) · skill · 2026-10-30 · confirmado
- [Skill-gaas-growth-context](ia.md#skill-gaas-growth-context) · skill · 2026-10-30 · confirmado
- [Skill-gaas-growth-investigation](ia.md#skill-gaas-growth-investigation) · skill · 2026-10-30 · confirmado
- [Skill-gaas-growth-loop-operator](ia.md#skill-gaas-growth-loop-operator) · skill · 2026-10-30 · confirmado
- [Skill-gaas-insight-engine](ia.md#skill-gaas-insight-engine) · skill · 2026-10-30 · confirmado
- [Skill-gaas-midia-report](ia.md#skill-gaas-midia-report) · skill · 2026-10-30 · confirmado
- [Skill-gaas-momento-disparo](ia.md#skill-gaas-momento-disparo) · skill · 2026-10-30 · confirmado
- [Skill-gaas-relatorio-xlsx](ia.md#skill-gaas-relatorio-xlsx) · skill · 2026-10-30 · confirmado
- [Skill-gaas-template-reconciliation](ia.md#skill-gaas-template-reconciliation) · skill · 2026-10-30 · confirmado
- [Skill-growth-brain-intelligence-engine](ia.md#skill-growth-brain-intelligence-engine) · skill · 2026-10-30 · confirmado
- [Skill-growth-data-quality-monitor](ia.md#skill-growth-data-quality-monitor) · skill · 2026-10-30 · confirmado
- [Skill-growth-report-operator](ia.md#skill-growth-report-operator) · skill · 2026-10-30 · confirmado
- [Skill-growth-saas-marketing-cloud](ia.md#skill-growth-saas-marketing-cloud) · skill · 2026-10-30 · confirmado
- [Skill-measurement-attribution-auditor](ia.md#skill-measurement-attribution-auditor) · skill · 2026-10-30 · confirmado
- [Skill-meta-ads-remote](ia.md#skill-meta-ads-remote) · skill · 2026-10-30 · confirmado
- [Skill-paid-media-campaign-analyst](ia.md#skill-paid-media-campaign-analyst) · skill · 2026-10-30 · confirmado
- [Skill-produtos-afinz](ia.md#skill-produtos-afinz) · skill · 2026-10-30 · confirmado
- [Skill-report-live-release-engineer](ia.md#skill-report-live-release-engineer) · skill · 2026-10-30 · confirmado
- [Skill-segment-performance-analyst](ia.md#skill-segment-performance-analyst) · skill · 2026-10-30 · confirmado
- [Skill-sfmc-acquisition-email-designer](ia.md#skill-sfmc-acquisition-email-designer) · skill · 2026-10-30 · confirmado
- [Skill-sfmc-jornadas-pacote](ia.md#skill-sfmc-jornadas-pacote) · skill · 2026-10-30 · confirmado
- [Skill-storytellingfiltergaas](ia.md#skill-storytellingfiltergaas) · skill · 2026-10-30 · confirmado
- [Vault-como-Contexto](core.md#vault-como-contexto) · estrategia · 2026-06-08 · confirmado

### 10-Resultados

- [Dominio-CRM-Aquisicao](resultados-2.md#dominio-crm-aquisicao) · dominio · 2026-10-28 · ativo
- [Dominio-Midia-Paga](resultados-2.md#dominio-midia-paga) · dominio · 2026-10-29 · ativo
- [Dominio-Originacao-B2C](resultados-2.md#dominio-originacao-b2c) · dominio · 2026-10-29 · ativo
- [Dominio-Rentabilizacao](resultados-2.md#dominio-rentabilizacao) · dominio · 2026-10-29 · ativo
- [Iniciativa-Copa-2026](resultados-2.md#iniciativa-copa-2026) · iniciativa · 2026-10-29 · encerrada
- [Iniciativa-Pool-de-Ofertas-Parceiros](resultados-2.md#iniciativa-pool-de-ofertas-parceiros) · iniciativa · 2026-11-03 · ativo
- [Iniciativa-Pool-de-Ofertas-Vai-de-Visa](resultados-2.md#iniciativa-pool-de-ofertas-vai-de-visa) · iniciativa · 2026-11-03 · em-andamento
- [Ativacao-e-Boas-Vindas](resultados-2.md#ativacao-e-boas-vindas) · mecanica · 2026-10-29 · ativo
- [Comunicados-e-Testes](resultados-2.md#comunicados-e-testes) · mecanica · 2026-10-29 · ativo
- [Credito-e-Investimento](resultados-2.md#credito-e-investimento) · mecanica · 2026-10-29 · ativo
- [Incentivo-ao-Uso](resultados-3.md#incentivo-ao-uso) · mecanica · 2026-11-03 · ativo
- [Reativacao-e-Datas](resultados-3.md#reativacao-e-datas) · mecanica · 2026-10-29 · ativo
- [Seguros](resultados-3.md#seguros) · mecanica · 2026-10-29 · ativo
- [Acordo-Certo](resultados-3.md#acordo-certo) · parceiro · 2026-10-28 · parado
- [Alvorada](resultados-3.md#alvorada) · parceiro · 2026-10-28 · parado
- [Bem-Barato](resultados-3.md#bem-barato) · parceiro · 2026-10-28 · ativo
- [Bom-Pra-Credito](resultados-3.md#bom-pra-credito) · parceiro · 2026-10-28 · parado
- [Dia](resultados-3.md#dia) · parceiro · 2026-10-28 · ativo
- [Plurix](resultados-3.md#plurix) · parceiro · 2026-10-28 · ativo
- [Proprietaria](resultados-3.md#proprietaria) · parceiro · 2026-10-28 · ativo
- [Serasa](resultados-3.md#serasa) · parceiro · 2026-10-28 · ativo
- [Super-Nosso](resultados-3.md#super-nosso) · parceiro · 2026-10-28 · novo
- [Publico-Carrinho-Abandonado](resultados-3.md#publico-carrinho-abandonado) · publico · 2026-10-29 · ativo
- [Publico-Cartonistas](resultados-3.md#publico-cartonistas) · publico · 2026-11-03 · ativo
- [Publico-Leads-de-Parceiros](resultados-4.md#publico-leads-de-parceiros) · publico · 2026-10-29 · ativo
- [Publico-Pos-Instabilidade](resultados-4.md#publico-pos-instabilidade) · publico · 2026-10-28 · ativo
- [Publico-Recencia-de-Compra](resultados-4.md#publico-recencia-de-compra) · publico · 2026-10-28 · ativo
- [Publico-Repescagem](resultados-4.md#publico-repescagem) · publico · 2026-10-29 · ativo
- [Publico-Topo-de-Funil](resultados-4.md#publico-topo-de-funil) · publico · 2026-10-29 · ativo
- [Publico-Upgrade](resultados-4.md#publico-upgrade) · publico · 2026-10-29 · ativo

### 98-Legado

- [MOC-Conceitos](legado.md#moc-conceitos) · moc · 2026-06-08 · legado
- [DE_VDV_BASE_ELEGIVEL](legado.md#de_vdv_base_elegivel) · entidade · 2026-11-03 · substituido
- [DE_VDV_OFERTAS](legado.md#de_vdv_ofertas) · entidade · 2026-11-03 · substituido
- [BUs](legado.md#bus) · dimensao · 2026-06-10 · legado
- [Canais](legado.md#canais) · dimensao · 2026-06-10 · legado
- [Criativos](legado.md#criativos) · dimensao · 2026-06-08 · legado
- [Objetivos-de-Campanha](legado.md#objetivos-de-campanha) · dimensao · 2026-06-08 · legado
- [Ofertas](legado.md#ofertas) · dimensao · 2026-06-08 · legado
- [Parceiros](legado.md#parceiros) · dimensao · 2026-06-08 · legado
- [Perfis-de-Crédito](legado.md#perfis-de-crédito) · dimensao · 2026-06-08 · legado
- [Plataformas-Mídia](legado.md#plataformas-mídia) · dimensao · 2026-06-08 · legado
- [Produtos](legado.md#produtos) · dimensao · 2026-06-08 · legado
- [Segmentos](legado.md#segmentos) · dimensao · 2026-06-10 · legado
- [Subgrupos](legado.md#subgrupos) · dimensao · 2026-06-08 · legado
- [Configurações](legado.md#configurações) · operacao · 2026-06-08 · legado
- [Custos-e-Investimento](legado.md#custos-e-investimento) · operacao · 2026-06-08 · legado
- [Diário-de-Bordo](legado.md#diário-de-bordo) · operacao · 2026-06-08 · legado
- [Explorador-Avançado](legado.md#explorador-avançado) · operacao · 2026-06-08 · legado
- [GaaS-9-Áreas](legado.md#gaas-9-áreas) · operacao · 2026-06-08 · legado
- [Ingestão-de-Dados](legado.md#ingestão-de-dados) · operacao · 2026-06-08 · legado
- [Integração-Mídia-Paga](legado.md#integração-mídia-paga) · operacao · 2026-06-08 · legado
- [Jornada-Disparos](legado.md#jornada-disparos) · operacao · 2026-06-08 · legado
- [Launch-Planner](legado.md#launch-planner) · operacao · 2026-06-08 · legado
- [Mídia-Analytics](legado.md#mídia-analytics) · operacao · 2026-06-08 · legado
- [O-que-é-o-GaaS](legado.md#o-que-é-o-gaas) · operacao · 2026-06-08 · legado
- [Orientador](legado.md#orientador) · operacao · 2026-06-08 · legado
- [Originação-B2C](legado.md#originação-b2c) · operacao · 2026-06-08 · legado
- [Pilar-Automação-por-Histórico](legado.md#pilar-automação-por-histórico) · operacao · 2026-06-08 · legado
- [Relatório](legado.md#relatório) · operacao · 2026-06-08 · legado
- [Resultados](legado.md#resultados) · operacao · 2026-06-08 · legado
- [Casos-de-Uso](legado.md#casos-de-uso) · estrategia · 2026-06-08 · legado
- [Framework-v1-Diretor](legado.md#framework-v1-diretor) · estrategia · 2026-06-08 · legado
- [Entidades-v2](legado.md#entidades-v2) · evolucao · 2026-06-08 · legado
- [Arquitetura-Geral](legado.md#arquitetura-geral) · engenharia · 2026-06-08 · legado
- [Camada-de-Serviços](legado.md#camada-de-serviços) · engenharia · 2026-06-08 · legado
- [Como-Rodar-e-Deploy](legado.md#como-rodar-e-deploy) · engenharia · 2026-06-08 · legado
- [Componentes-por-Aba](legado.md#componentes-por-aba) · engenharia · 2026-06-08 · legado
- [Convenções-de-Código](legado.md#convenções-de-código) · engenharia · 2026-06-08 · legado
- [Decisões-Técnicas](legado.md#decisões-técnicas) · engenharia · 2026-06-08 · legado
- [Dívida-Técnica](legado.md#dívida-técnica) · engenharia · 2026-06-08 · legado
- [Histórico-de-Evolução](legado.md#histórico-de-evolução) · engenharia · 2026-06-08 · legado
- [Hooks-Catálogo](legado.md#hooks-catálogo) · engenharia · 2026-06-08 · legado
- [Modal-de-Disparo](legado.md#modal-de-disparo) · engenharia · 2026-06-08 · legado
- [Modelo-de-Estado](legado.md#modelo-de-estado) · engenharia · 2026-06-08 · legado
- [Módulo-Paid-Media-Afinz](legado.md#módulo-paid-media-afinz) · engenharia · 2026-06-08 · legado
- [Pipeline-ML](legado.md#pipeline-ml) · engenharia · 2026-06-08 · legado
- [Stack-e-Dependências](legado.md#stack-e-dependências) · engenharia · 2026-06-08 · legado

### (raiz)

- [README](core.md#readme)
