import {segmentoKey} from './taxonomy';

/** Operational credit state is explicit in Activity Name; never infer from journey. */
export function upgradeVariant(activity: string): 'menor'|'maior'|null {
  if (/(?:^|_)anc_/.test(activity.toLowerCase())) {
    if (/menor/i.test(activity)) return 'menor';
    if (/maior/i.test(activity)) return 'maior';
  }
  return null;
}
export function allowsRepescagemReuse(activity:string, segment:string|null|undefined) {
  return upgradeVariant(activity)==='menor' && segmentoKey(segment)==='aprovados_nao_convertidos';
}
