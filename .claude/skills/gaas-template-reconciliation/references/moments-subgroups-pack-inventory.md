# Momento, subgrupo e cobertura dos packs

Revisão de 07/10/2026, por orientação explícita de Pablo. Confrontada com o XLSX GOVERNANÇA_LINKS_E_TEMPLATES (5).xlsx (SHA-256 b466200d0cb215f74e9b32a947a5eeb08f66aa7a3a29757b6975852053207c51), o Vault e o banco vivo. As contagens abaixo são um levantamento datado, não regras permanentes.

## Semântica do momento

O parser deve manter moment_kind (disparo, dia_relativo, semana_dia, desconhecido), valor, fonte e escopo da régua/canal. Não colapsar tudo em seq Dn e depois chamar sempre dia ou sempre disparo.

- b2c_car21_vibe_inst_Dispd1: Disp identifica Disparo 1. car21 qualifica a variação de carrinho/público 21D, não ordinal 21. inst é Institucional nesse contrato, sem extrapolar para o segmento Instabilidade.
- Negados e outras réguas por toques: Dn pode declarar disparo n. A instrução atual do operador e Motor-de-Briefing-Automatico.md sustentam a interpretação por régua, não um intervalo universal em dias.
- Topo de funil / e-mail / CRM com calendário SxDy: pela definição atual do operador, S é semana e D é dia. Exemplo S1D01 -> Semana 1 · Dia 1. Dia exige origem relativa definida para se transformar em data concreta.
- Performance-do-Conteudo-GaaS.md contém a regra histórica S3D01 -> Semana 3 · Disparo 1. Há conflito documental real: a instrução explícita mais recente do operador prevalece na revisão da UI. Não apagar a evidência antiga nem alegar consenso no Vault.
- Workbook VIBE G2=s1, H2=dia_email_vibe_bsp_S1D01 e K2=CRM: af_sub2 não contém todo o momento do ID, e o segmento declarado CRM prevalece sobre bsp legado. VIBE G66=d1, H66=b2c_wpp_vibe_ngd_D1, K66=Negados: aplicar contrato por régua.
- VIBE H124/H125 terminam DispD2 enquanto G124/G125=d1: Disparo 2 declarado no ID e tracking d1 precisam permanecer separados, sem uma fonte sobrescrever a outra.
- Não inferir vigência/envio pelo sufixo MAIO26/SET26. Data de registro, dia relativo, semana editorial, ordem global, ordinal por canal e tracking são campos diferentes.

A coluna activities.Ordem de disparo também pode conter erros de extração. No recorte de jornadas Abandonados com 21D/21DIAS/SABADO/SAB, existem ordens 21, 31 e 20260917. Uma data YYYYMMDD e um número coincidente com recência não são ordinais válidos por simples positividade. Identificar conflito e propor revisão usando gramática do ID, condição do ramo e governança; não migrar a base automaticamente.

## Subgrupos

O banco inteiro possuía estes 15 valores distintos em 07/10: Diario, N/A, Churn, Leais, Abandonados D-7, Novos, Frequentes, Sem Segmento, Ocasional, Pre_Churn, Abandonados D-21 A D>7, Compradores D-7, Ativo, Ativacao, Leal.

- Abandonados D-21 A D>7 existia em 34 registros. Não criar outra dimensão visível de Família Carrinho 21D ou Recência/cadência para substituir classificação de subgrupo incompleta.
- Diario aparece em 4.450 registros e mistura frequência com classificação de público. Não convertê-los todos em 21D: pode haver régua diária legítima e outros segmentos.
- Na linha afz_car_vis_aqs_wpp_car_disp21vibeint_pontual de MAIO26: Segmento=Abandonados, Subgrupos=Diario, Ordem=21, DE=b2c_carrinho_manha_21. Isso sustenta uma proposta contextual de revisão; o filtro exportado é principalmente de CPF e não comprova sozinho os limites exatos de D-21 A D>7.
- Corrigir/reclassificar por evidência de população e ramo. Enquanto não confirmado, mostrar subgrupo proposto 21D com divergência cadastral consultável, sem alterar a coluna de origem.
- Sábado pode indicar agendamento e coexistir com público de recência 21D. Não torná-lo automaticamente um público distinto apenas pelo nome carsab.
- Leal/Leais é alias candidato já apontado em Subgrupos.md; preservar o valor original e a origem até decisão governada.

## Período e apresentação

A revisão solicitada usa o único período do cabeçalho global (PeriodContext). Base Total, Base Acionável, número de registros/execuções, resultados, última data e ordenações devem usar o mesmo início/fim, em São Paulo. Remover o intervalo independente Execuções de/até. Um calendário secundário, se útil, lê e modifica o mesmo estado do calendário superior.

Propostas/ocorrências configuradas não são execuções do período. Um pack pode oferecer contexto para execução passada sem provar a versão enviada. Exibir pendências sem execução como categoria explícita, sem incorporá-las às métricas de envio. Acervo histórico para sugestão deve ficar separado e identificado; não alimentar cartões/métricas do recorte com todo o histórico.

Tags da fila usam valores diretamente: B2C, WhatsApp, Abandonados, 21D, Vibe, Institucional. Rótulos de campo e origem ficam no tooltip/expansão. Remover Família e Recência/cadência da linha principal quando redundantes com subgrupo. A decomposição de ID pode conservar detalhes técnicos na expansão.

## Inventário e regra de presença de ID

O ZIP Minha definição - October 7, 2026 at 4_09_14 PM-v1.zip contém sete estruturas de jornada, mas seis nomes distintos. Carrinho21D SET26 aparece duas vezes, ambas na versão 1, com origens diferentes (14bd2711… e 8c782341…). Não deduplicar por nome/versão nem interpretar isso como teste A/B comprovado.

Há 18 mensagens WhatsApp: 14 de campanha e quatro opt-outs. Das 14 de campanha, oito possuem af_sub3 no link e seis não; todas as 14 possuem link. Os oito usos contêm seis IDs distintos. Quatro estruturas têm af_sub3 em todos os envios de campanha e três estruturas não o têm em nenhum. Agregando por nome: três completas, duas sem ID e uma mista.

Reconciliar em trilhas separadas: ID observado no link (validar canal, público, variante, momento, conteúdo e período); ID ausente (propor pelo catálogo/governança e exigir revisão); mensagem técnica/opt-out (preservar para supressão e ramo, excluir do lote comercial). ID observado não certifica identidade correta: MAIO/JUN Vibe 21D contêm carsab no tracking.

## O que consumir do pack

Conservar no motor conteúdo/CTA/imagem, af_sub1/2/3/c, grafo/outcomes, filtros, esperas, resposta e atualização de contato. O ZIP tem 19 decisões, dez waits, 14 nós de espera de resposta e 14 atualizações de contato, além das 18 mensagens. Esses nós explicam elegibilidade/interrupção e não são lixo.

Schemas de 47 Data Extensions (39 locais + oito compartilhadas), 21 eventDefinitions e dependências de atributos podem explicar entrada/campos. Consumir apenas os referenciados no grafo, preservando o original para rastreabilidade. Eles não contêm o volume de público enviado: Base/execuções/resultados vêm de activities.

Ícones, metadados de aparência/expansão da UI, pastas e 25 categories não ajudam diretamente a identificar público/peça/momento. Retirar da projeção operacional, mantendo no ZIP original. Manifestos/references, IDs técnicos e registeredCustomActivities são rastreabilidade/dependência: ocultar do dia a dia, não apagar indiscriminadamente.
