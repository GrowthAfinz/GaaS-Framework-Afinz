---
tags: [estrategia, sfmc, api, integracao, jornadas, personalizacao]
tipo: estrategia
camada: estrategia
atualizado: 2026-10-07
status: inferência
fonte: conversa-pablo-claude-2026-10-06-e-pesquisa-publica
---

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

**Personalização (o "leque"):** cascata com fallback campo a campo na DE de briefing (específico segmento × investida → segmento → base), em vez de multiplicar linhas. Segmento e investida como colunas explícitas da audiência, não parseados do activity name (que segue como auditoria). Pré-requisito: corrigir o rastreio (`UTM_CAMPANHA` nunca chega ao link, [[Emails-Dinamicos-Plurix]] §13).

**IA:** gerar variações **antes** do envio, na Fábrica, com guardrails da Ficha de Produto e aprovação humana. Não chamar LLM na hora do envio. Einstein (personas, STO, frequência, Content Selection) e Agentforce dependem do contrato.

## Regras, condições e limites

- Secret nunca no front (GaaS é estático no GitHub Pages): tudo via Supabase Edge Function.
- Escopos por fase: **só leitura** → escrita em rascunho → publicar/executar.
- Nunca rodar pelo GaaS automação com envio dentro nem "limpar DE"; snapshot antes de escrita; log de quem fez.
- Entrada de jornada por API event exigiria CPF/e-mail no GaaS: evitar.

## Exemplo e validação

Ordem sugerida: (1) leitura: inventário de DEs, jornadas e automações, painel de saúde; (2) ingestão de tracking; (3) publicar briefing da Fábrica numa DE de teste; (4) gerador de jornada por molde em pasta de teste; (5) publicação com checagem e confirmação dupla. Enquanto a API não sai, o **ZIP do Package Manager** já serve de molde e de fonte de leitura ([[SFMC-Package-Manager-e-Pacotes]]).

## Fontes e evidências

Conversa de 06/10/2026; documentação pública do Journey Builder API, Automation Studio, Package Manager, Einstein e Agentforce Marketing (2026); repositório `Accenture/sfmc-devtools`.

## Lacunas e pendências

| Questão | Impacto | Dono |
|---|---|---|
| Quem é admin do SFMC e quem aprova na TI | destrava o Installed Package | Pablo |
| WhatsApp sai pelo SFMC (Chat Messaging) para tudo? | define o que dá para ler de tracking | Pablo |
| Edição/licença Einstein e Agentforce | define o leque de personalização nativo | Pablo / Salesforce |

## Relacionado

- [[SFMC-Salesforce-Marketing-Cloud]] · [[SFMC-Package-Manager-e-Pacotes]] · [[Anti-Overlap-Pressão-de-Contato]] · [[Emails-Dinamicos-Plurix]] · [[Fabrica-de-Emails-GaaS]] · [[Decisões-Abertas]]
