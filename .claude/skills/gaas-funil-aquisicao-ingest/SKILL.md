---
name: gaas-funil-aquisicao-ingest
description: Atualiza as ingestões dos dashes do Funil de Aquisição (GaaS) a partir
  de um export cru colado do Excel/Sheets ou de um arquivo. Cobre (1) funil Serasa/Neurotech
  BI → tabela Supabase serasa_bi_neurotech_daily_funnel; (2) funil App Afinz → tabela
  Supabase app_afinz_funnel_daily_raw; (3) funil API Serasa marketplace (export "Sum
  of Qt oferta" com Ofertas/Pedidos/Confirmados/Aprovados) → tabela Supabase serasa_marketplace_daily_funnel.
  Detecta qual é pelo cabeçalho, converte pro formato/schema exato, valida (checksum
  no Serasa, merge-sem-regressão no App Afinz, constraints de funil decrescente no
  marketplace). Use quando o usuário colar/enviar um export do funil Serasa, App Afinz
  ou "API Serasa BI", pedir "atualizar funil de aquisição", "subir export do funil",
  "subir no funil api serasa", "atualizar os dashes de aquisição", ou destravar um
  funil parado. NÃO cobre o funil de Mídia Paga (esse lê Supabase direto, view v_b2c_app_install_daily).
metadata:
  version: 1.0.0
  origin: claude-projeto
  agents:
  - claude-code
  - codex
  - cowork
  - chatgpt
  process:
  - Ingestão de dados
  owner: Time GaaS Afinz
  last_validated: null
  packaged_at: '2026-10-30'
  compatibility: Instruções portáveis; execução não validada por ambiente
  license: Distribuição pública autorizada pelo titular; sem concessão adicional de
    licença
---

# GaaS — Ingestão do Funil de Aquisição

Você atualiza as tabelas do Supabase que alimentam a aba **Funil de Aquisição** do app
`calendar-estrategico` (repo `growthafinz/GaaS-Framework-Afinz`, deploy GitHub Pages).

A aba tem 3 sub-funis com 3 fontes diferentes. **Esta skill cobre os 2 que vêm de export manual:**

| Sub-funil | Componente | Fonte lida pelo app | Esta skill? |
|---|---|---|---|
| Serasa/Neurotech | `src/components/FunilAquisicaoView.tsx` e `SerasaSourceFunnelView` | tabela `serasa_bi_neurotech_daily_funnel` | ✅ |
| App Afinz | `src/components/AppAfinzFunnelView.tsx` | tabela `app_afinz_funnel_daily_raw` | ✅ |
| Mídia Paga → Install | `src/components/PaidMediaFunnelView.tsx` | view Supabase `v_b2c_app_install_daily` | ❌ (auto) |

> ⛔ **Desde 2026-11-10 nenhum dado de funil vai para `public/data/` nem para o git.** O repositório
> é público e o Pages servia esses arquivos para qualquer pessoa. O app lê só das tabelas (RLS:
> membro aprovado). O CSV/TSV gerado pelo script é **intermediário**: fica no scratchpad, serve
> para validar e montar o SQL, e não é copiado para o repo. `public/data/` está no `.gitignore`.

> ⚠️ **Gravação nas tabelas:**
> - App: para cada dia vindo do export novo, `delete` do dia + `insert` (PK
>   `business_date, stage_code, status, marc_plurix`; stage_code = cpf/onboarding/geo/docs/bio/
>   address/personalization/signature/auto_finalization/completed/loss). Dias preservados pelo merge
>   ficam intocados. Dia corrente = `partial` + `{current_day_open}`.
> - Serasa: upsert por `data` a partir do 1º dia do export.
> - SQL do App passa de 200 KB: aplicar com `supabase db query --linked -f arquivo.sql` a partir de
>   uma pasta de scratch linkada (`supabase init` + `supabase link --project-ref mipiwxadnpwtcgfcedym`),
>   não pelo MCP `execute_sql`.
> - Export do BI do App (`Acompanhamento_Funil_B2C(DADOS BI APP).csv`): `;`, cp1252, cabeçalho na
>   linha 3 (`Ano;2026` antes), ~100k linhas vazias no fim, referências com `MARC_PLURIX` vazio
>   (converter p/ `0`), números com `.` de milhar, e ~50 linhas `APROVADO/NAO` **sem nome de etapa**
>   (descartadas — não têm estágio identificável). A janela do funil detalhado desse export começa
>   ~28/07, por isso o merge com o antigo é obrigatório.
> - Export Serasa vem como `.xlsx` (datas reais + linha `Total`) cobrindo só ~60 dias: o upsert por
>   `data` já preserva os dias anteriores. Para o checksum, rode `build_funnel_files.py serasa` só
>   sobre o export novo.

## Fluxo

1. **Receber** o export cru. O usuário normalmente **cola do Excel/Sheets** (vem TAB-separado)
   ou anexa um arquivo. Salve o conteúdo verbatim num arquivo temporário (ex.: no scratchpad),
   **sem editar** — nem número, nem cabeçalho.
2. **Detectar qual funil é** pelo cabeçalho:
   - começa com `Data ... Consultas Neurotech ...` → **Serasa** (`serasa`)
   - começa com `created_data  Etapa  status  MARC_PLURIX  Contagem de CPF` → **App Afinz** (`appafinz`)
   - Um rótulo de lista tipo `1 - ` / `2 - ` no início do cabeçalho é tolerado (o script remove).
3. **App Afinz: exportar a tabela atual** para o scratchpad como `OLD_app-afinz-funnel-raw.tsv`
   (necessário para o merge sem regressão), no formato do contrato abaixo:
   `select to_char(business_date,'DD/MM/YYYY'), stage_label, status, marc_plurix, cpf_count from app_afinz_funnel_daily_raw order by business_date, stage_code, status, marc_plurix;`
4. **Rodar o script** (ver Uso) no scratchpad. Ele valida e emite o arquivo intermediário.
5. **Conferir o relatório do script**:
   - Serasa: `CHECKSUM: OK` (a linha `Total` do export bate com o recalculado). Se `DIVERGIU`,
     **pare** e ache o dígito errado na transcrição — não suba.
   - App Afinz: `calendario continuo`, `referencias ... presentes`, e a lista de dias
     preservados pelo merge (se houver). App Afinz **não tem checksum** — apresente ao usuário
     o resumo mensal de cartões concluídos pra ele bater o olho antes de subir.
6. **Gerar o SQL a partir do arquivo intermediário e gravar na tabela** (regras de gravação acima),
   só depois do "ok" do usuário. Conferir `count/min/max` e as somas do período depois.
7. **Não há deploy.** O app lê a tabela na hora; nada é commitado. Não copie o CSV/TSV para
   `public/data/` nem para qualquer pasta do repositório.

## Uso do script

```bash
# Serasa (checksum via linha Total)
python scripts/build_funnel_files.py serasa   <export_cru>  <saida.csv>

# App Afinz (merge com o arquivo antigo p/ nunca regredir funil)
python scripts/build_funnel_files.py appafinz <export_cru>  <saida.tsv>  <arquivo_antigo.tsv>
```

O 4º argumento do `appafinz` (arquivo antigo) é **opcional mas recomendado sempre**: sem ele,
se o export novo vier com uma janela de funil mais curta que a atual, você **perde histórico**.

## Contratos dos parsers (fonte da verdade)

### Serasa → `serasa-funnel-daily.csv` (intermediário, scratchpad)
- Delimitador de saída `;`. 8 colunas nesta ordem:
  `Data ; Consultas Neurotech ; Aprovados Neurotech ; Pedidos Confirmados ; Env. da Foto Biometria ; Env. Documento ; Assinatura do Cartão ; Total Emitidos`
- Data `DD/MM/YYYY`. Números pt-BR (`1.518` = 1518). Célula vazia = sem-dado (fica vazia, o app lê como null).
- Linha `Total;...` no fim é **ignorada pelo parser**, mas o script **recalcula** e usa a do export como checksum.
- Atualização = **upsert por `data`** dos dias do export. O export novo é a versão mais madura;
  dias recentes sofrem restatement (valores sobem conforme registros amadurecem), e isso é normal.
- Mapeamento para a tabela: `data, consultas_neurotech, aprovados_neurotech, pedidos_confirmados,
  env_foto_biometria, env_documento, assinatura_cartao, total_emitidos` (célula vazia = `null`).

### App Afinz → `app-afinz-funnel-raw.tsv` (intermediário, scratchpad)
- Delimitador TAB. 5 colunas: `created_data ⇥ Etapa ⇥ status ⇥ MARC_PLURIX ⇥ Contagem de CPF`.
- Formato **longo/raw** (várias linhas por dia). A etapa é identificada pelo **prefixo numérico**:
  `0.`→CPF, `1.`→Onboarding, `2.`→Geo, `3.`→Docs, `4.`→Bio, `5.`→Endereço, `6.`→Personalização,
  `7.`→Assinatura, `8.`→Concluído. (`7.1` e `Perda` são ignorados pelo funil.)
- **Regra que quebra silencioso:** o app só soma direito se cada dia tiver os dois tipos de linha:
  - **referência** (CPF/Onboarding): `status` vazio e `MARC_PLURIX = 0`;
  - **segmentada** (etapas 2→8): `status = APROVADO` e `MARC_PLURIX = SIM` (Plurix) ou `NAO` (Afinz).
- Meses sem funil (só `0. Etapa de Digitação de CPF`) são normais no começo do histórico —
  o funil detalhado começou ~fim de mai/2026.

## Funil API Serasa (marketplace) → Supabase `serasa_marketplace_daily_funnel`

Fonte diferente das duas acima: **é tabela Supabase, não arquivo.** O usuário chama de
"funil api serasa BI". O componente é `SerasaSourceFunnelView.tsx` (source `marketplace`),
que lê 3 tabelas: `serasa_marketplace_daily_funnel` (esta), `serasa_bi_neurotech_daily_funnel`
e `serasa_bi_daily_funnel`.

- **Export cru:** arquivo `Sum_of_Qt_oferta,_Su_<timestamp>.xlsx` — **transposto** (datas nas
  colunas), com as linhas: `Data`, `Ofertas`, `Pedidos`, `Pedidos %`, `Confirmados`,
  `Confirmados %`, `Aprovados`, `Aprovados %`. As `%` são conversões estágio-a-estágio
  (Pedidos%=pedidos/ofertas, Confirmados%=confirmados/pedidos, Aprovados%=aprovados/confirmados).
- **Destino:** `serasa_marketplace_daily_funnel` (PK `data`, upsert). Colunas: `ofertas, pedidos,
  pedidos_rate_source, confirmados, confirmados_rate_source, aprovados, aprovados_rate_source,
  quality_status, quality_notes, source_file, source_hash`.
- **Constraints que quebram o upsert inteiro se violadas** (validar ANTES):
  - funil decrescente: `ofertas ≥ pedidos ≥ confirmados ≥ aprovados ≥ 0`;
  - `*_rate_source` em `[0,1]` e **NOT NULL** → dia de abertura (denominador 0) tem `%` vazio
    no xlsx; **coerça pra 0** (o gerador do repo emitiria `null` e falharia);
  - `quality_status in ('complete','partial','suspect')`.
- **Dia aberto:** marcar `data > lastClosedDate` como `partial` + `quality_notes={current_day_open}`.
  `lastClosedDate` = ontem (o último dia fechado).

**Como rodar:**
```bash
python scripts/gen_serasa_marketplace.py <export.xlsx> <saida.sql> "<nome_do_xlsx>" <YYYY-MM-DD_lastClosed>
```
Depois aplicar o SQL no Supabase (projeto GaaS `mipiwxadnpwtcgfcedym`) via MCP `execute_sql`
(upsert idempotente `on conflict (data) do update`). **Não salvar o SQL com dados como migration**:
`supabase/migrations/` fica no repositório público.

> Escrita em **backend de produção** — só aplicar com o "ok" do usuário (ou quando ele já
> mandou "sobe isso"). Depois do upsert, confira `count/min/max/quality_status` e que o dia
> aberto ficou `partial`.

> Desde 2026-11-10 o Neurotech tem um destino só: a tabela `serasa_bi_neurotech_daily_funnel`,
> lida tanto pelo `FunilAquisicaoView` quanto pelo `SerasaSourceFunnelView` (source `bi`).

## Gotchas do ambiente

- **Path com acento** (`Área de Trabalho`): o Python quebra ao abrir esses caminhos direto do
  Git Bash. Trabalhe com nomes ASCII no scratchpad.
- **Console cp1252 (Windows):** evite emoji no output do script (já está sem).

## Verificação (opcional, recomendado antes de subir)

Suba o dev server (`npm run dev` em `calendar-estrategico`, porta 5173) e abra a aba
**Funil de Aquisição** logado. Confirme que os 3 sub-funis renderizam e que a última data bate
com o export.
