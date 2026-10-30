# Moment Inference

Use this reference when the user asks to order recent dispatches or reason about the probability of a dispatch moment.

## Feed Order

For copy/paste governance feeds, keep the sheet schema unchanged and sort rows by:

```text
BU custom (B2C > Plurix > B2B2C > others) > Parceiro asc > Segmento asc > Data de Disparo desc > Activity Name asc
```

This makes the feed operational: the owner first scans the business unit in the requested operating order, then partner, audience, and newest dispatch evidence.

Do not add `BU` or dispatch-date helper columns to the pasteable governance CSV unless the user explicitly changes the target sheet. Put helper fields in the moment intelligence audit instead.

## Moment Types

Classify the dispatch context into one of four operator-facing buckets:

- `regua_semana`: the Activity Name or journey contains weekly sequence evidence such as `s1`, `s2`, `disp1s3`, or `SEM3`.
- `regua_disparo`: the Activity Name contains a dispatch sequence such as `d01`, `d02`, `disp1`, or `disparo2`.
- `pontual`: the taxonomy suggests a one-off campaign such as pesquisa, black friday, halloween, aniversario, reativacao, or avulso.
- `sem_padrao`: no reliable sequence or punctuality token was found.

## Analysis Key

When studying prior or next dispatches, group candidates by:

```text
BU + Segmento + Canal + campaign_code
```

Use `app_code` or partner only as a tiebreaker when the same BU/Segmento/Canal/campaign cluster mixes brands or partners.

## Confidence

- `alta`: explicit weekly or dispatch token was found in Activity Name or Journey Name.
- `media`: punctual campaign evidence was found, but no fixed sequence token exists.
- `baixa`: no sequence evidence was found. Treat the row as a review candidate.

## Operator Boundary

The moment model is a suggestion layer. It can prioritize review and propose the likely next/previous dispatch, but it must not auto-link templates or overwrite governance values without operator confirmation.
