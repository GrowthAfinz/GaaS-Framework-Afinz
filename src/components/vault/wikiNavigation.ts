import { VaultNoteSummary } from './vaultTypes';

export const WIKI_TOPICS = [
  { title: 'Comece aqui', description: 'Entenda a operação e encontre seu caminho.', target: '00-Indice/Enciclopedia-Servicos-Growth', folder: '00-Indice' },
  { title: 'Resultados', description: 'CRM, mídia paga e B2C: evolução mensal, recortes e retrospectivas.', target: '07-Evolucao/Resultados-Evolucao-e-Retrospectivas', folder: '07-Evolucao' },
  { title: 'Produtos e propostas de valor', description: 'Fichas, benefícios, elegibilidade e restrições.', target: 'Dicionario-de-Produtos', folder: '01-Conceitos' },
  { title: 'Serviços de Growth', description: 'Quando usar cada serviço e como conectá-los.', target: '00-Indice/Enciclopedia-Servicos-Growth', folder: '04-Operacao' },
  { title: 'CRM e e-mails dinâmicos', description: 'Do briefing à régua e à operação SFMC.', target: '04-Operacao/Servico-Emails-Dinamicos', folder: '04-Operacao' },
  { title: 'Dados e mensuração', description: 'Fontes, definições, evidências e limites.', target: '09-Inteligencia-IA/Fontes-e-Proveniencia-Growth', folder: '02-Entidades-Dados' },
  { title: 'Engenharia e IAs', description: 'Contratos, integrações e contexto para agentes.', target: '08-Engenharia/MOC-Engenharia', folder: '08-Engenharia' },
] as const;

export const normalizeWikiPath = (value: string) => value.replace(/\\/g, '/').replace(/\.md$/i, '').normalize('NFC').toLocaleLowerCase('pt-BR');

export function resolveWikiTarget(notes: VaultNoteSummary[], target: string, sourcePath = '') {
  const path = normalizeWikiPath(target);
  if (!path) return [];
  const sourceFolder = sourcePath.slice(0, sourcePath.lastIndexOf('/') + 1);
  const relative = new URL(target, `https://wiki.internal/${sourceFolder}`).pathname.slice(1);
  const exact = notes.filter(note => normalizeWikiPath(note.relative_path) === path);
  if (exact.length) return exact;
  const sibling = notes.filter(note => normalizeWikiPath(note.relative_path) === normalizeWikiPath(decodeURIComponent(relative)));
  if (sibling.length) return sibling;
  // Explicit paths must never silently select a different file with the same name.
  if (path.includes('/')) return [];
  return notes.filter(note => normalizeWikiPath(note.relative_path).split('/').pop() === path);
}

export function wikiHeadingId(value: string) {
  return value.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');
}

export function prepareWikiMarkdown(markdown: string) {
  // The reader owns the page title. Preserve all other content verbatim.
  const content = markdown.replace(/^\s*# [^\n]+\r?\n/, '');
  const headings: { line: number; depth: number; title: string; id: string }[] = [];
  const seen = new Map<string, number>();
  let fence: string | null = null;
  content.split('\n').forEach((line, index) => {
    const fenced = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenced) { if (!fence) fence = fenced[1][0]; else if (fenced[1][0] === fence) fence = null; return; }
    if (fence) return;
    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (!match) return;
    const slug = wikiHeadingId(match[2]);
    const count = seen.get(slug) || 0;
    seen.set(slug, count + 1);
    headings.push({ line: index + 1, depth: match[1].length, title: match[2], id: count ? `${slug}-${count}` : slug });
  });
  return { content, headings };
}
