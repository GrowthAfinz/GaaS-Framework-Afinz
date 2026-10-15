/** Port byte a byte de scripts/email-factory/content_blocks.py. */
export type ContentBlock =
  | { type: "lead" | "closing"; text: string }
  | {
      type: "benefit_grid" | "steps";
      items: Array<{ title: string; text: string }>;
    }
  | { type: "stat_tiles"; items: Array<{ number: string; label: string }> }
  | { type: "check_list"; items: string[] };

const escapeText = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export function validateBlockText(text: string): void {
  if (/%%/.test(text.split("%%=v(@FirstName)=%%").join("")))
    throw new Error("Personalização não permitida.");
  if (/[\r\n]/.test(text))
    throw new Error("Quebra de linha crua não permitida.");
  if (Array.from(text).length > 4000)
    throw new Error("Texto excede 4000 caracteres.");
  if (text.replace(/<b>|<\/b>|<br>/g, "").match(/[<>]/))
    throw new Error("Somente <b> e <br> são permitidos, sem atributos.");
  let depth = 0;
  for (const tag of text.match(/<\/?b>/g) ?? []) {
    depth += tag === "<b>" ? 1 : -1;
    if (depth < 0) throw new Error("Negrito sem abertura.");
  }
  if (depth !== 0) throw new Error("Negrito sem fechamento.");
}
const textFor = (text: string, html: boolean) => {
  validateBlockText(text);
  return html ? text : escapeText(text);
};
export function lead(value: string, allowHtml = true): string {
  const text = textFor(value, allowHtml);
  return `<p style="margin:0 0 14px 0;text-align:center;">${text}</p>`;
}
export function closing(value: string, allowHtml = true): string {
  const text = textFor(value, allowHtml);
  return `<p style="margin:16px 0 0 0;text-align:center;font-weight:700;color:#2C3490;">${text}</p>`;
}
const table = (body: string, spacing: number, separate = false) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="${spacing}" border="0" style="margin:0 auto;${separate ? "border-collapse:separate;" : ""}">${body}</table>`;
export function benefitGrid(
  items: Array<{ title: string; text: string }>,
  allowHtml = false,
): string {
  if (items.length < 2 || items.length % 2)
    throw new Error("Grade exige número par de itens, a partir de 2.");
  const cells = items.map((item) => {
    const title = textFor(item.title, false);
    const body = textFor(item.text, allowHtml)
      .split("<b>")
      .join('<b style="color:#242424;">');
    const mark = "&#10003;";
    return `<td class="stack-column" width="50%" valign="top" bgcolor="#F4F5FB" style="width:50%;padding:16px;text-align:left;background-color:#F4F5FB;border:1px solid #E1E3F2;border-radius:12px;margin-bottom:10px;"><div style="width:30px;height:30px;line-height:30px;border-radius:15px;background-color:#E7A921;color:#2C3490;font-size:14px;font-weight:700;text-align:center;">${mark}</div><p style="margin:10px 0 4px 0;font-size:14px;line-height:1.3;font-weight:700;color:#2C3490;">${title}</p><p style="margin:0;font-size:13px;line-height:1.45;color:#4A4F6A;">${body}</p></td>`;
  });
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 2)
    rows.push(`<tr>${cells.slice(i, i + 2).join("")}</tr>`);
  return table(rows.join(""), 10, true);
}
export function statTiles(
  items: Array<{ number: string; label: string }>,
): string {
  if (![2, 3].includes(items.length))
    throw new Error("Quadros exigem 2 ou 3 itens.");
  const width = `${Math.floor(100 / items.length)}%`;
  return table(
    `<tr>${items
      .map((item) => {
        const number = textFor(item.number, false);
        const label = textFor(item.label, false);
        return `<td class="stack-column" width="${width}" valign="top" bgcolor="#F4F5FB" style="width:${width};padding:16px 10px;text-align:center;background-color:#F4F5FB;border:1px solid #E1E3F2;border-radius:12px;margin-bottom:10px;"><p style="margin:0;font-size:26px;line-height:1.1;font-weight:700;color:#2C3490;">${number}</p><p style="margin:6px 0 0 0;font-size:13px;line-height:1.35;color:#4A4F6A;">${label}</p></td>`;
      })
      .join("")}</tr>`,
    10,
    true,
  );
}
export function checkList(items: string[]): string {
  return table(
    items
      .map((value) => {
        const text = textFor(value, true);
        return `<tr><td width="38" valign="top" style="width:38px;padding:6px 0;"><div style="width:30px;height:30px;line-height:30px;border-radius:15px;background-color:#E7A921;color:#2C3490;font-size:14px;font-weight:700;text-align:center;">&#10003;</div></td><td valign="middle" style="padding:6px 0;text-align:left;font-size:15px;line-height:1.45;color:#242424;">${text}</td></tr>`;
      })
      .join(""),
    0,
  );
}
export function steps(items: Array<{ title: string; text: string }>): string {
  return table(
    items
      .map((item, i) => {
        const title = textFor(item.title, false);
        const body = textFor(item.text, false);
        const index = i + 1;
        return `<tr><td width="38" valign="top" style="width:38px;padding:8px 0;"><div style="width:30px;height:30px;line-height:30px;border-radius:15px;background-color:#E7A921;color:#2C3490;font-size:14px;font-weight:700;text-align:center;">${index}</div></td><td valign="top" style="padding:8px 0;text-align:left;"><p style="margin:4px 0 2px 0;font-size:15px;font-weight:700;color:#2C3490;">${title}</p><p style="margin:0;font-size:13px;line-height:1.45;color:#4A4F6A;">${body}</p></td></tr>`;
      })
      .join(""),
    0,
  );
}
export function renderContentBlocks(blocks: ContentBlock[]): string {
  const html = blocks
    .map((block) => {
      switch (block.type) {
        case "lead":
          return lead(block.text);
        case "closing":
          return closing(block.text);
        case "benefit_grid":
          return benefitGrid(block.items, true);
        case "stat_tiles":
          return statTiles(block.items);
        case "check_list":
          return checkList(block.items);
        case "steps":
          return steps(block.items);
      }
    })
    .join("");
  if (Array.from(html).length > 4000)
    throw new Error("COPY_2_PRETO excede 4000 caracteres.");
  return html;
}

const unescapeText = (text: string) =>
  text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const BLOCK_PATTERN =
  /<p style="margin:0 0 14px 0;text-align:center;">([\s\S]*?)<\/p>|<p style="margin:16px 0 0 0;text-align:center;font-weight:700;color:#2C3490;">([\s\S]*?)<\/p>|<table role="presentation"[^>]*>([\s\S]*?)<\/table>/y;
const CELL_TEXT = /<p style="margin:10px 0 4px 0;[^"]*">([\s\S]*?)<\/p><p style="margin:0;[^"]*">([\s\S]*?)<\/p><\/td>/g;
const TILE_TEXT = /<p style="margin:0;font-size:26px;[^"]*">([\s\S]*?)<\/p><p style="margin:6px 0 0 0;[^"]*">([\s\S]*?)<\/p><\/td>/g;
const CHECK_TEXT = /<td valign="middle"[^>]*>([\s\S]*?)<\/td><\/tr>/g;
const STEP_TEXT = /<p style="margin:4px 0 2px 0;[^"]*">([\s\S]*?)<\/p><p style="margin:0;[^"]*">([\s\S]*?)<\/p><\/td><\/tr>/g;

/**
 * Caminho inverso de renderContentBlocks: lê o COPY_2_PRETO gerado pelo catálogo e devolve
 * os blocos, para a IA editar um e-mail existente como dados. Só aceita o resultado quando
 * renderizar de novo dá exatamente o mesmo HTML; texto legado ou editado à mão volta null.
 */
export function parseContentBlocks(html: string): ContentBlock[] | null {
  if (!html.trim()) return null;
  const blocks: ContentBlock[] = [];
  BLOCK_PATTERN.lastIndex = 0;
  let position = 0;
  while (position < html.length) {
    BLOCK_PATTERN.lastIndex = position;
    const match = BLOCK_PATTERN.exec(html);
    if (!match) return null;
    position = BLOCK_PATTERN.lastIndex;
    const [, leadText, closingText, body] = match;
    if (leadText !== undefined) blocks.push({ type: "lead", text: leadText });
    else if (closingText !== undefined) blocks.push({ type: "closing", text: closingText });
    else if (body.includes("font-size:26px")) blocks.push({ type: "stat_tiles", items: [...body.matchAll(TILE_TEXT)].map((m) => ({ number: unescapeText(m[1]), label: unescapeText(m[2]) })) });
    else if (body.includes('class="stack-column"')) blocks.push({ type: "benefit_grid", items: [...body.matchAll(CELL_TEXT)].map((m) => ({ title: unescapeText(m[1]), text: m[2].split('<b style="color:#242424;">').join("<b>") })) });
    else if (body.includes('valign="middle"')) blocks.push({ type: "check_list", items: [...body.matchAll(CHECK_TEXT)].map((m) => m[1]) });
    else blocks.push({ type: "steps", items: [...body.matchAll(STEP_TEXT)].map((m) => ({ title: unescapeText(m[1]), text: unescapeText(m[2]) })) });
  }
  try {
    return renderContentBlocks(blocks) === html ? blocks : null;
  } catch {
    return null;
  }
}
