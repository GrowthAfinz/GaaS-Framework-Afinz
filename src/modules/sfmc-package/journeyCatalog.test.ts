import {describe,it,expect} from 'vitest';
import {buildCatalog,facetCounts,latestActivityPins,catalogMessageMatches,EMPTY_CATALOG_FILTERS,type CatalogFilters,type HistoryContext} from './journeyCatalog';
import type {JourneyDirectoryItem,JourneyScopeMessage,MessageMeta} from './journeyV2';
const scope={bus:['B2C','B2B2C','Plurix'],global:{}};
const ctx=(extra:Record<string,unknown>={})=>({BU:'B2C',Parceiro:'Proprietaria',Segmento:'Abandonados',Canal:'SMS',Subgrupos:'21D',Oferta:'Vibe',Promocional:'Padrão',last_activity_at:'2026-10-14T03:00:00Z',period_records:2,has_linked:true,has_unlinked:false,...extra} as unknown as HistoryContext);
const msg=(extra:Partial<JourneyScopeMessage>={})=>({channel:'SMS',observed_template_id:'b2c_car21_DispD1',activity_key:'a',activity_name:'act',occurrence_key:'o',is_optout:false,contexts:[ctx()],catalog:null,review_context:null,...extra});
const item=(name='JOR_AQS_B2C_PROPRI_ABD_TEST',version=1,messages:JourneyScopeMessage[]=[msg()])=>({id:name+version,journey_name:name,import_id:'i',reference:'r',journey_version:version,created_at:'2026-10-15T00:00:00Z',messages} as JourneyDirectoryItem);
const f=(patch:Partial<CatalogFilters>={})=>({...EMPTY_CATALOG_FILTERS,...patch});
describe('Journey catalog contracts',()=>{
 it('counts names once across versions and sorts by activity, never import date',()=>{
 const rows=buildCatalog([item('old',1,[msg({contexts:[ctx({last_activity_at:'2026-09-01'})]})]),item('recent',1),item('recent',2),item('no-history',1,[msg({contexts:[]})])],f(),scope);
 expect(rows.map(r=>r.name)).toEqual(['recent','old','no-history']);expect(rows[0].versions).toHaveLength(2);expect(rows[0].latest.journey_version).toBe(2);expect(rows[2].lastActivity).toBeNull();
 });
 it('requires channel/subgroup/offer on the same communication and historical tuple',()=>{
 const m=msg({contexts:[ctx({Oferta:'Vibe',Subgrupos:'21D'}),ctx({Oferta:'Copa',Subgrupos:'Sábado'})]});
 expect(catalogMessageMatches(m,'j',f({facets:{subgrupo:'Sábado',oferta:'Vibe'}}),scope)).toBe(false);
 expect(buildCatalog([item('j',1,[msg({channel:'WhatsApp',contexts:[ctx({Canal:'WhatsApp',Subgrupos:'21D'})]}),msg({contexts:[ctx({Subgrupos:'Sábado'})]})])],f({facets:{canal:'SMS',subgrupo:'21D'}}),scope)).toHaveLength(0);
 });
 it('facet badges count distinct journeys and allow switching shared global filters',()=>{
 const items=[item('a',1),item('a',2),item('b',1,[msg({channel:'WhatsApp',contexts:[ctx({Canal:'WhatsApp'})]})])];
 expect(facetCounts(items,'canal',f(),scope).map(o=>[o.value,o.count])).toEqual([['SMS',1],['WhatsApp',1]]);
 expect(facetCounts(items,'canal',f({facets:{canal:'SMS'}}),{...scope,global:{canais:['SMS']}})).toHaveLength(2);
 });
 it('keeps per-public recency for a shared journey and canonical Institutional aliases',()=>{
 const j=item('shared',1,[msg(),msg({activity_key:'b',contexts:[ctx({Parceiro:'Serasa',last_activity_at:'2026-10-10'})]})]);
 const row=buildCatalog([j],f(),scope)[0];expect(row.groups).toHaveLength(2);
 expect(Object.entries(row.groupDates).find(([k])=>k.includes('Institucional'))?.[1]).toBe('2026-10-14T03:00:00Z');
 expect(Object.entries(row.groupDates).find(([k])=>k.includes('Serasa'))?.[1]).toBe('2026-10-10');
 });
 it('does not borrow execution dates from a different historical public',()=>{
 const j=item('reviewed',1,[msg({review_context:{partner:'Serasa'}})]);
 const rows=buildCatalog([j],f({context:JSON.stringify(['B2C','Serasa'])}),scope);expect(rows).toHaveLength(1);expect(rows[0].lastActivity).toBeNull();
 });
 it('uses period summaries for active/link filters without losing all-time recency',()=>{
 const items=[item('j',1,[msg({contexts:[ctx({period_records:0,has_linked:false,has_unlinked:false})]})])];
 expect(buildCatalog(items,f(),scope)[0].lastActivity).not.toBeNull();expect(buildCatalog(items,f({onlyActive:true}),scope)).toHaveLength(0);expect(buildCatalog(items,f({status:'linked'}),scope)).toHaveLength(0);
 });
 it('pins tied latest non-operational messages but refuses ambiguous occurrence matches',()=>{
 const j=item('j',1,[msg(),msg({activity_key:'b',activity_name:'other'})]);
 const messages=j.messages.map(m=>({...m,journey_name:'j'})) as MessageMeta[];
 expect(Object.keys(latestActivityPins(j,messages,f(),scope))).toEqual(['a','b']);
 expect(Object.keys(latestActivityPins(j,[...messages,{...messages[0],activity_key:'duplicate'}],f(),scope))).toEqual(['b']);
 expect(latestActivityPins(item('j',1,[msg({is_optout:true})]),messages,f(),scope)).toEqual({});
 });
 it('selects the latest compatible version and keeps missing metadata accessible',()=>{
 const items=[item('j',2,[msg({channel:'WhatsApp',contexts:[ctx({Canal:'WhatsApp'})]})]),item('j',1)];
 expect(buildCatalog(items,f({facets:{canal:'SMS'}}),scope)[0].latest.journey_version).toBe(1);
 expect(buildCatalog([item('unknown',1,[])],f(),scope)).toHaveLength(1);expect(buildCatalog(items,f(),{bus:[],global:{}})).toHaveLength(0);
 });
});
