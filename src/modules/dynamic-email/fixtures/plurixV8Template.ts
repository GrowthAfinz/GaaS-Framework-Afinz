import { PLURIX_UX_V2_TEMPLATE } from './plurixUxV2Template';

export const PLURIX_V8_TEMPLATE_ID = 'builtin-plurix-v8';
export const PLURIX_V8_TEMPLATE_NAME = 'PLURIX V8';

const EMAIL_1_CTA_ANCHOR = `          </tr>
          %%[ IF NOT EMPTY(@Banner1Corpo) THEN ]%%`;

const EMAIL_1_CTA_BLOCK = `          </tr>
          %%[ IF NOT EMPTY(@TituloCTA1) AND NOT EMPTY(@LinkCTA1) THEN ]%%
          <tr>
            <td align="center" class="content-pad cta-cell" style="padding:14px 32px 30px 32px;">
              <a class="cta-link" href="%%=RedirectTo(TreatAsContent(@LinkCTA1))=%%" target="_blank" style="display:inline-block; min-width:280px; border-radius:10px; background-color:#2C3490; color:#ffffff; padding:15px 26px; font-size:15px; line-height:20px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA1)=%%</a>
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@Banner1Corpo) THEN ]%%`;

const MANUAL_FOOTER_BLOCK = `              %%[ IF NOT EMPTY(@Rodape) THEN ]%%
              <div style="margin:0; color:#6b7280; font-size:11px; line-height:1.45; text-align:center;">%%=TreatAsContent(@Rodape)=%%</div>
              %%[ ENDIF ]%%
`;

const buildPlurixV8Template = (): string => {
  if (!PLURIX_UX_V2_TEMPLATE.includes(EMAIL_1_CTA_ANCHOR)) throw new Error('CTA anchor missing from Plurix UX v2 template.');
  if (!PLURIX_UX_V2_TEMPLATE.includes(MANUAL_FOOTER_BLOCK)) throw new Error('Manual footer block missing from Plurix UX v2 template.');

  return PLURIX_UX_V2_TEMPLATE
    .replace(EMAIL_1_CTA_ANCHOR, EMAIL_1_CTA_BLOCK)
    .replace('%%[ IF NOT EMPTY(@NotaLegal) OR NOT EMPTY(@Rodape) THEN ]%%', '%%[ IF NOT EMPTY(@NotaLegal) THEN ]%%')
    .replace(MANUAL_FOOTER_BLOCK, '');
};

export const PLURIX_V8_TEMPLATE = buildPlurixV8Template();
