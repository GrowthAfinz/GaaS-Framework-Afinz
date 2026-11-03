---
tags: [gaas, comunicacoes, performance, sfmc, jornadas]
tipo: implementacao
camada: evolucao
atualizado: 2026-10-19
status: confirmado
fonte: codigo-gaas-e-supabase
---

# Performance por atividade e Fluxo de Jornadas

Contrato aprovado por Pablo e implementado em 19/10/2026. Complementa [[Performance-do-Conteudo-GaaS]]. A interface foi publicada pelo commit 692f00d; o ajuste de reversão manual está na main em afe4965 e nas migrations aplicadas no Supabase.

## Resultado antes do vínculo

Performance responde primeiro qual foi o resultado e depois a quais conteúdos é possível atribuí-lo. Todos é um recorte junto de Com template vinculado, Vínculos pendentes e Comunicações aprovadas. Visão Geral, Galeria e Tabela são modos de apresentação.

Todos contém atividades com registros no período global, independentemente de template_id. Uma atividade é agrupada por BU de negócio, jornada normalizada, Activity Name exata e canal. Execuções são contadas por activities.id após a projeção de revisões de duplicidade válidas. Atividades e execuções têm contagens distintas; conteúdos aprovados não são somados a grupos de atividades.

Sem template vinculado aparece explicitamente, com atalho para Cadastro e templates que leva jornada, Activity Name, canal e IDs pendentes. A volta preserva os filtros e o modo da Performance.

## Fluxo e resultados compartilhados

O leitor de comunicação não exige template_id para exibir os resultados da atividade exata. Fluxo e Performance compartilham KPIs de base total/acionável, aberturas, cliques, propostas, aprovados, cartões, custo e CAC, funil e evolução diária em barras de volume e linha de taxa. Ausências não viram zero; taxas e CAC exigem cobertura completa dos componentes. O painel da jornada consulta todas as páginas antes de totalizar.

Momento operacional, tempo relativo do grafo e identidade do conteúdo permanecem separados. Reuso de uma peça em outro toque não altera seu ID nem a posição do nó. Os resultados registrados não comprovam passagem individual por ramos nem a versão enviada.

## Automação e exceções

Entrada de dados, ingestão de pack e aprovação de novo ID tentam correspondência exata por jornada, Activity Name e canal. A conta SFMC declarada é respeitada; não se escolhe por score, semelhança ou ordinal. Exige um único ID conhecido/aprovado, sem conflito de origem ou de vínculo histórico. Templates novos exigem aprovação; usos exatos conhecidos não exigem confirmação repetitiva.

Se a mesma atividade apresentar templates diferentes, notificar e suspender novas atribuições automáticas. Preservar vínculos anteriores. communication_auto_links registra fonte, regra e estado anterior; correção ou reversão manual revoga a decisão automática para aquela execução.

## Ingestões

Configurações → Packs SFMC exibe histórico recebido, jornadas/versões, conteúdos pendentes e notificações. Data do recebimento, data de criação do snapshot e última execução são distintas. BU SFMC Afinz/Plurix é diferente das dimensões de negócio B2C/B2B2C/Plurix. Origens legadas B2C não comprovam a conta física; não atribuir uma BU nem uma última atualização sem evidência. Próximas cargas por agente devem declarar --escopo Afinz ou --escopo Plurix.

## Evidência da implantação

As migrations 20261019141419_content_performance_integration, 20261019142130_approved_proposal_auto_attribution e 20261019142534_automatic_attribution_manual_override foram aplicadas ao projeto mipiwxadnpwtcgfcedym.

A primeira reconciliação criou 29 vínculos, preservando os 1.169 anteriores e os valores de origem/métricas dos 8.150 registros. Outubro manteve 227 execuções e 685 cartões registrados; a quantidade com vínculo passou de 16 para 35. Os envios de 05 e 06/10 da atividade afz_car_vis_aqs_email_bsp_disp1s1vibe_pontual na jornada B2C SEM1 foram associados a b2c_email_vibe_bsp_S1D01.

Validação: 482 testes frontend; contratos SQL de atribuição, aprovação, divergência, acesso e reversão; QA isolado de Galeria, Tabela, Visão Geral, modal, navegação ao cadastro e mobile; regressão TypeScript e build. Histórico técnico em calendar-estrategico/docs/reference/SFMC_PACKAGE_INGESTION.md.
