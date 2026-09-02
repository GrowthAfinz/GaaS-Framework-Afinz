import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migrationPath = resolve(process.cwd(), 'supabase/migrations/20260902145708_recover_plurix_v8_template.sql');
const fixturePath = resolve(process.cwd(), 'src/modules/dynamic-email/fixtures/plurixUxV2Template.ts');
const delimiter = '$plurix_v8$';
const fixtureSource = readFileSync(fixturePath, 'utf8');
const templateMatch = fixtureSource.match(/PLURIX_UX_V2_TEMPLATE = `([\s\S]*)`;\s*$/);
if (!templateMatch) throw new Error('Could not extract the Plurix UX v2 template literal.');

const ctaAnchor = `          </tr>
          %%[ IF NOT EMPTY(@Banner1Corpo) THEN ]%%`;
const ctaBlock = `          </tr>
          %%[ IF NOT EMPTY(@TituloCTA1) AND NOT EMPTY(@LinkCTA1) THEN ]%%
          <tr>
            <td align="center" class="content-pad cta-cell" style="padding:14px 32px 30px 32px;">
              <a class="cta-link" href="%%=RedirectTo(TreatAsContent(@LinkCTA1))=%%" target="_blank" style="display:inline-block; min-width:280px; border-radius:10px; background-color:#2C3490; color:#ffffff; padding:15px 26px; font-size:15px; line-height:20px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA1)=%%</a>
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@Banner1Corpo) THEN ]%%`;
const footerBlock = `              %%[ IF NOT EMPTY(@Rodape) THEN ]%%
              <div style="margin:0; color:#6b7280; font-size:11px; line-height:1.45; text-align:center;">%%=TreatAsContent(@Rodape)=%%</div>
              %%[ ENDIF ]%%
`;
const normalizedTemplate = templateMatch[1].replace(/\r\n/g, '\n');
const PLURIX_V8_TEMPLATE = normalizedTemplate
  .replace(ctaAnchor, ctaBlock)
  .replace('%%[ IF NOT EMPTY(@NotaLegal) OR NOT EMPTY(@Rodape) THEN ]%%', '%%[ IF NOT EMPTY(@NotaLegal) THEN ]%%')
  .replace(footerBlock, '');
const PLURIX_V8_TEMPLATE_ID = 'builtin-plurix-v8';
const PLURIX_V8_TEMPLATE_NAME = 'PLURIX V8';

if (PLURIX_V8_TEMPLATE === normalizedTemplate) throw new Error('No V8 transformations were applied.');
if ((PLURIX_V8_TEMPLATE.match(/RedirectTo\(TreatAsContent\(@LinkCTA1\)\)/g) ?? []).length !== 2) throw new Error('V8 must render CTA 1 in both sequence branches.');
if (PLURIX_V8_TEMPLATE.includes('TreatAsContent(@Rodape)')) throw new Error('Manual sender footer remains in V8.');

if (PLURIX_V8_TEMPLATE.includes(delimiter)) throw new Error('Migration delimiter occurs inside the template source.');

const sql = `-- Recover the complete UX v2 visual hierarchy while preserving the safe V7 changes.
-- V6 and V7 remain active for explicit rollback/comparison; V8 becomes the shared default.
insert into public.dynamic_email_template_slots (
  id, name, source, is_principal, status, version, created_by, updated_by
)
values (
  '${PLURIX_V8_TEMPLATE_ID}',
  '${PLURIX_V8_TEMPLATE_NAME}',
  ${delimiter}${PLURIX_V8_TEMPLATE}${delimiter},
  false,
  'active',
  1,
  null,
  null
)
on conflict (id) do update set
  name = excluded.name,
  source = excluded.source,
  status = 'active',
  version = public.dynamic_email_template_slots.version + 1,
  updated_at = now();

select public.set_dynamic_email_principal('${PLURIX_V8_TEMPLATE_ID}');
`;

writeFileSync(migrationPath, sql, 'utf8');
console.log(migrationPath);
