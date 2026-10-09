import type {CommunicationTemplate} from '../types/communication';
import type {MessageContent,TemplateContent} from '../modules/sfmc-package/types';
import {canalToId} from './taxonomy';

/** Visual evidence is separate from the proposed identity and approval. IDs stay case sensitive. */
export function resolveCommunicationVisual(catalog:CommunicationTemplate[],channel:string,observedId?:string|null,proposedId?:string|null) {
 const usable=(id?:string|null)=>id?catalog.find(t=>t.template_id===id&&canalToId(t.channel)===canalToId(channel)&&!!(t.preview_path||t.thumbnail_path||t.original_path)):undefined;
 const observed=usable(observedId);
 if(observed)return {template:observed,sourceLabel:`Peça do catálogo · ID original no link: ${observedId}`};
 const proposed=usable(proposedId);
 if(proposed)return {template:proposed,sourceLabel:`Peça candidata do catálogo · ID proposto: ${proposedId}`};
 return {template:undefined,sourceLabel:observedId?`Sem peça cadastrada para o ID original ${observedId}`:'Sem peça cadastrada para esta comunicação'};
}

// ── Resolução única de prévia (fila, biblioteca e Performance) ───────────────
// Ordem: comunicação configurada no pack para ESTE uso → versão atual escolhida do template →
// arquivo do catálogo (HTML de e-mail ou imagem) → indisponível com o motivo.
// Nunca escolhe outra versão automaticamente nem pega peça de outro disparo/canal.

export type PreviewKind='pack_message'|'pack_current'|'catalog_html'|'catalog_image'|'none';
export interface PreviewResolution {
 visualOrigin?:{snapshot_id:string;occurrence_key:string};
 kind:PreviewKind;
 /** Origem exibida ao operador. */
 label:string;
 /** Explicação curta (motivo da ausência, ID usado, aviso de certificação). */
 detail:string;
 /** true quando a prévia vem de um ID sugerido/proposto, não do ID observado/vinculado. */
 candidate:boolean;
 template?:CommunicationTemplate;
 content?:MessageContent;
 assetPath?:string;
 templateId?:string|null;
}
const TEXT_CHANNELS=['wpp','sms','push']; // ids de canalToId
const IMAGE_RE=/\.(png|jpe?g|webp|gif)$/i;
export const isHtmlAsset=(t?:CommunicationTemplate|null)=>!!t?.original_path&&(t.mime_type==='text/html'||/\.html?$/i.test(t.original_path));
export function imageAssetPath(t?:CommunicationTemplate|null):string|null {
 if(!t)return null;
 const isImage=(p?:string|null)=>!!p&&(IMAGE_RE.test(p)||(p===t.original_path&&!!t.mime_type?.startsWith('image/')));
 return [t.preview_path,t.thumbnail_path,t.original_path].find(isImage)??null;
}
const textBody=(c:MessageContent|null|undefined,channel:string)=>!!c&&canalToId(c.channel)===canalToId(channel)&&((!!c.body_text&&TEXT_CHANNELS.includes(canalToId(c.channel)??''))||(canalToId(channel)==='email'&&!!c.email_html));

export interface PreviewInput {
 channel:string;
 catalog:CommunicationTemplate[];
 contents?:Map<string,TemplateContent[]>|null;
 /** Template vinculado/observado (identidade). */
 templateId?:string|null;
 /** ID candidato (sugestão do motor ou ID proposto). Só usado na falta do anterior, marcado como candidato. */
 candidateId?:string|null;
 /** Mensagem configurada no pack para esta mesma jornada/atividade/canal. */
 packContent?:MessageContent|null;
}

const incompleteEmail=(c:MessageContent|null|undefined)=>!!c?.email_html&&/<img\b[^>]*src=["']\s*["']/i.test(c.email_html);
export function resolvePreview({channel,catalog,contents,templateId,candidateId,packContent}:PreviewInput):PreviewResolution {
 if(textBody(packContent,channel)&&!incompleteEmail(packContent))return {kind:'pack_message',label:'Conteúdo do pack · configurado neste uso',detail:'Mensagem da jornada/atividade/canal no pacote SFMC; não certifica o que foi enviado em data passada.',candidate:false,content:packContent!,templateId:templateId??candidateId??null};
 const attempt=(id:string|null|undefined,candidate:boolean):PreviewResolution|null=>{
  if(!id)return null;
  const versions=contents?.get(id)??[];
  const current=versions.find(v=>v.is_current);
  if(current?.visual_origin&&canalToId(current.payload.channel)===canalToId(channel))return {kind:'pack_current',label:candidate?'Conteúdo aprovado do pack · candidato':'Conteúdo aprovado do pack · versão atual escolhida',detail:'Recursos recuperados da observação desta versão aprovada; não certifica envio histórico.',candidate,content:current.payload,visualOrigin:current.visual_origin,templateId:id};
  if(current&&textBody(current.payload,channel)&&!incompleteEmail(current.payload))return {kind:'pack_current',label:candidate?'Conteúdo do pack · versão atual do candidato':'Conteúdo do pack · versão atual escolhida',detail:`Versão atual escolhida para ${id}; não certifica a versão enviada historicamente.`,candidate,content:current.payload,templateId:id};
  const t=catalog.find(x=>x.template_id===id&&canalToId(x.channel)===canalToId(channel));
  if(t&&canalToId(channel)==='email'&&isHtmlAsset(t))return {kind:'catalog_html',label:candidate?'Catálogo · candidato':'Catálogo',detail:`HTML do catálogo para ${id}; não certifica a versão enviada.`,candidate,template:t,assetPath:t.original_path!,templateId:id};
  const image=imageAssetPath(t);
  if(t&&image)return {kind:'catalog_image',label:candidate?'Catálogo · candidato':'Catálogo',detail:`Imagem do catálogo para ${id}; não certifica a versão enviada.`,candidate,template:t,assetPath:image,templateId:id};
  return null;
 };
 const found=attempt(templateId,false)??attempt(candidateId,true);
 if(found)return found;
 if(textBody(packContent,channel))return {kind:'pack_message',label:'Conteúdo do pack · prévia incompleta',detail:'Há imagens ausentes na extração; o conteúdo parcial foi preservado.',candidate:false,content:packContent!,templateId:templateId??candidateId??null};

 const id=templateId??candidateId??null;
 const versions=id?contents?.get(id)??[]:[];
 const tpl=id?catalog.find(x=>x.template_id===id):undefined;
 let detail='Sem conteúdo cadastrado para esta comunicação.';
 if(tpl&&canalToId(tpl.channel)!==canalToId(channel))detail=`Canal do catálogo (${tpl.channel}) diverge de ${channel}; prévia não usada.`;
 else if(canalToId(channel)==='email')detail=tpl?.original_path?'Arquivo do catálogo sem HTML ou imagem para prévia.':'E-mail sem HTML ou imagem cadastrada no catálogo.';
 else if(versions.length&&!versions.some(v=>v.is_current))detail=`${versions.length} versão(ões) importada(s); nenhuma escolhida como atual. Escolha na revisão do pack.`;
 else if(versions.length)detail='Versão atual sem corpo de texto compatível com o canal.';
 return {kind:'none',label:'Prévia indisponível',detail,candidate:!templateId&&!!candidateId,templateId:id};
}
