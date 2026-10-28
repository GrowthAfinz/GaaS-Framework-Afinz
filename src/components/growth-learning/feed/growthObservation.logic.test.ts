import {it,expect} from 'vitest';
import {observationHealth,observationStateLabel,type ObservationRun,type ObservationJob} from './growthObservation.logic';
const run={evaluation_as_of:'2026-10-28'} as ObservationRun;
const job={state:'pending',revision:2,processed_revision:1} as ObservationJob;
it('does not present an old result as processed after new ingestion',()=>expect(observationHealth(true,run,job,'2026-10-28')).toBe('Atualização pendente'));
it('separates processing failure from no deviation',()=>expect(observationHealth(true,run,{...job,state:'failed'},'2026-10-28')).toBe('Falha no processamento automático'));
it('separates never evaluated, paused and previous-day data',()=>{
  expect(observationHealth(true,null,null,'2026-10-28')).toBe('Ainda não avaliado');
  expect(observationHealth(false,run,null,'2026-10-28')).toBe('Observação pausada');
  expect(observationHealth(true,run,null,'2026-10-29')).toBe('Avaliação de um dia anterior');
});
it('does not translate missing coverage or open month as absence of deviation',()=>{
  expect(observationStateLabel('incomplete_coverage')).toBe('Dados incompletos');
  expect(observationStateLabel('open_period')).toBe('Mês aberto');
  expect(observationStateLabel('no_deviation_detected')).toBe('Sem desvio detectado');
});
