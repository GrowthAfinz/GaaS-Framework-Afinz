---
title: 'Skill: gaas-growth-investigation'
tags:
  - ia
  - skills
  - gaas
tipo: skill
camada: ia
atualizado: '2026-10-30'
status: confirmado
fonte: catalogo-versionado-github
skill_id: gaas-growth-investigation
---

# Skill: gaas-growth-investigation

Consumir a fila de investigações CRM do GaaS via Supabase, analisar evidências versionadas e publicar análise e candidata elegível. Usar quando o usuário pedir para rodar a fila de investigações; não corrige fontes nem assume apostas.

## Caso de uso

Consumir a fila de investigações CRM do GaaS via Supabase, analisar evidências versionadas e publicar análise e candidata elegível. Usar quando o usuário pedir para rodar a fila de investigações; não corrige fontes nem assume apostas.

## Entradas e saídas

- Entradas: Pacote reservado pela Fila, evidências e revisões/hash do contrato vigente.
- Saídas: Análise governada ou contribuição revisável, sem aprovar a própria proposta.

Este é o enquadramento do processo. O contrato específico e os parâmetros estão no SKILL.md da origem.

## Tamanho e contexto

- Tamanho do ZIP: 4956 bytes.
- Instruções iniciais: aproximadamente 1248 tokens.
- Instruções com todas as referências: aproximadamente 1854 tokens.
- Método: caracteres / 4; scripts e binários não entram nos tokens. Leia somente as referências pertinentes. A tokenização real varia por modelo.

## Dependências e limites

- Processo: Loop.
- Destinos das instruções: claude-code, codex, cowork, chatgpt.
- Execução por ambiente: não certificada nesta publicação. Leia ferramentas, bibliotecas e permissões exigidas na origem.
- A instalação não autoriza escrita, envio, ingestão ou publicação de dados. Respeite os limites do procedimento e a autorização da tarefa.
- Baixe somente esta skill pelo botão Baixar ZIP e mantenha a pasta completa.

## Exemplo de pedido

“Leia a skill gaas-growth-investigation, confira os pré-requisitos e aplique ao meu pedido com as fontes fornecidas. Informe entradas ausentes e limites antes de executar.”

## Origem e versão

- Versão: 1.0.0.
- Origem: repo-app.
- Licença/autorização: Distribuição pública autorizada pelo titular; sem concessão adicional de licença.

[Implementação e instruções na origem](https://github.com/growthafinz/GaaS-Framework-Afinz/tree/main/.claude/skills/gaas-growth-investigation)

# Histórico

## 1.0.0 (2026-10-30)

- Consolidação pública a partir de repo-app.
- Fonte canônica no repositório GaaS; arquivos auxiliares preservados.
- Empacotamento não certifica execução em cada IA.


## Conexões

[[Catalogo-de-Skills]] · [[Skills-e-Disponibilidade-por-IA]]
