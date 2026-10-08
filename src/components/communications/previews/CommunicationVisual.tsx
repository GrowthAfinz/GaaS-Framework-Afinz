import type {MessageContent} from '../../../modules/sfmc-package/types';
import type {CommunicationTemplate} from '../../../types/communication';
import {resolvePreview} from '../../../utils/communicationVisualResolution';
import {PreviewThumb} from './ContentPreview';

/**
 * Prévia das filas (pack e disparos sem template). Mesma resolução da Performance:
 * comunicação configurada no pack para este uso → peça do catálogo já resolvida pelo ID original
 * (ou candidata pelo ID proposto, rotulada) → ausência com motivo.
 */
export function CommunicationVisual({content,template,sourceLabel,assetName,observedId}:{content:MessageContent;template?:CommunicationTemplate;sourceLabel?:string;assetName?:string|null;observedId?:string|null}) {
 const base=resolvePreview({channel:content.channel,catalog:template?[template]:[],templateId:template?.template_id??null,packContent:content});
 const candidate=!!sourceLabel&&/candidat/i.test(sourceLabel);
 const res=base.kind==='pack_message'||base.kind==='none'?{...base,templateId:base.templateId??observedId??null,detail:base.kind==='none'&&content.channel==='E-mail'?`HTML não disponível para prévia nesta importação.${sourceLabel?' '+sourceLabel:''}`:base.detail}
  :{...base,label:sourceLabel||base.label,candidate};
 return <PreviewThumb res={res} title={observedId??template?.template_id??undefined} assetName={assetName}/>;
}
