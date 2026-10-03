# Result subjects embedded in the Wiki

Results remains a canonical Wiki topic. There is no new learning-section tab. Notes are authored in the existing OneDrive/Obsidian vault and projected to the existing authenticated Supabase tables. Internal notes and inventory records must not be imported into the public frontend bundle.

## Note contracts

`growth_catalog` enables a metadata-only catalog using published `growth-assunto` tags, with optional `dominio`, `parceiro` and `segmento` restrictions. Catalog filtering handles multiple segment tags. Opening a card uses the existing note reader and history.

`analytics` selects one of the existing authenticated sources: `crm`, `renta`, `media`, `b2c`. It contains a fixed `scope` and an optional `any_of` array of at most 200 exact scope predicates. Unknown keys, non-string values, overlong strings and incompatible domains are rejected. Markdown cannot execute SQL, arbitrary endpoints or JavaScript.

```yaml
analytics:
  domain: crm
  scope:
    bu: B2C
    segment: Abandonados
    partner: Example
    operation_id: stable-discovery-id
```

The fixed scope cannot be cleared by the result filters. Additional stage, subgroup, journey and vintage filters refine it. An operation ID identifies retrospective ownership; it is not itself a physical row filter. `any_of` preserves the explicit discovery memberships for candidate rentabilization families.

## Temporal and measurement contracts

`ResultsWorkspace` loads all authorized rows using stable pagination and validates the count at the beginning and end. Cache is in-memory, user-scoped and expires after five minutes. It excludes open days; current/prior comparisons use the same calendar cut. Missing measures and calendar gaps stay null. CRM duplicate candidates are detected before narrowing the note's scope. Media days with overlapping campaign/adset/ad grains retain metadata but their additive measures are withheld.

Acquisition displays recorded cards/proposals/cost. Rentabilization displays clicks/actionable base/cost and does not infer usage, unlock, insurance sales or revenue. Platform clicks/conversions do not imply cards or CAC. B2C totals and component populations are never added together.

## Retrospectives and navigation

The migration extends the existing append-only retrospective guard with rentabilization and optional detail keys. Old six-key JSON scopes remain unchanged, so prior retrospectives retain their identities. RLS, authorship, optimistic revision checks and permissions remain intact. A note's result scope and evidence selection are included in the retrospective source snapshot.

Result filters and contextual-bet verification links retain `section=vault` and the note ID. Navigating to a different note clears result filters; browser Back restores them. Only acquisition/media/B2C use the existing contextual-bet contract; rentabilization uses its retrospective without inventing a new bet front.

## Reproduction

Run `scripts/build-wiki-subjects.py --inventory <audited-directory> --vault <canonical-directory> --manifest <output-file>`, then the workspace's `scripts/bundle_vault.py`. The builder consumes the inventory artifacts; it does not infer active campaigns from editorial readiness. Project the complete vault through existing sync RPCs after checking that all currently published paths are present. Keep the content manifest and publication checks outside the public code bundle.

Validation covers frontend scope/route contracts, retrospective SQL guards, all generated wikilink destinations, baseline TypeScript debt, production build and authenticated browser checks.
