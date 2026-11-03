---
title: 'Skill: b2c-originacao-updater'
tags:
  - ia
  - skills
  - gaas
tipo: skill
camada: ia
atualizado: '2026-10-30'
status: confirmado
fonte: catalogo-versionado-github
skill_id: b2c-originacao-updater
---

# Skill: b2c-originacao-updater

Skill 1 de 2 do sistema GaaS. Lê a planilha "Orçamento B2C (B2C Produção diária)" em XLSX ou CSV e numa única passada grava dois registros por data na tabela b2c_daily_metrics: um com tipo='total' (Total B2C) e outro com tipo='serasa_api' (canal integrado Serasa). A tabela precisa ter PK composta (data, tipo) — ver seção de migration. Acionar quando o usuário mencionar: atualizar originação B2C, subir planilha de produção diária, sincronizar resultados B2C, produção diária B2C, Serasa API.

## Caso de uso

Skill 1 de 2 do sistema GaaS. Lê a planilha "Orçamento B2C (B2C Produção diária)" em XLSX ou CSV e numa única passada grava dois registros por data na tabela b2c_daily_metrics: um com tipo='total' (Total B2C) e outro com tipo='serasa_api' (canal integrado Serasa). A tabela precisa ter PK composta (data, tipo) — ver seção de migration. Acionar quando o usuário mencionar: atualizar originação B2C, subir planilha de produção diária, sincronizar resultados B2C, produção diária B2C, Serasa API.

## Entradas e saídas

- Entradas: Arquivo de origem e contrato de campos, período e granularidade.
- Saídas: Simulação/diff auditável e aplicação somente quando autorizada.

Este é o enquadramento do processo. O contrato específico e os parâmetros estão no SKILL.md da origem.

## Tamanho e contexto

- Tamanho do ZIP: 6027 bytes.
- Instruções iniciais: aproximadamente 3742 tokens.
- Instruções com todas as referências: aproximadamente 3742 tokens.
- Método: caracteres / 4; scripts e binários não entram nos tokens. Leia somente as referências pertinentes. A tokenização real varia por modelo.

## Dependências e limites

- Processo: Ingestão de dados.
- Destinos das instruções: claude-code, codex, cowork, chatgpt.
- Execução por ambiente: não certificada nesta publicação. Leia ferramentas, bibliotecas e permissões exigidas na origem.
- A instalação não autoriza escrita, envio, ingestão ou publicação de dados. Respeite os limites do procedimento e a autorização da tarefa.
- Baixe somente esta skill pelo botão Baixar ZIP e mantenha a pasta completa.

## Exemplo de pedido

“Leia a skill b2c-originacao-updater, confira os pré-requisitos e aplique ao meu pedido com as fontes fornecidas. Informe entradas ausentes e limites antes de executar.”

## Origem e versão

- Versão: 1.0.0.
- Origem: cowork.
- Licença/autorização: Distribuição pública autorizada pelo titular; sem concessão adicional de licença.

[Implementação e instruções na origem](https://github.com/growthafinz/GaaS-Framework-Afinz/tree/main/.claude/skills/b2c-originacao-updater)

# Histórico

## 1.0.0 (2026-10-30)

- Consolidação pública a partir de cowork.
- Fonte canônica no repositório GaaS; arquivos auxiliares preservados.
- Empacotamento não certifica execução em cada IA.


## Conexões

[[Catalogo-de-Skills]] · [[Skills-e-Disponibilidade-por-IA]]
