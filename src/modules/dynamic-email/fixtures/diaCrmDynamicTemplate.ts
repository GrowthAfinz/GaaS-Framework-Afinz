import { B2C_CLASSIC_VIBE_DYNAMIC_TEMPLATE } from './b2cClassicVibeDynamicTemplate';

export const DIA_CRM_DYNAMIC_TEMPLATE_ID = 'dia-crm-dynamic-v1';

const OFFER_STRIP = `
<div style="padding:18px 0 8px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
<td width="33.33%" align="center" style="padding:4px"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/d6162872-070f-4e72-af53-93b632946d98.png" width="160" alt="R$20 em compras acima de R$200 no DIA" style="display:block;width:100%;max-width:160px;height:auto;border:0"></td>
<td width="33.33%" align="center" style="padding:4px"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/a17e95ff-52e3-4e39-8bf6-f71754fa38f0.png" width="160" alt="5% de desconto nas lojas DIA" style="display:block;width:100%;max-width:160px;height:auto;border:0"></td>
<td width="33.33%" align="center" style="padding:4px"><img class="asset" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/cfbad429-af19-4397-8062-c9df57d5e97c.png" width="160" alt="R$30 em compras acima de R$300 no DIA" style="display:block;width:100%;max-width:160px;height:auto;border:0"></td>
</tr></table></div>`;

const VIBE_STRIP = `
<tr><td class="pad" align="center" style="padding:22px 24px 8px"><div style="font-size:23px;line-height:1.25;font-weight:700;color:#00aeb5">E não para por aí!</div></td></tr>
<tr><td class="pad" align="center" style="padding:8px 24px 18px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
<td width="50%" align="center" valign="top" style="padding:4px"><img class="benefit" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ba613caa-444d-4954-acd0-1b151dada6ec.png" width="190" alt="R$100 em Créditos Vibe na primeira compra" style="display:block;width:100%;max-width:190px;height:auto;border:0"></td>
<td width="50%" align="center" valign="top" style="padding:4px"><img class="benefit" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c392c8ff-b97f-4a86-8c56-df49ea5b2374.png" width="190" alt="Créditos Vibe ao pagar a fatura em dia" style="display:block;width:100%;max-width:190px;height:auto;border:0"></td>
</tr></table></td></tr>`;

const DIA_FOOTER = `<tr><td align="center" style="padding:24px 20px 12px"><div style="color:#00aeb5;font-size:22px;font-weight:700">Afinz, juntos fazemos mais!</div><div style="padding:14px 0 4px;font-size:12px;color:#4b5563">Acompanhe a Afinz nas redes sociais</div><div><a href="https://www.instagram.com/afinzoficial/"><img src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/b07a3e46-7c00-409b-81fe-c1b5eceebf64.png" width="31" alt="Instagram" style="margin:0 4px;border:0"></a><a href="https://web.facebook.com/Afinz"><img src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/8f2daf4e-a386-471d-bc7b-aea7a6c8c416.png" width="30" alt="Facebook" style="margin:0 4px;border:0"></a><a href="https://www.tiktok.com/@afinzoficial"><img src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/31227d6c-28bc-41b4-8b27-c64795765698.png" width="30" alt="TikTok" style="margin:0 4px;border:0"></a><a href="https://afinz.com.br/blog/"><img src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/f37dd205-17fa-47d9-a98a-4f538ef8d637.png" width="30" alt="Blog Afinz" style="margin:0 4px;border:0"></a><a href="https://afinz.com.br/"><img src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ef14c352-0006-411d-b873-9b35c7dffde9.png" width="30" alt="Site Afinz" style="margin:0 4px;border:0"></a></div><div style="padding-top:14px"><img src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/787eb5c7-39ee-4b30-987a-0a81a38241a3.png" width="92" alt="Afinz" style="border:0"></div></td></tr>`;

const CTA_MARKER = `%%[ IF NOT EMPTY(@TituloCTA1) AND NOT EMPTY(@LinkCTA1) THEN ]%%<div style="padding:22px 0 8px">`;
const BANNER_MARKER = `%%[ IF NOT EMPTY(@Banner1Corpo) THEN ]%%<tr><td class="pad" align="center" style="padding:14px 34px">`;
const OLD_FOOTER_START = `<tr><td align="center" style="padding:20px 28px"><div style="color:#00C6CC;font-size:22px;font-weight:700">Cartão Afinz, vantagens de ponta a ponta!</div>`;
const OLD_FOOTER_END = `</div></td></tr>`;

const withOfferStrip = B2C_CLASSIC_VIBE_DYNAMIC_TEMPLATE.replace(CTA_MARKER, `${OFFER_STRIP}\n${CTA_MARKER}`);
const withBenefitStrip = withOfferStrip.replace(BANNER_MARKER, `${VIBE_STRIP}\n${BANNER_MARKER}`);
const footerStart = withBenefitStrip.indexOf(OLD_FOOTER_START);
const footerEnd = withBenefitStrip.indexOf(OLD_FOOTER_END, footerStart) + OLD_FOOTER_END.length;

if (footerStart < 0 || footerEnd < OLD_FOOTER_END.length) {
  throw new Error('Base B2C footer markers changed; update DIA template composition.');
}

/**
 * DIA-specific single-source renderer. The 36 briefing fields remain the data
 * contract; only brand-stable DIA/Vibe benefit strips and the original footer
 * are fixed here because they are shared by the eight source HTMLs.
 */
export const DIA_CRM_DYNAMIC_TEMPLATE = `${withBenefitStrip.slice(0, footerStart)}${DIA_FOOTER}${withBenefitStrip.slice(footerEnd)}`
  .replace('background:#f3f5f7', 'background:#ffffff')
  .replace('padding:18px 8px', 'padding:0')
  .replace(
    '<img class="asset" src="%%=v(@Banner1Corpo)=%%" width="532" alt="Benefícios do cartão Afinz" style="display:block;width:100%;max-width:532px;height:auto;border:0">',
    '%%[ IF @Sequencia == "E-mail 1" OR @Sequencia == "E-mail 4" OR @Sequencia == "E-mail 8" THEN ]%%<img class="asset benefit" src="%%=v(@Banner1Corpo)=%%" width="190" alt="Benefício Vibe" style="display:block;width:100%;max-width:190px;height:auto;border:0">%%[ ELSE ]%%<img class="asset" src="%%=v(@Banner1Corpo)=%%" width="532" alt="Benefícios do cartão Afinz" style="display:block;width:100%;max-width:532px;height:auto;border:0">%%[ ENDIF ]%%',
  );
