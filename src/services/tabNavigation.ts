import type { MouseEvent } from 'react';
import type { ViewSettings } from '../types/framework';
import { workspaceOfSearch } from '../components/growth-learning/growthLearningNavigation';

export type TabId = ViewSettings['abaAtual'];

/** O GaaS abre em Planejamento > Operação (Visão Daily) desde 13/11/2026. */
export const DEFAULT_TAB: TabId = 'operacao';

// Valor de ?view= de cada aba. Igual ao id, exceto o Loop de Memória, que já usava ?view=learning.
const TAB_SLUGS: Record<TabId, string> = {
  operacao: 'operacao',
  launch: 'launch',
  resultados: 'resultados',
  jornada: 'jornada',
  framework: 'framework',
  diario: 'diario',
  orientador: 'orientador',
  configuracoes: 'configuracoes',
  'originacao-b2c': 'originacao-b2c',
  'funil-aquisicao': 'funil-aquisicao',
  'midia-paga': 'midia-paga',
  explorador: 'explorador',
  relatorio: 'relatorio',
  'relatorio-seguros': 'relatorio-seguros',
  'aprendizado-growth': 'learning',
  comunicacoes: 'comunicacoes',
  'comunicacoes-cadastro': 'comunicacoes-cadastro',
  'comunicacoes-performance': 'comunicacoes-performance',
  'comunicacoes-fluxo': 'comunicacoes-fluxo',
  'comunicacoes-appsflyer-auditoria': 'comunicacoes-appsflyer-auditoria',
  'comunicacoes-email-dinamico': 'comunicacoes-email-dinamico',
};

const SLUG_TO_TAB = new Map<string, TabId>(
  (Object.entries(TAB_SLUGS) as [TabId, string][]).map(([tab, slug]) => [slug, tab]),
);

const LEARNING_TABS = new Set<TabId>(['operacao', 'aprendizado-growth']);

export function readTabFromSearch(search: string): TabId {
  const slug = new URLSearchParams(search).get('view');
  // O Diário de Bordo saiu do app; link antigo cai na Operação.
  if (slug === 'diario') return 'operacao';
  const tab = slug ? SLUG_TO_TAB.get(slug) : undefined;
  if (!tab) return DEFAULT_TAB;
  return LEARNING_TABS.has(tab) ? resolveLearningTab(tab, search) : tab;
}

/**
 * Operação e Loop de Memória dividem o mesmo workspace: quem manda é a seção da URL.
 * Assim link antigo (?view=learning&section=daily) e atalho que pede o Loop para
 * abrir a Fila caem na aba certa.
 */
export function resolveLearningTab(tab: TabId, search: string): TabId {
  if (tab === 'diario') return 'operacao';
  if (!LEARNING_TABS.has(tab)) return tab;
  const workspace = workspaceOfSearch(search);
  if (!workspace) return tab;
  return workspace === 'operacao' ? 'operacao' : 'aprendizado-growth';
}

export function buildTabSearch(tab: TabId): string {
  return tab === DEFAULT_TAB ? '' : `?view=${TAB_SLUGS[tab]}`;
}

export function tabHref(tab: TabId, search: string = buildTabSearch(tab)): string {
  return `${window.location.pathname}${search}`;
}

/**
 * Leva a URL para a aba com uma nova entrada no histórico. Se a URL já aponta
 * pra ela não mexe, porque o Loop de Memória monta a própria URL (seção, item)
 * antes de trocar de aba. As outras abas não usam query string, então a URL
 * nova leva só o ?view=.
 */
export function pushTabUrl(tab: TabId): void {
  if (typeof window === 'undefined') return;
  if (readTabFromSearch(window.location.search) === tab) return;
  window.history.pushState({}, '', tabHref(tab));
}

/**
 * onClick de um <a href> de aba: clique esquerdo simples navega dentro do app;
 * Ctrl/Cmd/Shift + clique fica com o navegador (nova aba/janela). O clique do
 * meio nem dispara onClick, o navegador já abre o href numa aba nova.
 */
export function onTabLinkClick(action: () => void) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    action();
  };
}
