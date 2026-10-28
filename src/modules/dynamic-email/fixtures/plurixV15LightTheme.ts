/** Explicit light surfaces and paired foregrounds. Real email clients still need Test Send. */
export function applyV15LightTheme(source: string): string {
  const boundary=source.indexOf('<!DOCTYPE html>');
  if(boundary<0)throw new Error('V15: documento HTML ausente');
  const setup=source.slice(0,boundary);let html=source.slice(boundary);
  // Signal that the stylesheet handles both appearances; both use the light palette.
  html=html.replace('name="color-scheme" content="light only"','name="color-scheme" content="light dark"')
    .replace('name="supported-color-schemes" content="light"','name="supported-color-schemes" content="light dark"');
  // Give every structural cell its own surface rather than relying on inheritance.
  html=html.replace(/<(body|table|td)\b[^>]*>/g,tag=>{
    const style=tag.match(/\bstyle="([^"]*)"/)?.[1]??'';
    const declared=style.match(/background-color:(#[\da-f]{3,6});/i)?.[1];
    const color=declared??tag.match(/\bbgcolor="(#[\da-f]{3,6})"/i)?.[1]??'#ffffff';
    const cls='v15-surface-'+color.slice(1).toLowerCase();
    if(/\bclass="/.test(tag))tag=tag.replace('class="',`class="${cls} `);
    else tag=tag.replace(/>$/,` class="${cls}">`);
    if(!/\bbgcolor=/.test(tag))tag=tag.replace(/>$/,` bgcolor="${color}">`);
    const background=`background-color:${color};background:${color} linear-gradient(${color},${color}) repeat;`;
    if(/\bstyle="/.test(tag))tag=tag.replace('style="',`style="${background}`);
    else tag=tag.replace(/>$/,` style="${background}">`);
    return tag;
  });
  html=html.replace(/background-image:linear-gradient\((#[\da-f]{3,6}),\1\);/gi,(_,color:string)=>`background:${color} linear-gradient(${color},${color}) repeat;`);
  const inks:Record<string,string>={CorCopy1:'v15-copy-title',CorCopyPreto1:'v15-copy-main',CorTituloCopy2:'v15-copy-title2',CorCopy2:'v15-copy-second',CorNotaLegal:'v15-copy-legal'};
  // Named selectors survive clients rewriting the original inline color attribute.
  html=html.replace(/<(?:h1|h2|div)\b[^>]*>/g,tag=>{
    const variable=tag.match(/(?:^|[;\s"])color:%%=v\(@(\w+)\)=%%;/)?.[1];
    if(!variable||!inks[variable])return tag;
    return /\bclass="/.test(tag)?tag.replace('class="',`class="${inks[variable]} `):tag.replace(/>$/,` class="${inks[variable]}">`);
  });
  const bgColors=['#ffffff','#f2f4f7','#F6F6FB','#F4F5FB','#eef1f5','#E7A921','#2C3490','#343B61','#4A5BA6'];
  const fgColors=['#242424','#2C3490','#4A4F6A','#454A64','#5A607F','#6b7280','#8A8FA8','#ffffff'];
  const rules:Array<[string[],string]>=[];
  for(const color of bgColors){
    const selectors=[`.v15-surface-${color.slice(1).toLowerCase()}`,`[bgcolor="${color}"]`,`[data-ogsb="${color}"]`,`[style*="background-color:${color};"]`];
    rules.push([selectors,`background-color:${color} !important;background:${color} linear-gradient(${color},${color}) repeat !important;`]);
  }
  for(const [variable,cls] of Object.entries(inks))rules.push([[`.${cls}`],`color:%%=v(@${variable})=%% !important;-webkit-text-fill-color:%%=v(@${variable})=%% !important;`]);
  for(const color of fgColors)rules.push([[`[data-ogsc="${color}"]`,`[style*="color:${color};"]`],`color:${color} !important;-webkit-text-fill-color:${color} !important;`]);
  rules.push([['.brand-text','.brand-text *'],'color:#ffffff !important;-webkit-text-fill-color:#ffffff !important;']);
  const native=rules.map(([selectors,style])=>`${selectors.join(',')} {${style}}`).join('\n');
  const outlook=rules.map(([selectors,style])=>{
    const prefix=style.startsWith('background')?'data-ogsb':'data-ogsc';
    return `${selectors.flatMap(selector=>[`[${prefix}] ${selector}`,`${selector}[${prefix}]`]).join(',')} {${style}}`;
  }).join('\n');
  html=html.replace('</style>',`\n/* V15 revision 2: explicit paired light theme, including Outlook's own attributes. */\n@media (prefers-color-scheme: dark) {\n${native}\n}\n${outlook}\n</style>`);
  return setup+html;
}
