import {describe,it,expect} from 'vitest';
import {contextKey,contextLabel,messageFacets,matchesContext,fitViewport,relatedPath,type MessageMeta} from './journeyV2';
import {layoutJourney} from './journeyFlow';
import type {JourneyGraph} from './types';
const meta={snapshot_id:'s',occurrence_key:'o',activity_key:'a',activity_name:'activity',channel:'WhatsApp',observed_template_id:'b2c_car21_vibe_srsa_Dispd1',contexts:[{BU:'B2C',Parceiro:'Serasa',Segmento:'Abandonados',Subgrupos:'D-21 A D>7',Canal:'WhatsApp',Oferta:'Vibe',Promocional:'Padrão'}],catalog:null,review_context:null} as unknown as MessageMeta;
const graph={entry:{},nodes:[{key:'a',name:'a',type:'EMAILV2',configuration:{},outcomes:[{key:'out',label:'Sim',next:'b'}]},{key:'b',name:'b',type:'SMSSYNC',configuration:{},outcomes:[]}]} as unknown as JourneyGraph;
describe('Flow V2 contracts',()=>{
 it('mantém parceiro/subgrupo da fonte e não transforma 21d em disparo 121',()=>{const f=messageFacets(meta);expect(f.parceiro).toEqual(['Serasa']);expect(f.subgrupo).toEqual(['D-21 A D>7']);expect(f.momento.join(' ')).not.toContain('121');});
 it('admite vários contextos sem impor uma classe à jornada inteira',()=>{const f=messageFacets({...meta,contexts:[...meta.contexts,{...meta.contexts[0],Parceiro:'Proprietária'}]});expect(contextKey(f)).toHaveLength(2);const key=contextKey(f)[0];expect(contextLabel(key)).toContain('B2C');expect(matchesContext(meta,JSON.stringify(['B2C','Bem Barato']),'Abandonados')).toBe(false);});
 it('enquadra largura e altura e preserva topologia no destaque',()=>{const l=layoutJourney(graph);const view=fitViewport(l,800,300,false);expect(view.scale).toBeLessThan(1);expect(view.x).toBeGreaterThanOrEqual(0);expect(view.y).toBeGreaterThanOrEqual(0);expect(relatedPath(l,'b').has('a')).toBe(true);expect(l.nodes).toHaveLength(3);});
});
