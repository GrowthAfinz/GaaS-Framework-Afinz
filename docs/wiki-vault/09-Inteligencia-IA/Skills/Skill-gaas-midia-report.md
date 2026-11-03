---
title: 'Skill: gaas-midia-report'
tags:
  - ia
  - skills
  - gaas
tipo: skill
camada: ia
atualizado: '2026-10-30'
status: confirmado
fonte: catalogo-versionado-github
skill_id: gaas-midia-report
---

# Skill: gaas-midia-report

Gera, direto no chat, a leitura de "gestão de report" de Mídia Paga (Meta+Google) do GaaS — mapeamento de campanha por objetivo de negócio, resultados recentes (spend/CTR/CPC/CPA por campanha/objetivo/canal) e alcance de meta/budget por objetivo. Roda SQL ao vivo contra o Supabase (projeto `mipiwxadnpwtcgfcedym`), sempre a partir das views ponderadas de mídia, nunca reagregando `paid_media_metrics` do zero. Use quando o usuário pedir "como está a mídia paga", "resultado das campanhas essa semana/mês", "alcance de meta de mídia", "campanhas sem mapeamento", ou quiser conferir divergência entre o mapeamento do dashboard e a classificação usada no relatório XLSX.

## Caso de uso

Gera, direto no chat, a leitura de "gestão de report" de Mídia Paga (Meta+Google) do GaaS — mapeamento de campanha por objetivo de negócio, resultados recentes (spend/CTR/CPC/CPA por campanha/objetivo/canal) e alcance de meta/budget por objetivo. Roda SQL ao vivo contra o Supabase (projeto `mipiwxadnpwtcgfcedym`), sempre a partir das views ponderadas de mídia, nunca reagregando `paid_media_metrics` do zero. Use quando o usuário pedir "como está a mídia paga", "resultado das campanhas essa semana/mês", "alcance de meta de mídia", "campanhas sem mapeamento", ou quiser conferir divergência entre o mapeamento do dashboard e a classificação usada no relatório XLSX.

## Entradas e saídas

- Entradas: Conta/campanha, período e métricas oficiais da plataforma.
- Saídas: Análise de campanhas, investimento e eventos nomeados, sem inferir cartões.

Este é o enquadramento do processo. O contrato específico e os parâmetros estão no SKILL.md da origem.

## Tamanho e contexto

- Tamanho do ZIP: 7496 bytes.
- Instruções iniciais: aproximadamente 3024 tokens.
- Instruções com todas as referências: aproximadamente 3862 tokens.
- Método: caracteres / 4; scripts e binários não entram nos tokens. Leia somente as referências pertinentes. A tokenização real varia por modelo.

## Dependências e limites

- Processo: Mídia paga.
- Destinos das instruções: claude-code, codex, cowork, chatgpt.
- Execução por ambiente: não certificada nesta publicação. Leia ferramentas, bibliotecas e permissões exigidas na origem.
- A instalação não autoriza escrita, envio, ingestão ou publicação de dados. Respeite os limites do procedimento e a autorização da tarefa.
- Baixe somente esta skill pelo botão Baixar ZIP e mantenha a pasta completa.

## Exemplo de pedido

“Leia a skill gaas-midia-report, confira os pré-requisitos e aplique ao meu pedido com as fontes fornecidas. Informe entradas ausentes e limites antes de executar.”

## Origem e versão

- Versão: 1.0.0.
- Origem: claude-projeto.
- Licença/autorização: Distribuição pública autorizada pelo titular; sem concessão adicional de licença.

[Implementação e instruções na origem](https://github.com/growthafinz/GaaS-Framework-Afinz/tree/main/.claude/skills/gaas-midia-report)

# Histórico

## 1.0.0 (2026-10-30)

- Consolidação pública a partir de claude-projeto.
- Fonte canônica no repositório GaaS; arquivos auxiliares preservados.
- Empacotamento não certifica execução em cada IA.


## Conexões

[[Catalogo-de-Skills]] · [[Skills-e-Disponibilidade-por-IA]]
