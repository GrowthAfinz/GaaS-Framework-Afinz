import { PLURIX_V13_TEMPLATE, V13_HEADER_BRAND_LOGO } from './plurixV13Template';

export const PLURIX_V14_TEMPLATE_ID = 'builtin-plurix-v14';
export const PLURIX_V14_TEMPLATE_NAME = 'PLURIX V14 · tema claro preservado (candidata)';

function once(source: string, anchor: string, replacement: string): string {
  const parts = source.split(anchor);
  if (parts.length !== 2) throw new Error(`PLURIX V14: âncora encontrada ${parts.length - 1} vezes: ${anchor}`);
  return parts.join(replacement);
}

const blend = (text: string) => `<span class="gmail-blend-screen"><span class="gmail-blend-difference">${text}</span></span>`;

// Estilos da grade governada, aplicados na saída sem alterar o briefing ou o preparo.
// Replace é nativo do AMPscript; o preview interpreta a mesma expressão.
function lightFragment(variable: string): string {
  let value = `@${variable}`;
  for (const color of ['#F4F5FB', '#E7A921', '#ffffff', '#F6F6FB']) {
    for (const property of ['background-color', 'background']) {
      const from = `${property}:${color};`;
      const to = `${from}background-image:linear-gradient(${color},${color});`;
      value = `Replace(${value}, "${from}", "${to}")`;
    }
  }
  for (const color of ['#242424', '#2C3490', '#4A4F6A']) {
    value = `Replace(${value}, "color:${color};", "color:${color};-webkit-text-fill-color:${color};")`;
  }
  return `%%=TreatAsContent(${value})=%%`;
}

function buildPlurixV14(): string {
  let source = PLURIX_V13_TEMPLATE.split('\r\n').join('\n');
  source = once(source, '/* PLURIX V13 (candidata):', '/* PLURIX V14 (candidata):');
  source = source.split('@PLXV13Inicializado').join('@PLXV14Inicializado');
  const boundary = source.indexOf('<!DOCTYPE html>');
  const setup = source.slice(0, boundary);
  let html = source.slice(boundary);
  html = once(html, '<style>', `<style>
    :root { color-scheme: light only; }
    u + .body .gmail-blend-screen { background:#000; mix-blend-mode:screen; }
    u + .body .gmail-blend-difference { background:#000; mix-blend-mode:difference; }
    [data-ogsc] .brand-text, [data-ogsc] .brand-text * { color:#ffffff !important; }
    [data-ogsb] .brand-header { background-color:#4A5BA6 !important; }
    [data-ogsb] .brand-odd { background-color:#2C3490 !important; }
    [data-ogsb] .brand-even { background-color:#343B61 !important; }
    [data-ogsb] .brand-top { background-color:#4A5BA6 !important; }`);
  html = once(html, '<body style=', '<body class="body" style=');
  html = once(html, '</head>\n<body', '</head>\n<u></u>\n<body');
  // Uma regra por classe no breakpoint. As cores críticas continuam inline.
  for (const cls of ['hdr-copy', 'hdr-title', 'hdr-card']) {
    const rule = new RegExp(`      \\.${cls} \\{[^}]*\\}\\n`, 'g');
    const matches = html.match(rule);
    if (!matches || matches.length !== 2) throw new Error(`PLURIX V14: CSS duplicado esperado para ${cls}`);
    html = html.replace(matches[0], '');
  }
  html = once(html, 'class="email-shell" style="width:600px;', 'class="email-shell" style="width:100%; table-layout:fixed; overflow-wrap:anywhere;');
  html = html.replace(/<table\b[^>]*>/g, tag => {
    if (!tag.includes('width="100%"')) return tag;
    return tag.includes('style="') ? tag.replace('style="', 'style="table-layout:fixed; ') : tag.replace('>', ' style="table-layout:fixed;">');
  });
  html = html.split('min-width:280px;').join('min-width:0; max-width:100%; box-sizing:border-box;');
  html = once(html, 'class="brand-pad" style="padding:24px 20px; background-color:#ffffff;"', 'class="brand-pad brand-top" bgcolor="#4A5BA6" style="padding:24px 20px; background-color:#4A5BA6; background-image:linear-gradient(#4A5BA6,#4A5BA6);"');
  html = once(html, 'https://stoplxmkt.blob.core.windows.net/plxmkt/20240513-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ/logo-mais-amigo.png', V13_HEADER_BRAND_LOGO);
  html = html.split('bgcolor="#4A5BA6" style="').join('bgcolor="#4A5BA6" class="brand-header" style="');
  html = html.replace('class="brand-pad brand-top" bgcolor="#4A5BA6" class="brand-header"', 'class="brand-pad brand-top" bgcolor="#4A5BA6"');
  html = html.split('background-color:#4A5BA6;">').join('background-color:#4A5BA6; background-image:linear-gradient(#4A5BA6,#4A5BA6);">');
  for (const [oldColor, newColor, cls] of [['#E6A813', '#2C3490', 'brand-odd'], ['#EBE0CF', '#343B61', 'brand-even']]) {
    html = html.split(`class="content-pad" bgcolor="${oldColor}" style="padding:14px 32px; background-color:${oldColor};"`).join(`class="content-pad ${cls}" bgcolor="${newColor}" style="padding:14px 32px; background-color:${newColor}; background-image:linear-gradient(${newColor},${newColor});"`);
  }
  html = once(html, 'color:#2C3490; font-size:16px; line-height:1.45;', 'color:#ffffff; font-size:16px; line-height:1.45;');
  html = html.split('color:#E7A921;').join('color:#ffffff;').split('color:#EADFCE;').join('color:#ffffff;');
  // O blend preserva branco. Amarelo e creme não preservam sua cor na inversão.
  for (const variable of ['HdrTitulo', 'HdrSubtitulo', 'FaixaLimite']) {
    const expression = `%%=v(@${variable})=%%`;
    html = once(html, expression, blend(expression));
  }
  html = html.split('class="hdr-title"').join('class="hdr-title brand-text"').split('class="hdr-sub"').join('class="hdr-sub brand-text"');
  html = once(html, '<div style="max-width:520px;', '<div class="brand-text" style="max-width:520px;');
  // Todos os CTAs azuis recebem fundo fixo e proteção de texto, inclusive o pool.
  html = html.replace(/<a\b([^>]*style="[^"\n]*background-color:#2C3490;[^"\n]*")>([\s\S]*?)<\/a>/g, (_, attrs: string, text: string) => {
    const updated = attrs.includes('class="') ? attrs.replace('class="', 'class="brand-text brand-odd ') : ` class="brand-text brand-odd"${attrs}`;
    return `<a${updated.replace('background-color:#2C3490;', 'background-color:#2C3490; background-image:linear-gradient(#2C3490,#2C3490);')}>${blend(text)}</a>`;
  });
  html = once(html, '<meta name="color-scheme" content="light">', '<meta name="color-scheme" content="light only">');
  html = html.replace(/<span class="gmail-blend-screen"><span class="gmail-blend-difference">([\s\S]*?)<\/span><\/span>/g, '$1');
  html = html.replace(/    u \+ \.body \.gmail-blend-(?:screen|difference) \{[^}]*\}\n/g, '');
  html = once(html, '<body class="body" style="', '<body class="body" style="color-scheme:light only; ');
  // Cada superfície mantém o seu fundo claro original, inclusive fora da media query.
  html = html.replace(/background-color:(#[0-9a-fA-F]{3,6});(?!\s*background-image:)/g,
    (_, color: string) => `background-color:${color}; background-image:linear-gradient(${color},${color});`);
  // Fill separado de color para reduzir a recoloração forçada de texto no WebKit.
  html = html.replace(/(?<![-\w])color:([^;"\n]+);/g,
    (_, color: string) => `color:${color}; -webkit-text-fill-color:${color};`);
  for (const variable of ['TituloCopy1', 'Copy1Preto', 'TituloCopy2', 'Copy2Preto', 'NotaLegal', 'Rodape']) {
    html = html.split(`%%=TreatAsContent(@${variable})=%%`).join(lightFragment(variable));
  }
  // Outlook: os estilos originais têm prioridade nos elementos que ele recolore.
  const backgrounds = ['#ffffff', '#F6F6FB', '#F4F5FB', '#f2f4f7', '#eef1f5', '#E7A921'];
  const foregrounds = ['#242424', '#2C3490', '#4A4F6A', '#454A64', '#5A607F', '#6b7280', '#8A8FA8'];
  const rules = [
    ...backgrounds.map(c => `[data-ogsb] [bgcolor="${c}"], [data-ogsb] [style*="background-color:${c}"] { background-color:${c} !important; background-image:linear-gradient(${c},${c}) !important; }`),
    ...foregrounds.map(c => `[data-ogsc] [style*="color:${c};"] { color:${c} !important; -webkit-text-fill-color:${c} !important; }`),
  ].join('\n    ');
  html = once(html, '</style>', `    ${rules}\n  </style>`);
  return setup + html;
}

export const PLURIX_V14_TEMPLATE = buildPlurixV14();
