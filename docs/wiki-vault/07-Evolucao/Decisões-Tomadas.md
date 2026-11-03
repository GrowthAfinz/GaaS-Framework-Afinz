---
tags: [evolucao,decisao,adr]
tipo: evolucao
camada: evolucao
atualizado: 2026-11-03
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

## Como usar
Quando uma [[Decisões-Abertas|decisão aberta]] for resolvida, mova-a para cá com a consequência. Mantém o histórico de *por que* o framework é como é.

## Relacionado
- [[Decisões-Abertas]] · [[Decisões-Técnicas]] · [[Entidades-v2]] · [[Ontologia-v2]]
