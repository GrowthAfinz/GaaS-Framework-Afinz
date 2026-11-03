---
title: 'Skill: meta-ads-remote'
tags:
  - ia
  - skills
  - gaas
tipo: skill
camada: ia
atualizado: '2026-10-30'
status: confirmado
fonte: catalogo-versionado-github
skill_id: meta-ads-remote
---

# Skill: meta-ads-remote

Access Meta Ads through Meta's official remote MCP server at https://mcp.facebook.com/ads. Use when Codex needs to inspect Meta Ads accounts, campaigns, ad sets, ads, creatives, delivery, spend, pacing, or insights for paid media analysis, especially Afinz reporting and paid media diagnostics.

## Caso de uso

Access Meta Ads through Meta's official remote MCP server at https://mcp.facebook.com/ads. Use when Codex needs to inspect Meta Ads accounts, campaigns, ad sets, ads, creatives, delivery, spend, pacing, or insights for paid media analysis, especially Afinz reporting and paid media diagnostics.

## Entradas e saídas

- Entradas: Conta/campanha, período e métricas oficiais da plataforma.
- Saídas: Análise de campanhas, investimento e eventos nomeados, sem inferir cartões.

Este é o enquadramento do processo. O contrato específico e os parâmetros estão no SKILL.md da origem.

## Tamanho e contexto

- Tamanho do ZIP: 1724 bytes.
- Instruções iniciais: aproximadamente 406 tokens.
- Instruções com todas as referências: aproximadamente 406 tokens.
- Método: caracteres / 4; scripts e binários não entram nos tokens. Leia somente as referências pertinentes. A tokenização real varia por modelo.

## Dependências e limites

- Processo: Mídia paga.
- Destinos das instruções: claude-code, codex, cowork, chatgpt.
- Execução por ambiente: não certificada nesta publicação. Leia ferramentas, bibliotecas e permissões exigidas na origem.
- A instalação não autoriza escrita, envio, ingestão ou publicação de dados. Respeite os limites do procedimento e a autorização da tarefa.
- Baixe somente esta skill pelo botão Baixar ZIP e mantenha a pasta completa.

## Exemplo de pedido

“Leia a skill meta-ads-remote, confira os pré-requisitos e aplique ao meu pedido com as fontes fornecidas. Informe entradas ausentes e limites antes de executar.”

## Origem e versão

- Versão: 1.0.0.
- Origem: codex.
- Licença/autorização: Distribuição pública autorizada pelo titular; sem concessão adicional de licença.

[Implementação e instruções na origem](https://github.com/growthafinz/GaaS-Framework-Afinz/tree/main/.claude/skills/meta-ads-remote)

# Histórico

## 1.0.0 (2026-10-30)

- Consolidação pública a partir de codex.
- Fonte canônica no repositório GaaS; arquivos auxiliares preservados.
- Empacotamento não certifica execução em cada IA.


## Conexões

[[Catalogo-de-Skills]] · [[Skills-e-Disponibilidade-por-IA]]
