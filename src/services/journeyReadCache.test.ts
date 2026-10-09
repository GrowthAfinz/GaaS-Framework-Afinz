import {describe,it,expect,vi} from 'vitest';
import {JourneyReadCache} from './journeyReadCache';
describe('Cache de leitura privado',()=>{
 it('compartilha pedidos simultâneos e limpa falhas para permitir recuperação',async()=>{const c=new JourneyReadCache();const load=vi.fn(async()=>({value:1}));await Promise.all([c.read('u:graph',1000,load),c.read('u:graph',1000,load)]);expect(load).toHaveBeenCalledTimes(1);await expect(c.read('u:bad',1000,async()=>{throw Error('offline')})).rejects.toThrow('offline');expect(await c.read('u:bad',1000,async()=>2)).toBe(2);});
 it('respeita isolamento de key, limpeza e orçamento de bytes',async()=>{const c=new JourneyReadCache(80,2),load=vi.fn(async()=>('x'.repeat(100)));await c.read('u1:html',1000,load);await c.read('u1:html',1000,load);expect(load).toHaveBeenCalledTimes(2);const l=vi.fn(async()=>1);await c.read('u1:key',1000,l);await c.read('u2:key',1000,l);expect(l).toHaveBeenCalledTimes(2);c.clear();await c.read('u1:key',1000,l);expect(l).toHaveBeenCalledTimes(3);});
});
