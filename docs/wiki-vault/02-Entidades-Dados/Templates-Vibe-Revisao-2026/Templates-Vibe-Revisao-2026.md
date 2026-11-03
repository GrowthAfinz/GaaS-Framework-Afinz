---
tags: [evidencia, templates, vibe, historico]
tipo: evidencia
camada: dados
atualizado: 2026-10-02
status: confirmado
fonte: codigo-gaas
---

# Templates Vibe — Revisão 2026

**Definição:** entrada para o acervo histórico extraído da planilha `REVISÃO VIBE.xlsx` de 17/08/2026, usado como evidência de mensagens, templates e réguas.

## Conteúdo e uso

O README do acervo registra 61 imagens analisadas e seus nomes Salesforce, contexto de planilha, oferta, copy, CTA, ativos, personalização e sinais de QA. O dataset e a estrutura BAU estão nos arquivos `dataset_vibe_completo.json` e `estrutura_bau_regua.json` desta pasta canônica.

Usar como exemplo de linguagem, comparação de peça e investigação de variantes. Para detalhes metodológicos e cobertura, abrir [[02-Entidades-Dados/Templates-Vibe-Revisao-2026/README.md|README do acervo]].

## Limites e lacunas

É um snapshot, sem sincronização automática com a planilha viva. Nome de template na planilha é candidato à reconciliação, não vínculo confirmado em `communication_templates`. A BAU marcada a validar representa planejamento, não envio observado. Benefícios precisam ser revistos em [[Beneficios-e-Vigencia]] antes de reutilizar uma peça. JSONs e anexos ficam no vault local; o reader publica Markdown.

## Relacionado

- [[Galeria-de-Templates]] · [[Reguas-Inteligentes-Arquitetura]] · [[Amostras-Comunicacoes-Reais]]
- [[Fontes-e-Proveniencia-Growth]] · [[communication_templates]]
