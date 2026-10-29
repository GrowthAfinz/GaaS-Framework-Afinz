// Page families of the results wiki (one page per thing someone decides about).
// The type comes from the note's frontmatter `tipo`; `growth-assunto` notes keep their own contract.
export const WIKI_PAGE_TYPES = {
  dominio: { label: 'Domínio', plural: 'Domínios' },
  publico: { label: 'Público', plural: 'Públicos' },
  mecanica: { label: 'Mecânica', plural: 'Mecânicas' },
  objetivo: { label: 'Objetivo de mídia', plural: 'Objetivos de mídia' },
  parceiro: { label: 'Parceiro', plural: 'Parceiros' },
  iniciativa: { label: 'Iniciativa', plural: 'Iniciativas' },
} as const;
export type WikiPageType = keyof typeof WIKI_PAGE_TYPES;
export const WIKI_PAGE_TYPE_ORDER = Object.keys(WIKI_PAGE_TYPES) as WikiPageType[];

export function normalizeWikiPageType(value: unknown): WikiPageType | null {
  if (typeof value !== 'string') return null;
  const key = value.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
  return key in WIKI_PAGE_TYPES ? key as WikiPageType : null;
}

// `tipo` wins over `type` because projections store `type ?? tipo` in note_type.
export function wikiPageType(note: { note_type?: string | null; frontmatter?: Record<string, unknown> } | null): WikiPageType | null {
  if (!note) return null;
  return normalizeWikiPageType(note.frontmatter?.tipo) ?? normalizeWikiPageType(note.note_type);
}
