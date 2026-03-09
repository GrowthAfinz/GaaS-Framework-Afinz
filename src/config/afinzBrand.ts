/**
 * Afinz Brand Design Tokens
 * Extraidos do Manual de Marca Afinz
 * Adaptados para dark mode do GaaS Dashboard
 */

export const AFINZ_COLORS = {
  // Primaria — acento do "z" e CTAs
  teal: '#00c6cc',
  tealDark: '#007c80',
  tealMuted: 'rgba(0, 198, 204, 0.1)',
  tealBorder: 'rgba(0, 198, 204, 0.2)',
  tealBorderHover: 'rgba(0, 198, 204, 0.4)',

  // Secundaria — alertas positivos
  orange: '#f8a538',
  orangeMuted: 'rgba(248, 165, 56, 0.1)',

  // Terciaria — erros/negativos
  red: '#e74742',
  redMuted: 'rgba(231, 71, 66, 0.1)',

  // Neutros dark mode
  black: '#1a1a1a',
  white: '#ffffff',
} as const;

export const AFINZ_TYPOGRAPHY = {
  // Hierarquia de pesos (simula familia Lembra)
  weights: {
    light: 'font-light',      // Lembra Light — captions, detalhes
    regular: 'font-normal',   // Lembra Regular — corpo de texto
    bold: 'font-bold',        // Lembra Bold — subtitulos
    black: 'font-black',      // Lembra Black — headings, numeros KPI
  },

  // Escala tipografica adaptada para dashboard
  sizes: {
    pageTitle: 'text-2xl font-black tracking-tight text-white',
    sectionTitle: 'text-sm font-bold text-white uppercase tracking-wider',
    kpiValue: 'text-2xl font-black text-white',
    kpiLabel: 'text-xs font-light text-slate-400 uppercase tracking-wide',
    kpiDelta: 'text-xs text-[#00c6cc]',
    body: 'text-sm font-normal text-slate-300',
    caption: 'text-xs font-light text-slate-400',
    tagline: 'text-xs font-light text-slate-400',
  },
} as const;

export const AFINZ_SPACING = {
  // Baseado na "area de arejamento" do manual (2x o simbolo)
  cardPadding: 'p-4',
  cardPaddingLg: 'p-5',
  sectionGap: 'gap-4',
  sectionGapLg: 'gap-6',
  gridGap: 'gap-4',
} as const;

export const AFINZ_COMPONENTS = {
  // Cards
  card: 'bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors',
  cardAccent: 'bg-slate-900 rounded-xl border border-slate-800 hover:border-[#00c6cc]/40 transition-colors',

  // Botoes
  btnPrimary: 'bg-[#00c6cc] hover:bg-[#007c80] text-slate-950 font-bold px-4 py-2 rounded-lg transition-colors text-sm',
  btnSecondary: 'border border-[#00c6cc]/40 hover:border-[#00c6cc] text-[#00c6cc] hover:bg-[#00c6cc]/10 font-semibold px-4 py-2 rounded-lg transition-colors text-sm',
  btnGhost: 'text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors text-sm',

  // Badges
  badge: 'bg-[#00c6cc]/10 text-[#00c6cc] text-xs font-semibold px-2 py-0.5 rounded-full border border-[#00c6cc]/20',
  badgeOrange: 'bg-[#f8a538]/10 text-[#f8a538] text-xs font-semibold px-2 py-0.5 rounded-full border border-[#f8a538]/20',
  badgeRed: 'bg-[#e74742]/10 text-[#e74742] text-xs font-semibold px-2 py-0.5 rounded-full border border-[#e74742]/20',

  // Section header accent (barra vertical teal)
  sectionAccent: 'w-0.5 h-4 bg-[#00c6cc] rounded-full',

  // Page header accent (barra vertical maior)
  pageAccent: 'h-8 w-1 rounded-full bg-[#00c6cc]',
} as const;

/**
 * Classe base para uma nova aba do GaaS no estilo Afinz.
 * Usar como wrapper do componente raiz da view.
 */
export const AFINZ_PAGE_WRAPPER = 'min-h-screen bg-slate-950 text-slate-100' as const;

/**
 * Helper: section header com acento teal
 * Uso: <SectionHeader title="Disparos" />
 */
export function afinzSectionHeaderClasses() {
  return {
    wrapper: 'flex items-center gap-2 mb-4',
    accent: AFINZ_COMPONENTS.sectionAccent,
    title: AFINZ_TYPOGRAPHY.sizes.sectionTitle,
  };
}

/**
 * Helper: page header com acento teal
 * Uso: <PageHeader title="Launch" subtitle="Planejamento de disparos" />
 */
export function afinzPageHeaderClasses() {
  return {
    wrapper: 'border-b border-slate-800 px-6 py-5',
    inner: 'flex items-center gap-3',
    accent: AFINZ_COMPONENTS.pageAccent,
    titles: 'flex flex-col',
    title: AFINZ_TYPOGRAPHY.sizes.pageTitle,
    subtitle: AFINZ_TYPOGRAPHY.sizes.tagline,
  };
}
