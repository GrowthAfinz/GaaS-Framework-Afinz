---
title: 'Skill: gaas-activities-csv-ingest'
tags:
  - ia
  - skills
  - gaas
tipo: skill
camada: ia
atualizado: '2026-10-30'
status: confirmado
fonte: catalogo-versionado-github
skill_id: gaas-activities-csv-ingest
---

# Skill: gaas-activities-csv-ingest

Simular, revisar e importar CSV de Dinâmica BI para activities do GaaS Afinz usando o motor do Atualizador Inteligente, com diferenças por campo, atualização parcial e auditoria. Use para novos disparos ou métricas tardias; não para SFMC ou rentabilização.

## Caso de uso

Simular, revisar e importar CSV de Dinâmica BI para activities do GaaS Afinz usando o motor do Atualizador Inteligente, com diferenças por campo, atualização parcial e auditoria. Use para novos disparos ou métricas tardias; não para SFMC ou rentabilização.

## Entradas e saídas

- Entradas: Arquivo de origem e contrato de campos, período e granularidade.
- Saídas: Simulação/diff auditável e aplicação somente quando autorizada.

Este é o enquadramento do processo. O contrato específico e os parâmetros estão no SKILL.md da origem.

## Tamanho e contexto

- Tamanho do ZIP: 4056 bytes.
- Instruções iniciais: aproximadamente 1815 tokens.
- Instruções com todas as referências: aproximadamente 1815 tokens.
- Método: caracteres / 4; scripts e binários não entram nos tokens. Leia somente as referências pertinentes. A tokenização real varia por modelo.

## Dependências e limites

- Processo: Ingestão de dados.
- Destinos das instruções: claude-code, codex, cowork, chatgpt.
- Execução por ambiente: não certificada nesta publicação. Leia ferramentas, bibliotecas e permissões exigidas na origem.
- A instalação não autoriza escrita, envio, ingestão ou publicação de dados. Respeite os limites do procedimento e a autorização da tarefa.
- Baixe somente esta skill pelo botão Baixar ZIP e mantenha a pasta completa.

## Exemplo de pedido

“Leia a skill gaas-activities-csv-ingest, confira os pré-requisitos e aplique ao meu pedido com as fontes fornecidas. Informe entradas ausentes e limites antes de executar.”

## Origem e versão

- Versão: 1.0.0.
- Origem: codex.
- Licença/autorização: Distribuição pública autorizada pelo titular; sem concessão adicional de licença.

[Implementação e instruções na origem](https://github.com/growthafinz/GaaS-Framework-Afinz/tree/main/.claude/skills/gaas-activities-csv-ingest)

# Histórico

## 1.0.0 (2026-10-30)

- Consolidação pública a partir de codex.
- Fonte canônica no repositório GaaS; arquivos auxiliares preservados.
- Empacotamento não certifica execução em cada IA.


## Conexões

[[Catalogo-de-Skills]] · [[Skills-e-Disponibilidade-por-IA]]
