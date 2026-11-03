---
title: Catálogo de Skills
tags: [ia, skills, gaas, governanca]
tipo: moc
camada: ia
atualizado: 2026-10-30
status: confirmado
fonte: catalogo-versionado-github
---

# Catálogo de Skills

Biblioteca em **Aprendizado e Memória → Trabalhar com IA → Skills**, depois de Contribuições.

## Operação

- 35 skills próprias do time.
- Download individual: cada card informa tamanho e contexto estimado, com detalhes recolhidos. Não há download de todo o acervo.
- Busca e filtros por processo e IA.
- **Adicionar nova skill:** enviar ZIP de uma skill, processo, versão e credencial GitHub com escrita neste repositório. O navegador valida o pacote e grava um commit na main.
- **Excluir:** digitar o nome para confirmar; remove todos os arquivos do pacote. O histórico Git é preservado.
- As duas skills que sustentam o contrato do loop exigem remover suas dependências em código antes da exclusão.
- A credencial fica somente na memória da tela e vai diretamente à API do GitHub. Não é salva no navegador, Supabase ou repositório. Nenhum nível de acesso adicional foi criado no catálogo.
- Uma alteração na main aparece após validação e deploy do GitHub Pages. Em caso de edição concorrente, a operação é recusada sem sobrescrever a main.
- Pacotes e binários ficam no GitHub/Pages, sem cópia no Supabase Storage.
- Tokens estimados por caracteres / 4, separados entre SKILL.md e referências Markdown. Binários não contam como tokens. Compatibilidade listada não certifica execução por ambiente.

## Manutenção

A fonte canônica dos pacotes próprios é .claude/skills no repositório público. O prebuild gera catalog.json, ZIPs individuais e fichas. Para atualizar este vault, executar scripts/skills/export-skills-vault.mjs --vault <pasta-do-vault>, recompilar a ontologia e sincronizar somente as fichas geradas com preservação das outras notas da Wiki. Adicionar/excluir pelo app atualiza o catálogo público após deploy; a cópia local do Obsidian e a projeção Wiki exigem esta sincronização explícita.

## Decisões de consolidação

- afinz-pptx: instruções do Cowork com referências e templates do projeto.
- growth-saas-marketing-cloud: versão do Codex.
- gaas-template-reconciliation: versão do Claude de 29/10.
- gaas-governanca-comunicacoes: incorpora scripts e regras da gaas-communication-governance; preserva a caixa exata de template_id/af_sub3.
- gaas-loop aposentada: Fila em gaas-growth-loop-operator; referência histórica de render em report-live-release-engineer.
- Autorizada em 30/10/2026 a publicação integral dos PPTX, inclusive o exemplo Visa Copa. Publicação não transfere direitos de marcas/terceiros.

## Skills por processo

### Análise CRM

- [[Skill-crm-dispatch-intelligence|crm-dispatch-intelligence]]
- [[Skill-gaas-insight-engine|gaas-insight-engine]]
- [[Skill-growth-brain-intelligence-engine|growth-brain-intelligence-engine]]
- [[Skill-segment-performance-analyst|segment-performance-analyst]]

### Apresentações

- [[Skill-afinz-pptx|afinz-pptx]]
- [[Skill-afinz-pptx-campanha|afinz-pptx-campanha]]
- [[Skill-storytellingfiltergaas|storytellingfiltergaas]]

### Comunicações

- [[Skill-afinz-copy-aquisicao|afinz-copy-aquisicao]]
- [[Skill-crm-communication-enricher|crm-communication-enricher]]
- [[Skill-gaas-governanca-comunicacoes|gaas-governanca-comunicacoes]]
- [[Skill-gaas-template-reconciliation|gaas-template-reconciliation]]

### Contexto para IA

- [[Skill-gaas-growth-context|gaas-growth-context]]

### Ingestão de dados

- [[Skill-b2c-originacao-updater|b2c-originacao-updater]]
- [[Skill-gaas-activities-csv-ingest|gaas-activities-csv-ingest]]
- [[Skill-gaas-funil-aquisicao-ingest|gaas-funil-aquisicao-ingest]]

### Loop

- [[Skill-gaas-growth-investigation|gaas-growth-investigation]]
- [[Skill-gaas-growth-loop-operator|gaas-growth-loop-operator]]

### Mídia paga

- [[Skill-gaas-midia-report|gaas-midia-report]]
- [[Skill-meta-ads-remote|meta-ads-remote]]
- [[Skill-paid-media-campaign-analyst|paid-media-campaign-analyst]]

### Planejamento de disparo

- [[Skill-gaas-momento-disparo|gaas-momento-disparo]]

### Produto

- [[Skill-growth-saas-marketing-cloud|growth-saas-marketing-cloud]]
- [[Skill-produtos-afinz|produtos-afinz]]

### Qualidade e mensuração

- [[Skill-growth-data-quality-monitor|growth-data-quality-monitor]]
- [[Skill-measurement-attribution-auditor|measurement-attribution-auditor]]

### Relatórios

- [[Skill-afinz-crm-diarizado|afinz-crm-diarizado]]
- [[Skill-copa-crm-parser|copa-crm-parser]]
- [[Skill-diarizado-pacing|diarizado-pacing]]
- [[Skill-gaas-relatorio-xlsx|gaas-relatorio-xlsx]]
- [[Skill-growth-report-operator|growth-report-operator]]

### Report Live

- [[Skill-report-live-release-engineer|report-live-release-engineer]]

### SFMC

- [[Skill-emails-dinamicos-sfmc|emails-dinamicos-sfmc]]
- [[Skill-gaas-emails-plurix|gaas-emails-plurix]]
- [[Skill-sfmc-acquisition-email-designer|sfmc-acquisition-email-designer]]
- [[Skill-sfmc-jornadas-pacote|sfmc-jornadas-pacote]]

## Relacionado

[[Skills-do-Projeto]] · [[Skills-e-Disponibilidade-por-IA]] · [[MOC-Inteligencia-IA]]
