---
tags: [engenharia, gaas, dispatch]
tipo: engenharia
camada: codigo
tipo_diataxis: reference
atualizado: 2026-06-08
status: legado
fonte: codigo-gaas
status_original: confirmado
legado_desde: 2026-10-29
---

# Modal de Disparo

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver a documentação do repositório (`calendar-estrategico/docs/`) e o [[08-Engenharia/MOC-Engenharia|MOC de engenharia]].

O `ProgramarDisparoModal` (`src/components/dispatch/ProgramarDisparoModal.tsx`) é a peça mais densa do produto: o formulário onde o operador programa um disparo e recebe **projeções de IA por campo** em tempo real. Materializa o [[Pilar-Automação-por-Histórico]].

> 📊 Snapshot 2026-06-08: `src/components/dispatch/` tem ~30 arquivos, organizados em `blocks/`, `wizard/`, `sections/`, `ai/`, `charts/`, `form/`, `hooks/`, `context/`.

## Arquitetura em camadas

### 1. Estado — `DispatchFormContext`
`src/components/dispatch/context/DispatchFormContext.tsx`. Provider que centraliza `DispatchFormData` e a lógica de auto-preenchimento. Importa:
- Constantes/helpers de `constants/frameworkFields` (`CUSTO_UNITARIO_CANAL`, `generateSafra`, `calculateOrdemDisparo`, `suggestActivityName`, `calcularCustoTotalCampanha`, `BU_SEGMENTO_MAP`, `SEGMENTO_CONTEXT_MAP`, `OFERTA_DETALHE_MAP`).
- `suggestFieldsBasedOnHistory` (`utils/intelligentSuggestions`).
- `getAIOrchestrator` ([[Pipeline-ML]]).

**Conceito-chave: `ProjectionReadiness`** (`insufficient | partial | good | excellent`). O contexto só considera projeções "cientificamente válidas" se os 4 campos críticos existirem: `bu`, `segmento`, `canal`, `baseVolume > 0`. Campos adicionais (oferta, jornada, perfil, parceiro, produto) elevam o nível de `good`→`excellent`. Os pesos comentados (`15% BU`, `15% Segmento`, `12% Canal`, `10% Jornada`…) espelham os `SimilarityWeights` do similarityEngine.

### 2. Blocos do formulário (`blocks/`)
Arquitetura de blocos conforme CLAUDE.md:
- `IdentificationBlock` — BU, Campanha/Segmento, Jornada, Canal
- `ScheduleBlock` — datas, horário, frequência
- `ProductOfferBlock` — ofertas, promocionais, produto
- `InvestmentBlock` — volume, custos, investimento
- `AIProjectionBlock` — projeções e recomendações
- `shared.tsx` — primitivos compartilhados

### 3. Wizard alternativo (`wizard/`)
**Não documentado no CLAUDE.md**: existe um fluxo **wizard** paralelo aos blocks — `Step1BU`, `Step2Campaign`, `Step3SharedData`, `Step4Dispatches`, mais `JornadaCreatorModal` e um `tsvGenerator.ts` (gera TSV de disparos, provavelmente para colar no Salesforce/planilha).
> ⚠️ A validar: blocks vs wizard — os dois fluxos coexistem ativos, ou o wizard é a evolução que substitui os blocks? Qual é o caminho oficial do usuário hoje?

### 4. Inputs inteligentes (`form/`)
- `SmartSelect` — SELECT alimentado pelo histórico (padrão exigido pelo pilar: **SELECT, não input+datalist**).
- `SmartInput` — input com sugestões.

### 5. Projeção AI (`ai/`, `hooks/`)
- `useFieldProjection` (`dispatch/hooks/`) — chama o `AIOrchestrator`.
- `FieldProjectionTooltip`, `ConfidenceBar`, `CausalFactorsList`, `SimilarCampaignsList` — UI das projeções.
- `charts/` — `PerformanceTimelineChart`, `ComparativeAnalysisChart` (Fase 2, fev/2026).

## Auto-cálculo (de `constants/frameworkFields.ts`)
- **Custo por canal**: E-mail/Push R$0,001 · SMS R$0,064 · WhatsApp R$0,420.
- **Custo por oferta** (`OFFER_UNIT_COSTS`/`CUSTO_UNITARIO_OFERTA`): **todos 0.00** (com TODO para Anuidade/Test_Drive). Ver [[Dívida-Técnica]].
- `generateSafra` (último disparo do segmento + 1 mês), `calculateOrdemDisparo` (editável), `suggestActivityName` (taxonomia `BU_CAMP_JORNADA_ORD_SAFRA`).
- Mapas hierárquicos: `BU_SEGMENTO_MAP`, `SEGMENTO_CONTEXT_MAP` guiam quais opções aparecem por contexto.

## Relacionado
- [[Pipeline-ML]]
- [[Pilar-Automação-por-Histórico]]
- [[Hooks-Catálogo]]
- [[Componentes-por-Aba]]
- [[Dívida-Técnica]]
- [[MOC-Engenharia]]
