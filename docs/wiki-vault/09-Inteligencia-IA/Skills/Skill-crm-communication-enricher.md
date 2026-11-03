---
title: 'Skill: crm-communication-enricher'
tags:
  - ia
  - skills
  - gaas
tipo: skill
camada: ia
atualizado: '2026-10-30'
status: confirmado
fonte: catalogo-versionado-github
skill_id: crm-communication-enricher
---

# Skill: crm-communication-enricher

Analisar prints de comunicações CRM em PNG, JPG ou WebP, cruzar o contexto com as colunas oficiais do Framework e o histórico de activities, transcrever a mensagem e gerar metadados revisáveis em JSON, CSV ou tabela. Use para enriquecer imagens de WhatsApp, SMS, e-mail ou push antes de cadastrar ou importar templates no GaaS, individualmente ou em lote, especialmente quando Oferta, Promocional, jornada, segmento e demais dimensões precisam respeitar a semântica histórica.

## Caso de uso

Analisar prints de comunicações CRM em PNG, JPG ou WebP, cruzar o contexto com as colunas oficiais do Framework e o histórico de activities, transcrever a mensagem e gerar metadados revisáveis em JSON, CSV ou tabela. Use para enriquecer imagens de WhatsApp, SMS, e-mail ou push antes de cadastrar ou importar templates no GaaS, individualmente ou em lote, especialmente quando Oferta, Promocional, jornada, segmento e demais dimensões precisam respeitar a semântica histórica.

## Entradas e saídas

- Entradas: Peças, texto, planilha de governança e identidades de template e disparo.
- Saídas: Copy, metadados, reconciliação ou proposta revisável conforme a skill.

Este é o enquadramento do processo. O contrato específico e os parâmetros estão no SKILL.md da origem.

## Tamanho e contexto

- Tamanho do ZIP: 7465 bytes.
- Instruções iniciais: aproximadamente 1168 tokens.
- Instruções com todas as referências: aproximadamente 3099 tokens.
- Método: caracteres / 4; scripts e binários não entram nos tokens. Leia somente as referências pertinentes. A tokenização real varia por modelo.

## Dependências e limites

- Processo: Comunicações.
- Destinos das instruções: claude-code, codex, cowork, chatgpt.
- Execução por ambiente: não certificada nesta publicação. Leia ferramentas, bibliotecas e permissões exigidas na origem.
- A instalação não autoriza escrita, envio, ingestão ou publicação de dados. Respeite os limites do procedimento e a autorização da tarefa.
- Baixe somente esta skill pelo botão Baixar ZIP e mantenha a pasta completa.

## Exemplo de pedido

“Leia a skill crm-communication-enricher, confira os pré-requisitos e aplique ao meu pedido com as fontes fornecidas. Informe entradas ausentes e limites antes de executar.”

## Origem e versão

- Versão: 1.0.0.
- Origem: codex.
- Licença/autorização: Distribuição pública autorizada pelo titular; sem concessão adicional de licença.

[Implementação e instruções na origem](https://github.com/growthafinz/GaaS-Framework-Afinz/tree/main/.claude/skills/crm-communication-enricher)

# Histórico

## 1.0.0 (2026-10-30)

- Consolidação pública a partir de codex.
- Fonte canônica no repositório GaaS; arquivos auxiliares preservados.
- Empacotamento não certifica execução em cada IA.


## Conexões

[[Catalogo-de-Skills]] · [[Skills-e-Disponibilidade-por-IA]]
