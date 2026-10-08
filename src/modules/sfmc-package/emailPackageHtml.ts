/** Materialize the exported slot tree and embedded image files, without network access.
 * Render only in a sandbox without scripts or same-origin permissions. */
export function materializeEmailHtml(asset: Record<string, any>, assets: Map<string, Record<string, any>>): string | null {
  function expand(v: Record<string, any>, depth = 0): string {
    if (depth > 40) throw new Error('Árvore de slots do e-mail muito profunda.');
    let html = typeof v?.content === 'string' ? v.content : '';
    for (const group of ['slots', 'blocks']) for (const [key, block] of Object.entries(v?.[group] || {})) {
      const safe = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const inner = expand(block as Record<string, any>, depth + 1);
      html = html.replace(new RegExp(`(<div\\b[^>]*data-key=["']${safe}["'][^>]*>)\\s*</div>`, 'g'), (_all, open) => open + inner + '</div>');
      if(html.length>750_000)throw new Error('Prévia HTML acima do limite.');
    }
    return html;
  }
  let html:string;
  try{html=expand(asset.views?.html);}catch{return null;}
  if (!html) return null;
  html = html.replace(/\{\{mcpm#\/entities\/assets\/([^/]+)\/data\/([^}]+)\}\}/g, (_all, id, path) => {
    const linked = assets.get(id) || {};
    if (path === 'fileProperties/publishedURL' && typeof linked.file === 'string') {
      const ext = String(linked.fileProperties?.fileName || '').split('.').pop()?.toLowerCase();
      const mime = ({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp'} as Record<string,string>)[ext || ''];
      // Large images keep their published URL instead of multiplying base64 per occurrence.
      if (mime && linked.file.length<=300_000 && /^[A-Za-z0-9+/=\r\n]+$/.test(linked.file)) return `data:${mime};base64,${linked.file}`;
    }
    const value = path.split('/').reduce((v: any, p: string) => v?.[p], linked);
    return typeof value === 'string' && /^https:\/\//i.test(value) ? value : '';
  });
  html = html.replace(/<(script|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<(?:script|iframe|object|embed|form)\b[^>]*\/?\s*>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(?:href|src)\s*=\s*(["'])\s*(?:javascript|vbscript):[\s\S]*?\1/gi, '');
  if (html.length > 750_000) return null;
  return html;
}
