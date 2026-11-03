---
tags: [engenharia, gaas, report-live, sheets, slides, edge-function]
tipo: engenharia
camada: codigo
tipo_diataxis: explanation
atualizado: 2026-07-08
status: confirmado
fonte: construcao-claude-cowork
---

# Report Live — Sheets + Slides sincronizados

Definição precisa: o **Report Live** é a camada de entrega viva do GaaS — um botão no app (aba Relatório → XLSX Reports → card "Report Google Live") que sincroniza dados do Supabase para uma **planilha Google fixa** e atualiza um **deck Google Slides fixo** (gráficos linkados + narrativa via placeholders), com status em tempo real. Substitui o fluxo "gerar XLSX → montar PPT à mão" por um destino permanente que stakeholders acessam pelo mesmo link todo mês.

Por que isso importa: os 4 exports XLSX (ver [[Export-XLSX-Renta-Copa]] e `utils/*Export.ts`, ~6.100 linhas) morrem no download — sem URL, sem histórico, sem narrativa. O Report Live fecha o ciclo `Supabase → Growth Brain → Storytelling → entrega` descrito em [[Agentes-e-Workflows]].

## Os 8 Pilares (invariantes — decisão de 08/07/2026)

1. **Quatro camadas, mão única:** `DB (append-only) → VIEWS (tidy) → NARRATIVA (LLM) → DECK (vitrine)`.
2. **Número é código, prosa é LLM** — a IA nunca calcula; todo número citado existe nos dados.
3. **Dimensões canônicas da taxonomia GaaS** (frente × plataforma; BU × Parceiro × Segmento × Canal).
4. **Idempotência total** — delta por data, placeholder por alt-text, memória por upsert de ciclo.
5. **1 view = 1 gráfico = 1 slide = 1 comentário** (padrão herdado dos reports de agência/Évora).
6. **Duas vias de aprendizado:** Briefing (tom, humano) ✕ report_memory (negócio, automático). Nunca misturar.
7. **Anomalia é regra (código), explicação é IA.**
8. **Observabilidade:** estágios em `report_runs`, contadores, `briefing_version`.

## Componentes

| Peça | Onde | Detalhe |
|---|---|---|
| Edge Function `report-sync` | Supabase projeto `mipiwxadnpwtcgfcedym`, versão 8 (v3.1) | Deno; verify_jwt on; GET = health check |
| Tabelas | `report_runs` (status/urls/erros) · `report_memory` (ciclo, narrativa, recomendações c/ valor esperado, outcomes) | RLS on; anon só lê report_runs |
| Planilha-mestre | ID `1BYLpYzDvppMC32ITfbSQdejB3RSxOcAdJZteCd54nwA` | abas `BRIEFING`, `CONFIG`, `DB_MIDIA`, `DB_CRM`, `DB_B2C` + 9 views |
| Deck-template | ID `1iGAdoxp1yC91v9_Y0zCD0XHrkjZvUrikyLXbKP-_wv0` | gráficos LINKED + 20 placeholders |
| Frontend | `components/relatorio/ReportLiveCard.tsx` no RelatorioView (modo xlsx) | polling 2,5 s em report_runs |
| Secrets (Edge) | `GOOGLE_SERVICE_ACCOUNT_JSON` (arquivo inteiro!), `REPORT_SHEET_ID`, `REPORT_SLIDES_ID`, `GEMINI_API_KEY` (opcional) | service account: `report-live-bot@positive-ivy-449023-r2.iam.gserviceaccount.com` (Editor nos 2 arquivos) |

## Data views (v3)

Mídia (frente × plataforma; canais no banco são `meta`/`google` minúsculos): `VIEW_MP_TOTAL`, `VIEW_MP_META`, `VIEW_MP_GOOGLE`, `VIEW_MP_SHARE` (mix 93% Meta em jun/26), `VIEW_MP_PACING` (budget da aba `CONFIG`, projeção por ritmo diário).
CRM (BU → Parceiro → Segmento): `VIEW_CRM_BU`, `VIEW_CRM_PARCEIRO`, `VIEW_CRM_SEGMENTO` (top 12, 30 dias), `VIEW_CRM_FUNIL` (taxas).
Todas são QUERY/fórmulas sobre as abas DB_* — recalculam sozinhas quando o delta entra.

## Contratos da Edge Function

- `GET /report-sync` → health: `{sheet_id, slides_id, gemini_key, service_account, google_auth, sheet_access, briefing_chars}`
- `POST {mode:"setup_views"}` → cria/repara abas, gráficos e slides (idempotente).
- `POST {period_start, period_end}` → run com Gemini (exige GEMINI_API_KEY).
- `POST {period_start, period_end, skip_llm:true, texts:{...20 chaves...}, recomendacoes:[...]}` → run com narrativa externa (**modo padrão: Claude é a LLM** — decisão de 08/07).

Placeholders (20): `mes_referencia, prestacao_contas, leitura_mes, leitura_spend, leitura_cpc, insight_1..3, acao_1..3, comentario_mp_total, comentario_mp_meta, comentario_mp_google, comentario_mp_share, comentario_mp_pacing, comentario_crm_bu, comentario_crm_parceiro, comentario_crm_segmento, comentario_crm_funil`. Identificação no deck por **alt-text** `ph:<nome>` (sobrevive à substituição do texto — re-execução idempotente).

## Lições/erros registrados na construção

- Web App Apps Script foi descartado (CORS text/plain + acesso "Anyone" inseguro); Apps Script usado só no setup one-shot inicial.
- Secret do service account deve ser o **JSON inteiro** (`{...}`), não só a private_key — erro clássico de colagem.
- Sheets API: gráfico BAR exige série em `BOTTOM_AXIS` (COLUMN/LINE usam LEFT_AXIS).
- `RelatorioView.tsx` sofreu truncamento de fim de arquivo (suspeita: OneDrive sync) — restaurado; commitar com frequência.
- Teste sem browser: disparar a função via `pg_net` (`select net.http_post(...)`) por SQL — padrão de teste validado.

## Estado (08/07/2026) e pendências

Feito: E1-E6 + V3 completos; run de junho/2026 publicada com 4 recomendações auditáveis (tracking Plurix, pacing Copa ≤5000, parceiro N/A <10%, teste Google B2C CPC ≤1,20); briefing v1.0 preenchido na aba BRIEFING.
Pendente: validação visual do deck v3 · RLS off em 14 tabelas (dívida de segurança, ver [[Dívida-Técnica]]) · V4 futuro: metas por frente (`paid_media_targets`), scorecard Escalar/Corrigir, outcomes automáticos na memória, agendamento mensal, arquivamento de deck no Drive.

## Auditoria visual do deck (08/07/2026, PDF de 32 slides) — Backlog V4b de usabilidade

Análise crítica do deck exportado (estado pré-correções em parte; refresh run pós-fix já disparada, +210 linhas jul). **O framework de dados está redondo; o deck como PRODUTO ainda não é utilizável no dia a dia.** Problemas confirmados por inspeção visual, em ordem de prioridade:

| P | Problema | Detalhe | Correção |
|---|---|---|---|
| P0 | **17 placeholders v4 crus** (`{{v4_*}}` visíveis) | narrativa v4 nunca rodou | run mensal com os 37 textos (suportado desde report-sync v3.2) |
| P0 | **Slides 3-4 do template original mortos** ("Adicione uma série") | gráficos da aba REPORT_FRENTES (setup Apps Script v1) quebraram | deletar slides 3-4 (duplicam VIEW_MP_TOTAL, que funciona) + apagar gráficos órfãos da REPORT_FRENTES |
| P0 | **Gráficos CRM v3 enganosos**: séries fixas B:F sobre pivô ALFABÉTICO → mostra "Acordo Certo/Bom_Pra_Credito/Dia/N/A" e corta Serasa/Proprietária | chart de range fixo + pivot ordenado por nome | reordenar pivô por volume (top-N) ou usar as views V4 (já ordenadas por cartões) como fonte dos slides CRM |
| P1 | **Eixo com data-lixo "1899-12"** no funil v3 | célula vazia na aba interpretada como 0 → 1899-12-30 (Supabase sem datas inválidas — é artefato de linha em branco/TEXT sobre vazio) | filtro where na QUERY do funil + limpar linhas em branco do DB_CRM |
| P1 | **Pacing v3 com TOTAL na mesma escala** das frentes (distorce) + série de projeção não visível | range do gráfico inclui linha TOTAL | excluir TOTAL do range do chart |
| P1 | **Chart herdado do Seguros** com séries antigas (quantidade_disparos/impressoes) sobre layout novo metrica-valor | view mudou p/ chart:null mas gráfico antigo persiste no slide | deletar gráfico e slide-elemento herdado |
| P1 | **12 gráficos v4 "Add a series"** no PDF | snapshot pré-fix; views agora vivas | refresh já disparado — validar visualmente; se persistir, recriar charts |
| P2 | **32 slides sem curadoria** | executivo não lê | separador "Deep Dive V4" + deck mensal ≤12 slides; decidir perfis (executivo × operacional) |
| P2 | **Números sem formatação** (R$, %, casas) nas views e gráficos | leitura difícil | number formats via Sheets API no setup |
| P2 | Tema inconsistente (capa escura × miolo branco), títulos sem numeração/rodapé | identidade Afinz ausente | aplicar template de marca (verde D3FF00/azul 00C6CC, fundo escuro) |

**Aprendizados de plataforma adicionados nesta rodada (não repetir):** timestamptz vira TEXTO no Sheets (truncar na fonte — `isoDay()` na v3.2; modo `fix_crm_dates` normalizou 3.173 linhas) · OFFSET não aceita array (usar QUERY aninhada `offset 1`) · QUERY proíbe aritmética entre agregados (razões via ARRAYFORMULA fora) · sempre `batchClear` antes de regravar layout de view · gráfico de snapshot no Slides exige `refreshSheetsChart` após qualquer correção de fórmula · OneDrive truncou arquivos 2x durante edições (verificar tail; commitar sempre).

## Atualização de engenharia — 23/07/2026

O Report Live passou a ser tratado como produto versionado. O Google Slides permanece único e vivo; versões passam a existir nos dados, contratos, blueprints, validações e publicações. A arquitetura, estado confirmado, pendências P0 e protocolo `build → certify → publish → rollback` estão registrados em [[Report-Live-Versionamento-e-Publicacao]].

Decisão visual homologada: reconstrução em **tema claro Afinz**, usando os PPTX de referência como Design DNA. O tema escuro anterior pertence ao app e não deve ser propagado ao deck.

Ver também: [[Report-Live-Versionamento-e-Publicacao]] · [[Agente-Report-Live-Handoff]] · [[Revisao-Claude-Report-Live-V4]] · [[Arquitetura-Geral]] · [[Módulo-Paid-Media-Afinz]] · docs no projeto Cowork "AFINZ - GROWTH MÍDIA" (PILARES_TECNICOS_REPORT_LIVE_V3.md, BLUEPRINT_DATA_VIEWS_REPORT_LIVE.md, BRIEFING_REPORT_LIVE_PREENCHIDO_v1.md).
