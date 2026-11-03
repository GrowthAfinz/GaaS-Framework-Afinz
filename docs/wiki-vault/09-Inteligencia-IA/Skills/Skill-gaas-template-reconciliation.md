---
title: 'Skill: gaas-template-reconciliation'
tags:
  - ia
  - skills
  - gaas
tipo: skill
camada: ia
atualizado: '2026-10-30'
status: confirmado
fonte: catalogo-versionado-github
skill_id: gaas-template-reconciliation
---

# Skill: gaas-template-reconciliation

Reconciliar governança XLSX de links/templates Afinz, imagens, pacotes SFMC, catálogo e activities por conteúdo, público, posição e data; preparar propostas auditáveis e uma fila compacta de aprovação. Usar ao analisar template_id versus comunicação e uso histórico, ou especificar inteligência da aba Comunicações. Não executa mudanças no SFMC nem aplica vínculos por iniciativa própria.

## Caso de uso

Reconciliar governança XLSX de links/templates Afinz, imagens, pacotes SFMC, catálogo e activities por conteúdo, público, posição e data; preparar propostas auditáveis e uma fila compacta de aprovação. Usar ao analisar template_id versus comunicação e uso histórico, ou especificar inteligência da aba Comunicações. Não executa mudanças no SFMC nem aplica vínculos por iniciativa própria.

## Entradas e saídas

- Entradas: Peças, texto, planilha de governança e identidades de template e disparo.
- Saídas: Copy, metadados, reconciliação ou proposta revisável conforme a skill.

Este é o enquadramento do processo. O contrato específico e os parâmetros estão no SKILL.md da origem.

## Tamanho e contexto

- Tamanho do ZIP: 28618 bytes.
- Instruções iniciais: aproximadamente 1715 tokens.
- Instruções com todas as referências: aproximadamente 8599 tokens.
- Método: caracteres / 4; scripts e binários não entram nos tokens. Leia somente as referências pertinentes. A tokenização real varia por modelo.

## Dependências e limites

- Processo: Comunicações.
- Destinos das instruções: claude-code, codex, cowork, chatgpt.
- Execução por ambiente: não certificada nesta publicação. Leia ferramentas, bibliotecas e permissões exigidas na origem.
- A instalação não autoriza escrita, envio, ingestão ou publicação de dados. Respeite os limites do procedimento e a autorização da tarefa.
- Baixe somente esta skill pelo botão Baixar ZIP e mantenha a pasta completa.

## Exemplo de pedido

“Leia a skill gaas-template-reconciliation, confira os pré-requisitos e aplique ao meu pedido com as fontes fornecidas. Informe entradas ausentes e limites antes de executar.”

## Origem e versão

- Versão: 1.0.1.
- Origem: claude-projeto.
- Licença/autorização: Distribuição pública autorizada pelo titular; sem concessão adicional de licença.

[Implementação e instruções na origem](https://github.com/growthafinz/GaaS-Framework-Afinz/tree/main/.claude/skills/gaas-template-reconciliation)

# Histórico

## 1.0.1 (2026-10-30)

- Metadados de interface convertidos de Windows-1252 para UTF-8.

## 1.0.0 (2026-10-30)

- Consolidação pública a partir de claude-projeto.
- Fonte canônica no repositório GaaS; arquivos auxiliares preservados.
- Empacotamento não certifica execução em cada IA.


## Conexões

[[Catalogo-de-Skills]] · [[Skills-e-Disponibilidade-por-IA]]
