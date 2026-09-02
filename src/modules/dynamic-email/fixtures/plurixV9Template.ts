import { PLURIX_V8_TEMPLATE } from './plurixV8Template';

export const PLURIX_V9_TEMPLATE_ID = 'builtin-plurix-v9';
export const PLURIX_V9_TEMPLATE_NAME = 'PLURIX V9';

const SHARED_SECONDARY_BLOCK = `          %%[ IF NOT EMPTY(@TituloCopy2) OR NOT EMPTY(@Copy2Preto) OR (NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2)) OR NOT EMPTY(@Banner2Corpo) THEN ]%%
          <tr>
            <td style="padding:0; background-color:#ffffff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="55%" valign="middle" class="stack-column stack-copy" style="width:55%; padding:30px 12px 30px 32px;">
                    %%[ IF NOT EMPTY(@TituloCopy2) THEN ]%%
                    <h2 style="margin:0 0 10px 0; color:%%=v(@CorTituloCopy2)=%%; font-size:%%=v(@TamanhoFonteTituloCopy2)=%%px; line-height:1.25; font-weight:700;">%%=TreatAsContent(@TituloCopy2)=%%</h2>
                    %%[ ENDIF ]%%
                    %%[ IF NOT EMPTY(@Copy2Preto) THEN ]%%
                    <div style="margin:0 0 18px 0; color:%%=v(@CorCopy2)=%%; font-size:%%=v(@TamanhoFonteCopy2)=%%px; line-height:1.55;">%%=TreatAsContent(@Copy2Preto)=%%</div>
                    %%[ ENDIF ]%%
                    %%[ IF NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2) THEN ]%%
                    <a href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" target="_blank" style="display:inline-block; border-radius:10px; background-color:#2C3490; color:#ffffff; padding:14px 20px; font-size:13px; line-height:18px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA2)=%%</a>
                    %%[ ENDIF ]%%
                  </td>
                  <td width="45%" align="center" valign="middle" class="stack-column stack-image" style="width:45%; padding:24px 28px 24px 8px;">
                    %%[ IF NOT EMPTY(@Banner2Corpo) THEN ]%%
                    %%[ IF NOT EMPTY(@LinkBanner2) THEN ]%%<a href="%%=RedirectTo(TreatAsContent(@LinkBanner2))=%%" target="_blank" style="text-decoration:none;">%%[ ENDIF ]%%
                    <img src="%%=v(@Banner2Corpo)=%%" alt="" width="220" style="display:block; width:100%; max-width:220px; height:auto; border:0; margin:0 auto;">
                    %%[ IF NOT EMPTY(@LinkBanner2) THEN ]%%</a>%%[ ENDIF ]%%
                    %%[ ENDIF ]%%
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          %%[ ENDIF ]%%`;

const EMAIL_2_SECONDARY_BLOCK = `          %%[ IF @Sequencia == "E-mail 2" THEN ]%%
          %%[ IF NOT EMPTY(@TituloCopy2) OR NOT EMPTY(@Copy2Preto) THEN ]%%
          <tr>
            <td align="center" bgcolor="#F6F6FB" class="content-pad" style="padding:28px 32px; background-color:#F6F6FB;">
              %%[ IF NOT EMPTY(@TituloCopy2) THEN ]%%
              <h2 class="headline" style="max-width:500px; margin:0 auto 20px auto; color:%%=v(@CorTituloCopy2)=%%; font-size:%%=v(@TamanhoFonteTituloCopy2)=%%px; line-height:1.25; font-weight:700; text-align:center;">%%=TreatAsContent(@TituloCopy2)=%%</h2>
              %%[ ENDIF ]%%
              %%[ IF NOT EMPTY(@Copy2Preto) THEN ]%%
              <div class="body-copy" style="max-width:480px; margin:0 auto; padding:18px 20px; border:1px solid #E1E3F2; border-radius:12px; background-color:#ffffff; color:%%=v(@CorCopy2)=%%; font-size:%%=v(@TamanhoFonteCopy2)=%%px; line-height:1.75; text-align:left;">%%=TreatAsContent(@Copy2Preto)=%%</div>
              %%[ ENDIF ]%%
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ IF NOT EMPTY(@TituloCTA2) OR NOT EMPTY(@Banner2Corpo) THEN ]%%
          <tr>
            <td style="padding:0; background-color:#ffffff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="55%" valign="middle" class="stack-column stack-copy" style="width:55%; padding:30px 12px 30px 32px;">
                    <h2 style="margin:0 0 10px 0; color:#2C3490; font-size:24px; line-height:1.25; font-weight:700;">Peça agora seu cartão +amigo</h2>
                    <p style="margin:0 0 18px 0; color:#454A64; font-size:15px; line-height:1.55;">Comece a aproveitar os benefícios nas suas compras do dia a dia.</p>
                    %%[ IF NOT EMPTY(@TituloCTA2) AND NOT EMPTY(@LinkCTA2) THEN ]%%
                    <a href="%%=RedirectTo(TreatAsContent(@LinkCTA2))=%%" target="_blank" style="display:inline-block; border-radius:10px; background-color:#2C3490; color:#ffffff; padding:14px 20px; font-size:13px; line-height:18px; text-align:center; text-decoration:none; font-weight:700;">%%=TreatAsContent(@TituloCTA2)=%%</a>
                    %%[ ENDIF ]%%
                  </td>
                  <td width="45%" align="center" valign="middle" class="stack-column stack-image" style="width:45%; padding:24px 28px 24px 8px;">
                    %%[ IF NOT EMPTY(@Banner2Corpo) THEN ]%%
                    %%[ IF NOT EMPTY(@LinkBanner2) THEN ]%%<a href="%%=RedirectTo(TreatAsContent(@LinkBanner2))=%%" target="_blank" style="text-decoration:none;">%%[ ENDIF ]%%
                    <img src="%%=v(@Banner2Corpo)=%%" alt="Cartões +amigo" width="220" style="display:block; width:100%; max-width:220px; height:auto; border:0; margin:0 auto;">
                    %%[ IF NOT EMPTY(@LinkBanner2) THEN ]%%</a>%%[ ENDIF ]%%
                    %%[ ENDIF ]%%
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          %%[ ENDIF ]%%
          %%[ ELSE ]%%
${SHARED_SECONDARY_BLOCK}
          %%[ ENDIF ]%%`;

const buildPlurixV9Template = (): string => {
  const normalized = PLURIX_V8_TEMPLATE.replace(/\r\n/g, '\n');
  const occurrences = normalized.split(SHARED_SECONDARY_BLOCK).length - 1;
  if (occurrences !== 1) throw new Error(`Expected one shared secondary block in Plurix V8; found ${occurrences}.`);
  const candidate = normalized.replace(SHARED_SECONDARY_BLOCK, EMAIL_2_SECONDARY_BLOCK);
  if (candidate === normalized) throw new Error('No V9 transformation was applied.');
  if (!candidate.includes('IF @Sequencia == "E-mail 2" THEN')) throw new Error('E-mail 2 branch missing from Plurix V9.');
  return candidate;
};

export const PLURIX_V9_TEMPLATE = buildPlurixV9Template();
