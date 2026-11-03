---
tags: [engenharia, gaas, moc]
tipo: engenharia
camada: codigo
atualizado: 2026-10-31
status: confirmado
fonte: codigo-gaas
---

# 🛠️ MOC — Engenharia (GaaS)

Map of Content da **camada de engenharia, código e arquitetura** do GaaS (Growth as a Service) — o dashboard React/TS de inteligência de campanhas da Afinz CRM & Mídia. A camada de **dados/negócio** é coberta por outras notas (linkadas como ganchos).

← Voltar para [[🏠 HOME]]

## Enciclopédia e contratos de contexto

- [[Evolucao-Cronologica-GaaS-2026-10|Evolução cronológica do GaaS]] — reconstrução histórica de nov/2025 a out/2026, com fontes GitHub, vault/Wiki e limites de cobertura.



- [[Enciclopedia-Servicos-Growth]] · [[GaaS-Vault-Library]]
- [[ADR-001]] — síntese consultável da decisão histórica
- [[Auditoria-Contexto-Vault-2026-10-02]] — fontes e validação do corte editorial

### Fundamentos

### Estado & Dados

### Inteligência

### Visão de produto (código)
- [[GaaS-Vault-Library]] — projeção autenticada e pesquisável do Obsidian no GaaS, com sync auditável e fonte canônica preservada.
- [[Funil-Onboarding-Arquitetura-e-Ingestao]] — central de funis, collector Meta, contrato de atribuição e limites AppsFlyer.

### Saúde do código

### Operação
- [[WhatsApp-Respostas-de-Opt-out]] — contrato da resposta de interesse negativo em WhatsApp e prevenção de contaminação de sugestões entre jornadas.

### Report Live
- [[Report-Live-Enciclopedia]] — visão central: evolução, arquitetura atual, dados, publicação, recuperação, acesso, homologação e próximos caminhos.
- [[Loop-de-Aprendizado-Growth]] — planejamento do workspace operacional que passa a conter geração, certificação e publicação do Report Live.
- [[Report-Live-Versionamento-e-Publicacao]] — desenho detalhado e diário de implementação.
- [[Report-Live-Sheets-Slides]] — origem operacional do fluxo Sheets + Slides.
- [[Report-Live-Arquitetura-Editorial]] — os 10 arquétipos de slide, régua de comparação, dois perfis e compactação 57→31 (set/2026).
- [[Report-Live-Loop-de-Outcome]] — o mínimo viável para fechar o ciclo de recomendação → resultado, sem tabela nova (set/2026).

## Ganchos para a camada de NEGÓCIO/DADOS
(notas mantidas por outra IA — links podem ainda não existir)
- [[Pilar-Automação-por-Histórico]] · [[Orientador]] · [[CAC-Ótimo]] · [[Metas-e-CAC]] · [[Supabase-Schema]] · [[Jornada-Disparos]] · [[Resultados]] · [[Originação-B2C]] · [[Ontologia-v2]] · [[Dimensao-Canonica-de-Parceiro]]

## Alertas de drift (CLAUDE.md vs código real)
> Resumo rápido para quem chega: o CLAUDE.md tem **drift** — 9 abas (são 11), 13 services (16), 3 stores (4), Zod 3 (4), porta 5173 (3000), "no any" (211×). Detalhes em [[Dívida-Técnica]].

---
> 📊 Snapshot 2026-06-08: ~60k linhas TS/TSX · 145 componentes · ~30 hooks · 16 services · 4 stores · 1 Web Worker · 1 commit no git.

## Legado (foto de jun/2026)

Notas que ficaram fora da estrutura nova da wiki em 29/10/2026. Estão em `98-Legado/`, com o conteúdo original preservado.

### Notas desta camada
- [[Arquitetura-Geral]] — camadas, fluxo de dados (Mermaid), padrões, stack real.
- [[Stack-e-Dependências]] — bibliotecas-chave e por quê; redundâncias.
- [[Convenções-de-Código]] — padrões reais e desvios.
- [[Modelo-de-Estado]] — 4 stores Zustand + 4 Contexts.
- [[Hooks-Catálogo]] — ~30 hooks por função.
- [[Camada-de-Serviços]] — 16 services + acesso Supabase.
- [[Pipeline-ML]] — orquestrador + engines heurísticos.
- [[Modal-de-Disparo]] — blocos, wizard, projeções por campo.
- [[Componentes-por-Aba]] — 11 abas → árvores de componentes.
- [[Módulo-Paid-Media-Afinz]] — o mini-app de Media Analytics.
- [[Decisões-Técnicas]] — trade-offs não óbvios.
- [[Dívida-Técnica]] — débitos com caminho.
- [[Histórico-de-Evolução]] — linha do tempo (MVP→Enhanced).
- [[Como-Rodar-e-Deploy]] — setup, scripts, 3 alvos de deploy.

