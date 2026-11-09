import type { VaultNote } from '../vaultTypes';
export const STRATEGY_PATH = '05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md';
export interface StrategyBlock { id: string; type: 'markdown' | 'tasks'; title: string; content: string }
export interface TaskLayout { hidden: string[]; order: string[] }
export interface StrategyDocument { title: string; summary: string; blocks: StrategyBlock[]; taskLayout: TaskLayout }
export interface StrategyHead { note_id: string; revision: number; source_hash: string; source_markdown: string; document: StrategyDocument; updated_at: string; updated_by: string }
export interface StrategyRevision extends Omit<StrategyHead, 'updated_at' | 'updated_by'> { actor_id: string; created_at: string; reason: string }
export const isStrategyPilot = (note?: Pick<VaultNote, 'relative_path'> | null) => Boolean(note?.relative_path.startsWith('05-Estrategia/'));
export const hasVisaActivities = (note?: Pick<VaultNote, 'relative_path'> | null) => [STRATEGY_PATH, '05-Estrategia/Estrategia-de-Segmentacao-de-Seguros.md'].includes(note?.relative_path || '');
export function initialStrategy(note: Pick<VaultNote, 'title' | 'content_markdown'> & Partial<Pick<VaultNote,'relative_path'>>): StrategyDocument {
  const source = note.content_markdown.replace(/\r\n?/g, '\n').replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---\r?\n/, '').replace(/^\s*# [^\n]+\n/, '');
  const lines = source.split('\n');
  const sections: StrategyBlock[] = [];
  let title = 'Contexto e estado da operação', id = 'visao-geral', body: string[] = [], fence = '';
  for (const line of lines) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) { if (!fence) fence = marker[1]; else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = ''; }
    const heading = !fence && line.match(/^## (.+)$/);
    if (heading) {
      sections.push({ id, title, type: 'markdown', content: body.join('\n') });
      title = heading[1].trim();
      id = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      // Preserve the old section anchors; block identity is persisted after import.
      if (sections.some(b => b.id === id)) id += '-'+sections.length;
      body = [];
    } else body.push(line);
  }
  sections.push({ id, title, type:'markdown', content:body.join('\n') });
  const intro = sections.shift()!;
  const paragraphs=intro.content.trim().split(/\n\s*\n/);
  const summaryCount=note.relative_path==='05-Estrategia/Estrategia-de-Segmentacao-de-Seguros.md'?3:2;
  const summary=paragraphs.slice(0,summaryCount).join('\n\n');
  const remainder=paragraphs.slice(summaryCount).join('\n\n');
  return { title: note.title, summary, blocks: [
    ...(hasVisaActivities(note as Pick<VaultNote,'relative_path'>) ? [{ id:'pilot-activities', type:'tasks' as const, title:note.relative_path===STRATEGY_PATH?'Atividades: Construção do Piloto':'Atividades: Construção e ativação de Seguros', content:'' }] : []),
    ...(remainder.trim() ? [{...intro,content:remainder}] : []),
    ...sections,
  ], taskLayout:{hidden:[],order:[]} };
}
export function moveBlock(doc: StrategyDocument, id: string, delta: number): StrategyDocument {
 const index = doc.blocks.findIndex(b => b.id === id), target=index+delta;
 if(index<0 || target<0 || target>=doc.blocks.length)return doc;
 const blocks=[...doc.blocks]; [blocks[index],blocks[target]]=[blocks[target],blocks[index]];
 return {...doc,blocks};
}
export function exportStrategy(doc: StrategyDocument): string {
 return '# '+doc.title+'\n\n'+doc.summary+'\n\n'+doc.blocks.map(b => '## '+b.title+'\n\n'+(b.type==='tasks'?'<!-- Atividades vinculadas a Testes e Tarefas; não são uma cópia dos registros. -->':b.content)).join('\n\n');
}
export function strategyError(error: unknown): string {
 const text=error&&typeof error==='object'&&'message' in error?String(error.message):String(error);
 if(text.includes('revision_conflict'))return 'A nota mudou em outra sessão. Seu rascunho foi preservado. Atualize a versão antes de reaplicar a edição.';
 if(text.includes('source_conflict'))return 'A fonte no vault mudou. Compare as versões em Histórico antes de reconciliar.';
 if(text.includes('access_denied')||text.includes('42501'))return 'Seu acesso permite leitura. A edição deste piloto segue as permissões administrativas atuais.';
 return 'Não foi possível salvar. Sua edição continua aberta; tente novamente.';
}

export interface DetailAnchor { start:number; end:number; original:string }
/** Replace only the chosen fenced detail; reject stale anchors rather than touching a neighbouring fiche. */
export function replaceStrategyDetail(content:string,anchor:DetailAnchor,title:string,body:string):string {
 const lines=content.split('\n');
 if(anchor.start<0||anchor.end<anchor.start||anchor.end>=lines.length||lines.slice(anchor.start,anchor.end+1).join('\n')!==anchor.original||!/^:::details\s/.test(lines[anchor.start])||lines[anchor.end].trim()!==':::')throw new Error('strategy_detail_changed');
 if(!title.trim()||/[\r\n]/.test(title))throw new Error('strategy_detail_title');
 return [...lines.slice(0,anchor.start),':::details '+title.trim(),body,':::',...lines.slice(anchor.end+1)].join('\n');
}
