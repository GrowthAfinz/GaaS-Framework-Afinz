import { prepareWikiMarkdown, wikiHeadingId } from './wikiNavigation';

export function wikiReading(markdown: string) {
  const prepared=prepareWikiMarkdown(markdown);
  const lines=prepared.content.split('\n');
  const headings=prepared.headings.filter(heading=>heading.depth===2);
  const starts=[0,...headings.map(heading=>heading.line-1)].filter((value,index,array)=>array.indexOf(value)===index);
  const sections=starts.map((start,index)=>{
    const heading=headings.find(item=>item.line-1===start);
    return {content:lines.slice(start,starts[index+1]??lines.length).join('\n'),offset:start,
      title:heading?.title||'',id:heading?.id||'',technical:heading?['registro-de-descoberta','proveniencia-do-inventario'].includes(wikiHeadingId(heading.title)):false};
  }).filter(section=>section.content.trim());
  const definition=sections.find(section=>['definicao','o-que-este-assunto-representa'].includes(section.id));
  const summary=definition?.content.split('\n').slice(1).join('\n').trim().split(/\n\s*\n/)[0]||'';
  const pending=prepared.content.match(/\*\*O que precisa ser validado:\*\*\s*([\s\S]*?)(?=\n\s*\n|$)/)?.[1]?.trim()||'';
  const context:Record<string,string>={};
  for(const key of ['bu','partner','segment','stages','subgroups','channels','products','offers','promotions']){
    const value=prepared.content.match(new RegExp('^\\|\\s*'+key+'\\s*\\|\\s*(.*?)\\s*\\|','m'))?.[1];
    if(!value)continue;
    try { const parsed=JSON.parse(value);context[key]=Array.isArray(parsed)?parsed.filter(item=>typeof item==='string').join(' · '):value; }
    catch {context[key]=value;}
  }
  const labels:Record<string,string>={bu:'Unidade de negócio',partner:'Parceiro',segment:'Público',stages:'Etapas do funil',subgroups:'Grupos de público',channels:'Canais',products:'Produtos',offers:'Ofertas',promotions:'Promoções'};
  const scopeFields=Object.entries(context).map(([key,value])=>({key,label:labels[key],values:value.split(' · ').filter(value=>value && !['N/A','N/A.','NA'].includes(value)).map(value=>value.replace(/_/g,' '))})).filter(field=>field.values.length);
  const campaigns=sections.find(section=>section.id==='campanhas-e-variantes-observadas');
  const journeys=(campaigns?.content.split('\n')||[]).filter(line=>/^\|\s*CAMP-/.test(line)).map(line=>{const cells=line.split('|').slice(1,-1).map(cell=>cell.trim());return {id:cells[0],journey:cells[1],safra:cells[2],stage:cells[3],subgroup:cells[4],rows:cells[5]};}).filter(row=>row.journey);
  return {sections,summary,pending,context,scopeFields,journeys};
}

// Scope belongs to the destination note. The analytical month remains the reader's context.
export function wikiNoteNavigationParams(search:string) {
  const params=new URLSearchParams(search);
  for(const key of ['wiki_front','wiki_group','wiki_segment','wiki_catalog_q'])params.delete(key);
  for(const key of [...params.keys()]) if(key.startsWith('result_') && !['result_month','result_domain'].includes(key))params.delete(key);
  return params;
}
