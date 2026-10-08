import {describe,it,expect} from 'vitest';
import {versionsForJourney,findJourneyMessages} from './journeyNavigation';
import type {PackageMessage} from './types';
describe('Navegação do fluxo',()=>{
 it('escolhe versão maior sem alterar o array nem misturar jornadas',()=>{const rows=[{id:'a',journey_name:'J',journey_version:1,created_at:'2026-10-08'},{id:'b',journey_name:'J',journey_version:4,created_at:'2026-10-07'},{id:'c',journey_name:'Outro',journey_version:5,created_at:'2026-10-09'}];expect(versionsForJourney(rows,'J').map(r=>r.id)).toEqual(['b','a']);expect(rows[0].id).toBe('a');});
 it('localiza comunicação por atividade, peça, ID e canal sem alterar identidade',()=>{const m={activity_name:'activity_1',asset_name:'Peça Vibe',utm:{af_sub3:'B2c_Dispd1'},content:{channel:'SMS'}} as unknown as PackageMessage;for(const q of ['ACTIVITY_1','vibe','b2c_dispd1','sms'])expect(findJourneyMessages([m],q)).toEqual([m]);expect(findJourneyMessages([m],'copa')).toEqual([]);});
});
