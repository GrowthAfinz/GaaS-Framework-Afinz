---
title: 'Skill: gaas-governanca-comunicacoes'
tags:
  - ia
  - skills
  - gaas
tipo: skill
camada: ia
atualizado: '2026-10-30'
status: confirmado
fonte: catalogo-versionado-github
skill_id: gaas-governanca-comunicacoes
---

# Skill: gaas-governanca-comunicacoes

Lê a planilha de governança de links/templates do CRM (GOVERNANÇA_LINKS_E_TEMPLATES, CSV ';' latin-1), cruza os ID TEMPLATE (af_sub3) com os ACTIVITY NAME e com o Supabase (activities + communication_templates), valida a taxonomia (detecta activity_name copiado entre apps e divergência de marca) e — após aprovação — pré-cria os templates como 'draft' (sem asset) e vincula activities.template_id. Use quando o usuário pedir para importar/interpretar a planilha de governança de templates, cruzar template_id com activity_name, ou preparar a fila de cadastro de comunicações para só subir o asset.

## Caso de uso

Lê a planilha de governança de links/templates do CRM (GOVERNANÇA_LINKS_E_TEMPLATES, CSV ';' latin-1), cruza os ID TEMPLATE (af_sub3) com os ACTIVITY NAME e com o Supabase (activities + communication_templates), valida a taxonomia (detecta activity_name copiado entre apps e divergência de marca) e — após aprovação — pré-cria os templates como 'draft' (sem asset) e vincula activities.template_id. Use quando o usuário pedir para importar/interpretar a planilha de governança de templates, cruzar template_id com activity_name, ou preparar a fila de cadastro de comunicações para só subir o asset.

## Entradas e saídas

- Entradas: Peças, texto, planilha de governança e identidades de template e disparo.
- Saídas: Copy, metadados, reconciliação ou proposta revisável conforme a skill.

Este é o enquadramento do processo. O contrato específico e os parâmetros estão no SKILL.md da origem.

## Tamanho e contexto

- Tamanho do ZIP: 77352 bytes.
- Instruções iniciais: aproximadamente 1270 tokens.
- Instruções com todas as referências: aproximadamente 4499 tokens.
- Método: caracteres / 4; scripts e binários não entram nos tokens. Leia somente as referências pertinentes. A tokenização real varia por modelo.

## Dependências e limites

- Processo: Comunicações.
- Destinos das instruções: claude-code, codex, cowork, chatgpt.
- Execução por ambiente: não certificada nesta publicação. Leia ferramentas, bibliotecas e permissões exigidas na origem.
- A instalação não autoriza escrita, envio, ingestão ou publicação de dados. Respeite os limites do procedimento e a autorização da tarefa.
- Baixe somente esta skill pelo botão Baixar ZIP e mantenha a pasta completa.

## Exemplo de pedido

“Leia a skill gaas-governanca-comunicacoes, confira os pré-requisitos e aplique ao meu pedido com as fontes fornecidas. Informe entradas ausentes e limites antes de executar.”

## Origem e versão

- Versão: 1.0.0.
- Origem: claude-projeto.
- Licença/autorização: Distribuição pública autorizada pelo titular; sem concessão adicional de licença.

[Implementação e instruções na origem](https://github.com/growthafinz/GaaS-Framework-Afinz/tree/main/.claude/skills/gaas-governanca-comunicacoes)

# Histórico

## 1.0.0 (2026-10-30)

- Consolidação pública a partir de claude-projeto.
- Fonte canônica no repositório GaaS; arquivos auxiliares preservados.
- Empacotamento não certifica execução em cada IA.
- Integra regras e scripts de gaas-communication-governance; preserva caixa exata da identidade.


## Conexões

[[Catalogo-de-Skills]] · [[Skills-e-Disponibilidade-por-IA]]
