import { z } from 'zod';
import { emptyBriefingRow, type BriefingRow } from './briefing';
import { withMeta, type WorkspaceBriefing, type EmailTemplateSlot } from './workspace';
import { VDV_POOL_TEMPLATE } from '../fixtures/vaiDeVisaPoolTemplate';
import type { VdvBriefingRow } from './vaiDeVisa';

export const factoryContextSchema = z.object({kind:z.literal('vdv'),rulerName:z.string().min(1),campaignName:z.string().min(1),contentVersion:z.string().regex(/^[A-Z0-9_]{1,40}$/),touch:z.enum(['V1','V2'])});
export type FactoryContext=z.infer<typeof factoryContextSchema>;
export const isVdvEmail=(row:BriefingRow|undefined):boolean=>row?.__editor?.kind==='vdv';
export const VDV_SLOT='builtin-vdv-pool';
export function materializeVdvTemplate(source:string,touch:'V1'|'V2') {return source.replace(/SET\s+@VersaoEmail\s*=\s*["']V[12]["']/i,`SET @VersaoEmail = "${touch}"`);}
export function ensureVdvTemplate(slots:EmailTemplateSlot[]):EmailTemplateSlot[]{return slots.some(s=>s.id===VDV_SLOT)?slots:[...slots,{id:VDV_SLOT,name:'Pool de Ofertas Visa · fonte dinâmica',source:VDV_POOL_TEMPLATE,isPrincipal:false,version:1,updatedAt:'2026-11-09T00:00:00Z'}];}
export function createVdvEdition(version:string,campaignName:string):WorkspaceBriefing[]{return (['V1','V2'] as const).map(touch=>{
 const id=crypto.randomUUID();const row=emptyBriefingRow();row.__id=id;row.__editor={kind:'vdv',rulerName:'Pool de Ofertas Visa',campaignName,contentVersion:version,touch};
 Object.assign(row,{TP_CAMPANHA:'Rentabilização',NM_PRODUTO_INTERNO:'AFINZ_VISA',SEQUENCIA:touch==='V1'?'E-mail 1 · persona':'E-mail 2 · cartão'});
 return withMeta(row,{partner:'Afinz Visa',segment:'Pool de Ofertas Visa',weekKey:campaignName,campaignGroupId:id,templateSlotId:VDV_SLOT});
});}
export function projectVdvEditorial(row:WorkspaceBriefing,briefing:VdvBriefingRow[]):WorkspaceBriefing {
 if(!row.__editor)return row;const t=briefing.find(b=>b.TIPO==='TEMA'&&b.VERSAO===row.__editor!.contentVersion&&b.ATIVA.toLowerCase()==='true');if(!t)return row;
 return {...row,ASSUNTO:row.__editor.touch==='V2'&&t.ASSUNTO_V2?t.ASSUNTO_V2:t.ASSUNTO,PRE_CABECALHO:row.__editor.touch==='V2'&&t.PREHEADER_V2?t.PREHEADER_V2:t.PREHEADER,DT_INICIO:t.INICIO,DT_FIM:t.FIM};
}
export const factoryFamilyOrder=(family:string)=>['Aquisição','Ciclo de Vida','Rentabilização'].indexOf(family)<0?99:['Aquisição','Ciclo de Vida','Rentabilização'].indexOf(family);
