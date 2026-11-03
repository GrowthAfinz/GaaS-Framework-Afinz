---
tags: [sfmc, packs, governanca, template-id, jornadas, gaas, aprendizados]
tipo: operacao
camada: operacao
atualizado: 2026-10-09
status: parcialmente-implementado
fonte: decisoes-do-operador-codigo-gaas-packs-e-supabase
---

# Packs SFMC: fluxos, vínculos e aprendizados

Consolidação das decisões de Pablo e das verificações realizadas até 09/10/2026. Complementa [[Comunicacoes-Pacote-SFMC-Catalogo]], [[SFMC-Package-Manager-e-Pacotes]] e [[Auditoria-Jornadas-SFMC-2026-10]]. Os números são snapshots, não contadores permanentes. O Vault é a fonte viva de conhecimento; o GaaS é sua projeção operacional.

## Entidades que não podem ser confundidas

1. Template governado: identidade externa `af_sub3`, com caixa preservada.
2. Versão de conteúdo: texto, assunto, pré-header, HTML, mídia, parâmetros e botões.
3. Uso configurado: importação, jornada, versão, ocorrência, nó, ramo, caminho e posição.
4. Execução: `activities.id`, data real, jornada, Activity Name, canal e dimensões registradas.
5. Decisão: evidência, autor, escopo, vigência, snapshots e auditoria.

O pack comprova configuração exportada, não envio histórico nem passagem de contatos por um ramo. Aprovação editorial não implica vínculo de execução. Vínculo não certifica a versão de conteúdo enviada.

## Ramificações e reuso: regra central

A mesma peça pode ser repetida em nós, momentos e caminhos distintos, inclusive com IDs diferentes. Não deduplicar ocorrências pelo asset, body ou template. Preservar cada nó e sua posição no grafo. Na VIBE SEM1, disparos 2 e 4 reutilizam asset: isso não é erro por si só nem permite juntar os caminhos.

Separar ordinal global, ordinal por canal, `af_sub2`, dia acumulado, semana, subgrupo e data de calendário. Upgrade menor / aprovados não convertidos pode reutilizar mensagens de Repescagem: preservar o segmento da execução e explicitar a relação de reuso; não reclassificar silenciosamente como Negados.

Se o mesmo Activity Name aparece em vários nós do mesmo fluxo, métricas por nome não comprovam qual ramo executou. Expor a ambiguidade e não distribuir resultados entre nós por suposição. Reuso entre jornadas precisa de evidência contextual e temporal.

## Governança das tags

`c` declara campanha; `af_sub1` declara segmento/base/público; `af_sub2` declara momento de tracking; `af_sub3` identifica o template. A interpretação é por campo e por família, não por split posicional universal.

As mais de 30 colunas de `activities` fornecem contexto: BU, parceiro, Segmento, Subgrupos, Oferta, Promocional, data, bases e métricas. Nome de jornada e Activity Name são evidências auxiliares e detalhes completos, não títulos dominantes na interface. Usar tags diretas B2C, B2B2C etc., sem prefixos desnecessários.

Oferta e Promocional são dimensões distintas: Vibe e Padrão podem coexistir, sem conflito. Copa não deve aparecer por inferência indevida da peça. Resolver divergência por dimensão, preservando a fonte. Um ID com `bsp` não substitui uma declaração CRM conhecida da governança/execução.

Para Abandonados, usar os valores oficiais de Subgrupos: `D-21 A D>7` para 21D, `D-7` para sábado/7D e `Diário` para a régua diária. Confirmar a coluna e o uso concreto antes de classificar; não adicionar família/recência redundantes. `Dispd1_21d` significa disparo 1 e qualificador 21D, nunca disparo 121. Negados e outras réguas podem usar D como disparo; topo/e-mail/CRM usam S e D segundo a governança da régua. Não tratar ordinal como duração.

## Packs com e sem ID

Priorizar comunicações com link parametrizado. Sem ID, apresentar aviso e proposta revisável; não fabricar identidade nem promover opt-out a mensagem de campanha. Manifestos, referências, dependências e IDs técnicos são rastreabilidade: ocultar do cotidiano, preservar no ZIP.

## Fluxo de jornadas: contrato visual

Nome do produto: **Fluxo de jornadas**. Preservar gramática do Journey Builder: losangos laranja para decisão/espera; azul-marinho Einstein; quadrados verde-água para canais/atualizações; círculos verdes para saídas. Grade, conectores ortogonais e rótulos colados à bifurcação. Entrada mostra DE, filtro, agendamento/reentrada; não inventar contagem de contatos.

Miniaturas pequenas servem para reconhecimento; ficha lateral única concentra prévia legível, Activity Name completo, ID observado, tags e fontes, caminho, reuso, vínculo, métricas e evolução. Dia nominal soma esperas do caminho; Einstein acrescenta janela separada. Espera variável vira dia variável. Saídas conservam dia acumulado quando determinável.

O grafo não é sempre árvore: joins exigem DAG, otimização/eventos tornam duração variável, ciclos precisam de tratamento explícito. Implementação própria em grade/SVG, sem React Flow/elkjs/dagre. Filtros progressivos de contexto/parceiro/B2C → segmento → jornada → versão; filtros do disparo destacam caminhos sem destruir o grafo. Tela cheia e enquadramento são ações distintas. PNG/PDF e modo só fluxo atendem jornadas maiores.

## Previews: causa dos erros e correção implementada

Quatro packs importados continham 29 ocorrências de e-mail, 118 WhatsApp, 29 SMS e nenhum Push. Ausência de Push nesses packs não significa ausência do canal: o catálogo possuía seis templates Push com arquivo.

No extrator antigo, imagens acima de 300.000 caracteres base64 dependiam de publishedURL; vários assets não tinham URL publicada. Assim, logos pequenos apareciam, mas banners/GIF desapareciam. Seis HTMLs também foram omitidos pelo orçamento de 6 MB por pack. Copiar todo computedStyle na rasterização deformava espaços e textos.

Release `e8a51a2d2e3cbd5c983c02f1b3b4c7ceeca78a2d`: recursos visuais privados deduplicados por importação, HTML de referência e resolução `sfmc-asset:`; staging atômico; recuperação aditiva dos 29 e-mails sem alterar snapshots/ZIPs originais. Derivados WebP podem ser redimensionados; não são bytes idênticos ao original. HTML sanitizado no leitor, sem execução de scripts/AMPscript. Raster derivado preserva documento; cache privado versionado. Catálogo compatível é fallback explícito, não certificado histórico. Origem aprovada ambígua não escolhe arquivo arbitrário.

URL Salesforce é útil quando realmente presente e acessível. Não assumir que todo arquivo embutido possui URL. Disponibilidade de HTML no catálogo não certifica todas as imagens. Aviso legado pode persistir em metadados do canvas mesmo com recuperação visual; não confundir aviso antigo com falha atual do leitor.

## Resultados e lacunas ainda abertas

Todas as métricas e gráficos respeitam período selecionado, datas de São Paulo e filtros. Ausência de taxa não vira zero. Taxa de entrega ponderada usa Base Total somente com cobertura de taxa/denominador válida; não inventar volume entregue. Agregação não comprova causalidade ou versão enviada.

Performance diferencia: com template vinculado; execuções sem template para revisão; comunicações aprovadas sem execução no período, com prévia e aviso, sem ranking/métricas inventadas. A visão consolidada orienta-se por template e agrega as atividades que comprovadamente o utilizaram.

**Lacuna verificada em 09/10:** `occurrenceExecutions` ainda exige template_id para resultados de Esta atividade. Corrigir para permitir métricas pelo contexto exato mesmo sem vínculo, preservando ambiguidade de nós repetidos. Não documentar essa correção como implementada. Histórico fora do período é cobertura, não soma de resultados do recorte.

**Caso DIA verificado em 09/10:** pack `JOR_AQS_B2B2C_DIA_CRM_AQUISICAO_PAD_VIBE_SEM1`, Activity `afz_car_dia_aqs_email_crm_disp1s1vibe_pontual`, ID `dia_email_vibe_bsp_S1D01`. Base usa jornada equivalente `JOR_AQUISICAO_...`, mas Activity `afz_car_vis_aqs_email_dia_disp1s1vibe_pontual`. Registro 21/08/2026: Base Total 238.716; Base Acionável 236.476; Segmento CRM; Oferta Vibe; Promocional Padrao; template_id vazio; taxas de abertura/clique ausentes. Outubro não tem resultado, mas a mensagem nenhum histórico perde o alias de Activity Name. Propor crosswalk explícito por jornada/canal/contexto e vigência; não substituir nomes globalmente nem assumir identidade só pelo sufixo. Alias ainda não implementado/aplicado neste registro.

## Auditoria de vínculos — 09/10/2026

Antes da aplicação: 7.912 registros; 1.073 vinculados; 6.839 sem template. Correspondência exata dos packs encontrou 136 sem vínculo: 82 com ID único cadastrado/canal compatível, 47 com ID ausente do catálogo, sete com IDs ambíguos. Os 82 abrangiam 37 grupos e 28 templates; 31 tinham comunicação aprovada, 29 com catálogo ativo e dois rascunhos. Histórico adicional sugeria 874 candidatos, não vínculos certificados. Treze registros preenchidos divergiam do ID observado no pack: manter para investigação, sem sobrescrever.

Pablo autorizou aplicar os casos de maior certeza e ignorar histórico anterior à Copa. Corte conservador aplicado: **15/04/2026**, da nota [[Copa-2026]]; não universalizar como início de tracking de todo sistema nem confundir com calendário esportivo.

Aplicados **96 vínculos**, por `link_communication_executions`, em 17 lotes auditados: E-mail 15, SMS 31, WhatsApp 13, Push 37. Foram 59 sustentados por pack+aprovação ou histórico concordante e 37 de continuidade estritamente entre primeira/última data já vinculada, com BU/Segmento/Subgrupos/Oferta/Promocional iguais. Dos 135 Push inicialmente nessa janela, filtros de duplicidade/reviews deixaram 37 elegíveis. Os 28 SMS `afz_car_bbt_aqs_sms_car_d3vibe_diario` foram ligados a `bb_car_vibe_inst_Dispd3`.

Validação pós-aplicação: 96 IDs confirmados; nenhum template anterior não nulo; nenhum registro pré-corte; total 1.169 vinculados e 6.743 sem vínculo. Dois vínculos apontam para template em rascunho com comunicação aprovada: não ativamos o catálogo nem alteramos versão corrente. Alteração de dados não exige deploy frontend. Contagem física não equivale a pessoas/disparos únicos certificados.

Aplicação usa snapshots completos, bloqueio concorrente, IDs únicos, janela explícita e auditoria. Nunca vínculo irrestrito por Activity Name. Não alterar grupos de duplicidade revisados: mudança de snapshots pode invalidar projeção. Não extrapolar continuidade para datas fora da janela apenas porque nome/template parecem iguais.

## Próximos passos registrados, não executados

- Crosswalk de Activity Name com fonte, contexto, vigência e revisão, incluindo DIA.
- Resultados de atividade independentemente de template_id; agregação de template continua exigindo vínculo real.
- Fila comunicação aprovada / vínculo pendente, simulação dos IDs e aprovação por evidência.
- Reuso de decisões delimitado por conteúdo, ramo, dimensões e janela; conflitos bloqueiam lote.
- Ajustar avisos legados e verificar cobertura por canal sem prometer prévia completa universal.
- Aprendizado Growth pode consumir evidências governadas; não transformar configuração de pack em outcome causal validado.

## Referências verificáveis

Código: `src/modules/sfmc-package/parsePackage.ts`, `journeyFlow.ts`, `src/components/communications/journeys/`, `src/services/journeyReadService.ts`, `communicationService.ts`; documentação `docs/tabs/fluxo-jornadas.md`. Skill `.claude/skills/sfmc-jornadas-pacote/SKILL.md`.

Banco: `sfmc_journey_snapshots`, `journey_flow_messages_v`, `sfmc_visual_assets`, `sfmc_visual_messages`, `communication_execution_links`, `communication_execution_reviews`, `activities`. RPCs de leitura preservam RLS; fontes privadas não devem ser publicadas em artefatos. QA local e checks de deploy não substituem Test Send do SFMC nem UAT autenticada do operador.


## Contexto e resultados — revisão 09/10/2026

BU e parceiro são resolvidos por registro de activities, sem cruzar listas independentes. BSP de B2B2C/Plurix é exibido como CRM; o ID original permanece intacto. A seleção de BU limita também os contextos das mensagens.

Resultados da atividade incluem execuções sem template. A consolidação do template usa somente vínculos efetivos, mesmo segmento e filtros do recorte. Usos de outros segmentos aparecem como referências em Outros usos, sem entrar no gráfico. Contagens históricas nessa aba são registros de origem, sem certificar versão enviada ou métricas após revisão de duplicidade.

Equivalências explícitas de contexto são auditadas em journey_flow_context_aliases: DIA SEM1 e jornadas B2C Vibe de Abandonados (Aquisição no pack / Reativação em activities). Nenhum nome original ou template_id foi alterado. Escrita autenticada comum não é permitida nessa tabela.

Teste real pelo RPC autenticado e pela projeção de execuções usada na tela, de 01–30/09/2026, B2C/Serasa/Abandonados:
- afz_car_vis_aqs_wpp_car_d1ecredvibe_diario: 30 ativações, base 3.063, 2.094 aberturas e 181 cartões; sem vínculo de template.
- afz_car_vis_aqs_sms_car_d3ecred_diario: 30 ativações, base 2.766 e 44 cartões; 30 vínculos b2c_car_vibe_srsa_Dispd3.
- Cliques e taxa de entrega não informados nos dois exemplos. SMS sem abertura informada.
- Outubro: zero registros nos dois contextos.

Validação: 382 testes, build, gate TypeScript sem novos erros e teste SQL/RLS. Backend aplicado em produção; frontend desta revisão ainda local, sem commit/push nesta etapa.
