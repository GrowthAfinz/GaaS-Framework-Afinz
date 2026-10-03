import { describe, expect, it } from 'vitest';
import { readWikiAnalytics, matchesWikiAnalytics, wikiResultsSearch } from './wikiAnalytics';
import { EMPTY_SCOPE, ResultRow } from '../growth-learning/results/results.types';
import { cleanScope, readResultsRoute } from '../growth-learning/results/results.logic';
const row={id:'x',...EMPTY_SCOPE,domain:'crm',journey:'JOR_A',subgroup:'D-7'} as ResultRow;
describe('Authenticated result blocks inside Wiki notes',()=>{
  it('rejects executable, unknown and incompatible contracts instead of widening a scope',()=>{
    expect(readWikiAnalytics({analytics:{domain:'sql',scope:{}}})).toBeNull();
    expect(readWikiAnalytics({analytics:{domain:'crm',scope:{sql:'select *'}}})).toBeNull();
    expect(readWikiAnalytics({analytics:{domain:'media',scope:{segment:'Abandonados'}}})).toBeNull();
    expect(readWikiAnalytics({analytics:{domain:'crm',scope:{},any_of:Array(201).fill({})}})).toBeNull();
  });
  it('keeps fixed operations and exact journey variants distinct',()=>{
    const config=readWikiAnalytics({analytics:{domain:'crm',scope:{operation_id:'op-1'},any_of:[{journey:'JOR_A',subgroup:'D-7'}]}})!;
    expect(matchesWikiAnalytics(row,config)).toBe(true);
    expect(matchesWikiAnalytics({...row,subgroup:'D-21'},config)).toBe(false);
    expect(matchesWikiAnalytics({...row,journey:'JOR_B'},config)).toBe(false);
  });
  it('preserves the note on reload and in a contextual bet verification link',()=>{
    const scope=cleanScope('crm',{partner:'Serasa',stage:'Reativacao',subgroup:'D-7',operation_id:'op-1'});
    const url=wikiResultsSearch('note-1','crm','2026-09',scope,'?result_campaign=old&create=contextual-bet&wiki_q=carrinho');
    expect(new URLSearchParams(url).get('section')).toBe('vault');
    expect(new URLSearchParams(url).get('item')).toBe('note-1');
    expect(readResultsRoute(url).scope).toEqual(scope);
    expect(url).not.toContain('result_campaign');
    expect(url).not.toContain('create=');
  });
  it('preserves legacy retrospective identities and nested B2C populations',()=>{
    expect(cleanScope('crm',{})).toEqual(EMPTY_SCOPE);
    expect(cleanScope('b2c',{type:'total',stage:'Reativacao'})).toEqual({...EMPTY_SCOPE,type:'total'});
    expect(cleanScope('renta',{journey:'WELCOME',subgroup:'NAO'}).journey).toBe('WELCOME');
  });
});
