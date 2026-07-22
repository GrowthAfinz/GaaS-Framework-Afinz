# Meta B2C App funnel ingestion

This increment creates the governed foundation for the paid-media funnel. It is additive: the existing `paid_media_metrics` collector remains unchanged.

## What is implemented

- `paid_media_collection_runs`: atomic execution lifecycle (`pending`, `complete`, `failed`).
- `event_map`: certified, versioned Meta aliases with one productive measure per alias group.
- `paid_media_actions`: daily long-format observations for campaign, ad set and ad grains.
- `v_paid_media_actions_latest`: latest mature snapshot from completed runs only.
- `v_funnel_ad_latest`: productive ad-grain funnel without summing aliases or incompatible windows.
- `v_paid_media_actions_reconciliation`: ad versus ad set versus campaign controls.
- `collect-meta-events`: feature-flagged collector for `actions[]`, `results` and `cost_per_result`.

The certified decision funnel currently is:

1. Install (`mobile_app_install`, Meta attributed, 7-day click).
2. StartTrial (`conversions:start_trial_mobile_app`, Meta results, effective 7-day click).
3. SubmitApplication remains blocked because it is not instrumented in Meta.

## Safe activation sequence

1. Apply the migration in Supabase local or a database branch.
2. Configure secrets: `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, and `META_GOVERNED_CAMPAIGN_IDS`.
3. Keep `COLLECT_META_EVENTS_ENABLED=false` and deploy the function.
4. Enable it only in the isolated environment and run a three-day backfill.
5. Reconcile the certified campaign totals: 19/07 = 2, 20/07 = 8, 21/07 = 1 StartTrials; total = 11.
6. Start daily dual-write, reprocessing the latest 28 closed days.
7. Cut the legacy StartTrial mapping only after 14 consecutive approved closed days.

The BI label must be **StartTrial attributed - Meta - 7-day click**. It must not be presented as the total app volume.

## Example request

```json
{
  "mode": "backfill",
  "since": "2026-07-19",
  "until": "2026-07-21",
  "campaign_id": "<governed campaign id>"
}
```

The endpoint requires an authenticated request and rejects campaigns outside the configured allowlist.
