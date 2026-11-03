---
title: 'Skill: gaas-momento-disparo'
tags:
  - ia
  - skills
  - gaas
tipo: skill
camada: ia
atualizado: '2026-10-30'
status: confirmado
fonte: catalogo-versionado-github
skill_id: gaas-momento-disparo
---

# Skill: gaas-momento-disparo

Recomenda o melhor momento de disparo (dia da semana, posição na régua S/D, e alerta de cadência) para uma combinação BU × Parceiro × Segmento (× Jornada/Canal opcional), a partir do histórico real da tabela `activities` no Supabase. Também roda uma checagem de higiene de taxonomia (BU/Parceiro/Segmento vs. tokens do nome da jornada) antes de confiar no recorte. Use quando o usuário pedir "melhor dia/hora pra disparar", "quando devo mandar esse disparo", "momento ótimo por segmento/parceiro", ou ao planejar uma nova jornada no Launch/modal de disparo e precisar de uma sugestão de timing baseada em histórico.

## Caso de uso

Recomenda o melhor momento de disparo (dia da semana, posição na régua S/D, e alerta de cadência) para uma combinação BU × Parceiro × Segmento (× Jornada/Canal opcional), a partir do histórico real da tabela `activities` no Supabase. Também roda uma checagem de higiene de taxonomia (BU/Parceiro/Segmento vs. tokens do nome da jornada) antes de confiar no recorte. Use quando o usuário pedir "melhor dia/hora pra disparar", "quando devo mandar esse disparo", "momento ótimo por segmento/parceiro", ou ao planejar uma nova jornada no Launch/modal de disparo e precisar de uma sugestão de timing baseada em histórico.

## Entradas e saídas

- Entradas: Histórico comparável por canal, BU, parceiro e segmento.
- Saídas: Recomendação de momento/cadência com evidências e limites.

Este é o enquadramento do processo. O contrato específico e os parâmetros estão no SKILL.md da origem.

## Tamanho e contexto

- Tamanho do ZIP: 8863 bytes.
- Instruções iniciais: aproximadamente 2050 tokens.
- Instruções com todas as referências: aproximadamente 3394 tokens.
- Método: caracteres / 4; scripts e binários não entram nos tokens. Leia somente as referências pertinentes. A tokenização real varia por modelo.

## Dependências e limites

- Processo: Planejamento de disparo.
- Destinos das instruções: claude-code, codex, cowork, chatgpt.
- Execução por ambiente: não certificada nesta publicação. Leia ferramentas, bibliotecas e permissões exigidas na origem.
- A instalação não autoriza escrita, envio, ingestão ou publicação de dados. Respeite os limites do procedimento e a autorização da tarefa.
- Baixe somente esta skill pelo botão Baixar ZIP e mantenha a pasta completa.

## Exemplo de pedido

“Leia a skill gaas-momento-disparo, confira os pré-requisitos e aplique ao meu pedido com as fontes fornecidas. Informe entradas ausentes e limites antes de executar.”

## Origem e versão

- Versão: 1.0.0.
- Origem: claude-projeto.
- Licença/autorização: Distribuição pública autorizada pelo titular; sem concessão adicional de licença.

[Implementação e instruções na origem](https://github.com/growthafinz/GaaS-Framework-Afinz/tree/main/.claude/skills/gaas-momento-disparo)

# Histórico

## 1.0.0 (2026-10-30)

- Consolidação pública a partir de claude-projeto.
- Fonte canônica no repositório GaaS; arquivos auxiliares preservados.
- Empacotamento não certifica execução em cada IA.


## Conexões

[[Catalogo-de-Skills]] · [[Skills-e-Disponibilidade-por-IA]]
