/**
 * Atividade da janela do card (estilo Trello): registros da Visão Daily, comentários e histórico numa linha do tempo só.
 * O registro da Daily é a atividade do card. Registros do projeto ainda sem vínculo aparecem com sugestão
 * de Sub Tarefa quando o texto bate com o título dela (palavras em comum, sem acento e sem palavras vazias).
 */
export interface ActivityEntry {
  id: string; day: string; body: string; project_id: string; work_ids: string[]; revision: number; responsible_id: string | null;
}
export interface SubRef { id: string; title: string; status: string }
export interface SubSuggestion { id: string; title: string; shared: number }

const STOP = new Set(('a o os as de da do das dos e em no na nos nas para pra por com sem um uma uns umas que se ao aos ou mais ' +
  'base bases novo nova ser ter fazer feito como mes dia hoje ja nao sim teste').split(' '));

/** Raízes de 5 letras das palavras com 4 letras ou mais (revisões e revisar viram "revis"). */
export function stems(text: string): Set<string> {
  const words = text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/);
  return new Set(words.filter(w => w.length >= 4 && !STOP.has(w)).map(w => w.slice(0, 5)));
}

/** Sub Tarefa aberta que mais se parece com o registro: pelo menos 2 raízes em comum. */
export function suggestSub(body: string, subs: SubRef[]): SubSuggestion | null {
  const a = stems(body);
  let best: SubSuggestion | null = null;
  for (const s of subs) {
    if (s.status === 'concluida' || s.status === 'cancelada') continue;
    let shared = 0;
    for (const w of stems(s.title)) if (a.has(w)) shared++;
    if (shared >= 2 && (!best || shared > best.shared)) best = { id: s.id, title: s.title, shared };
  }
  return best;
}

export type FeedItem =
  | { kind: 'daily'; at: string; entry: ActivityEntry; linkedTo: string[]; suggestion: SubSuggestion | null }
  | { kind: 'comment'; at: string; id: string; author_id: string; body: string }
  | { kind: 'history'; at: string; id: string; text: string };

/**
 * Junta registros (vinculados ao card ou às Sub Tarefas, e os do mesmo projeto ainda sem vínculo),
 * comentários e histórico, do mais novo para o mais antigo. `ids` = card e Sub Tarefas.
 */
export function buildFeed(input: {
  ids: string[]; entries: ActivityEntry[]; subs: SubRef[];
  comments: { id: string; author_id: string; body: string; created_at: string }[];
  history: { id: string; created_at: string; text: string }[];
}): FeedItem[] {
  const seen = new Set<string>();
  const items: FeedItem[] = [];
  for (const e of input.entries) {
    if (seen.has(e.id)) continue; seen.add(e.id);
    const linkedTo = e.work_ids.filter(id => input.ids.includes(id));
    items.push({ kind: 'daily', at: e.day + 'T12:00:00', entry: e, linkedTo, suggestion: linkedTo.length ? null : suggestSub(e.body, input.subs) });
  }
  for (const c of input.comments) items.push({ kind: 'comment', at: c.created_at, id: c.id, author_id: c.author_id, body: c.body });
  for (const h of input.history) items.push({ kind: 'history', at: h.created_at, id: h.id, text: h.text });
  return items.sort((x, y) => y.at.localeCompare(x.at));
}
