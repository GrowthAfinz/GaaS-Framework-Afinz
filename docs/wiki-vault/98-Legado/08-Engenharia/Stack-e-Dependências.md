---
tags: [engenharia, gaas, stack]
tipo: engenharia
camada: codigo
tipo_diataxis: reference
atualizado: 2026-06-08
status: legado
fonte: codigo-gaas
status_original: confirmado
legado_desde: 2026-10-29
---

# Stack e Dependências

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver a documentação do repositório (`calendar-estrategico/docs/`) e o [[08-Engenharia/MOC-Engenharia|MOC de engenharia]].

A lista completa de bibliotecas, versões e detalhe técnico vive no repo: [`calendar-estrategico/docs/reference/stack.md`](../../calendar-estrategico/docs/reference/stack.md).

Esta nota fica só com o racional de negócio por trás das escolhas centrais:

- **Supabase como único backend + tudo client-side** (incluindo o pipeline de "IA") — decisão deliberada para uma operação de growth sem time de backend, priorizando velocidade de evolução. Ver [[Decisões-Técnicas]] e [[Arquitetura-Geral]].
- **Zustand (dados/aba ativa) + React Context (período/BU selecionada) coexistem** — divisão que evoluiu organicamente e hoje exige fundir os dois em `App.tsx` antes de filtrar qualquer view. Fonte de confusão registrada em [[Modelo-de-Estado]] e [[Dívida-Técnica]].
- **Dependências candidatas a revisão** (risco técnico, não de negócio, mas vale saber que existem): `react-beautiful-dnd` (descontinuada), sobreposição `xlsx`/`exceljs`, `playwright` instalado sem suíte de testes clara. Detalhe em [[Dívida-Técnica]].

## Relacionado
- [[Arquitetura-Geral]]
- [[Modelo-de-Estado]]
- [[Decisões-Técnicas]]
- [[Dívida-Técnica]]
- [[MOC-Engenharia]]
