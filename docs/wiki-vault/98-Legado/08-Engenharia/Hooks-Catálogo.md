---
tags: [engenharia, gaas, hooks]
tipo: engenharia
camada: codigo
tipo_diataxis: reference
atualizado: 2026-06-08
status: legado
fonte: codigo-gaas
status_original: confirmado
legado_desde: 2026-10-29
---

# Hooks — Catálogo

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver a documentação do repositório (`calendar-estrategico/docs/`) e o [[08-Engenharia/MOC-Engenharia|MOC de engenharia]].

O catálogo completo de hooks (assinatura, parâmetros, o que cada um consome/expõe) vive no repo: [`calendar-estrategico/docs/reference/hooks.md`](../../calendar-estrategico/docs/reference/hooks.md). Passam de 30 hooks hoje (CLAUDE.md ainda diz "20+" — drift documentado lá).

Para quem lê pela lente de negócio, os hooks mais relevantes são:

- **`useFrameworkData`** — porta de entrada de todo dado do Framework (CSV/Supabase). Se algo está "faltando" numa view, o problema provavelmente começa aqui.
- **`useAdvancedFilters`** — coração da filtragem multidimensional (BU/canal/jornada/segmento/parceiro/subgrupo); reusado em quase toda a aplicação.
- **`useRecommendationEngine`** e **`useFieldProjection`** — a camada de "inteligência" que o operador percebe (scores, projeções no modal de disparo). **Atenção**: `useRecommendationEngine` usa baselines de CAC/conversão **hardcoded** (não vêm de metas reais) — ver [[Dívida-Técnica]] antes de confiar cegamente num score.

## Relacionado
- [[Arquitetura-Geral]]
- [[Camada-de-Serviços]]
- [[Pipeline-ML]]
- [[Modal-de-Disparo]]
- [[Dívida-Técnica]]
- [[MOC-Engenharia]]
