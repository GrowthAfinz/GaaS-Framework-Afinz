import {describe,it,expect} from 'vitest';
import {projectExecutions,type ExecutionReview} from './executionProjection';
import type {FrameworkActivity} from './communicationOrchestrator';
const a={id:'a',template_id:'t','Base Total':66} as FrameworkActivity,b={...a,id:'b',template_id:null};
const review:ExecutionReview={id:1,group_key:'g',member_ids:['a','b'],keep_id:'a',approved:true,snapshots:[a,b]};
describe('approved execution projection',()=>{
 it('only projects a current approved full pair, preserving enrichment',()=>{expect(projectExecutions([a,b],[review])).toEqual([a]);expect(projectExecutions([a,b],[])).toHaveLength(2);expect(projectExecutions([a],[review])).toEqual([a]);});
 it('invalidates changes to any source field, not merely metric columns',()=>{expect(projectExecutions([a,{...b,Produto:'new'}],[review])).toHaveLength(2);expect(projectExecutions([a,{...b,'Base Total':67}],[review])).toHaveLength(2);});
 it('honors the latest reversal regardless of fetch order',()=>{expect(projectExecutions([a,b],[{...review,id:2,approved:false},review])).toHaveLength(2);});
 it('invalidates consolidation when a third source joins the group',()=>{expect(projectExecutions([a,b,{...b,id:'c'}],[review])).toHaveLength(3);});
});
