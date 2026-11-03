---
tags: [growth, resultados, catalogo, contexto-ia]
tipo: catalogo-analitico
camada: evolucao
atualizado: 2026-10-03
status: inferência
fonte: auditoria-integral-2026-10-02
---

# Catálogo analítico — Mídia paga, B2C e conexões

**Catálogo de possibilidades, auditado em 02/10/2026.** Não representa telas implementadas nem resultados certificados. Toda leitura deve acompanhar evolução mensal, cobertura e retrospectiva do mesmo recorte. A viabilidade registrada indica existência de campos; execução e decisão exigem os contratos e verificações descritos em [[Resultados-Qualidade-e-Cobertura]].

Use o sumário "Nesta página" para escolher um leque. Leia primeiro a pergunta e as condições; abra o histórico correspondente para consultar evidências. Esta organização reúne 120 possibilidades da auditoria anterior e preserva a data da avaliação.


## Mídia paga — Investimento e distribuição

**Pergunta:** Onde colocamos recursos e como a distribuição mudou?

**Condições:** Separar Meta/Google e observar cobertura e renomeações; orçamento não é gasto.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Investimento mensal por plataforma | Descritivo |
| Participação de campanha no investimento | Descritivo |
| Distribuição por objetivo canônico | Descritivo |
| Concentração nas três maiores campanhas | Descritivo |
| Variação de investimento por campanha | Descritivo |
| Calendário de gasto diário | Descritivo |

## Mídia paga — Tráfego e eficiência

**Pergunta:** O custo de chegar ao público ou gerar tráfego mudou?

**Condições:** Recalcular a partir de somas do mesmo recorte. Google: 87 linhas com cliques > impressões e 225 divergências do CTR percentual.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Impressões e cliques mensais | Condicionado |
| CTR ponderado por campanha | Condicionado |
| CPC ponderado por campanha | Condicionado |
| CPM ponderado por campanha | Condicionado |
| Dispersão investimento × cliques | Condicionado |
| Decomposição gasto = impressões × CPM | Condicionado |

## Mídia paga — Campanhas e objetivos

**Pergunta:** Quais campanhas sustentam o resultado de cada frente?

**Condições:** 34 campanhas canônicas, ainda com certificação pending_review/source_id_only; CPA event/optimization event nulos. Taxonomia raw não é objetivo de negócio.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Dossiê mensal de campanha | Descritivo |
| Ranking dentro do mesmo objetivo | Descritivo |
| Contribuição de campanha para variação | Descritivo |
| Entrada e saída de campanhas do mix | Descritivo |
| Histórico por identidade canônica | Descritivo |
| Cobertura de objetivo e aliases | Descritivo |

## Mídia paga — Conjuntos e anúncios

**Pergunta:** Onde o desempenho se concentra dentro da campanha?

**Condições:** Meta tem 208 anúncios/40 conjuntos históricos. Google tem dois IDs de anúncio e um conjunto; não projetar a mesma profundidade. Nenhuma duplicidade na chave candidata testada.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Pareto dos anúncios | Condicionado |
| Pareto dos conjuntos | Condicionado |
| Histórico por anúncio | Condicionado |
| Dispersão gasto × conversão reportada | Condicionado |
| Dependência de um anúncio dominante | Condicionado |
| Persistência do resultado dos anúncios | Condicionado |

## Mídia paga — Criativos e mensagens

**Pergunta:** Quais peças e mensagens acompanharam resultados melhores?

**Condições:** 382 cadastros, 186/208 anúncios Meta vinculados. Body em 95; variações de body em 264; insights não vazios em 79. Status atual e asset atual não provam versão histórica. Comparações observacionais, sem causalidade.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Galeria de peças com histórico | Condicionado |
| Imagem versus vídeo em recortes comparáveis | Condicionado |
| Resultados por creative_id | Condicionado |
| Resultados por copy e título disponíveis | Condicionado |
| Comparação de CTA e proporção da peça | Condicionado |
| Variações de assets com evidência da plataforma | Condicionado |

## Mídia paga — Eventos no app

**Pergunta:** O caminho até o evento de interesse está evoluindo?

**Condições:** Ações detalhadas cobrem apenas duas campanhas Meta. Usar medida primária do event_map, vigência, janela única, source e fact/ad. StartTrial não equivale a emissão. Razões de eventos não são conversão de pessoas/coortes.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Instalações atribuídas por mês | Condicionado |
| Sessões atribuídas ao longo do tempo | Condicionado |
| Checkout iniciado por período | Condicionado |
| StartTrial atribuído por período | Condicionado |
| Custo por evento escolhido | Condicionado |
| Relações entre etapas com cobertura pareada | Condicionado |

## Mídia paga — Atribuição e reconciliação

**Pergunta:** Quanto da leitura depende da janela e da fonte?

**Condições:** 743.616 registros brutos incluem versões e janelas. View latest tem 65.844 linhas, 38.096 fact/ad. Nunca somar janelas, aliases, versões ou níveis. Entity spend se repete por evento/janela; obter custo único da entidade.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Comparação 1d/7d/28d click | Condicionado |
| Click-through versus view-through | Condicionado |
| Resultados versus actions | Condicionado |
| Reconciliação anúncio/conjunto/campanha | Condicionado |
| Revisão dos eventos ao longo das coletas | Condicionado |
| Cobertura de eventos canônicos | Condicionado |

## Mídia paga — Engajamento e saturação

**Pergunta:** Há sinais consistentes de atenção ou desgaste?

**Condições:** Eventos auxiliares ainda sem canônico: preservar nomes/status e homologar definições. Não somar page/post_engagement ou aliases. Frequência Meta tem 18 valores >100; 19 inconsistências com impressões/alcance. Google reach/frequency sempre zero: indisponibilidade, não alcance real zero.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Reações e comentários por período | Condicionado |
| Compartilhamentos e salvamentos observados | Condicionado |
| Video views por anúncio | Condicionado |
| Visitas à LP por campanha | Condicionado |
| Mensagens iniciadas e respondidas | Condicionado |
| Frequência versus CTR por anúncio/dia | Condicionado |

## Mídia paga — Orçamento e metas

**Pergunta:** O realizado acompanha o planejado?

**Condições:** Targets vazios. Orçamentos por objetivo só abr–jun/2026; por campanha só abr/2026. Não criar pacing de setembro/outubro usando orçamento antigo. Metas das campanhas não homologadas.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Realizado versus orçamento por frente | Histórico parcial |
| Ritmo de gasto por mês válido | Histórico parcial |
| Execução de alocação por campanha | Histórico parcial |
| Diferença entre orçamento e realizado | Histórico parcial |
| Disponibilidade de metas por período | Histórico parcial |
| Histórico de revisão de metas e orçamento | Histórico parcial |

## Mídia paga — Mensuração e qualidade

**Pergunta:** Quais resultados estão aptos para uso?

**Condições:** Meta metrics até 01/10, Google até 17/08. Coletas modernas Meta completas até 02/10; logs legados falhos até 15/07. Gasto com zero conversão reportada é sinal para investigar, não prova de desperdício.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Cobertura diária por plataforma | Descritivo |
| Latência e atualização por fonte | Descritivo |
| Completude por métrica e mês | Descritivo |
| Campanhas com gasto e conversão reportada zero | Descritivo |
| Saúde das coletas atuais versus legadas | Descritivo |
| Mapa de anomalias e certificação | Descritivo |

## B2C — Produção e evolução

**Pergunta:** Como a originação total evoluiu?

**Condições:** 635 dias tipo total, 01/01/2025–27/09/2026. Não usar setembro como mês fechado nem outubro como produção zero.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Propostas e emissões mensais | Descritivo histórico |
| Evolução diária dentro do mês | Descritivo histórico |
| Acumulado em janelas equivalentes | Descritivo histórico |
| Comparação com mesmo mês do ano anterior | Descritivo histórico |
| Contribuição dos dias para variação mensal | Descritivo histórico |
| Distribuição e estabilidade da produção diária | Descritivo histórico |

## B2C — Conversão e gargalos

**Pergunta:** O resultado mudou por entrada de propostas ou taxa agregada?

**Condições:** Recalcular somas; duas divergências de percentual armazenado. Emissão e proposta do mesmo dia não demonstram conversão de mesma coorte; não há aprovados nem tempos de passagem na tabela.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Razão emissões/propostas por mês | Condicionado |
| Volume versus razão de conversão | Condicionado |
| Decomposição da mudança em volume e taxa | Condicionado |
| Razão por dia da semana | Condicionado |
| Dias atípicos de volume ou taxa | Condicionado |
| Evolução da dispersão entre dias | Condicionado |

## B2C — Serasa e composição

**Pergunta:** Quanto da evolução depende do Serasa?

**Condições:** Serasa é subconjunto, não parcela adicional; 270 dias pareados. Residual = total - Serasa; não chamá-lo CRM. Em maio, 31/31 dias conciliam total = Serasa + crm; isso não prova classificação dos demais meses.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Participação de Serasa nas emissões | Descritivo histórico |
| Participação de Serasa nas propostas | Descritivo histórico |
| Histórico total e Serasa em paralelo | Descritivo histórico |
| Evolução do residual não Serasa | Descritivo histórico |
| Razão de conversão Serasa versus residual | Descritivo histórico |
| Contribuição de Serasa para mudança total | Descritivo histórico |

## B2C — Metas e ritmo

**Pergunta:** A produção acompanha a meta válida?

**Condições:** 10 metas jan–out/2026. Ago–out herdadas de julho; expor origem/validade. Pacing só com corte disponível, calendario aprovado e dias fechados; cenário é projeção, não previsão certificada.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Emissões realizadas versus b2c_meta | Histórico parcial |
| Atingimento mensal | Histórico parcial |
| Gap por mês | Histórico parcial |
| Ritmo diário necessário | Histórico parcial |
| Cenários de fechamento com premissas explícitas | Histórico parcial |
| Meta original versus herdada | Histórico parcial |

## B2C — Calendário e persistência

**Pergunta:** O comportamento se repete ou foi pontual?

**Condições:** Calendário derivável da data. Feriados/dias úteis operacionais requerem calendário governado. Persistência não identifica a causa; variações sazonais não são efeito de campanha.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Mapa dia da semana × mês | Descritivo histórico |
| Evolução por semana | Descritivo histórico |
| Comparação dias úteis/finais de semana | Descritivo histórico |
| Persistência de altas e quedas | Descritivo histórico |
| Primeira versus última parte do mês | Descritivo histórico |
| Baseline móvel própria de 7/28 dias | Descritivo histórico |

## B2C — Qualidade e proveniência

**Pergunta:** Como sabemos que o resultado está correto?

**Condições:** 936 linhas sem repetição data/tipo. CRM só maio/2026. Fonte tipada b2c_daily não existe neste schema; leitura do código mostra risco de incluir tipo crm no total em useOriginacaoDashboard. Não certificada em navegador.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Cobertura por tipo e período | Descritivo |
| Conciliação total/Serasa/CRM | Descritivo |
| Percentual armazenado versus recalculado | Descritivo |
| Completude de share e taxa de canal | Descritivo |
| Observações operacionais ligadas à evolução | Descritivo |
| Auditoria da regra de totalização da tela | Descritivo |

## Conexões — CRM e originação

**Pergunta:** Como os resultados registrados no CRM se relacionam com a originação?

**Condições:** Exigir escopo B2C, grão de activities reconciliado e janelas compatíveis. CRM/Serasa podem ter sobreposição; soma não é aquisição única. Data de disparo e emissão podem ser distintas.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Produção CRM e B2C lado a lado | Reconciliação necessária |
| Relação cartões CRM/originação com ressalva | Reconciliação necessária |
| Conciliação diária por origem | Reconciliação necessária |
| Variação de mix CRM/Serasa/residual | Reconciliação necessária |
| Segmentos CRM associados à evolução total | Reconciliação necessária |
| Calendário de mudanças de régua e originação | Reconciliação necessária |

## Conexões — Mídia e aquisição no app

**Pergunta:** A leitura da plataforma concorda com a aquisição observada?

**Condições:** AppsFlyer acquisition tem 2.372 linhas; campaign 1.168. Só escopo af inz B2C; Android raw e agregado Android/iOS sobrepostos em 52 dias. Fontes e coortes não devem ser somadas. Cost campaign parcial e USD; aquisição cost totalmente nulo. Comparação de investimento/originação é correlacional.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Instalações AppsFlyer por origem | Condicionado |
| Mídia paga/CRM/parceiros/orgânico no histórico | Condicionado |
| Plataforma versus AppsFlyer por campanha | Condicionado |
| Aquisição por geografia disponível | Condicionado |
| Investimento e instalações no período comum | Condicionado |
| Investimento e originação em séries paralelas | Condicionado |

## Conexões — Templates e instalações CRM

**Pergunta:** Quais comunicações têm instalações associadas?

**Condições:** 631 linhas de 64 templates; 28 templates/352 linhas têm vínculo por ID com activities. Cliques/sessões AF do template estão ausentes; decisões de auditoria vazias. Associação por template não atribui instalação a disparo específico.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Instalações por template e mês | Vínculo parcial |
| Templates AppsFlyer vinculados ao CRM | Vínculo parcial |
| Evolução de instalação após disparos | Vínculo parcial |
| Régua/segmento associados a templates | Vínculo parcial |
| Cobertura e conflitos do vínculo | Vínculo parcial |
| Fila de homologação do rateio por disparo | Vínculo parcial |

## Conexões — Retrospectiva e aprendizado

**Pergunta:** O que aprendemos e o que será verificado no próximo ciclo?

**Condições:** 340 insights com campo evidencias não vazio não são 340 aprendizados validados. Campaign_context tem sete campanhas e nenhuma hipótese/KPI alvo preenchidos. Integrar Wiki e entidades do loop preservando revisão/autoria/validade.

| Possibilidade | Prontidão na auditoria |
|---|---|
| Retrospectiva do recorte por mês | Integração necessária |
| Linha do tempo de decisões e mudanças | Integração necessária |
| Sinais ligados a apostas e evidências | Integração necessária |
| Outcome e revisão do aprendizado | Integração necessária |
| Reuso explicado por recorte compatível | Integração necessária |
| Lacunas de evidência e próxima verificação | Integração necessária |

## Retrospectiva junto da análise

Escolher uma possibilidade não cria um aprendizado. Registrar a evolução do mesmo recorte, fatos e hipóteses separados, ação proposta e evidência necessária para verificar. Se fonte, vínculo, evento ou cobertura faltar, registrar a pendência. [[Retrospectiva-Mensal-Growth]] orienta esta etapa.

## Conexões

[[Resultados-CRM]] · [[Resultados-Midia-Paga]] · [[Resultados-B2C]] · [[Historico-Resultados-CRM]] · [[Historico-Resultados-Midia-Paga]] · [[Historico-Resultados-B2C]].
