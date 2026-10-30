# Auditoria Reference

The `Auditoria` sheet exists to make the workbook defensible. It should answer:

1. How many source rows were read?
2. How many rows were mapped into the report?
3. Which rows stayed out and why?
4. Which `jornada` and `Activity name / Taxonomia` fed each destination block?

## Required Sections

## Global Counts

Top-left summary:
- `Linhas fonte no período`
- `Linhas mapeadas no relatório`
- `Linhas fora do relatório`

## Unmapped Reason Summary

Top-right summary by reason:
- `Motivo`
- `Linhas`
- `Entregues`
- `Emitidos`
- `Aprovados`
- `Propostas`

For the current Copa acquisition report, only `Fora do escopo: Seguros/Rentabilizacao` should normally appear.

## Resumo dos Blocos Mapeados

Summarize every mapped block:
- `Seção`
- `Bloco`
- `Linhas`
- `Entregues`
- `Emitidos`
- `Aprovados`
- `Propostas`

This is the fastest way to check whether new Supabase rows moved the expected KPIs.

## Unmapped Detail

Keep one row per unmapped combination:
- `Motivo`
- `BU`
- `Parceiro`
- `Segmento`
- `Etapa`
- `Canal original`
- `Canal`
- `Linhas`
- `Entregues`
- `Emitidos`
- `Aprovados`
- `Propostas`

## Journey and Taxonomy Map

Keep one row per destination/journey/taxonomy combination:
- `Status/Motivo`
- `Seção`
- `Bloco`
- `BU`
- `Parceiro`
- `Segmento`
- `Etapa`
- `Canal`
- `Jornada`
- `Activity name / Taxonomia`
- `Linhas`
- `Entregues`
- `Emitidos`
- `Aprovados`
- `Propostas`

Use this section to debug questions like "which Journey names are assigned to each jornada/block?"
