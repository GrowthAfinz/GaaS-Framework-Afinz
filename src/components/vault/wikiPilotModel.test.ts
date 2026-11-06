import { describe, expect, it } from 'vitest';
import { newWork } from '../growth-learning/development/workModel';
import { canQuickComplete, completionDate, displayCompletionDate, isPilotHeading, PILOT_KEYS, pilotGroup, pilotProgress, VISA_STRATEGY_PATH } from './wikiPilotModel';

describe('Checklist do piloto', () => {
 it('requires every mandatory preparation and validation item, including missing records', () => {
   const tasks=PILOT_KEYS.map(task_key=>({...newWork('monetization'),task_key,status:'concluida' as const}));
   expect(pilotProgress(tasks)).toMatchObject({ready:true,validated:true,done:8,total:8});
   expect(pilotProgress(tasks.filter(t=>t.task_key!=='VDV-SEED-1')).ready).toBe(false);
   expect(pilotProgress(tasks.map(t=>t.task_key==='VDV-SEED-4'?{...t,status:'backlog'}:t))).toMatchObject({ready:true,validated:false});
   expect(pilotProgress(tasks.filter(t=>pilotGroup(t.task_key)!=='later')).validated).toBe(true);
 });
 it('does not infer completion from updated_at or count a cancelled prerequisite as done', () => {
   const edited = {...newWork(),status:'concluida',updated_at:'2026-11-06'};
   expect(displayCompletionDate(edited)).toBe('—');
   expect(displayCompletionDate({...newWork(),status:'concluida',details:{completed_on:'2026-11-03'}})).toBe('03/11/2026');
   expect(completionDate({...newWork(),status:'planejando',details:{completed_on:'2026-11-03'}})).toBeNull();
   expect(pilotProgress(PILOT_KEYS.map(task_key=>({...newWork(),task_key,status:task_key==='VDV-SEED-1'?'cancelada':'concluida'}))).ready).toBe(false);
 });
 it('keeps the widget scoped and requires explicit acceptance and evidence for quick completion', () => {
   expect(isPilotHeading(VISA_STRATEGY_PATH,'1-intencao-estrategica')).toBe(true);
   expect(isPilotHeading('Outra.md','1-intencao-estrategica')).toBe(false);
   expect(canQuickComplete({...newWork(),acceptance_criteria:['A','B'],completed_criteria:[0],resolution:'Evidência'})).toBe(false);
   expect(canQuickComplete({...newWork(),acceptance_criteria:['A','B'],completed_criteria:[0,1],resolution:'Evidência'})).toBe(true);
 });
});
