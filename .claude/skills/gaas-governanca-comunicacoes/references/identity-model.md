# Identity Model

## Entities

- `template_id`: stable identity of reusable CRM content. Use it for the communication/template/asset being governed.
- `activity_name`: SFMC/GaaS execution taxonomy. Use it for audit, search, historical performance, and linking a dispatch to a template.
- `communication_templates`: catalog row for content and asset metadata.
- `communication_slots`: operational slot in a journey, keyed by `journey_name + activity_name + channel`.
- `activities.template_id`: historical execution-to-template link used by GaaS performance views.
- `attribution_links`: versioned AppsFlyer links. For CRM, the link carries the template identity in `af_sub3`.

## Invariants

- Content-visible changes require a new `template_id` or explicit version suffix.
- Execution-only changes, dates, journey branches, or different Activity Names can reuse the same `template_id`.
- A template may map to many Activity Names.
- One Activity Name should not be linked to multiple conflicting templates without operator review.
- AppsFlyer OneLink infrastructure ids are not CRM `template_id`s.
- `Semana / Momento` is execution context, not content identity. It can help generate a missing `template_id`, but it should not force a new content identity when the creative remains the same.

## CRM AppsFlyer Parameters

CRM links should use:

```text
c={campaign}&af_sub1={segment_or_base}&af_sub2={week_or_moment}&af_sub3={template_id}
```

Block these in CRM output unless the user explicitly changes the contract:

```text
pid, af_channel, af_ad, af_adset, af_ad_id, deep_link_value, af_sub4
```

Reason: CRM link governance should stay compact. Channel/pid can live in the OneLink/link-short configuration; `af_ad*` fields belong more naturally to paid media.
