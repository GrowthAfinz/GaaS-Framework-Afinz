# Project map

Resolver caminhos a partir do workspace `ACALENDARIO APP`.

## Leitura obrigatória

1. `MASTER_DECK_SPEC.md`
2. `Afinz-CRM-Midia-Vault/08-Engenharia/Report-Live-Sheets-Slides.md`
3. `Afinz-CRM-Midia-Vault/08-Engenharia/Report-Live-Versionamento-e-Publicacao.md`
4. `Afinz-CRM-Midia-Vault/09-Inteligencia-IA/Agente-Report-Live-Handoff.md`
5. `outputs/report-live-audit/AUDITORIA_REPORT_LIVE_2026-07-23.md`
6. `calendar-estrategico/supabase/functions/report-sync/index.ts`
7. `calendar-estrategico/supabase/functions/report-sync/report-live-engine.ts`
8. `calendar-estrategico/supabase/functions/report-sync/report-live-versioning.ts`
9. `calendar-estrategico/supabase/functions/report-sync-v4-setup/index.ts`
10. migrations `report_live*` mais recentes.

## Destinos fixos

- Sheet: `1BYLpYzDvppMC32ITfbSQdejB3RSxOcAdJZteCd54nwA`
- Slides: `1iGAdoxp1yC91v9_Y0zCD0XHrkjZvUrikyLXbKP-_wv0`
- Bucket privado: `report-live`

## Invariantes

- Um Sheet e um Slides vivo.
- Números vêm de código/dado; IA redige.
- Missing não é zero.
- Taxas e CAC usam SUM/SUM.
- Período anterior usa iso-dias.
- CPA sempre nomeia o evento e não é CAC.
- Parceiro bruto é preservado; parceiro canônico é derivado com motivo e confiança.
- Build não publica.
- Publicação exige certificação e lock.
- Rollback usa artefato histórico; não recalcula.
