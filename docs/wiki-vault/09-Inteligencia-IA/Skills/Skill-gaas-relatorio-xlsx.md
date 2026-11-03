---
title: 'Skill: gaas-relatorio-xlsx'
tags:
  - ia
  - skills
  - gaas
tipo: skill
camada: ia
atualizado: '2026-10-30'
status: confirmado
fonte: catalogo-versionado-github
skill_id: gaas-relatorio-xlsx
---

# Skill: gaas-relatorio-xlsx

Build, extend, or improve the in-app XLSX report exporters behind the GaaS "Relatório" tab (calendar-estrategico React/TS app). Covers adding a new export button + workbook, adding a new sheet/section to an existing report, adding MoM (month-over-month) comparison, and reusing the shared ExcelJS report helpers. Use this whenever the user asks to create/expand/melhorar a planilha or relatório exportável, add a new report view/aba/sheet, add MoM/comparison columns, wire a new "Exportar XLSX" button in RelatorioView, or work with crmAquisicaoMonthlyReportExport / midiaPagaMonthlyReportExport / aquisicaoCrmExcelExport / rentabilizacaoCrmExcelExport. Trigger even when the user only says "expandir os xlsx do relatório", "outra visão da planilha", or names a Supabase table (activities, paid_media_metrics, b2c_daily_metrics) as a report source.

## Caso de uso

Build, extend, or improve the in-app XLSX report exporters behind the GaaS "Relatório" tab (calendar-estrategico React/TS app). Covers adding a new export button + workbook, adding a new sheet/section to an existing report, adding MoM (month-over-month) comparison, and reusing the shared ExcelJS report helpers. Use this whenever the user asks to create/expand/melhorar a planilha or relatório exportável, add a new report view/aba/sheet, add MoM/comparison columns, wire a new "Exportar XLSX" button in RelatorioView, or work with crmAquisicaoMonthlyReportExport / midiaPagaMonthlyReportExport / aquisicaoCrmExcelExport / rentabilizacaoCrmExcelExport. Trigger even when the user only says "expandir os xlsx do relatório", "outra visão da planilha", or names a Supabase table (activities, paid_media_metrics, b2c_daily_metrics) as a report source.

## Entradas e saídas

- Entradas: Fontes do período, recorte, métricas e modelo de saída solicitado.
- Saídas: Planilha, leitura de gestão ou relatório com cobertura e limitações.

Este é o enquadramento do processo. O contrato específico e os parâmetros estão no SKILL.md da origem.

## Tamanho e contexto

- Tamanho do ZIP: 15475 bytes.
- Instruções iniciais: aproximadamente 2055 tokens.
- Instruções com todas as referências: aproximadamente 7589 tokens.
- Método: caracteres / 4; scripts e binários não entram nos tokens. Leia somente as referências pertinentes. A tokenização real varia por modelo.

## Dependências e limites

- Processo: Relatórios.
- Destinos das instruções: claude-code, codex, cowork, chatgpt.
- Execução por ambiente: não certificada nesta publicação. Leia ferramentas, bibliotecas e permissões exigidas na origem.
- A instalação não autoriza escrita, envio, ingestão ou publicação de dados. Respeite os limites do procedimento e a autorização da tarefa.
- Baixe somente esta skill pelo botão Baixar ZIP e mantenha a pasta completa.

## Exemplo de pedido

“Leia a skill gaas-relatorio-xlsx, confira os pré-requisitos e aplique ao meu pedido com as fontes fornecidas. Informe entradas ausentes e limites antes de executar.”

## Origem e versão

- Versão: 1.0.0.
- Origem: claude-projeto.
- Licença/autorização: Distribuição pública autorizada pelo titular; sem concessão adicional de licença.

[Implementação e instruções na origem](https://github.com/growthafinz/GaaS-Framework-Afinz/tree/main/.claude/skills/gaas-relatorio-xlsx)

# Histórico

## 1.0.0 (2026-10-30)

- Consolidação pública a partir de claude-projeto.
- Fonte canônica no repositório GaaS; arquivos auxiliares preservados.
- Empacotamento não certifica execução em cada IA.


## Conexões

[[Catalogo-de-Skills]] · [[Skills-e-Disponibilidade-por-IA]]
