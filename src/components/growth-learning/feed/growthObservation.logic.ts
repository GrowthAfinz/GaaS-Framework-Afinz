export interface ObservationJob {
  state:string; revision:number; processed_revision:number; changed_at:string;
  last_error:string|null; finished_at:string|null;
}
export interface ObservationRun {
  id:string; completed_at:string; evaluation_as_of:string; data_read_at:string;
  output:{performance:ObservationMetric[];freshness:ObservationFreshness[];revision_status:string;responsible_label:string};
}
export interface ObservationMetric {operation_id:string;family:string;state:string;current:number|null;median:number|null;reason:string}
export interface ObservationFreshness {source:string;state:string;latest:string|null;days:number|null}
export function observationHealth(enabled:boolean,run:ObservationRun|null,job:ObservationJob|null,today:string):string {
  if(!enabled)return 'Observação pausada';
  if(job&&job.revision>job.processed_revision){
    if(job.state==='failed')return 'Falha no processamento automático';
    if(job.state==='running')return 'Avaliação em andamento';
    return 'Atualização pendente';
  }
  if(!run)return 'Ainda não avaliado';
  if(run.evaluation_as_of<today)return 'Avaliação de um dia anterior';
  return 'Observação atualizada';
}
export function observationStateLabel(state:string):string {
  const labels:Record<string,string>={triggered:'Desvio observado',no_deviation_detected:'Sem desvio detectado',
    open_period:'Mês aberto',no_activity:'Sem atividade',insufficient_sample:'Amostra insuficiente',
    missing_data:'Dado ausente',incomplete_coverage:'Dados incompletos',invalid_denominator:'Denominador inválido',
    incomparable_scope:'Comparação indisponível',out_of_scope:'Fora do escopo'};
  return labels[state]??'Estado indisponível';
}
