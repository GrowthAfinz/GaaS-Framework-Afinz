import type { Block, NotionColor, NotionDatabase, NotionWorkspace } from '../types/notion';
import { generateId } from '../utils/id';

export const CREDIT_BASES_TITLE = 'Bases de Crédito';
export const isCreditBases = (id: string) => id.startsWith('db_credit_bases_');

export function creditBasesDatabase(id = generateId('db_credit_bases')): NotionDatabase {
  const properties: NotionDatabase['properties'] = [
    { id: 'prop_title', name: 'Nome da base', type: 'title' },
    { id: 'prop_partner', name: 'Frente / parceiro', type: 'select', options: [] },
    { id: 'prop_objective', name: 'Objetivo', type: 'text' },
    { id: 'prop_status', name: 'Status', type: 'status', options: [
      { id: 'requested', name: 'Solicitada', color: 'gray' },
      { id: 'transfer', name: 'Aguardando transferência', color: 'yellow' },
      { id: 'purchase', name: 'Aguardando compra', color: 'blue' },
      { id: 'whitelist', name: 'Aguardando whitelist', color: 'purple' },
      { id: 'available', name: 'Disponível', color: 'green' },
    ] },
    { id: 'prop_deadline', name: 'Prazo', type: 'date' },
    { id: 'prop_expiry', name: 'Data de validade', type: 'date' },
    { id: 'prop_team', name: 'Com quem está', type: 'select', options: [
      { id: 'requester', name: 'Solicitante', color: 'gray' },
      { id: 'in', name: 'IN', color: 'yellow' },
      { id: 'credit', name: 'Crédito', color: 'blue' },
    ] },
  ];
  return {
    id, title: CREDIT_BASES_TITLE, currentViewId: 'table', rows: [], properties,
    views: [
      { id: 'table', name: 'Tabela', type: 'table', visiblePropertyIds: properties.map(p => p.id), filters: [], sorts: [] },
      { id: 'board', name: 'Kanban', type: 'board', groupByPropertyId: 'prop_status',
        visiblePropertyIds: ['prop_partner', 'prop_team', 'prop_deadline', 'prop_expiry'], filters: [], sorts: [] },
    ],
  };
}

const stageTeams: Record<string, string> = {
  requested: 'requester', transfer: 'in', purchase: 'credit', whitelist: 'credit',
};

export function creditStageTeam(database: NotionDatabase, status: unknown) {
  const stage = database.properties.find(p => p.id === 'prop_status')?.options?.find(option => option.name === status);
  if (!stage) return undefined;
  return database.properties.find(p => p.id === 'prop_team')?.options?.find(option => option.id === stageTeams[stage.id])?.name;
}

function isSampleTable(block?: Block) {
  if (block?.type !== 'table' || !block.tableData) return false;
  return block.tableData.every((row, r) => row.every((cell, c) =>
    !cell.trim() || (c < 3 && (r === 0 ? cell === `Header ${c + 1}` :
      r === 1 && (cell === `Data ${c + 1}` || cell === `Cell ${c + 1}`)))));
}

/**
 * "Frente / parceiro" das Bases de Crédito usa a mesma lista de BU/parceiro da Visão Daily (daily_partners).
 * Opção antiga que não bate com parceiro nenhum continua no fim, para a linha não perder a cor.
 */
export interface CreditPartner { key: string; name: string; color: NotionColor; archived?: boolean }
export function withPartnerOptions(database: NotionDatabase, partners: CreditPartner[]): NotionDatabase {
  if (!isCreditBases(database.id) || !partners.length) return database;
  const live = partners.filter(p => !p.archived);
  const known = new Set(partners.map(p => p.name.toLowerCase()));
  return { ...database, properties: database.properties.map(p => {
    if (p.id !== 'prop_partner') return p;
    const legacy = (p.options || []).filter(o => !known.has(o.name.toLowerCase()));
    return { ...p, options: [...live.map(x => ({ id: x.key, name: x.name, color: x.color })), ...legacy] };
  }) };
}
export function configureCreditBases(workspace: NotionWorkspace, pageId: string, partners: CreditPartner[] = []): NotionWorkspace {
  const page = workspace.pages[pageId];
  if (!page || page.parentId || page.databaseId || page.isArchived || page.title.trim() !== CREDIT_BASES_TITLE) return workspace;
  const database = creditBasesDatabase(`db_credit_bases_${page.id}`);
  const sampleIds = new Set(page.blockIds.filter(id => isSampleTable(workspace.blocks[id])));
  return {
    ...workspace,
    blocks: Object.fromEntries(Object.entries(workspace.blocks).filter(([id]) => !sampleIds.has(id))),
    pages: { ...workspace.pages, [pageId]: {
      ...page, databaseId: database.id,
      blockIds: page.blockIds.filter(id => !sampleIds.has(id)),
    } },
    databases: { ...workspace.databases, [database.id]: workspace.databases[database.id] || withPartnerOptions(database, partners) },
  };
}
