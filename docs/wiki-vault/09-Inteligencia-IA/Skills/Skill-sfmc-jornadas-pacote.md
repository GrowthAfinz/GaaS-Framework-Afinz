---
title: 'Skill: sfmc-jornadas-pacote'
tags:
  - ia
  - skills
  - gaas
tipo: skill
camada: ia
atualizado: '2026-10-30'
status: confirmado
fonte: catalogo-versionado-github
skill_id: sfmc-jornadas-pacote
---

# Skill: sfmc-jornadas-pacote

Lê pacotes do SFMC Package Manager (ZIP de jornadas exportado pelo Pablo), extrai cada mensagem de WhatsApp, SMS, e-mail e push com texto, parâmetros, link, af_sub e o caminho dentro da jornada, liga cada mensagem aos disparos reais da tabela `activities` no Supabase pelo Activity Name e ranqueia qual template trouxe melhor resultado (conversão = cartões / base acionável, com CAC, cobertura e confiança). Também desenha a jornada (raio-x). Use quando o usuário mandar um .zip de pacote/jornadas do SFMC, pedir pra "ler as mensagens das jornadas", "qual template converteu melhor", "ranking de templates", "ligar mensagem ao disparo", ou analisar réguas de carrinho, repescagem (NGD), upgrade (ANC), topo. Também CARREGA o pacote na Fila de reconciliação do GaaS (Comunicações) e anota cada proposta, quando o Pablo pedir "carrega esse pack na fila", "sobe o pacote pro GaaS" ou mandar um ZIP pra virar sugestão de template ID. NÃO cria nem publica jornada no SFMC; NÃO é a skill de governança de template_id (`gaas-governanca-comunicacoes`) nem de copy (`afinz-copy-aquisicao`).

## Caso de uso

Lê pacotes do SFMC Package Manager (ZIP de jornadas exportado pelo Pablo), extrai cada mensagem de WhatsApp, SMS, e-mail e push com texto, parâmetros, link, af_sub e o caminho dentro da jornada, liga cada mensagem aos disparos reais da tabela `activities` no Supabase pelo Activity Name e ranqueia qual template trouxe melhor resultado (conversão = cartões / base acionável, com CAC, cobertura e confiança). Também desenha a jornada (raio-x). Use quando o usuário mandar um .zip de pacote/jornadas do SFMC, pedir pra "ler as mensagens das jornadas", "qual template converteu melhor", "ranking de templates", "ligar mensagem ao disparo", ou analisar réguas de carrinho, repescagem (NGD), upgrade (ANC), topo. Também CARREGA o pacote na Fila de reconciliação do GaaS (Comunicações) e anota cada proposta, quando o Pablo pedir "carrega esse pack na fila", "sobe o pacote pro GaaS" ou mandar um ZIP pra virar sugestão de template ID. NÃO cria nem publica jornada no SFMC; NÃO é a skill de governança de template_id (`gaas-governanca-comunicacoes`) nem de copy (`afinz-copy-aquisicao`).

## Entradas e saídas

- Entradas: Briefing, audiência/DE, HTML/AMPscript ou pacote de jornada, conforme a tarefa.
- Saídas: Arquivo operacional, diagnóstico ou documentação de jornada com seu contrato.

Este é o enquadramento do processo. O contrato específico e os parâmetros estão no SKILL.md da origem.

## Tamanho e contexto

- Tamanho do ZIP: 54048 bytes.
- Instruções iniciais: aproximadamente 3534 tokens.
- Instruções com todas as referências: aproximadamente 7778 tokens.
- Método: caracteres / 4; scripts e binários não entram nos tokens. Leia somente as referências pertinentes. A tokenização real varia por modelo.

## Dependências e limites

- Processo: SFMC.
- Destinos das instruções: claude-code, codex, cowork, chatgpt.
- Execução por ambiente: não certificada nesta publicação. Leia ferramentas, bibliotecas e permissões exigidas na origem.
- A instalação não autoriza escrita, envio, ingestão ou publicação de dados. Respeite os limites do procedimento e a autorização da tarefa.
- Baixe somente esta skill pelo botão Baixar ZIP e mantenha a pasta completa.

## Exemplo de pedido

“Leia a skill sfmc-jornadas-pacote, confira os pré-requisitos e aplique ao meu pedido com as fontes fornecidas. Informe entradas ausentes e limites antes de executar.”

## Origem e versão

- Versão: 1.0.0.
- Origem: claude-projeto.
- Licença/autorização: Distribuição pública autorizada pelo titular; sem concessão adicional de licença.

[Implementação e instruções na origem](https://github.com/growthafinz/GaaS-Framework-Afinz/tree/main/.claude/skills/sfmc-jornadas-pacote)

# Histórico

## 1.0.0 (2026-10-30)

- Consolidação pública a partir de claude-projeto.
- Fonte canônica no repositório GaaS; arquivos auxiliares preservados.
- Empacotamento não certifica execução em cada IA.


## Conexões

[[Catalogo-de-Skills]] · [[Skills-e-Disponibilidade-por-IA]]
