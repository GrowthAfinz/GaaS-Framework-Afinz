/** Materialize inherited solid backgrounds without changing text, layout or brand colors.
 * Input is governed email HTML. No scripts are evaluated and original tag text is retained.
 */
export function opaqueEmailBackgrounds(html:string,baseColor='#ffffff'):string {
 const stack:Array<{tag:string;color:string}>=[];
 const surfaces=new Set(['body','table','td','div','p','h1','h2','h3']);
 const voids=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
 return html.replace(/<!--[\s\S]*?-->|<\/?[a-z][^>]*>/gi,raw=>{
  if(raw.startsWith('<!--'))return raw;
  const tag=raw.match(/^<\/?([\w:-]+)/)![1].toLowerCase();
  if(raw.startsWith('</')){
   const at=stack.map(frame=>frame.tag).lastIndexOf(tag);if(at>=0)stack.splice(at);
   return raw;
  }
  const style=raw.match(/\bstyle="([^"]*)"/)?.[1]??'';
  const explicit=style.match(/(?:^|;)\s*background(?:-color)?\s*:\s*(#[\da-f]{3,8})\b/i)?.[1]
   ??raw.match(/\bbgcolor="(#[\da-f]{3,8})"/i)?.[1];
  const color=explicit??stack[stack.length-1]?.color??baseColor;
  let output=raw;
  // The source has mutually exclusive AMPscript TD openings for this colored band.
  // Its foreground wrapper must keep inheriting the selected branch's brand color.
  const brandText=/\bclass="[^"]*\bbrand-text\b/.test(raw);
  if(surfaces.has(tag)&&!brandText){
   if(!explicit){
    const next=style.replace(/(?:^|;)\s*background(?:-color)?\s*:\s*transparent\s*;?/gi,';');
    const filled=`${next}${next.trim().endsWith(';')||!next?'':';'}background-color:${color};`;
    output=/\bstyle="/.test(output)?output.replace(/\bstyle="[^"]*"/,`style="${filled}"`):output.replace(/>$/,` style="${filled}">`);
   } else if(!/(?:^|;)\s*background(?:-color)?\s*:/i.test(style)){
    output=/\bstyle="/.test(output)?output.replace('style="',`style="background-color:${color};`):output.replace(/>$/,` style="background-color:${color}">`);
   }
   if(['body','table','td'].includes(tag)&&! /\bbgcolor=/.test(output))output=output.replace(/>$/,` bgcolor="${color}">`);
  }
  if(!voids.has(tag)&&!raw.endsWith('/>'))stack.push({tag,color});
  return output;
 });
}
