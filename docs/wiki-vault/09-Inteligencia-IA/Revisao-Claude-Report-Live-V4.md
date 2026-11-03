---
tags: [ia, gaas, report-live, v4, revisao, codex]
tipo: inteligencia-ia
camada: operacao
tipo_diataxis: explanation
atualizado: 2026-07-08
status: confirmado
fonte: claude-cowork-revisao
---

# Revisão Claude — V4 iniciada pelo Codex

Definição precisa: revisão técnica da IA que construiu a V1-V3 do Report Live sobre o trabalho registrado em [[Report-Live-V4-Growth-Context-Handoff-Codex]]. Baseada em leitura do código real (`report-sync-v4-setup/index.ts`, 812 linhas) e na execução do `inspect_views` que estava pendente (rodado via pg_net em 08/07/2026).

## Veredito em uma frase

**A arquitetura da V4 está certa e bem conduzida; a camada de dados está quase toda quebrada** — 16 das 17 views retornam "sem dados" (fórmulas mortas mascaradas por IFERROR), e a única viva (cockpit) mostra números acumulados de todo o histórico, sem janela temporal.

## O que o Codex acertou (manter)

1. **Função paralela `report-sync-v4-setup`** — decisão correta (setup ≠ runtime; V3 intacta). Bônus: código versionado no repo (`supabase/functions/`), o que a V3 não fez.
2. **Disciplina de handoff exemplar** — seções "o que não fiz" e "riscos" são o padrão que todo handoff entre IAs deveria seguir.
3. **Perfis de output** (`report_profile`, regra da sexta com corte na quarta, proibição de comparar semana parcial com cheia) — adição excelente, coerente com a Seção 4 do briefing.
4. **Contrato de granularidade** (parceiro → segmento → canal → funil → top campanhas → action queue) — responde exatamente ao pedido do Pablo. O desenho fica; o encanamento é que falhou.
5. Separação ordem técnica × ordem narrativa.

## Bugs confirmados (evidência: inspect_views + leitura do código)

| # | Bug | Onde | Efeito |
|---|---|---|---|
| 1 | **Google QUERY não aceita aritmética entre agregados** (`sum(K)/sum(H)` no select é inválido) | quase todas as 17 views | causa-raiz principal do "sem dados" geral |
| 2 | `count(A)` com range iniciando em B (`DB_CRM!B2:L`) — coluna fora do range | VIEW_AQS_BU, VIEW_AQS_PARCEIRO | QUERY inválida |
| 3 | Literal `0` no select (`select D,0,sum(H)...`) — não suportado | VIEW_MEDIA_PACING__OBJETIVO | QUERY inválida; budget deveria vir da aba CONFIG |
| 4 | **Rótulo semântico perigoso**: col I do DB_CRM é PROPOSTAS, rotulada como "cliques"; I/H rotulado "ctr" | VIEW_AQS_CANAL__PARCEIRO__SEGMENTO | stakeholder veria CTR falso |
| 5 | Seguros em mídia filtrado por `DB_MIDIA!D` (objective da plataforma) em vez de `G` (frente) — `D="seguros"` nunca existe | VIEW_SEGUROS_SUMMARY | soma sempre 0 |
| 6 | `sum(K)/sum(K)` como "participação/mix" = sempre 1 | AQS_BU, AQS_PARCEIRO | métrica sem sentido |
| 7 | Cockpit soma **todo o histórico** (R$ 76.109 / 13.408 cartões = jan→jul acumulado) sem janela | VIEW_GROWTH_COCKPIT | viola janelas temporais do briefing |
| 8 | Coluna B (BU) rotulada "frente" | AQS_BU, GROWTH_MATRIX | confusão de taxonomia (BU ≠ frente) |
| 9 | `inspect_views` marca `has_error:false` em view que retorna "sem dados" — o IFERROR mascara o erro da própria auditoria | inspeção | falso-negativo sistêmico |

## Divergência semântica a decidir (Pablo)

A V4 agrupa mídia por **`objective` da plataforma** (col D: app_installs, leads, awareness...). A taxonomia canônica do GaaS ([[Report-Live-Sheets-Slides]], P3) usa **frente** (col G: Aquisição B2C, Plurix, Copa, Seguros) — que é também como os budgets da CONFIG são definidos. Recomendação: **frente como dimensão principal, objective como secundária** (ex.: frente × objective na view de plataforma). Sem isso, pacing não conecta com budget.

## Problema de produto (não de código)

Os **17 slides v4 com placeholders crus `{{v4_*}}` foram criados no deck fixo** — o mesmo link que stakeholder acessa. A `report-sync` V3 preenche só os 20 placeholders antigos, então os v4 ficarão como texto cru visível até a integração. Quebrou o princípio "link fixo = sempre apresentável". Mitigação imediata: mover os slides v4 para o final atrás de um separador "V4 — em construção" ou removê-los até a validação. E a curadoria continua valendo: **report mensal ≤ 12 slides**; o contrato de 17 views deve alimentar perfis (executivo mensal = subconjunto; deep dive = completo), não um deck de 30+ slides.

## Riscos menores

- Duplicação dos invariantes na skill local `.codex` (references/) = segunda fonte de verdade que vai divergir do vault. Trocar cópias por ponteiros ao vault/ontologia.
- Action queue sem fonte determinística ainda: deve nascer de `report_memory.recomendacoes` + anomalias por regra (pilar P7); IA apenas redige.

## Respostas diretas às 9 perguntas do Codex

1. Função paralela: **sim, caminho certo** (e o deploy da V3 deveria adotar o mesmo padrão de código no repo).
2. As 17 views respeitam os 8 pilares **no desenho**; violam P2/P7 **na prática** enquanto as fórmulas estiverem mortas e o cockpit sem janela.
3. Sheet fixo: ok. **Deck fixo: não** — deveria ter sido sandbox; mitigar já (mover/ocultar slides v4).
4. Contrato de Aquisição CRM: **correto e aprovado** — corrigir rótulos (BU≠frente; propostas≠cliques).
5. Mídia por objetivo: simetria ok, mas **frente deve ser a dimensão principal** (ver divergência acima).
6. Seguros resumido: conceito certo; filtro de mídia errado (col G, não D) e validar `BU='Seguros'` na base real.
7. Plurix/B2B2C dentro de Aquisição CRM: **correto**.
8. Fórmulas a corrigir antes de continuar: todas as marcadas na tabela — padrão de correção = **QUERY só para agregados brutos + colunas derivadas com ARRAYFORMULA fora da QUERY** (o padrão V3, que funciona) + janela temporal parametrizada (mês corrente ou via `REPORT_PROFILE`).
9. Próximo passo: **(a)** proteger o deck (mover/ocultar v4), **(b)** corrigir fórmulas com o padrão acima, **(c)** inspect_views v2 tratando "sem dados" como erro, **(d)** validação visual, **(e)** só então estender os placeholders na `report-sync` e definir perfis de curadoria. **Não reverter a estrutura** — o desenho é bom.

---

## RESOLUÇÃO (executada por Claude em 08/07/2026 — V4 FUNCIONANDO)

Todas as correções foram aplicadas e validadas por inspeção: **16/17 views vivas com dados reais** (a 17ª, `VIEW_SEGUROS_ACTIONS`, é vazia por design). O que foi feito:

1. **Bug adicional descoberto**: o helper `q()` embrulhava QUERYs em `OFFSET(QUERY(...),1,0)` — OFFSET não aceita array no Sheets. Corrigido para `QUERY(QUERY(...),"select * offset 1",0)`.
2. **Causa-raiz das views CRM**: `"Data de Disparo"` é **timestamptz** no Postgres → ISO com "T" não parseia como data no Sheets → coluna A do DB_CRM era TEXTO. Fix em duas pontas: modo `fix_crm_dates` normalizou as 3.173 linhas existentes (truncando para yyyy-MM-dd) e a `report-sync` v3.2 (versão 9) passou a truncar na fonte (`isoDay()`).
3. **Todas as fórmulas reescritas** no padrão validado: QUERY só para agregados brutos + razões via ARRAYFORMULA fora da QUERY + janela temporal única controlada em `REPORT_PROFILE!B10:B11` (hoje jun/2026 — mudar ali reprocessa outro período).
4. **`values:batchClear` antes de regravar** (células órfãs de layouts antigos bloqueavam a expansão das fórmulas).
5. **Frente como dimensão principal de mídia** (objective como secundária), budget via VLOOKUP na CONFIG, rótulos corrigidos (bu≠frente; propostas≠cliques), Seguros filtrando pela coluna G, alerta de zeramento de tracking codificado (regra do caso Plurix).
6. **`report-sync` v3.2 aceita os 37 placeholders** (20 v3 + 17 v4) e só substitui os que receberem texto — run mensal pode preencher v3 e v4 juntos.
7. `inspect_views` agora trata "sem dados"/vazio como erro (fim do falso-negativo).

**Pendências pós-V4:** validação visual dos slides (Pablo) · curadoria de perfil (mensal ≤12 slides; v4 completo como deep dive — decidir se move slides v4 para o fim do deck) · gráficos antigos das views podem apontar colunas deslocadas (ajuste visual) · action queues seguem manuais até V4b.

Ver também: [[Report-Live-Sheets-Slides]] · [[Agente-Report-Live-Handoff]] · [[Report-Live-V4-Growth-Context-Handoff-Codex]]
