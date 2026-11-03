---
tags: [ia,mcp,obsidian]
tipo: referencia
camada: evolucao
atualizado: 2026-06-08
status: confirmado
fonte: pesquisa-externa
---

# Obsidian MCP (operar o vault por IA)

**Definição:** as opções de **servidor MCP para Obsidian** que permitem a uma IA ler/escrever/buscar neste vault de forma estruturada — e a recomendação para esta operação.

## Opções (ecossistema, 2025–2026)
| Servidor | Como funciona | Bom para |
|---|---|---|
| `jacksteamdev/obsidian-mcp-tools` | Local REST API + busca semântica + Templater | mais completo |
| `iansinnott/obsidian-claude-code-mcp` | WebSocket (porta 22360), feito p/ Claude Code | integração nativa |
| `marcelmarais/obsidian-mcp-server` | leve, read/write via REST API | setup simples |

## Recomendação para a Afinz
**Não é estritamente necessário** para a IA operar este vault: como os arquivos são markdown plano dentro do diretório de trabalho, uma IA (ex.: Claude Code) já lê/escreve/busca direto via ferramentas de arquivo — foi assim que este vault foi complementado. O MCP do Obsidian agrega **busca semântica** e manipulação de frontmatter/templates; vale instalar quando o volume de notas crescer. O ganho maior de inteligência vem do **MCP do Supabase** (dados vivos), não do MCP do Obsidian. Ver [[MCP-Visão-Geral]].

## Relacionado
- [[MCP-Visão-Geral]] · [[Vault-como-Contexto]] · [[Runbook-Vault-Vivo]]
