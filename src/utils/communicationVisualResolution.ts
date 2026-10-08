import type {CommunicationTemplate} from '../types/communication';
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
