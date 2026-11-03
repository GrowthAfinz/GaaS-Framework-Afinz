---
title: 'Skill: afinz-copy-aquisicao'
tags:
  - ia
  - skills
  - gaas
tipo: skill
camada: ia
atualizado: '2026-10-30'
status: confirmado
fonte: catalogo-versionado-github
skill_id: afinz-copy-aquisicao
---

# Skill: afinz-copy-aquisicao

Redige a copy de comunicações de aquisição de cartão da Afinz (WhatsApp, SMS, Push, e-mail) para qualquer combinação de BU (B2C, B2B2C, Plurix), Parceiro, Segmento e Oferta — e roteia o resultado pro formato certo do sistema real de destino. Para e-mail, produz a copy já no formato de linha de `TB_BRIEFING_CAMPANHA_AQUISICAO` (o motor de e-mail dinâmico do SFMC); para WhatsApp/SMS/Push, produz a copy pronta pra colar na ferramenta de disparo, já que hoje não existe um motor dinâmico equivalente pra esses canais. NÃO é a skill que sobe o CSV no SFMC (isso é `emails-dinamicos-sfmc`) nem a que reconcilia template_id×activity_name no módulo Comunicações do GaaS (isso é `gaas-governanca-comunicacoes`) — esta skill só escreve o texto persuasivo, com o contexto certo montado automaticamente. Use quando o usuário pedir pra escrever, redigir, criar copy, criar mensagem de disparo, ou revisar comunicação de aquisição — mesmo que ele só diga "escreve um WhatsApp pra Repescagem" sem citar todos os detalhes.

## Caso de uso

Redige a copy de comunicações de aquisição de cartão da Afinz (WhatsApp, SMS, Push, e-mail) para qualquer combinação de BU (B2C, B2B2C, Plurix), Parceiro, Segmento e Oferta — e roteia o resultado pro formato certo do sistema real de destino. Para e-mail, produz a copy já no formato de linha de `TB_BRIEFING_CAMPANHA_AQUISICAO` (o motor de e-mail dinâmico do SFMC); para WhatsApp/SMS/Push, produz a copy pronta pra colar na ferramenta de disparo, já que hoje não existe um motor dinâmico equivalente pra esses canais. NÃO é a skill que sobe o CSV no SFMC (isso é `emails-dinamicos-sfmc`) nem a que reconcilia template_id×activity_name no módulo Comunicações do GaaS (isso é `gaas-governanca-comunicacoes`) — esta skill só escreve o texto persuasivo, com o contexto certo montado automaticamente. Use quando o usuário pedir pra escrever, redigir, criar copy, criar mensagem de disparo, ou revisar comunicação de aquisição — mesmo que ele só diga "escreve um WhatsApp pra Repescagem" sem citar todos os detalhes.

## Entradas e saídas

- Entradas: Peças, texto, planilha de governança e identidades de template e disparo.
- Saídas: Copy, metadados, reconciliação ou proposta revisável conforme a skill.

Este é o enquadramento do processo. O contrato específico e os parâmetros estão no SKILL.md da origem.

## Tamanho e contexto

- Tamanho do ZIP: 13888 bytes.
- Instruções iniciais: aproximadamente 3656 tokens.
- Instruções com todas as referências: aproximadamente 6728 tokens.
- Método: caracteres / 4; scripts e binários não entram nos tokens. Leia somente as referências pertinentes. A tokenização real varia por modelo.

## Dependências e limites

- Processo: Comunicações.
- Destinos das instruções: claude-code, codex, cowork, chatgpt.
- Execução por ambiente: não certificada nesta publicação. Leia ferramentas, bibliotecas e permissões exigidas na origem.
- A instalação não autoriza escrita, envio, ingestão ou publicação de dados. Respeite os limites do procedimento e a autorização da tarefa.
- Baixe somente esta skill pelo botão Baixar ZIP e mantenha a pasta completa.

## Exemplo de pedido

“Leia a skill afinz-copy-aquisicao, confira os pré-requisitos e aplique ao meu pedido com as fontes fornecidas. Informe entradas ausentes e limites antes de executar.”

## Origem e versão

- Versão: 1.0.0.
- Origem: claude-projeto.
- Licença/autorização: Distribuição pública autorizada pelo titular; sem concessão adicional de licença.

[Implementação e instruções na origem](https://github.com/growthafinz/GaaS-Framework-Afinz/tree/main/.claude/skills/afinz-copy-aquisicao)

# Histórico

## 1.0.0 (2026-10-30)

- Consolidação pública a partir de claude-projeto.
- Fonte canônica no repositório GaaS; arquivos auxiliares preservados.
- Empacotamento não certifica execução em cada IA.


## Conexões

[[Catalogo-de-Skills]] · [[Skills-e-Disponibilidade-por-IA]]
