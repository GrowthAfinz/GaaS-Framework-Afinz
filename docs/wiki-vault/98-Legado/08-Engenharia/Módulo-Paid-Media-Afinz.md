---
tags: [engenharia, gaas, midia]
tipo: engenharia
camada: codigo
tipo_diataxis: explanation
atualizado: 2026-06-08
status: legado
fonte: codigo-gaas
status_original: confirmado
legado_desde: 2026-10-29
---

# Módulo Paid Media Afinz

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver a documentação do repositório (`calendar-estrategico/docs/`) e o [[08-Engenharia/MOC-Engenharia|MOC de engenharia]].

**Definição:** o **mini-app auto-contido** de Media Analytics (`src/modules/paid-media-afinz/`) — renderizado **fora** do `MainLayout`, em full-screen, com identidade visual própria (logo Afinz, fonte Calibri Bold).

## Por que é isolado
Diferente do resto do GaaS (que compartilha layout/estado), o módulo de mídia tem seus próprios `components/`, `context/`, `hooks/`, `utils/`, `types/` e `assets/`. É um produto dentro do produto — facilita evoluir mídia sem tocar no CRM. Ver [[Componentes-por-Aba]].

## Estrutura
- `PaidMediaAfinzApp.tsx` — entry point (aba `midia-paga`, fora do MainLayout, com botão "voltar").
- `components/` — InsightsPanel, Modals, Table, Tabs.
- `AfinzLogo.tsx` — logo com Canvas (barra teal `#00C6CC` centralizada no "z").
- Lê [[paid_media_metrics]], [[ad_creatives]], [[paid_media_insights]]; correlação em `useMediaCorrelation`.

> ⚠️ Redundância: existe também `src/components/paid-media/` (3 componentes) coexistindo com este módulo — ver [[Convenções-de-Código]] e [[Dívida-Técnica]].

## Relacionado
- [[Mídia-Analytics]] · [[Componentes-por-Aba]] · [[Integração-Mídia-Paga]] · [[Dívida-Técnica]] · [[MOC-Engenharia]]
