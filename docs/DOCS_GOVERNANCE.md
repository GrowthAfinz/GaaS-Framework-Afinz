# Governança da Documentação — Repo vs. Vault

## TL;DR

- **Se a resposta muda dependendo de como o código está implementado → vive aqui, em `calendar-estrategico/docs/`.**
- **Se a resposta muda dependendo do que o negócio precisa decidir → vive no vault Obsidian, em `Afinz-CRM-Midia-Vault/08-Engenharia/`.**
- Nenhum conteúdo deve existir em extenso nos dois lugares. Um dos dois é sempre a fonte; o outro tem no máximo um parágrafo-resumo + link.

## O teste das 3 perguntas

Ao decidir onde documentar algo, pergunte nesta ordem:

1. **Precisa abrir um arquivo `.ts`/`.tsx` para confirmar a informação?** Se sim → **repo**.
2. **Faria sentido para alguém que nunca vai ler uma linha de código** (analista de growth, IA de insight/Growth Brain)? Se sim → **vault**.
3. **É um fato de negócio (CAC-alvo, canal, segmento, meta) que só *se conecta* ao sistema, mas não descreve como ele foi construído?** → **vault**, com link de volta para o doc de repo relevante.

## Exemplos

| Conteúdo | Local | Por quê |
|---|---|---|
| Como o `useAdvancedFilters` calcula contagem facetada | repo `docs/reference/hooks.md` | detalhe de implementação |
| O que a aba Jornada & Disparos permite o operador decidir, e como conecta ao CAC-Ótimo | vault `08-Engenharia` | conecta função do sistema a decisão de negócio |
| Schema completo do Supabase (tabelas, colunas, tipos) | repo `docs/reference/supabase-schema.md` | referência técnica pura |
| Por que a Função-Objetivo usa CAC-Ótimo por safra e não CAC mínimo | vault `05-Estrategia` / `08-Engenharia` | decisão de negócio (ainda que implementada em código) |
| Árvore de componentes por aba | repo `docs/reference/tabs/` (fonte) — vault vira resumo + link |
| Como rodar o projeto localmente / fazer deploy | repo `docs/tutorials/` e `docs/how-to/` | operação de dev |
| Decisões técnicas (ex: por que Zustand + Context) | repo `docs/explanation/` (fonte); vault pode ter nota-síntese de poucas linhas com link, se for relevante para growth |

## Onde cada tipo Diátaxis mora

| Tipo Diátaxis | Repo (`docs/`) | Vault (`08-Engenharia/`) |
|---|---|---|
| Tutorial | Sim (`docs/tutorials/`) | Não — o vault não hospeda tutoriais técnicos |
| How-to | Sim (`docs/how-to/`) | Não — how-to técnico de dev fica só no repo |
| Reference | Sim (`docs/reference/`) — fonte de detalhe | Sim, mas só resumo curto + link (frontmatter `tipo_diataxis: reference`) |
| Explanation | Sim (`docs/explanation/`) — arquitetura/decisão técnica | Sim (frontmatter `tipo_diataxis: explanation`) — racional com lente de negócio |

## Como linkar entre repo e vault

`calendar-estrategico/` (repo Git do código) e `Afinz-CRM-Midia-Vault/` (vault Obsidian) **não são o mesmo repositório Git** — não há link clicável nativo entre os dois em plataformas como o GitHub.

- **No vault → repo:** usar link relativo de arquivo, ex. `../../calendar-estrategico/docs/reference/hooks.md`. Funciona no Obsidian porque as duas pastas estão na mesma árvore local (`ACALENDARIO APP/`), mas não é garantido fora desse ambiente.
- **No repo → vault:** usar caminho relativo em texto simples, ex. `../../Afinz-CRM-Midia-Vault/08-Engenharia/Nota.md`. Não vai renderizar como link clicável no GitHub (o caminho sai da raiz do repo) — é só uma referência textual para quem está navegando localmente.

## Processo ao criar uma feature nova

1. Detalhe técnico de implementação (hooks, services, schema, componentes) → `docs/reference/` (repo).
2. Como usar/testar/rodar a feature → `docs/how-to/` ou `docs/tutorials/` (repo).
3. Por que a feature foi construída assim → `docs/explanation/` (repo).
4. O que a feature permite o operador decidir, e como conecta a métricas/estratégia de negócio → nota nova ou atualizada em `08-Engenharia/` (vault), com frontmatter `tipo_diataxis` e link de volta ao doc de repo relevante.
5. Se a feature ainda está em desenvolvimento (spec, ADR) → `docs/plans/` ou `docs/specs/` (repo), fora de Diátaxis.

## Nota sobre a ontologia compilada

`AFINZ_GAAS_ONTOLOGY.md` é gerado por `scripts/bundle_vault.py` a partir de **todo** o conteúdo de `Afinz-CRM-Midia-Vault/` (pastas 00 a 09, exceto `.obsidian/` e `99-Templates/`). Qualquer nota nova ou editada em `08-Engenharia/` entra automaticamente na próxima recompilação — não é necessário alterar o script. O arquivo compilado hoje é gerado **fora** do repositório Git do código (fica em `ACALENDARIO APP/docs/`, não em `calendar-estrategico/docs/`); isso foi mantido deliberadamente nesta fase.

## Gaps conhecidos

**Resolvido em 2026-07-05** — as 4 abas/features sem doc equivalente às demais agora têm `docs/reference/tabs/TAB_*.md`, escritos a partir de teste ao vivo em produção (não apenas inspeção de código):
- [TAB_RELATORIO.md](reference/tabs/TAB_RELATORIO.md)
- [TAB_EXPLORADOR.md](reference/tabs/TAB_EXPLORADOR.md)
- [TAB_EXPERIMENTOS.md](reference/tabs/TAB_EXPERIMENTOS.md) — documenta feature ~70% implementada, sem dados de exemplo em produção (Kanban vazio é estado esperado); ver spec completa em `docs/plans/SDD_EXPERIMENTOS_KANBAN_INDEX.md`.
- [TAB_COMUNICACOES.md](reference/tabs/TAB_COMUNICACOES.md) — documenta feature ~40% implementada; ao contrário do que uma exploração de código anterior concluiu, a feature **está** acessível via nav em produção (corrigido no próprio documento).

Achados adicionais dessa rodada de teste (fora do escopo de documentação, reportados ao usuário): dois bugs de layout confirmados em produção — ícones do header (incluindo "Configurações") cortados por overflow horizontal em viewports ~1238px de largura sem scroll disponível; botão "Aplicar" do seletor de período cortado abaixo da dobra em viewports curtos. A tabela "10 Main Tabs/Views" do `CLAUDE.md` também foi atualizada para refletir a navegação real observada (Comunicações como item de nav, "Resultados" não existe mais como aba separada).

Próxima fase (não coberta ainda): revisar/atualizar os 9 `TAB_*.md` pré-existentes contra o comportamento real de produção, já que a navegação mudou mais do que o esperado desde que foram escritos (ex: agrupamento de menus, ausência de "Resultados").
