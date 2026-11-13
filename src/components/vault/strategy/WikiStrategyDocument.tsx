import { useCallback, useEffect, useRef, useState, Children, isValidElement, type ReactNode, type ComponentProps } from 'react';
import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Copy, Download, History, MoreHorizontal, Pencil, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { VaultNote } from '../vaultTypes';
import { WikiPilotChecklist } from '../WikiPilotChecklist';
import { WikiMarkdownSections, type MarkdownPart } from '../WikiMarkdownSections';
import { WikiCodeBlock } from '../WikiDiagram';
import { rewriteWikilinksForReader } from '../vaultParser';
import { vaultUrlTransform } from '../vaultMarkdown';
import { exportStrategy, initialStrategy, moveBlock, strategyError, hasVisaActivities, replaceStrategyDetail, type DetailAnchor, type StrategyBlock, type StrategyDocument, type StrategyHead, type StrategyRevision } from './strategyModel';
import { loadStrategy, saveStrategy, strategyHistory } from './strategyService';
import { getLocalViewport } from '../../../context/UIScaleContext';
import './wikiStrategy.css';
import { toggleStrategySection, collapseStrategySections } from './sectionVisibility';
import { wikiHeadingId } from '../wikiNavigation';
const textOf=(children:ReactNode):string=>Children.toArray(children).map(child=>typeof child==='string'||typeof child==='number'?String(child):isValidElement<{children?:ReactNode}>(child)?textOf(child.props.children):'').join('');
const heading=(level:2|3|4|5|6)=>({children}:{children?:ReactNode})=>{const Tag=`h${level}` as 'h2';return <Tag id={wikiHeadingId(textOf(children))}>{children}</Tag>;};
import { openFeedback } from '../../feedback/feedbackBus';
import { supabase } from '../../../services/supabaseClient';

type EditDraft = { kind:'block'; block:StrategyBlock; isNew:boolean; after?:string; fragment?:DetailAnchor } | {kind:'header';title:string;summary:string};
const cleanTitle = (s:string)=>s.replace(/^\d+\.\s*/, '');
// Every section starts collapsed; the summary at the top stays visible (decision of 13/11/2026).
const allBlockIds=(doc:StrategyDocument)=>new Set(doc.blocks.map(b=>b.id));
const defaultClosed=(note:VaultNote)=>allBlockIds(initialStrategy(note));
// v2: the default changed to "all collapsed", so preferences saved under the old default are ignored once.
const closedKey=(noteId:string)=>'gaas-wiki-closed-v2:'+noteId;
const hasStoredClosed=(noteId:string)=>{try{return localStorage.getItem(closedKey(noteId))!==null;}catch{return false;}};
const saveMarkdown=(text:string,fileName:string)=>{const url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=fileName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0);};
// Remember which sections each reader collapsed, per note. Storage may be unavailable; fall back to the editorial default.
const readClosed=(note:VaultNote):Set<string>=>{try{const raw=localStorage.getItem(closedKey(note.id));const ids:unknown=raw?JSON.parse(raw):null;if(Array.isArray(ids))return new Set(ids.filter((id):id is string=>typeof id==='string'));}catch{/* Storage unavailable. */}return defaultClosed(note);};
const TRANSIENT_MESSAGE_MS=4000;
const navTitle=(b:StrategyBlock)=>({'pilot-activities':'Atividades do piloto','2-o-percurso-completo-da-base-a-medicao':'Percurso','3-quem-entra-e-como-o-teste-compara-os-publicos':'Públicos e teste','4-a-experiencia-editorial-e-a-vitrine':'Experiência editorial','5-mapa-tecnico-das-automacoes':'Automações','6-ficha-tecnica-das-data-extensions':'Data Extensions','7-ficha-tecnica-das-atividades-e-sqls':'Atividades e SQLs','8-como-medir-e-o-que-falta-validar':'Medição'}[b.id]||cleanTitle(b.title));

function Markdown({content,onOpen,onEditPart,editDisabled}:{content:string;onOpen?:(target:string)=>void;onEditPart?:(part:MarkdownPart)=>void;editDisabled?:boolean}) {
 // Keep literal SQL and Mermaid fences opaque when resolving wiki references.
 const chunks=content.split(/(^\s*`{3,}[^\n]*\n[\s\S]*?^\s*`{3,}\s*$|^\s*~{3,}[^\n]*\n[\s\S]*?^\s*~{3,}\s*$)/gm);
 const markdown=chunks.map((part,i)=>i%2?part:rewriteWikilinksForReader(part)).join('');
 return <WikiMarkdownSections content={markdown} onEditPart={onEditPart} editDisabled={editDisabled} render={part=><ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={vaultUrlTransform} components={{table:({children})=><div className="strategy-table" role="region" aria-label="Tabela da estratégia" tabIndex={0}><table>{children}</table></div>,h2:heading(2),h3:heading(3),h4:heading(4),h5:heading(5),h6:heading(6),pre:WikiCodeBlock,a:({href,children})=>href?.startsWith('vault:')?<a href={'?view=learning&section=vault&wiki_path='+href.slice(6)} onClick={e=>{if(onOpen){e.preventDefault();onOpen(decodeURIComponent(href.slice(6)));}}}>{children}</a>:<a href={href} target={href?.startsWith('https:')?'_blank':undefined} rel="noopener noreferrer">{children}</a>}}>{part}</ReactMarkdown>}/>;
}

export function WikiStrategyDocument({note,onOpen,onHome,loader=loadStrategy,writer=saveStrategy,historyLoader=strategyHistory,taskProps}: {
 note:VaultNote; onOpen?:(target:string)=>void; onHome?:()=>void;loader?:typeof loadStrategy;writer?:typeof saveStrategy;historyLoader?:typeof strategyHistory;
 taskProps?:Pick<ComponentProps<typeof WikiPilotChecklist>,'loader'|'writer'|'historyLoader'>;
}) {
 const [source,setSource]=useState(note),[head,setHead]=useState<StrategyHead|null>(null),[doc,setDoc]=useState(()=>initialStrategy(note));
 const [canEdit,setCanEdit]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [edit,setEdit]=useState<EditDraft|null>(null),[preview,setPreview]=useState(false),[taskDirty,setTaskDirty]=useState(false);
 const [closed,setClosed]=useState<Set<string>>(()=>readClosed(note)),[active,setActive]=useState('visao-geral'),[query,setQuery]=useState('');
 const [closedPreferenceStored]=useState(()=>hasStoredClosed(note.id));
 const manualActiveUntil=useRef(0);
 // The index is shown whole, never in its own scroll box. When it is taller than the
 // screen, a negative sticky top lets it travel with the page until its last item is
 // visible, then it stays put; when it fits, it sticks 12px under the top as before.
 const navRef=useRef<HTMLElement>(null);
 useEffect(()=>{
  const nav=navRef.current; if(!nav) return;
  // sticky is measured against the element that actually scrolls (the app's content pane or the window)
  const scroller=()=>{ for(let el=nav.parentElement;el;el=el.parentElement){ const y=getComputedStyle(el).overflowY; if((y==='auto'||y==='scroll')&&el.scrollHeight>el.clientHeight) return el; } return null; };
  const place=()=>{ const box=scroller(); const room=box?box.clientHeight:getLocalViewport().height; nav.style.setProperty('--strategy-nav-top',Math.min(12,room-nav.offsetHeight-12)+'px'); };
  place(); const observer=new ResizeObserver(place); observer.observe(nav); if(nav.parentElement) observer.observe(nav.parentElement); window.addEventListener('resize',place);
  return ()=>{ observer.disconnect(); window.removeEventListener('resize',place); };
 },[]);
 const [mobileIndex,setMobileIndex]=useState(false);
 const [historyOpen,setHistoryOpen]=useState(false),[revisions,setRevisions]=useState<StrategyRevision[]>([]),[selectedRevision,setSelectedRevision]=useState<StrategyRevision|null>(null),[historyError,setHistoryError]=useState('');
 const [reconciling,setReconciling]=useState(false),[retry,setRetry]=useState(0),[revisionWarning,setRevisionWarning]=useState(false);
 const [deleteTarget,setDeleteTarget]=useState<string|null>(null),[draftKey,setDraftKey]=useState<string|null>(null),[recoveredStale,setRecoveredStale]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLElement|null>(null),editorRef=useRef<HTMLDivElement>(null);
 const dirty=Boolean(edit)||taskDirty;
 useEffect(()=>{if(!draftKey)return;try{if(edit)sessionStorage.setItem(draftKey,JSON.stringify({edit,revision:head?.revision||0}));else sessionStorage.removeItem(draftKey);}catch{/* Browser storage may be disabled. */}},[edit,draftKey,head?.revision]);
 useEffect(()=>{const {data}=supabase.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){if(draftKey)sessionStorage.removeItem(draftKey);setEdit(null);setCanEdit(false);setDraftKey(null);}if(event==='SIGNED_IN')setRetry(r=>r+1);});return()=>data.subscription.unsubscribe();},[draftKey]);
 const locked=busy||dirty;
 const sourceChanged=Boolean(head&&head.source_hash!==source.content_hash);
 const sourceOperation=source.content_markdown.match(/^> \*\*Estado da operação:\*\*[^\n]+/m)?.[0]||'';
 // The badge already shows the document status; repeat it in text only when the badge shows the operation stage instead.
 const docStatus=source.status||'a-validar';
 const stateLabel=/PREPARAÇÃO/.test(sourceOperation)?'Em preparação':source.status||'Em revisão';
 const request=useRef<{body:string;id:string}|null>(null);
 useEffect(()=>{let active=true;setLoading(true);void loader(note.id).then(next=>{if(!active)return;setSource(next.source);setHead(next.head);setDoc(next.head?.document||initialStrategy(next.source));if(!closedPreferenceStored)setClosed(allBlockIds(next.head?.document||initialStrategy(next.source)));setCanEdit(next.canEdit);setError('');setRevisionWarning(false);
 const key=next.viewerId?'gaas-wiki-draft:'+next.viewerId+':'+note.id:null;setDraftKey(key);
 if(key){try{const cached=JSON.parse(sessionStorage.getItem(key)||'null');if(cached?.edit && ['header','block'].includes(cached.edit.kind)){setEdit(cached.edit);setRecoveredStale(cached.revision!==(next.head?.revision||0));setMessage('Rascunho recuperado desta sessão. Revise antes de salvar.');}}catch{/* Storage unavailable: editing remains usable. */}}
 }).catch(()=>{if(active){setError('Não foi possível consultar a versão de trabalho. A fonte está disponível para leitura.');setCanEdit(false);}}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[note.id,loader,retry,closedPreferenceStored]);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 useEffect(()=>{if(edit)editorRef.current?.querySelector<HTMLInputElement>('input')?.focus();},[edit?.kind,edit?.kind==='block'?edit.block.id:'header']);
 useEffect(()=>{if(historyOpen){dialog.current?.showModal();let active=true;void historyLoader(note.id).then(rows=>{if(active){setRevisions(rows);setHistoryError('');}}).catch(()=>{if(active)setHistoryError('Histórico indisponível. Feche e abra para tentar novamente.');});return()=>{active=false;};}},[historyOpen,note.id,historyLoader]);
 useEffect(()=>{
  const reveal=()=>{let id='';try{id=decodeURIComponent(window.location.hash.slice(1));}catch{return;}if(!id)return;
   const block=doc.blocks.find(b=>b.id===id||b.content.split('\n').some(line=>/^#{2,6} /.test(line)&&wikiHeadingId(line.replace(/^#{2,6} /,''))===id));if(block)setClosed(current=>{const next=new Set(current);next.delete(block.id);return next;});
   requestAnimationFrame(()=>{const element=document.getElementById(id);let parent=element?.parentElement;while(parent){if(parent instanceof HTMLDetailsElement)parent.open=true;parent=parent.parentElement;}element?.scrollIntoView({block:'start'});});
  };reveal();window.addEventListener('hashchange',reveal);return()=>window.removeEventListener('hashchange',reveal);
 },[doc]);
 useEffect(()=>{try{localStorage.setItem(closedKey(note.id),JSON.stringify([...closed]));}catch{/* Storage unavailable. */}},[closed,note.id]);
 // Feedback like "Edição cancelada." is transient; a recovered draft stays visible until the reader acts on it.
 useEffect(()=>{if(!message||message.startsWith('Rascunho recuperado'))return;const timer=window.setTimeout(()=>setMessage(''),TRANSIENT_MESSAGE_MS);return()=>window.clearTimeout(timer);},[message]);
 // Scroll-spy: the index follows the section being read. Listens in capture phase because the scroll container is an app ancestor, not the window.
 useEffect(()=>{let frame=0;
  const update=()=>{frame=0;if(Date.now()<manualActiveUntil.current)return;const line=window.innerHeight*0.3;let current='visao-geral';
   for(const block of doc.blocks){const element=document.getElementById(block.id);if(!element||element.hidden)continue;const top=element.getBoundingClientRect().top;if(top<=line)current=block.id;else break;}
   setActive(current);};
  const onScroll=()=>{if(!frame)frame=requestAnimationFrame(update);};
  document.addEventListener('scroll',onScroll,{capture:true,passive:true});window.addEventListener('resize',onScroll);
  return()=>{document.removeEventListener('scroll',onScroll,{capture:true});window.removeEventListener('resize',onScroll);if(frame)cancelAnimationFrame(frame);};
 },[doc.blocks]);
 const notifyTaskDirty=useCallback((value:boolean)=>setTaskDirty(value),[]);
 const protect=()=>{if(locked){setMessage('Salve ou cancele a edição atual antes de continuar.');return true;}return false;};
 const focusBack=()=>requestAnimationFrame(()=>opener.current?.isConnected&&opener.current.focus({preventScroll:true}));
 const startEdit=(value:EditDraft,element?:HTMLElement)=>{if(protect())return;opener.current=element||null;setEdit(value);setPreview(false);setMessage('');setError('');};
 const cancel=()=>{setEdit(null);setError('');setMessage('Edição cancelada.');focusBack();};
 const persist=async(next:StrategyDocument,reason:string,reconcile=false,keepDraft=false)=>{
  if(!canEdit||busy)throw new Error('wiki_pilot_access_denied');
  const body=JSON.stringify({next,revision:head?.revision||0,sourceHash:source.content_hash,reconcile});
  if(request.current?.body!==body)request.current={body,id:crypto.randomUUID()};
  setBusy(true);setError('');
  try{const saved=await writer(note.id,head?.revision||0,source.content_hash||'',next,reason,request.current.id,reconcile);setHead(saved);setDoc(saved.document);if(!keepDraft)setEdit(null);setMessage('Alteração salva no histórico.');setRevisionWarning(false);request.current=null;focusBack();return saved;}
  catch(e){setError(strategyError(e));if(String((e as {message?:string})?.message).includes('revision_conflict'))setRevisionWarning(true);
 if(String((e as {message?:string})?.message).includes('source_conflict'))void loader(note.id).then(fresh=>setSource(fresh.source)).catch(()=>{});throw e;}
  finally{setBusy(false);}
 };
 const apply=(next:StrategyDocument,reason:string)=>{if(protect())return;void persist(next,reason).catch(()=>{});};
 const saveEdit=()=>{if(!edit)return;if(recoveredStale){setError('Este rascunho é de uma versão anterior. Confirme a revisão do rascunho sobre a versão atual antes de salvar.');return;}let next:StrategyDocument;
  if(edit.kind==='header'){if(edit.title.trim().length<3){setError('Informe um título com pelo menos três caracteres.');return;}next={...doc,title:edit.title.trim(),summary:edit.summary};}
  else{if(!edit.block.title.trim()){setError('Informe o título da seção.');return;}const block={...edit.block,title:edit.block.title.trim()};const blocks=[...doc.blocks];if(edit.isNew){const at=edit.after?blocks.findIndex(b=>b.id===edit.after)+1:blocks.length;blocks.splice(at,0,block);}else{const at=blocks.findIndex(b=>b.id===block.id);if(at<0){setError('Esta seção foi removida em outra sessão. Exporte o rascunho antes de cancelar e adicione uma nova seção se necessário.');return;}if(edit.fragment){try{blocks[at]={...blocks[at],content:replaceStrategyDetail(blocks[at].content,edit.fragment,block.title,block.content)};}catch{setError('A ficha mudou desde a abertura. Seu rascunho foi preservado; exporte-o antes de atualizar a nota.');return;}}else blocks[at]=block;}next={...doc,blocks};}
  void persist(next,edit.kind==='header'?'Editar título e apresentação':edit.isNew?'Adicionar seção':edit.fragment?'Editar ficha':'Editar seção').catch(()=>{});
 };
 const editDetail=(block:StrategyBlock,part:MarkdownPart)=>{const lines=block.content.split('\n');const start=part.offset-1,end=part.end??-1;if(start<0||end<start||lines[end]?.trim()!==':::'){setError('A ficha precisa de um fechamento ::: antes de editar separadamente.');return;}startEdit({kind:'block',isNew:false,block:{...block,title:part.title||block.title,content:lines.slice(part.offset,end).join('\n')},fragment:{start,end,original:lines.slice(start,end+1).join('\n')}});};
 const add=(type:'text'|'table'|'diagram',after?:string,element?:HTMLElement)=>{
  const content=type==='table'?'| Campo | Descrição |\n|---|---|\n| | |':type==='diagram'?'```mermaid\nflowchart LR\n  A[Início] --> B[Próximo passo]\n```':'';
  startEdit({kind:'block',isNew:true,after,block:{id:'block-'+crypto.randomUUID(),type:'markdown',title:type==='table'?'Nova tabela':type==='diagram'?'Novo diagrama':'Nova seção',content}},element);
 };
 const collapsible=doc.blocks.filter(b=>b.id!=='visao-geral');
 const allClosed=collapsible.length>0&&collapsible.every(b=>closed.has(b.id));
 const protectedIds=new Set(doc.blocks.filter(b=>(taskDirty&&b.type==='tasks')||(edit?.kind==='block'&&edit.block.id===b.id)).map(b=>b.id));
 const toggleAll=()=>{setClosed(allClosed?new Set():collapseStrategySections(doc.blocks.map(b=>b.id),protectedIds));if(!allClosed&&protectedIds.size)setMessage('As demais seções foram recolhidas. A edição permanece aberta.');};
 const locateEditor=()=>{const target=edit?.kind==='block'?document.getElementById(edit.block.id):document.getElementById('strategy-header');if(edit?.kind==='block')setClosed(c=>{const next=new Set(c);next.delete(edit.block.id);return next;});requestAnimationFrame(()=>{target?.scrollIntoView({block:'start'});editorRef.current?.querySelector<HTMLInputElement>('input')?.focus({preventScroll:true});});};
 const jump=(id:string)=>{manualActiveUntil.current=Date.now()+1000;setQuery('');setMobileIndex(false);setActive(id);setClosed(c=>{const next=new Set(c);next.delete(id);return next;});requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));};
 const closeHistory=()=>{dialog.current?.close();setHistoryOpen(false);setSelectedRevision(null);setReconciling(false);focusBack();};
 const download=()=>{const working=edit?.kind==='header'?{...doc,title:edit.title,summary:edit.summary}:edit?.kind==='block'?{...doc,blocks:(edit.isNew||!doc.blocks.some(b=>b.id===edit.block.id))?[...doc.blocks,edit.block]:doc.blocks.map(b=>{if(b.id!==edit.block.id)return b;if(!edit.fragment)return edit.block;try{return {...b,content:replaceStrategyDetail(b.content,edit.fragment,edit.block.title,edit.block.content)};}catch{return {...b,content:b.content+'\n\n### Rascunho recuperado: '+edit.block.title+'\n\n'+edit.block.content};}})}:doc;saveMarkdown(exportStrategy(working),source.relative_path.split('/').pop()?.replace(/\.md$/,'-trabalho.md')||'estrategia-trabalho.md');};
 // Without a working version or an open edit, the page is the vault source itself: download it whole, frontmatter included.
 const downloadPage=()=>{if(!head&&!edit)saveMarkdown(source.content_markdown,source.relative_path.split('/').pop()||'estrategia.md');else download();};
 const editor=(draft:EditDraft)=><div ref={editorRef} className="strategy-editor"><form onSubmit={e=>{e.preventDefault();saveEdit();}}><fieldset disabled={busy}>
  <label>{draft.kind==='header'?'Título da nota':draft.fragment?'Título da ficha':'Título da seção'}<input required value={draft.kind==='header'?draft.title:draft.block.title} onChange={e=>setEdit(draft.kind==='header'?{...draft,title:e.target.value}:{...draft,block:{...draft.block,title:e.target.value}})}/></label>
  <div className="strategy-editor-tabs"><button type="button" aria-pressed={!preview} onClick={()=>setPreview(false)}>Conteúdo</button><button type="button" aria-pressed={preview} onClick={()=>setPreview(true)}>Prévia</button></div>
  {preview?<div className="strategy-prose"><Markdown content={draft.kind==='header'?draft.summary:draft.block.content} onOpen={onOpen}/></div>:<label>{draft.kind==='header'?'Apresentação':draft.fragment?'Conteúdo da ficha':'Conteúdo da seção'}<textarea rows={draft.kind==='header'?4:12} value={draft.kind==='header'?draft.summary:draft.block.content} onChange={e=>setEdit(draft.kind==='header'?{...draft,summary:e.target.value}:{...draft,block:{...draft.block,content:e.target.value}})}/></label>}
  <p className="strategy-help">Texto, tabelas, links e diagramas usam Markdown. A prévia mostra como o conteúdo ficará na nota.</p>
  <div className="strategy-editor-actions"><button className="strategy-primary" type="submit">{busy?'Salvando…':'Salvar alterações'}</button><button type="button" onClick={cancel}>Cancelar</button></div>
 </fieldset></form></div>;
 return <div className="wiki-strategy" onClickCapture={e=>{const button=(e.target as HTMLElement).closest('.strategy-menu button');button?.closest('details')?.removeAttribute('open');}} aria-label={doc.title+' · estratégia colaborativa'} aria-busy={loading||busy}>
  <aside ref={navRef} className="strategy-nav"><button type="button" className="strategy-mobile-index" aria-expanded={mobileIndex} aria-controls="strategy-document-index" onClick={()=>setMobileIndex(!mobileIndex)}>Nesta estratégia <ChevronDown size={16}/></button><label className="strategy-search"><Search size={16}/><input aria-label="Buscar nesta nota" placeholder="Buscar nesta nota" value={query} onChange={e=>setQuery(e.target.value)}/></label>
   <nav id="strategy-document-index" className={mobileIndex?'is-open':''} aria-label="Índice da estratégia"><button className={active==='visao-geral'?'is-active':''} onClick={()=>{manualActiveUntil.current=Date.now()+1000;setQuery('');setMobileIndex(false);setActive('visao-geral');document.getElementById('strategy-header')?.scrollIntoView();}}>Visão geral</button>{doc.blocks.filter(b=>b.id!=='visao-geral').map(b=><button key={b.id} className={active===b.id?'is-active':''} onClick={()=>jump(b.id)}>{navTitle(b)}</button>)}</nav>
   <p className="strategy-help">{head?'Versão de trabalho · r'+head.revision:'Fonte do vault'}<br/>{canEdit?'Alterações recuperáveis no histórico.':'Leitura · edição conforme permissões atuais.'}</p>
  </aside>
  <main className="strategy-main">
   <header id="strategy-header" className="strategy-header"><div className="strategy-breadcrumb"><button onClick={()=>{if(!protect()){if(onHome)onHome();else window.location.assign('?view=learning&section=vault&wiki_topic=strategies');}}}>Wiki</button><ChevronRight size={12}/><span>Estratégias</span></div><div className="strategy-page-actions">
    {collapsible.length>1&&<button type="button" aria-pressed={allClosed} onClick={toggleAll}>{allClosed?<><ChevronsUpDown size={17}/>Expandir seções</>:<><ChevronsDownUp size={17}/>Recolher seções</>}</button>}
    <button disabled={busy} onClick={e=>{opener.current=e.currentTarget;setHistoryOpen(true);}}><History size={17}/>Histórico</button>
    <button type="button" onClick={downloadPage} title="Baixar esta página em Markdown"><Download size={17}/>Baixar .md</button>
    {canEdit&&<button className="strategy-primary" disabled={locked||sourceChanged} onClick={e=>add('text',undefined,e.currentTarget)}><Plus size={17}/>Adicionar seção</button>}
   </div>
   <div className="strategy-title"><h1>{doc.title}</h1>{canEdit&&<button className="strategy-icon" disabled={locked||sourceChanged} aria-label="Editar título e apresentação" onClick={e=>startEdit({kind:'header',title:doc.title,summary:doc.summary},e.currentTarget)}><Pencil size={15}/></button>}</div>
   <div className="strategy-meta"><span className="strategy-state">{stateLabel}</span>{stateLabel!==docStatus&&<span>Estado documental: {docStatus}</span>}{head&&<span>Salva em {new Date(head.updated_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}</span>}{sourceOperation&&<details className="strategy-source-status"><summary>Estado da operação · SQLs a validar</summary><div className="strategy-prose"><Markdown content={sourceOperation} onOpen={onOpen}/></div></details>}</div>
   {edit?.kind==='header'?editor(edit):<div className="strategy-prose strategy-summary"><Markdown content={doc.summary} onOpen={onOpen}/></div>}
   </header>
   {loading&&<p role="status" className="strategy-notice">Consultando a versão de trabalho…</p>}
   {sourceChanged&&<div role="alert" className="strategy-notice">A fonte do vault mudou. Sua versão de trabalho foi preservada. Compare e reconcilie em Histórico.</div>}
   {error&&<div role="alert" className="strategy-notice strategy-error">{error}{revisionWarning&&<><button onClick={download}><Download size={14}/>Exportar versão de trabalho</button><button onClick={()=>{if(draftKey)sessionStorage.removeItem(draftKey);setEdit(null);setRetry(r=>r+1);}}>Descartar rascunho e atualizar</button></>}{!canEdit&&<button onClick={()=>setRetry(r=>r+1)}>Tentar novamente</button>}</div>}
   {recoveredStale&&<div className="strategy-notice">O rascunho pertence a uma revisão anterior.<button onClick={()=>{setRecoveredStale(false);setError('');}}>Revisar rascunho sobre a versão atual</button></div>}
   {edit&&<div className="strategy-draft-notice" role="status"><span>Edição em andamento: <strong>{edit.kind==='header'?'Título e apresentação':cleanTitle(edit.block.title)}</strong>. Você pode consultar as outras seções.</span><button type="button" onClick={locateEditor}>Ir para edição</button><button type="button" disabled={busy} onClick={cancel}>Cancelar edição</button></div>}
   {message&&<p role="status" className="strategy-feedback">{message}</p>}
   {doc.blocks.map((block,index)=>{
    const matches=!query||(block.title+' '+block.content).toLocaleLowerCase().includes(query.toLocaleLowerCase())||block.type==='tasks';
    const isClosed=closed.has(block.id)&&!query&&!(edit?.kind==='block'&&edit.block.id===block.id)&&!(taskDirty&&block.type==='tasks');
    return <section key={block.id} id={block.id} hidden={!matches} className={'strategy-block '+(block.type==='tasks'?'strategy-task-block':'')}>
     <div className="strategy-block-heading"><button aria-label={`${isClosed?'Abrir':'Recolher'} ${cleanTitle(block.title)}`} aria-expanded={!isClosed} onClick={()=>{if(!isClosed&&protectedIds.has(block.id)){setMessage('Esta seção tem uma edição em andamento. Salve ou cancele para recolhê-la; as outras seções continuam acessíveis.');return;}setClosed(c=>toggleStrategySection(c,block.id,protectedIds));}} className="strategy-section-toggle">{isClosed?<ChevronRight size={16}/>:<ChevronDown size={16}/>}<h2>{cleanTitle(block.title)}</h2></button>
      {canEdit&&<div className="strategy-block-actions"><button className="strategy-icon" disabled={locked||sourceChanged} aria-label={`Editar ${cleanTitle(block.title)}`} onClick={e=>startEdit({kind:'block',block:{...block},isNew:false},e.currentTarget)}><Pencil size={15}/></button>
       <details className="strategy-menu"><summary aria-label={`Ações de ${cleanTitle(block.title)}`} className="strategy-icon"><MoreHorizontal size={17}/></summary><div>
        <button disabled={locked||sourceChanged||block.type==='tasks'} onClick={()=>apply({...doc,blocks:[...doc.blocks.slice(0,index+1),{...block,id:'block-'+crypto.randomUUID(),title:block.title+' (cópia)'},...doc.blocks.slice(index+1)]},'Duplicar seção')}><Copy size={14}/>Duplicar</button>
        <button disabled={locked||sourceChanged||index===0} onClick={()=>apply(moveBlock(doc,block.id,-1),'Mover seção para cima')}><ArrowUp size={14}/>Mover para cima</button>
        <button disabled={locked||sourceChanged||index===doc.blocks.length-1} onClick={()=>apply(moveBlock(doc,block.id,1),'Mover seção para baixo')}><ArrowDown size={14}/>Mover para baixo</button>
        <button disabled={locked||sourceChanged} className="strategy-delete" onClick={()=>setDeleteTarget(block.id)}><Trash2 size={14}/>Excluir seção</button><small>Recuperável no histórico</small>
       </div></details></div>}
     </div>
     {deleteTarget===block.id&&<div role="alert" className="strategy-notice">Excluir esta seção da nota? O conteúdo fica no histórico.<button disabled={locked} onClick={()=>{setDeleteTarget(null);apply({...doc,blocks:doc.blocks.filter(b=>b.id!==block.id)},'Excluir seção: '+block.title);}}>Excluir seção</button><button onClick={()=>setDeleteTarget(null)}>Cancelar exclusão</button></div>}
     <div hidden={isClosed}>
      {edit?.kind==='block'&&edit.block.id===block.id&&!edit.isNew?editor(edit):block.type==='tasks'&&hasVisaActivities(source)?<WikiPilotChecklist {...taskProps} insurance={source.relative_path==='05-Estrategia/Estrategia-de-Segmentacao-de-Seguros.md'} initiallyOpen layout={doc.taskLayout} documentBusy={busy||Boolean(edit)||sourceChanged} onDirtyChange={notifyTaskDirty} onLayoutChange={canEdit?async layout=>{await persist({...doc,taskLayout:layout},'Reorganizar atividades da nota');}:undefined}/>:<div className="strategy-prose"><Markdown content={block.content} onOpen={onOpen} onEditPart={canEdit?part=>editDetail(block,part):undefined} editDisabled={locked||sourceChanged}/></div>}
      {canEdit&&<div className="strategy-add-block"><details className="strategy-menu"><summary><Plus size={16}/>Adicionar bloco</summary><div><button disabled={locked||sourceChanged} onClick={e=>add('text',block.id,e.currentTarget)}>Texto</button><button disabled={locked||sourceChanged} onClick={e=>add('table',block.id,e.currentTarget)}>Tabela</button><button disabled={locked||sourceChanged} onClick={e=>add('diagram',block.id,e.currentTarget)}>Diagrama</button></div></details></div>}
     </div>
     {edit?.kind==='block'&&edit.isNew&&edit.after===block.id&&editor(edit)}
    </section>;
   })}
   {edit?.kind==='block'&&edit.isNew&&!edit.after&&editor(edit)}
   {query&&!doc.blocks.some(b=>(b.title+' '+b.content).toLocaleLowerCase().includes(query.toLocaleLowerCase()))&&<p className="strategy-help">Nenhuma seção de texto corresponde à busca. As atividades permanecem acessíveis.</p>}
   <footer className="strategy-footer"><span>Alterações nesta nota não executam campanhas ou automações.</span><div className="strategy-footer-actions"><button onClick={()=>openFeedback({surface:'vault',pageLabel:'Wiki',locationLabel:'Wiki › '+doc.title+(head?' · revisão '+head.revision:''),targetType:'note',targetId:source.relative_path,kind:'knowledge'})}>Correção para IA</button><button onClick={download}><Download size={14}/>Exportar Markdown</button></div></footer>
  </main>
  {historyOpen&&<dialog ref={dialog} className="strategy-history" aria-labelledby="strategy-history-title" onCancel={closeHistory}><header><h2 id="strategy-history-title">Histórico da nota</h2><button className="strategy-icon" aria-label="Fechar histórico" onClick={closeHistory}><X size={20}/></button></header><p>Excluir é recuperável. Restaurar cria uma nova revisão; não apaga as posteriores. Alterações nos campos das atividades têm histórico próprio em Testes e Tarefas.</p>
   {historyError&&<p role="alert">{historyError}</p>}{!revisions.length&&!historyError&&<p>{canEdit?'O histórico começa na primeira alteração.':'O histórico detalhado segue as permissões administrativas atuais.'}</p>}
   <div className="strategy-history-list">{revisions.map(r=><button key={r.revision} onClick={()=>setSelectedRevision(r)} aria-pressed={selectedRevision?.revision===r.revision}><strong>{r.revision===0?'Fonte original':'Revisão '+r.revision}</strong><span>{r.reason}</span><small>{new Date(r.created_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} · autor {r.actor_id.slice(0,8)}</small></button>)}</div>
   {selectedRevision&&<section><h3>Prévia da revisão {selectedRevision.revision}</h3><pre>{selectedRevision.revision===0?selectedRevision.source_markdown:exportStrategy(selectedRevision.document)}</pre>{canEdit&&<button disabled={busy||sourceChanged||dirty} className="strategy-primary" onClick={()=>{const next=selectedRevision.revision===0?initialStrategy({...source,content_markdown:selectedRevision.source_markdown}):selectedRevision.document;void persist(next,'Restaurar revisão '+selectedRevision.revision).then(closeHistory).catch(()=>{});}}><RotateCcw size={15}/>Restaurar esta revisão</button>}</section>}
   {sourceChanged&&<section><button onClick={()=>setReconciling(!reconciling)}>Comparar fonte atual com versão de trabalho</button>{reconciling&&<><h3>Fonte atual do vault</h3><pre>{source.content_markdown}</pre><h3>Versão de trabalho preservada</h3><pre>{exportStrategy(doc)}</pre><p>Ao reconhecer a nova fonte, a versão de trabalho acima será mantida. Revise as diferenças e depois edite os trechos necessários. Ambas as fontes ficam preservadas no histórico.</p><button disabled={busy} className="strategy-primary" onClick={()=>void persist(doc,'Reconhecer nova fonte e preservar edição',true,true).then(closeHistory).catch(()=>{})}><Check size={15}/>Reconhecer fonte e preservar edição</button></>}</section>}
  </dialog>}
 </div>;
}
