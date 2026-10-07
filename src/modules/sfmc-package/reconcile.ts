import type { PackageMessage } from './types';
import type { CommunicationTemplate } from '../../types/communication';
import { isValidTemplateId } from '../../utils/templateId';
export function reconcileMessage(message: PackageMessage, catalog: CommunicationTemplate[]) {
  if (message.is_optout) return { status: 'Opt-out', templateId: '', candidates: [] as CommunicationTemplate[], eligible: false };
  const id = message.utm.af_sub3;
  if (id && !isValidTemplateId(id)) return { status: 'ID inválido', templateId: id, candidates: [], eligible: false };
  const exact = id ? catalog.find(t => t.template_id === id) : undefined;
  if (exact) return { status: exact.channel === message.content.channel ? 'ID exato' : 'Canal incompatível', templateId: exact.template_id, candidates: [exact], eligible: exact.channel === message.content.channel };
  if (id) return { status: 'Novo template', templateId: id, candidates: [], eligible: true };
  const candidates = catalog.filter(t => t.title === message.content.meta_template_name && t.channel === message.content.channel);
  return { status: candidates.length === 1 ? 'Título único' : candidates.length > 1 ? 'Título ambíguo' : 'Sem chave',
    templateId: candidates.length === 1 ? candidates[0].template_id : '', candidates, eligible: candidates.length === 1 };
}

