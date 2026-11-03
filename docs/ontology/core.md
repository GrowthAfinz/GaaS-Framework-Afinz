# Núcleo: conceitos, dimensões, estratégia e IA (core.md)

<!-- gerado por scripts/bundle_vault.py: não editar à mão -->

> Compilado do vault em 2026-11-03. 62 notas. Quando carregar: Primeira camada de qualquer tarefa. Conceitos, dimensões, função-objetivo, regras de proveniência e de memória.
> Arquivo derivado: a fonte canônica é a nota no vault. Mapa completo em [INDEX.md](INDEX.md).

## 📌 Notas neste arquivo

- [Enciclopedia-Servicos-Growth](#enciclopedia-servicos-growth)
- [MOC-Estrategia](#moc-estrategia)
- [MOC-Midia-Paga](#moc-midia-paga)
- [MOC-Operacao](#moc-operacao)
- [🏠 HOME](#-home)
- [Base-Acionável](#base-acionável)
- [CAC-Ótimo](#cac-ótimo)
- [CAC](#cac)
- [Campanha](#campanha)
- [Carrinho-Abandonado](#carrinho-abandonado)
- [Disparo](#disparo)
- [Etapa-de-Aquisição](#etapa-de-aquisição)
- [Experimento](#experimento)
- [Funil-AARRR](#funil-aarrr)
- [Hipótese](#hipótese)
- [Jornada](#jornada)
- [Lead](#lead)
- [MCC](#mcc)
- [Métricas-de-Mídia](#métricas-de-mídia)
- [Mídia-Paga](#mídia-paga)
- [Oportunidade](#oportunidade)
- [Plataformas-de-Comunicação](#plataformas-de-comunicação)
- [Repescagem](#repescagem)
- [Régua](#régua)
- [Safra](#safra)
- [Spend-to-Card](#spend-to-card)
- [Taxonomia-Activity-Name](#taxonomia-activity-name)
- [Template](#template)
- [Topo-de-Funil](#topo-de-funil)
- [Upgrade](#upgrade)
- [Bandeiras-Plurix](#bandeiras-plurix)
- [Copa-2026](#copa-2026)
- [Vibe](#vibe)
- [Anti-Overlap-Pressão-de-Contato](#anti-overlap-pressão-de-contato)
- [Ativacao-de-Audiencias-Diaria](#ativacao-de-audiencias-diaria)
- [Briefing-e-Regua-de-Aquisicao](#briefing-e-regua-de-aquisicao)
- [Deck-Plano-de-Midias-Arquitetura](#deck-plano-de-midias-arquitetura)
- [Deck-Relatorio-Resultados-Arquitetura](#deck-relatorio-resultados-arquitetura)
- [Estrategia-Bases-Segmentadas-Original-2026-01](#estrategia-bases-segmentadas-original-2026-01)
- [Estrategia-Multicanal-Vibe-Mar-Fechado](#estrategia-multicanal-vibe-mar-fechado)
- [Fabrica-XLSX-TOPO-CRM-3](#fabrica-xlsx-topo-crm-3)
- [Função-Objetivo](#função-objetivo)
- [Motor-de-Briefing-Automatico](#motor-de-briefing-automatico)
- [Ontologia-v2](#ontologia-v2)
- [Orquestrador](#orquestrador)
- [Plano-de-Midias-Afinz-Vibe-Handoff](#plano-de-midias-afinz-vibe-handoff)
- [Regua-Vibe-Ativacao](#regua-vibe-ativacao)
- [Reguas-Inteligentes-Arquitetura](#reguas-inteligentes-arquitetura)
- [Report-Live-Arquitetura-Editorial](#report-live-arquitetura-editorial)
- [Roadmap-Framework](#roadmap-framework)
- [SFMC-Integracao-API-Roadmap](#sfmc-integracao-api-roadmap)
- [Sistema-de-Experimentacao-Referencias](#sistema-de-experimentacao-referencias)
- [Teste-Afinidade-MCC-vs-Generico](#teste-afinidade-mcc-vs-generico)
- [Convenções-do-Vault](#convenções-do-vault)
- [Estrategia-de-Contexto](#estrategia-de-contexto)
- [Fontes-e-Proveniencia-Growth](#fontes-e-proveniencia-growth)
- [Inteligencia-Compartilhada-GaaS](#inteligencia-compartilhada-gaas)
- [MOC-Inteligencia-IA](#moc-inteligencia-ia)
- [Padrao-Editorial-Enciclopedia](#padrao-editorial-enciclopedia)
- [Roteamento-de-Memoria](#roteamento-de-memoria)
- [Vault-como-Contexto](#vault-como-contexto)
- [README](#readme)

---

## Enciclopedia-Servicos-Growth

> **tags:** `moc, growth, servicos, onboarding, contexto-ia` | **tipo:** `moc` | **camada:** `indice` | **atualizado:** `2026-10-02` | **status:** `confirmado` | **fonte:** `operador` | **publico:** `pessoas-novas, ias, operacao-interna`

# Enciclopédia dos Serviços Internos de Growth

**Definição:** porta de entrada para entender e executar os serviços internos de Growth Afinz, ligando negócio, produtos, planejamento, operação e evidências.

## Como começar

Quem está chegando pode seguir a trilha de aprendizagem abaixo. Quem já tem uma tarefa deve ir à tabela de execução. Uma IA deve identificar o produto, o objetivo, o canal e a data de corte antes de propor conteúdo ou mudança. Uso interno: esta enciclopédia não define oferta comercial para clientes.

> Desde 29/10/2026, os resultados por público, parceiro e frente estão em [Resultados](resultados-1.md#resultados-evolucao-e-retrospectivas) e nas páginas de `10-Resultados`. Os passos 1 e 3 abaixo e a linha de disparo da tabela apontam para notas de legado (foto de jun/2026), mantidas como histórico.

1. [O-que-é-o-GaaS](legado.md#o-que-é-o-gaas): conhecer o ambiente de trabalho.
2. [Dicionario-de-Produtos](dados.md#dicionario-de-produtos): identificar a marca comercial e sua proposta de valor.
3. [Produtos](legado.md#produtos) e [Segmentos](legado.md#segmentos): distinguir marca, tier e estado do público.
4. [Briefing-e-Regua-de-Aquisicao](#briefing-e-regua-de-aquisicao): traduzir contexto em intenção de comunicação.
5. [Fabrica-de-Emails-GaaS](operacao.md#fabrica-de-emails-gaas): preparar conteúdo e revisar versões.
6. [Emails-Dinamicos-SFMC](operacao.md#emails-dinamicos-sfmc) e [SFMC-Salesforce-Marketing-Cloud](operacao.md#sfmc-salesforce-marketing-cloud): entender execução e certificação.
7. [Funil-de-Aquisição](dados.md#funil-de-aquisição) e [Loop-de-Aprendizado-Growth](ia.md#loop-de-aprendizado-growth): medir, aprender e reutilizar.

## Resultados e evolução

[Resultados-Evolucao-e-Retrospectivas](resultados-1.md#resultados-evolucao-e-retrospectivas) reúne os pilares do framework: contexto, evidência, evolução mensal, retrospectiva, aposta e memória. Toda nova visão de resultado deve manter evolução e retrospectiva juntas.

## Encontrar um serviço pela tarefa

| Quero… | Começar aqui | Entrega / próximo passo |
|---|---|---|
| Entender um cartão e seus limites de comunicação | [Dicionario-de-Produtos](dados.md#dicionario-de-produtos) → [Ficha-de-Produto-Guia](operacao.md#ficha-de-produto-guia) | contexto do produto e claims com evidência |
| Planejar uma régua de aquisição | [Briefing-e-Regua-de-Aquisicao](#briefing-e-regua-de-aquisicao) | papel de cada toque, hipótese, gatilhos e supressões |
| Criar ou revisar e-mails | [Servico-Emails-Dinamicos](operacao.md#servico-emails-dinamicos) | briefing, QA, CSV e evidência de Test Send |
| Preparar um disparo e seu identificador | [Jornada-Disparos](legado.md#jornada-disparos) → [Taxonomia-Activity-Name](#taxonomia-activity-name) | planejamento reconciliável com resultados |
| Governar templates e links de CRM | [communication_templates](dados.md#communication_templates) → [AppsFlyer-Tracking-CRM](operacao.md#appsflyer-tracking-crm) | identidade e tracking rastreáveis |
| Planejar mídia e audiências | [MOC-Midia-Paga](#moc-midia-paga) → [Ativacao-de-Audiencias-Diaria](#ativacao-de-audiencias-diaria) | plano com elegibilidade e fontes verificadas |
| Investigar resultado e qualidade dos dados | [Dossie-Mestre-Operacao-CRM-Midia](ia.md#dossie-mestre-operacao-crm-midia) → [KPIs-Núcleo](dados.md#kpis-núcleo) | diagnóstico com cobertura e limitações |
| Publicar um relatório | [Report-Live-Enciclopedia](engenharia.md#report-live-enciclopedia) | build, QA, certificação e publicação verificável |
| Registrar aprendizado | [Loop-de-Aprendizado-Growth](ia.md#loop-de-aprendizado-growth) | evidência, decisão e reutilização explícita |

## Conceitos que precisam ficar separados

- **Produto comercial × tier:** +amigo, Afinz Visa, Bem Mais e Dia são marcas; Classic e Platinum são dimensões do cartão.
- **Elegibilidade do produto × audiência da régua:** poder solicitar não significa fazer parte de uma campanha específica.
- **Benefício do Clube × benefício do cartão × promoção:** cada camada tem condição e vigência próprias.
- **Planejado × executado:** uma estratégia aprovada não prova que a peça enviada seguiu o plano.
- **Pronto no GaaS × certificado no SFMC:** prévia e exportação não comprovam entrega.
- **Contexto × aprendizado validado:** uma nota curada informa; um outcome observado sustenta aprendizado.

## Fontes e uso por IA

O Obsidian/OneDrive contém as notas editáveis. O GaaS oferece a projeção consultável; conteúdo salvo na Fábrica tem seu próprio histórico operacional. [Fontes-e-Proveniencia-Growth](#fontes-e-proveniencia-growth) explica como reconciliar esses materiais. [Padrao-Editorial-Enciclopedia](#padrao-editorial-enciclopedia) define profundidade e rastreabilidade das notas.

A IA deve declarar informação ausente, separar proposta de implementação e citar a nota ou registro que sustenta uma regra. Uma seção histórica não autoriza reaplicar tarifa, oferta, marca, audiência ou template hoje.

## Cobertura e pendências

O primeiro corte enriquecido cobre Produtos → Briefing → Fábrica → E-mails Dinâmicos → SFMC. As demais áreas são entradas para documentação existente e ainda não receberam revisão integral. [Auditoria-Contexto-Vault-2026-10-02](ia.md#auditoria-contexto-vault-2026-10-02) registra escopo, achados e próximas revisões. A nova navegação usa notas e wikilinks compatíveis com o leitor existente; filtros por serviço, sumário fixo e relações tipadas na interface continuam propostas.

## Relacionado

- [MOC-Operacao](#moc-operacao) · [MOC-Estrategia](#moc-estrategia) · [MOC-Engenharia](engenharia.md#moc-engenharia) · [MOC-Inteligencia-IA](#moc-inteligencia-ia)
- [GaaS-Vault-Library](engenharia.md#gaas-vault-library) · [Padrao-Editorial-Enciclopedia](#padrao-editorial-enciclopedia) · [Fontes-e-Proveniencia-Growth](#fontes-e-proveniencia-growth)


## Trabalhar com IA e contribuir com o conhecimento — 22/10/2026

[Inteligencia-Compartilhada-GaaS](#inteligencia-compartilhada-gaas) explica como exportar o acervo completo publicado com instruções e mapa do sistema, acrescentar resultados selecionados e devolver contribuições para revisão exclusiva de Pablo. A aba Memória passa a se chamar **Registros**, preservando a distinção entre curadoria e aprendizado validado.


---

## MOC-Estrategia

> **tags:** `moc` | **tipo:** `moc` | **camada:** `indice` | **atualizado:** `2026-10-02` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# MOC — Estratégia (para onde aponta)

## Produto e intenção da comunicação

- [Briefing-e-Regua-de-Aquisicao](#briefing-e-regua-de-aquisicao) — papel, prova, objeção e hipótese por toque
- [Dicionario-de-Produtos](dados.md#dicionario-de-produtos) · [Fontes-e-Proveniencia-Growth](#fontes-e-proveniencia-growth)
- [Enciclopedia-Servicos-Growth](#enciclopedia-servicos-growth) — trilhas por serviço interno

## O norte
- [Função-Objetivo](#função-objetivo) — conversão (tática) → [CAC-Ótimo](#cac-ótimo) (estratégica)

## A evolução do framework
- [Ontologia-v2](#ontologia-v2) — a especificação sistêmica
- [Orquestrador](#orquestrador) — a visão de destino

## O caminho
- [Roadmap-Framework](#roadmap-framework) — Fase 0 → 3
- [Ativacao-de-Audiencias-Diaria](#ativacao-de-audiencias-diaria) — pipeline SFMC → S3/BQ → Meta/Google
- [Estrategia-Multicanal-Vibe-Mar-Fechado](#estrategia-multicanal-vibe-mar-fechado) — política de audiência e papéis de Aquisição, Rentabilização e Branding
- [Plano-de-Midias-Afinz-Vibe-Handoff](#plano-de-midias-afinz-vibe-handoff) — handoff canônico para continuidade do plano de mídia Afinz/Vibe
- [Sistema-de-Experimentacao-Referencias](#sistema-de-experimentacao-referencias) — base da spec do gestor de experimentos
- [Decisões-Abertas](evolucao.md#decisões-abertas) · [Decisões-Tomadas](evolucao.md#decisões-tomadas)
- [Governança-de-Dados](evolucao.md#governança-de-dados)
- [Inconsistências-a-Corrigir](evolucao.md#inconsistências-a-corrigir)
- [Anti-Overlap-Pressão-de-Contato](#anti-overlap-pressão-de-contato) — restrição-chave

## Arquiteturas de entrega
- [Deck-Plano-de-Midias-Arquitetura](#deck-plano-de-midias-arquitetura) — deck de planejamento de ciclo
- [Deck-Relatorio-Resultados-Arquitetura](#deck-relatorio-resultados-arquitetura) — deck de prestação de contas de período fechado
- [Report-Live-Arquitetura-Editorial](#report-live-arquitetura-editorial) — a camada de apresentação do Report Live: arquétipos, régua de comparação, perfis e critério de permanência (set/2026)
- [Loop-de-Aprendizado-Growth](ia.md#loop-de-aprendizado-growth) — sistema operacional para transformar sinais em apostas, outcomes e memória reutilizável.

## Onde agir
- [Mapa-de-Oportunidades](dados.md#mapa-de-oportunidades) — síntese acionável

## Legado (foto de jun/2026)

Notas que ficaram fora da estrutura nova da wiki em 29/10/2026. Estão em `98-Legado/`, com o conteúdo original preservado.

### A evolução do framework
- [Framework-v1-Diretor](legado.md#framework-v1-diretor) — as 7 iniciativas originais
- [Entidades-v2](legado.md#entidades-v2) — Template + Experimento

## Relacionado
- [🏠 HOME](#-home)


---

## MOC-Midia-Paga

> **tags:** `moc,midia` | **tipo:** `moc` | **camada:** `indice` | **atualizado:** `2026-08-04` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# MOC — Mídia Paga

Mapa da camada de **mídia paga** (Meta + Google) — o braço de aquisição via anúncios, par do CRM.

## Conceitos
- [Mídia-Paga](#mídia-paga) — visão geral
- [Métricas-de-Mídia](#métricas-de-mídia) — CPA/CPC/CPM/CTR/frequência
- [Spend-to-Card](#spend-to-card) — a ponte investimento → cartão

## Dimensões
- [Plataformas-Mídia](legado.md#plataformas-mídia) — Meta vs Google
- [Objetivos-de-Campanha](legado.md#objetivos-de-campanha) — marca/b2c/plurix/seguros/aquisicao/rentabilizacao
- [Criativos](legado.md#criativos) — copy, imagem, vídeo

## Evidência (snapshot jun/2026)
- [CPA-por-Plataforma](dados.md#cpa-por-plataforma) · [Spend-e-Tendência](dados.md#spend-e-tendência) · [Eficiência-de-Criativo](dados.md#eficiência-de-criativo)

## Dados (Supabase)
- [paid_media_metrics](dados.md#paid_media_metrics) · [paid_media_insights](dados.md#paid_media_insights) · [ad_creatives](dados.md#ad_creatives)
- [paid_media_campaign_mappings](dados.md#paid_media_campaign_mappings) · [paid_media_budgets](dados.md#paid_media_budgets) · [campaign_budgets](dados.md#campaign_budgets)
- [paid_media_objectives](dados.md#paid_media_objectives) · [paid_media_targets](dados.md#paid_media_targets)
- [collection_queue](dados.md#collection_queue) · [collection_execution_logs](dados.md#collection_execution_logs)

## Operação & Engenharia
- [Integração-Mídia-Paga](legado.md#integração-mídia-paga) · [Mídia-Analytics](legado.md#mídia-analytics) · [Módulo-Paid-Media-Afinz](legado.md#módulo-paid-media-afinz)
- [Funis-de-Onboarding-GaaS](evolucao.md#funis-de-onboarding-gaas) · [Funil-Onboarding-Arquitetura-e-Ingestao](engenharia.md#funil-onboarding-arquitetura-e-ingestao)

## Estratégia vigente
- [Estrategia-Multicanal-Vibe-Mar-Fechado](#estrategia-multicanal-vibe-mar-fechado) — aquisição com mar fechado e separação entre Aquisição, Rentabilização e Branding
- [Plano-de-Midias-Afinz-Vibe-Handoff](#plano-de-midias-afinz-vibe-handoff) — estado consolidado das campanhas, mensuração, guardrails, PMax e workbook

## Relacionado
- [🏠 HOME](#-home) · [MCP-Visão-Geral](ia.md#mcp-visão-geral)


---

## MOC-Operacao

> **tags:** `moc` | **tipo:** `moc` | **camada:** `indice` | **atualizado:** `2026-11-03` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# MOC — Operação (como o GaaS funciona)

## Serviços e aprendizagem

- [Enciclopedia-Servicos-Growth](#enciclopedia-servicos-growth) — entrada por tarefas
- [Servico-Emails-Dinamicos](operacao.md#servico-emails-dinamicos) — entradas, entrega e critérios de conclusão
- [Ficha-de-Produto-Guia](operacao.md#ficha-de-produto-guia) → [Briefing-e-Regua-de-Aquisicao](#briefing-e-regua-de-aquisicao) — contexto antes da produção

## Plataforma de disparo
- [SFMC-Salesforce-Marketing-Cloud](operacao.md#sfmc-salesforce-marketing-cloud)
- [Fabrica-de-Emails-GaaS](operacao.md#fabrica-de-emails-gaas) — workspace editorial e de governança de réguas, briefings, ativos, templates e plano de comunicação
- [Emails-Dinamicos-SFMC](operacao.md#emails-dinamicos-sfmc) — motor de e-mail único por Content Builder + AMPscript, 1 linha de CSV = 1 campanha
- [Emails-Dinamicos-Plurix](operacao.md#emails-dinamicos-plurix) — implementação autocontida da BU Plurix: 1 e-mail servindo 6 bandeiras, AMPscript verbatim, QA e log de decisões
- [Emails-Dinamicos-Vai-de-Visa](operacao.md#emails-dinamicos-vai-de-visa) — e-mail e LP com 4 ofertas por CPF (afinidade MCC + limite), reaproveitando o padrão do pool Plurix V10
- [SFMC-Query-Studio-e-SQL](operacao.md#sfmc-query-studio-e-sql) — armadilhas do Query Studio e padrões de SQL por CPF
- [MOC-SFMC-DEs-e-Automations](dados.md#moc-sfmc-des-e-automations) — mapa de relacionamento das DEs e Automations úteis
- [Bandeiras-Plurix](#bandeiras-plurix) — as 6 assinaturas do recorte operacional, distintas da lista comercial de redes; assets por bandeira e convenção de `NM_PRODUTO_INTERNO`

## Atribuição e tracking
- [AppsFlyer-Tracking-CRM](operacao.md#appsflyer-tracking-crm) — governança de links, eventos de conversão e deep link

## Dados e ingestão
- [Supabase-Visão-Geral](dados.md#supabase-visão-geral)
- [Taxonomia-Activity-Name](#taxonomia-activity-name)

## Legado (foto de jun/2026)

Notas que ficaram fora da estrutura nova da wiki em 29/10/2026. Estão em `98-Legado/`, com o conteúdo original preservado.

### A plataforma
- [O-que-é-o-GaaS](legado.md#o-que-é-o-gaas) — visão geral
- [GaaS-9-Áreas](legado.md#gaas-9-áreas) — as abas funcionais
- [Pilar-Automação-por-Histórico](legado.md#pilar-automação-por-histórico) — o princípio fundador
- [Orientador](legado.md#orientador) — motor de recomendação por score
- [Mídia-Analytics](legado.md#mídia-analytics) — correlação investimento→cartão

### As abas (uma a uma)
- [Launch-Planner](legado.md#launch-planner) · [Diário-de-Bordo](legado.md#diário-de-bordo) · [Jornada-Disparos](legado.md#jornada-disparos) · [Resultados](legado.md#resultados)
- [Relatório](legado.md#relatório) · [Originação-B2C](legado.md#originação-b2c) · [Explorador-Avançado](legado.md#explorador-avançado) · [Configurações](legado.md#configurações)

### Dados e ingestão
- [Ingestão-de-Dados](legado.md#ingestão-de-dados) — o updater com revisão humana

### Dimensões (com dados reais)
- [Canais](legado.md#canais) · [Segmentos](legado.md#segmentos) · [Ofertas](legado.md#ofertas) · [Parceiros](legado.md#parceiros) · [BUs](legado.md#bus)
- [Perfis-de-Crédito](legado.md#perfis-de-crédito) · [Produtos](legado.md#produtos) · [Subgrupos](legado.md#subgrupos)

### Custos
- [Custos-e-Investimento](legado.md#custos-e-investimento)

## Relacionado
- [🏠 HOME](#-home)


---

## 🏠 HOME

> **tags:** `moc,indice` | **tipo:** `moc` | **camada:** `indice` | **atualizado:** `2026-10-02` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# 🏠 HOME — Bíblia de Contexto Afinz CRM & Mídia

Porta de entrada do vault. Tudo se conecta a partir daqui.

## Enciclopédia interna para pessoas novas e IAs

- [Enciclopedia-Servicos-Growth](#enciclopedia-servicos-growth) — aprender ou encontrar um serviço pela tarefa
- [Dicionario-de-Produtos](dados.md#dicionario-de-produtos) → [Briefing-e-Regua-de-Aquisicao](#briefing-e-regua-de-aquisicao) → [Servico-Emails-Dinamicos](operacao.md#servico-emails-dinamicos) — primeira trilha enriquecida
- [Padrao-Editorial-Enciclopedia](#padrao-editorial-enciclopedia) · [Fontes-e-Proveniencia-Growth](#fontes-e-proveniencia-growth) — escrever e verificar contexto
- [Auditoria-Contexto-Vault-2026-10-02](ia.md#auditoria-contexto-vault-2026-10-02) — cobertura e lacunas

## 🧭 Mapas de Conteúdo
- [MOC-Operacao](#moc-operacao) — como o sistema GaaS funciona
- [MOC-Estrategia](#moc-estrategia) — para onde a operação aponta
- [MOC-Midia-Paga](#moc-midia-paga) — o braço de anúncios (Meta + Google)
- [MOC-Inteligencia-IA](#moc-inteligencia-ia) — agentes, MCP e vault como contexto
- [MOC-Engenharia](engenharia.md#moc-engenharia) — a camada de código

## 📈 Resultados (estrutura nova)
- [Resultados](resultados-1.md#resultados-evolucao-e-retrospectivas): entrada da wiki de resultados
- Domínios: [CRM Aquisição](resultados-2.md#dominio-crm-aquisicao) · [Rentabilização](resultados-2.md#dominio-rentabilizacao)
- Iniciativas: [Copa 2026](resultados-2.md#iniciativa-copa-2026)

## 🔑 Comece por aqui
- [Função-Objetivo](#função-objetivo) — por que tudo existe: o [CAC-Ótimo](#cac-ótimo)
- [Taxonomia-Activity-Name](#taxonomia-activity-name) — a chave que organiza tudo
- [Supabase-Visão-Geral](dados.md#supabase-visão-geral) — onde os dados vivem

## 📊 Evidência real (snapshot jun/2026)
- [CAC-por-Canal](dados.md#cac-por-canal) · [Funil-de-Aquisição](dados.md#funil-de-aquisição) · [Evolução-Temporal](dados.md#evolução-temporal)
- [KPIs-Núcleo](dados.md#kpis-núcleo) · [Performance-por-Segmento](dados.md#performance-por-segmento) · [Mapa-de-Oportunidades](dados.md#mapa-de-oportunidades)
- Mídia: [CPA-por-Plataforma](dados.md#cpa-por-plataforma) · [Spend-e-Tendência](dados.md#spend-e-tendência)

## 🚀 Evolução
- [Framework-v1-Diretor](legado.md#framework-v1-diretor) → [Ontologia-v2](#ontologia-v2) → [Orquestrador](#orquestrador)
- [Roadmap-Framework](#roadmap-framework) · [Decisões-Abertas](evolucao.md#decisões-abertas) · [Governança-de-Dados](evolucao.md#governança-de-dados)

## 🛠 Engenharia
- [MOC-Engenharia](engenharia.md#moc-engenharia) *(gerada via Claude Code — camada de código)*

## 🤖 Inteligência & IA
- [Vault-como-Contexto](#vault-como-contexto) — o método · [Skills-do-Projeto](ia.md#skills-do-projeto) — o que já roda
- [MCP-Visão-Geral](ia.md#mcp-visão-geral) · [Runbook-Vault-Vivo](ia.md#runbook-vault-vivo) — manter o vault vivo

---
> Vault mantido como fonte única de contexto para humanos e IAs. Veja convenções em [Convenções-do-Vault](#convenções-do-vault) e o histórico em [Changelog-do-Vault](evolucao.md#changelog-do-vault).

## Legado (foto de jun/2026)

Notas que ficaram fora da estrutura nova da wiki em 29/10/2026. Estão em `98-Legado/`, com o conteúdo original preservado.

### 🧭 Mapas de Conteúdo
- [MOC-Conceitos](legado.md#moc-conceitos) — o dicionário vivo da operação

### 🔑 Comece por aqui
- [O-que-é-o-GaaS](legado.md#o-que-é-o-gaas) — o sistema em uma nota


---

## Base-Acionável

> **tags:** `conceito,metrica` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-06-08` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Base Acionável

**Definição:** subconjunto da Base Total elegível para disparo após filtros (otimização, opt-in). É o denominador real de volume e de **confiança** de uma recomendação.

## Contexto
Regra da [Ontologia-v2](#ontologia-v2): confiança vem do volume de **execução** (base acionável / nº disparos), não do volume de conversão — porque no mercado fintech de cartão a conversão zero é resultado válido, não dado ausente.

> 📊 Snapshot 2026-06-08 — soma de base acionável: ~28,1 milhões de registros endereçados.

## Relacionado
- [CAC](#cac) · [KPIs-Núcleo](dados.md#kpis-núcleo) · [Ontologia-v2](#ontologia-v2)


---

## CAC-Ótimo

> **tags:** `conceito,estrategia,metrica` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-06-08` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# CAC Ótimo

**Definição:** o ponto de [CAC](#cac) onde a **rentabilidade acumulada da safra é máxima** — não o menor CAC, mas o que maximiza retorno.

## Contexto
É a [Função-Objetivo](#função-objetivo) estratégica da operação (origem: rascunho de função objetivo do Pablo). A lógica: minimizar CAC isoladamente sacrifica volume e rentabilidade; existe um ponto na curva renta-acumulada × CAC onde o retorno é máximo, e depois dele cai.

> ⚠️ A curva é **representação conceitual** até validação com dados de [rentabilidade](dados.md#rentabilizacao_activities) por safra. A dispersão de CAC por canal, essa sim, já é comprovada — ver [CAC-por-Canal](dados.md#cac-por-canal).

Depende de: base de rentabilidade por safra (fora do foco atual) — ver [Fase 3](#roadmap-framework).

## Relacionado
- [CAC](#cac) · [Função-Objetivo](#função-objetivo) · [Safra](#safra) · [Roadmap-Framework](#roadmap-framework)


---

## CAC

> **tags:** `conceito,metrica` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-06-08` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# CAC (Custo de Aquisição de Cliente)

**Definição:** Custo Total Campanha / Cartões Gerados. Métrica financeira central da aquisição.

## Contexto
CAC isolado **não** é o objetivo — ver [CAC-Ótimo](#cac-ótimo). Varia fortemente por canal: há **dispersão de ~3,2x** entre canais (ver [CAC-por-Canal](dados.md#cac-por-canal)). Componentes de custo: [Custos-e-Investimento](legado.md#custos-e-investimento).

> 📊 Snapshot 2026-06-08 — CAC médio geral ~R$ 17,91; investimento total rastreado ~R$ 270 mil → 18.715 cartões. *Ressalva: média sensível a mix de canal, safra e janela — não usar como conclusão de eficiência isolada.*

## Relacionado
- [CAC-Ótimo](#cac-ótimo) · [CAC-por-Canal](dados.md#cac-por-canal) · [Custos-e-Investimento](legado.md#custos-e-investimento) · [Função-Objetivo](#função-objetivo)


---

## Campanha

> **tags:** `conceito,unidade` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-06-08` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Campanha

**Definição:** conjunto de [disparos](#disparo) de uma mesma [Jornada](#jornada) dentro de uma [Safra](#safra). É a unidade de planejamento e leitura de resultado.

## Contexto
**Entidade nova na [v2](#ontologia-v2).** No [v1](legado.md#framework-v1-diretor) a campanha era implícita — existia espalhada por N disparos sem ser nomeada. Torná-la explícita é a [Fase 0](#roadmap-framework) do roadmap: deixar de ver 700 linhas soltas e passar a ver ~40 campanhas com régua e resultado.

**Chave lógica:** `BU + Segmento + Parceiro + Subgrupo + Etapa + Safra`.

## Relacionado
- [Disparo](#disparo) · [Jornada](#jornada) · [Safra](#safra) · [Entidades-v2](legado.md#entidades-v2) · [Roadmap-Framework](#roadmap-framework)


---

## Carrinho-Abandonado

> **tags:** `conceito,campanha-tipo,meio-funil` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-06-10` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Carrinho Abandonado (campanha-tipo)

**Definição:** a **campanha-tipo de recuperação imediata** — reabordar quem **iniciou o pedido e parou no meio** (abandono do fluxo/ECRED).

## A chave (como aparece em cada camada)
| Camada | Valor |
|---|---|
| CRM (B2C e Plurix) | Segmento `Abandonados` (subgrupos `Diario`, `Abandonados D-7`) |
| Relatório diarizado | bloco `CARRINHO ABANDONADO B2C/PLURIX` |
| Taxonomia SFMC | journeys `*_ABD` (usam `_aqs_` mas são reativação — [incongruência 8](evolucao.md#inconsistências-a-corrigir)); finalizados via ECRED fora do SFMC |
| Meta hoje | `AFINZ_Abandonados_B2C_10_07_2025` — **única e congelada há 11 meses** |
| Audiência proposta | `crm_b2c_carrinho_daily` · `crm_plurix_carrinho_daily` |
| AppsFlyer | `af_adset=abandonados` |

## Performance e canais
> 📊 Snapshot 2026-06-10. **O maior ativo da operação**: 2.409 disparos, CAC R$ 4,83 (melhor relação), conversão 6,1%. Núcleo absoluto: **WhatsApp** (1.893 disparos/5.147 cartões) + SMS; Push só aqui (102 disparos/3 cartões). **Lacunas: E-mail = zero disparos** e retargeting pago morto.

## Papel na rede
Recência é tudo: o valor do público decai por dia — é o caso de uso **mais forte** do [pipeline diário](#ativacao-de-audiencias-diaria) (audiência D-1 no Meta enquanto o SFMC trabalha WPP/SMS). A virada de eficiência de mar/26 ([Evolução-Temporal](dados.md#evolução-temporal)) aconteceu majoritariamente neste bloco.

## Relacionado
- [Plataformas-de-Comunicação](#plataformas-de-comunicação) · [Topo-de-Funil](#topo-de-funil) · [Segmentos](legado.md#segmentos) · [Subgrupos](legado.md#subgrupos) · [Evolução-Temporal](dados.md#evolução-temporal) · [Ativacao-de-Audiencias-Diaria](#ativacao-de-audiencias-diaria) · [Anti-Overlap-Pressão-de-Contato](#anti-overlap-pressão-de-contato)


---

## Disparo

> **tags:** `conceito,unidade` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-06-08` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Disparo

**Definição:** instância única de envio de uma comunicação. É a unidade-base de dados — uma linha na tabela [activities](dados.md#activities).

## Contexto
Cada disparo é identificado pela [Taxonomia-Activity-Name](#taxonomia-activity-name). Carrega público, canal, oferta, custo e o funil completo de KPIs. **Disparo ≠ [Template](#template):** o disparo é o evento de envio; o template é o conteúdo enviado.

> 📊 Snapshot 2026-06-08 — 4.606 disparos registrados (jan/25–jun/26), todos com status `Realizado`.

## Relacionado
- [Campanha](#campanha) · [Template](#template) · [activities](dados.md#activities) · [Taxonomia-Activity-Name](#taxonomia-activity-name)


---

## Etapa-de-Aquisição

> **tags:** `conceito,funil` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-06-08` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Etapa de Aquisição

**Definição:** posição do disparo no funil. Valores: `Aquisicao`, `Meio_de_Funil`, `Cross-sell`, `Reativacao`.

## Contexto
Determina a expectativa de conversão e **não pode ser misturada na mesma linha de campanha** (regra da [Ontologia-v2](#ontologia-v2)): aquisição fria converte ~6% a [CAC](#cac) maior; meio de funil ([Abandonados](legado.md#segmentos)) converte ~24%.

> 📊 Snapshot 2026-06-08 — Meio_de_Funil 2.954 · Aquisicao 1.499 · Cross-sell 65 · Reativacao 3 (subutilizada).

## Relacionado
- [Funil-AARRR](#funil-aarrr) · [Performance-por-Segmento](dados.md#performance-por-segmento) · [Segmentos](legado.md#segmentos)


---

## Experimento

> **tags:** `conceito,v2,aprendizado` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-06-08` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Experimento

**Definição:** entidade central de teste que **agrupa** N [disparos](#disparo) como variações comparáveis (A/B), com hipótese, janela, métrica-alvo e resultado de significância.

## Contexto
**Entidade nova na [v2](#ontologia-v2)**, origem no Diário de Bordo / ExperimentsView do GaaS. Decisão de modelagem: **experimento agrupa disparos; [Template](#template) é atributo**. É a unidade de aprendizado — sai-se do achismo para aprendizado provado e comparável. Pergunta de negócio que responde: *qual variação teve efeito comprovado?*

## Relacionado
- [Hipótese](#hipótese) · [Template](#template) · [Entidades-v2](legado.md#entidades-v2) · [Campanha](#campanha)


---

## Funil-AARRR

> **tags:** `conceito,funil,framework` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-06-08` | **status:** `inferência` | **fonte:** `gaas-supabase`

# Funil AARRR (Estratégia de Ativação)

**Definição:** o ciclo de vida do lead na aquisição, herdado do [v1 do diretor](legado.md#framework-v1-diretor): **Aquisição → Carrinho Abandonado → Reativação → Quarentena**.

## Contexto
Cada etapa tem objetivo, trigger, público, requisitos e canais próprios:
- **Aquisição:** primeira oferta a leads elegíveis (públicos: CRM, Leads_Parceiros, Base_Proprietaria).
- **Carrinho Abandonado:** acelerar oportunidade (públicos: Abandonados, Aprovados_nao_convertidos).
- **Reativação:** reaquecer leads sem resposta em 15 dias (Negados, Recência de Compra).
- **Quarentena:** descanso forçado após N ações sem resposta (Instabilidade).

> ⚠️ O mapeamento etapa→segmento acima é parcialmente **inferência** a partir dos nomes — a validar com o time.

## Relacionado
- [Etapa-de-Aquisição](#etapa-de-aquisição) · [Segmentos](legado.md#segmentos) · [Framework-v1-Diretor](legado.md#framework-v1-diretor) · [Lead](#lead)


---

## Hipótese

> **tags:** `conceito,v2,aprendizado` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-06-08` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Hipótese

**Definição:** afirmação testável registrada **antes** do disparo ou [Experimento](#experimento) (ex.: "WhatsApp converte mais que SMS em Abandonados").

## Contexto
Regra da [Ontologia-v2](#ontologia-v2): sem hipótese prévia não há aprendizado válido — evita racionalização pós-fato. Fecha o loop `hipótese → disparo → resultado → aprendizado`, que tanto o [diretor](legado.md#framework-v1-diretor) (item track record) quanto a [Função-Objetivo](#função-objetivo) pedem.

## Relacionado
- [Experimento](#experimento) · [Orquestrador](#orquestrador) · [Função-Objetivo](#função-objetivo)


---

## Jornada

> **tags:** `conceito,unidade` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-06-10` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Jornada

**Definição:** sequência lógica de disparos de aquisição, codificada no nome segundo a [Taxonomia-Activity-Name](#taxonomia-activity-name).

## Contexto
Formato: `JOR_ETAPA_BU_PARCEIRO_SEGMENTO_ETAPA_OFERTA_PROMO_SAFRA`. Ex.: `JOR_AQUISICAO_PLURIX_NA_CRM_AQUISICAO_PADRAO_NA_NOV25`. É **auto-descritiva e parseável por máquina** — dá pra derivar BU, parceiro, segmento, oferta e safra direto do nome, sem campos extras.

Jornadas se repetem por safra (recorrência mensal) — ver [Evolução-Temporal](dados.md#evolução-temporal).

> 📊 Snapshot 2026-06-10 — 330 jornadas distintas (disparos de 01/01/2025 a 08/06/2026).

## Relacionado
- [Campanha](#campanha) · [Régua](#régua) · [Safra](#safra) · [Taxonomia-Activity-Name](#taxonomia-activity-name)


---

## Lead

> **tags:** `conceito,publico` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-06-08` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Lead

**Definição:** prospect acionável — CPF com telefone/e-mail e autorização de contato.

## Contexto
É a matéria-prima da aquisição. Entra nas réguas de [Etapa-de-Aquisição](#etapa-de-aquisição) de topo/meio de funil. Vem de bases proprietárias, CRM de parceiros, Cartonistas e e-commerce de parceiros.

## Relacionado
- [Oportunidade](#oportunidade) · [Funil-AARRR](#funil-aarrr) · [Base-Acionável](#base-acionável) · [Segmentos](legado.md#segmentos)


---

## MCC

> **tags:** `conceito, mcc, transacao, afinidade, rentabilizacao` | **tipo:** `conceito` | **camada:** `conceitos` | **aliases:** `MCC, Merchant Category Code, Código de categoria do estabelecimento, Afinidade por MCC` | **atualizado:** `2026-11-03` | **status:** `confirmado` | **fonte:** `ISO 18245 (definição); spec Vai de Visa "Spec DE - IN" (de-para proposto); perfil da MAPA_MCC 03/11/2026`

# MCC — Merchant Category Code

**Definição e propósito:** código de 4 dígitos (padrão ISO 18245) que o adquirente atribui ao **estabelecimento**, indicando o ramo de atividade dele. Toda autorização de compra carrega o MCC do lojista. Na Afinz, agrupar o gasto do cliente por MCC permite inferir **afinidade de consumo** (Moda, Pet, Viagem…) e personalizar comunicação de rentabilização, seguros e mídia.

> Status por seção: definição = `confirmado`; de-para Afinz = `a-validar` com a processadora; usos futuros = `inferência`.

## Contexto e conceitos próximos

- **MCC ≠ produto comprado.** Uma farmácia (5912) vende remédio e maquiagem; um marketplace (5399) vende tudo. O MCC diz *onde* o cliente comprou, não *o quê*.
- **MCC ≠ nome do estabelecimento.** O nome que aparece na autorização (ex.: `RIACHUELO`, `PAGSEGURO*LOJA`) é outro campo; é o que se usa para dizer se a compra foi **num parceiro específico**.
- **Categoria de campanha:** agrupamento de vários MCCs (ex.: Moda = 5611, 5621, 5631, 5651, 5655, 5661, 5691, 5699). Quem define é o de-para, não o código.
- **Afinidade:** regra sobre o histórico (ex.: ≥ 2 compras na categoria em 6 meses). É decisão de negócio, não propriedade do MCC.

## De-para usado no Vai de Visa (proposta inicial)

| Categoria | Grupo | MCCs | Observação |
|---|---|---|---|
| Moda | b1 | 5611, 5621, 5631, 5651, 5655, 5661, 5691, 5699 | |
| Saúde e Beleza | b2 | 5912, 5977, 7230, 7298 | **5912 farmácia é misto** — mantido no MVP |
| Eletrodomésticos | b3 | 5722 | |
| Eletrônicos | b4 | 5732, 5734, 5045, 5946, 4812 | |
| Brinquedos | b5 | 5945, 5641 | 5641 (vestuário infantil) é **proxy** de público com filhos |
| Viagem | b6 | 3000–3299 (aéreas), 3351–3441 (locadoras), 3501–3999 (hotéis), 4511, 4722, 7011, 7512, 4411, 4131 | faixas por companhia/rede |
| Pet | b7 | 5995, 0742 | |
| Fora do MVP | FORA | 5311, 5399, 5964, 5999 | lojas de departamento, marketplace, e-commerce genérico, varejo diverso |

Fonte: aba "Spec DE - IN" da spec Vai de Visa. A IN deve validar com a tabela da processadora; o arquivo [DE-MAPA_MCC](dados.md#de-mapa_mcc) já chega agregado nessas categorias (mais `fora_mvp` e `nao_mapeado`).

## Regras, condições e limites

1. **MCC misto não prova afinidade.** Farmácia infla Saúde e Beleza: 44% das contas da MAPA compraram nessa categoria (📊 03/11/2026). Ler o grupo b2 sabendo disso.
2. **Marketplace esconde a categoria.** Compra de tênis num marketplace cai em 5399 (Fora do MVP), não em Moda.
3. **Gateway distorce o nome do estabelecimento**, não o MCC: compra online pode vir como `PAGSEGURO*`, `MP*`. Afeta a medição de conversão por parceiro, não a afinidade.
4. **"Não mapeado" é a maior parte do gasto.** Mediana de R$ 3,6 mil por conta em 12 meses, contra R$ 380–430 nas categorias MVP — provavelmente mercado e serviços do dia a dia. Não usar como afinidade.
5. **Janela importa.** Categorias de alta frequência (Moda, Saúde e Beleza, Pet) usam 6 meses; baixa frequência (Eletro, Eletrônicos, Brinquedos, Viagem) usam 12.
6. **Contagem de compras:** a regra pede parcelado = 1 compra e exclui estornos. Confirmar como a fonte conta antes de usar limiar de quantidade.

## Exemplo e validação

> 📊 Perfil da [DE-MAPA_MCC](dados.md#de-mapa_mcc), 652.614 contas, janela 23/10/2025 a 22/10/2026.

| Categoria | Contas com compra | % | Mediana de valor (quem comprou) |
|---|---:|---:|---:|
| Saúde e Beleza | 289.167 | 44,3% | R$ 383,70 |
| Moda | 233.554 | 35,8% | R$ 425,38 |
| Eletrônicos | 103.290 | 15,8% | R$ 150,00 |
| Pet | 90.083 | 13,8% | R$ 120,36 |
| Viagem | 48.897 | 7,5% | R$ 288,39 |
| Eletrodomésticos | 43.574 | 6,7% | R$ 151,95 |
| Brinquedos | 38.412 | 5,9% | R$ 89,90 |
| Fora do MVP | 223.574 | 34,3% | R$ 337,88 |
| Não mapeado | 450.001 | 69,0% | R$ 3.613,11 |

47% dos CPFs não têm compra em nenhuma categoria MVP: para eles, personalização por MCC não existe e a comunicação é genérica.

## Usos na operação (atuais e potenciais)

| Uso | Como o MCC entra | Estado |
|---|---|---|
| Rentabilização por afinidade | grupo b1–b7 escolhe as ofertas | em uso: [Iniciativa-Pool-de-Ofertas-Vai-de-Visa](resultados-2.md#iniciativa-pool-de-ofertas-vai-de-visa) |
| Medição de conversão por categoria | compra em MCC da categoria após o envio | planejado: [Teste-Afinidade-MCC-vs-Generico](#teste-afinidade-mcc-vs-generico) |
| Seguros | Viagem → seguro viagem (Assist Card e Allianz Travel já estão no catálogo VDV); Pet → seguro pet | `inferência` — ver [Seguros](resultados-3.md#seguros) |
| Vibe resgate | as 250+ marcas de resgate cobrem delivery, moda, beleza, pets — mesmas categorias | `inferência` — ver [Vibe](#vibe) |
| Mídia paga | audiência por afinidade e lookalike de compradores de uma categoria | `inferência` — ver [Ativacao-de-Audiencias-Diaria](#ativacao-de-audiencias-diaria) |
| Pressão de contato | evitar oferecer a mesma categoria em duas frentes na mesma semana | `inferência` — ver [Anti-Overlap-Pressão-de-Contato](#anti-overlap-pressão-de-contato) |

## Fontes e evidências

ISO 18245 para a definição; spec Vai de Visa (out/2026) para o de-para; perfil do arquivo MAPA_MCC recebido em 03/11/2026 para os números.

## Lacunas e pendências

- De-para não validado com a processadora → grupo pode estar errado em MCCs de borda → tabela oficial da processadora → IN.
- Sem dado de canal (presencial × online) → afinidade não distingue loja física de site → campo de canal na transação → IN, a confirmar.

## Relacionado

[DE-MAPA_MCC](dados.md#de-mapa_mcc) · [Iniciativa-Pool-de-Ofertas-Vai-de-Visa](resultados-2.md#iniciativa-pool-de-ofertas-vai-de-visa) · [Teste-Afinidade-MCC-vs-Generico](#teste-afinidade-mcc-vs-generico) · [Incentivo-ao-Uso](resultados-3.md#incentivo-ao-uso) · [Segmentos](legado.md#segmentos)


---

## Métricas-de-Mídia

> **tags:** `conceito,midia,metrica` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-06-08` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Métricas de Mídia

**Definição:** o vocabulário de performance de [Mídia-Paga](#mídia-paga), distinto do funil CRM. Cada registro de [paid_media_metrics](dados.md#paid_media_metrics) carrega spend, impressões, cliques, conversões e as taxas derivadas.

## As métricas
| Métrica | Fórmula | O que mede |
|---|---|---|
| **CTR** | cliques / impressões | atratividade do criativo |
| **CPC** | spend / cliques | custo de tráfego |
| **CPM** | spend / impressões × 1000 | custo de alcance |
| **CPA** | spend / conversões | custo por conversão **de plataforma** |
| **Frequência** | impressões / alcance | pressão sobre a mesma pessoa |

> 📊 Snapshot 2026-06-08 — Meta: CTR 1,15% · CPC R$ 0,76 · CPA R$ 1,49. Google: CTR 1,51% · CPC R$ 0,20 · CPA R$ 0,73. Ver [CPA-por-Plataforma](dados.md#cpa-por-plataforma).

## ⚠️ CPA ≠ CAC
O CPA aqui é da **plataforma** (conversão = clique/lead/evento configurado), não o [CAC](#cac) de cartão. Comparar CPA entre plataformas é válido; igualar CPA a custo de cartão **não**. Ver [Spend-to-Card](#spend-to-card).

## Relacionado
- [Mídia-Paga](#mídia-paga) · [paid_media_metrics](dados.md#paid_media_metrics) · [CPA-por-Plataforma](dados.md#cpa-por-plataforma) · [Spend-to-Card](#spend-to-card) · [CAC](#cac)


---

## Mídia-Paga

> **tags:** `conceito,midia` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-06-08` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Mídia Paga

**Definição:** a aquisição via **anúncios pagos** em [Meta e Google](legado.md#plataformas-mídia) — o braço de topo de funil que gera demanda e alimenta a originação B2C, complementando o disparo CRM via [SFMC](operacao.md#sfmc-salesforce-marketing-cloud).

## Contexto
Enquanto o **CRM** ([activities](dados.md#activities)) trabalha bases já endereçáveis ([Base-Acionável](#base-acionável)), a **mídia paga** compra alcance novo. As duas pernas vivem na mesma base Supabase desde a [Integração-Mídia-Paga](legado.md#integração-mídia-paga), permitindo leitura unificada de eficiência (spend → cartão, ver [Spend-to-Card](#spend-to-card)).

> 📊 Snapshot 2026-06-08 — investimento total rastreado **~R$ 243 mil** (Meta R$ 131k + Google R$ 112k), jan/2025–jun/2026. 5.301 registros diários em [paid_media_metrics](dados.md#paid_media_metrics).

## ⚠️ Distinção crítica
A "conversão" reportada pela plataforma (CPA ~R$ 0,73–1,49) **não é** o [CAC](#cac) de cartão (~R$ 6–18). Plataforma mede clique/lead; cartão é resultado de negócio. A ponte é a [Spend-to-Card](#spend-to-card).

## Relacionado
- [Plataformas-Mídia](legado.md#plataformas-mídia) · [Métricas-de-Mídia](#métricas-de-mídia) · [Spend-to-Card](#spend-to-card) · [Mídia-Analytics](legado.md#mídia-analytics) · [Integração-Mídia-Paga](legado.md#integração-mídia-paga)


---

## Oportunidade

> **tags:** `conceito,publico` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-06-08` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Oportunidade

**Definição:** [Lead](#lead) que demonstrou interesse — simulou proposta, preencheu landing page ou confirmou pedido em parceiro.

## Contexto
É o gatilho da etapa de aceleração (carrinho abandonado no [Funil-AARRR](#funil-aarrr)). Converte muito melhor que o lead frio: segmentos de meio de funil como [Abandonados](legado.md#segmentos) chegam a ~24% de conversão vs ~6% na aquisição fria.

## Relacionado
- [Lead](#lead) · [Funil-AARRR](#funil-aarrr) · [Performance-por-Segmento](dados.md#performance-por-segmento)


---

## Plataformas-de-Comunicação

> **tags:** `conceito,hub,plataformas,canais,audiencias` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-06-10` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Plataformas de Comunicação (hub)

**Definição:** o mapa único de **onde a Afinz fala com o cliente** — os canais executados pelo [SFMC](operacao.md#sfmc-salesforce-marketing-cloud) e as plataformas de mídia — e de **como o mesmo público** ([Segmentos](legado.md#segmentos)) aparece em cada uma.

## As plataformas
| Plataforma | Canais | Estado | Identidade do público |
|---|---|---|---|
| **SFMC** | E-mail · SMS · WhatsApp · Push | ativos (Push subutilizado: 103 disparos, 3 cartões) | Data Extension (CPF/contato) |
| **SFMC — InApp** | in-app message | **nunca usado; não funciona ainda** (inexistente no código e em activities) | — |
| **Meta Ads** | Facebook/Instagram | 3 contas: Fábrica de Vendas (principal), Sorocred, +amigo Plurix | Custom Audience (hash SHA-256) |
| **Google Ads** | Search/Display/YouTube/App | campanhas via [campaign_context](dados.md#campaign_context) | Customer Match (Data Manager API) |
| *(pseudo-canal)* | ECRED-API | finalizações assistidas fora do SFMC | — |

O elo entre todas: a base CRM → [pipeline S3](#ativacao-de-audiencias-diaria) → audiências; e o [AppsFlyer](operacao.md#appsflyer-tracking-crm) lendo tudo sob `pid=crm` (canal real em `af_channel`).

## Matriz real segmento × canal (onde cada público é trabalhado hoje)
> 📊 Snapshot 2026-06-10 (B2C+Plurix).

| Bloco / [Segmento](legado.md#segmentos) | E-mail | SMS | WhatsApp | Push | Meta hoje |
|---|---|---|---|---|---|
| [Topo-de-Funil](#topo-de-funil) (Base_Proprietaria/CRM) | ●●● núcleo | ●● | ● | — | `CRM_PLURIX_202603_GC1/GC2`, `Tudao_B2C_202603` (congeladas) |
| [Repescagem](#repescagem) (Negados) | ● | ●● | ●●● | — | `AFINZ_Negados_Orgânicos_21_05_2025`, `AFINZ_Repescagem_Niver_A/B` (congeladas) |
| [Upgrade](#upgrade) (Aprovados_nao_convertidos) | ● | ●● | ●● | — | `AFINZ_Upgrade_Niver_A/B` (congeladas, ~1k) |
| [Carrinho-Abandonado](#carrinho-abandonado) (Abandonados) | **lacuna** | ●● | ●●● núcleo | ● | `AFINZ_Abandonados_B2C_10_07_2025` (congelada há 11 meses) |
| Leads_Parceiros | ● | ●● | ●● | — | `AFINZ_LeadsParceiros_Niver_A/B` |
| Exclusão (já converteu) | — | — | — | — | `AFINZ_Ativos(Exclusão)`, `Cartões_Emitidos_2026` (inativa) |

## Diagnóstico das audiências Meta (lido via MCP, 2026-06-10)
1. **Tudo é CSV manual congelado** — nomes com data (`_10_07_2025`, `_202511`) e sem refresh; o público de Carrinho está 11 meses desatualizado.
2. **Sem convenção de nome** — mistura `AFINZ_*`, `[COPA]*`, `Tudão`, datas em 3 formatos.
3. **Espalhado em 3 contas** sem mapa de qual conta serve qual BU.
4. Lookalikes quase todos `INACTIVE`.

## Convenção proposta (audiências dinâmicas do pipeline diário)
`crm_<bu>_<bloco>_daily` → `crm_b2c_repescagem_daily`, `crm_plurix_topo_daily`, `crm_b2c_carrinho_daily`, `crm_b2c_upgrade_daily` + `crm_<bu>_exclusao_convertidos_daily`. Casa 1:1 com o `af_adset` do [AppsFlyer-Tracking-CRM](operacao.md#appsflyer-tracking-crm) e com as 6 bases da [Ativacao-de-Audiencias-Diaria](#ativacao-de-audiencias-diaria) — a mesma chave atravessa CRM, mídia e atribuição.

## Relacionado
- [Canais](legado.md#canais) · [Plataformas-Mídia](legado.md#plataformas-mídia) · [SFMC-Salesforce-Marketing-Cloud](operacao.md#sfmc-salesforce-marketing-cloud) · [Ativacao-de-Audiencias-Diaria](#ativacao-de-audiencias-diaria) · [AppsFlyer-Tracking-CRM](operacao.md#appsflyer-tracking-crm) · [Topo-de-Funil](#topo-de-funil) · [Repescagem](#repescagem) · [Upgrade](#upgrade) · [Carrinho-Abandonado](#carrinho-abandonado)


---

## Repescagem

> **tags:** `conceito,campanha-tipo,meio-funil` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-08-20` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Repescagem (campanha-tipo)

**Definição:** a **campanha-tipo de segunda chance** — reabordar quem fez uma proposta, não foi aprovado naquele momento e depois **já passou por uma nova análise de crédito**, recebendo inclusive um limite pré-aprovado.

## Estado real do cliente e regra de comunicação

- A nova análise de crédito já aconteceu antes da entrada na campanha; a copy pode dizer **"pré-aprovado"** e, quando disponível, informar o limite verdadeiro da pessoa.
- A conclusão ainda depende da jornada final, especialmente da validação antifraude/biometria. Uma biometria inválida pode impedir a emissão mesmo com limite pré-aprovado.
- Por isso, **"sujeito à análise de crédito" continua obrigatório**: é a ressalva operacional adotada pela Afinz para uma aprovação com probabilidade muito alta, mas ainda não irrevogável.
- O texto não deve relembrar a negativa anterior. A narrativa começa na nova oportunidade: limite pré-aprovado + continuidade do pedido.
- CTA recomendado: **"Peça seu cartão"** ou equivalente de continuidade, sem prometer emissão garantida.

## A chave (como aparece em cada camada)
| Camada | Valor |
|---|---|
| CRM (B2C e Plurix) | Segmento `Negados` + Etapa `Meio_de_Funil` |
| Relatório diarizado | bloco `REPESCAGEM B2C/PLURIX` |
| Meta hoje | `AFINZ_Negados_Orgânicos_21_05_2025` (230–271k, congelada), `AFINZ_Repescagem_Niver_A/B` (~1k, out/25), `AFINZ_Serasa_Repescagem_05_05_2025` |
| Audiência proposta | `crm_b2c_repescagem_daily` · `crm_plurix_repescagem_daily` |
| AppsFlyer | `af_adset=negados` |

## Performance e canais
> 📊 Snapshot 2026-06-10. **Conversão 16,7% (5x o topo), CAC R$ 39** — converte muito bem, mas caro. Canal núcleo: **WhatsApp** (98 disparos/3.146 cartões); SMS e E-mail secundários. 199 disparos no total — bloco **subescalado** vs potencial.

## Papel na rede
É o melhor argumento para mídia paga coordenada: a base de Negados no Meta (230k+) está congelada há 13 meses enquanto o CRM trabalha o segmento toda safra — sincronizar diariamente fecha esse vão. Timing importa: reabordar perto da reavaliação de crédito ([Perfis-de-Crédito](legado.md#perfis-de-crédito)).

## Relacionado
- [Plataformas-de-Comunicação](#plataformas-de-comunicação) · [Topo-de-Funil](#topo-de-funil) · [Upgrade](#upgrade) · [Segmentos](legado.md#segmentos) · [Ativacao-de-Audiencias-Diaria](#ativacao-de-audiencias-diaria) · [Performance-por-Segmento](dados.md#performance-por-segmento)


---

## Régua

> **tags:** `conceito,unidade` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-06-08` | **status:** `inferência` | **fonte:** `gaas-supabase`

# Régua

**Definição:** a [Jornada](#jornada) vista como sequência **ordenada** de disparos (D0, D3-abriu, D5-clicou…). O encadeamento comportamental, não os registros isolados.

## Contexto
É o conceito que o doc GaaS×Miro aponta como lacuna: hoje os disparos D0, D3-abriu, D3-não-abriu são registros desconectados. A régua os conecta numa sequência — pré-requisito pra entender causa de performance e pra sugerir a próxima régua. *(inferência: ainda não materializada como entidade no Supabase.)*

## Relacionado
- [Jornada](#jornada) · [Template](#template) · [Orquestrador](#orquestrador)


---

## Safra

> **tags:** `conceito,unidade` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-06-08` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Safra

**Definição:** mês de referência da campanha, formato `MMMYY` (ex.: NOV25). Dimensão de recorrência.

## Contexto
[Jornadas](#jornada) recorrentes repetem por safra — a mesma jornada CRM Plurix aparece de NOV25 a ABRI26 sem interrupção. A safra é o que permite comparar a mesma campanha ao longo do tempo e detectar degradação de [CAC](#cac). É também a unidade da [Função-Objetivo](#função-objetivo) ([CAC-Ótimo](#cac-ótimo) por safra).

## Relacionado
- [Campanha](#campanha) · [Jornada](#jornada) · [CAC-Ótimo](#cac-ótimo) · [Evolução-Temporal](dados.md#evolução-temporal)


---

## Spend-to-Card

> **tags:** `conceito,midia,atribuicao` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-06-08` | **status:** `inferência` | **fonte:** `gaas-supabase`

# Spend-to-Card (investimento → cartão)

**Definição:** a metodologia que liga **reais investidos em [Mídia-Paga](#mídia-paga)** ao **cartão emitido** — a única leitura que torna mídia comparável ao [CAC](#cac) do CRM.

## Como funciona
1. [paid_media_metrics](dados.md#paid_media_metrics) dá spend por campanha/dia.
2. [paid_media_campaign_mappings](dados.md#paid_media_campaign_mappings) classifica cada campanha por **objetivo de negócio** (marca, b2c, plurix, seguros, aquisicao, rentabilizacao).
3. A originação atribuível vem de [b2c_daily_metrics](dados.md#b2c_daily_metrics) (emissões diárias) e do canal Serasa.
4. A correlação spend↔emissão é exibida na [Mídia-Analytics](legado.md#mídia-analytics) e gera [paid_media_insights](dados.md#paid_media_insights).

> ⚠️ A atribuição é **correlacional**, não determinística (não há tracking 1:1 anúncio→CPF). Tratar como sinal direcional, não verdade contábil. `status: inferência` até validação de modelo de atribuição.

## Por que importa
Sem essa ponte, mídia e CRM são silos: a mídia otimiza CPA de plataforma (R$ ~1) e o CRM otimiza CAC de cartão (R$ ~18), sem linguagem comum. O spend-to-card é o que permite alocar budget por **rentabilidade de aquisição**, não por CPA isolado — conecta-se à [Função-Objetivo](#função-objetivo).

## Relacionado
- [Mídia-Paga](#mídia-paga) · [paid_media_campaign_mappings](dados.md#paid_media_campaign_mappings) · [b2c_daily_metrics](dados.md#b2c_daily_metrics) · [Mídia-Analytics](legado.md#mídia-analytics) · [CAC-Ótimo](#cac-ótimo)


---

## Taxonomia-Activity-Name

> **tags:** `conceito,chave,governanca` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-06-08` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Taxonomia (Activity Name)

**Definição:** o padrão de nomenclatura que identifica unicamente cada [Disparo](#disparo) e codifica seus atributos no próprio nome.

## Contexto
Dois níveis:
- **Activity Name:** `BU_CAMP_JORNADA_ORD_SAFRA` (ex.: `afz_aqs_boa_reg_cart_email_rfvchurn1_diario`).
- **Jornada:** `JOR_ETAPA_BU_PARCEIRO_SEGMENTO_ETAPA_OFERTA_PROMO_SAFRA`.

É o **ativo escondido mais valioso** da operação: por ser parseável, permite derivar [Campanha](#campanha), [Jornada](#jornada) e [Safra](#safra) sem campos extras. É a espinha que conecta tudo. Erros de grafia aqui quebram análise — ver [Inconsistências-a-Corrigir](evolucao.md#inconsistências-a-corrigir).

## Relacionado
- [Disparo](#disparo) · [Jornada](#jornada) · [Campanha](#campanha) · [Ontologia-v2](#ontologia-v2)


---

## Template

> **tags:** `conceito,v2,aprendizado` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-06-08` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Template

**Definição:** o **conteúdo** do [Disparo](#disparo) (HTML de e-mail, copy de SMS, mensagem de WhatsApp), desacoplado da instância de envio.

## Contexto
**Entidade nova na [v2](#ontologia-v2)**, origem no doc GaaS×Miro. Na v2 é **atributo do disparo** (`template_id`), não tabela própria — pode ser promovido a entidade depois se precisar de versionamento de criativo. Inferido pela chave `jornada+canal+ordem+oferta+promocional`; confiança <80% vai pra fila de revisão humana.

**Por que importa:** hoje o mesmo criativo pode aparecer no Disparo 1 e no Disparo 11 da mesma jornada — e isso é invisível. O template torna o reuso rastreável. Pergunta de negócio que responde: *qual criativo gerou resposta?*

## Relacionado
- [Disparo](#disparo) · [Experimento](#experimento) · [Entidades-v2](legado.md#entidades-v2) · [Ingestão-de-Dados](legado.md#ingestão-de-dados)


---

## Topo-de-Funil

> **tags:** `conceito,campanha-tipo,aquisicao` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-08-20` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Topo de Funil (campanha-tipo)

**Definição:** a **campanha-tipo de aquisição fria** — primeiro contato com a base própria/parceira que ainda não pediu cartão.

## Público das réguas de topo dos parceiros varejo

> **Regra (Pablo, 02/10/2026):** as réguas de topo de funil de **Plurix (+amigo), Dia e Bem Barato** são **exclusivamente para membros do clube** do varejo (Clube +amigo, Clube DIA, Clube Bem Mais).

Consequências para copy e briefing:
- Falar com a pessoa **como membro**: o clube é algo que ela já tem, nunca uma novidade ou oferta ("O Clube agora é +amigo" não serve para esse público).
- A diferenciação "Clube × Cartão" vira o argumento central: *você já economiza no clube; o cartão soma em cima*.
- Isso é regra de **audiência da régua**, não do produto: estar no clube continua **não sendo requisito para pedir o cartão** (ver correções de 20/08/2026 nas fichas de produto).

## Regra de proposta de valor

No topo de funil B2C, **Vibe é a âncora e o diferencial do produto**. A comunicação deve apresentar o cartão Afinz Visa a partir dessa proposta de valor, usando outros benefícios apenas como sustentação. Não reduzir Vibe a benefício secundário nem tratá-lo como promoção sazonal.

**Bloqueio de copy:** excluir a alegação **"até 40 dias para pagar"**. A fonte oficial vigente não foi recuperada; portanto, a frase não pode entrar em SMS, Push ou outro canal até nova validação documental.

## Régua de SMS

- **Quantidade:** 4 SMS.
- **Cadência:** 1 disparo por semana, durante 4 semanas.
- **Progressão:** os quatro textos devem evoluir o argumento sem repetir a mesma mensagem; Vibe permanece como âncora da proposta de valor ao longo da régua.
- **Fonte da decisão:** definição operacional de Pablo em 20/08/2026.

## A chave (como aparece em cada camada)
| Camada | Valor |
|---|---|
| CRM B2C | Segmento `Base_Proprietaria` + Etapa `Aquisicao` (Parceiro Proprietaria) |
| CRM Plurix | Segmento `CRM` + Etapa `Aquisicao` |
| Relatório diarizado | bloco `TOPO DE FUNIL B2C/PLURIX` |
| Meta hoje | `CRM_PLURIX_202603_GC1/GC2` (257–303k), `Tudao_B2C_202603` (155–182k) — **congeladas desde mar/26** |
| Audiência proposta | `crm_b2c_topo_daily` · `crm_plurix_topo_daily` |
| AppsFlyer | `af_adset=base_proprietaria` / `crm` |

## Performance e canais
> 📊 Snapshot 2026-06-10. Canal núcleo: **E-mail** (CRM Plurix 594 disparos/3.806 cartões; Base_Proprietaria 500/638). Conversão 2,6–3,3%, CAC R$ 10–14 — é o motor de **volume**, não de eficiência; meio de funil converte ~5x mais.

## Papel na rede
Alimenta os demais blocos: quem não converte aqui vira [Repescagem](#repescagem) (negado), [Upgrade](#upgrade) (aprovado sem conversão) ou [Carrinho-Abandonado](#carrinho-abandonado) (abandono no fluxo). Em mídia, é o público de prospecção + fonte dos lookalikes.

## Relacionado
- [Plataformas-de-Comunicação](#plataformas-de-comunicação) · [Segmentos](legado.md#segmentos) · [Etapa-de-Aquisição](#etapa-de-aquisição) · [Repescagem](#repescagem) · [Upgrade](#upgrade) · [Carrinho-Abandonado](#carrinho-abandonado) · [Ativacao-de-Audiencias-Diaria](#ativacao-de-audiencias-diaria)


---

## Upgrade

> **tags:** `conceito,campanha-tipo,meio-funil` | **tipo:** `conceito` | **camada:** `negocio` | **atualizado:** `2026-08-20` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Upgrade (campanha-tipo)

**Definição:** a **campanha-tipo de fechamento** — reabordar quem já havia feito uma proposta, não concluiu o pedido e foi submetido a uma **nova análise** antes da campanha.

## Bifurcação pelo resultado da nova análise

A nova análise compara o limite atual com o limite anteriormente disponível e determina a comunicação:

- **`maior`** — houve aumento de limite. O cliente recebe a peça específica de aumento, destacando o novo limite verdadeiro quando o campo estiver disponível.
- **`menor`** — não houve aumento. O cliente recebe a mesma linha de comunicação da [Repescagem](#repescagem), com limite pré-aprovado e continuidade do pedido.

`maior` e `menor` são declarações operacionais associadas ao `activity_name`; não devem ser inferidas apenas pelo nome genérico da jornada.

Para os dois caminhos, o cliente ainda precisa concluir o pedido. CTA recomendado: **"Conclua seu pedido"**. Quando houver `%%LIMITE_CRD%%`, usar o limite verdadeiro; quando não houver, trabalhar o cartão e os benefícios sem inventar valor. A opção **"até R$ 6.000"** pode ser usada como variante de teste somente quando esse teto comercial estiver aprovado para a campanha.

## A chave (como aparece em cada camada)
| Camada | Valor |
|---|---|
| CRM (B2C e Plurix) | Segmento `Aprovados_nao_convertidos` + Etapa `Meio_de_Funil` |
| Relatório diarizado | bloco `UPGRADE B2C/PLURIX` |
| Meta hoje | `AFINZ_Upgrade_Niver_A/B` (~1k, out/25 — uma já INACTIVE) |
| Audiência proposta | `crm_b2c_upgrade_daily` · `crm_plurix_upgrade_daily` |
| AppsFlyer | `af_adset=aprovados_nao_convertidos` |

## Performance e canais
> 📊 Snapshot 2026-06-10. **Conversão 16,4%, mas CAC R$ 93,51** (o mais caro) — público pequeno (97 disparos; mín. Meta de 100–1.000 usuários é restrição real aqui) e oferta cara (foi o piloto do [Vibe](#vibe) 100%). Canais: SMS/WhatsApp/E-mail equilibrados.

## Papel na rede
O dinheiro já foi gasto aprovando — cada conversão aqui tem custo marginal de crédito zero. O desafio é **CAC de incentivo**, não de mídia: candidato natural a [experimentos](#experimento) de oferta (Vibe %, em dobro). Em mídia, melhor uso é **retargeting de fechamento** + exclusão imediata pós-emissão (senão o CAC explode ainda mais).

## Relacionado
- [Plataformas-de-Comunicação](#plataformas-de-comunicação) · [Repescagem](#repescagem) · [Vibe](#vibe) · [Ofertas](legado.md#ofertas) · [Segmentos](legado.md#segmentos) · [Ativacao-de-Audiencias-Diaria](#ativacao-de-audiencias-diaria)


---

## Bandeiras-Plurix

> **tags:** `dimensao,plurix,bandeira,parceiro,emails-dinamicos` | **tipo:** `dimensao` | **camada:** `dados` | **atualizado:** `2026-10-02` | **status:** `confirmado` | **fonte:** `html-legado-sfmc + de-crm-topo-funil`

# Bandeiras Plurix

**Definição (1 frase precisa, para IA):** as 6 redes de supermercado da holding Plurix que vendem o mesmo cartão `+amigo`; cada uma tem rodapé, deeplink e site próprios, mas compartilham marca, cores e estrutura de e-mail.

## Por que esta dimensão existe

`Plurix` é tratada como **BU** em [BUs](legado.md#bus), mas não é um parceiro único. É uma holding. O cartão vendido é sempre o `+amigo` — a mesma marca, o mesmo app, o mesmo azul. O que muda por bandeira é a **assinatura de varejo**: qual supermercado aparece no rodapé e para qual deeplink o botão aponta.

Essa distinção é o que permite **um único e-mail dinâmico servir as 6** (ver [Emails-Dinamicos-Plurix](operacao.md#emails-dinamicos-plurix)). Se as bandeiras tivessem cartões de marca própria — como acontece em [Parceiros](legado.md#parceiros) B2B2C (`Bem Barato` → *Bem Mais Afinz Visa*) — seria necessário um template por bandeira.

## Valores reais

Campo de origem na DE do CRM: `INVESTIDA`. Campo de destino no SFMC: `PRODUTO` (audiência) e `NM_PRODUTO_INTERNO` (briefing).

| `INVESTIDA` (origem) | `PRODUTO` (SFMC) | slug | Nome comercial |
|---|---|---|---|
| `Amigao` | `AMIGAO` | `amigao` | Amigão Supermercados |
| `Boa` | `BOA` | `boa` | Boa Supermercados |
| `Avenida` | `AVENIDA` | `avenida` | Supermercados Avenida |
| `Compre Mais` | `COMPRE MAIS` | `compremais` | Compre Mais Supermercados |
| `Parana` | `PARANA` | `parana` | Paraná Supermercados |
| `Superpao` | `SUPERPAO` | `superpao` | Superpão Supermercados |

> **Convenção de nomenclatura:** `NM_PRODUTO_INTERNO` usa **nome puro, sem prefixo de BU**, seguindo o padrão já existente em `TB_BRIEFING_JORNADAS` (`INSTITUCIONAL`, `BEM BARATO`, `ALVORADA`). Não usar `PLURIX_AMIGAO`. A BU não entra na chave composta — ela é rastreada pelo `activity_name` e pelo framework do GaaS.

## Volume — snapshot 2026-03-05 (DE `CRM_PLURIX_202603_GC1`, topo de funil)

| Bandeira | Base | Endereçáveis por e-mail | Aproveitamento |
|---|---:|---:|---:|
| Amigão | 45.953 | 30.891 | 67,2% |
| Boa | 15.764 | 14.427 | 91,5% |
| Avenida | 14.870 | 12.847 | 86,4% |
| Compre Mais | 11.457 | 9.553 | 83,4% |
| Paraná | 4.445 | 2.947 | 66,3% |
| Superpão | 2.777 | 2.413 | 86,9% |
| **Total** | **95.266** | **73.078** | **76,7%** |

⚠️ **Amigão concentra o volume e o pior aproveitamento** — 15 mil pessoas na base sem canal de e-mail elegível. É problema de higiene de cadastro, não de e-mail. Maior ganho disponível sem custo de mídia.

## Assets por bandeira (usados no briefing)

Base de URLs:
- `V2` = `https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2`
- `BF` = `https://stoplxmkt.blob.core.windows.net/plxmkt`

| Bandeira | Rodapé (`BANNER_3_CORPO`) | Site (`LINK_BANNER_3_CORPO`) | Deeplink OneLink |
|---|---|---|---|
| Amigão | `V2/footer-amigao.png` | `https://www.amigao.com/` | `.../OfSm/fhmnfq0n` |
| Boa | `BF/20241125-EM-BOA-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-hd.png` | `https://www.boasupermercados.com.br/` | `.../OfSm/21tz9kvu` |
| Avenida | `BF/20241125-EM-AVE-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-avenida.png` | `https://loja.supermercadosavenida.com.br/` | `.../OfSm/igg3hn81` |
| Compre Mais | `BF/20241125-EM-CPM-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-compre-mais.png` | `https://www.somoscompremais.com.br/` | `.../OfSm/cvfabp9o` |
| Paraná | `V2/footer-parana.png` | `https://www.paranasupermercados.com.br` | `.../OfSm/8qywzwt2` |
| Superpão | `BF/20241125-EM-SPO-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-superpao.png` | `https://loja.superpao.com.br/` | `.../OfSm/hn04qjlj` |

Prefixo completo do deeplink: `https://mais-amigo.onelink.me`

**Os 6 deeplinks são distintos e carregam a atribuição da bandeira.** Trocar um pelo outro não gera erro visível — o e-mail renderiza normalmente e a conversão é atribuída à bandeira errada. Conferência obrigatória no Test Send.

### Variações de imagem (não são iguais entre bandeiras)

| Bandeira | `HEADER` | `BANNER_1_CORPO` (benefícios) |
|---|---|---|
| Boa | `V2/semana-01/header-semana1-i2.png` | `V2/semana-01/beneficios-cartao-flv-semana1-i2.png` — versão **FLV** (frutas/legumes/verduras) |
| Compre Mais | `V2/semana-01/header-compre-mais-semana-1.png` — header **próprio** (migração de clube) | `V2/semana-01/banner-cartao-basicos.png` |
| Amigão, Avenida, Paraná, Superpão | `V2/semana-01/header-semana1-i2.png` | `V2/semana-01/beneficios-cartao-basicos-semana1-i2.png` |

Constante para todas: `BANNER_2_CORPO` = `V2/semana-01/como-solicitar-cartao.png`

### Identidade visual compartilhada (chumbada no HTML, não é dado)

| Elemento | Valor |
|---|---|
| Logo topo | `BF/20240513-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ/logo-mais-amigo.png` (190px) |
| Link do logo | `https://clubemaisamigo.com.br` |
| Azul +amigo (botões, títulos) | `#2C3490` |
| Lavanda (faixa do bloco 2) | `#D1D4EB` |
| Cinza de fundo (bloco 1) | `#efefef` |
| Cinza do rodapé legal | `#EBEBEB` |
| Fonte | DM Sans |

> Estes 4 valores de cor + o logo são **o que impede** o template de servir também B2B2C. Ver [Emails-Dinamicos-Plurix](operacao.md#emails-dinamicos-plurix) §Escala.

## Segmentos cruzados

A DE de origem traz `SEGMENTO` com 8 valores: `Leal`, `Pre Churn`, `Recorrente`, `Churn`, `Ocasional`, `Frequente`, `Novo Explorador`, `Sem Segmento`. Ver [Segmentos](legado.md#segmentos).

**Decisão:** o segmento **não entra na chave composta**. A copy é idêntica para todos os segmentos; o segmento viaja apenas no `activity_name` (coluna `CAMPANHA`), permitindo leitura de resultado por segmento sem multiplicar o briefing por 8.

## Relacionado
- [Emails-Dinamicos-Plurix](operacao.md#emails-dinamicos-plurix) · [Emails-Dinamicos-SFMC](operacao.md#emails-dinamicos-sfmc) · [BUs](legado.md#bus) · [Parceiros](legado.md#parceiros) · [Segmentos](legado.md#segmentos) · [Topo-de-Funil](#topo-de-funil)

## Aplicação operacional — revisão editorial 02/10/2026

### Lista comercial versus configuração de comunicação

As seis linhas desta nota descrevem o recorte operacional histórico de assinaturas. A pesquisa comercial em [Cartao-Amigo-Afinz-Visa](dados.md#cartao-amigo-afinz-visa) menciona oito redes, incluindo Mega e Dom Olívio. Não importar automaticamente as duas para a Fábrica nem universalizar desconto/escopo por pertencerem ao Clube.

### Marca nas novas peças

Consulta ao guardrail ativo de +amigo em 02/10 confirmou: Compre Mais e Superpão comunicam apenas como +amigo no escopo de todos os oito e-mails da régua até definição de nova marca. Amigão, Boa, Paraná e Avenida conservam nome próprio no registro. Assets e URLs antigos acima permanecem históricos; não autorizam reutilizar rodapé ou marca bloqueada. Chaves técnicas devem ser preservadas ou migradas explicitamente; trocar nome visual não altera por si só a DE.

### Lacunas

Faltam validação atual dos ativos, nome novo das duas redes e confirmação operacional de inclusão de redes adicionais. Volumes de março não representam audiência atual. Próximo passo: [Ficha-de-Produto-Guia](operacao.md#ficha-de-produto-guia) → [Servico-Emails-Dinamicos](operacao.md#servico-emails-dinamicos).


---

## Copa-2026

> **tags:** `dimensao,promocional,sazonal` | **tipo:** `dimensao` | **camada:** `dados` | **atualizado:** `2026-06-11` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Copa 2026 (promocional sazonal)

**Definição:** o **promocional sazonal** ligado à Copa do Mundo de 2026 — um modificador de [oferta](legado.md#ofertas) usado em campanhas do período.

## Contexto
> 📊 Snapshot 2026-06-10 — **328 disparos** com promocional "Copa" (vs. Padrao 2.769, N/A 1.231, Em dobro 112, Upgrade 14).

**A campanha:** "Meu Afinz Visa Bate Um Bolão" — Copa do Mundo 2026, período **15/abr–15/ago/2026**, em ondas quinzenais (O1 01/04 … O6 15/06). Parceiros: B2C (Afinz direto), Bem Barato, Plurix, DIA. Canais CRM: WPP, e-mail, SMS, push; funil proposta→aprovados→finalizados; tipos Aquisição/Rentabilização/Reativação. Na mídia paga, 4 das 7 campanhas em [campaign_context](dados.md#campaign_context) são Copa (App Install + Display/Tráfego LP Visa).

É um evento de aquisição com tratamento próprio: há skills dedicadas (`copa-crm-parser`, blocos "Copa 2026" no relatório diarizado — ver [Skills-do-Projeto](ia.md#skills-do-projeto)). Sazonalidade exige leitura isolada para não distorcer a [performance base](dados.md#performance-por-segmento).

## Conversão exclusiva - Opt-in da LP

Decisão confirmada em 2026-06-11:

- O Opt-in concluído na landing page é uma conversão oficial da campanha **Meu Afinz Visa Bate Um Bolão**, em parceria com a Visa.
- Esta regra é exclusiva da campanha Copa Visa e não deve ser generalizada para outras campanhas de rentabilização.
- A conversão representa adesão à campanha promocional. Não representa proposta, aprovação, cartão emitido, receita, CAC ou rentabilidade.
- Métrica principal: `Opt-ins confirmados / usuários da LP`.
- Para mídia paga, `spend / Opt-ins confirmados` pode ser chamado de custo por Opt-in, nunca de CAC.

### Funil de mensuração no Looker

| Etapa | Caminho | Interpretação |
|---|---|---|
| Acesso LP | `/site/afinz/afinz-copa-26/` | entrada no ambiente da campanha |
| Etapa Opt-in | `/site/afinz/afinz-copa-26/cadastro/optins` | chegada à etapa, sem prova isolada de submissão |
| Sucesso | `/site/afinz/afinz-copa-26/cadastro/sucesso` | proxy forte de conclusão, sujeito à reconciliação |

A tabela diária deve separar `Mídia Paga`, `CRM`, `Orgânico` e `Outros`, preservando os valores originais de mídia e uma linha total sem filtro para controle. O contrato completo está em [Dossie-Mestre-Operacao-CRM-Midia](ia.md#dossie-mestre-operacao-crm-midia).

## Acompanhamento (XLSX Rentabilização Copa)
O acompanhamento diário da campanha junta 3 universos no export da aba Relatório: CRM ([rentabilizacao_activities](dados.md#rentabilizacao_activities)), Mídia Paga ([paid_media_metrics](dados.md#paid_media_metrics)) e LP Visa (Looker → [copa_lp_daily](dados.md#copa_lp_daily), proposta). Arquitetura e evolução em [Export-XLSX-Renta-Copa](engenharia.md#export-xlsx-renta-copa).

## Relacionado
- [Ofertas](legado.md#ofertas) · [Skills-do-Projeto](ia.md#skills-do-projeto) · [Performance-por-Segmento](dados.md#performance-por-segmento) · [Safra](#safra) · [Dossie-Mestre-Operacao-CRM-Midia](ia.md#dossie-mestre-operacao-crm-midia) · [Export-XLSX-Renta-Copa](engenharia.md#export-xlsx-renta-copa) · [copa_lp_daily](dados.md#copa_lp_daily)


---

## Vibe

> **tags:** `dimensao,oferta,vibe,institucional` | **tipo:** `dimensao` | **camada:** `dados` | **atualizado:** `2026-08-20` | **status:** `confirmado` | **fonte:** `pesquisa-externa`

# Vibe (camada institucional)

**Definição:** o programa de créditos da Afinz operado com a Vertem — **não é campanha sazonal nem benefício isolado de um cartão**, é a **âncora e o diferencial da proposta de valor do produto**, com lock-up de marca próprio (`afinz + ViBE`) e headline *"Um cartão para você fazer mais"*.

> ⚠️ Esta nota foi **reescrita em 20/08/2026** a partir do material interno *"Treinamento Comercial — App integrado ao app Afinz"* (08/08/2026) e das correções do Pablo. A versão anterior tratava Vibe como "oferta dominante" e falava em *"eventual App Vibe"* — o app existe, está em produção, e a integração já tem roadmap de duas fases.

## Contexto

> 📊 Snapshot 2026-06-08 — **2.740 disparos** com oferta Vibe (vs. 1.705 Padrão) em [activities](dados.md#activities).

Decisão de negócio de 04/08/2026: a partir de 17/08, Vibe orienta a comunicação de Aquisição, Rentabilização e Branding. A marca-mãe continua sendo a Afinz. Ver [Estrategia-Multicanal-Vibe-Mar-Fechado](#estrategia-multicanal-vibe-mar-fechado).

**Regra de comunicação confirmada por Pablo em 20/08/2026:** quando o produto for elegível ao Vibe, o programa deve ser o argumento central da proposta de valor — o diferencial que organiza a narrativa — e não apenas mais um benefício numa lista. Os benefícios funcionais do cartão podem sustentar a mensagem, mas não devem apagar essa âncora.

**Nunca escrever Vibe com moldura de campanha com prazo.** É atributo de produto.

## Quem tem — e o que exatamente tem

| Produto | Ganha créditos | Jornada Vibe **dentro do app** |
|---|---|---|
| [Cartao-Afinz-Visa](dados.md#cartao-afinz-visa) | ✅ R$100 ativação + R$30/fatura paga | ✅ usa o app Afinz |
| [Cartao-Dia-Afinz-Visa](dados.md#cartao-dia-afinz-visa) | ✅ R$100 ativação + R$30/fatura paga | ✅ usa o app Afinz |
| [Cartao-Bem-Mais-Afinz-Visa](dados.md#cartao-bem-mais-afinz-visa) | ✅ R$100 ativação + R$30/fatura paga | ❌ **app whitelabel** |
| [Cartao-Amigo-Afinz-Visa](dados.md#cartao-amigo-afinz-visa) | ❌ **único de fora** | ❌ |

Três leituras que essa tabela resolve:

1. **O pacote é idêntico nos três.** R$100 na ativação e R$30 por fatura paga valem igual para B2C, Bem Mais e DIA. Dá para escrever **uma copy-base de Vibe e trocar só o nome do produto** — a maior economia de esforço do portfólio.
2. **Plurix é o único de fora.** Confirmado pelo Pablo em 20/08/2026, não é dúvida em aberto.
3. **🔴 Bem Mais ganha o crédito mas não tem onde ver.** O app dele é whitelabel, não é o app Afinz. Toda a régua Vibe oficial pressupõe o app Afinz — opt-in por deeplink, saldo e extrato no app, push de crédito recebido. **Nada disso funciona para o Bem Mais, e ele não tem régua alternativa desenhada.**

## As duas missões — e as condições que a nossa copy omite

| Missão | Valor | Condição real |
|---|---|---|
| **Ativação do cartão** | R$100 | **com anuidade ativa**, em até **30 dias** após abrir a conta |
| **Fatura paga** | R$30/mês | até o **vencimento**, **com anuidade ativa**. Recorrente |

> **"Anuidade ativa" nunca apareceu em nenhuma peça nossa.** Cliente com anuidade isenta ou em atraso cumpre a missão e não recebe — e reclama com razão.

⚠️ **Termo a padronizar:** Pablo diz "ativação do cartão"; o material comercial diz "primeira compra em até 30 dias"; o Bem Barato diz "1ª compra". Muda o verbo da copy. Ver [Conflitos-de-Fonte-Produtos-2026-08](evolucao.md#conflitos-de-fonte-produtos-2026-08) §10.

**Operacional:** o voucher chega por e-mail ou WhatsApp e tem **30 dias para ser ativado**; depois o crédito leva **4 a 8 dias úteis** para aparecer no app da Vibe. → Régua de "seu crédito chegou" **não pode disparar no dia da missão**.

## Opt-in cria um público invisível

> *"Somente clientes com opt-in passam a ganhar créditos Vibe ao completar as missões."*

O opt-in é **único por cliente**, não por cartão — quem tem mais de um cartão elegível dá um aceite só. Quem já participava antes da nova jornada **continua ativo** e não precisa readerir.

Existe um segmento inteiro — **elegível, com cartão, sem opt-in** — que não ganha nada e não sabe disso. **Hoje não está mapeado em nenhuma régua nossa.** O próprio material pede push + SMS com deeplink levando à adesão no app Afinz (o que, de novo, só serve para B2C e DIA).

## Wallet é consolidada, não por cartão

> *"Não existe uma carteira Vibe por cartão."*

O saldo exibido no app Afinz é **espelho da wallet Vibe inteira** e pode ter vindo de outro parceiro do ecossistema (Sadia R$30 por compra de produtos, R$10 por envio de nota fiscal, R$30 por atualização cadastral) ou de outro cartão do mesmo cliente.

→ A copy fala **"seus créditos Vibe"**, nunca "os créditos do seu cartão X".

## Acúmulo ≠ resgate

- **Adesão e acúmulo:** app Afinz (Fase 1 e Fase 2).
- **Resgate:** **sempre no app Vibe.** O cliente precisa baixar o app Vibe para resgatar, ainda que não precise para aderir.

Confundir os dois quebra a jornada. Resgate em **250+ marcas** — delivery, cinema, shows, viagens, moda, beleza, pets, alimentação.

## Roadmap de integração

| Fase | O que muda |
|---|---|
| **Fase 1** | Adesão ao Vibe **dentro do app Afinz**: cliente elegível vê o programa, faz um opt-in único, a conta Vibe é criada |
| **Fase 2** | **Saldo e extrato** passam a ser consultados no app Afinz. Resgate continua no app Vibe |

## Performance — números para pitch

| Etapa | Métrica | Resultado |
|---|---|---|
| Aquisição | Volume de simulação de propostas | **+21%** |
| Aquisição | Taxa de aprovação | **+33%** |
| Aquisição | Emissão de cartão | **+31%** |
| Engajamento | Clientes com conta Vibe que acessaram o app | **70%** |
| Engajamento | Resgataram em menos de 7 dias | **45%** |
| Ativação | Cupom ativado **com** resgate | **68%** |
| Ativação | Cupom ativado **sem** resgate | **64%** |
| Ativação | Sem ativação de cupom | **57%** |
| Ativação | Ganho médio do resgate | **+14 p.p.** (+20 p.p. vs sem ativação) |

> 📊 Snapshot 2026-08-08, material comercial interno. O achado central: **não basta o cliente aderir — o ganho de ativação vem do RESGATE.** Por isso a régua não termina no opt-in.

## Habilitação de parceiro novo

Vibe é uma **plataforma habilitada parceiro a parceiro**. FAQ interna: *"O parceiro pode ter valores diferentes de crédito? Sim. As missões e valores fazem parte da configuração da proposta de valor do parceiro."*

Fluxo: **Comercial** implanta a proposta de valor → aciona **CRM** → CRM estrutura missões com **Vertem** e **IN** → IN habilita arquitetura e comunicação → **Go-Live**.

> Frase do material que vale como princípio: *"O parceiro não está implantado quando a configuração técnica termina. Está implantado quando o cliente entende o benefício e consegue utilizá-lo."*

Para os três parceiros atuais o pacote já está fechado (R$100 + R$30). Para parceiro **novo**, perguntar ao Comercial: está habilitado, com quais missões e quais valores?

## Sorteio: R$100 mil, com ressalva

O material comercial de ago/2026 afirma **R$100 mil todo mês** em dois slides. Mas a descrição do app Vibe no Google Play (24/06/2026) diz *"até R$10.000"*, e o último regulamento localizável **expirou em 11/05/2026**.

→ **Não publicar valor sem regulamento vigente.** Detalhe em [Conflitos-de-Fonte-Produtos-2026-08](evolucao.md#conflitos-de-fonte-produtos-2026-08) §3.

Mecânica: o número da sorte vem do **resgate**, não do acúmulo. Sempre *"use e concorra"*.

## Proibições

- Prometer créditos sem a condição de **anuidade ativa**
- *"R$30 todo mês"* sem dizer que depende de **pagar a fatura em dia**
- *"Os créditos do seu cartão"* — a wallet é consolidada
- *"Acumule e concorra"* — é **use** e concorra
- Mandar resgatar no app Afinz — resgate é no app Vibe
- **Bem Mais:** mandar aderir ou consultar saldo "pelo app"
- **+amigo:** qualquer menção a Vibe
- Tratar Vibe como promoção com prazo

## Relacionado

- [Regua-Vibe-Ativacao](#regua-vibe-ativacao) · [Dicionario-de-Produtos](dados.md#dicionario-de-produtos) · [Beneficios-e-Vigencia](dados.md#beneficios-e-vigencia) · [Pode-Dizer-Nao-Pode-Dizer](dados.md#pode-dizer-nao-pode-dizer)
- [Conflitos-de-Fonte-Produtos-2026-08](evolucao.md#conflitos-de-fonte-produtos-2026-08) · [Estrategia-Multicanal-Vibe-Mar-Fechado](#estrategia-multicanal-vibe-mar-fechado)
- [Ofertas](legado.md#ofertas) · [Casos-de-Uso](legado.md#casos-de-uso) · [Segmentos](legado.md#segmentos) · [Template](#template) · [activities](dados.md#activities)


---

## Anti-Overlap-Pressão-de-Contato

> **tags:** `estrategia,restricao,governanca` | **tipo:** `estrategia` | **camada:** `estrategia` | **atualizado:** `2026-06-08` | **status:** `a-validar` | **fonte:** `gaas-supabase`

# Anti-Overlap / Pressão de Contato

**Definição:** a restrição que evita **bombardear o mesmo indivíduo** com disparos sobrepostos — controlar a frequência de contato por pessoa para não queimar a base.

## Contexto
É a **restrição #2 da [Função-Objetivo](#função-objetivo)** (respeitar pressão de contato) e relaciona-se ao playbook anti-bounce de SMS/WhatsApp (item 5 do [diretor](legado.md#framework-v1-diretor)). O destino é um `frequency_ledger` no [Orquestrador](#orquestrador) — um livro-razão de quantas vezes cada CPF foi tocado.

## ⚠️ Bloqueio
Hoje o GaaS só tem dado **agregado** (volume por campanha), não individual (CPF). Anti-overlap real depende de acesso ao dado individual no [SFMC](operacao.md#sfmc-salesforce-marketing-cloud) — é a [decisão aberta #2](evolucao.md#decisões-abertas) e teto da [Fase 3](#roadmap-framework).

## Relacionado
- [Função-Objetivo](#função-objetivo) · [Orquestrador](#orquestrador) · [SFMC-Salesforce-Marketing-Cloud](operacao.md#sfmc-salesforce-marketing-cloud) · [Decisões-Abertas](evolucao.md#decisões-abertas) · [Roadmap-Framework](#roadmap-framework)


---

## Ativacao-de-Audiencias-Diaria

> **tags:** `estrategia,audiencias,midia,sfmc,aws,ativacao` | **tipo:** `estrategia` | **camada:** `estrategia` | **atualizado:** `2026-08-04` | **status:** `confirmado` | **fonte:** `pesquisa-externa`

# Ativação de Audiências Diária (SFMC → S3 → Meta/Google)

**Definição:** o pipeline decidido (2026-06-10) para sincronizar **diariamente** as 6 bases de meio/topo de funil — **Topo de Funil / Repescagem / Upgrade × B2C e Plurix** — como Custom Audiences (Meta) e Customer Match (Google).

## Restrição de crédito vigente

Decisão confirmada em 04/08/2026: aquisição via CRM e mídia paga opera apenas com **mar fechado**. Para o plano Vibe, o escopo de aquisição é:

- Base_Proprietaria B2C (`b2c_topo`).
- Meio de funil combinado: Aprovados_nao_convertidos + Negados, preservando a identificação dos subgrupos.
- Audiência digital comprada no Insights Hub Serasa, mantida como origem separada e como aproximação mais externa permitida.

Cartonistas pertencem à Rentabilização. Seguidores e lookalike da audiência Serasa pertencem ao Branding e não devem ser reaproveitados como aquisição sem nova decisão do time de Crédito. Contrato completo em [Estrategia-Multicanal-Vibe-Mar-Fechado](#estrategia-multicanal-vibe-mar-fechado).

## As 6 audiências (mapeamento [Segmentos](legado.md#segmentos) × [Etapa-de-Aquisição](#etapa-de-aquisição))
| Audiência | Regra |
|---|---|
| `b2c_topo` | Base_Proprietaria + Aquisicao (Parceiro Proprietaria) |
| `b2c_repescagem` | Negados + Meio_de_Funil |
| `b2c_upgrade` | Aprovados_nao_convertidos + Meio_de_Funil |
| `plurix_topo` | CRM + Aquisicao |
| `plurix_repescagem` | Negados + Meio_de_Funil |
| `plurix_upgrade` | Aprovados_nao_convertidos |

## Rotas avaliadas (pesquisa 2026-06-10)
| Rota | Custo | Veredito |
|---|---|---|
| **A — Salesforce nativo** (Advertising Studio → Data 360 Ad Audiences) | US$ 2.000/mês; **não renovável após 15/ago/2026** (sunset → Data Cloud) | só se Data Cloud já estiver no contrato |
| **B — Lake AWS + APIs diretas** ✅ | ~R$ 0 (centavos de AWS) | **escolhida** — conversa com GaaS/MCPs existentes |
| **C — Ferramenta paga** (LeadsBridge Pro; Hightouch/Census US$ 350/mês) | dezenas–centenas US$/mês | plano B sem manutenção de código |

## Desenho da Rota B
1. **SFMC → S3** (time de dados): AppFlow connector SFMC (só leitura, agendado) ou Automation Studio Data Extract; snapshot diário completo por audiência.
2. **Normalização + hash na origem**: e-mail trim/lowercase e telefone E.164 (+55, só dígitos) → **SHA-256**; `external_id` interno fica em claro (spec Meta).
3. **Push (GaaS)**: Meta Marketing API `usersreplace` (MCP já expõe `ads_create_custom_audience`/`ads_update_custom_audience_users`); Google via **Data Manager API** (OAuth, sem developer token) — ⚠️ upload de Customer Match pela Google Ads API antiga foi descontinuado (tokens dormentes bloqueados desde abr/2026); builds novos nascem na Data Manager API.
4. **Auditoria** no Supabase (contagens, match rate, freshness) + naming alinhado à [Taxonomia-Activity-Name](#taxonomia-activity-name) e ao `af_adset` do [AppsFlyer-Tracking-CRM](operacao.md#appsflyer-tracking-crm).

## Requisitos das plataformas
- **Meta:** verificação de negócio + termos de Custom Audience + system user token; mín. 100 usuários (1.000 p/ performance).
- **Google:** conta em boa situação de policy; lista com ≥100 membros atualizados em 540 dias; sem trava de gasto mínimo documentada hoje.
- **LGPD:** dado sai hasheado, mas é compartilhamento com terceiro p/ publicidade — exige base legal/consentimento na origem, exclusão de opt-outs e aprovação DPO. Liga com [Anti-Overlap-Pressão-de-Contato](#anti-overlap-pressão-de-contato) e [Governança-de-Dados](evolucao.md#governança-de-dados).

## Pendências
> ⚠️ A validar: entrega do contrato de dados pelo time de BI/dados (bucket, IAM, horário, flag de consentimento); aprovação DPO; verificação de negócio Meta; OAuth Data Manager API.

## Relacionado
- [SFMC-Salesforce-Marketing-Cloud](operacao.md#sfmc-salesforce-marketing-cloud) · [AppsFlyer-Tracking-CRM](operacao.md#appsflyer-tracking-crm) · [Segmentos](legado.md#segmentos) · [Mídia-Paga](#mídia-paga) · [Estrategia-Multicanal-Vibe-Mar-Fechado](#estrategia-multicanal-vibe-mar-fechado) · [Decisões-Tomadas](evolucao.md#decisões-tomadas) · [Decisões-Abertas](evolucao.md#decisões-abertas) · [Governança-de-Dados](evolucao.md#governança-de-dados)


---

## Briefing-e-Regua-de-Aquisicao

> **tags:** `briefing, regua, aquisicao, estrategia, onboarding` | **tipo:** `estrategia` | **camada:** `estrategia` | **atualizado:** `2026-10-02` | **status:** `confirmado` | **fonte:** `codigo-gaas`

# Briefing e Régua de Aquisição

**Definição:** contrato de intenção que explica a função de cada comunicação, o contexto que a justifica e a mudança de comportamento esperada antes de escrever a peça.

## Contexto e conceitos

Uma régua organiza vários contatos em torno de um objetivo. O briefing de cada toque precisa ensinar produto e público a quem vai produzir ou revisar a mensagem. O CSV técnico contém os campos que o template consome; ele não substitui o raciocínio do briefing.

Segmento descreve o estado do público; jornada descreve o fluxo; sequência identifica a posição do toque. Um segmento pode participar de jornadas distintas. Uma ordem de oito toques não implica oito dias nem intervalo universal.

## O que preencher por toque

| Bloco | Pergunta que precisa responder |
|---|---|
| Papel | Por que este e-mail existe e qual lacuna do anterior resolve? |
| Público e momento | Quem recebe, qual sinal justifica o contato e quem sai? |
| Objetivo | O que a pessoa deve entender ou fazer? |
| Proposta de valor | Qual benefício principal importa para esse público? |
| Prova | Qual fonte, condição, rede/praça e vigência sustentam o argumento? |
| Mensagem e objeção | Qual ideia fica e qual barreira é removida? |
| CTA | Qual ação e destino, em cada ocorrência? |
| Conteúdo | Assunto, pré-cabeçalho, título, corpo, imagem e legal coerentes |
| Dinâmica | Quais campos variam, de onde vêm e qual fallback aprovado? |
| Operação | Gatilho, cadência, supressões, chave e assinatura |
| Teste | Hipótese, métrica, janela e comparação |
| Rastreabilidade | Versão planejada, peça executada e motivo das diferenças |

Ausência de informação deve aparecer como pendência; não completar contexto comercial por analogia entre produtos.

## Exemplo de progressão +amigo

**Arquitetura recomendada, não comprovação de uma régua atualmente enviada:** diferenciar Clube e cartão → provar economia aplicável à rede → explicar custos e condições → ampliar utilidade Visa/app → apresentar saúde quando validada → reduzir fricção → responder objeções → recapitular sem falsa urgência.

Na audiência de topo definida em 02/10/2026, o destinatário já é membro do Clube. A mensagem deve explicar o valor incremental do cartão. Essa restrição da régua não torna adesão ao Clube requisito universal para solicitar o produto. A supressão por proposta iniciada, aprovação ou recusa precisa ser definida e conferida na jornada real; a arquitetura de planejamento não prova implementação.

## Como revisar planejado e executado

1. Identificar régua, toque, assinatura e versão.
2. Conferir se o argumento central aparece na headline, corpo e imagem.
3. Validar a condição comercial tanto na arte quanto no texto e no legal.
4. Verificar se todos os CTAs seguem a ação pretendida e têm destino/tracking governados.
5. Registrar diferenças deliberadas e lacunas; não afirmar aderência com base só no assunto.
6. Conferir se o toque repete o anterior ou prepara o próximo com intenção.

## Medição

Proposta iniciada/concluída, aprovação, ativação e primeira compra descrevem etapas diferentes. Abertura e clique ajudam a diagnosticar comunicação. Comparação entre campanhas não demonstra incremento causal; para esse objetivo é necessário desenho de controle adequado e dados com cobertura/janela explícitas.

## Fontes, limites e navegação

Fontes editoriais: `.claude/skills/produtos-afinz/references/briefing-regua-aquisicao.md`; [Ficha-de-Produto-Guia](operacao.md#ficha-de-produto-guia); [Fabrica-de-Emails-GaaS](operacao.md#fabrica-de-emails-gaas). Código consultado: `src/modules/dynamic-email/services/managementService.ts` e `export/aiContextMarkdown.ts`. A referência da skill contém orientação editorial; não confirma um benefício vigente nem jornada ativa.

[Motor-de-Briefing-Automatico](#motor-de-briefing-automatico) descreve também arquitetura e propostas de automação. Não presumir que todas as camadas ali descritas estão implementadas. [Servico-Emails-Dinamicos](operacao.md#servico-emails-dinamicos) é o caminho de execução.

## Relacionado

- [Dicionario-de-Produtos](dados.md#dicionario-de-produtos) · [Topo-de-Funil](#topo-de-funil) · [Segmentos](legado.md#segmentos) · [Régua](#régua) · [Jornada](#jornada)
- [Fontes-e-Proveniencia-Growth](#fontes-e-proveniencia-growth) · [Enciclopedia-Servicos-Growth](#enciclopedia-servicos-growth)


---

## Deck-Plano-de-Midias-Arquitetura

> **tags:** `estrategia,midia,deck,apresentacao,criativo,kv,vibe` | **tipo:** `estrategia` | **camada:** `estrategia` | **atualizado:** `2026-08-07` | **status:** `confirmado` | **fonte:** `deck-aprovado`

# Deck do Plano de Mídias — Arquitetura de Referência

**Definição:** a arquitetura narrativa e de layout do deck de plano de mídia paga da Afinz,
consolidada na construção do plano de agosto de 2026 (transição Copa/Visa → Vibe). Referência
aprovada: `Plano_de_Midias_Afinz_Vibe_Ago26.pptx`, 14 slides.

**Skill que executa:** `afinz-pptx`, seção "Plano de Mídias — arquitetura de referência".

**Onde ela vive** — versionada no repositório, acessível a qualquer agente:

| Item | Caminho |
|---|---|
| Instruções | `.claude/skills/afinz-pptx/SKILL.md` |
| Guia de marca | `.claude/skills/afinz-pptx/brand_spec.md` |
| Template 22 layouts | `.claude/skills/afinz-pptx/assets/afinz_template_institucional.pptx` |
| Script de marca | `.claude/skills/afinz-pptx/scripts/apply_afinz_brand.py` |
| Ponto de entrada para agentes | `AGENTS.md` na raiz |

O Claude Code carrega como skill de projeto automaticamente. Codex e outros agentes leem o
`SKILL.md` como markdown comum — ele é autossuficiente e os caminhos internos são relativos à
pasta da skill.

## Os 14 slides, em três blocos

Divisórias no layout `Slide respiro / Título` separam os blocos e são o que permite conduzir a
apresentação falando.

| # | Slide |
|---|---|
| 1 | Capa |
| 2 | **Divisória: Estratégia mídia paga** |
| 3 | Objetivo e divisão de investimento por frente ativa |
| 4 | Peças e KVs |
| 5 | **Divisória: Estrutura de campanhas** |
| 6 a 9 | Uma frente por slide — Aquisição, Branding, Rentabilização, Seguros |
| 10 | **Divisória: Projeções e acompanhamento** |
| 11 | Projeção por campanha |
| 12 | Acompanhamento e decisão por métrica |
| 13 | O que fica fora deste ciclo |
| 14 | Próximos passos |

**Decisão de ordem:** criativo (slide 4) vem antes do detalhe das frentes. O deck estabelece o
que será dito antes de detalhar onde será veiculado — serve a reuniões com marketing na sala.

**Sem apêndice.** Material de apoio vira arquivo separado.

## Anatomia do slide de frente

Cinco blocos fixos, repetidos entre frentes de propósito: cada dono de área lê um slide só.

1. **Faixa de topo preta** — Verba mensal · Verba diária · Canais · KPI principal · Última etapa medida
2. **Duas colunas de plataforma** — logo, card de campanha com verba mensal
3. **Lista de conjuntos** — nome do grupo, verba do grupo, status em caixa colorida com texto
4. **Coluna de segmentação** (preta, à direita) — quem é cada audiência, em prosa. É o bloco que
   diferencia o deck de uma planilha exportada. Padrão herdado de deck de agência.
5. **Faixa de KVs** — cards numerados com conceito, quem recebe, novo ou acervo, formatos

## Cores por frente

| Frente | Tratamento |
|---|---|
| Aquisição | Ciano `#00C6CC` preenchido |
| Rentabilização | Ciano vazado |
| Branding / Brandformance | Verde `#D3FF00` preenchido |
| Seguros | Verde vazado |
| Plurix e standby | Preto |

Cheio e vazado agrupam por família: azul é a jornada do cartão, verde é marca e cross-sell.
Vermelho `#E74742` nunca identifica frente — só alerta e bloqueio. A cor se repete em cinco
lugares ao longo do deck, sempre a mesma.

## Modelo de decisão adotado — Messy Middle

O deck abandonou o funil linear. Adotou o ciclo de *Decoding Decisions* (Google e The
Behavioural Architects, 2020): **Exposição** envolve tudo, **Gatilhos** disparam, o laço
**Exploração ↔ Avaliação** é onde a decisão acontece, depois **Compra** e **Experiência**, que
realimenta o laço.

| Posição no ciclo | Frente |
|---|---|
| Exposição | Branding — lookalike e display contextual |
| Gatilhos | Serasa, aprovados e negados do CRM |
| Exploração | Branding — search de intenção e display em cupom e cashback |
| Avaliação | Brandformance — audiência exata levando à landing |
| Compra | Aquisição — Meta App e Display |
| Experiência | Rentabilização e Seguros |

**Ressalva registrada no deck:** o estudo descreve categorias de escolha aberta. Cartão de
crédito tem uma camada acima do ciclo — elegibilidade de crédito. Por isso o plano opera em
lista própria: não é limitação de alcance, é a aplicação da recomendação do próprio estudo de
encurtar a distância entre gatilho e compra.

**Brandformance ≠ Branding.** Brandformance é tráfego para audiência qualificada, medido por
visita à landing. Branding é reconhecimento, medido por lembrança estimada. O deck separa os
dois. Ver [Estrategia-Multicanal-Vibe-Mar-Fechado](#estrategia-multicanal-vibe-mar-fechado).

## Modelo criativo — KV, desdobre e peça

Três níveis, nunca confundir:

- **KV** — a ideia visual original. É o trabalho de criação e serve o **território de mensagem**,
  não o grupo de anúncio.
- **Desdobre** — o mesmo KV em outro formato. É execução.
- **Peça** — o arquivo final que entra na plataforma, direcionado ao grupo.

**Territórios (chamados de gatilhos no deck):** Solicitar cartão · Retomar pedido · Avaliar ·
Lembrar · Usar · Proteger. Grupos do mesmo território dividem o KV e mudam apenas copy e
destino. Se cada grupo tivesse KV próprio, a produção dobraria para dizer as mesmas seis coisas.

**Formatos de desdobre:** Meta 4:5 (1080×1350) · Meta 9:16 (1080×1920) · Display 1:1
(1200×1200) · Display 1,91:1 (1200×628). Vídeo só no Meta — o Display responsivo trabalha com
imagem, logo e texto.

**Regra do número de desdobres** — formatos por canal × tipos de peça:
Meta e Display sem vídeo → 4 · Meta e Display com vídeo → 6 · só Meta com vídeo → 4.
A regra precisa estar escrita no slide, senão 4 e 6 parecem arbitrários.

**Search não gera KV visual** — são títulos e descrições. Declarar se é revisão de copy
existente ou criação do zero.

**Com o time de criação, falar em KV estático e vídeo, não em desdobre.** Eles produzem
conceito e vídeo; desdobre é adaptação.

## Regras de dado que o deck impõe

- **Três categorias:** todo número é *realizado*, *projetado* ou *pendente*, e o slide diz qual.
  Projeção leva selo próprio. "Pendente" nunca vira estimativa.
- **Baseline própria antes de benchmark externo.** Conferir CPM e CTR contra
  [paid_media_metrics](#mídia-paga) do período anterior. Se bater, dizer no slide que bate.
- **Não comparar CPA de plataforma com CAC de CRM.** CRM ativa base já adquirida, mídia paga
  compra alcance novo. Ver [CAC](#cac).
- **Não somar unidades heterogêneas.** Arquivo de Meta, asset de Display responsivo, asset
  textual de Search e asset group de PMax são quatro moedas. Não existe "total de peças".
- **Verba é mensal, ritmo é diário.** A tabela mostra verba mensal e verba diária (mensal ÷ 31).
- **Nenhum nome próprio.** Responsabilidade é sempre área.
- **"Regras", nunca "guardrail".**

## Verificação de integridade antes de escrever qualquer slide

Rotina que surgiu de erros reais na construção do plano de agosto:

1. Contagem real de campanhas e grupos, incluindo buracos de numeração.
2. Soma das verbas por frente contra o total declarado.
3. IDs cruzados entre abas — quando divergirem, usar o **nome operacional** e registrar a
   divergência. Na v6 os IDs de Branding não batiam entre as abas 01/02 e a 05.
4. Grupos simultaneamente com direito de uso aprovado e status pronto.

Reportar os achados antes de continuar.

## Processo que funcionou

**Produzir um contra-roteiro antes de montar.** O roteiro da aba `04_Roteiro_PPT` é ponto de
partida, não especificação. Foi essa inversão que gerou o valor: o roteiro original não tinha
projeção, não tinha flighting, não tinha território de mensagem e colocava budget no slide 11.

**Se o usuário já editou uma versão, editar o arquivo dele — não regenerar.** Ele adiciona
logos, divisórias e correções de texto que se perdem numa regeração.

## Erros que custaram retrabalho

- Apontar para o arquivo errado por usar nome fixo em vez de padrão de busca.
- Transformar todo slide em tabela porque a fonte é planilha.
- Somar arquivos de Meta com assets de Display.
- Quebrar uma frente em várias linhas por causa de uma coluna de situação — se a coluna sair,
  a quebra perde o motivo.
- Bandas de rodapé de largura total colidindo com o logo do template.
- Cinza claro em card, que o script de marca transforma em preto.
- Inventar prazos e fases que a planilha não tem sem marcar como proposta.

## Relacionado

- [Estrategia-Multicanal-Vibe-Mar-Fechado](#estrategia-multicanal-vibe-mar-fechado) ·
  [Plano-de-Midias-Afinz-Vibe-Handoff](#plano-de-midias-afinz-vibe-handoff) ·
  [Ativacao-de-Audiencias-Diaria](#ativacao-de-audiencias-diaria) ·
  [Segmentos](#segmentos) · [Mídia-Paga](#mídia-paga) · [Vibe](#vibe)


---

## Deck-Relatorio-Resultados-Arquitetura

> **tags:** `estrategia,midia,deck,apresentacao,relatorio,financeiro` | **tipo:** `estrategia` | **camada:** `estrategia` | **atualizado:** `2026-08-21` | **status:** `confirmado` | **fonte:** `deck-aprovado`

# Deck de Relatório de Resultados — Arquitetura de Referência

**Definição:** a arquitetura narrativa e de layout do deck de prestação de contas de mídia paga
por período (trimestre, mês) da Afinz — segunda arquitetura da skill `afinz-pptx`, distinta da do
Plano de Mídias. Referência aprovada: `Relatorio_Gastos_Trimestral_Midia_Paga_Mai-Jul26.pptx`,
7 slides, período maio–julho de 2026.

**Skill que executa:** `afinz-pptx`, seção "Relatório de Resultados — arquitetura alternativa".

## Quando usar esta arquitetura em vez do Plano de Mídias

| Situação | Arquitetura |
|---|---|
| Planejar o próximo ciclo, briefar criação | [Deck-Plano-de-Midias-Arquitetura](#deck-plano-de-midias-arquitetura) |
| Prestar contas de um período fechado a um diretor | Esta nota |
| Público quer só "quanto custou e o que trouxe" | Esta nota |

## A virada de tom

A primeira tentativa abriu com um número-herói de alerta — "metade da verba do trimestre não tem
leitura de retorno". Rejeitada: não por estar errada, mas porque diretor "só quer saber mais de
financeiro e o que é feito com a verba". A virada foi trocar diagnóstico por prestação de contas:
tabela limpa, sem alarme. **Regra derivada:** para público de diretoria, o corpo do slide é fato
financeiro; incerteza e diagnóstico de causa vivem no rodapé ou nas notas do apresentador, nunca
competindo com o número principal.

## Os 7 slides

1. Capa — "Mídia paga · Relatório de gastos trimestral"
2. Visão de investimento total — frente × objetivo × mês a mês × total × % da verba
3 a 6. Um slide por frente — tabela mês a mês: custo, impressões, CPM, cliques, CPC, resultado
principal, custo por resultado, mais linha de trimestre
7. A verba do próximo ciclo — frente × o que muda × verba anterior × verba nova

Sem divisórias, sem apêndice — é prestação de contas, não storytelling.

## Colunas de resultado mudam por objetivo da frente

| Frente | Colunas de resultado |
|---|---|
| Aquisição | Instalações · Custo por instalação · Inícios de proposta · Custo por início |
| Rentabilização | CTR — o clique já é o resultado, não force uma coluna extra |
| Seguros | Leads · Custo por lead |
| Plurix | Instalações — ou "(sem leitura)" se não confirmado, ver regra abaixo |

Todo valor monetário leva `R$`, incluindo CPM, CPC e custo por resultado — não só a linha de
custo total.

## Regra inegociável: nunca rotular um número sem confirmar a fonte

Lição mais cara desta arquitetura. O deck trazia "980 instalações" de Plurix em maio, puxado de
`paid_media_metrics.conversions`. Ao investigar direto no Meta Ads (MCP, `ads_get_ad_entities`
nível campanha), o indicador de instalação retornou **"Not available" para os três meses,
inclusive maio** — o 980 nunca foi confirmado como instalação. Nenhum campo testado (`app_install`,
`mobile_app_install`, `omni_app_install`, `landing_page_view`, `lead`, `post_engagement`) batia
com o número. O app +amigo do Plurix nunca foi cadastrado no AppsFlyer.

**Decisão:** remover o número e usar "(sem leitura)" nas três colunas, mesmo tendo valor
disponível no banco. Número sem fonte confirmada é pior que nenhum número.

**Rotina antes de rotular qualquer coluna de resultado:**

1. Nome de coluna no banco não é a verdade — confirme direto na plataforma (MCP Meta Ads,
   `results`/`cost_per_result` no nível de campanha).
2. Se a plataforma responder "Not available", o slide não pode levar esse rótulo.
3. Para evento de app, confira `appsflyer_governed_apps` — sem app cadastrado, não existe MMP.
4. Documente a causa raiz, não só "sem leitura".

## Risco de pipeline: dias inteiros podem faltar sem aviso

Comparando o gasto total do Meta (MCP) com `paid_media_metrics`, apareceu divergência de ~4,7%
no trimestre — em todas as frentes ao mesmo tempo, não uma campanha isolada. Causa: quatro datas
(28/06, 24/07, 25/07, 26/07) com só 2-3 campanhas registradas em vez de 5. Buraco de
sincronização, não erro de campanha. Detalhe completo em
[Falha-Sincronizacao-Meta-Supabase-4Dias-Ago26](#falha-de-sincronização-meta→supabase—quatro-dias-do-trimestre-mai–jul26).

**Checagem obrigatória antes de fechar qualquer relatório de período:** comparar calendário
completo de datas esperadas contra `paid_media_metrics` por frente, e cruzar qualquer buraco
com o gasto real do Meta antes de decidir corrigir ou registrar como pendência.

**Nesta ocorrência:** decisão do usuário foi não recalcular o deck já pronto em cima da hora —
registrar a pendência e corrigir no próximo fechamento. Escolha válida sob prazo, desde que
consciente.

## Referência

`Relatorio_Gastos_Trimestral_Midia_Paga_Mai-Jul26.pptx`, na raiz do repositório — versão final
aprovada, com edições manuais do usuário por cima da versão gerada. Comece um relatório novo
lendo esse arquivo para herdar geometria de tabela, espaçamento e rodapé.

## Relacionado

- [Deck-Plano-de-Midias-Arquitetura](#deck-plano-de-midias-arquitetura) ·
  [Quebra-de-Medicao-Aquisicao-B2C-Jun26](#quebra-de-medição-aquisição-b2c-junho-de-2026) ·
  [Falha-Sincronizacao-Meta-Supabase-4Dias-Ago26](#falha-de-sincronização-meta→supabase—quatro-dias-do-trimestre-mai–jul26) ·
  [Mídia-Paga](#mídia-paga)


---

## Estrategia-Bases-Segmentadas-Original-2026-01

> **title:** `Estratégia de aquisição por bases segmentadas (regra original, jan/2026)` | **tipo:** `estrategia` | **camada:** `estrategia` | **dominio:** `crm-aquisicao` | **status:** `referencia` | **atualizado:** `2026-10-29` | **fonte:** `planilha Estrategias_Aquisicao_Bases_Segmentadas.xlsx` | **fonte_criada:** `2025-03-24` | **fonte_modificada:** `2026-01-06` | **aliases:** `Bases Segmentadas, Estratégia de Bases Segmentadas, Regra original das réguas` | **tags:** `estrategia, crm, aquisicao, publicos, regua`

# Estratégia de aquisição por bases segmentadas (regra original, jan/2026)

> **O que é esta nota.** A transcrição da planilha `Estrategias_Aquisicao_Bases_Segmentadas.xlsx`, criada em 24/03/2025 e alterada pela última vez em 06/01/2026. Ela é a **regra original** das cinco réguas de aquisição do CRM: quem entra, quem sai, com que base, por quanto tempo e por qual canal. O que a operação faz hoje está nas páginas de cada público, na seção "Regra original (jan/2026) e o que a operação mostra hoje".

Páginas que comparam a regra com a operação:

- [Carrinho abandonado](resultados-3.md#publico-carrinho-abandonado)
- [Upgrade (aprovados não convertidos)](resultados-4.md#publico-upgrade)
- [Repescagem](resultados-4.md#publico-repescagem)
- [Leads de parceiros](resultados-4.md#publico-leads-de-parceiros)
- [Topo de funil](resultados-4.md#publico-topo-de-funil)

## Leitura rápida

| Campanha | Funil | Quem entra | Pré-análise | Base nova | Duração | Ritmo | Canais | Status na planilha |
|---|---|---|---|---|---|---|---|---|
| Carrinho abandonado | Fim | Aceitou a oferta e parou em fraude (docs/biometria), assinatura ou finalização | Não | Diária (D+1 do abandono) | 15 dias | 2 ativações por semana | WhatsApp com transbordo, Push, SMS | Avaliar com o Zaidan |
| Upgrade de oferta | Meio | Aprovado e não convertido | Sim | Mensal | 15 dias | 2 ativações por semana | WhatsApp, E-mail, SMS | Feito |
| Repescagem | Meio | Negado com chance de aprovação | Sim | Mensal | 15 dias | 2 ativações por semana | WhatsApp, E-mail, SMS | Feito |
| Leads parceiros | Topo | Lead de parceiro sem simulação ou sem análise de crédito | Sim | Mensal | 15 dias | 2 ativações por semana | WhatsApp, E-mail, SMS | Feito |
| Esteiras de topo | Topo | Bases frias de pouco relacionamento | Não | Mensal | 30 dias | 2 ativações por semana | E-mail, SMS e mídia paga | (vazio) |

> **Escopo das esteiras de topo (decisão do Pablo, 29/10/2026).** As esteiras de topo desta planilha (Barril, bureaus, Pago Livre, orgânicos) são **só do B2C**. Os parceiros de varejo (Bem Barato, Plurix e os demais) seguem outro caminho: usam só os próprios leads, e as réguas de topo deles são só para membros do clube. Ver [Topo de funil](resultados-4.md#publico-topo-de-funil).

## Aba "Visão Geral" (transcrição)

| Prioridade | Ciclo de vida | Campanha | Objetivo | Quem | O que precisamos? | Canal prioritário | Quando |
|---|---|---|---|---|---|---|---|
| 1 | Fim de funil | Carrinho abandonado | Finalização de propostas dos clientes que pararam em etapas finais de solicitação | Clientes que deram aceite na oferta, mas que abandonaram funil em etapas de fraude (docs/biometria) com exclusão negados; assinatura de contrato ou finalização | Marcação resultado análise de fraude | CRM: WhatsApp com transbordo; Push; SMS | D+1 após abandono, durante 15 dias com 2 ativações semanais |
| 2 | Meio de funil | Upgrade de oferta | Conversão dos clientes aprovados não convertidos | Clientes aprovados não convertidos dos últimos 3 meses de origem B2C + últimos 6 meses B2B2C sem repetição celular com oferta de aumento de limite para até R$ 2000 aprovados e limite + Platinum acima de R$ 2000 | Olhar repetição de celular para ser filtro de exclusão do todo | CRM: WhatsApp, E-mail e SMS | Régua total com 15 dias duração, considerando frequência de 2 ativações semanais |
| 3 | Meio de funil | Repescagem | Clientes negados com possibilidade de aprovação | Clientes B2C com proposta negada crédito últimos 6 meses + clientes B2B2C negados mais de 6 meses sem repetição celular pré analisados | Validar se a hipótese é válida enquanto não temos swapin | CRM: WhatsApp, E-mail e SMS | Régua total com 15 dias duração, considerando frequência de 2 ativações semanais |
| 4 | Topo de funil | Leads parceiros | Clientes sem simulação de proposta ou sem análise de crédito de origem parceiros | Clientes sem simulação de proposta ou sem análise de crédito de origem parceiros dos últimos 30 dias pré analisados | Dados cadastros obtidos via pré análise | CRM: WhatsApp, E-mail e SMS | Régua total com 15 dias duração, considerando frequência de 2 ativações semanais |
| 4 | Topo de funil | Esteiras de topo | Criação de awareness e engajamento em bases mais frias de pouco relacionamento | Barril Afinz, bases bureau e Pago Livre com abertura ou clique ou início de simulação de propostas nos últimos 12 meses + clientes grupos acima sem engajamento nas ações acima nos últimos 90 dias | (vazio) | CRM: E-mail; SMS / Online: campanhas de mídia paga | Régua total com 30 dias duração, considerando frequência de 2 ativações semanais |

A coluna "Volumetria" existe na aba, mas está vazia em todas as linhas.

## Aba "Racional Lógico IN" (transcrição)

| Funil | Situação | Prioridade | Campanha | Objetivo | Fonte de dados | Critérios de inclusão | Critérios de exclusão | Pré-análise | Elegíveis para CRM | Base nova | Duração | Observações | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Fim de funil | Redesigned | 2 | Carrinho Abandonado | Qualificação do público de abandono com atendimento mais especializado na mesa | Propostas + Fraude + Contratos | Aceite + Abandono docs/biometria/assinatura | Negado por fraude | Não | Todo público restante | Diário (D+1 abandono) | 15 dias | 2 ativações semanais | Avaliar com o Zaidan |
| Meio de funil | New | 1 | Upgrade de Oferta | Conversão dos aprovados não convertidos | Aprovados + Limites aprovados | Aprovados últimos 3 meses B2C ou aprovados de 6 a 12 meses B2B2C | Celular repetido | Sim | Apenas pré-aprovados, com informações de novo limite | Mensal | 15 dias | 2 ativações semanais | Feito |
| Meio de funil | New | 1 | Repescagem | Reabordar negados com chance de aprovação | Negados + Histórico | Negados últimos 6 meses B2C ou negados 6 a 12 meses+ B2B2C negados há mais de 6 meses | Celular repetido | Sim | Apenas pré-aprovados, com informações de novo limite | Mensal | 15 dias | 2 ativações semanais | Feito |
| Topo de funil | New | 1 | Leads Parceiros | Ativar leads de parceiros B2C sem simulação | Leads parceiros B2C | Leads B2C que não bateram no motor de crédito últimos 30 dias | Já convertidos | Sim | Apenas pré-aprovados, com informações de novo limite | Mensal | 15 dias | 2 ativações semanais | Feito |
| Topo de funil | Redesigned | 3 | Esteiras de Topo | Awareness e reengajamento | Barril + Bureau + Pago Livre + Orgânicos B2C + Leads parceiros | CPFs com origem Barril (ipê roxo) (+) clientes com origem Bureaus de crédito (BVS, Quod e SPC Creditis) (+) clientes com origem Pago Livre que tiveram aberturas ou clicks em campanhas de CRM nos últimos 12 meses ou simulação de proposta nos últimos 12 meses (+) clientes orgânicos B2C (+) Leads parceiros sem simulação de proposta há mais de 60 dias que não entraram nas réguas de repescagem ou upgrade de oferta | Grupos acima | Não | 100% da base elegível | Mensal | 30 dias | 2 ativações semanais | (vazio) |

A coluna "Alavanca" da aba mostra erro de fórmula (`#VALUE!`) em todas as linhas, e por isso não foi transcrita. "Situação" é a coluna sem título que vem logo depois dela (New ou Redesigned).

## Onde as duas abas não batem

As duas abas foram feitas para dizer a mesma coisa, mas têm diferenças. Quando forem usar a regra, vale saber disso:

| Ponto | Visão Geral | Racional Lógico IN |
|---|---|---|
| Ordem de prioridade | Carrinho 1, Upgrade 2, Repescagem 3, Leads 4, Esteiras 4 | Upgrade, Repescagem e Leads 1, Carrinho 2, Esteiras 3 |
| Janela do Upgrade no B2B2C | últimos 6 meses | de 6 a 12 meses |
| Janela da Repescagem no B2B2C | negados há mais de 6 meses | "6 a 12 meses+" e "há mais de 6 meses" na mesma frase |
| Objetivo do Carrinho | finalizar a proposta de quem parou no fim | qualificar o público de abandono com atendimento mais especializado na mesa |
| Esteiras de topo | Barril, bureau e Pago Livre engajados em 12 meses, mais os grupos acima sem engajamento em 90 dias | soma também orgânicos B2C e leads de parceiros sem simulação há mais de 60 dias, fora de Repescagem e Upgrade |
| Oferta do Upgrade | aumento de limite até R$ 2000 e limite + Platinum acima de R$ 2000 | não fala de oferta, só de "informações de novo limite" |

## O que a operação mostra hoje (jul a set/2026, resumo)

Medido em `activities` em 29/10/2026, de 01/07 a 30/09/2026. Uma linha é um disparo (uma ação de uma jornada num dia). "Dias com disparo" conta os dias em que houve pelo menos um disparo do público, em qualquer jornada: mede o ritmo da operação, não quantas mensagens cada cliente recebe.

| Público (código no dado) | Disparos | Jornadas | Dias com disparo (de 92) | Cartões | Canais na prática |
|---|---:|---:|---:|---:|---|
| Carrinho (`Abandonados`) | 1.770 | 27 | 92 | 3.286 | WhatsApp quase tudo; Push e SMS no B2C; E-mail 1 disparo |
| Upgrade (`Aprovados_nao_convertidos`) | 247 | 14 | 55 | 194 | WhatsApp; SMS em 9 disparos; sem e-mail |
| Repescagem (`Negados`) | 255 | 15 | 59 | 3.080 | WhatsApp; SMS em 7 disparos; sem e-mail |
| Leads de parceiros (`Leads_Parceiros`) | 30 | 1 | 30 (só setembro) | 10 | só WhatsApp |
| Topo B2C (`Base_Proprietaria`) | 339 | 7 | 64 | 88 | E-mail; SMS em 4 disparos |
| Topo varejo (`CRM`) | 385 | 17 | 69 | 1.035 | E-mail; SMS em 7 disparos |

As diferenças que mais chamam atenção:

1. **O ritmo mudou.** A regra fala em 2 ativações por semana. Hoje o carrinho tem disparo todo dia e virou uma régua diária com três janelas (`Diario`, `Abandonados D-7` no sábado e `Abandonados D-21 A D>7` no dia útil).
2. **O e-mail sumiu do meio de funil.** Upgrade, Repescagem e Leads tinham WhatsApp, E-mail e SMS na regra. Na prática é quase tudo WhatsApp.
3. **O topo virou dois.** A esteira de topo da regra é B2C (`Base_Proprietaria`). O topo de varejo (`CRM`, Plurix, Bem Barato e Dia) não está na planilha: ele usa os leads do próprio parceiro e é só para membros do clube.
4. **A mídia paga da esteira de topo** não aparece em `activities`. Ela fica nos dados de mídia, que ainda não têm página própria nesta estrutura.
5. **O subgrupo do carrinho vazou.** Em setembro, 149 disparos de Upgrade, 144 de Repescagem e os 30 de Leads foram gravados com o subgrupo `Abandonados D-21 A D>7`. É erro de importação, não mudança de régua.

## Relacionado

- [Domínio CRM Aquisição](resultados-2.md#dominio-crm-aquisicao)
- [Briefing e régua de aquisição](#briefing-e-regua-de-aquisicao)
- [Estratégia multicanal Vibe com mar fechado](#estrategia-multicanal-vibe-mar-fechado)
- [Anti-overlap e pressão de contato](#anti-overlap-pressão-de-contato)


---

## Estrategia-Multicanal-Vibe-Mar-Fechado

> **tags:** `estrategia,midia,crm,audiencias,vibe,mar-fechado` | **tipo:** `estrategia` | **camada:** `estrategia` | **atualizado:** `2026-08-04` | **status:** `confirmado` | **fonte:** `briefing-negocio`

# Estratégia Multicanal Vibe com Mar Fechado

> [!important] Estado consolidado
> Para a arquitetura atual de campanhas, decisões de Branding, Seguros, Plurix, eventos, nomenclatura e itens em Standby, ler [Plano-de-Midias-Afinz-Vibe-Handoff](#plano-de-midias-afinz-vibe-handoff).

**Definição:** arquitetura de audiência, destino e papel de canal para a transição de Copa/Visa para [Vibe](#vibe), com aquisição restrita a públicos elegíveis de **mar fechado** por decisão do time de Crédito.

## Regra-âncora de elegibilidade

- CRM e mídia paga de aquisição não podem operar prospecção aberta.
- Todo público de aquisição deve respeitar o universo de **mar fechado**, chamado operacionalmente de **audiência de aquário**.
- A restrição existe para preservar a saúde da carteira de crédito e deve anteceder segmentação, canal, oferta, criativo, lance e budget.
- Lookalikes só entram onde houver autorização explícita nesta estratégia; não herdam automaticamente elegibilidade de aquisição.
- Origem de audiência deve permanecer identificável. Base proprietária, meio de funil e audiência Serasa não podem ser somadas como se fossem uma única fonte.

## Arquitetura por frente

| Frente | Audiência permitida | Papel | Destino principal | Limite de leitura |
|---|---|---|---|---|
| Aquisição | `b2c_topo`: Base_Proprietaria B2C | Escala dentro do universo elegível já conhecido | App Afinz / fluxo de solicitação do cartão | Instalação ou evento de plataforma não equivale a cartão |
| Aquisição | Meio de funil conjunto: Aprovados_nao_convertidos + Negados | Recuperar intenção e conduzir à nova solicitação ou conclusão elegível | App Afinz / fluxo de solicitação do cartão | Manter subgrupos identificáveis para diagnóstico, mesmo se ativados em uma audiência conjunta |
| Aquisição | Audiência digital comprada no Insights Hub Serasa | Aproximação mais externa possível dentro da política de mar fechado | App Afinz / fluxo de solicitação do cartão | Fonte Serasa deve permanecer separada de CRM e base proprietária |
| Rentabilização | Cartonistas Afinz | Levar ao App Afinz e influenciar ativação e uso do cartão | App Afinz, preferencialmente por deep link autenticado | Até existir evento pós-clique certificado, mídia é avaliada até clique/visita qualificada |
| Branding | Seguidores Afinz + lookalike da audiência comprada Serasa | Construir marca e apresentar a proposta Afinz/Vibe | Página de produto no site Afinz | Não tratar visita ao site como aquisição ou rentabilização |

## Função estratégica de Vibe

[Vibe](#vibe) deve ser uma prova concreta da promessa de benefícios da Afinz, não apenas uma troca visual da campanha [Copa-2026](#copa-2026). A marca-mãe continua sendo Afinz; Vibe organiza o território de benefícios, engajamento e uso.

| Frente | Papel de Vibe | Mensagem a construir |
|---|---|---|
| Aquisição | Diferencial para pedir o cartão | Baixar o App Afinz, solicitar o cartão e acessar um ecossistema de benefícios |
| Rentabilização | Razão para voltar ao App e usar o cartão | Descobrir, ativar e usar benefícios disponíveis para cartonistas |
| Branding | Demonstração da proposta de valor | Afinz é mais que crédito: oferece benefícios que acompanham a vida do cliente |

Claims específicos, equivalência monetária de Vibes, condições de cupom, parceiros, validade e aplicativo necessário devem ser confirmados antes de publicação.

## Leitura do site Afinz em 04/08/2026

O site atual sustenta três territórios compatíveis com a entrada de Vibe:

1. **Marca:** “35 anos oferecendo soluções de A a Z” e “Afinz, juntos fazemos mais”.
2. **Produto:** “Muito mais que um cartão de crédito, benefícios que cuidam de você”.
3. **Uso:** cartão Visa internacional, App Afinz, Programa Você Bem e vantagens Visa.

### Destinos recomendados

- **Aquisição:** página `https://afinz.com.br/para-voce/cartao-de-credito/` ou deep link oficial de solicitação.
- **Rentabilização:** App Afinz/deep link da ação; evitar página institucional genérica quando a ação esperada ocorre no aplicativo.
- **Branding:** página de produto Afinz preparada para a narrativa Vibe.

### Pendências para a virada

- A home e a página do cartão ainda exibem Copa/Visa e precisam ser atualizadas antes de receber tráfego Vibe.
- A página do cartão já possui o território “benefícios que ninguém tem” e o Programa Você Bem. A entrada de Vibe deve explicar complementaridade para não criar competição ou confusão entre programas.
- A comunicação deve distinguir **App Afinz** de eventual **App Vibe** e declarar em qual deles cada ação acontece.
- Branding deve levar a uma página que explique produto e benefício; aquisição deve preservar CTA direto de solicitação.

## Mensuração por frente

### Aquisição

- KPI de negócio: proposta, aprovação e cartão quando a ligação com a origem estiver certificada.
- Drivers: clique, instalação, abertura do app, início e conclusão do fluxo.
- Cortes obrigatórios: origem da audiência, segmento de crédito, plataforma, campanha, adset e criativo.
- Proibição: CPA de plataforma não é CAC.

### Rentabilização

- KPI provisório: alcance na base, frequência, clique e visita qualificada/deep link aberto.
- KPI futuro: evento oficial de ativação ou uso, depois de certificado.
- Proibição: não inferir uso do cartão, receita ou rentabilidade a partir de clique.

### Branding

- KPI: alcance qualificado, frequência, CPM, visualização de vídeo e visita engajada à página de produto.
- Diagnósticos: crescimento de audiência própria, busca de marca e evolução de tráfego direto quando mensuráveis.
- Proibição: clique ou visita não equivalem a aquisição.

## Governança de audiência

- Registrar `audience_source`: `b2c_proprietaria`, `meio_funil`, `serasa_insights_hub`, `cartonistas`, `seguidores` ou `lookalike_serasa`.
- Registrar `credit_policy`: `mar_fechado` em toda campanha de aquisição.
- Manter Aprovados_nao_convertidos e Negados identificáveis no dado, mesmo quando a plataforma receber uma audiência combinada.
- Aplicar exclusões entre aquisição, rentabilização e branding para reduzir sobreposição e pressão.
- Preservar consentimento, opt-out, base legal, freshness e match rate de cada lista.

## Decisões ainda necessárias

1. Regra técnica e responsável pela certificação de mar fechado em cada origem.
2. Critérios de seleção e atualização da audiência comprada no Insights Hub Serasa.
3. Janela, proporção e política de expansão do lookalike Serasa para branding.
4. Mecânica comercial e claims aprovados de Vibe.
5. Página Vibe e deep links finais por frente.
6. Eventos oficiais de solicitação, ativação e uso.
7. Budget e metas separados para aquisição, rentabilização e branding.

## Relacionado

- [Vibe](#vibe) · [Ativacao-de-Audiencias-Diaria](#ativacao-de-audiencias-diaria) · [Segmentos](legado.md#segmentos) · [Etapa-de-Aquisição](#etapa-de-aquisição) · [Anti-Overlap-Pressão-de-Contato](#anti-overlap-pressão-de-contato) · [AppsFlyer-Tracking-CRM](operacao.md#appsflyer-tracking-crm) · [Mídia-Paga](#mídia-paga) · [Objetivos-de-Campanha](legado.md#objetivos-de-campanha) · [Ontologia-v2](#ontologia-v2)


---

## Fabrica-XLSX-TOPO-CRM-3

> **tags:** `estrategia, gaas, fabrica-de-emails, xlsx, plurix, briefing, ia` | **tipo:** `especificacao` | **camada:** `estrategia` | **atualizado:** `2026-10-06` | **status:** `planejado` | **fonte:** `decisoes-do-usuario-e-planilha-de-referencia`

# Fábrica XLSX — TOPO DE FUNIL (CRM) 3

## Decisão alinhada em 06/10/2026

Após o teste bem-sucedido do único motor [Emails-Dinamicos-Plurix-V11](operacao.md#emails-dinamicos-plurix-v11), o usuário decidiu que a copy da faixa de limite **não deve ficar no template AMPscript**. Marketing deve escrever o conteúdo dos e-mails no XLSX; IA importa e enriquece rascunhos; GaaS é a fonte principal das edições operacionais posteriores.

**Status: especificação aprovada para implementação futura.** A nova régua, a coluna MENSAGEM_LIMITE e o importador XLSX não foram implementados nesta tarefa. As decisões foram entregues em um prompt para Claude, salvo em `docs/plans/PROMPT_FABRICA_XLSX_TOPO_CRM_3.md` na raiz do projeto. Não confundir esse prompt com uma release publicada.

## As cinco decisões do usuário

| Tema | Contrato aprovado |
|---|---|
| Mensagem de limite no SFMC | Nova coluna opcional no briefing existente |
| Variação do texto | Por e-mail, com marcadores de nome/limite; faixa só com limite positivo |
| Trabalho da IA | Salvar rascunhos enriquecidos com origem dos preenchimentos e lacunas explícitas |
| Primeiro escopo | Dois toques; nova régua `TOPO DE FUNIL (CRM) 3` |
| Edição após importar | GaaS; reimportar mostrando diferenças, sem sobrescrever silenciosamente |

## Entrada editorial

Referência: `Regua_Plurix_TopoFunil_Proposta_Outubro26 (2).xlsx`, recebido do usuário. Possui as abas “Ficha | Régua Topo Plurix” e “Briefing Fábrica”. A segunda organiza campos em linhas e E-mail 1 a E-mail 8 em colunas.

A linha 22 diz que o texto da faixa é fixo no template. Essa orientação precisa ser substituída por um campo preenchível por toque. Ler cabeçalhos/rótulos, não posições fixas. Valores em branco, espaços ou NBSP não são conteúdo preenchido.

A planilha também descreve V10, header dinâmico, pool, benefícios e pendências comerciais. Essas instruções são referência histórica, não autorização para contrariar o recorte atual: headers por imagem e nenhum pool. Condições comerciais e assets pendentes não devem virar fatos confirmados pelo importador.

## Fluxo proposto

XLSX do marketing → interpretação/validação por IA → enriquecimento com cadastros governados → payload estruturado → MCP Supabase → rascunhos versionados no GaaS → revisão/edição/prévia → exportação SFMC → Test Send e jornada de QA.

IA pode completar cores, links, assinaturas, assets e identidade de produto quando houver fonte governada, registrando origem e justificativa. Não inventar oferta, benefícios, vigência, elegibilidade ou condição comercial. Informações ausentes ficam pendentes.

O payload deve conter régua/toque, variantes por rede, conteúdo, vínculo do template, origem do arquivo/aba, proveniência por campo, inferências, avisos, pendências e chave estável de reimportação. Não salvar automaticamente como pronto ou certificado. Futuras skills de Claude e Codex deverão compartilhar esse contrato; não foram criadas ainda.

## Novo contrato proposto para a faixa

- Coluna `MENSAGEM_LIMITE`: Texto, opcional/anulável; dimensionar conforme as mensagens e marcadores.
- Exportação passa de 36 a 37 colunas **somente quando implementada e coordenada com a DE SFMC**. Hoje o contrato operacional continua com 36.
- Marcadores amigáveis: `{{nome}}` e `{{limite}}`, com substituição controlada, sem executar AMPscript arbitrário desse campo.
- Mensagem por toque compartilhada pelas seis variantes de rede; E1 não altera E2.
- Exibir somente com limite positivo e mensagem preenchida; mensagem vazia não recebe fallback de copy fixa.
- Nome vazio precisa de comportamento explícito, sem saudação quebrada; limite ausente não vira zero.
- Novo bloco “Faixa de limite pré-aprovado” na edição e na prévia, abaixo do header.
- Remover o nome repetido no corpo dos dois novos briefings, preservando sentido e concordância. Não alterar todas as réguas antigas.

Exemplos para revisão editorial, a armazenar nos dados do briefing, não no template:

```text
E-mail 1: Parabéns, {{nome}}! Você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo.
E-mail 2: Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado para pedir seu cartão +amigo.
```

## Isolamento da nova régua

A chave técnica atual é produto + TP_CAMPANHA + SEQUENCIA. O nome visual `TOPO DE FUNIL (CRM) 3` não isola sozinho as novas linhas das CRM antigas. A implementação deve definir um identificador técnico de campanha e manter correspondência entre cadastro, briefing exportado, lookup e jornada, sem perder a classificação de negócio CRM.

Preservar uma posição por CPF em ESTADO_SEQUENCIA_CRM e explicitar o limite de um percurso ativo por contato. Não confundir esse estado com entrega de e-mail. Não trocar o principal ou os vínculos das réguas antigas indiscriminadamente. A V11 testada deve permanecer recuperável; criar candidata versionada para o contrato novo.

## Critérios de conclusão futura

Conteúdo editado = salvo = exportado = simulado. Reimportação sem duplicação nem perda de edição no GaaS. CSV de 37 colunas validado e coordenado com SFMC; matriz de dois toques × seis redes; nome/limite/mensagem ausentes ou inválidos tratados; assets, desktop/mobile e clientes de email revisados; histórico e proveniência preservados; regressão das réguas antigas.

Entregar XLSX atualizado, contrato/payload de importação, nova régua em rascunho, template candidato, CSV, instruções SFMC, integração Supabase, merge em main, deploy e verificação da Fábrica publicada. Não ativar jornadas nem enviar ao público. Novo Test Send/jornada QA certificará a nova versão; o teste anterior não o substitui.

Relacionados: [Emails-Dinamicos-Plurix-V11](operacao.md#emails-dinamicos-plurix-v11) · [Fabrica-de-Emails-GaaS](operacao.md#fabrica-de-emails-gaas) · [Emails-Dinamicos-SFMC](operacao.md#emails-dinamicos-sfmc) · [Briefing-e-Regua-de-Aquisicao](#briefing-e-regua-de-aquisicao) · [Servico-Emails-Dinamicos](operacao.md#servico-emails-dinamicos).


---

## Função-Objetivo

> **tags:** `estrategia,objetivo` | **tipo:** `estrategia` | **camada:** `estrategia` | **atualizado:** `2026-06-08` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Função Objetivo

**Definição:** o que o sistema busca maximizar. Dois níveis: tático e estratégico.

## Hierarquia
- **Tática (por caso de uso):** maximizar **Taxa de Conversão** dada uma restrição de CAC. É o objetivo dos [Casos-de-Uso](legado.md#casos-de-uso) de Canal e Oferta (origem: [diretor](legado.md#framework-v1-diretor)).
- **Estratégica (global):** atingir o **[CAC-Ótimo](#cac-ótimo)** por safra — maximizar rentabilidade acumulada, não minimizar CAC (origem: rascunho Pablo).

## Restrições
1. Não ultrapassar `cac_max` ([goals](dados.md#goals)).
2. Respeitar pressão de contato por indivíduo (anti-overlap).
3. Evitar bounce/trava de SMS e WhatsApp (playbook item 5 do diretor).

## Como o orquestrador usa
Toda recomendação é pontuada por: proximidade do CAC ótimo + conversão esperada + confiança (volume) + gap para a meta do mês.

## Relacionado
- [CAC-Ótimo](#cac-ótimo) · [Casos-de-Uso](legado.md#casos-de-uso) · [goals](dados.md#goals) · [Orquestrador](#orquestrador)


---

## Motor-de-Briefing-Automatico

> **tags:** `estrategia,ia,briefing,copy,guardrail,arquitetura` | **tipo:** `estrategia` | **camada:** `estrategia` | **atualizado:** `2026-10-02` | **status:** `inferência` | **fonte:** `pesquisa-externa`

# Motor de Briefing Automático

**Definição:** a arquitetura proposta para que uma IA monte o briefing de comunicação sozinha — lendo segmento, parceiro e produto da nossa própria base, e passando por guardrails determinísticos e contra-visão adversarial antes de entregar.

> Origem: pedido do Pablo em 19/08/2026 — *"deveria ser capaz de ler o segmento, saber o tom, ver o parceiro, saber os benefícios ativos, traçar o perfil, e propor briefing com contra-visão através de guardrails. Como desenvolver a partir de 100% da nossa base?"*
>
> Primeiro protótipo aplicado: 14 briefings Plurix (Repescagem Padrão / Upgrade Padrão).

## O problema real

Escrever uma régua hoje é reunir contexto na mão toda vez. Isso falhou de três jeitos observados:

1. **Benefício morto.** O programa de pontos Plurix encerrou em 01/07/2026. Nada na nossa base marcava validade de benefício — só descobrimos porque alguém foi checar fonte externa.
2. **Régua redundante.** 8 toques na mesma pessoa alternando canal. Sem controle de argumento, viram 8 mensagens dizendo a mesma coisa.
3. **Compliance sem contexto de crédito.** Repescagem já passou por nova análise e pode ter limite pré-aprovado, mas ainda exige "sujeito à análise de crédito" por causa da etapa final de antifraude/biometria. Upgrade depende do resultado declarado da nova análise (`maior` ou `menor`). Copiar uma peça sem resolver esse estado pode prometer emissão garantida ou comunicar o argumento errado.

## As 6 camadas

| Camada | O que faz | Matéria-prima que já temos | Lacuna |
|---|---|---|---|
| **1. Contexto** | Dado (BU, Parceiro, Segmento, Canal), monta tom, guidelines ✅/❌, nome de produto, regra de co-branding, nº de disparos | `03_SEGMENTOS_ESTRATEGIAS.md`, [Dicionario-de-Produtos](dados.md#dicionario-de-produtos), `estrutura_bau_regua.json`, guia de marca do parceiro | Nenhuma — ligável hoje |
| **2. Benefícios vigentes** | Só permite citar benefício com vigência aberta | [Beneficios-e-Vigencia](dados.md#beneficios-e-vigencia) | ✅ **resolvida em 20/08/2026** |
| **3. Estilo derivado de dados** | Puxa as N peças reais do mesmo parceiro+segmento como few-shot, em vez de descrever tom em prosa | [Amostras-Comunicacoes-Reais](dados.md#amostras-comunicacoes-reais) (73 peças), [Templates-Vibe-Revisao-2026](dados.md#templates-vibe-revisao-2026) (61) | **Pipeline de captura contínua** — hoje é snapshot manual |
| **4. Guardrails determinísticos** | Regras binárias em código, antes de qualquer LLM | [Pode-Dizer-Nao-Pode-Dizer](dados.md#pode-dizer-nao-pode-dizer), limites por canal, [Formatacao-WhatsApp-Variaveis-e-Espacamento](operacao.md#formatacao-whatsapp-variaveis-e-espacamento) | **Virar linter executável**, não checklist que o humano lê e esquece |
| **5. Contra-visão** | 2-3 juízes com lentes distintas tentando refutar; aprova por maioria | As próprias peças reais servem de baseline | **Juiz de redundância de régua** — ninguém faz, e é o que salva régua longa |
| **6. Saída** | Uma linha por `template_id`: copy, tamanho medido, link montado, rastro de evidência, flag de confiança | Protótipo entregue | — |

## Camada 4 — as regras que já dá para codificar hoje

```
SMS      → sem acento (acento joga para UCS-2 e o limite cai de 160 para 70)
SMS      → ≤160 chars COM o link já encurtado
WhatsApp → variável é {{n}}, nunca %%TAG%%
WhatsApp → CTA duplo obrigatório, saída sempre "Não tenho interesse agora"
WhatsApp → nenhum {{n}} reusado para dois campos distintos
Repescagem → bloqueia "negado", "recusado", "sua situação melhorou"
Repescagem → permite "pré-aprovado" e limite verdadeiro, mas exige "sujeito à análise de crédito"
Repescagem → não promete emissão: antifraude/biometria ainda pode impedir a conclusão
Upgrade    → resolve primeiro o resultado declarado no activity_name: `maior` ou `menor`
Upgrade maior → comunica aumento e limite verdadeiro quando disponível
Upgrade menor → reutiliza a linha de Repescagem
+amigo   → bloqueia "pontos" e "Vibe"
Bem Mais → bloqueia "veja seu saldo no app" e "adira pelo app"
Qualquer → benefício citado tem que existir em Beneficios-e-Vigencia com STATUS=VIGENTE
Qualquer → nome de produto tem que bater com o parceiro
Qualquer → nunca "anuidade grátis"
Qualquer → bloqueia "até 40 dias para pagar" enquanto não houver fonte oficial vigente e rastreável
Produto elegível ao Vibe → Vibe é a âncora/diferencial da proposta de valor, não benefício secundário
Topo de funil B2C SMS → 4 disparos, 1 por semana, durante 4 semanas
```

## Regras de limite, CTA e cálculo para SMS/Push

- **Meio de funil:** quando `%%LIMITE_CRD%%` estiver disponível, usar o limite verdadeiro da pessoa.
- **Topo de funil ou fonte sem limite declarado:** não inventar personalização. Uma alegação como **"até R$ 6.000"** é uma variante de teste válida somente com teto comercial aprovado.
- **Topo de funil B2C:** estruturar a mensagem com Vibe como âncora da proposta de valor e diferencial do produto; benefícios funcionais entram como sustentação.
- **Régua de SMS de topo de funil B2C:** gerar exatamente **4 SMS**, com **1 disparo por semana durante 4 semanas**. A progressão semanal deve variar o argumento sem perder a âncora Vibe.
- **Prazo de pagamento:** excluir **"até 40 dias para pagar"** de qualquer copy. A alegação permanece bloqueada até existir fonte oficial vigente, rastreável e validada.
- **Repescagem:** CTA-base `Peça seu cartão`.
- **Upgrade:** CTA-base `Conclua seu pedido`.
- Até os links definitivos serem governados, produzir a copy com `%%LINK_CONTINUAR%%`; o SMS final precisa ser recontado com o link encurtado real.
- As condições comerciais do Vibe pertencem ao checklist de copy/compliance. **Não entram como premissa nos cálculos de priorização ou performance desta régua**, conforme decisão operacional de 20/08/2026.

## Camada 5 — as três lentes

- **Compliance** — a peça afirma algo que ninguém confirmou? (ex.: *"sua oferta expira"*)
- **Marca** — soa como as peças reais **deste** parceiro, ou soa como copy genérica de banco?
- **Redundância de régua** — este toque repete argumento de outro toque da **mesma** régua?

O terceiro é o que ninguém faz e é justamente o que impede 8 toques de virarem 8 mensagens iguais.

> **Ressalva honesta:** LLM-as-judge é sensível a posição, verbosidade e formulação do prompt ([arXiv 2506.09443](https://arxiv.org/html/2506.09443v3)). Por isso a camada 4 tem que capturar **tudo que é binário** — o juiz só cuida do que é genuinamente subjetivo. **Juiz não substitui regra.**

## Achados de base que viraram regra

- **Topo de funil B2C SMS tem cadência definida em 20/08/2026:** 4 disparos, sendo 1 por semana durante 4 semanas. Para outras réguas, `d1..d8` continua representando ordem de disparo sem intervalo universal; a cadência precisa ser definida por jornada.
- **A BAU conta disparos POR CANAL.** Repescagem = 4 WhatsApp + 4 SMS. A régua de 8 toques alternados **não contradiz** a BAU — é a mesma coisa intercalada. Upgrade previa 4+4 e a planilha tem 3+3.
- **O link AppsFlyer completo não cabe em SMS** — 148 chars (Negados) e **163** (Upgrade), contra limite de 160. Sem encurtador, régua de SMS é inviável.
- **SMS reais são escritos sem acento de propósito** ("Ultimos dias", "ja sou cliente") para caber em GSM-7.
- **Estado de crédito confirmado em 20/08/2026:** Repescagem já passou por nova análise e tem limite pré-aprovado; a ressalva de análise permanece pela validação antifraude/biometria. Upgrade também passa por nova análise e bifurca por `activity_name`: `maior` recebe aumento de limite; `menor` recebe a linha de Repescagem.

## Referências externas

- [Extract a Brand Voice Guide So AI Writes Like You Do](https://www.digitalapplied.com/blog/extract-brand-voice-guide-ai-content-2026)
- [How to train in-house LLMs on brand voice — Search Engine Land](https://searchengineland.com/guide/how-to-train-in-house-llms-on-brand-voice)
- [LLM-as-a-judge: complete guide — Evidently AI](https://www.evidentlyai.com/llm-guide/llm-as-a-judge)
- [LLMs Cannot Reliably Judge (Yet?) — arXiv 2506.09443](https://arxiv.org/html/2506.09443v3)

## Relacionado

- [Dicionario-de-Produtos](dados.md#dicionario-de-produtos) · [Beneficios-e-Vigencia](dados.md#beneficios-e-vigencia) · [Pode-Dizer-Nao-Pode-Dizer](dados.md#pode-dizer-nao-pode-dizer)
- [Formatacao-WhatsApp-Variaveis-e-Espacamento](operacao.md#formatacao-whatsapp-variaveis-e-espacamento) · [Reguas-Inteligentes-Arquitetura](#reguas-inteligentes-arquitetura) · [Regua-Vibe-Ativacao](#regua-vibe-ativacao)
- [Galeria-de-Templates](evolucao.md#galeria-de-templates) · [Skills-do-Projeto](ia.md#skills-do-projeto) · [Vault-como-Contexto](#vault-como-contexto) · [Estrategia-de-Contexto](#estrategia-de-contexto)

## Aplicação operacional — revisão editorial 02/10/2026

### Como ler esta arquitetura

As seis camadas combinam fatos, protótipo e propostas. A existência de uma regra em prosa não demonstra linter, juiz ou geração operacional implantados. [Briefing-e-Regua-de-Aquisicao](#briefing-e-regua-de-aquisicao) é a intenção editorial; [Fabrica-de-Emails-GaaS](operacao.md#fabrica-de-emails-gaas) descreve a implementação documentada; [Servico-Emails-Dinamicos](operacao.md#servico-emails-dinamicos) descreve a execução completa.

### Conflito comercial a reconciliar

A referência `.claude/skills/produtos-afinz/references/plurix-cartao-mais-amigo.md`, com pesquisa de setembro, admite até 40 dias condicionado ao ciclo para +amigo. O bloqueio amplo nesta nota foi registrado antes. Não liberar a promessa nem generalizar entre cartões: confirmar fonte vigente e escopo de aplicação com Produto. Registrar resultado na ficha/benefício canônico. A revisão editorial de 02/10 não resolveu a condição por pesquisa externa.

### Contexto operacional atual

O GaaS contém contexto ativo e sete guardrails do +amigo na consulta de 02/10. Essa leitura confirma cadastro; não prova suficiência comercial das evidências. Ver [Fontes-e-Proveniencia-Growth](#fontes-e-proveniencia-growth) para regra de audiência, marca e Você Bem.


---

## Ontologia-v2

> **tags:** `estrategia,framework,v2,governanca` | **tipo:** `estrategia` | **camada:** `estrategia` | **atualizado:** `2026-08-04` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Ontologia v2 (Especificação Sistêmica)

**Definição:** o documento-fonte que define cada termo, domínio e regra do framework — a linguagem única para humanos e IAs operarem sob a mesma especificação.

## Contexto
Evolui o [v1](legado.md#framework-v1-diretor) adicionando duas entidades que tornam o conhecimento rastreável ([Entidades-v2](legado.md#entidades-v2): [Template](#template) e [Experimento](#experimento)) e reconciliando os domínios com os dados reais do Supabase (expondo [Inconsistências-a-Corrigir](evolucao.md#inconsistências-a-corrigir)).

**Arquivo:** `Ontologia_GaaS_v2.xlsx` (9 abas: Glossário, Domínios, Entidades & Relações, Função Objetivo, Regras de Negócio, Casos de Uso, Plano GaaS, Funil AARRR).

## Regras-âncora
- Conversão zero é resultado válido (não dado ausente).
- Confiança = volume de execução.
- Etapas de funil não se misturam.
- Todo valor usa o domínio canônico.
- Aquisição em CRM e mídia paga respeita a política de **mar fechado** definida pelo time de Crédito; elegibilidade antecede canal, oferta, criativo e budget.
- Origem de audiência é uma fronteira semântica: base proprietária, meio de funil e audiência comprada Serasa não se misturam sem identificação.

## Estratégia Vibe

- [Estrategia-Multicanal-Vibe-Mar-Fechado](#estrategia-multicanal-vibe-mar-fechado) — regra de audiências e papéis de Aquisição, Rentabilização e Branding na transição pós-Copa.

## Relacionado
- [Entidades-v2](legado.md#entidades-v2) · [Framework-v1-Diretor](legado.md#framework-v1-diretor) · [Estrategia-Multicanal-Vibe-Mar-Fechado](#estrategia-multicanal-vibe-mar-fechado) · [Inconsistências-a-Corrigir](evolucao.md#inconsistências-a-corrigir) · [Governança-de-Dados](evolucao.md#governança-de-dados)


---

## Orquestrador

> **tags:** `estrategia,orquestrador,visao` | **tipo:** `estrategia` | **camada:** `estrategia` | **atualizado:** `2026-06-08` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Orquestrador (a visão de destino)

**Definição:** a camada de **decisão** acima do GaaS — transforma dados, hipóteses e oportunidades em campanhas de aquisição acionáveis.

## O que faz
Sugere campanhas, organiza públicos, prioriza oportunidades, evita sobreposição de comunicação, controla calendário, recomenda canais, gera briefings, acompanha resultados e alimenta aprendizados.

## Por que é viável
Duas peças já existem: o histórico denso ([activities](dados.md#activities)) e a ingestão com revisão humana ([gaas_update_runs](dados.md#gaas_update_runs)). Falta o **loop prospectivo** — hoje o sistema sabe *o que aconteceu*, não decide *o que disparar a seguir*. O modelo de output já existe em [paid_media_insights](dados.md#paid_media_insights).

## Modelo proposto (validar contra Supabase)
`orchestrator_campaigns` (jornada-safra), `orchestrator_dispatches` (régua), `orchestrator_opportunities` (output do motor), frequency_ledger (anti-overlap, depende de dado individual).

## Relacionado
- [campaign_context](dados.md#campaign_context) · [Entidades-v2](legado.md#entidades-v2) · [Roadmap-Framework](#roadmap-framework) · [Função-Objetivo](#função-objetivo) · [Decisões-Abertas](evolucao.md#decisões-abertas)


---

## Plano-de-Midias-Afinz-Vibe-Handoff

> **tags:** `estrategia, midia-paga, vibe, aquisicao, rentabilizacao, branding, seguros, plurix, handoff` | **tipo:** `handoff-estrategico` | **camada:** `estrategia` | **atualizado:** `2026-08-05` | **status:** `confirmado-com-pendencias` | **fonte:** `briefing-negocio-e-workbook`

# Plano de Mídias Afinz/Vibe — Handoff consolidado

> [!important] Leitura para outro chat
> Esta é a nota canônica para continuar o Plano de Mídias Afinz/Vibe. Ler esta nota inteira antes de propor campanhas, orçamento, audiência, tracking, apresentação ou alteração do workbook.

## Objetivo do plano

Organizar a mídia Afinz em cinco frentes com objetivos, audiências, destinos e mensuração independentes:

1. **Performance/Aquisição** — gerar cartões emitidos com qualidade de carteira.
2. **Rentabilização** — levar cartonistas ao App Afinz e estimular uso do cartão por meio da proposta Vibe.
3. **Branding** — construir a associação Afinz + Vibe e gerar progressão rastreável.
4. **Seguros** — operar cross-sell fechado e validar venda digital na lojinha.
5. **Plurix** — gerar início de proposta no App +amigo, separado do B2C Afinz.

Vibe é a proposta de valor transversal de benefícios e relacionamento. Não deve ser tratada apenas como troca visual da comunicação Copa/Visa.

## Decisão central

Aquisição opera em **mar fechado**. Uma única campanha Meta de promoção do App Afinz contém grupos separados para base proprietária B2C, meio de funil e Serasa Insights Hub. Google Display atua como piloto apenas com audiências elegíveis disponíveis no Google. Search não integra Aquisição.

Branding combina dois papéis: a audiência Serasa exata recebe Brandformance orientado à visita qualificada na Landing Vibe; o lookalike Serasa recebe campanha Meta de Reconhecimento otimizada para **lembrança estimada do anúncio**. Google Search captura intenção de marca/produto e Google Display opera em whitelist contextual.

Rentabilização utiliza cartonistas Afinz em Meta e Google Display. Seguros utiliza audiência fechada em Meta e Display, enquanto Google Search pode operar em mar aberto exclusivamente para a lojinha. Search valida intenção e conversão na fase 1; Performance Max permanece em `Standby`, com investimento zero, como fase 2 condicionada ao tracking certificado. Plurix permanece separada e pausada até revisão de criativos e validação de `StartTrial`.

## Regras inegociáveis

- Elegibilidade de Crédito precede canal, segmentação, criativo, oferta, lance e budget.
- Aquisição não usa público aberto.
- `Targeting` deve restringir a entrega; `Observation` não atende ao mar fechado.
- Expansão de audiência e optimized targeting devem permanecer desligados nas campanhas restritas.
- Whitelist controla **onde** o anúncio aparece; audiência controla **quem** recebe.
- Não existe audiência Serasa Insights Hub disponível no Google neste plano.
- Visita à LP não torna uma pessoa elegível para Aquisição por si só.
- Base proprietária, aprovados, negados, Serasa, cartonistas e Plurix permanecem identificáveis na mensuração.
- CPA ou conversão de plataforma não são CAC.
- Dados ausentes não podem ser convertidos em zero.
- Exceções exigem Pablo Prado como aprovador, justificativa, evidência e validade.

## Arquitetura de campanhas

### Performance/Aquisição

#### Meta — campanha B2C única

`AFINZ_AQUISICAO_VIBE_META_PROMOCAO_APP_B2C_170826`

Grupos: `b2c_proprietaria`; `meio_funil_aprovados + meio_funil_negados`; `serasa_insights_hub`. Aprovados e negados podem ser ativados juntos, mas permanecem separados no dado.

Destino: App Afinz/fluxo de solicitação. KPI herói: cartão emitido. Evento técnico: `fb_mobile_complete_registration`. Rótulo no Meta: **Concluir inscrição**. A equivalência com cartão emitido depende de reconciliação com AppsFlyer e Core.

#### Google Display — piloto condicionado

`AFINZ_AQUISICAO_VIBE_GOOGLE_DISPLAY_MAR_FECHADO_170826`

- Audiências: base proprietária e meio de funil elegível disponível no Google.
- Não incluir Serasa Insights Hub.
- `Targeting` restritivo; optimized targeting e expansão desligados.
- Whitelist e exclusões aprovadas.
- Search de Aquisição removido.

#### Recuperação de proposta — Standby

`AFINZ_AQUISICAO_VIBE_META_APP_CARRINHO_PROPOSTA_STANDBY_DDMMYY`

Público: iniciou proposta e não emitiu cartão. Destino: deep link de retomada. Investimento atual: zero. Ativação condicionada à reconciliação entre `StartTrial`, conclusão e CRM.

### Branding e Brandformance

#### Meta — Brandformance Serasa exata

`AFINZ_BRANDING_VIBE_META_TRAFEGO_SERASA_EXATA_170826`

- Público: Serasa Insights Hub exata e autorizada.
- Objetivo: Tráfego; otimização para visualizações da página de destino.
- Destino: Landing Vibe dedicada.
- KPI herói: visita qualificada.
- Racional: maior probabilidade esperada de aprovação; hipótese a validar no Core.
- Papel: apresentar Vibe e criar progressão rastreável para App, proposta, aprovação e cartão.

#### Meta — lembrança de marca

`AFINZ_BRANDING_VIBE_META_LEMBRANCA_LOOKALIKE_SERASA_170826`

- Público: lookalike autorizado da audiência Serasa.
- Objetivo técnico: Reconhecimento.
- Meta de desempenho: maximizar lembrança do anúncio.
- KPI herói: lembrança estimada do anúncio.
- Apoios: alcance, frequência, CPM e saturação.
- Confiança: direcional.
- Não chamar a métrica modelada de Brand Lift ou incrementabilidade causal.

#### Google — intenção e contexto

- `AFINZ_BRANDING_VIBE_GOOGLE_SEARCH_INTENCAO_170826` — busca de marca, produto e benefícios para a Landing Vibe.
- `AFINZ_BRANDING_VIBE_GOOGLE_DISPLAY_WHITELIST_170826` — descoberta contextual em sites aprovados de cupons, cashback, benefícios e comparação.

Brandformance combina construção de marca e progressão mensurável. No plano Afinz, a campanha Serasa exata é o principal caso de Brandformance; a campanha lookalike é Branding orientado à lembrança.

### Rentabilização

- `AFINZ_RENTABILIZACAO_VIBE_META_TRAFEGO_APP_170826` — cartonistas, destino no App/deep link.
- `AFINZ_RENTABILIZACAO_VIBE_GOOGLE_DISPLAY_WHITELIST_170826` — Customer Match de cartonistas + whitelist.

Objetivo: levar cartonistas ao App e estimular uso pela proposta Vibe. KPI de negócio: uso certificado. Proxy: acesso qualificado ao App. Guardrails: frequência, opt-out, match rate e entrega fora da lista.

### Seguros

#### Cross-sell fechado

- `AFINZ_SEGUROS_META_LEADS_CARTONISTAS_FECHADO_170826` — cartonistas, leads.
- `AFINZ_SEGUROS_GOOGLE_DISPLAY_CARTONISTAS_FECHADO_WHITELIST_170826` — Customer Match de cartonistas + whitelist.
- `AFINZ_SEGUROS_META_VENDAS_SITE_ECOM_FECHADO_170826` — e-commerce futuro, base Afinz fechada e elegível.

#### Lojinha — fase 1

`AFINZ_SEGUROS_GOOGLE_SEARCH_LOJINHA_MAR_ABERTO_170826`

Mar aberto permitido exclusivamente para intenção de busca por seguros. Destino: lojinha/site e-commerce. Função: validar termos, oferta, páginas, checkout, compra e qualidade comercial.

#### Lojinha — fase 2

`AFINZ_SEGUROS_GOOGLE_PMAX_LOJINHA_MAR_ABERTO_STANDBY_DDMMYY`

- Tipo: Performance Max.
- Status: `Standby`.
- Investimento: `0%` / `R$ 0`.
- Função futura: escala multicanal.
- Gates: compra como conversão primária; receita/valor enviados; checkout validado; ativos completos; volume para aprendizado; URLs e exclusões aprovadas.
- PMax não é Search ampliado: distribui em múltiplos inventários Google.

### Plurix

`PLURIX_AQUISICAO_MAIS_AMIGO_META_STARTTRIAL_280826`

- Grupos: base própria e meio de funil Plurix.
- Destino: App +amigo.
- Evento: `StartTrial` = início de proposta.
- Status: pausada.
- Gate: revisão de criativos e validação do evento.
- Resultados e budget separados do B2C Afinz.

## Mensuração

| Frente | KPI herói | Proxy | Confiança/limite |
|---|---|---|---|
| Aquisição | Cartões emitidos | Início de proposta/clique para App | Confirmar após reconciliação AppsFlyer + plataformas + Core |
| Rentabilização | Cartonistas com uso certificado | Acesso qualificado ao App | Bloqueado até evento de uso certificado |
| Branding | Lembrança estimada + visitas qualificadas à LP | Alcance, frequência, clique para App | Direcional; sem Brand Lift ou causalidade |
| Seguros | Leads qualificados e vendas da lojinha | Lead/início de compra | Separar fechado, Search aberto e futura PMax |
| Plurix | Inícios de proposta | Instalação do App | Bloqueado até revisão de evento e criativos |

## Nomenclatura

- Campanhas, grupos e anúncios usam `_`, sem espaços.
- O anúncio termina com a data de criação.
- Padrão: `MARCA_FRENTE_TEMA_PLATAFORMA_OBJETIVO_PUBLICO_DATA`.
- Itens sem data usam `DDMMYY`.

## Itens em Standby

- Recuperação/carrinho de proposta B2C.
- Performance Max da lojinha de Seguros — investimento zero.
- Criteo.
- DV360.

## Workbook de referência

Arquivo mais recente validado:

`C:\Users\Pablo Prado\OneDrive\Área de Trabalho\PROJETOS IA\ACALENDARIO APP\outputs\019fcf91-e8dd-7e00-b9e1-a93df03cf30e\Plano_de_Midias_Afinz_Vibe_v5.xlsx`

Abas: `00_Resumo_Estrategico`; `01_Plano_de_Midias`; `02_Audiencias_e_Grupos`; `03_Mensuracao_e_QA`; `04_Roteiro_PPT`.

O budget e a distribuição preenchidos pertencem ao usuário. Não redistribuir ou inventar investimento sem solicitação.

## Próximas validações

1. Direito de uso e ativação da Serasa e do lookalike.
2. Eventos e destinos definitivos, incluindo deep links.
3. Reconciliação de `fb_mobile_complete_registration` com cartão emitido no Core.
4. Evento certificado de uso para Rentabilização.
5. Compra, receita e checkout da lojinha de Seguros.
6. Criativos, claims Vibe e validades.
7. Match rate e entrega fora da lista em campanhas fechadas.
8. Volume necessário antes de liberar PMax.

## Relacionado

- [Estrategia-Multicanal-Vibe-Mar-Fechado](#estrategia-multicanal-vibe-mar-fechado)
- [Vibe](#vibe)
- [Ativacao-de-Audiencias-Diaria](#ativacao-de-audiencias-diaria)
- [Mídia-Paga](#mídia-paga)
- [Objetivos-de-Campanha](legado.md#objetivos-de-campanha)
- [AppsFlyer-Tracking-CRM](operacao.md#appsflyer-tracking-crm)
- [Anti-Overlap-Pressão-de-Contato](#anti-overlap-pressão-de-contato)
- [Ontologia-v2](#ontologia-v2)


---

## Regua-Vibe-Ativacao

> **tags:** `estrategia,regua,vibe,ativacao,rentabilizacao` | **tipo:** `estrategia` | **camada:** `estrategia` | **atualizado:** `2026-08-20` | **status:** `confirmado` | **fonte:** `pesquisa-externa`

# Régua Vibe — Ativação e Recorrência

**Definição:** a régua oficial do programa [Vibe](#vibe), desenhada para levar o cliente **da adesão ao hábito de uso**. Não é régua de aquisição — é de **ativação/rentabilização**, e por isso não está em `reguas_taxonomia.md` da skill de copy.

> Fonte: material interno *"Treinamento Comercial — App integrado ao app Afinz"*, 08/08/2026.

## A tese

> *"O objetivo não termina no opt-in: clientes que utilizam e resgatam o benefício apresentam maior ativação. Por isso a estratégia de CRM acompanha o cliente da adesão ao hábito de uso."*

Os números sustentam: cupom ativado **com** resgate = **68%** de ativação de portfólio; **sem** resgate = 64%; sem ativação de cupom = 57%. O ganho está no **resgate**, não na adesão.

E o CRM tem papel explícito: *"Produto/App constrói a experiência; CRM garante que ela seja usada."*

## A régua

| Momento | Objetivo | Conteúdo | Canais |
|---|---|---|---|
| **(pré)** | **Opt-in** | Campanha de incentivo à adesão. Deeplink levando o elegível direto para a adesão no app Afinz | Push + SMS |
| **(transacional)** | **Crédito recebido** | Comunicação transacional; saldo e extrato no app. Torna o benefício percebido | E-mail + push |
| **D+7** | **1º resgate** | Ofertas patrocinadas, de **baixo valor e uso diário**: transporte, internet, gás, mobilidade. Resgate imediato pelo link, **sem app** | WhatsApp, e-mail |
| **D+15** | **2ª transação** | Amplia categorias e reforça o ganho percebido. Régua transacional | SMS, WhatsApp |
| **D+30** | **3ª transação** | Recorrência consolidada. Padrão de superapp — **3 transações em 30 dias** — aplicado ao ciclo Vibe | SMS, WhatsApp |
| **Pós D+30** | **Sorteios** | Chance de levar R$100 mil | WhatsApp, e-mail, SMS |

## Decisões de desenho que valem copiar

**O 1º resgate é deliberadamente barato e cotidiano.** Transporte, internet, gás — não cinema nem viagem. O objetivo do D+7 não é entregar valor máximo, é **provar que funciona** com a menor fricção possível. E é resgatável **pelo link, sem precisar do app** — remove a barreira de download exatamente no momento mais frágil.

**O sorteio vem depois do hábito, não antes.** Só entra pós-D+30, quando o cliente já resgatou três vezes. Usar sorteio como gancho de entrada inverteria a lógica: ele é recompensa de recorrência, não isca de adesão.

## 🔴 Dois buracos abertos

### 1 — Não existe régua Vibe para o Bem Mais

Toda a régua acima pressupõe o **app Afinz**: opt-in por deeplink no app, "saldo e extrato no app", push de crédito recebido.

O [Cartao-Bem-Mais-Afinz-Visa](dados.md#cartao-bem-mais-afinz-visa) tem app **whitelabel**. Ele **ganha os créditos** mas não tem opt-in, saldo nem extrato no app. **Nenhum momento desta régua funciona para ele como está escrito.**

→ Precisa de uma variante: como ele adere, onde vê saldo, como resgata. Não existe desenhada.

### 2 — O público sem opt-in não está mapeado

*"Somente clientes com opt-in passam a ganhar créditos Vibe."* Existe um segmento **elegível, com cartão, sem opt-in** — que não ganha nada e não sabe. O material pede push + SMS com deeplink, mas **essa régua não existe em nenhuma das nossas taxonomias**.

## Pendências de execução

- Entrar em `references/reguas_taxonomia.md` da skill `afinz-copy-aquisicao` como régua de **rentabilização/ativação**.
- Cruzar com [Anti-Overlap-Pressão-de-Contato](#anti-overlap-pressão-de-contato) — o cliente pode estar simultaneamente numa régua de aquisição de outro produto.
- Definir o gatilho de D+0: é a data do opt-in, do crédito creditado, ou do primeiro crédito **visível** no app? Lembrando que o crédito leva **4 a 8 dias úteis** para aparecer.

## Relacionado

- [Vibe](#vibe) · [Dicionario-de-Produtos](dados.md#dicionario-de-produtos) · [Reguas-Inteligentes-Arquitetura](#reguas-inteligentes-arquitetura)
- [Cartao-Bem-Mais-Afinz-Visa](dados.md#cartao-bem-mais-afinz-visa) · [Anti-Overlap-Pressão-de-Contato](#anti-overlap-pressão-de-contato) · [Régua](#régua)
- [Estrategia-Multicanal-Vibe-Mar-Fechado](#estrategia-multicanal-vibe-mar-fechado) · [Ativacao-de-Audiencias-Diaria](#ativacao-de-audiencias-diaria)


---

## Reguas-Inteligentes-Arquitetura

> **tags:** `estrategia, regua, comunicacoes, ia, skill, roadmap` | **tipo:** `estrategia` | **camada:** `estrategia` | **atualizado:** `2026-08-17` | **status:** `proposto` | **fonte:** `operador`

# Réguas Inteligentes — arquitetura proposta

**Definição:** desenho de como a skill `afinz-copy-aquisicao` (ou uma evolução dela) passa a responder a um pedido como *"me dá uma régua de carrinho abandonado"* já sabendo a estrutura real do funil — variantes de público, canais praticados, cadência esperada — em vez de tratar cada pedido como uma folha em branco. Motivado pelo pedido do Pablo em 2026-08-17 e viabilizado pelos dois datasets extraídos até aqui: [Amostras-Comunicacoes-Reais](dados.md#amostras-comunicacoes-reais) (73 prints pessoais) e [Templates-Vibe-Revisao-2026](dados.md#templates-vibe-revisao-2026) (61 templates da planilha oficial de revisão, com nomes reais e a matriz de régua planejada `Estrutura BAU CRM - OFERTA VIBE`).

## O problema que isso resolve

Hoje, pedir uma régua de comunicação depende inteiramente da memória de quem está escrevendo o briefing: quantos disparos tem Carrinho Abandonado, se existe separação Institucional/Ecred, quais canais essa etapa do funil realmente usa. Isso mora espalhado em três lugares que não conversam entre si — a planilha de governança, a cabeça de quem já rodou campanha antes, e (agora) os dados extraídos por LLM vision. O sintoma concreto: **113 dos 115 `communication_slots` estão `unmapped`** ([communication_slots](dados.md#communication_slots)) — a estrutura de jornada existe, mas ninguém consolidou "isso é o que essa jornada precisa" de um jeito que a skill possa consultar antes de gerar copy.

## Duas camadas de dado, dois papéis diferentes

Réguas inteligentes precisam de dois tipos de conhecimento que **não devem ser misturados na mesma tabela**, porque um é estrutural (muda pouco) e o outro é criativo (muda toda campanha):

1. **Esqueleto da régua** — quantos disparos, em qual ordem, por quais canais, para quais parceiros, dado um segmento/etapa de funil. É estático relativamente: muda quando o time de CRM redesenha a jornada, não a cada campanha. Fonte real hoje: a aba `Estrutura BAU CRM - OFERTA VIBE`, que já é literalmente essa tabela — SEGMENTO × ETAPA FUNIL × CANAL × PARCEIRO → nº de disparos planejados (extraída em `estrutura_bau_regua.json`).
2. **Banco de exemplos de copy real** — o texto, oferta, CTA e tom que já rodaram para cada combinação de segmento/canal/disparo/variante. Isso muda a cada campanha e é o que dá "voz" à sugestão. Fonte: `Amostras-Comunicacoes-Reais` + `Templates-Vibe-Revisao-2026`, ambos já no schema comum (`texto_completo`/`oferta`/`cta`/`elementos_visuais`/`tom`).

A ideia central: **a skill nunca inventa o esqueleto, só preenche com exemplo real ou gera copy nova ancorada em padrão real**. Isso é uma extensão direta da regra não-negociável já existente na skill `gaas-governanca-comunicacoes` (nunca inventar `template_id`/`activity_name`) — aqui vira "nunca inventar estrutura de régua sem lastro na matriz BAU ou em `activities` real".

## O esqueleto, com dados reais de hoje

A partir de `Estrutura BAU CRM - OFERTA VIBE` (41 combinações), a régua de aquisição Vibe já está mapeada assim:

| Segmento | Etapa | Canais | Parceiros | Disparos |
|---|---|---|---|---|
| Topo de Funil | Topo | E-mail, SMS | Afinz, Plurix, Bem Barato, Dia | 8 |
| Repescagem | Meio de Funil | WhatsApp, SMS | Afinz, Plurix, Bem Barato | 4 |
| Upgrade | Meio de Funil | WhatsApp, SMS | Afinz, Plurix, Bem Barato | 4 |
| Carrinho Abandonado \| Diário | Reativação | WhatsApp, SMS, Push | Afinz, Plurix, Bem Barato | 3 |
| Carrinho Abandonado \| 21D | Reativação | WhatsApp, SMS, Push | Afinz, Plurix, Bem Barato | 3 |
| Carrinho Abandonado \| Sábado | Reativação | WhatsApp, SMS, Push | Afinz, Plurix, Bem Barato | 3 |

E cruzando com os nomes reais de template em `Templates-Vibe-Revisao-2026`, a variante de público (que a matriz acima não mostra, porque é uma dimensão ortogonal) já aparece nos nomes: `institucional`, `ecred`, `srsa`, `ac`, `bpc`/`bsp`, `neg`/`ngd` — ou seja, dentro de cada célula da tabela acima ainda existe uma sub-divisão por origem do lead que precisa ser perguntada ou inferida.

## Fluxo proposto: "me dá uma régua de X"

1. **Resolver o segmento pedido contra o esqueleto.** Se o usuário disser "carrinho abandonado" sem especificar, a skill já sabe que existem 3 sub-jornadas (Diário/21D/Sábado) com cadência igual (3 disparos) mas propósito diferente — e pergunta qual (ou sugere as três, se o pedido for amplo).
2. **Perguntar canais, com sugestão pré-preenchida.** A skill já sabe que Carrinho Abandonado historicamente usa WhatsApp + SMS + Push (a matriz BAU); pergunta "quer os 3 ou só alguns?" em vez de perguntar do zero "quais canais existem para isso?".
3. **Perguntar/inferir variante de público.** Se o segmento tiver variantes conhecidas (Institucional/Ecred/Serasa), perguntar quais entram na régua — ou, se o usuário já disse "cliente que veio do Serasa", pular a pergunta.
4. **Para cada combinação (canal × disparo × variante), buscar exemplo real no banco de copy.** Se existir um registro com segmento+canal+ordem de disparo compatível em `Templates-Vibe-Revisao-2026` ou `Amostras-Comunicacoes-Reais`, usar como referência de tom/estrutura/CTA — nunca copiar oferta desatualizada sem avisar (ex.: valores antigos tipo R$100 vs R$200 em créditos Vibe, que já mudaram entre imagens do mesmo dataset).
5. **Gerar a copy nova ancorada no padrão**, explicitando no output quais peças têm exemplo real por trás e quais são geradas sem precedente direto (honestidade sobre o lastro, igual ao que já fazemos nas respostas de copy avulsa).
6. **Deixar explícito o que falta confirmar**: se a régua pedida usa uma combinação sem exemplo real no dataset (ex.: 21D + Push + Ecred), dizer isso abertamente em vez de fingir que existe precedente.

## O que falta para isso funcionar de ponta a ponta

- **Consolidar os dois datasets num índice único, pesquisável por segmento/canal/ordem/variante.** Hoje são dois JSONs separados com schemas ligeiramente diferentes (um tem `variante_publico` explícito, o outro tem a variante embutida no nome do template). Próximo passo natural: normalizar os dois para o mesmo schema.
- **Confirmar com o Pablo se `nome_template_salesforce` pode virar candidato oficial de `template_id`** — hoje é só um candidato forte, não validado contra a planilha de governança formal (`gaas-governanca-comunicacoes`).
- **Cobrir os canais e etapas que ainda não têm nenhum exemplo real capturado** (a matriz BAU tem 41 combinações; os dois datasets combinados cobrem uma fração disso — vale mapear o gap explicitamente antes de prometer cobertura total).
- **Decidir onde esse índice mora**: arquivo de referência dentro da skill (`references/reguas.md` ou `.json`) para uso imediato em qualquer conversa, versus uma tabela Supabase (mais rica, mas exige o pipeline de LLM na ingestão que ainda está em aberto — ver [Galeria-de-Templates](evolucao.md#galeria-de-templates)).

## Relacionado

- [Templates-Vibe-Revisao-2026](dados.md#templates-vibe-revisao-2026) · [Amostras-Comunicacoes-Reais](dados.md#amostras-comunicacoes-reais) · [communication_slots](dados.md#communication_slots) · [communication_templates](dados.md#communication_templates) · [activities](dados.md#activities) · [Estrategia-Multicanal-Vibe-Mar-Fechado](#estrategia-multicanal-vibe-mar-fechado) · [Galeria-de-Templates](evolucao.md#galeria-de-templates) · skill `afinz-copy-aquisicao`


---

## Report-Live-Arquitetura-Editorial

> **tags:** `estrategia, report-live, gaas, deck, apresentacao, curadoria` | **tipo:** `estrategia` | **camada:** `estrategia` | **tipo_diataxis:** `explanation` | **criado:** `2026-09-13` | **atualizado:** `2026-09-15` | **status:** `a-validar` | **fonte:** `auditoria-pdf-agosto-2026` | **aliases:** `Arquitetura Editorial do Report Live, Arquétipos do Report Live`

# Report Live — Arquitetura Editorial

**Definição:** a camada de apresentação do Report Live — os 10 arquétipos de slide que compõem o deck, a régua de comparação padrão, os dois perfis de output e o critério determinístico que decide o que permanece no deck. Não altera motor, certificação nem contrato de imutabilidade.

## Contexto

A homologação de agosto/2026 (run `9bb55892`) entregou um PDF de 57 páginas confiável e auditável — mas otimizado para auditoria, não para leitura. A auditoria página a página encontrou três falhas que se repetem em quase todo bloco:

1. **Zero evolução temporal.** O slide rotulado `time series pacing` é renderizado como tabela de datas. Nenhum gráfico de linha mês a mês existe nas 57 páginas.
2. **Taxonomia crua vazando.** `activity_name` truncado no eixo de gráfico, ilegível.
3. **Escala linear esmagando o funil.** Base acionável de 562.890 e 912 cartões na mesma escala — as três últimas barras desaparecem.

O volume de conteúdo de negócio não é o problema (o anexo técnico é só 7 das 57 páginas). O problema é que esse conteúdo **não vira insight** por falta de memória e de tradução.

## A régua padrão

Toda métrica material passa a ser exibida com quatro elementos: **valor atual · variação contra o período equivalente · série de 6 meses · faixa do próprio histórico**. O veredito só é emitido quando a faixa autoriza.

Três regras que vêm junto:

- Taxa varia em **pontos percentuais**, nunca em %. De 53,8% para 58,6% é +4,8 p.p.
- Antes de falar de taxa, **decompor volume × taxa** — o resultado veio de mais base ou de melhor conversão?
- **Amostra mínima antes de vereditar.** Variação de taxa sobre 93 cartões (Dia) é ruído; a série aparece, o veredito é retido.

> 📊 Por que isso não é enfeite — o CAC da Serasa em agosto caiu 18% contra julho (boa notícia isolada), mas subiu de R$ 2,93 (março) para R$ 7,21, **+146% no semestre**. O delta mensal isolado inverteu o sinal da história. Ver [Serie-Historica-Aquisicao-Mar-Ago-2026](dados.md#serie-historica-aquisicao-mar-ago-2026).

## Os 10 arquétipos

As 57 páginas são dez padrões repetidos. Corrigir o padrão corrige todas as instâncias.

| # | Arquétipo | Alcance | Muda para |
|---|---|---|---|
| 01 | Capa & contrato do snapshot | 1 | Manchete do período; manifesto vira rodapé de uma linha |
| 02 | Leitura executiva | 1 | 1 KPI-âncora com régua + 3 movimentos materiais por delta absoluto |
| 03 | Quality gate / cobertura | 4 | Faixa de chips no rodapé; slide próprio só quando houver bloqueio |
| 04 | Scorecard | 6 | Moeda e percentual formatados, série de 6 meses, máx. 3 métricas |
| 05 | Série temporal / pacing | 3 | Linha acumulada com o período equivalente sobreposto |
| 06 | Breakdown por dimensão | 8 | `group by` canal com share e variação em p.p. (hoje tem bug de grão) |
| 07 | Funil | 6 | Taxa por etapa com série e faixa; absolutos vão para a linha de apoio |
| 08 | Router / ranking | 4 | Tabela de decisão: volume, variação, posição na faixa, profundidade |
| 09 | Tabela analítica de campanhas | 6 | Top-5 decodificado em canal · segmento · oferta |
| 10 | Fila de ação | 8 | 1 slide consolidado com anomalias por regra quando não houver candidata |

Residuais: a dispersão de CAC (eixos sem nome, 26 pontos sem rótulo) sai do perfil executivo; os 7 slides de anexo técnico migram inteiros para o deep dive.

## Compactação: 57 → 31

| Bloco | Hoje | Proposto |
|---|---:|---:|
| CORE | 9 | 5 |
| Parceiro | 27 | 11 |
| Mídia | 7 | 5 |
| B2C | 3 | 1 |
| Condicional | 4 | 2 |
| Anexo | 7 | 7 |
| **Deep dive** | **57** | **31** |
| **Executivo mensal** | — | **12** |

O ganho não vem de cortar governança — o anexo técnico continua inteiro e nunca foi o problema. Vem de trocar **densidade por profundidade**: hoje cada slide de resultado carrega 1 recorte × 1 período; depois, 1 recorte × 6 períodos com faixa.

Contagem do bloco de parceiro: 27 slides (Serasa, Proprietária, Plurix e Bem Barato com 6 cada; Dia com 3 — a regra de materialidade já existe, o limiar é que está frouxo).

## Critério de permanência

Um slide fica no deck se atender pelo menos um de três testes:

1. **Materialidade** — passa o limiar de volume da frente.
2. **Mudança** — o valor saiu da própria faixa histórica.
3. **Ação aberta** — existe recomendação com prazo vigente e dono.

Nada entra por ser uma view que existe. Corolário: **um sinal que se repete por dois ciclos sem outcome sai do deck e vira backlog** — caso real, `TEMPLATE_COVERAGE_LT_80` emitido em julho (23,1%) e agosto (7,5%), piorando, ocupando espaço em dois slides de cada deck. Isso só é possível com [Report-Live-Loop-de-Outcome](ia.md#report-live-loop-de-outcome) rodando.

## Precedente interno

A regra de tom já foi validada em [Deck-Relatorio-Resultados-Arquitetura](#deck-relatorio-resultados-arquitetura): para público de diretoria, o corpo do slide é fato financeiro; incerteza e diagnóstico vivem no rodapé, nunca competindo com o número principal. A hierarquia de curadoria (capa → sumário → insights em Contexto→Mudança→Causa→Ação → visualizações → recomendações) já está desenhada na skill `storytellingfiltergaas` e nunca foi plugada no Report Live.

## Fonte externa

Regra dos 5 segundos, hierarquia sobre densidade, série temporal como linha e curadoria dirigida por decisão — [5of10 Executive Dashboard Examples](https://5of10.com/articles/executive-dashboard-examples/), [ThoughtSpot Data Storytelling](https://www.thoughtspot.com/data-trends/best-practices/data-storytelling), [Sigma Data Fatigue](https://www.sigmacomputing.com/blog/data-fatigue).

Catálogo visual com print de cada arquétipo e o elemento proposto: https://claude.ai/code/artifact/09c6f6df-e289-4455-9eaf-c9f8f5f180cc

## Relacionado

- [Report-Live-Enciclopedia](engenharia.md#report-live-enciclopedia) · [Report-Live-Sheets-Slides](engenharia.md#report-live-sheets-slides) · [Report-Live-Versionamento-e-Publicacao](engenharia.md#report-live-versionamento-e-publicacao)
- [Report-Live-Loop-de-Outcome](ia.md#report-live-loop-de-outcome) · [Serie-Historica-Aquisicao-Mar-Ago-2026](dados.md#serie-historica-aquisicao-mar-ago-2026) · [Dimensao-Canonica-de-Parceiro](dados.md#dimensao-canonica-de-parceiro)
- [Deck-Relatorio-Resultados-Arquitetura](#deck-relatorio-resultados-arquitetura) · [Dossie-Mestre-Operacao-CRM-Midia](ia.md#dossie-mestre-operacao-crm-midia)
- [Ficha-Tecnica-Growth-e-Auditoria-Report-Live-2026-09](ia.md#ficha-tecnica-growth-e-auditoria-report-live-2026-09)

## Implementação candidata — 15/09/2026

- `monthly_report` passa a ser alias de `executivo_mensal`, com 12 slides: 5 core, 4 parceiro, 2 mídia e 1 B2C.
- `deep_dive` seleciona 31 slides: 5 core, 11 parceiro, 5 mídia, 1 B2C, 2 condicionais e 7 anexos. Condicionais ausentes são substituídas pelo próximo slide elegível; slide `omitir_bloqueado` nunca é promovido para completar contagem.
- A geometria deixa de ser coordenada solta no renderer: `layoutGeometryFor()` é o contrato puro compartilhado pelo blueprint e pelo Google Slides, em canvas 720 × 405 pt.
- O contrato de cada gráfico editorial passa a declarar range, séries, eixo, cor e formato numérico. Percentual é `0.0%`, moeda é `R$ #,##0.00` e volume é `#,##0`; o Sheets formata a fonte antes de o gráfico vinculado ser criado.
- `K-VISA`/Copa opt-in sai de novos runs por contrato inativo e não tem mais view nem configuração de gráfico no engine. Histórico e artefatos antigos permanecem preservados.

Estado: código e testes locais concluídos; ainda não equivale a publicação no deck vivo.


---

## Roadmap-Framework

> **tags:** `estrategia,roadmap` | **tipo:** `estrategia` | **camada:** `estrategia` | **atualizado:** `2026-06-10` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Roadmap do Framework

**Definição:** o caminho em fases da visibilidade à orquestração por rentabilidade.

## As fases
| Fase | Entrega | Capacidade | Dependência crítica |
|---|---|---|---|
| **0 — Ver campanhas** | view jornada-safra | enxergar [campanhas](#campanha), não linhas | nenhuma |
| **1 — Estruturar conhecimento** | bases de [Canal](legado.md#canais)+[Oferta](legado.md#ofertas) + [Ontologia-v2](#ontologia-v2) | decisão por número ([Casos-de-Uso](legado.md#casos-de-uso)) | padronização de domínios |
| **2 — Recomendar** | track record + oportunidades + score | recomendação priorizada | [Governança-de-Dados](evolucao.md#governança-de-dados) (acesso) |
| **3 — Orquestrar e otimizar** | [CAC-Ótimo](#cac-ótimo) + personalização | alocação por rentabilidade | renta + dado individual (SFMC) |

## Princípio
Camada de cima não depende da de baixo, mas a de baixo lê a de cima → construir de cima pra baixo (ontologia → conhecimento → decisão).

## Nova frente transversal (2026-06): atribuição AppsFlyer
A camada de [tracking unificado no AppsFlyer](operacao.md#appsflyer-tracking-crm) (`pid=crm`, eventos `account_created`/`account_approved`) corta as fases: dá à Fase 2 leitura de conversão por clique/canal/template sem esperar o dado individual do SFMC, e prepara a Fase 3 (atribuição por dispositivo ≈ proxy de indivíduo). O GaaS assume o papel de **analista de atribuição e QA** dos parâmetros.

## Relacionado
- [Orquestrador](#orquestrador) · [Ontologia-v2](#ontologia-v2) · [Decisões-Abertas](evolucao.md#decisões-abertas)


---

## SFMC-Integracao-API-Roadmap

> **tags:** `estrategia, sfmc, api, integracao, jornadas, personalizacao` | **tipo:** `estrategia` | **camada:** `estrategia` | **atualizado:** `2026-10-07` | **status:** `inferência` | **fonte:** `conversa-pablo-claude-2026-10-06-e-pesquisa-publica`

# SFMC: o que uma integração por API destravaria no GaaS

**Definição e propósito:** registro do que foi mapeado em 06/10/2026 sobre conectar o GaaS ao Marketing Cloud (API REST/SOAP ou MCP), o que isso permitiria em Fábrica de E-mails, Wiki, Comunicações e relatórios, e em que ordem fazer. Motivo central do Pablo: **montar jornadas consome muito tempo**.

## Contexto e conceitos

- O SFMC cobre o meio do funil (enviado, entregue, aberto, clicado, bounce, descadastro) e o conteúdo/jornada. **Cartão, proposta e aprovação não estão no SFMC**; o CAC continua dependendo do join por activity name ou `af_sub`.
- MCP: em 06/10/2026 o único MCP achado (do autor do `mcdev`) só oferece checklist e documentação, **não cria jornada**. O caminho real é a API via **Installed Package** server-to-server.
- Ferramenta de referência: **SFMC DevTools (`mcdev`, Accenture)**, CLI open source que lê, cria, valida, publica, pausa e para jornadas.

## Funcionamento e operação (capacidades por área)

| Área | O que a API permite | Uso no GaaS |
|---|---|---|
| **Data Extensions** | ler, upsert, apagar linha, criar DE, metadados | Fábrica publica briefing direto (com diff e rollback por `dynamic_email_briefing_versions`); DEs de lookup (pool de ofertas, bandeiras) editáveis; audiência só em números agregados (LGPD) |
| **Automações** | listar, rodar agora, histórico e erros, queries SQL | painel de saúde (inclusive "rodou e gerou 0 linhas"); queries versionadas; ingestão de tracking; supressão diária |
| **Jornadas** | criar rascunho a partir de JSON, ler, validar, publicar, parar, pausar, tirar contato | gerador de jornada a partir de molde com nomes pela taxonomia; checagem antes de publicar; planejado x executado; botão de emergência |
| **Tracking** | Data Views (_Sent, _Open, _Click, _Bounce) via automação | relatórios sem upload manual; pressão de contato real (anti-overlap); saúde de entrega; horário por pessoa |
| **Conteúdo** | Content Builder, prévia renderizada pelo SFMC, test send | prévia fiel ao AMPscript (o renderer local não faz ELSEIF) |

**Personalização (o "leque"):** cascata com fallback campo a campo na DE de briefing (específico segmento × investida → segmento → base), em vez de multiplicar linhas. Segmento e investida como colunas explícitas da audiência, não parseados do activity name (que segue como auditoria). Pré-requisito: corrigir o rastreio (`UTM_CAMPANHA` nunca chega ao link, [Emails-Dinamicos-Plurix](operacao.md#emails-dinamicos-plurix) §13).

**IA:** gerar variações **antes** do envio, na Fábrica, com guardrails da Ficha de Produto e aprovação humana. Não chamar LLM na hora do envio. Einstein (personas, STO, frequência, Content Selection) e Agentforce dependem do contrato.

## Regras, condições e limites

- Secret nunca no front (GaaS é estático no GitHub Pages): tudo via Supabase Edge Function.
- Escopos por fase: **só leitura** → escrita em rascunho → publicar/executar.
- Nunca rodar pelo GaaS automação com envio dentro nem "limpar DE"; snapshot antes de escrita; log de quem fez.
- Entrada de jornada por API event exigiria CPF/e-mail no GaaS: evitar.

## Exemplo e validação

Ordem sugerida: (1) leitura: inventário de DEs, jornadas e automações, painel de saúde; (2) ingestão de tracking; (3) publicar briefing da Fábrica numa DE de teste; (4) gerador de jornada por molde em pasta de teste; (5) publicação com checagem e confirmação dupla. Enquanto a API não sai, o **ZIP do Package Manager** já serve de molde e de fonte de leitura ([SFMC-Package-Manager-e-Pacotes](operacao.md#sfmc-package-manager-e-pacotes)).

## Fontes e evidências

Conversa de 06/10/2026; documentação pública do Journey Builder API, Automation Studio, Package Manager, Einstein e Agentforce Marketing (2026); repositório `Accenture/sfmc-devtools`.

## Lacunas e pendências

| Questão | Impacto | Dono |
|---|---|---|
| Quem é admin do SFMC e quem aprova na TI | destrava o Installed Package | Pablo |
| WhatsApp sai pelo SFMC (Chat Messaging) para tudo? | define o que dá para ler de tracking | Pablo |
| Edição/licença Einstein e Agentforce | define o leque de personalização nativo | Pablo / Salesforce |

## Relacionado

- [SFMC-Salesforce-Marketing-Cloud](operacao.md#sfmc-salesforce-marketing-cloud) · [SFMC-Package-Manager-e-Pacotes](operacao.md#sfmc-package-manager-e-pacotes) · [Anti-Overlap-Pressão-de-Contato](#anti-overlap-pressão-de-contato) · [Emails-Dinamicos-Plurix](operacao.md#emails-dinamicos-plurix) · [Fabrica-de-Emails-GaaS](operacao.md#fabrica-de-emails-gaas) · [Decisões-Abertas](evolucao.md#decisões-abertas)


---

## Sistema-de-Experimentacao-Referencias

> **tags:** `estrategia,experimentacao,pesquisa,aprendizados` | **tipo:** `estrategia` | **camada:** `estrategia` | **atualizado:** `2026-06-10` | **status:** `confirmado` | **fonte:** `pesquisa-externa`

# Sistema de Experimentação — Referências e Modelo

**Definição:** o insumo de pesquisa e a validação retroativa que fundamentam a spec SDD do novo **gestor de experimentos** (kanban warehouse-native sobre `activities`), berço da camada de [aprendizados validados](legado.md#diário-de-bordo).

## Benchmarks (pesquisa 2026-06-10)
| Referência | Lição central |
|---|---|
| **Booking.com** (~25k testes/ano) | o ativo é o **repositório pesquisável de todos os experimentos — inclusive fracassados** — com hipótese, iterações e decisão; nada se apaga; memória institucional é o produto |
| **iFood** (plataforma interna "Faster") | experimentação só escala **conectada a audiência + dados + execução** no mesmo lugar — não é quadro ao lado do sistema, é o sistema |
| **Processo GrowthHackers/Sean Ellis** (escola Méliuz) | backlog de ideias → priorização **ICE** (Impact×Confidence×Ease) → cadência semanal → aprendizado documentado. *Caso Méliuz específico não documentado publicamente.* |
| **Eppo / GrowthBook** | padrão **warehouse-native**: experimento definido sobre o warehouse, métricas em SQL reutilizável, zero número digitado. UX: progresso de amostra até significância, badges de decisão, métricas guardrail |

## Os 6 princípios do nosso sistema
1. **Warehouse-native à nossa moda** — warehouse = Supabase; métricas = [views ponderadas](dados.md#views-performance); experimento aponta para dados, nunca digita.
2. **Activity_name é a unidade de randomização** — `experiment_activities (experiment_id, activity_name, grupo)` + regra de auto-attach.
3. **Repositório Booking-style** — refutado é cidadão de 1ª classe; busca por campanha-tipo/segmento/canal/oferta; gera as notas de aprendizado.
4. **Kanban simples, card rico** — 3 colunas (`Backlog → Rodando → Concluído`), decisão como badge; ICE ordena o backlog; sparkline, progresso de significância e guardrails no card.
5. **Owner por login** — `profiles` (7 usuários); aprendizado assinado.
6. **IA nas costuras** — sugere hipóteses (Orientador/anomalias), detecta candidatos pela taxonomia, redige o aprendizado; nunca inventa número.

## Validação retroativa do modelo (dados reais)
**Caso 1 — Vibe como oferta (desde 2025-03):** em fev/2026, Carrinho B2C WhatsApp rodou **Vibe 8,42% × Padrao 0,49%** de conversão lado a lado — um A/B natural já presente nos dados, representável como `grupo=variante (Oferta+Promocional=Vibe+Padrao)` × `grupo=controle (Oferta+Promocional=Padrao+Padrao)`. **⚠️ Regra crítica: a chave de intenção de oferta é sempre o par composto (Oferta, Promocional) — nunca Oferta isolada.** No [Upgrade](#upgrade), Vibe foi caro (CAC R$ 885 em 2025-05 → R$ 155 em 2025-06) — exatamente o tipo de aprendizado que hoje está invisível.

**Caso 2 — a virada de mar/26 no [Carrinho-Abandonado](#carrinho-abandonado) (provável causa encontrada):** mesma oferta (Vibe+Padrao), mesmo subgrupo núcleo (Diario), mas em março (a) surgem os **subgrupos de recência** `Abandonados D-7` e `D-21 A D>7` separados do Diario, e (b) WhatsApp Diario salta 8,42%→**24,05%** e SMS 0,71%→6,75%, com base ~2x. Leitura: a **estratificação por recência** isolou o público fresco (alta conversão) do envelhecido (D-21 converte 0,04%) e a operação escalou no núcleo. Era um "experimento natural" sem registro — o sistema deve suportar **experimentos retroativos** criados a partir de quebras detectadas.

> 📊 Snapshot 2026-06-10. Conclusão: o modelo representa os dois casos. ✅

## Requisitos derivados da validação
1. Auto-attach por **regra multi-dimensão** (segmento+safra+canal+oferta), não só pattern de activity_name — a taxonomia nem sempre codifica a oferta.
2. Atribuição de **grupo por atributo** (ex.: `Oferta=Vibe`→variante) além de seleção manual.
3. **Estratificar comparações por canal** (WhatsApp 8,4% vs SMS 0,7% no mesmo grupo — misturar canais destrói a leitura).
4. Suporte a **experimento retroativo** (importar quebras históricas com data de início/fim).
5. Guardrails padrão dependem da [economia do negócio](dados.md#metas-e-cac) — lacuna a resolver.

## Decisões de UX confirmadas (2026-06-10)
| Pergunta | Resposta |
|----------|----------|
| Onde nasce a hipótese? | Dentro da própria tela de Experimentos |
| Cadência de revisão | Semanal |
| Card em 3 segundos | Delta de conv. + progresso de amostra + ICE badge + owner |
| Critério de "Validado" | Z-test bicaudal α=0,05, poder=80%; badge automático, confirmação manual do operador |
| Quem usa | Pablo (owner criador) + analistas (leitura e consulta) |

**Spec completa:** `calendar-estrategico/docs/SDD_EXPERIMENTOS_KANBAN.md`

## Relacionado
- [Diário-de-Bordo](legado.md#diário-de-bordo) · [Views-Performance](dados.md#views-performance) · [Evolução-Temporal](dados.md#evolução-temporal) · [Carrinho-Abandonado](#carrinho-abandonado) · [Upgrade](#upgrade) · [Vibe](#vibe) · [Orientador](legado.md#orientador) · [Experimento](#experimento) · [Decisões-Abertas](evolucao.md#decisões-abertas)


---

## Teste-Afinidade-MCC-vs-Generico

> **tags:** `estrategia, experimento, teste, holdout, mcc, vai-de-visa, rentabilizacao` | **tipo:** `estrategia` | **camada:** `estrategia` | **aliases:** `Teste SEG GEN, Teste A/B/C Vai de Visa, Afinidade MCC vs genérico, SEG-A SEG-B SEG-C` | **atualizado:** `2026-11-03` | **status:** `a-validar` | **fonte:** `aba "Estratégia de Ativação" da spec Vai de Visa (gestora, out/2026); decisões de 03/11/2026, operador`

# Teste: afinidade por MCC × oferta genérica

**Definição e propósito:** desenho de [experimento](#experimento) do [Vai de Visa](resultados-2.md#iniciativa-pool-de-ofertas-vai-de-visa) que responde duas perguntas ao mesmo tempo: (1) **escolher a oferta pela categoria em que o cliente compra vende mais do que mandar as mesmas ofertas para todos?** (2) **a campanha gera compra que não aconteceria de qualquer jeito?** O desenho pode ser reaproveitado por qualquer campanha de rentabilização com personalização.

> Status: desenho = `confirmado` pela spec; execução = `a-validar` (não iniciado).

## Hipótese

Clientes com afinidade de compra em uma categoria convertem mais quando recebem ofertas dessa categoria do que quando recebem ofertas genéricas (top Visa), e ambos convertem mais que um controle sem envio. Ver [Hipótese](#hipótese).

## Células

Separar a base em dois tipos de cliente:

| Tipo | Célula | % do grupo | Recebe | Pergunta |
|---|---|---:|---|---|
| **SEG** — tem afinidade (b1–b7) | **SEG-A** | 45% | 4 ofertas da sua categoria (filtradas pelo limite) | segmentar converte mais que o genérico? |
| | **SEG-B** | 45% | 4 ofertas genéricas | base de comparação da segmentação |
| | **SEG-C** | 10% | nada (controle) | a campanha gera venda incremental? |
| **GEN** — sem afinidade | **GEN-A** | 90% | 4 ofertas genéricas | o disparo genérico funciona para quem não tem perfil? |
| | **GEN-C** | 10% | nada (controle) | incrementalidade do genérico |

Exemplo sintético: a Maria compra muito em Moda (b1). Se cair em SEG-A, recebe Zattini, Hering, Puma, Riachuelo; em SEG-B, Nike, Movida, Decolar, oBoticário; em SEG-C, nada.

## Regras de entrada e desempate

- Moda, Saúde e Beleza, Pet (alta frequência): ≥ 2 compras em 6 meses. Eletrodomésticos, Eletrônicos, Brinquedos, Viagem (baixa): ≥ 2 compras em 12 meses.
- Mais de um grupo: mais compras na janela → maior gasto em 12 meses → prioridade (Moda 1, Saúde e Beleza 2, Viagem 3, Eletrodomésticos 4, Pet 5, Eletrônicos 6, Brinquedos 7).
- Sem grupo → Genérico. Casa, Presentes, Alimentos e Bebidas, Educação e Varejo não têm grupo próprio.

### Decisão `V1_12M_REC6M` (03/11/2026)

A [DE-MAPA_MCC](dados.md#de-mapa_mcc) só tem quantidade em 12 meses. Regra aplicada para os grupos de alta frequência: **≥ 2 compras em 12 meses E última compra na categoria ≤ 6 meses**. Gravar `CD_REGRA_GRUPO = 'V1_12M_REC6M'` em cada cliente.

**Por que o teste continua válido:** a comparação SEG-A × SEG-B acontece **dentro do mesmo grupo**, com sorteio aleatório. Uma regra de entrada menos precisa afeta as duas células igualmente: o teste não fica viesado, só pode medir um lift menor (afinidade diluída). Erro conservador, aceitável no MVP.

### Primeiro teste (safra `VDV_2026_11_BF`, decisão de 03/11/2026)

Só três grupos, com 3 ofertas cada: **MODA**, **SAUDE_BELEZA** e **FAMILIA_PRESENTES** (afinidade de Brinquedos); o resto cai no **GENERICO**. Vitrines em [DE-BRIEFING_OFERTAS_VISA](dados.md#de-briefing_ofertas_visa). FAMILIA_PRESENTES tende a ser pequeno (5,9% das contas compram Brinquedos): ler como indício.

### Sorteio implementado: duas camadas

| Camada | Código | Pergunta |
|---|---|---|
| Controle 10% | fixo `VDV_CONTROLE` | o programa gera uso a mais? (permite controle perene) |
| A × B 50/50 | por safra (`VDV_2026_11_BF`) | personalizar funciona neste tema? |

Se a decisão for sortear o controle a cada safra, basta trocar o código fixo pelo da safra. Implementação em [DE-VDV_APTOS](dados.md#de-vdv_aptos).

## Princípios de execução

1. **Sortear depois do filtro do canal principal** (e-mail). Se o sorteio incluir quem nunca poderia receber, o controle fica com gente inalcançável e o lift sai inflado.
2. **Semente fixa** sobre o CPF (ex.: `ABS(CHECKSUM(CPF)) % 100`), para a célula ser a mesma em toda execução.
3. **Congelar grupo e célula no envio.** A base é recalculada, a célula de quem já entrou no teste não.
4. SMS/WhatsApp entram como reforço **dentro das mesmas células**, nunca como célula nova.

## KPIs

| KPI | Definição | Fonte |
|---|---|---|
| Abertura e clique | aberturas e cliques ÷ envios (SEG-A, SEG-B, GEN-A) | Marketing Cloud |
| Conversão na oferta | % de clientes com compra no estabelecimento da oferta até 30 dias após o envio | `DE_VDV_RESPOSTA` |
| Conversão na categoria | % com compra em MCC da categoria até 30 dias | `DE_VDV_RESPOSTA` |
| Gasto incremental | gasto médio da célula − gasto médio do controle | `DE_VDV_RESPOSTA` |
| Lift da segmentação | conversão SEG-A − conversão SEG-B, por grupo | `DE_VDV_RESPOSTA` |
| Descadastro | opt-outs ÷ envios | Marketing Cloud |

Janela de conversão: 30 dias após o envio. Na Black Friday todo mundo compra mais, por isso o controle é obrigatório.

## Limites da medição

- **Nome do estabelecimento é frágil:** compra online pode vir como gateway (`PAGSEGURO*`, `MP*`), e a conversão na oferta sai subestimada justamente no canal das ofertas. A conversão na categoria (por [MCC](#mcc)) é mais robusta.
- **Caminho melhor:** na [Copa 2026](resultados-2.md#iniciativa-copa-2026) a fonte da verdade foi o BI da Visa (`copa_visa_daily`). Pedir à Visa dado de resgate por oferta/cupom no mesmo formato resolveria a atribuição.
- **Grupos pequenos** (b3, b4, b5) podem não ter volume para ler incrementalidade com 10% de controle. Ler o lift desses grupos como indício.
- **Grupo b2 inflado por farmácia** (MCC misto): o lift de b2 mede mais farmácia que beleza.

## Safras e acompanhamento

- Campanha **perene**; cada tema é uma safra (`ID_SAFRA`, ex.: `VDV_2026_11_BF`). Grupo e célula congelados por safra em [DE-VDV_ENVIO](dados.md#de-vdv_envio).
- **Leituras:** D+7 e D+15 (acompanhamento) e **D+30 (oficial)**, sempre pela célula sorteada.
- **Saídas da IN:** relatório agregado (safra × grupo × célula) e, proposto, resultado por cliente de volta no MC (`VDV_RESULTADO`) para virar ação (repique, não repetir oferta, Viagem → seguro).
- **Safras sobrepostas (proposta):** leitura por safra atribui a compra à **última safra recebida**; leitura do programa compara recebeu × controle perene **por mês**.

## Regra de decisão (proposta)

Segmentar nas próximas ondas quando SEG-A > SEG-B com significância nos grupos com volume (b1, b2), e SEG-A/SEG-B > SEG-C. Sem lift: manter genérico e reavaliar o critério de afinidade. Usar o calculador de significância do Diário de Bordo (aba Experimentos do GaaS).

## Relacionado

[Experimento](#experimento) · [Hipótese](#hipótese) · [Sistema-de-Experimentacao-Referencias](#sistema-de-experimentacao-referencias) · [Iniciativa-Pool-de-Ofertas-Vai-de-Visa](resultados-2.md#iniciativa-pool-de-ofertas-vai-de-visa) · [DE-VDV_APTOS](dados.md#de-vdv_aptos) · [MCC](#mcc) · [Incentivo-ao-Uso](resultados-3.md#incentivo-ao-uso)


---

## Convenções-do-Vault

> **tags:** `convencoes, editorial, contexto-ia` | **tipo:** `referencia` | **camada:** `meta` | **atualizado:** `2026-10-02` | **status:** `confirmado` | **fonte:** `operador`

# Convenções do Vault

**Definição:** regras de escrita, localização e revisão do conhecimento canônico de Growth para pessoas e IAs.

## Local de autoria e publicação

Editar no vault Obsidian/OneDrive. O GaaS consulta uma projeção pesquisável; não é uma segunda fonte de autoria dessas notas. Depois de editar, recompilar `docs/AFINZ_GAAS_ONTOLOGY.md` com `python scripts/bundle_vault.py` e sincronizar a biblioteca pelo fluxo administrativo. Conteúdo operacional da Fábrica tem histórico próprio, conforme [Fontes-e-Proveniencia-Growth](#fontes-e-proveniencia-growth).

## Metadados e profundidade

Manter `tags`, `tipo`, `camada`, `atualizado`, `status` e `fonte`. Usar tipos existentes: conceito, dimensão, entidade, operação, estratégia, evidência, evolução, engenharia, MOC e referência. Preservar a grafia técnica já adotada no frontmatter. Não inventar fonte ou responsável para completar o cabeçalho.

`confirmado`, `inferência` e `a-validar` indicam confiança do conteúdo. Quando há estados mistos, explicitar por seção. Atualização editorial, validação de evidência, vigência e sincronização são datas diferentes.

[Padrao-Editorial-Enciclopedia](#padrao-editorial-enciclopedia) substitui a preferência antiga por notas sempre curtas: cada nota deve ter profundidade suficiente para seu assunto, sem lacunas implícitas e com links para detalhamento. Uma regra mantém um lugar canônico; sua aplicação pode aparecer em outras notas com referência.

## Links, arquivos e exemplos

- Usar wikilinks com alvo único e alias legível quando útil.
- Quando existem vários `README.md`, usar caminho completo relativo ao vault.
- Número vivo exige snapshot e fonte; exemplo inventado deve ser identificado como sintético.
- Preservar seções históricas datadas, sem apresentá-las como configuração atual.
- Anexos não Markdown permanecem locais; explicar o que contêm na nota.
- `99-Templates` não é publicado pelo reader. Por isso estas convenções têm endereço canônico em `09-Inteligencia-IA`.

## Revisão e recuperação

Auditar links e cobertura com `python scripts/audit_vault_context.py`. A detecção de blocos por títulos é uma heurística para triagem, não uma avaliação semântica automática. Registrar conflitos e dono a confirmar. Evitar apagar histórico para resolver contradição; mostrar qual contrato passou a valer e a evidência.

## Relacionado

- [Enciclopedia-Servicos-Growth](#enciclopedia-servicos-growth) · [Padrao-Editorial-Enciclopedia](#padrao-editorial-enciclopedia)
- [Runbook-Vault-Vivo](ia.md#runbook-vault-vivo) · [Changelog-do-Vault](evolucao.md#changelog-do-vault) · [Fontes-e-Proveniencia-Growth](#fontes-e-proveniencia-growth)


---

## Estrategia-de-Contexto

> **tags:** `ia,contexto,rag,arquitetura,adr` | **tipo:** `referencia` | **camada:** `evolucao` | **atualizado:** `2026-06-20` | **status:** `confirmado` | **fonte:** `ADR-001`

# Estratégia de Contexto

**Definição:** a regra de **quando carregar a ontologia inteira vs. recuperar seletivamente**
(RAG / sub-índices). Decisão **D-2** do [ADR-001](engenharia.md#adr-001). Evita tanto RAG prematuro (complexidade
e risco de recall miss) quanto degradação silenciosa de recall em contexto longo.

## Por que existe um limite
A pesquisa (2026-06-20) mostra que **markdown-em-contexto (LLM-wiki) vence RAG até
~150–200k tokens**; abaixo disso, RAG só adiciona complexidade. Acima, o recall cai
("context cliff") e o custo de token explode.

> 📊 Snapshot 2026-06-20 — `AFINZ_GAAS_ONTOLOGY.md`: 4.755 linhas / 272.878 caracteres
> (≈ **75–90k tokens** estimados). **Ainda na zona "carrega tudo"**, perto do gatilho.

## Gatilho de migração (decisão amarrada a número, não a opinião)
| Tamanho da ontologia | Ação |
|---|---|
| **< 120k tokens** | Carrega total. Garantir **split por header `##`** (maior ganho barato de qualidade). |
| **120k – 180k tokens** | Compilar **sub-índices por camada** — carregar só as camadas relevantes à query. |
| **> 180k tokens** | Migrar para **recuperação seletiva / RAG** sobre o vault (chunking por header, ~512 tokens). |

## Implementação (ver checklist no [ADR-001](engenharia.md#adr-001))
- `scripts/bundle_vault.py` deve **imprimir a contagem de tokens** ao final e alertar se cruzar 120k.
- Manter headers de seção (`##`) na ontologia → base do futuro chunking estruturado.

## Relacionado
- [ADR-001](engenharia.md#adr-001) · [Roteamento-de-Memoria](#roteamento-de-memoria) · [Ontologia-v2](#ontologia-v2) · [Vault-como-Contexto](#vault-como-contexto)


---

## Fontes-e-Proveniencia-Growth

> **tags:** `fontes, proveniencia, contexto-ia, governanca` | **tipo:** `referencia` | **camada:** `negocio` | **atualizado:** `2026-10-02` | **status:** `confirmado` | **fonte:** `operador`

# Fontes e Proveniência de Growth

**Definição:** regras de leitura para reconciliar conhecimento do vault, configuração do GaaS, evidência de plataforma e propostas, sem transformar ausência ou conflito em certeza.

## Cada fonte responde a uma pergunta

| Pergunta | Evidência adequada | Limite |
|---|---|---|
| Qual benefício pode ser comunicado? | fonte oficial vigente, condições e validação interna rastreável | página antiga ou peça histórica não garante vigência |
| Qual regra está cadastrada na Fábrica? | contextos e guardrails ativos no Supabase | estar `allowed` não prova que a evidência comercial é suficiente |
| Qual comportamento existe no app? | código da versão publicada e verificação do comportamento | arquivo de worktree não prova deploy |
| O que o SFMC executa? | DE, template, jornada e testes da BU aplicável | Supabase e prévia local não certificam SFMC |
| Qual resultado ocorreu? | fonte operacional, granularidade, janela e qualidade verificadas | falta de registro não significa zero |
| O que uma decisão significa? | nota canônica e registro datado da decisão | hipótese e roadmap não são implementação |

O vault explica e preserva conhecimento. A projeção no GaaS disponibiliza as notas. A Fábrica conserva registros operacionais editáveis com versões próprias. Quando esses materiais divergem, registrar o conflito e conferir a fonte que responde à pergunta; não sobrescrever silenciosamente a decisão operacional a partir de uma nota antiga.

## Datas que não podem ser confundidas

- `atualizado`: revisão editorial da nota.
- Data da evidência: quando fonte ou configuração foi consultada.
- Vigência: janela na qual uma condição se aplica.
- Sincronização: quando a cópia entrou no GaaS.
- Certificação: quando o teste operacional foi aprovado para um recorte e versão.

Atualizar ou sincronizar uma nota não revalida automaticamente benefícios. `valid_to` vazio significa fim desconhecido, não benefício permanente.

## Procedimento para uma IA

1. Fixar objetivo, produto, público, canal e data de corte.
2. Ler a nota de entrada e as referências que sustentam a regra relevante.
3. Separar fatos observados, histórico, interpretação e proposta.
4. Confrontar plataforma/código atual quando a tarefa depende do estado de execução.
5. Nomear informação ausente e o que ela impede concluir.
6. Entregar mudanças e validação no escopo pedido; registrar fonte e versão.

Não incluir CPF, e-mail de cliente, segredos ou dados de teste identificáveis em notas e pacotes de contexto compartilhados. Usar exemplos sintéticos identificados como tais.

## Conflitos registrados em 02/10/2026

- **Audiência SFMC:** skill antiga descrevia CPF repetido; nota corrigida em agosto descreve linha única e avanço in-place. A nota é a referência documental atual; configuração da DE deve ser conferida antes de carga real.
- **CSV:** implementação Plurix antiga dizia UTF-8 com BOM; contrato de setembro exige UTF-8 sem BOM. O contrato mais recente está em [Emails-Dinamicos-SFMC](operacao.md#emails-dinamicos-sfmc).
- **38 × 36 campos:** prosa histórica descreve 38 campos; exportação governada permanece de 36 colunas. Não acrescentar colunas com base nessa contagem.
- **Você Bem:** guardrail ativo de cobertura familiar está `allowed`, mas a evidência é apenas texto de peça antiga; outro guardrail exige revisão do percentual/cobertura. O cadastro é confirmado, a autorização comercial completa permanece pendente.
- **Prazo +amigo:** referência de produto de setembro permite prazo condicionado, enquanto [Motor-de-Briefing-Automatico](#motor-de-briefing-automatico) mantém bloqueio mais amplo. Registrar divergência e validar escopo/fonte vigente; não liberar claim por inferência.
- **Redes comerciais × assinaturas:** ficha menciona oito redes comerciais; operação histórica governa seis assinaturas. Compre Mais e Superpão possuem bloqueio de marca no GaaS e devem comunicar como +amigo no escopo registrado.

## Relacionado

- [Auditoria-Contexto-Vault-2026-10-02](ia.md#auditoria-contexto-vault-2026-10-02) · [Padrao-Editorial-Enciclopedia](#padrao-editorial-enciclopedia)
- [Ficha-de-Produto-Guia](operacao.md#ficha-de-produto-guia) · [GaaS-Vault-Library](engenharia.md#gaas-vault-library) · [Conflitos-de-Fonte-Produtos-2026-08](evolucao.md#conflitos-de-fonte-produtos-2026-08)


---

## Inteligencia-Compartilhada-GaaS

> **tags:** `ia, contexto, colaboracao, wiki, governanca` | **tipo:** `operacao` | **camada:** `evolucao` | **atualizado:** `2026-10-22` | **status:** `confirmado` | **fonte:** `codigo-gaas-e-validacao-local`

# Inteligência compartilhada com IA no GaaS

## Objetivo

Dar ao time uma base comum para trabalhar com suas IAs: conhecer a operação,
entender produtos e métricas, preparar entregas, investigar resultados e devolver
propostas rastreáveis. O Obsidian no computador de Pablo continua canônico.

## Onde encontrar

**Análise → Aprendizado e Memória → Wiki → Trabalhar com IA**.

As seis abas permanecem: Fila, Wiki, Report Live, Apostas, Outcomes e **Registros**.
Registros é o novo nome de Memória; a rota técnica `section=memory` continua válida.
A Wiki reúne contexto; Registros diferencia curadoria do vault de aprendizado
validado por resultado. Uma nota antiga não prova vigência, execução ou causalidade.

## Preparar contexto

O padrão é incluir todas as notas publicadas elegíveis. O ZIP oferece notas com
suas pastas, datas e metadados, índice, guia de entrada, mapa do sistema, instruções
para IA, ontologia unificada, divisões por assunto e modelo de contribuição.
O manifesto identifica pacote, hashes, fontes, exclusões e referências não resolvidas.
O usuário pode informar uma tarefa para orientar a leitura sem perder o acervo completo.

Uma comparação opcional com a pasta do computador distingue notas só locais,
só publicadas e conteúdos diferentes. A comparação não sincroniza a pasta.
Pacote completo da projeção não significa conter arquivos locais não sincronizados.
Anexos binários não publicados no leitor não acompanham o ZIP; esta exclusão é explícita.

## Dados e publicações

Notas que descrevem tabelas não exportam seus registros. Resultados agregados vivos
são opcionais e exigem escolher frente, mês e filtros antes da consulta. O cálculo
reutiliza o contrato analítico da Wiki, com fonte, data e limitações.
Total B2C e contribuições por origem não devem ser somados. CPA de plataforma não
é CAC de cartão; valores ausentes permanecem ausentes.

É possível incluir referência à publicação vigente do Report Live: versão, período
e links. Isso não copia os arquivos de apresentação nem aciona publicação.

## Contribuir e revisar

1. O integrante baixa o pacote, escolhe sua IA e trabalha no ambiente externo.
2. A IA devolve o modelo `gaas-knowledge-contribution/1`, com pacote de origem,
   título, justificativa, fontes e Markdown completo por nota.
3. O integrante envia o JSON na Wiki. O sistema confere caminho, hash-base,
   vínculo com o pacote, tamanho, duplicidade e versão publicada atual.
4. A contribuição entra na fila. Apenas Pablo pode aprovar para incorporação local,
   solicitar ajustes ou rejeitar. A comparação mostra fonte atual e proposta.
5. Após aprovar, Pablo baixa as alterações para sua LLM, revisa os hashes-base,
   atualiza o vault no computador e executa `python scripts/bundle_vault.py`.
6. Pablo sincroniza o vault no GaaS e usa **Verificar incorporação**. A confirmação
   exige todos os hashes propostos em uma sincronização concluída após a aprovação.

**Aprovação não altera o vault e não equivale a publicação.** Ajustes são enviados
como nova contribuição, preservando a proposta anterior e o histórico de revisão.

## Acesso e limites

Pacotes ficam preservados em armazenamento privado para a equipe autenticada.
O aplicativo não envia conteúdo automaticamente a provedores de IA. Conteúdo com
possíveis credenciais ou CPFs é excluído preventivamente; revisar o material antes
de compartilhar continua necessário. Não incluir dados identificáveis de clientes.

O fluxo não edita o Obsidian remotamente e não promove propostas da IA a regras
vigentes ou aprendizados validados. A versão canônica continua sob controle de Pablo.

## Implementação e verificação

Contrato técnico em `docs/architecture/learning-intelligence-exchange.md`, no app.
Migration `20261022161253_knowledge_exchange.sql`: pacotes, contribuições, revisão,
auditoria, snapshot e bucket privado. Testes locais cobrem mais de 400 notas,
hashes, caminhos, permissões, duplicidade, imutabilidade e confirmação por sync.
Publicação concluída em 22/10/2026: PR #52 integrado à main como c9300b0.
CI de integração e deploy GitHub Pages concluídos com sucesso; 500 testes locais
passaram, o gate TypeScript não encontrou erros novos e o build foi concluído.
A verificação HTTP pública retornou 200 para HTML e bundles e confirmou Registros,
Trabalhar com IA, contratos de pacote e contribuições no código publicado.
O pacote gerado a partir do snapshot vivo incluiu as 411 notas, com 429 arquivos
e hashes conferidos. Anexos binários seguem excluídos. A sessão autenticada do
navegador encerrou durante a conferência; não foi declarada validação visual
autenticada final. Pipeline: https://github.com/GrowthAfinz/GaaS-Framework-Afinz/actions/runs/39820528996.

## Relacionado

- [Enciclopedia-Servicos-Growth](#enciclopedia-servicos-growth) · [GaaS-Vault-Library](engenharia.md#gaas-vault-library)
- [Vault-como-Contexto](#vault-como-contexto) · [Fontes-e-Proveniencia-Growth](#fontes-e-proveniencia-growth)
- [Roteamento-de-Memoria](#roteamento-de-memoria) · [Resultados-Evolucao-e-Retrospectivas](resultados-1.md#resultados-evolucao-e-retrospectivas)


---

## MOC-Inteligencia-IA

> **tags:** `moc,ia` | **tipo:** `moc` | **camada:** `indice` | **atualizado:** `2026-10-31` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# MOC — Inteligência & IA



A camada que transforma o vault e os dados em **inteligência operável por agentes de IA**.



## Contexto para pessoas novas e IAs



- [Enciclopedia-Servicos-Growth](#enciclopedia-servicos-growth) — entrada para aprender e executar

- [Padrao-Editorial-Enciclopedia](#padrao-editorial-enciclopedia) — profundidade por tipo de nota

- [Fontes-e-Proveniencia-Growth](#fontes-e-proveniencia-growth) — evidência, datas e conflitos

- [Auditoria-Contexto-Vault-2026-10-02](ia.md#auditoria-contexto-vault-2026-10-02) — inventário e lacunas

- [Convenções-do-Vault](#convenções-do-vault) — autoria e publicação



## O modelo

- [Vault-como-Contexto](#vault-como-contexto) — o vault como contexto persistente para humanos + IAs

- [Obsidian-MCP](ia.md#obsidian-mcp) — como uma IA opera o próprio vault



## Conectores e dados

- [MCP-Visão-Geral](ia.md#mcp-visão-geral) — Supabase, Google Ads, Meta Ads, GA4

- [GA4-MCP-Google-Analytics](ia.md#ga4-mcp-google-analytics) — como pedir análises ao GA4, armadilhas e snapshot da loja de seguros

- [Runbook-Vault-Vivo](ia.md#runbook-vault-vivo) — manter os snapshots vivos via SQL



## Aplicação

- [Skills-do-Projeto](ia.md#skills-do-projeto) — as skills que já rodam a operação

- [Agentes-e-Workflows](ia.md#agentes-e-workflows) — padrões de uso (análise → síntese → entrega)

- [Handoff Codex-Claude — Funil Meta](Handoff-Codex-Claude-Funil-Meta.txt) — protocolo e evidências da troca assíncrona via TXT (jul/2026)

- [Report-Live-Enciclopedia](engenharia.md#report-live-enciclopedia) — arquitetura e evolução consolidadas do Report Live.

- [Report-Live-V2-Loop-de-Aprendizado-e-Memoria](ia.md#report-live-v2-loop-de-aprendizado-e-memoria) — direção futura para contexto, evidência e memória revisável.



## Memória e aprendizado

- [Loop-de-Aprendizado-Growth](ia.md#loop-de-aprendizado-growth) — produto operacional vigente: feed sistêmico, apostas, outcomes, memória versionada e Report Live como output.

- [Report-Live-Loop-de-Outcome](ia.md#report-live-loop-de-outcome) — o mínimo viável antes da V2: 43 recomendações emitidas, 0 verificadas; três mudanças sem tabela nova (set/2026)

- [Serie-Historica-Aquisicao-Mar-Ago-2026](dados.md#serie-historica-aquisicao-mar-ago-2026) — a faixa histórica que serve de memória numérica à régua de comparação
- [Experimento-Agentes-Wiki-2026-10-31](ia.md#experimento-agentes-wiki-2026-10-31): primeiro teste dos agentes por região (ADM, Editor, especialistas) e em que etapa ele está



## Relacionado

- [🏠 HOME](#-home) · [Pipeline-ML](legado.md#pipeline-ml) · [Orquestrador](#orquestrador)



- [Agente-Report-Live-Handoff](ia.md#agente-report-live-handoff) — runbook p/ qualquer IA operar o Report Live como LLM (skip_llm; jul/2026)



- [Revisao-Claude-Report-Live-V4](ia.md#revisao-claude-report-live-v4) — revisão técnica da V4 do Codex: arquitetura aprovada, 16/17 views com fórmulas mortas, correções mandatórias (jul/2026)


## Biblioteca de skills do time

[Catalogo-de-Skills](ia.md#catalogo-de-skills) reúne as skills próprias do time, com casos de uso, tamanho, estimativa de tokens e gestão pelo GitHub. Acesso no GaaS: Aprendizado e Memória → Trabalhar com IA → Skills.


## Motor de agentes e evolução do Loop · 31/10/2026

- [Motor-de-Agentes-Loop-de-Memoria-2026-10](ia.md#motor-de-agentes-loop-de-memoria-2026-10): direção macro, ciclo completo e evolução dos testes.
- [Backlog-Desenvolvimento-GaaS-Loop-2026-10](engenharia.md#backlog-desenvolvimento-gaas-loop-2026-10): tarefas priorizadas e critérios, sem antecipar reformas das telas.


## Spec Driven Development no GaaS

- [Como-Trabalhar-SDD-no-GaaS](engenharia.md#como-trabalhar-sdd-no-gaas): pesquisa, método proposto, template e exemplo para transformar temas em entregas verificáveis.


---

## Padrao-Editorial-Enciclopedia

> **tags:** `editorial, contexto-ia, onboarding, governanca` | **tipo:** `referencia` | **camada:** `meta` | **atualizado:** `2026-10-02` | **status:** `confirmado` | **fonte:** `operador`

# Padrão Editorial da Enciclopédia

**Definição:** contrato de profundidade das notas para ensinar pessoas novas e fornecer contexto verificável a IAs sobre os serviços internos de Growth.

## Propósito e público

Cada nota deve ser compreensível por si só e apontar para as fontes de aprofundamento. O leitor não precisa conhecer siglas, decisões antigas ou a estrutura do repositório. Explicar uma sigla no primeiro uso e distinguir conceitos próximos. Profundidade significa responder às dúvidas relevantes, com evidência; quantidade de texto não é critério de qualidade.

## Estrutura comum

1. Definição e propósito: o que é, qual problema resolve e quando usar.
2. Contexto: público, produto, lugar no fluxo e conceitos próximos.
3. Funcionamento: entradas, saídas, passos, dependências e responsabilidades.
4. Regras: escopo, condições, exceções, restrições e consequências.
5. Aplicação: exemplo datado ou sintético, checklist e recuperação de erros.
6. Medição: critério de conclusão e resultado, quando aplicável.
7. Evidências: fonte, data de corte, versão e o que foi de fato verificado.
8. Lacunas: o que falta, efeito no trabalho, fonte necessária e dono a confirmar.
9. Relações: pré-requisitos, regras usadas, exemplos e próximo passo por wikilink.

## Blocos específicos por tipo

| Tipo | Conteúdo indispensável |
|---|---|
| Produto | identidade, valor, público, benefício/condição, claims, objeções, tarifas a validar, marca e CTA |
| Serviço/processo | quando usar, entradas, entrega, procedimento, dono, critérios de conclusão e erros |
| Conceito/dimensão | definição, diferenças, exemplos, uso nos sistemas e limites |
| Entidade de dados | grão, chaves, origem, atualização, campos, joins, ausência e acesso |
| Engenharia | contrato, componentes, versão, operação, falhas e evidência de deploy |
| Performance/evidência | janela, cobertura, método, resultado, limitações e interpretação |
| Estratégia | decisão, premissas, hipótese, alternativas, teste e estado de implementação |

## Proveniência e atualização

Preservar o frontmatter existente e a compatibilidade do leitor. `atualizado` representa a revisão editorial. Acrescentar `revisado_em`, `publico` e outros campos apenas quando úteis, sem inventar responsável ou data de validação. Estados mistos devem ser explicados por seção: uma nota pode conter contrato confirmado e pendência comercial.

Uma regra tem um lugar canônico; outras notas explicam sua aplicação e apontam para ele. Histórico fica identificado como histórico. Não adicionar uma conclusão de “confirmado” a toda a nota só porque o texto foi revisado.

## Como registrar lacunas

Formato recomendado: **questão → impacto → evidência necessária → responsável ou dono a confirmar**. Exemplo: “Mensalidade aplicável à rede não validada → impede citar valor → contrato/tabela vigente → Produto, dono nominal a confirmar”. Informação faltante não vira zero, aprovação, gratuidade ou promessa.

## Critérios de qualidade

- Uma pessoa nova consegue explicar o assunto e localizar o próximo passo.
- Uma IA consegue distinguir regra vigente, exemplo, proposta e pendência.
- Um procedimento identifica entradas e condições de conclusão.
- Todo número vivo tem data e origem; toda alegação comercial tem escopo/condição.
- Links novos resolvem para alvo único; anexos permanecem identificados como arquivos locais.
- Nenhuma nota fabrica evidência para preencher uma seção.

## Relacionado

- [Enciclopedia-Servicos-Growth](#enciclopedia-servicos-growth) · [Fontes-e-Proveniencia-Growth](#fontes-e-proveniencia-growth)
- [Runbook-Vault-Vivo](ia.md#runbook-vault-vivo) · [Changelog-do-Vault](evolucao.md#changelog-do-vault)


---

## Roteamento-de-Memoria

> **tags:** `ia,memoria,arquitetura,adr` | **tipo:** `referencia` | **camada:** `evolucao` | **atualizado:** `2026-06-20` | **status:** `confirmado` | **fonte:** `ADR-001`

# Roteamento de Memória

**Definição:** a regra que diz **onde cada tipo de conhecimento mora** no segundo cérebro,
para que nenhum fato viva em dois lugares (evita duplicação e drift). Decisão **D-1** do
[ADR-001 — Arquitetura do Segundo Cérebro](engenharia.md#adr-001), validada pela literatura de *Cognitive
Architectures for Language Agents* (working / episodic / semantic memory).

## Os três níveis
| Nível | É no projeto | Guarda | Característica |
|---|---|---|---|
| **Working memory** | `CLAUDE.md` + memory tool | Estado de sessão, foco atual, decisões recentes | Volátil, sempre carregado |
| **Memória semântica** | Vault Obsidian (notas) | Conceitos estáveis, definições, regras | 1 nota = 1 conceito, durável |
| **Memória episódica** | Snapshots datados (`> 📊 Snapshot AAAA-MM-DD`) | Números reais com timestamp | Dado vivo, reidratável ([Runbook-Vault-Vivo](ia.md#runbook-vault-vivo)) |
| **Contexto carregado** | [Ontologia-v2](#ontologia-v2) / `AFINZ_GAAS_ONTOLOGY.md` | Compilação seletiva da semântica p/ a IA | Derivado — **nunca** é fonte |

## Decision tree (para humano e IA, ao escrever um fato)
```
O fato é um número que muda no tempo (CAC, conversão, spend)?
  → SIM: snapshot datado na nota relevante (episódica). NUNCA no CLAUDE.md.
  → NÃO ↓
O fato é um conceito/definição/regra estável da operação?
  → SIM: nota no vault (semântica). 1 conceito por nota.
  → NÃO ↓
O fato só importa para a sessão/tarefa atual?
  → SIM: CLAUDE.md / memory (working). Expira.
```

## Por que importa
Sem esta regra, a IA recebe informação contraditória (número velho no CLAUDE.md vs. snapshot
novo na nota) e o corpus incha. Com ela, o write-back da IA é disciplinado — pré-requisito
para o loop de retroalimentação ([Vault-como-Contexto](#vault-como-contexto)).

## Relacionado
- [ADR-001](engenharia.md#adr-001) · [Vault-como-Contexto](#vault-como-contexto) · [Runbook-Vault-Vivo](ia.md#runbook-vault-vivo) · [Estrategia-de-Contexto](#estrategia-de-contexto) · [Governança-de-Dados](evolucao.md#governança-de-dados)


---

## Vault-como-Contexto

> **tags:** `ia,contexto,metodo` | **tipo:** `estrategia` | **camada:** `evolucao` | **atualizado:** `2026-06-08` | **status:** `confirmado` | **fonte:** `gaas-supabase`

# Vault como Contexto

**Definição:** o modelo em que este vault Obsidian é o **contexto persistente** que humanos e IAs leem antes de agir — em vez de reexplicar a operação a cada conversa, a IA lê, raciocina e escreve dentro deste conhecimento estruturado.

## Por que funciona aqui
O vault já tem os ingredientes que tornam um corpus legível por agente:
- **Markdown plano** + 1 nota = 1 conceito → recuperável e citável.
- **Frontmatter** (`tipo/camada/status`) → a IA filtra por relevância.
- **Status de confiança** (`confirmado|inferência|a-validar`) → a IA sabe o que é dado duro vs. dedução.
- **Snapshots datados** → a IA não trata número velho como verdade eterna (ver [Runbook-Vault-Vivo](ia.md#runbook-vault-vivo)).
- **Wikilinks densos** → a IA segue o raciocínio (CAC → CAC-Ótimo → Função-Objetivo → Orquestrador).

## O loop que destrava os "70%"
`dados vivos (Supabase) → SQL → reidrata snapshot no vault → IA lê contexto fresco → gera insight/ação`.
O elo que falta automatizar é a reidratação — ver [Runbook-Vault-Vivo](ia.md#runbook-vault-vivo). As [Skills-do-Projeto](ia.md#skills-do-projeto) já consomem dados; fazê-las lerem o vault como ontologia torna as análises consistentes.

## Relacionado
- [MCP-Visão-Geral](ia.md#mcp-visão-geral) · [Obsidian-MCP](ia.md#obsidian-mcp) · [Runbook-Vault-Vivo](ia.md#runbook-vault-vivo) · [Skills-do-Projeto](ia.md#skills-do-projeto) · [Ontologia-v2](#ontologia-v2)


---

## README

# Afinz CRM & Mídia — Bíblia de Contexto

Vault Obsidian com o conhecimento consolidado da operação de **aquisição de cartão via CRM e mídia paga** da Afinz (sistema **GaaS**).

## Como usar
1. Abra esta pasta no Obsidian: *Open folder as vault*.
2. Comece por **[🏠 HOME](#-home)** (pasta `00-Indice`).
3. Navegue clicando nos links `[ ](#-)`. Use `Ctrl+O` para pular entre notas e o **Grafo** para ver as conexões.

## Convenções
- **1 nota = 1 conceito.** Notas curtas e linkadas.
- **Frontmatter YAML** em toda nota (`tipo`, `camada`, `status`, `atualizado`).
- **Status de confiança:** `confirmado` (dado duro), `inferência` (dedução), `a-validar` (pendente).
- **Snapshots datados:** números reais levam `> 📊 Snapshot 2026-06-08` — dado vivo muda.

## Camadas (pastas)
| Pasta | Conteúdo |
|---|---|
| `00-Indice` | Mapas de conteúdo (MOCs), porta de entrada |
| `01-Conceitos` | Dicionário vivo (CAC, Jornada, Safra, Template, Experimento...) |
| `02-Entidades-Dados` | Tabelas do Supabase e relações |
| `03-Dimensoes` | Canais, Segmentos, Ofertas, Parceiros, BUs (com dados reais) |
| `04-Operacao` | Como o GaaS funciona (9 áreas, ingestão, taxonomia) |
| `05-Estrategia` | Função objetivo, CAC ótimo, plano do diretor, roadmap |
| `06-Performance` | Evidências reais (CAC por canal, funil, recorrência) |
| `07-Evolucao` | Ontologia v2, orquestrador, decisões abertas/tomadas, governança |
| `08-Engenharia` | *(gerada via Claude Code)* arquitetura, código, hooks, ML |
| `09-Inteligencia-IA` | Vault como contexto, MCP, skills, agentes, runbook de vault vivo |
| `99-Templates` | Template de nota + convenções do vault |

> **Mídia paga** atravessa as camadas (conceitos, dimensões, entidades, performance) — ponto de entrada em [MOC-Midia-Paga](#moc-midia-paga).

## Fonte dos dados
Supabase projeto **"GaaS Framework Afinz"** (`mipiwxadnpwtcgfcedym`), tabela `activities` e correlatas. Período de referência: jan/2025 – jun/2026.


---
