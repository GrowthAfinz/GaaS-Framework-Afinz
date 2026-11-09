---
tags: [evolucao,decisao,adr]
tipo: evolucao
camada: evolucao
atualizado: 2026-11-09
status: confirmado
fonte: gaas-supabase
---

# Decisões Tomadas (log ADR)

**Definição:** o registro das **decisões já resolvidas** de modelagem e estratégia — complementa as [[Decisões-Abertas]]. Cada linha: contexto → escolha → consequência.

## Decisões
| Data | Decisão | Consequência |
|---|---|---|
| v2 | **Experimento agrupa disparos; Template é atributo** | aprendizado vira entidade; template = `template_id` ([[Entidades-v2]]) |
| v2 | **Campanha explícita** = jornada+safra | deixa de ver 700 linhas, passa a ver ~40 campanhas ([[Campanha]]) |
| v2 | **Conversão zero é resultado válido** | confiança = volume de execução, não de conversão ([[Base-Acionável]]) |
| 2026-04 | **b2c_daily_metrics com PK (data, tipo)** | total + serasa_api por dia ([[b2c_daily_metrics]]) |
| eng | **Supabase como único backend** (sem servidor) | velocidade alta; RLS vira risco ([[Decisões-Técnicas]]) |
| eng | **ML client-side heurístico** (sem modelos) | explicável e instantâneo; precisão limitada ([[Pipeline-ML]]) |
| 2026-06 | **`pid=crm` como Media Source única no AppsFlyer** | CRM, WhatsApp e mídia lidos sob a mesma governança; canal real em `af_channel` ([[AppsFlyer-Tracking-CRM]]) |
| 2026-06 | **`af_ad` = Activity Name; `af_ad_id` = id do template** | a [[Taxonomia-Activity-Name]] vira chave de reconciliação AppsFlyer ↔ Supabase/SFMC |
| 2026-06 | **1 OneLink base por canal** (domínio `cartao-afinz.onelink.me`, template 9ODN) | leitura limpa por mídia; links gerados em massa por planilha-fórmula |
| 2026-06 | **Conversão em 2 níveis: `Account Created` (operacional) e `Account Approved` (negócio)** | mídia otimiza por qualidade, não por clique/install ([[AppsFlyer-Tracking-CRM]]) |
| 2026-06-10 | **Views ponderadas como fonte única de agregação** (4 views, flag de confiança) | fim do `avg` de taxas; granularidade Safra×BU×Segmento e mídia até nível ad ([[Views-Performance]]) |
| 2026-06-10 | **Ativação diária de audiências via S3 + APIs diretas** (Rota B; descartado Advertising Studio em sunset) | 6 audiências Topo/Repescagem/Upgrade × B2C/Plurix sincronizadas a Meta/Google a custo ~zero ([[Ativacao-de-Audiencias-Diaria]]) |
| 2026-06-20 | **D-1: Roteamento de memória em 3 níveis** (working=CLAUDE.md, semântica=vault, episódica=snapshots) | fim da duplicação/drift; write-back da IA fica disciplinado ([[Roteamento-de-Memoria]], [[ADR-001]]) |
| 2026-06-20 | **D-2: Carrega-tudo até gatilho de tokens** (<120k total; 120-180k sub-índice; >180k RAG) | decisão de contexto amarrada a número; ontologia hoje ~75-90k tokens ([[Estrategia-de-Contexto]], [[ADR-001]]) |
| 2026-06-20 | **D-3: Atribuição v1 = MMM agregado; MTA via AppsFlyer é v2** | atribuição acionável com dados de hoje (agregado); MTA espera deep link+postback ([[ADR-001]], [[AppsFlyer-Tracking-CRM]]) |

| 2026-07-15 | **Galeria é a entrada padrão de Performance do Conteúdo** | prioriza reconhecimento visual e comparação entre peças; Visão Geral e Tabela ficam como leituras complementares ([[Performance-do-Conteudo-GaaS]]) |
| 2026-07-15 | **Rascunhos ficam ocultos por padrão e sob controle explícito** | reduz ruído operacional sem eliminar a consulta ao inventário incompleto ([[Performance-do-Conteudo-GaaS]]) |
| 2026-07-15 | **Identidade estrutural precede score no match Activity Name ↔ Template ID** | incompatibilidades B2C × BB/B2B2C são rejeitadas antes da similaridade textual ([[Performance-do-Conteudo-GaaS]]) |
| 2026-07-15 | **Template ID é traduzido visualmente, mas preservado como identidade canônica** | chips aceleram leitura sem quebrar reconciliação, auditoria ou integrações ([[Performance-do-Conteudo-GaaS]]) |
| 2026-07-22 | **Funis de Apps, Serasa e Mídia Paga permanecem independentes** | a central permite alternar a origem sem somar populações, janelas ou semânticas incompatíveis ([[Funis-de-Onboarding-GaaS]]) |
| 2026-07-22 | **StartTrial Meta vem de `results`, com indicador e atribuição preservados** | `conversions:start_trial_mobile_app` é confiável como resultado atribuído em 7d click, nunca como total do app ([[Funil-Onboarding-Arquitetura-e-Ingestao]]) |
| 2026-07-22 | **Ausência, zero explícito e run incompleto são estados distintos** | valores ausentes ficam nulos e runs pending/failed não entram no BI ([[Funil-Onboarding-Arquitetura-e-Ingestao]]) |
| 2026-07-22 | **SubmitApplication fica bloqueado até instrumentação/fonte AppsFlyer** | nenhuma proxy de sessão, checkout ou StartTrial pode ocupar o KPI final ([[Funil-Onboarding-Arquitetura-e-Ingestao]]) |

| 2026-11-03 | **Vai de Visa: base elegível = STATUS NORMAL + compra em 30 dias + limite disponível ≥ R$ 200 + e-mail liberado** | 130.175 CPFs na fase 1 (B2C + B2B2C); `STATUS` substitui códigos de conta/atraso ([[DE-VDV_APTOS]]) |
| 2026-11-03 | **Bloqueio é por canal e por CPF** | qualquer linha do CPF com `bloqueio_email = True` tira do e-mail; `bloqueio_celular` tira só de SMS/WhatsApp ([[DE-CLIENTES_ATIVOS]]) |
| 2026-11-03 | **Base do Vai de Visa montada no MC por Query/Automation, não pela IN** | regras e sorteio ficam versionados no vault e no SFMC ([[DE-VDV_APTOS]]) |
| 2026-11-03 | **Join CLIENTES ATIVOS ↔ MAPA_MCC por `NR_CONTA`, não por CPF** | match de 99,8%; `DISTINCT CPF, NR_CONTA` evita somar a mesma conta por cartão ([[DE-MAPA_MCC]]) |
| 2026-11-03 | **Regra de grupo `V1_12M_REC6M`** (≥ 2 compras em 12 meses + última compra na categoria ≤ 6 meses) | substitui "≥ 2 em 6 meses" enquanto a MAPA não tiver quantidade em 6 meses; teste segue válido ([[Teste-Afinidade-MCC-vs-Generico]]) |
| 2026-11-03 | **Grupo e célula congelados no envio; sorteio depois do filtro do e-mail** | medição não quebra com recálculo; controle não fica com público inalcançável ([[Teste-Afinidade-MCC-vs-Generico]]) |
| 2026-11-03 | **Nome "Pool de Ofertas - Parceiros" para a variante RENT-96f7a0892e** | separa do Vai de Visa na Wiki e no Loop ([[Iniciativa-Pool-de-Ofertas-Parceiros]]) |
| 2026-11-03 | **DEs do SFMC viram entidades em `02-Entidades-Dados/SFMC/`** | mapa de relacionamento em [[MOC-SFMC-DEs-e-Automations]] |

| 2026-11-03 | **MAPA importada como texto (`MAPA_MCC_ENTRADA`) e convertida em SQL** | o arquivo fixo do SFTP com vírgula decimal deixa de depender do import ([[DE-MAPA_MCC]]) |
| 2026-11-03 | **Duas automações: PREPARAÇÃO (repetível) e CONGELAR (1× por safra)** | testes não gravam ninguém na VDV_ENVIO por engano ([[Automacao-VDV-Pool-de-Ofertas]]) |
| 2026-11-03 | **DEs com nomes simples no padrão ENTRADA → CRUZAMENTO → APTOS → ENVIO → FUNIL** | `DE_VDV_BASE_ELEGIVEL` virou [[DE-VDV_APTOS]]; `DE_VDV_OFERTAS` virou [[DE-BRIEFING_OFERTAS_VISA]] |
| 2026-11-03 | **Ofertas como pool único priorizado (nota 0–100), não vitrines manuais** | vitrines saem do ranking; base para orquestração futura ([[DE-BRIEFING_OFERTAS_VISA]]) |
| 2026-11-03 | **1º teste com 3 grupos (Moda, Saúde e Beleza, Família e Presentes) e 3 marcas cada** | escopo menor e legível; demais afinidades no Genérico ([[DE-VDV_APTOS]]) |
| 2026-11-03 | **Sorteio em duas camadas: controle fixo + A × B por safra** | mantém aberta a opção de controle perene ([[Teste-Afinidade-MCC-vs-Generico]]) |
| 2026-11-03 | **Campanha perene com safras (`ID_SAFRA`)** | tema sazonal muda, operação e medição se repetem |
| 2026-11-03 | **Resultado da medição fica com a IN (lake + relatório)** | MC recebe no máximo o resumo por cliente, não transações |
| 2026-11-03 | **Aba Correções e melhorias + botão fixo de feedback em todo o GaaS; time inteiro abre correção** | o caminho Humano → IA vira fila de trabalho dos agentes ([[Correcoes-e-Melhorias-GaaS]]) |
| 2026-11-03 | **Ajuste do app fica na aba (IA com mais autonomia); coisa nova vai para o SDD** | Testes e Tarefas concentra o que é novo; ajustes não disputam o backlog ([[Correcoes-e-Melhorias-GaaS]]) |
| 2026-11-03 | **Priorização das correções feita na conversa com Claude ou Codex, gravada de volta no item** | o time vê ordem e motivo de recusa dentro do GaaS ([[Correcoes-e-Melhorias-GaaS]]) |
| 2026-11-03 | **Comentário de Correções e melhorias: qualquer pessoa edita ou exclui, e a exclusão não deixa registro** | menos atrito para o time; item excluído sai da fila da skill sem rastro ([[Correcoes-e-Melhorias-GaaS]]) |
| 2026-11-03 | **Skill da aba se chama `correcoes-e-melhorias-gaas`** | nome fixo para o comando copiável e para Claude e Codex ([[Correcoes-e-Melhorias-GaaS]]) |
| 2026-11-05 | **Pool Vai de Visa: rotação de ofertas por grupo, não por cliente** | vitrine igual para o grupo em cada disparo; cada disparo vira uma rodada mensurável ([[Rotacao-de-Ofertas-Vai-de-Visa]]) |
| 2026-11-05 | **Black Friday usa a mesma rotação da campanha perene; 2 disparos por semana** | a vitrine é recalculada pela automação a cada disparo ([[Automacao-VDV-Pool-de-Ofertas]]) |
| 2026-11-05 | **Marca que serve dois grupos circula nos dois (`GRUPO_2`)** | histórico por grupo, giro independente em cada um |
| 2026-11-05 | **Nunca sair sem oferta: falta no grupo completa com qualquer oferta ativa, com prioridade** | grupo pequeno ou novo não fica sem e-mail |
| 2026-11-05 | **Acervo e vitrine separados: `BRIEFING_OFERTAS_VISA` (catálogo, tema, heros) e `MOVIMENTO_OFERTAS_VISA` (vitrine)** | troca de vitrine não mexe no catálogo; histórico do que cada grupo viu |
| 2026-11-05 | **Hero: parceiro com arte vê a arte nos dois e-mails; B2B2C sem arte vê o V2 nos dois; B2C vê V1 e V2** | ninguém de parceiro recebe a persona com o cartão institucional |
| 2026-11-05 | **Limite de crédito sai do conteúdo e fica como filtro da jornada/base** | catálogo mais simples; oferta cara no futuro exige rever |

## Consolidação do Pool Visa · 09/11/2026

As linhas históricas de 03–05/11 acima preservam as decisões daquele momento. Para executar o Pool, prevalece esta revisão: uma PREPARAÇÃO MAPA → CRUZAMENTO → SAFRA → POOL → APTOS → FUNIL, sem envio automático; SAFRA acumulada inclui controles; APTOS filtra aptidão atual e tratamentos, com saída/retorno; POOL unifica seleção e histórico por rodada; versão de tema é distinta da rodada. Três cards e até seis candidatas; GRUPO_2 não vigente; Família e Presentes tem precedência. Montagem relatada não é homologação.

Substitui exigência imediata de duas automações, safra fechada, VDV_ENVIO como audiência, DE adicional de disparo/histórico, trava PREP_FIM e prioridade por desconto. Nomes de arquivos antigos continuam como referência compatível. [[Estrategia-Pool-de-Ofertas-Visa]] detalha contratos, evidência e limites.

## Como usar
Quando uma [[Decisões-Abertas|decisão aberta]] for resolvida, mova-a para cá com a consequência. Mantém o histórico de *por que* o framework é como é.

## Relacionado
- [[Decisões-Abertas]] · [[Decisões-Técnicas]] · [[Entidades-v2]] · [[Ontologia-v2]]


## 3. Canais e política de seleção

E-mail, WhatsApp e SMS são canais principais da estratégia. O piloto separa parcelas sem sobreposição: cada CPF recebe no máximo um canal do Pool na mesma rodada. SEG-C e GEN-C ficam sem comunicação nos três canais. A alocação de grupo/célula permanece congelada na SAFRA; GEN-A usa a vitrine genérica, mas não representa comparação causal direta com SEG-B de outra população.

| Canal | Aptidão própria | Destino | Teto por rodada de envio |
|---|---|---|---|
| E-mail | Endereço disponível, sem bloqueio de e-mail, supressões/publication list e status de assinante conferidos | Links de oferta; CTAs finais a conferir | Orçamento e capacidade a definir |
| WhatsApp | Contato móvel, bloqueios/supressões próprios liberados e uso do app nos últimos 60 dias | LP personalizada da rodada | Até 5.000 mensagens |
| SMS | Contato móvel, bloqueios/supressões próprios liberados e uso do app nos últimos 60 dias | LP personalizada da rodada | Até 100.000 SMS |

Os tetos valem por rodada, sujeitos à elegibilidade e ao orçamento. Não são metas nem limites semanais. No SMS, destinatários, tentativas, reenvios e unidades faturadas/segmentos podem divergir: registrar cada unidade separadamente.

ULTIMO_ACESSO da CLIENTES ATIVOS é a referência de uso do app para os dois canais móveis. Normalizar a data para America/Sao_Paulo e comparar de hoje menos 60 dias até hoje, inclusive. Data inválida, ausente ou futura impede apenas a seleção móvel. O participante permanece na SAFRA e pode receber e-mail se elegível. DEVICE, modelo de aparelho e data de cadastro/importação não entram nesta regra. Usar o app não comprova uso de WhatsApp.

Permissões de uso/consentimentos dos canais foram confirmadas na definição do piloto. A execução continua respeitando os bloqueios e as supressões próprios: bloqueio de e-mail não é bloqueio de celular, e a consulta _Subscribers não pode excluir toda a audiência móvel.

:::details Sorteio, perfis e parâmetros pendentes
Sortear dentro de perfis relevantes, com grupo/célula, B2C/B2B2C e recência quando a fonte permitir. Aplicar a mesma política e probabilidade a SEG-A e SEG-B. Não priorizar maiores compradores no WhatsApp e interpretar o SMS residual como efeito do canal.

Pesos, cotas por perfil, tamanho da amostra, poder estatístico e pressão por pessoa seguem em aberto. O contrato usa ID_POLITICA_CANAL e ID_RODADA para identificar a regra; sem parâmetros aprovados, a simulação retorna “parâmetros pendentes” e não produz audiência. O módulo de simulação do GaaS não executa seleção no SFMC.

Evitar redistribuir silenciosamente participantes inelegíveis para preencher teto. Guardar a política, elegibilidade e contagens de cada perfil para interpretar diferenças de cobertura. A seleção de um CPF em um canal exclui os outros naquela rodada; rodadas futuras precisam respeitar a política de pressão ainda a definir.
:::

### Delta multicanal · aplicação manual no SFMC pendente

As seis SQLs integrais nesta nota são referência da montagem orientada a e-mail. CRUZAMENTO filtra e-mail/bloqueio_email globalmente; APTOS consulta _Subscribers e não transporta ULTIMO_ACESSO. Elas não implementam a política multicanal aprovada.

Manter uma PREPARAÇÃO MAPA → CRUZAMENTO → SAFRA → POOL → APTOS → FUNIL e as mesmas entidades. APTOS continua única, com uma linha por CPF por rodada e seleção de canal identificável; sem DE extra de audiência ou histórico de rotação.

| Destino | Delta proposto | Efeito / conferência |
|---|---|---|
| CRUZAMENTO | + FL_BLOQ_EMAIL Number, ULTIMO_ACESSO Date, DT_REF_ELEGIBILIDADE Date; EMAIL passa a aceitar NULL | Aptidão comum sem veto global de e-mail. Transportar bloqueios separados e uso real do app. 32 → 35 campos de referência. |
| SAFRA | EMAIL deve aceitar NULL; preserva 18 campos e PK CPF+ID_SAFRA | Incluir participantes móveis sem e-mail e controles; manter grupo/célula/token. Canal não é re-sorteio experimental. |
| APTOS | + CANAL_ENVIO Text(20), ID_RODADA Text(60), ID_POLITICA_CANAL Text(60), ULTIMO_ACESSO Date, FL_BLOQ_EMAIL Number, FL_APTO_EMAIL/FL_APTO_WHATSAPP/FL_APTO_SMS Number, DT_REF_ELEGIBILIDADE Date; EMAIL anulável | 20 → 29 campos de referência. Uma escolha por CPF/rodada, supressão por canal, app 60 dias só nos móveis. Campos de política/rodada obrigatórios no contrato novo. |
| POOL / BRIEFING | Mantêm nove / 41 campos | Reutilizar seleção e conteúdo na LP; não criar entidades de hero/tema. |
| FUNIL | Mantém 11 campos; novas linhas de diagnóstico | Canal, sobreposição, controle excluído, data futura, app inválido, total por rodada e teto; proporções por célula continuam na SAFRA. |

Tipos/tamanhos são proposta de contrato a conferir antes de editar/recriar DE. Não sobrescrever dados existentes para trocar PK/nulidade. Conferir export/backup, impacto nos consumidores e teste em cópia. A SQL de referência e-mail fica preservada; o arquivo Q_VDV_03_CRUZAMENTO_MULTICANAL_PROPOSTA.sql prepara a aptidão comum, mas depende dos campos novos e não é a seleção final de canal.

Para a APTOS multicanal, faltam pesos/cotas/pressão aprovados e a ligação das supressões de WhatsApp/SMS à fonte real. O contrato executável de simulação está em poolChannels.ts: só aceita política explícita, exclui controles, separa bloqueios, aplica a janela de app e os tetos e atribui no máximo um canal. O sorteio da simulação não é declarado equivalente ao CHECKSUM do SFMC. Não substituir a query real por uma escolha arbitrária de pesos.
