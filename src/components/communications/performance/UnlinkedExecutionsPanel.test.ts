import {describe,it,expect} from 'vitest';
import {sortUnlinked,groupSuggestedTemplates,type UnlinkedItem} from './UnlinkedExecutionsPanel';
const item=(id:string,uid=id):UnlinkedItem=>({row:{uid,canalLabel:'SMS',name:uid,match:{tpl:{id}},momentSuggestion:{dispatch:99,week:null}},metrics:{},facets:{},execMoment:'',pieceMoment:null,searchText:''} as unknown as UnlinkedItem);
describe('ordem e agrupamento por template',()=>{
 it('ordena numericamente pelo ID, sem concatenar o subgrupo',()=>{expect(sortUnlinked([item('b2c_car21_vibe_srsa_Dispd10'),item('b2c_car21_vibe_srsa_Dispd2'),item('b2c_car21_vibe_srsa_Dispd1_21d')],'moment',1).map(i=>i.row.match?.tpl.id)).toEqual(['b2c_car21_vibe_srsa_Dispd1_21d','b2c_car21_vibe_srsa_Dispd2','b2c_car21_vibe_srsa_Dispd10']);});
 it('reúne contextos do mesmo ID sem perder os registros',()=>{const a=item('id','a'),b=item('id','b');expect(groupSuggestedTemplates([a,b])[0].items).toEqual([a,b]);});
 it('mantém candidato ambíguo separado',()=>{const a=item('id','a'),b=item('id','b');b.row.packEvidence={ids:['other']} as typeof b.row.packEvidence;expect(groupSuggestedTemplates([a,b])).toHaveLength(2);});
});
