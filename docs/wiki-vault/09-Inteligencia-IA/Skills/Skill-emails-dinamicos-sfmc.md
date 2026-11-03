---
title: 'Skill: emails-dinamicos-sfmc'
tags:
  - ia
  - skills
  - gaas
tipo: skill
camada: ia
atualizado: '2026-10-30'
status: confirmado
fonte: catalogo-versionado-github
skill_id: emails-dinamicos-sfmc
---

# Skill: emails-dinamicos-sfmc

Monta, valida e sobe linhas de CSV para o motor de e-mail dinâmico do Content Builder no SFMC (Salesforce Marketing Cloud) — o par de Data Extensions TB_CAMPANHA_AQUISICAO (audiência) + TB_BRIEFING_CAMPANHA_AQUISICAO (conteúdo), casadas por AMPscript via chave composta PRODUTO/TP_CAMPANHA/SEQUENCIA. Use quando o usuário pedir para criar/testar uma campanha de e-mail dinâmico, gerar linha de briefing a partir de um xlsx de analista de mkt, diagnosticar erro de importação de Data Extension ("Data inválida", "arquivo inválido", "briefing não encontrado"), ou perguntar como funciona o motor de e-mails dinâmicos. NÃO é sobre o módulo interno "Comunicações" do GaaS (template_id/af_sub3, communication_templates) — isso é escopo de `gaas-governanca-comunicacoes`.

## Caso de uso

Monta, valida e sobe linhas de CSV para o motor de e-mail dinâmico do Content Builder no SFMC (Salesforce Marketing Cloud) — o par de Data Extensions TB_CAMPANHA_AQUISICAO (audiência) + TB_BRIEFING_CAMPANHA_AQUISICAO (conteúdo), casadas por AMPscript via chave composta PRODUTO/TP_CAMPANHA/SEQUENCIA. Use quando o usuário pedir para criar/testar uma campanha de e-mail dinâmico, gerar linha de briefing a partir de um xlsx de analista de mkt, diagnosticar erro de importação de Data Extension ("Data inválida", "arquivo inválido", "briefing não encontrado"), ou perguntar como funciona o motor de e-mails dinâmicos. NÃO é sobre o módulo interno "Comunicações" do GaaS (template_id/af_sub3, communication_templates) — isso é escopo de `gaas-governanca-comunicacoes`.

## Entradas e saídas

- Entradas: Briefing, audiência/DE, HTML/AMPscript ou pacote de jornada, conforme a tarefa.
- Saídas: Arquivo operacional, diagnóstico ou documentação de jornada com seu contrato.

Este é o enquadramento do processo. O contrato específico e os parâmetros estão no SKILL.md da origem.

## Tamanho e contexto

- Tamanho do ZIP: 5345 bytes.
- Instruções iniciais: aproximadamente 2521 tokens.
- Instruções com todas as referências: aproximadamente 2521 tokens.
- Método: caracteres / 4; scripts e binários não entram nos tokens. Leia somente as referências pertinentes. A tokenização real varia por modelo.

## Dependências e limites

- Processo: SFMC.
- Destinos das instruções: claude-code, codex, cowork, chatgpt.
- Execução por ambiente: não certificada nesta publicação. Leia ferramentas, bibliotecas e permissões exigidas na origem.
- A instalação não autoriza escrita, envio, ingestão ou publicação de dados. Respeite os limites do procedimento e a autorização da tarefa.
- Baixe somente esta skill pelo botão Baixar ZIP e mantenha a pasta completa.

## Exemplo de pedido

“Leia a skill emails-dinamicos-sfmc, confira os pré-requisitos e aplique ao meu pedido com as fontes fornecidas. Informe entradas ausentes e limites antes de executar.”

## Origem e versão

- Versão: 1.0.0.
- Origem: claude-projeto.
- Licença/autorização: Distribuição pública autorizada pelo titular; sem concessão adicional de licença.

[Implementação e instruções na origem](https://github.com/growthafinz/GaaS-Framework-Afinz/tree/main/.claude/skills/emails-dinamicos-sfmc)

# Histórico

## 1.0.0 (2026-10-30)

- Consolidação pública a partir de claude-projeto.
- Fonte canônica no repositório GaaS; arquivos auxiliares preservados.
- Empacotamento não certifica execução em cada IA.


## Conexões

[[Catalogo-de-Skills]] · [[Skills-e-Disponibilidade-por-IA]]
