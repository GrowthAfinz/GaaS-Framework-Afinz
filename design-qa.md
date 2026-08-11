# Design QA — Auditoria AppsFlyer

- Source visual truth: `C:\Users\PABLOP~1\AppData\Local\Temp\codex-clipboard-fe639b32-0431-4400-b3e3-a9930c7da6bc.png`
- Implementation screenshot: `C:\Users\Pablo Prado\AppData\Local\Temp\appsflyer-audit-dashboard-full.png`
- Combined comparison: `C:\Users\Pablo Prado\AppData\Local\Temp\appsflyer-audit-comparison.png`
- Viewport: 1600 × 1000 CSS px; device scale 1; app global zoom 0.85.
- Source pixels: 265 × 176. Implementation pixels: 1600 × 1000.
- State: desktop, preview dataset, timeline and approval queue populated.

## Full-view comparison evidence

The source only defines the existing Communications navigation and visual language, not a target dashboard screen. The implementation therefore uses the existing GaaS typography, cyan accent, slate borders, compact cards, rounded panels and Lucide icon family. The new menu item follows the two existing items and the dashboard keeps the same density as Performance do Conteúdo.

## Focused-region comparison

Focused comparison was applied to navigation hierarchy, typography, border treatment, white/slate surfaces and cyan action styling. A pixel-identical screen comparison is not applicable because the source is a menu crop and the implementation is a new screen.

## Required fidelity surfaces

- Fonts and typography: existing app font stack and established sizes/weights reused; headings and compact metadata remain legible.
- Spacing and layout rhythm: 65/35 timeline/queue split, consistent 16–24 px section rhythm, responsive KPI grid and compact evidence cards.
- Colors and tokens: existing slate/cyan product palette preserved; segment colors and status shapes have separate semantics.
- Image quality and assets: no raster assets are required; icons come from the app's existing Lucide dependency.
- Copy and content: labels use operator language and distinguish observed, approved, shared and conflicting data.

## Interaction evidence

- Search reduced the queue from three cases to one.
- Selecting the D2→D4 case opened the evidence chain.
- Timeline markers expose accessible names for each Activity.
- Segment and status filters are native selects.
- Browser console contained no errors.

## Findings

No actionable P0/P1/P2 findings remain.

P3 follow-up: on narrower desktop widths the queue stacks below the chart; this is intentional to protect chart readability. The compact case IDs rely on tooltips/truncation for very long identifiers.

## Comparison history

- Pass 1: KPI strip overflowed at the default 1280 px viewport because the app applies a global 0.85 zoom. Fixed with a responsive 2/3/6-column KPI grid.
- Pass 2: verified at the user's desktop-like 1600 × 1000 viewport; timeline, queue, filters and evidence layout render without overlap or horizontal document overflow.

final result: passed

---

# Design QA — E-mail Dinâmico

- Referência: tela anterior fornecida pelo usuário, em 1907 × 759 px.
- Implementação: rota de desenvolvimento `#dynamic-email-preview`, validada no mesmo viewport.
- Estado: briefing PLURIX selecionado, painel editorial aberto e prévia local renderizada.

## Verificações

- A caixa de briefings ganhou largura, busca, filtros e hierarquia de caixa de entrada.
- O editor permanece como área principal; a prévia ficou mais estreita e continua legível.
- Os indicadores e comandos foram condensados em uma única barra, sem cartões redundantes.
- As seções do CSV respeitam a ordem do e-mail e podem ser minimizadas individualmente.
- A ação de duplicar cria uma nova linha, limpa a confirmação da jornada e força nova validação.
- Assunto, preheader, remetente de referência, destinatário de teste e contexto da campanha aparecem na prévia.
- Não há overflow horizontal no viewport validado.
- Não houve erro de console durante seleção, minimização ou duplicação.

## Resultado

final result: passed

## Iteração 2026-08-11 — header unificado e prévia modal

- O cabeçalho branco e a faixa separada de indicadores foram substituídos por um único header verde-petróleo, seguindo a referência de Cadastro e templates.
- Título, contexto, métricas, abas e ações ficam no mesmo bloco e a página abre diretamente no conteúdo operacional.
- A caixa de briefings foi ampliada e o editor limitado a uma largura mais compacta em uma grade de duas colunas.
- A prévia fixa foi removida e substituída por um modal central de foco, com dados de teste, metadados e fechamento por botão ou clique externo.
- Os contadores de preenchimento das seções foram removidos; as seções continuam minimizáveis.
- A exclusão usa confirmação explícita, informa qual briefing será removido e mantém a seleção em uma linha válida.
- Interações de abrir/fechar a prévia e abrir/cancelar a exclusão foram verificadas sem erros de console ou overflow horizontal.

final result: passed

## Iteração 2026-08-11 — três painéis e divisor persistente

- A caixa de briefings, o editor e a prévia voltaram a permanecer visíveis lado a lado.
- O header organiza Campanhas e Template-fonte acima das ações operacionais e não contém mais o comando de visualização.
- A prévia recuperou dados de teste, envelope, contexto e renderização completa; o botão Ampliar fica dentro do próprio painel.
- O divisor entre editor e prévia responde a arraste, setas do teclado e duplo clique para restaurar a proporção padrão.
- A proporção escolhida foi recarregada com sucesso após navegação, comprovando a persistência local por usuário.
- Performance do Conteúdo usa ícone analítico e E-mail Dinâmico foi renomeado para Fábrica de e-mails.
- Não houve overflow horizontal nem erros de console nas interações verificadas.

final result: passed
