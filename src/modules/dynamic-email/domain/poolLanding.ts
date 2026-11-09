import Papa from 'papaparse';
import {vdvValidOffer,type VdvBriefingRow,type VdvMovimentoRow,type VdvSample} from './vaiDeVisa';
export const POOL_SELECTION_COLUMNS='VERSAO,GRUPO,CELULA,POSICAO,OFERTA_ID,ATIVA,MOTIVO,DT_RODADA,VERSAO_TEMA'.split(',');
export function parsePoolSelectionCsv(source:string):VdvMovimentoRow[]{
 const parsed=Papa.parse<string[]>(source.replace(/^\uFEFF/,''),{skipEmptyLines:true});
 const [header,...rows]=parsed.data;
 if(parsed.errors.length||JSON.stringify(header)!==JSON.stringify(POOL_SELECTION_COLUMNS))throw Error('Use as nove colunas do POOL, na ordem do contrato.');
 const keys=new Set<string>();
 return rows.map(values=>{
  if(values.length!==header.length)throw Error('Quantidade de campos inválida no POOL.');
  const row=Object.fromEntries(header.map((h,i)=>[h,values[i]]));
  const key=[row.VERSAO,row.GRUPO,row.CELULA,row.POSICAO].join('|');
  if(keys.has(key)||!row.VERSAO.trim()||!row.VERSAO_TEMA.trim()||!row.OFERTA_ID.trim()||!/^[1-6]$/.test(row.POSICAO)||!/^(true|false|1|0)$/i.test(row.ATIVA))throw Error('Chave, posição, versão de tema ou atividade inválida no POOL.');
  keys.add(key);return row;
 });
}
const active=(s:string)=>/^(true|1)$/i.test(s);
const escape=(s:string|undefined)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const safeUrl=(value:string)=>{try{const u=new URL(value);return u.protocol==='https:'?escape(u.href):'';}catch{return '';}};
/** Content preview only. Production LP must resolve participation/token server-side through SAFRA. */
export function resolvePoolLanding({briefing,selection,sample,round,today,banner=''}:{briefing:VdvBriefingRow[];selection:VdvMovimentoRow[];sample:VdvSample;round:string;today:string;banner?:string}){
 const group=['SEG-B','GEN-A'].includes(sample.DS_CELULA_TESTE)?'GENERICO':sample.CD_GRUPO;
 const candidates=selection.filter(r=>r.VERSAO===round&&r.GRUPO===group&&active(r.ATIVA));
 const cells=candidates.some(r=>r.CELULA===sample.DS_CELULA_TESTE)?sample.DS_CELULA_TESTE:'TODAS';
 const rows=candidates.filter(r=>r.CELULA===cells).sort((a,b)=>+a.POSICAO-+b.POSICAO).filter(r=>+r.POSICAO>=1&&+r.POSICAO<=6);
 const themes=[...new Set(rows.map(r=>r.VERSAO_TEMA||r.VERSAO))];
 const blocked=['SEG-C','GEN-C'].includes(sample.DS_CELULA_TESTE);
 const diagnostics:string[]=[];
 if(blocked)diagnostics.push('Controle: sem comunicação ou vitrine personalizada do Pool.');
 if(themes.length!==1)diagnostics.push('Rodada sem seleção ou com versões de tema conflitantes.');
 const theme=themes.length===1?briefing.find(r=>r.TIPO==='TEMA'&&r.VERSAO===themes[0]&&active(r.ATIVA)&&(!r.INICIO||r.INICIO<=today)&&(!r.FIM||r.FIM>=today)):undefined;
 if(!theme)diagnostics.push('Tema ativo e vigente da rodada não encontrado.');
 if(!banner)diagnostics.push('Banner da LP pendente de asset; a arte é independente do hero do e-mail.');
 const brands=new Set<string>();
 const cards:VdvBriefingRow[]=[];
 if(!blocked&&theme)for(const row of rows){
  const offer=briefing.find(o=>o.ID===row.OFERTA_ID&&vdvValidOffer(o,today));
  if(!offer||!offer.MARCA.trim()||!safeUrl(offer.LINK)||!safeUrl(offer.FOTO)||brands.has(offer.MARCA.trim().toUpperCase()))continue;
  brands.add(offer.MARCA.trim().toUpperCase());cards.push(offer);if(cards.length===3)break;
 }
 if(!cards.length)diagnostics.push('Sem ofertas válidas para esta rodada/data. O link antigo não muda automaticamente para uma rodada nova.');
 const intro=(theme?.INTRO||'Confira as ofertas e as condições de resgate.').replace(/<[^>]*>/g,'').split('{TEMA}').join(theme?.TEMA||'').split('{CARTAO}').join(sample.NM_CARTAO||theme?.CARTAO_PADRAO||'cartão Afinz Visa').split('{NOME}').join(sample.FIRST_NAME.trim().split(/\s+/)[0]||'');
 const html=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Black Afinz · prévia da LP</title><style>*{box-sizing:border-box}body{margin:0;background:#000;color:#fff;font:16px/1.5 Arial,sans-serif}header{background:#000;color:white;padding:18px 24px;text-align:center;font-size:30px}.wrap{max-width:1200px;margin:auto;padding:24px}.banner{background:#062b2e;text-align:center;min-height:150px;display:grid;place-content:center;color:#a3d7d6;border:1px dashed #96a6b5}.banner img{max-width:100%;height:auto}h1{font-size:28px}.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}.card{color:#18212a;background:white;border:1px solid #d8e0e5;overflow:hidden}.card>img{width:100%;height:160px;object-fit:cover}.content{padding:20px}h2{margin:0;font-size:21px}.benefit{font-size:28px;font-weight:bold;color:#00aeb9;margin:10px 0}.coupon{border:1px dashed #8094a4;padding:8px;display:inline-block}a.cta{display:block;text-align:center;background:#d3ff00;color:#000;padding:12px;text-decoration:none;margin:14px 0}summary{cursor:pointer}small{color:#647381}footer{padding:24px;border-top:1px solid #d8e0e5;margin-top:24px}@media(max-width:600px){.wrap{padding:16px}.cards{grid-template-columns:1fr}.card:first-child:nth-last-child(odd){grid-column:auto;width:100%}}</style><header><strong>afinz</strong></header><main class="wrap">${banner&&safeUrl(banner)?`<div class="banner"><img src="${safeUrl(banner)}" alt="Campanha Black Afinz"></div>`:'<div class="banner">Banner da campanha<br><small>Asset da LP pendente</small></div>'}<h1>${escape(theme?.TEMA||'Ofertas da rodada')}</h1><p>${escape(intro)}</p><section class="cards">${cards.map(o=>`<article class="card"><img src="${safeUrl(o.FOTO)}" alt="${escape(o.ALT||o.MARCA)}"><div class="content"><h2>${escape(o.MARCA)}</h2><div class="benefit">${escape([o.PREFIXO,o.VALOR,o.SUFIXO].filter(Boolean).join(' '))}</div><p>${escape(o.COMPLEMENTO)}</p>${o.RESGATE==='CUPOM'&&o.CUPOM.trim()?`<p class="coupon">Cupom: <strong>${escape(o.CUPOM)}</strong></p>`:o.RESGATE==='PAGAR_COM_VISA'?'<p>Pague com Visa</p>':''}${o.FIM?`<small>Válida até ${escape(o.FIM.split('-').reverse().join('/'))}</small>`:''}<a class="cta" href="${safeUrl(o.LINK)}" target="_blank" rel="noopener noreferrer">${escape(theme?.CTA||'Aproveitar oferta')}</a><details><summary>Condições da oferta</summary><p>${escape(o.CONDICOES)}</p></details></div></article>`).join('')}</section>${!cards.length?'<p>Ofertas indisponíveis nesta rodada/data.</p>':''}<footer>${escape(theme?.RODAPE_CONDICOES||'Consulte as condições de cada oferta.')}</footer></main></html>`;
 return {html,cards,diagnostics,themeVersion:theme?.VERSAO||'',group,round};
}
