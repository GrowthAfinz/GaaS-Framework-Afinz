---
title: 'Skill: gaas-emails-plurix'
tags:
  - ia
  - skills
  - gaas
tipo: skill
camada: ia
atualizado: '2026-10-30'
status: confirmado
fonte: catalogo-versionado-github
skill_id: gaas-emails-plurix
---

# Skill: gaas-emails-plurix

Escreve e ajusta e-mails de aquisição da Fábrica de E-mails do GaaS (Plurix), mostra a prévia fiel no template real e entrega o arquivo JSON input_gaas_emails (por segmento e data) para importar no GaaS. Use quando pedirem para criar, revisar ou mudar e-mails de régua (V2 TOPO DE FUNIL DINÂMICO), mandarem a aba Briefing Fábrica ou um briefing, ou pedirem o JSON de importação da Fábrica.

## Caso de uso

Snapshot da Fábrica de E-mails. O export da Fábrica continua sendo a fonte viva; confira sua versão antes de usar.

## Entradas e saídas

- Entradas: Briefing, audiência/DE, HTML/AMPscript ou pacote de jornada, conforme a tarefa.
- Saídas: Arquivo operacional, diagnóstico ou documentação de jornada com seu contrato.

Este é o enquadramento do processo. O contrato específico e os parâmetros estão no SKILL.md da origem.

## Tamanho e contexto

- Tamanho do ZIP: 222317 bytes.
- Instruções iniciais: aproximadamente 1435 tokens.
- Instruções com todas as referências: aproximadamente 7187 tokens.
- Método: caracteres / 4; scripts e binários não entram nos tokens. Leia somente as referências pertinentes. A tokenização real varia por modelo.

## Dependências e limites

- Processo: SFMC.
- Destinos das instruções: claude-code, codex, cowork, chatgpt.
- Execução por ambiente: não certificada nesta publicação. Leia ferramentas, bibliotecas e permissões exigidas na origem.
- A instalação não autoriza escrita, envio, ingestão ou publicação de dados. Respeite os limites do procedimento e a autorização da tarefa.
- Baixe somente esta skill pelo botão Baixar ZIP e mantenha a pasta completa.

## Exemplo de pedido

“Leia a skill gaas-emails-plurix, confira os pré-requisitos e aplique ao meu pedido com as fontes fornecidas. Informe entradas ausentes e limites antes de executar.”

## Origem e versão

- Versão: 1.0.0.
- Origem: fabrica-emails.
- Licença/autorização: Distribuição pública autorizada pelo titular; sem concessão adicional de licença.

[Implementação e instruções na origem](https://github.com/growthafinz/GaaS-Framework-Afinz/tree/main/.claude/skills/gaas-emails-plurix)

# Histórico

## 1.0.0 (2026-10-30)

- Consolidação pública a partir de fabrica-emails.
- Fonte canônica no repositório GaaS; arquivos auxiliares preservados.
- Empacotamento não certifica execução em cada IA.


## Conexões

[[Catalogo-de-Skills]] · [[Skills-e-Disponibilidade-por-IA]]
