---
name: gaas-communication-governance
description: Reconcile and govern Afinz/GaaS CRM communication templates, Activity Names, AppsFlyer CRM links, SFMC journey exports, Supabase `activities`, and asset-upload coverage. Use when Codex needs to map `template_id` to `activity_name`, validate recent Activity Names, generate a review queue for GaaS Communications, create AppsFlyer link governance outputs, or prepare template/image upload work for the `crm-communications` bucket without auto-linking weak matches.
---

# GaaS Communication Governance

Use this skill to turn loose CRM communication files into an auditable GaaS workflow:
`template_id` is the stable content identity, `activity_name` is the SFMC execution key, AppsFlyer is click attribution, and GaaS is the governance/reconciliation layer.

## Core Rules

- Keep `template_id` as content identity. Do not derive it from a primary key, SFMC activity id, dispatch date, or one-off execution.
- Keep `Activity Name` as execution/audit identity. A single template can legitimately map to multiple Activity Names.
- Never auto-link weak matches. Produce candidates, evidence, conflicts, and a human-readable review queue.
- For CRM AppsFlyer links, allow only `c`, `af_sub1`, `af_sub2`, and `af_sub3`. Treat `pid`, `af_channel`, `af_ad`, `af_adset`, `af_ad_id`, `deep_link_value`, and `af_sub4` as blockers in CRM link output.
- Use the provided workbook/export values before inventing taxonomy. Preserve physical values such as `Padrao`, `N/A`, and the exact Activity Name spelling.
- If `communication_templates` or `communication_slots` are inaccessible because of RLS, keep working from governance XLSX + SFMC export + readable `activities`, and state that database application needs authenticated app flow or a safe service credential.

Read [references/identity-model.md](references/identity-model.md) when the task involves schema or conceptual decisions.
Read [references/moment-inference.md](references/moment-inference.md) when the task asks to order recent dispatches or reason about `Semana / Momento`, previous dispatches, next dispatches, or one-off communications.

## Standard Workflow

1. Locate inputs:
   - Governance workbook: usually `GOVERNANCA_LINKS_E_TEMPLATES*.xlsx` or `GOVERNANÇA_LINKS_E_TEMPLATES*.xlsx`.
   - SFMC journey export: usually `Overview_Jornadas_B2C*.xlsx`.
   - Repo: usually `calendar-estrategico` inside `ACALENDARIO APP`.
2. Export recent live activities if the repo is available:
   - Run `node scripts/export_live_activities.js --repo <calendar-estrategico> --out <output-dir>`.
   - The script reads `src/services/supabaseClient.ts` and uses the repo's local `@supabase/supabase-js`.
   - For an explicit 90-day window, pass `--start-date YYYY-MM-DD --output live_activities_90d.json`.
3. Reconcile the sources:
   - Run `python scripts/reconcile_activity_templates.py --governance <xlsx> --sfmc-overview <xlsx> --activities-json <json> --out <output-dir>`.
   - Output `activity_template_crosswalk.csv`, `crosswalk_summary.json`, and `diagnostico_activity_template.md`.
4. Generate the sheet feed when the user needs to populate the AppsFlyer/links generation tab:
   - Run `python scripts/build_link_generation_feed.py --crosswalk <output-dir>/activity_template_crosswalk.csv --out <output-dir>`.
   - Output `geracao_links_feed_todas.csv` and `geracao_links_feed_confirmadas.csv`.
   - The feed preserves the exact column order expected by the sheet and leaves formula-driven columns blank by default.
   - For a complete 90-day feed from live `activities`, run `python scripts/build_90d_template_feed.py --activities-json <json> --sfmc-overview <xlsx> --governance <xlsx> --out <output-dir>`.
   - Output `gaas_feed_90d_todos_template_ids.csv` with every unique recent Activity Name, reusing existing template IDs and generating missing ones.
   - The 90-day feed is ordered for operations as `BU custom (B2C > Plurix > B2B2C > others) > Parceiro asc > Segmento > Data de Disparo desc > Activity Name`, while preserving the exact sheet columns for copy/paste.
   - Output `gaas_feed_90d_inteligencia_momento.csv` as the companion audit for moment reasoning. Do not paste this helper file into the governance tab.
5. Interpret status:
   - `confirmado`: found in SFMC + live activities, `af_sub3` matches `template_id`, and CRM link has no forbidden params.
   - `revisar`: found in at least one operational source but has missing evidence or link mismatch.
   - `nao_encontrado`: present in governance but not found in the available SFMC/live activity sources.
6. Recommend action:
   - Confirmed rows can feed `communication_templates.metadata.activity_names_planejados` and asset upload planning.
   - Review rows need operator validation before `Vincular`.
   - Not-found rows stay as planned/backlog items until a fresher SFMC export or live activity source confirms them.

## GaaS Application Boundary

When preparing database or UI changes, align with these repo surfaces:

- `calendar-estrategico/src/types/communication.ts`
- `calendar-estrategico/src/services/communicationService.ts`
- `calendar-estrategico/src/hooks/useActivitySuggestions.ts`
- `calendar-estrategico/src/hooks/useTemplateCatalog.ts`
- `calendar-estrategico/supabase/migrations/20260621043200_communication_templates_foundation.sql`

Manual confirmation remains the write boundary. The app may show suggestions, evidence, and conflicts; only explicit operator actions should update `activities.template_id`, `communication_slots.current_template_id`, or upload assets to `crm-communications`.

## Expected Deliverable Shape

Return a concise operator readout:

- Coverage counts: governance rows, unique templates, unique activities, confirmed/review/not-found.
- Link integrity: `af_sub3` match count and forbidden CRM param count.
- Relationship shape: 1:1, template-to-many-activities, or activity-to-many-templates cases.
- Top confirmed examples and top review blockers.
- Paths to generated CSV/MD outputs.

Do not claim live `communication_templates`/`communication_slots` coverage unless those tables were actually readable in the current run.
