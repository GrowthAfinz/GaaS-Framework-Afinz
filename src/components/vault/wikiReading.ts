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
  for(const key of ['bu','partner','segment','stages','channels']){
    const value=prepared.content.match(new RegExp('^\\|\\s*'+key+'\\s*\\|\\s*(.*?)\\s*\\|','m'))?.[1];
    if(!value)continue;
    try { const parsed=JSON.parse(value);context[key]=Array.isArray(parsed)?parsed.filter(item=>typeof item==='string').join(' · '):value; }
    catch {context[key]=value;}
  }
  return {sections,summary,pending,context};
}
