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

The fixed scope cannot be cleared by the result filters. Additional BU, partner (when not fixed), stage, subgroup, journey and vintage filters refine it. A refinement that no `any_of` rule admits is dropped instead of producing an empty page. BU and partner are coupled: when a new choice leaves no observed row, the other one is cleared if it is a reader refinement. Changing BU, partner or public clears a reader-selected `operation_id`, so a retrospective is never saved under another operation. An operation ID identifies retrospective ownership; it is not itself a physical row filter. `any_of` preserves the explicit discovery memberships for candidate rentabilization families.

## Page families (results wiki, 2026-10-28)

Pages that decide about one thing declare `tipo: dominio | publico | parceiro | mecanica | objetivo | iniciativa` (accents and case are ignored; `tipo` wins over `type`). They and every note under `10-Resultados/` belong to the Results topic. The catalog lists them by type beside the `growth-assunto` flow, which is unchanged. Notes without one of these types (including all `Assunto-*`) render exactly as before.

```yaml
tipo: publico
analytics: {"domain": "crm", "scope": {"segment": "Abandonados"}}
variantes: [{"operation_id": "CRM-bdc57e480d", "bu": "Plurix", "partner": "Plurix"}, ...]
matriz: true            # default on for dominio, publico, parceiro; `false` turns it off
listas_vivas: true      # default on for the six types; `false` turns it off
```

- `variantes` names the confirmed public × partner operations of the page. It does not filter rows; it orders the matrix columns and lets a matrix cell carry its `bu` and `operation_id` when every observed row of the cell belongs to that variant.
- `matriz` (crm or renta only) reuses the `analytics` scope; an object `{scope: {...}}` may only narrow it. Without `analytics`, the object must carry `domain` and `scope`, and it also feeds the result block. Rows are segments, columns are canonical partners, cells show recorded cards (or clicks), dispatches used and the same ratio as the result block, with variation against the same calendar cut of the previous month. Only combinations observed in the records become cells; an absent combination is empty, never zero. Same reads, closed days, duplicate exclusion and pagination as `ResultsWorkspace`. The month follows `result_month`. Clicking a row, column or cell opens the page's result block filtered by public, partner or both.
- `listas_vivas` lists bets (`growth_bet_source_links_v`), learnings (`growth_memory_active_v` plus `growth_learning_links` pointing to the page), retrospectives (latest revision per scope and period) and CRM investigations (`growth_list_investigations`) whose scope matches the page. Read-only through the authenticated client, so RLS applies. Relation tiers: tied to the page or one of its variants, same scope, related scope, front context (collapsed). Conflicting scopes are excluded. An object `{domain, scope}` can set the scope when the page has no `analytics`.
- On these pages the live blocks are placed under the headings `Resultado ao vivo`, `Por parceiro` / `Por público` / `Público × parceiro` and `Decisões, apostas e aprendizados` / `O que já aprendemos` when present; blocks without a heading travel with the result block.

## Temporal and measurement contracts

`ResultsWorkspace` loads all authorized rows using stable pagination and validates the count at the beginning and end. Cache is in-memory, user-scoped and expires after five minutes. It excludes open days; current/prior comparisons use the same calendar cut. Missing measures and calendar gaps stay null. CRM duplicate candidates are detected before narrowing the note's scope. Media days with overlapping campaign/adset/ad grains retain metadata but their additive measures are withheld.

Acquisition displays recorded cards/proposals/cost. Rentabilization displays clicks/actionable base/cost and does not infer usage, unlock, insurance sales or revenue. Platform clicks/conversions do not imply cards or CAC. B2C totals and component populations are never added together.

## Retrospectives and navigation

The migration extends the existing append-only retrospective guard with rentabilization and optional detail keys. Old six-key JSON scopes remain unchanged, so prior retrospectives retain their identities. RLS, authorship, optimistic revision checks and permissions remain intact. A note's result scope and evidence selection are included in the retrospective source snapshot.

Result filters and contextual-bet verification links retain `section=vault` and the note ID. Navigating to a different note clears result filters; browser Back restores them. Only acquisition/media/B2C use the existing contextual-bet contract; rentabilization uses its retrospective without inventing a new bet front.

## Reproduction

Run `scripts/build-wiki-subjects.py --inventory <audited-directory> --vault <canonical-directory> --manifest <output-file>`, then the workspace's `scripts/bundle_vault.py`. The builder consumes the inventory artifacts; it does not infer active campaigns from editorial readiness. Project the complete vault through existing sync RPCs after checking that all currently published paths are present. Keep the content manifest and publication checks outside the public code bundle.

Validation covers frontend scope/route contracts, retrospective SQL guards, all generated wikilink destinations, baseline TypeScript debt, production build and authenticated browser checks.
