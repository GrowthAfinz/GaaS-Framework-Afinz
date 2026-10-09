import {describe,it,expect} from 'vitest';
import {deliveryCoverage,deliveryRate} from './journeyDelivery';
const row=(base:number,rate:unknown)=>({'Base Total':base,'Taxa de Entrega':rate} as any);
describe('delivery coverage',()=>{
 it('weights rates by recorded base, including measured zero',()=>{expect(deliveryCoverage([row(100,0),row(300,1)]).value).toBe(.75);expect(deliveryRate(row(10,98))).toBe(.98);});
 it('never fills missing delivery or missing denominators with zero',()=>{expect(deliveryCoverage([row(100,null),row(100,.9)]).value).toBeNull();expect(deliveryCoverage([row(0,.9)]).value).toBeNull();expect(deliveryCoverage([]).value).toBeNull();});
});
