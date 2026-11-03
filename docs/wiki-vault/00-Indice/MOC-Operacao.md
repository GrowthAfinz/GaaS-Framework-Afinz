---
tags: [moc]
tipo: moc
camada: indice
atualizado: 2026-11-03
status: confirmado
fonte: gaas-supabase
---

# MOC — Operação (como o GaaS funciona)

## Serviços e aprendizagem

- [[Enciclopedia-Servicos-Growth]] — entrada por tarefas
- [[Servico-Emails-Dinamicos]] — entradas, entrega e critérios de conclusão
- [[Ficha-de-Produto-Guia]] → [[Briefing-e-Regua-de-Aquisicao]] — contexto antes da produção

## Plataforma de disparo
- [[SFMC-Salesforce-Marketing-Cloud]]
- [[Fabrica-de-Emails-GaaS]] — workspace editorial e de governança de réguas, briefings, ativos, templates e plano de comunicação
- [[Emails-Dinamicos-SFMC]] — motor de e-mail único por Content Builder + AMPscript, 1 linha de CSV = 1 campanha
- [[Emails-Dinamicos-Plurix]] — implementação autocontida da BU Plurix: 1 e-mail servindo 6 bandeiras, AMPscript verbatim, QA e log de decisões
- [[Emails-Dinamicos-Vai-de-Visa]] — e-mail e LP com 4 ofertas por CPF (afinidade MCC + limite), reaproveitando o padrão do pool Plurix V10
- [[SFMC-Query-Studio-e-SQL]] — armadilhas do Query Studio e padrões de SQL por CPF
- [[MOC-SFMC-DEs-e-Automations]] — mapa de relacionamento das DEs e Automations úteis
- [[Bandeiras-Plurix]] — as 6 assinaturas do recorte operacional, distintas da lista comercial de redes; assets por bandeira e convenção de `NM_PRODUTO_INTERNO`

## Atribuição e tracking
- [[AppsFlyer-Tracking-CRM]] — governança de links, eventos de conversão e deep link

## Dados e ingestão
- [[Supabase-Visão-Geral]]
- [[Taxonomia-Activity-Name]]

## Legado (foto de jun/2026)

Notas que ficaram fora da estrutura nova da wiki em 29/10/2026. Estão em `98-Legado/`, com o conteúdo original preservado.

### A plataforma
- [[O-que-é-o-GaaS]] — visão geral
- [[GaaS-9-Áreas]] — as abas funcionais
- [[Pilar-Automação-por-Histórico]] — o princípio fundador
- [[Orientador]] — motor de recomendação por score
- [[Mídia-Analytics]] — correlação investimento→cartão

### As abas (uma a uma)
- [[Launch-Planner]] · [[Diário-de-Bordo]] · [[Jornada-Disparos]] · [[Resultados]]
- [[Relatório]] · [[Originação-B2C]] · [[Explorador-Avançado]] · [[Configurações]]

### Dados e ingestão
- [[Ingestão-de-Dados]] — o updater com revisão humana

### Dimensões (com dados reais)
- [[Canais]] · [[Segmentos]] · [[Ofertas]] · [[Parceiros]] · [[BUs]]
- [[Perfis-de-Crédito]] · [[Produtos]] · [[Subgrupos]]

### Custos
- [[Custos-e-Investimento]]

## Relacionado
- [[🏠 HOME]]
