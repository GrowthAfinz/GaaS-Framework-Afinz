# TAB: Comunicações

**Rota:** Item próprio no menu de navegação principal, com dropdown de 2 sub-telas: **"Cadastro e Templates"** e **"Performance do Conteúdo"**
**Componente Principal:** `CommunicationsView.tsx` (`src/components/communications/`, 15 componentes)
**Categoria:** ANALISE (item de nav entre Análise e Mídia Paga)

---

> **Correção importante:** uma exploração de código anterior a este documento concluiu que Comunicações não tinha ponto de entrada de navegação (`activeTab` nunca seria setado por nenhum clique). **Isso foi verificado como incorreto em teste ao vivo em produção (2026-07-05)** — a feature está totalmente acessível via item "Comunicações" no menu principal, com dados reais carregando normalmente. A causa provável da divergência: a exploração de código não encontrou o registro do item no `navigation.ts`/`NAV_CONFIG` (que de fato não o lista), mas o item é renderizado por lógica adicional em `GlobalHeader.tsx`/`App.tsx` não capturada nessa exploração.

## Overview

Feature de governança de comunicações do CRM: costura os disparos executados (`activities`) aos templates de conteúdo (`communication_templates`), e mede a performance desses templates. ~40% implementada segundo as specs de design, mas a parte testada (Cadastro e Performance) está funcional em produção com dados reais.

Testado em produção com BU B2C: **Cadastro** (período de 1 mês, 6 disparos na fila) e **Performance** (período de 90 dias, 68 disparos, 13 templates, 2.517 mil de base acionada).

---

## Sub-tela: Cadastro e Templates

3 abas internas: **Fila de reconciliação**, **Templates sem peça**, **Auditoria**.

- **Fila de reconciliação:** lista disparos (`activities`) sem `template_id` vinculado, com cobertura visual ("Cobertura de Réguas CRM": X de Y disparos já com peça vinculada, em %). Cada item mostra canal, tipo (Pontual/Recorrente), base, execuções, data, e botões "Sugestões" / "+ Criar template".
- **Templates sem peça:** templates cadastrados mas sem asset (imagem/HTML) anexado.
- **Auditoria:** vínculos `activity_name` ↔ `template_id` para revisão.

Achado real (produção, período de 1 mês testado): 6 disparos na fila (100% "sem template"), 5 templates sem peça, 7 itens na auditoria. Em janela mais ampla, o volume de disparos sem `template_id` é muito maior (~5.100 de ~5.200 no dataset completo, segundo consulta ao Supabase feita durante o planejamento desta fase).

---

## Sub-tela: Performance do Conteúdo

Cockpit de performance por `template_id`, com **JOIN local** entre `activities` (resultado) e `communication_templates` (catálogo) — **sem AppsFlyer**.

Testado com BU B2C, período 90 dias: cockpit mostrou "Peça Campeã" (`b2c_email_copa_bsp_S3D01`, score 68), 68 disparos no período, 13 templates, 2 de 4 canais com dado, 2.517k de base acionada, 20,2% de engajamento médio (WhatsApp 49%, E-mail 20% de abertura). Insight automático gerado: "E-mail concentra 55 de 68 disparos no período".

Seções: cockpit de KPIs → gráfico "Volume de disparos" (execuções por dia, por canal) → "Ações sugeridas" (cards com recomendação, ex: "Revisar abertura de bb_email_copa_crm_S4D03") → distribuição por canal (WhatsApp/E-mail/Push/SMS, disparos e templates) → "Templates de maior sucesso" (ranking por score).

3 modos de visualização disponíveis: **Visão Geral**, **Galeria**, **Tabela**.

---

## Arquitetura de Componentes

```
CommunicationsView.tsx (roteador: mode 'cadastro' | 'performance')
│
├── [Cadastro e Templates]
│   ├── ReconciliationQueue.tsx (fila de reconciliação)
│   ├── TemplateCatalogView.tsx (templates sem peça / catálogo)
│   ├── ReconciliationAudit.tsx (auditoria)
│   ├── CommunicationUploadModal.tsx (vincular/criar template + upload de asset)
│   ├── TemplateComposerDrawer.tsx (criação/edição de template)
│   └── ActivityMomentModal.tsx, AddAssetModal.tsx, ActivityLinkManager.tsx, CadastroCobertura.tsx
│
└── [Performance do Conteúdo]
    ├── PerformanceView.tsx
    ├── TemplatePerformanceGrid.tsx
    ├── ChannelPreview.tsx
    └── CommunicationDetailModal.tsx
```

---

## Fluxo de Dados

```
Tabelas Supabase:
├── activities (disparos, coluna template_id como chave de vínculo)
├── communication_templates (canal, metadata — subject/preheader p/ e-mail, asset_path)
└── communication_slots (candidatos de recorrência p/ a fila de reconciliação)

Storage: bucket `crm-communications`
  paths: crm/{channel}/{template_id}/original.{ext} ou .../email.html

useTemplatePerformance.ts:
  query activities WHERE template_id IS NOT NULL
  → agrupa por template_id, soma KPIs (base, aberturas, cliques, cartões, propostas, custo)
  → calcula CTR, taxa de conversão, CAC, timeline diária
  → calcula período anterior automaticamente para deltas
```

---

## Casos de Uso

### 1. Vincular um disparo sem template a uma peça existente
1. Ir em Comunicações → Cadastro e Templates → Fila de reconciliação.
2. Localizar o disparo (filtro por BU/canal/segmento se disponível).
3. Clicar "Sugestões" para ver templates candidatos, ou "+ Criar template" para cadastrar um novo (sem asset).

### 2. Avaliar performance de conteúdo por canal
1. Ir em Comunicações → Performance do Conteúdo.
2. Selecionar BU e período (recomendado 90 dias para volume de templates suficiente).
3. Ler o cockpit (Peça Campeã, Disparos no Período, Base Acionada, Engajamento Médio) e a distribuição por canal.

### 3. Auditar vínculos activity↔template
1. Ir em Cadastro e Templates → Auditoria.
2. Revisar a lista de vínculos e identificar divergências.

---

## Gaps/Limitações Conhecidas

- ~40% implementada segundo o roadmap das specs — partes como upload real de asset e criação de template completa não foram exercitadas neste teste (evitou-se ação destrutiva/real em dado de produção).
- Roadmap declarado nas specs: aba pensada para ficar entre ANÁLISE e MÍDIA PAGA no nav — hoje já aparece nessa posição em produção.
- Specs de referência mais detalhadas (não duplicadas aqui): `docs/plans/COMMUNICATIONS_CLAUDE_DESIGN_BRIEF_CHANNELIZED_PERFORMANCE.md`, `docs/plans/COMMUNICATIONS_CONTENT_PERFORMANCE_V2_SPEC.md`, `docs/plans/ADR-002-identidade-comunicacoes-template-appsflyer.md`, e (fora deste repositório) `DESIGN_ABA_COMUNICACOES.md` / `PLANO_IMPLEMENTACAO_COMUNICACOES.md` em `ACALENDARIO APP/docs/`.

---

## Arquivos Relacionados

- `src/components/communications/CommunicationsView.tsx`
- `src/components/communications/ReconciliationQueue.tsx`
- `src/components/communications/performance/PerformanceView.tsx`
- `src/hooks/useTemplatePerformance.ts`
- `docs/plans/COMMUNICATIONS_CLAUDE_DESIGN_BRIEF_CHANNELIZED_PERFORMANCE.md`
- `docs/plans/COMMUNICATIONS_CONTENT_PERFORMANCE_V2_SPEC.md`
- `docs/plans/ADR-002-identidade-comunicacoes-template-appsflyer.md`

---

**Última Atualização:** 2026-07-05
