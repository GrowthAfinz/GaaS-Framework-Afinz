import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({from:vi.fn(),sync:vi.fn(),pages:[] as unknown[],running:[0,0],ranges:[] as number[],fields:[] as string[]}));
vi.mock('../../../services/supabaseClient',()=>({supabase:{from:mocks.from}}));
vi.mock('../vaultService',()=>({latestVaultSync:mocks.sync}));
import { fetchWikiGraphLinks } from './wikiGraphService';
beforeEach(()=>{
 mocks.pages=[];mocks.running=[0,0];mocks.ranges=[];mocks.fields=[];mocks.sync.mockReset().mockResolvedValue({id:'stable'});
 mocks.from.mockReset().mockImplementation(table=>{
  const query={select:vi.fn((fields:string)=>{mocks.fields.push(fields);return query;}),not:vi.fn(()=>query),order:vi.fn(()=>query),eq:vi.fn(()=>query),
   range:vi.fn((start:number)=>{mocks.ranges.push(start);return Promise.resolve(mocks.pages.shift());}),
   then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({count:table==='gaas_vault_sync_runs'?mocks.running.shift():0,error:null}).then(resolve)};
  return query;
 });
});
describe('Wiki graph metadata loading',()=>{
 it('reads beyond a single page, including when the server caps page size',async()=>{
  mocks.pages=[{data:[{source_note_id:'a',target_note_id:'b'},{source_note_id:'b',target_note_id:'c'}],count:3,error:null},{data:[{source_note_id:'c',target_note_id:'d'}],error:null}];
  expect(await fetchWikiGraphLinks()).toHaveLength(3);expect(mocks.ranges).toEqual([0,2]);expect(mocks.fields).not.toContain('content_markdown');
 });
 it('rejects truncated responses rather than showing a partial map as complete',async()=>{
  mocks.pages=[{data:[{source_note_id:'a',target_note_id:'b'}],count:3,error:null},{data:[],error:null}];
  await expect(fetchWikiGraphLinks()).rejects.toThrow('vínculos mudaram');
 });
 it('blocks loading during sync and detects a sync completed during pagination',async()=>{
  mocks.running=[1];await expect(fetchWikiGraphLinks()).rejects.toThrow('sincronizada');expect(mocks.ranges).toEqual([]);
  mocks.running=[0,0];mocks.pages=[{data:[],count:0,error:null}];mocks.sync.mockResolvedValueOnce({id:'before'}).mockResolvedValueOnce({id:'after'});
  await expect(fetchWikiGraphLinks()).rejects.toThrow('vínculos mudaram');
 });
});
