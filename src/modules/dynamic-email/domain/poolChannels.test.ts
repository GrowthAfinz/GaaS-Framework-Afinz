import {describe,it,expect} from 'vitest';
import {recentPoolAppUse,poolChannelEligibility,simulatePoolChannelRound,type PoolChannelContact} from './poolChannels';
const contact:PoolChannelContact={id:'synthetic',group:'MODA',cell:'SEG-A',businessChannel:'B2C',commonEligible:true,email:'teste@example.invalid',phone:'5500000000000',emailBlocked:false,mobileBlocked:false,emailSuppressed:false,whatsappSuppressed:false,smsSuppressed:false,lastAppUse:'2026-11-09'};
describe('Pool channel contract',()=>{
 it('uses inclusive calendar-day app boundaries and rejects missing, invalid and future dates',()=>{
  expect(recentPoolAppUse('2026-09-10','2026-11-09')).toBe(true);
  for(const day of [null,'2026-09-09','2026-11-10','2026-02-30','invalid'])expect(recentPoolAppUse(day,'2026-11-09')).toBe(false);
 });
 it('isolates blocks and mobile app requirements without excluding eligible email',()=>{
  expect(poolChannelEligibility({...contact,lastAppUse:null},'2026-11-09')).toEqual({email:true,whatsapp:false,sms:false});
  expect(poolChannelEligibility({...contact,emailBlocked:true},'2026-11-09')).toEqual({email:false,whatsapp:true,sms:true});
  expect(poolChannelEligibility({...contact,mobileBlocked:true},'2026-11-09')).toEqual({email:true,whatsapp:false,sms:false});
  for(const cell of ['SEG-C','GEN-C'])expect(Object.values(poolChannelEligibility({...contact,cell},'2026-11-09')).some(Boolean)).toBe(false);
 });
 it('requires a policy and caps, assigns one channel, and does not use A/B or spending to choose it',()=>{
  const people=Array.from({length:100},(_,i)=>({...contact,id:'synthetic-'+i}));
  expect(simulatePoolChannelRound(people,'2026-11-09','R').status).toBe('parameters_pending');
  const policy={id:'test-only',weights:{email:1,whatsapp:1,sms:1},whatsappCap:5,smsCap:10};
  const a=simulatePoolChannelRound(people,'2026-11-09','R',policy),b=simulatePoolChannelRound(people.map(c=>({...c,cell:'SEG-B'})),'2026-11-09','R',policy);
  expect(a).toEqual(b);expect(new Set(a.assignments.map(x=>x.id)).size).toBe(a.assignments.length);
  expect(a.assignments.filter(x=>x.channel==='whatsapp').length).toBeLessThanOrEqual(5);
  expect(a.assignments.filter(x=>x.channel==='sms').length).toBeLessThanOrEqual(10);
  expect(simulatePoolChannelRound(people,'2026-11-09','R',{...policy,whatsappCap:5001}).status).toBe('parameters_pending');
 });
});
