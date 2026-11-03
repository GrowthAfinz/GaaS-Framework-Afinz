---
title: 'Skill: gaas-funil-aquisicao-ingest'
tags:
  - ia
  - skills
  - gaas
tipo: skill
camada: ia
atualizado: '2026-10-30'
status: confirmado
fonte: catalogo-versionado-github
skill_id: gaas-funil-aquisicao-ingest
---

# Skill: gaas-funil-aquisicao-ingest

Atualiza as ingestões dos dashes do Funil de Aquisição (GaaS) a partir de um export cru colado do Excel/Sheets ou de um arquivo. Cobre (1) funil Serasa/Neurotech BI → arquivo public/data/serasa-funnel-daily.csv; (2) funil App Afinz → arquivo public/data/app-afinz-funnel-raw.tsv; (3) funil API Serasa marketplace (export "Sum of Qt oferta" com Ofertas/Pedidos/Confirmados/Aprovados) → tabela Supabase serasa_marketplace_daily_funnel. Detecta qual é pelo cabeçalho, converte pro formato/schema exato, valida (checksum no Serasa, merge-sem-regressão no App Afinz, constraints de funil decrescente no marketplace). Use quando o usuário colar/enviar um export do funil Serasa, App Afinz ou "API Serasa BI", pedir "atualizar funil de aquisição", "subir export do funil", "subir no funil api serasa", "atualizar os dashes de aquisição", ou destravar um funil parado. NÃO cobre o funil de Mídia Paga (esse lê Supabase direto, view v_b2c_app_install_daily).

## Caso de uso

Atualiza as ingestões dos dashes do Funil de Aquisição (GaaS) a partir de um export cru colado do Excel/Sheets ou de um arquivo. Cobre (1) funil Serasa/Neurotech BI → arquivo public/data/serasa-funnel-daily.csv; (2) funil App Afinz → arquivo public/data/app-afinz-funnel-raw.tsv; (3) funil API Serasa marketplace (export "Sum of Qt oferta" com Ofertas/Pedidos/Confirmados/Aprovados) → tabela Supabase serasa_marketplace_daily_funnel. Detecta qual é pelo cabeçalho, converte pro formato/schema exato, valida (checksum no Serasa, merge-sem-regressão no App Afinz, constraints de funil decrescente no marketplace). Use quando o usuário colar/enviar um export do funil Serasa, App Afinz ou "API Serasa BI", pedir "atualizar funil de aquisição", "subir export do funil", "subir no funil api serasa", "atualizar os dashes de aquisição", ou destravar um funil parado. NÃO cobre o funil de Mídia Paga (esse lê Supabase direto, view v_b2c_app_install_daily).

## Entradas e saídas

- Entradas: Arquivo de origem e contrato de campos, período e granularidade.
- Saídas: Simulação/diff auditável e aplicação somente quando autorizada.

Este é o enquadramento do processo. O contrato específico e os parâmetros estão no SKILL.md da origem.

## Tamanho e contexto

- Tamanho do ZIP: 10969 bytes.
- Instruções iniciais: aproximadamente 2842 tokens.
- Instruções com todas as referências: aproximadamente 2842 tokens.
- Método: caracteres / 4; scripts e binários não entram nos tokens. Leia somente as referências pertinentes. A tokenização real varia por modelo.

## Dependências e limites

- Processo: Ingestão de dados.
- Destinos das instruções: claude-code, codex, cowork, chatgpt.
- Execução por ambiente: não certificada nesta publicação. Leia ferramentas, bibliotecas e permissões exigidas na origem.
- A instalação não autoriza escrita, envio, ingestão ou publicação de dados. Respeite os limites do procedimento e a autorização da tarefa.
- Baixe somente esta skill pelo botão Baixar ZIP e mantenha a pasta completa.

## Exemplo de pedido

“Leia a skill gaas-funil-aquisicao-ingest, confira os pré-requisitos e aplique ao meu pedido com as fontes fornecidas. Informe entradas ausentes e limites antes de executar.”

## Origem e versão

- Versão: 1.0.0.
- Origem: claude-projeto.
- Licença/autorização: Distribuição pública autorizada pelo titular; sem concessão adicional de licença.

[Implementação e instruções na origem](https://github.com/growthafinz/GaaS-Framework-Afinz/tree/main/.claude/skills/gaas-funil-aquisicao-ingest)

# Histórico

## 1.0.0 (2026-10-30)

- Consolidação pública a partir de claude-projeto.
- Fonte canônica no repositório GaaS; arquivos auxiliares preservados.
- Empacotamento não certifica execução em cada IA.


## Conexões

[[Catalogo-de-Skills]] · [[Skills-e-Disponibilidade-por-IA]]
