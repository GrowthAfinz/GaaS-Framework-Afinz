import {describe,it,expect} from 'vitest';
import {contextKey,messageContextKeys,canonicalAudience,executionMatchesContext,needsClassification,packClassification,ALL_AUDIENCES,PENDING_FRONT,PENDING_SEGMENT,contextLabel,messageFacets,matchesContext,fitViewport,relatedPath,type MessageMeta} from './journeyV2';
import {layoutJourney} from './journeyFlow';
import type {JourneyGraph} from './types';
const meta={snapshot_id:'s',occurrence_key:'o',activity_key:'a',activity_name:'activity',channel:'WhatsApp',observed_template_id:'b2c_car21_vibe_srsa_Dispd1',contexts:[{BU:'B2C',Parceiro:'Serasa',Segmento:'Abandonados',Subgrupos:'D-21 A D>7',Canal:'WhatsApp',Oferta:'Vibe',Promocional:'Padrão'}],catalog:null,review_context:null} as unknown as MessageMeta;
const graph={entry:{},nodes:[{key:'a',name:'a',type:'EMAILV2',configuration:{},outcomes:[{key:'out',label:'Sim',next:'b'}]},{key:'b',name:'b',type:'SMSSYNC',configuration:{},outcomes:[]}]} as unknown as JourneyGraph;
describe('Flow V2 contracts',()=>{
 it('mantém parceiro/subgrupo da fonte e não transforma 21d em disparo 121',()=>{const f=messageFacets(meta);expect(f.parceiro).toEqual(['Serasa']);expect(f.subgrupo).toEqual(['D-21 A D>7']);expect(f.momento.join(' ')).not.toContain('121');});
 it('admite vários contextos sem impor uma classe à jornada inteira',()=>{const f=messageFacets({...meta,contexts:[...meta.contexts,{...meta.contexts[0],Parceiro:'Proprietária'}]});expect(contextKey(f)).toHaveLength(2);const key=contextKey(f)[0];expect(contextLabel(key)).toContain('B2C');expect(matchesContext(meta,JSON.stringify(['B2C','Bem Barato']),'Abandonados')).toBe(false);});
 it('enquadra largura e altura e preserva topologia no destaque',()=>{const l=layoutJourney(graph);const view=fitViewport(l,800,300,false);expect(view.scale).toBeLessThan(1);expect(view.x).toBeGreaterThanOrEqual(0);expect(view.y).toBeGreaterThanOrEqual(0);expect(relatedPath(l,'b').has('a')).toBe(true);expect(l.nodes).toHaveLength(3);});
});

const key=(front:string,partner:string)=>JSON.stringify([front,partner]);
describe('Journey business classification',()=>{
 it('unifica Proprietaria e Institucional sem alterar a origem registrada',()=>{
 const m={...meta,observed_template_id:null,contexts:[{...meta.contexts[0],Parceiro:'Proprietaria'},{...meta.contexts[0],Parceiro:'Institucional'}]};
 expect(messageFacets(m).parceiro).toEqual(['Institucional']);expect(messageContextKeys(m)).toEqual([key('B2C','Institucional')]);expect(m.contexts[0].Parceiro).toBe('Proprietaria');
 expect(canonicalAudience('Proprietária')).toBe('Institucional');
 expect(executionMatchesContext(m.contexts[0],key('B2C','Institucional'),'Abandonados')).toBe(true);
 });
 it('Plurix ignora parceiro na navegação e nos resultados',()=>{
 const m={...meta,contexts:[{...meta.contexts[0],BU:'Plurix',Parceiro:'Amigão'},{...meta.contexts[0],BU:'Plurix',Parceiro:'Boa'}]};
 expect(messageContextKeys(m)).toEqual([key('Plurix','N/A')]);expect(needsClassification(m)).toBe(false);
 expect(matchesContext(m,key('Plurix','N/A'),'Abandonados')).toBe(true);
 expect(executionMatchesContext(m.contexts[1],key('Plurix','N/A'),'Abandonados')).toBe(true);
 });
 it('mantém público revisado da mensagem separado da execução histórica',()=>{
 const m={...meta,review_context:{partner:'Serasa'},contexts:[{...meta.contexts[0],Parceiro:'Proprietaria'}]};
 expect(matchesContext(m,key('B2C','Serasa'),'Abandonados')).toBe(true);
 expect(matchesContext(m,key('B2C','Institucional'),'Abandonados')).toBe(false);
 expect(executionMatchesContext(m.contexts[0],key('B2C','Serasa'),'Abandonados')).toBe(false);
 expect(executionMatchesContext(m.contexts[0],key('B2C','Institucional'),'Abandonados')).toBe(true);
 });
 it('não inventa combinações de frente e parceiro entre registros',()=>{
 const m={...meta,contexts:[meta.contexts[0],{...meta.contexts[0],BU:'B2B2C',Parceiro:'Bem_Barato'}]};
 expect(messageContextKeys(m)).toEqual([key('B2C','Serasa'),key('B2B2C','Bem Barato')]);
 expect(matchesContext(m,key('B2C','Bem Barato'),'')).toBe(false);
 expect(matchesContext(m,key('B2C',ALL_AUDIENCES),'Abandonados')).toBe(true);
 });
 it('usa o nome do pack para navegação quando falta histórico e respeita Serasa explícita',()=>{
 const m={...meta,contexts:[],observed_template_id:null,journey_name:'JOR_AQS_B2C_PROPRI_ABD_CARRINHO21D_PADRAO_21DIAS_SET26'};
 expect(messageFacets(m).frente).toEqual(['B2C']);expect(messageFacets(m).parceiro).toEqual(['Institucional']);expect(messageFacets(m).segmento).toEqual(['Abandonados']);
 expect(messageFacets({...m,review_context:{partner:'Serasa'}}).parceiro).toEqual(['Serasa']);
 expect(packClassification('JOR_AQS_BB_NA_ANC_MEIO_DE_FUNIL_PAD_VIBE_SET26').front).toBe('B2B2C');
 });
 it('mantém pendentes acessíveis sem chamar N/A de Institucional',()=>{
 const m={...meta,contexts:[],observed_template_id:null,journey_name:'UNKNOWN'};
 expect(needsClassification(m)).toBe(true);expect(matchesContext(m,key(PENDING_FRONT,ALL_AUDIENCES),PENDING_SEGMENT)).toBe(true);
 const b2c={...m,journey_name:'JOR_AQS_B2C_NA_NGD_MEIO_DE_FUNIL_PAD_VIBE_SET26'};
 expect(messageFacets(b2c).frente).toEqual(['B2C']);expect(messageFacets(b2c).parceiro).toEqual([]);expect(needsClassification(b2c)).toBe(true);
 expect(matchesContext(b2c,key('B2C',ALL_AUDIENCES),'Negados')).toBe(true);
 expect(matchesContext(b2c,key('B2C','Institucional'),'Negados')).toBe(false);
 });
});
