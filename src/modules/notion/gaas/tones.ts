/** Tons de fundo do módulo (só no modo claro). As cores ficam no notion.css, em [data-tone]; aqui só a lista e a preferência. */
export type NotionTone = `#${string}` | 'padrao' | 'areia' | 'nevoa' | 'pedra' | 'salvia' | 'ardosia';

/** bg e card são só para desenhar a amostra no seletor; precisam bater com o notion.css. */
export const NOTION_TONES: { id: NotionTone; name: string; bg: string; card: string }[] = [
  { id: 'padrao', name: 'Branco', bg: '#ffffff', card: '#ffffff' },
  { id: 'areia', name: 'Areia', bg: '#f6f4ef', card: '#efebe3' },
  { id: 'nevoa', name: 'Névoa', bg: '#f3f5f8', card: '#e9edf2' },
  { id: 'pedra', name: 'Pedra', bg: '#f2f2f0', card: '#e8e8e4' },
  { id: 'salvia', name: 'Sálvia', bg: '#f2f5f2', card: '#e6ebe6' },
  { id: 'ardosia', name: 'Ardósia', bg: '#e9ecef', card: '#dce1e6' },
];

const TONE_KEY = 'gaas.notion.tone';
/** Preferência de cada pessoa, guardada no navegador (como o modo claro/escuro). */
export function readTone(userId: string | null): NotionTone {
  try {
    const v = localStorage.getItem(`${TONE_KEY}.${userId || 'anon'}`) ?? localStorage.getItem(TONE_KEY);
    return v && (NOTION_TONES.some(t => t.id === v) || /^#[0-9a-f]{6}$/i.test(v)) ? (v as NotionTone) : 'padrao';
  } catch { return 'padrao'; }
}
export function saveTone(userId: string | null, tone: NotionTone): void {
  try { localStorage.setItem(`${TONE_KEY}.${userId || 'anon'}`, tone); } catch { /* preferência local */ }
}
