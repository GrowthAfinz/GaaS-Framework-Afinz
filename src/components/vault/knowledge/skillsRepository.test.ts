import { describe, it, expect, vi, afterEach } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { readSkillZip, changeSkillRepository } from './skillsRepository';
const skill = (more: Record<string, Uint8Array> = {}) => zipSync({ 'example/SKILL.md':strToU8('---\nname: example\ndescription: Testar um contrato sintético.\n---\n# Exemplo\n'), ...more });
afterEach(()=>vi.unstubAllGlobals());
describe('skill uploads',()=>{
  it('keeps supporting files and generates publication metadata',()=>{
    const result=readSkillZip(skill({'example/references/context.md':strToU8('Contexto')}),'CRM','1.0.0');
    expect(result.name).toBe('example');
    expect(result.files.map(f=>f.path)).toContain('.claude/skills/example/references/context.md');
    expect(new TextDecoder().decode(result.files.find(f=>f.path.endsWith('SKILL.md'))!.bytes)).toContain('last_validated: null');
  });
  it('rejects traversal, credential files and secrets before any write',()=>{
    expect(()=>readSkillZip(skill({'example/../escape.md':strToU8('x')}),'CRM','1.0.0')).toThrow(/caminho/);
    expect(()=>readSkillZip(skill({'example/.env':strToU8('x')}),'CRM','1.0.0')).toThrow(/permitido/);
    expect(()=>readSkillZip(skill({'example/config.py':strToU8('sb_secret_'+'a'.repeat(30))}),'CRM','1.0.0')).toThrow(/Credencial/);
    const nested=zipSync({'docProps/core.xml':strToU8('ghp_'+'b'.repeat(40))});
    expect(()=>readSkillZip(skill({'example/assets/deck.pptx':nested}),'CRM','1.0.0')).toThrow(/Credencial/);
  });
});
describe('repository mutations',()=>{
  it('publishes a ZIP as one atomic commit after uploading its files',async()=>{
    const calls:{url:string;body:any}[]=[];
    vi.stubGlobal('fetch',vi.fn(async(url:string,options:any)=>{
      calls.push({url,body:options.body?JSON.parse(options.body):null});
      const value=url.endsWith('/git/ref/heads/main')?{object:{sha:'head'}}:url.endsWith('/git/commits/head')?{tree:{sha:'base'}}:url.includes('recursive=1')?{tree:[]}:{sha:'next',html_url:'https://github.com/example/commit/next'};
      return {ok:true,json:async()=>value};
    }));
    const add=readSkillZip(skill(),'CRM','1.0.0');
    await changeSkillRepository('synthetic-test',{add},()=>{});
    const tree=calls.find(c=>c.url.endsWith('/git/trees'))!.body;
    expect(tree.base_tree).toBe('base');expect(tree.tree).toHaveLength(add.files.length);
    expect(tree.tree.every((f:any)=>f.path.startsWith('.claude/skills/example/'))).toBe(true);
    expect(calls[calls.length-1].body).toEqual({sha:'next',force:false});
  });
  it('deletes all files of one skill atomically and never forces main',async()=>{
    const calls:{url:string;body:any}[]=[];
    vi.stubGlobal('fetch',vi.fn(async(url:string,options:any)=>{
      const body=options.body?JSON.parse(options.body):null;calls.push({url,body});
      const value=url.endsWith('/git/ref/heads/main')?{object:{sha:'head'}}:url.endsWith('/git/commits/head')?{tree:{sha:'base'}}:url.includes('recursive=1')?{tree:[{path:'.claude/skills/example/SKILL.md',type:'blob'},{path:'.claude/skills/example/assets/a.pptx',type:'blob'},{path:'src/App.tsx',type:'blob'}]}:{sha:'next',html_url:'https://github.com/example/commit/next'};
      return {ok:true,json:async()=>value};
    }));
    await changeSkillRepository('synthetic-test',{remove:'example'},()=>{});
    const tree=calls.find(c=>c.url.endsWith('/git/trees'))!.body;
    expect(tree.tree).toHaveLength(2);expect(tree.tree.every((f:any)=>f.sha===null)).toBe(true);
    expect(calls[calls.length-1].body).toEqual({sha:'next',force:false});
  });
  it('does not publish when authentication is rejected',async()=>{
    const fetch=vi.fn(async()=>({ok:false,status:403}));vi.stubGlobal('fetch',fetch);
    await expect(changeSkillRepository('test',{remove:'example'},()=>{})).rejects.toThrow(/não autorizou/);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
