/** Keep the URL in a real anchor so SFMC can rewrite and track it. */
export function sfmcTableButton(href: string, label: string, compact = false, unsubscribe = false): string {
  const color = unsubscribe ? '#F4F5FB' : '#2C3490';
  const ink = unsubscribe ? '#2C3490' : '#ffffff';
  const padding = compact || unsubscribe ? '12px 20px' : '15px 26px';
  const size = compact || unsubscribe ? 13 : 15;
  const alias = unsubscribe ? 'Cancelar inscrição' : 'CTA cartão +amigo';
  // Cell padding and bgcolor remain available when a client drops anchor padding or radius.
  return `<table role="presentation" class="sfmc-button" align="center" cellpadding="0" cellspacing="0" border="0" bgcolor="${color}" style="border-collapse:separate;max-width:100%;background-color:${color};background-image:linear-gradient(${color},${color});border-radius:10px;"><tr><td align="center" valign="middle" bgcolor="${color}" style="padding:${padding};background-color:${color};background-image:linear-gradient(${color},${color});border-radius:10px;text-align:center;"><a class="${unsubscribe ? 'unsubscribe-link' : 'brand-text brand-odd cta-link'}" href="${href}" alias="${alias}" target="_blank" style="display:block;color:${ink};-webkit-text-fill-color:${ink};font-family:Arial,Helvetica,sans-serif;font-size:${size}px;line-height:24px;font-weight:700;text-align:center;text-decoration:none;">${label}</a></td></tr></table>`;
}

export function upgradePlurixV16Buttons(html: string): string {
  let count = 0;
  const result = html.replace(/<a class="brand-text brand-odd(?: cta-link)?" href="(%%=RedirectTo\(TreatAsContent\(@LinkCTA[12]\)\)=%%)" target="_blank" style="[^"]*">(%%=TreatAsContent\(@TituloCTA[12]\)=%%)<\/a>/g,
    (tag, href: string, label: string) => {
      count++;
      return sfmcTableButton(href, label, !tag.includes('cta-link'));
    });
  if (count !== 6) throw new Error(`Expected six Plurix CTA branches, found ${count}`);
  return result
    .replace('.cta-cell, .cta-link { display: block !important; width: 100% !important; box-sizing: border-box !important; }', '.cta-cell { display: block !important; width: 100% !important; box-sizing: border-box !important; }')
    .replace('.cta-link { padding-left: 18px !important; padding-right: 18px !important; }', '.sfmc-button { width:100% !important; }');
}
