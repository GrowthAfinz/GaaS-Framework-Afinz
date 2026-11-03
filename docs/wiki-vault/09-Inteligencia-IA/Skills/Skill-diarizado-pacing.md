---
title: 'Skill: diarizado-pacing'
tags:
  - ia
  - skills
  - gaas
tipo: skill
camada: ia
atualizado: '2026-10-30'
status: confirmado
fonte: catalogo-versionado-github
skill_id: diarizado-pacing
---

# Skill: diarizado-pacing

Gera planilhas Excel (.xlsx) de Diarizado de Pacing no formato herdado da Jacto — gráficos de linha no topo (Realizado acumulado vs Meta acumulada), um cockpit de pacing por objetivo (Acumulado/Meta/Gap%/Projeção) e uma tabela diária com pares diário+acumulado por objetivo. Métricas em PT-BR. Use quando o usuário pedir "diarizado", "pacing diário", "acompanhamento diário de mídia paga", "planilha estilo Jacto", ou quiser projeção de fechamento de mês por objetivo/frente a partir de dados diários.

## Caso de uso

Gera planilhas Excel (.xlsx) de Diarizado de Pacing no formato herdado da Jacto — gráficos de linha no topo (Realizado acumulado vs Meta acumulada), um cockpit de pacing por objetivo (Acumulado/Meta/Gap%/Projeção) e uma tabela diária com pares diário+acumulado por objetivo. Métricas em PT-BR. Use quando o usuário pedir "diarizado", "pacing diário", "acompanhamento diário de mídia paga", "planilha estilo Jacto", ou quiser projeção de fechamento de mês por objetivo/frente a partir de dados diários.

## Entradas e saídas

- Entradas: Fontes do período, recorte, métricas e modelo de saída solicitado.
- Saídas: Planilha, leitura de gestão ou relatório com cobertura e limitações.

Este é o enquadramento do processo. O contrato específico e os parâmetros estão no SKILL.md da origem.

## Tamanho e contexto

- Tamanho do ZIP: 9087 bytes.
- Instruções iniciais: aproximadamente 812 tokens.
- Instruções com todas as referências: aproximadamente 812 tokens.
- Método: caracteres / 4; scripts e binários não entram nos tokens. Leia somente as referências pertinentes. A tokenização real varia por modelo.

## Dependências e limites

- Processo: Relatórios.
- Destinos das instruções: claude-code, codex, cowork, chatgpt.
- Execução por ambiente: não certificada nesta publicação. Leia ferramentas, bibliotecas e permissões exigidas na origem.
- A instalação não autoriza escrita, envio, ingestão ou publicação de dados. Respeite os limites do procedimento e a autorização da tarefa.
- Baixe somente esta skill pelo botão Baixar ZIP e mantenha a pasta completa.

## Exemplo de pedido

“Leia a skill diarizado-pacing, confira os pré-requisitos e aplique ao meu pedido com as fontes fornecidas. Informe entradas ausentes e limites antes de executar.”

## Origem e versão

- Versão: 1.0.0.
- Origem: cowork.
- Licença/autorização: Distribuição pública autorizada pelo titular; sem concessão adicional de licença.

[Implementação e instruções na origem](https://github.com/growthafinz/GaaS-Framework-Afinz/tree/main/.claude/skills/diarizado-pacing)

# Histórico

## 1.0.0 (2026-10-30)

- Consolidação pública a partir de cowork.
- Fonte canônica no repositório GaaS; arquivos auxiliares preservados.
- Empacotamento não certifica execução em cada IA.


## Conexões

[[Catalogo-de-Skills]] · [[Skills-e-Disponibilidade-por-IA]]
